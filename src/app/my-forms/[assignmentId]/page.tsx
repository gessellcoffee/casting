'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import StarryContainer from '@/components/StarryContainer';
import Button from '@/components/Button';
import FormInput from '@/components/ui/forms/FormInput';
import FormSelect from '@/components/ui/forms/FormSelect';
import FormTextarea from '@/components/ui/forms/FormTextarea';
import { getUser } from '@/lib/supabase/auth';
import {
  getCustomFormFields,
  getCustomFormResponseForAssignment,
  getFormAssignmentWithForm,
  submitCustomFormResponse,
} from '@/lib/supabase/customForms';
import type { CustomFormField, CustomFormFieldType } from '@/lib/supabase/types';

function coerceNumber(value: string, fieldType: CustomFormFieldType): number | null {
  if (!value.trim()) return null;
  const n = fieldType === 'integer' ? parseInt(value, 10) : parseFloat(value);
  if (Number.isNaN(n)) return null;
  return n;
}

function normalizeAnswers(fields: CustomFormField[], raw: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const field of fields) {
    const value = raw[field.field_key];

    if (field.field_type === 'integer' || field.field_type === 'decimal') {
      result[field.field_key] = typeof value === 'number' ? value : coerceNumber(String(value ?? ''), field.field_type);
      continue;
    }

    if (field.field_type === 'boolean') {
      result[field.field_key] = Boolean(value);
      continue;
    }

    if (field.field_type === 'multi_select') {
      result[field.field_key] = Array.isArray(value) ? value : [];
      continue;
    }

    result[field.field_key] = value ?? '';
  }

  return result;
}

export default function MyFormFillPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const assignmentId = String(params.assignmentId);
  const returnTo = searchParams.get('returnTo');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<any | null>(null);
  const [fields, setFields] = useState<CustomFormField[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const formName = assignment?.custom_forms?.name || assignment?.form?.name || 'Form';

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  const loadData = async () => {
     setLoading(true);
     setError(null);

     const user = await getUser();
     if (!user) {
       router.push('/login');
       return;
     }

     const a = await getFormAssignmentWithForm(assignmentId);
     if (!a) {
       setLoading(false);
       setError('Assignment not found');
       return;
     }

     const f = await getCustomFormFields(a.form_id);
     setAssignment(a);
     setFields(f);

     const existing = await getCustomFormResponseForAssignment(assignmentId);
     const initialAnswers = existing?.answers && typeof existing.answers === 'object' ? (existing.answers as any) : {};
     setAnswers(normalizeAnswers(f, initialAnswers));

     setLoading(false);
   };

  const fieldOptions = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const field of fields) {
      if (field.field_type === 'single_select' || field.field_type === 'multi_select') {
        map.set(
          field.field_key,
          Array.isArray(field.options) ? (field.options as any[]).map((v) => String(v)) : []
        );
      }
    }
    return map;
  }, [fields]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const { error: submitError } = await submitCustomFormResponse({
      assignmentId,
      answers,
    });

    if (submitError) {
      setSaving(false);
      setError(submitError.message || 'Failed to submit form');
      return;
    }

    setSaving(false);

    if (returnTo) {
      router.push(returnTo);
      return;
    }

    router.push('/my-forms');
  };

  if (loading) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading form...</div>
        </div>
      </StarryContainer>
    );
  }

  if (!assignment) {
    return (
      <StarryContainer>
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-3xl mx-auto neu-card-raised p-6 rounded-xl">
            <div className="text-neu-text-primary">{error || 'Form not found'}</div>
            <div className="mt-4">
              <Link href="/my-forms" className="neu-link">Back</Link>
            </div>
          </div>
        </div>
      </StarryContainer>
    );
  }

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link href={returnTo || '/my-forms'} className="neu-link">← Back</Link>
          </div>

          <div className="neu-card-raised p-6 rounded-xl mb-6">
            <h1 className="text-3xl font-bold text-neu-text-primary mb-2">{formName}</h1>
            <p className="text-neu-text-primary/70">Fill out the form and save when you're done.</p>
          </div>

          {error && (
            <div className="neu-card-raised p-4 rounded-xl mb-6 text-neu-accent-danger">{error}</div>
          )}

          <form
            className="neu-card-raised p-6 rounded-xl space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            {fields.map((field) => {
              const value = answers[field.field_key];
              const label = field.label;
              const helperText = field.help_text || undefined;

              if (field.field_type === 'textarea') {
                return (
                  <FormTextarea
                    key={field.field_id}
                    label={label}
                    required={field.required}
                    helperText={helperText}
                    value={String(value ?? '')}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [field.field_key]: e.target.value }))}
                    rows={4}
                  />
                );
              }

              if (field.field_type === 'boolean') {
                return (
                  <div key={field.field_id} className="neu-container-light">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [field.field_key]: e.target.checked }))}
                        className="w-5 h-5 rounded border-2 border-[#4a7bd9] bg-neu-surface checked:bg-[#5a8ff5] checked:border-[#5a8ff5] focus:outline-none focus:ring-2 focus:ring-[#5a8ff5]/50 cursor-pointer transition-all"
                      />
                      <span className="text-sm font-medium text-neu-text-primary">
                        {label}{field.required ? <span className="text-neu-accent-danger ml-1">*</span> : null}
                      </span>
                    </label>
                    {helperText && (
                      <div className="text-xs text-neu-text-primary/60 mt-2">{helperText}</div>
                    )}
                  </div>
                );
              }

              if (field.field_type === 'single_select') {
                const opts = fieldOptions.get(field.field_key) || [];
                return (
                  <FormSelect
                    key={field.field_id}
                    label={label}
                    required={field.required}
                    helperText={helperText}
                    value={String(value ?? '')}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [field.field_key]: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    {opts.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </FormSelect>
                );
              }

              if (field.field_type === 'multi_select') {
                const opts = fieldOptions.get(field.field_key) || [];
                const selected = Array.isArray(value) ? value : [];
                return (
                  <div key={field.field_id}>
                    <label className="block text-sm font-medium text-neu-text-primary mb-2">
                      {label}{field.required ? <span className="text-neu-accent-danger ml-1">*</span> : null}
                    </label>
                    <select
                      multiple
                      className="neu-input w-full"
                      value={selected.map(String)}
                      onChange={(e) => {
                        const selectedValues = Array.from(e.target.selectedOptions).map((o) => o.value);
                        setAnswers((prev) => ({ ...prev, [field.field_key]: selectedValues }));
                      }}
                    >
                      {opts.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    {helperText && (
                      <p className="text-neu-text-muted text-xs mt-1">{helperText}</p>
                    )}
                  </div>
                );
              }

              let inputType: string = 'text';
              let step: string | undefined;

              if (field.field_type === 'integer') {
                inputType = 'number';
                step = '1';
              } else if (field.field_type === 'decimal') {
                inputType = 'number';
                step = '0.01';
              } else if (field.field_type === 'date') {
                inputType = 'date';
              } else if (field.field_type === 'time') {
                inputType = 'time';
              } else if (field.field_type === 'datetime') {
                inputType = 'datetime-local';
              } else if (field.field_type === 'color') {
                inputType = 'color';
              }

              return (
                <FormInput
                  key={field.field_id}
                  label={label}
                  required={field.required}
                  helperText={helperText}
                  type={inputType}
                  step={step}
                  value={inputType === 'number' ? String(value ?? '') : String(value ?? '')}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (field.field_type === 'integer' || field.field_type === 'decimal') {
                      setAnswers((prev) => ({ ...prev, [field.field_key]: v }));
                      return;
                    }
                    setAnswers((prev) => ({ ...prev, [field.field_key]: v }));
                  }}
                />
              );
            })}

            <div className="pt-2">
              <Button
                type="submit"
                text={saving ? 'Saving...' : 'Save'}
                disabled={saving}
              />
            </div>
          </form>
        </div>
      </div>
    </StarryContainer>
  );
}
