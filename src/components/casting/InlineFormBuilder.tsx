'use client';

import { useState } from 'react';
import { createCustomForm, createCustomFormField } from '@/lib/supabase/customForms';
import { CustomFormFieldType } from '@/lib/supabase/types';
import FormInput from '@/components/ui/forms/FormInput';
import FormTextarea from '@/components/ui/forms/FormTextarea';
import FormSelect from '@/components/ui/forms/FormSelect';
import { X, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

interface FormField {
  field_key: string;
  label: string;
  field_type: CustomFormFieldType;
  required: boolean;
  help_text: string;
  options: string[];
  sort_order: number;
}

interface InlineFormBuilderProps {
  onFormCreated: (formId: string, formName: string) => void;
  onCancel: () => void;
}

const fieldTypeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'integer', label: 'Integer' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'single_select', label: 'Single Select' },
  { value: 'multi_select', label: 'Multi Select' },
  { value: 'color', label: 'Color' },
  { value: 'role_list_single_select', label: 'Role List (Single)' },
  { value: 'role_list_multi_select', label: 'Role List (Multiple)' },
  { value: 'cast_members_single_select', label: 'Cast Members (Single)' },
  { value: 'cast_members_multi_select', label: 'Cast Members (Multiple)' },
];

export default function InlineFormBuilder({ onFormCreated, onCancel }: InlineFormBuilderProps) {
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addField = () => {
    const newField: FormField = {
      field_key: `field_${fields.length + 1}`,
      label: '',
      field_type: 'text',
      required: false,
      help_text: '',
      options: [],
      sort_order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    
    // Auto-generate field_key from label
    if (updates.label) {
      updatedFields[index].field_key = updates.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 50) || `field_${index + 1}`;
    }
    
    setFields(updatedFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setError('Form name is required');
      return;
    }

    if (fields.length === 0) {
      setError('At least one field is required');
      return;
    }

    // Validate fields
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (!field.label.trim()) {
        setError(`Field ${i + 1} must have a label`);
        return;
      }
      if (['single_select', 'multi_select'].includes(field.field_type) && field.options.length === 0) {
        setError(`Field "${field.label}" must have at least one option`);
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      // Create the form
      const { data: form, error: formError } = await createCustomForm({
        name: formName.trim(),
        description: formDescription.trim() || null,
        status: 'published', // Auto-publish for immediate use
      });

      if (formError || !form) {
        throw new Error(formError?.message || 'Failed to create form');
      }

      // Create the fields
      for (const field of fields) {
        const { error: fieldError } = await createCustomFormField({
          form_id: form.form_id,
          field_key: field.field_key,
          label: field.label,
          field_type: field.field_type,
          required: field.required,
          help_text: field.help_text || null,
          options: field.options.length > 0 ? field.options : null,
          sort_order: field.sort_order,
        });

        if (fieldError) {
          throw new Error(`Failed to create field "${field.label}": ${fieldError.message}`);
        }
      }

      // Notify parent component
      onFormCreated(form.form_id, form.name);
    } catch (err) {
      console.error('Error creating form:', err);
      setError(err instanceof Error ? err.message : 'Failed to create form');
    } finally {
      setSaving(false);
    }
  };

  const needsOptions = (fieldType: CustomFormFieldType) => {
    return ['single_select', 'multi_select'].includes(fieldType);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neu-text-primary">Create New Form</h3>
          <p className="text-sm text-neu-text-secondary">Build a custom form for your audition</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-neu-surface/50 transition-colors"
        >
          <X className="w-5 h-5 text-neu-text-secondary" />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Form Details */}
      <div className="space-y-4">
        <FormInput
          label="Form Name"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          required
          placeholder="e.g., Actor Information Form"
        />
        
        <FormTextarea
          label="Description (Optional)"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          placeholder="Brief description of what this form is for..."
          rows={2}
        />
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-neu-text-primary">Form Fields</h4>
          <button
            onClick={addField}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neu-accent-primary/10 text-neu-accent-primary hover:bg-neu-accent-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={index} className="p-4 rounded-lg border border-neu-border bg-neu-surface/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neu-text-primary">Field {index + 1}</span>
              <button
                onClick={() => removeField(index)}
                className="p-1 rounded hover:bg-red-500/10 text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormInput
                label="Field Label"
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder="e.g., Full Name"
                required
              />

              <FormSelect
                label="Field Type"
                value={field.field_type}
                onChange={(e) => updateField(index, { field_type: e.target.value as CustomFormFieldType })}
                required
              >
                {fieldTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormSelect>
            </div>

            <FormInput
              label="Help Text (Optional)"
              value={field.help_text}
              onChange={(e) => updateField(index, { help_text: e.target.value })}
              placeholder="Additional instructions for this field..."
            />

            {needsOptions(field.field_type) && (
              <div>
                <label className="block text-sm font-medium text-neu-text-primary mb-2">
                  Options (one per line)
                </label>
                <textarea
                  value={field.options.join('\n')}
                  onChange={(e) => updateField(index, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  className="w-full p-3 rounded-lg border border-neu-border bg-neu-surface text-neu-text-primary placeholder-neu-text-secondary focus:outline-none focus:ring-2 focus:ring-neu-accent-primary/50"
                  rows={3}
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id={`required-${index}`}
                checked={field.required}
                onChange={(e) => updateField(index, { required: e.target.checked })}
                className="w-4 h-4 rounded border-2 border-neu-border bg-neu-surface checked:bg-neu-accent-primary checked:border-neu-accent-primary focus:outline-none focus:ring-2 focus:ring-neu-accent-primary/50"
              />
              <label htmlFor={`required-${index}`} className="ml-2 text-sm text-neu-text-primary">
                Required field
              </label>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-8 text-neu-text-secondary">
            <p className="mb-4">No fields added yet</p>
            <button
              onClick={addField}
              className="flex items-center gap-2 px-4 py-2 mx-auto rounded-lg bg-neu-accent-primary/10 text-neu-accent-primary hover:bg-neu-accent-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Field
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-neu-border">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neu-border text-neu-text-primary hover:bg-neu-surface/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Form Selection
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !formName.trim() || fields.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neu-accent-primary text-white hover:bg-neu-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Creating Form...' : 'Create Form'}
        </button>
      </div>
    </div>
  );
}
