'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { getUserAvailability } from '@/lib/supabase/userEvents';
import { 
  getCustomFormResponseForAssignment, 
  submitCustomFormResponse,
  getCustomFormFields,
  getRolesForContext,
  getCastMembersForContext,
  getCustomFormAssignmentsForTarget
} from '@/lib/supabase/customForms';
import { supabase } from '@/lib/supabase/client';
import { X, FileText, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import FormInput from '@/components/ui/forms/FormInput';
import FormTextarea from '@/components/ui/forms/FormTextarea';
import FormSelect from '@/components/ui/forms/FormSelect';
import MultiSelectDropdown from '@/components/ui/forms/MultiSelectDropdown';

interface FormAssignmentWithStatus {
  assignment_id: string | null;
  form_id: string;
  required: boolean;
  custom_forms: {
    form_id: string;
    name: string;
    description: string | null;
  };
  isCompleted: boolean;
  fields?: any[];
  responses?: Record<string, any>;
}

interface RequiredFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditionId: string;
  auditionTitle: string;
  onAllFormsCompleted: () => void;
}

export default function RequiredFormsModal({
  isOpen,
  onClose,
  auditionId,
  auditionTitle,
  onAllFormsCompleted,
}: RequiredFormsModalProps) {
  const [forms, setForms] = useState<FormAssignmentWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [formResponses, setFormResponses] = useState<Record<string, Record<string, any>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [castOptions, setCastOptions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadRequiredForms();
    }
  }, [isOpen, auditionId]);

  const loadRequiredForms = async () => {
    setLoading(true);
    setError(null);

    try {
      // First, get the audition to check what forms are required
      const { data: audition, error: auditionError } = await supabase
        .from('auditions')
        .select('required_signup_forms, required_callback_forms')
        .eq('audition_id', auditionId)
        .single();

      if (auditionError || !audition) {
        setError('Failed to load audition information.');
        return;
      }

      // Only show signup forms during audition signup, not callback forms
      const requiredFormIds = audition.required_signup_forms || [];

      if (requiredFormIds.length === 0) {
        setForms([]);
        return;
      }

      // Get form details for required forms
      const { data: forms, error: formsError } = await supabase
        .from('custom_forms')
        .select('form_id, name, description, status')
        .in('form_id', requiredFormIds);

      if (formsError) {
        setError('Failed to load form information.');
        return;
      }

      // Get existing assignments for this user and audition
      const assignments = await getCustomFormAssignmentsForTarget('audition', auditionId);
      const userAssignments = assignments.filter(
        (assignment: any) => assignment.required && assignment.filled_out_by === 'assignee'
      );

      // Load dynamic field options if needed
      const allFields = await Promise.all(
        forms.map(form => getCustomFormFields(form.form_id))
      );
      const flatFields = allFields.flat();
      
      const hasRoleFields = flatFields.some(field => 
        field.field_type === 'role_list_single_select' || field.field_type === 'role_list_multi_select'
      );
      const hasCastFields = flatFields.some(field => 
        field.field_type === 'cast_members_single_select' || field.field_type === 'cast_members_multi_select'
      );

      if (hasRoleFields) {
        const { data: roles } = await getRolesForContext(auditionId);
        setRoleOptions(roles || []);
      }

      if (hasCastFields) {
        // Cast fields would need production context, but for audition forms we'll leave empty
        setCastOptions([]);
      }

      // Check completion status and load fields for each required form
      const formsWithStatus = await Promise.all(
        (forms || []).map(async (form: any) => {
          // Find existing assignment for this form
          const assignment = userAssignments.find((a: any) => a.form_id === form.form_id);
          
          let isCompleted = false;
          let assignmentId = null;
          let existingResponses = {};

          if (assignment && assignment.assignment_id) {
            assignmentId = assignment.assignment_id;
            const response = await getCustomFormResponseForAssignment(assignment.assignment_id);
            isCompleted = !!response;
            if (response) {
              existingResponses = (response as any).response_data || {};
            }
          }

          // Load form fields
          const fields = await getCustomFormFields(form.form_id);

          return {
            assignment_id: assignmentId,
            form_id: form.form_id,
            required: true,
            custom_forms: form,
            isCompleted,
            fields: fields || [],
            responses: existingResponses,
          };
        })
      );

      setForms(formsWithStatus);

      // Initialize form responses with existing data
      const initialResponses: Record<string, Record<string, any>> = {};
      formsWithStatus.forEach(form => {
        if (form.responses && Object.keys(form.responses).length > 0) {
          initialResponses[form.form_id] = form.responses;
        }
      });
      setFormResponses(initialResponses);

      // If all forms are completed, automatically trigger the callback
      const allCompleted = formsWithStatus.length > 0 && formsWithStatus.every(form => form.isCompleted);
      if (allCompleted) {
        onAllFormsCompleted();
      }
    } catch (err) {
      console.error('Error loading required forms:', err);
      setError('Failed to load required forms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (formId: string, fieldKey: string, value: any) => {
    console.log('🔄 Field change:', { formId, fieldKey, value });
    setFormResponses(prev => {
      const updated = {
        ...prev,
        [formId]: {
          ...prev[formId],
          [fieldKey]: value
        }
      };
      console.log('📊 Updated form responses:', updated);
      return updated;
    });
  };

  const handleSubmitCurrentForm = async () => {
    const currentForm = forms[currentFormIndex];
    if (!currentForm) return;

    console.log('🚀 Starting form submission for:', currentForm.custom_forms.name);
    console.log('📝 Current form data:', currentForm);
    console.log('📊 Form responses:', formResponses[currentForm.form_id]);

    setSubmitting(true);
    setError(null);

    try {
      // Create assignment if it doesn't exist
      let assignmentId = currentForm.assignment_id;
      console.log('🔍 Current assignment ID:', assignmentId);
      
      if (!assignmentId) {
        console.log('📋 Creating new assignment...');
        const user = await supabase.auth.getUser();
        console.log('👤 Current user:', user.data.user?.id);
        
        const assignmentData = {
          form_id: currentForm.form_id,
          target_type: 'audition',
          target_id: auditionId,
          required: true,
          filled_out_by: 'assignee',
          created_by: user.data.user?.id
        };
        console.log('📋 Assignment data to insert:', assignmentData);

        const { data: assignment, error: assignmentError } = await supabase
          .from('custom_form_assignments')
          .insert(assignmentData)
          .select()
          .single();

        console.log('📋 Assignment creation result:', { assignment, assignmentError });

        if (assignmentError || !assignment) {
          console.error('❌ Assignment creation failed:', assignmentError);
          setError('Failed to create form assignment. Please try again.');
          return;
        }
        assignmentId = assignment.assignment_id;
        console.log('✅ Assignment created with ID:', assignmentId);
      }

      // Submit the form response
      const responseData = formResponses[currentForm.form_id] || {};
      console.log('📤 Submitting response data:', responseData);
      console.log('🔗 Using assignment ID:', assignmentId);
      
      if (!assignmentId) {
        setError('Failed to get assignment ID. Please try again.');
        return;
      }
      
      const { error: submitError } = await submitCustomFormResponse({
        assignmentId: assignmentId,
        answers: responseData
      });
      console.log('📤 Response submission result:', { submitError });

      if (submitError) {
        setError('Failed to submit form. Please try again.');
        return;
      }

      // Mark form as completed
      const updatedForms = [...forms];
      updatedForms[currentFormIndex] = {
        ...updatedForms[currentFormIndex],
        isCompleted: true,
        assignment_id: assignmentId
      };
      setForms(updatedForms);

      // Move to next form or complete
      const nextIncompleteIndex = updatedForms.findIndex((form, index) => 
        index > currentFormIndex && !form.isCompleted
      );

      if (nextIncompleteIndex !== -1) {
        setCurrentFormIndex(nextIncompleteIndex);
      } else {
        // All forms completed
        const allCompleted = updatedForms.every(form => form.isCompleted);
        if (allCompleted) {
          onAllFormsCompleted();
        }
      }
    } catch (err) {
      setError('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrevForm = () => {
    if (currentFormIndex > 0) {
      setCurrentFormIndex(currentFormIndex - 1);
    }
  };

  const handleNextForm = () => {
    if (currentFormIndex < forms.length - 1) {
      setCurrentFormIndex(currentFormIndex + 1);
    }
  };

  const renderFormField = (field: any, formId: string) => {
    const value = formResponses[formId]?.[field.field_key] || forms[currentFormIndex]?.responses?.[field.field_key] || '';

    switch (field.field_type) {
      case 'text':
        return (
          <FormInput
            key={field.field_id}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(formId, field.field_key, e.target.value)}
            required={field.required}
            placeholder={field.placeholder || field.help_text || ''}
          />
        );
      case 'textarea':
        return (
          <FormTextarea
            key={field.field_id}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(formId, field.field_key, e.target.value)}
            required={field.required}
            placeholder={field.placeholder || field.help_text || ''}
            rows={4}
          />
        );
      case 'integer':
        return (
          <FormInput
            key={field.field_id}
            label={field.label}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(formId, field.field_key, parseInt(e.target.value) || '')}
            required={field.required}
            placeholder={field.help_text || 'Enter a whole number'}
            step="1"
          />
        );
      case 'decimal':
        return (
          <FormInput
            key={field.field_id}
            label={field.label}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(formId, field.field_key, parseFloat(e.target.value) || '')}
            required={field.required}
            placeholder={field.help_text || 'Enter a decimal number'}
            step="0.01"
          />
        );
      case 'boolean':
        const boolValue = value === true || value === 'true';
        return (
          <div key={field.field_id}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={boolValue}
                onChange={(e) => handleFieldChange(formId, field.field_key, e.target.checked)}
                className="w-4 h-4 rounded border-2 border-neu-border bg-neu-surface checked:bg-neu-accent-primary checked:border-neu-accent-primary focus:outline-none focus:ring-2 focus:ring-neu-accent-primary/50"
              />
              <span className="text-neu-text-primary font-medium">
                {field.label}
                {field.required && <span className="text-neu-accent-danger ml-1">*</span>}
              </span>
            </label>
            {field.help_text && (
              <p className="text-xs text-neu-text-primary/60 mt-1 ml-7">{field.help_text}</p>
            )}
          </div>
        );
      case 'date':
        return (
          <FormInput
            key={field.field_id}
            label={field.label}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(formId, field.field_key, e.target.value)}
            required={field.required}
          />
        );
      case 'time':
        return (
          <FormInput
            key={field.field_id}
            label={field.label}
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(formId, field.field_key, e.target.value)}
            required={field.required}
          />
        );
      case 'datetime':
        return (
          <FormInput
            key={field.field_id}
            label={field.label}
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(formId, field.field_key, e.target.value)}
            required={field.required}
          />
        );
      case 'single_select':
      case 'select': // Support both naming conventions
        let options = [];
        
        if (field.options) {
          if (Array.isArray(field.options)) {
            // Already an array
            options = field.options;
          } else if (typeof field.options === 'string') {
            try {
              // Try parsing as JSON first
              const parsed = JSON.parse(field.options);
              options = Array.isArray(parsed) ? parsed : [];
            } catch {
              // If JSON parsing fails, treat as comma-separated string
              options = field.options.split(',').map((opt: string) => opt.trim());
            }
          }
        }
        return (
          <FormSelect
            key={field.field_id}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(formId, field.field_key, e.target.value)}
            required={field.required}
          >
            <option value="">Select an option...</option>
            {options.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </FormSelect>
        );
      case 'multi_select':
      case 'multiselect': // Support both naming conventions
        let multiselectOptions = [];
        
        if (field.options) {
          if (Array.isArray(field.options)) {
            // Already an array
            multiselectOptions = field.options;
          } else if (typeof field.options === 'string') {
            try {
              // Try parsing as JSON first
              const parsed = JSON.parse(field.options);
              multiselectOptions = Array.isArray(parsed) ? parsed : [];
            } catch {
              // If JSON parsing fails, treat as comma-separated string
              multiselectOptions = field.options.split(',').map((opt: string) => opt.trim());
            }
          }
        }
        
        const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
        
        return (
          <MultiSelectDropdown
            key={field.field_id}
            label={
              <span>
                {field.label}
                {field.required && <span className="text-neu-accent-danger ml-1">*</span>}
              </span>
            }
            options={multiselectOptions}
            selectedValues={selectedValues}
            onChange={(values) => handleFieldChange(formId, field.field_key, values)}
            helperText={field.help_text}
            placeholder="Select options..."
          />
        );
      case 'color':
        return (
          <div key={field.field_id}>
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              {field.label}
              {field.required && <span className="text-neu-accent-danger ml-1">*</span>}
            </label>
            {field.help_text && (
              <p className="text-xs text-neu-text-primary/60 mb-2">{field.help_text}</p>
            )}
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => handleFieldChange(formId, field.field_key, e.target.value)}
                className="w-12 h-10 rounded border-2 border-neu-border bg-neu-surface focus:outline-none focus:ring-2 focus:ring-neu-accent-primary/50"
              />
              <FormInput
                value={value || '#000000'}
                onChange={(e) => handleFieldChange(formId, field.field_key, e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
        );
      case 'role_list_single_select':
        return (
          <FormSelect
            key={field.field_id}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(formId, field.field_key, e.target.value)}
            required={field.required}
          >
            <option value="">Select a role...</option>
            {roleOptions.map((role: string) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </FormSelect>
        );
      case 'role_list_multi_select':
        const selectedRoles = Array.isArray(value) ? value : (value ? [value] : []);
        return (
          <MultiSelectDropdown
            key={field.field_id}
            label={
              <span>
                {field.label}
                {field.required && <span className="text-neu-accent-danger ml-1">*</span>}
              </span>
            }
            options={roleOptions}
            selectedValues={selectedRoles}
            onChange={(values) => handleFieldChange(formId, field.field_key, values)}
            helperText={field.help_text}
            placeholder="Select roles..."
          />
        );
      case 'cast_members_single_select':
        return (
          <FormSelect
            key={field.field_id}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(formId, field.field_key, e.target.value)}
            required={field.required}
          >
            <option value="">Select a cast member...</option>
            {castOptions.map((member: string) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </FormSelect>
        );
      case 'cast_members_multi_select':
        const selectedCast = Array.isArray(value) ? value : (value ? [value] : []);
        return (
          <MultiSelectDropdown
            key={field.field_id}
            label={
              <span>
                {field.label}
                {field.required && <span className="text-neu-accent-danger ml-1">*</span>}
              </span>
            }
            options={castOptions}
            selectedValues={selectedCast}
            onChange={(values) => handleFieldChange(formId, field.field_key, values)}
            helperText={field.help_text}
            placeholder="Select cast members..."
          />
        );
      default:
        // Fallback for unknown field types
        return (
          <div key={field.field_id} className="neu-card-raised p-4 rounded-lg border-l-4 border-neu-accent-warning">
            <div className="text-neu-text-primary font-medium">{field.label}</div>
            <div className="text-sm text-neu-accent-warning mt-1">
              Unsupported field type: {field.field_type}
            </div>
            {field.help_text && (
              <div className="text-xs text-neu-text-primary/60 mt-1">{field.help_text}</div>
            )}
          </div>
        );
    }
  };

  const incompleteForms = forms.filter(form => !form.isCompleted);
  const completedForms = forms.filter(form => form.isCompleted);
  const allFormsCompleted = forms.length > 0 && incompleteForms.length === 0;

  if (!isOpen) return null;

  const currentForm = forms[currentFormIndex];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="neu-modal neu-modal-xl text-left max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title as="h2" className="text-xl font-semibold text-neu-text-primary">
                      {currentForm ? currentForm.custom_forms.name : 'Required Forms'}
                    </Dialog.Title>
                    <p className="text-sm text-neu-text-primary/70 mt-1">
                      {forms.length > 1 
                        ? `Form ${currentFormIndex + 1} of ${forms.length} for ${auditionTitle}`
                        : `Complete this form before signing up for ${auditionTitle}`
                      }
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={submitting}
                    className="neu-icon-btn-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

        {/* Progress Bar for Multiple Forms */}
        {forms.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neu-text-primary">Progress</span>
              <span className="text-sm text-neu-text-primary/70">
                {completedForms.length} of {forms.length} completed
              </span>
            </div>
            <div className="w-full bg-neu-border rounded-full h-2">
              <div 
                className="bg-neu-accent-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedForms.length / forms.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="text-neu-text-primary/70">Loading required forms...</div>
          </div>
        ) : error ? (
          <div className="neu-card-raised p-4 rounded-xl text-neu-accent-danger mb-6">
            {error}
            <button
              onClick={() => loadRequiredForms()}
              className="neu-button-secondary mt-3"
            >
              Try Again
            </button>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-neu-text-primary/50 mx-auto mb-3" />
            <p className="text-neu-text-primary/70">No required forms found for this audition.</p>
            <button
              onClick={onAllFormsCompleted}
              className="neu-button-primary mt-4"
            >
              Continue to Sign Up
            </button>
          </div>
        ) : allFormsCompleted ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-neu-accent-success mx-auto mb-3" />
            <p className="text-neu-text-primary mb-4">All forms completed successfully!</p>
            <button
              onClick={onAllFormsCompleted}
              className="neu-button-primary"
            >
              Continue to Sign Up
            </button>
          </div>
        ) : currentForm ? (
          <div className="space-y-6">
            {/* Form Description */}
            {currentForm.custom_forms.description && (
              <div className="neu-card-inset p-4 rounded-lg">
                <p className="text-neu-text-primary/80">{currentForm.custom_forms.description}</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {currentForm.fields?.map((field: any) => (
                <div key={field.field_id}>
                  {renderFormField(field, currentForm.form_id)}
                </div>
              ))}
            </div>

            {/* Navigation and Submit */}
            <div className="flex items-center justify-between pt-6 border-t border-neu-border">
              <div className="flex items-center gap-3">
                {forms.length > 1 && currentFormIndex > 0 && (
                  <button
                    onClick={handlePrevForm}
                    disabled={submitting}
                    className="neu-button-secondary flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {forms.length > 1 && currentFormIndex < forms.length - 1 && !currentForm.isCompleted && (
                  <button
                    onClick={handleNextForm}
                    disabled={submitting}
                    className="neu-button-secondary flex items-center gap-2"
                  >
                    Skip for Now
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={handleSubmitCurrentForm}
                  disabled={submitting}
                  className="neu-button-primary flex items-center gap-2"
                >
                  {submitting ? 'Submitting...' : currentForm.isCompleted ? 'Update Form' : 'Submit Form'}
                  <CheckCircle className="w-4 h-4" />
                </button>
                {currentForm.isCompleted && (
                  <div className="flex items-center gap-2 text-neu-accent-success text-xs">
                    <CheckCircle className="w-3 h-3" />
                    <span>Previously completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
