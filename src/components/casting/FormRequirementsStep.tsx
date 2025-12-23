'use client';

import { useState, useEffect } from 'react';
import { getCustomForms } from '@/lib/supabase/customForms';
import FormSelect from '@/components/ui/forms/FormSelect';
import WizardNavigation from '@/components/ui/navigation/WizardNavigation';
import { X } from 'lucide-react';

interface FormRequirement {
  formId: string;
  formName: string;
}

interface FormRequirementsData {
  requiredSignupForms: string[];
  requiredCallbackForms: string[];
}

interface FormRequirementsStepProps {
  requirements: FormRequirementsData;
  onUpdate: (requirements: FormRequirementsData) => void;
  onNext: (requirements: FormRequirementsData) => void;
  onBack: () => void;
}

export default function FormRequirementsStep({
  requirements,
  onUpdate,
  onNext,
  onBack,
}: FormRequirementsStepProps) {
  const [localRequirements, setLocalRequirements] = useState<FormRequirementsData>(requirements);
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const forms = await getCustomForms();
      // Only show published forms
      const publishedForms = forms.filter(form => form.status === 'published');
      setAvailableForms(publishedForms);
    } catch (err) {
      setError('Failed to load forms. Please try again.');
      console.error('Error loading forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSignupForm = (formId: string) => {
    if (!formId || localRequirements.requiredSignupForms.includes(formId)) return;
    
    const updated = {
      ...localRequirements,
      requiredSignupForms: [...localRequirements.requiredSignupForms, formId],
    };
    setLocalRequirements(updated);
    onUpdate(updated);
  };

  const handleRemoveSignupForm = (formId: string) => {
    const updated = {
      ...localRequirements,
      requiredSignupForms: localRequirements.requiredSignupForms.filter(id => id !== formId),
    };
    setLocalRequirements(updated);
    onUpdate(updated);
  };

  const handleAddCallbackForm = (formId: string) => {
    if (!formId || localRequirements.requiredCallbackForms.includes(formId)) return;
    
    const updated = {
      ...localRequirements,
      requiredCallbackForms: [...localRequirements.requiredCallbackForms, formId],
    };
    setLocalRequirements(updated);
    onUpdate(updated);
  };

  const handleRemoveCallbackForm = (formId: string) => {
    const updated = {
      ...localRequirements,
      requiredCallbackForms: localRequirements.requiredCallbackForms.filter(id => id !== formId),
    };
    setLocalRequirements(updated);
    onUpdate(updated);
  };

  const getFormName = (formId: string) => {
    const form = availableForms.find(f => f.form_id === formId);
    return form?.name || 'Unknown Form';
  };

  const getAvailableFormsForSelect = (excludeIds: string[]) => {
    return availableForms.filter(form => !excludeIds.includes(form.form_id));
  };

  const handleNext = () => {
    onNext(localRequirements);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-neu-text-primary/70">Loading forms...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neu-text-primary mb-2">
          Form Requirements
        </h2>
        <p className="text-neu-text-primary/70">
          Configure which forms actors must complete for audition signups and callbacks.
        </p>
      </div>

      {error && (
        <div className="neu-card-raised p-4 rounded-xl text-neu-accent-danger">
          {error}
        </div>
      )}

      {/* Audition Signup Forms */}
      <div className="neu-card-raised p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-neu-text-primary mb-4">
          Required Forms for Audition Signup
        </h3>
        <p className="text-sm text-neu-text-primary/70 mb-4">
          Actors must complete these forms before they can sign up for audition slots.
        </p>

        {/* Selected signup forms */}
        {localRequirements.requiredSignupForms.length > 0 && (
          <div className="mb-4 space-y-2">
            {localRequirements.requiredSignupForms.map(formId => (
              <div
                key={formId}
                className="flex items-center justify-between p-3 rounded-lg bg-neu-surface/50 border border-neu-border"
              >
                <span className="text-neu-text-primary font-medium">
                  {getFormName(formId)}
                </span>
                <button
                  onClick={() => handleRemoveSignupForm(formId)}
                  className="neu-icon-btn-sm neu-icon-btn-danger"
                  title="Remove form requirement"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add signup form */}
        <FormSelect
          label="Add Required Form"
          value=""
          onChange={(e) => handleAddSignupForm(e.target.value)}
          disabled={availableForms.length === 0}
        >
          <option value="">Select a form to require...</option>
          {getAvailableFormsForSelect(localRequirements.requiredSignupForms).map(form => (
            <option key={form.form_id} value={form.form_id}>
              {form.name}
            </option>
          ))}
        </FormSelect>

        {availableForms.length === 0 && (
          <p className="text-sm text-neu-text-primary/60 mt-2">
            No published forms available. Create and publish forms first to require them for auditions.
          </p>
        )}
      </div>

      {/* Callback Forms */}
      <div className="neu-card-raised p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-neu-text-primary mb-4">
          Required Forms for Callbacks
        </h3>
        <p className="text-sm text-neu-text-primary/70 mb-4">
          Actors must complete these forms before they can accept callback invitations.
        </p>

        {/* Selected callback forms */}
        {localRequirements.requiredCallbackForms.length > 0 && (
          <div className="mb-4 space-y-2">
            {localRequirements.requiredCallbackForms.map(formId => (
              <div
                key={formId}
                className="flex items-center justify-between p-3 rounded-lg bg-neu-surface/50 border border-neu-border"
              >
                <span className="text-neu-text-primary font-medium">
                  {getFormName(formId)}
                </span>
                <button
                  onClick={() => handleRemoveCallbackForm(formId)}
                  className="neu-icon-btn-sm neu-icon-btn-danger"
                  title="Remove form requirement"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add callback form */}
        <FormSelect
          label="Add Required Form"
          value=""
          onChange={(e) => handleAddCallbackForm(e.target.value)}
          disabled={availableForms.length === 0}
        >
          <option value="">Select a form to require...</option>
          {getAvailableFormsForSelect(localRequirements.requiredCallbackForms).map(form => (
            <option key={form.form_id} value={form.form_id}>
              {form.name}
            </option>
          ))}
        </FormSelect>
      </div>

      {/* Navigation */}
      <WizardNavigation
        onBack={onBack}
        onNext={handleNext}
        nextLabel="Continue"
        backLabel="Back"
        showNext={true}
        showBack={true}
      />
    </div>
  );
}
