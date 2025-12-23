'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import StarryContainer from '@/components/StarryContainer';
import Button from '@/components/Button';
import FormInput from '@/components/ui/forms/FormInput';
import FormSelect from '@/components/ui/forms/FormSelect';
import FormTextarea from '@/components/ui/forms/FormTextarea';
import MultiSelectDropdown from '@/components/ui/forms/MultiSelectDropdown';
import { getUser } from '@/lib/supabase/auth';
import {
  getCustomFormFields,
  getCustomFormResponseForAssignment,
  getFormAssignmentWithForm,
  submitCustomFormResponse,
  getRolesForContext,
  getCastMembersForContext
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

    if (field.field_type === 'multi_select' || field.field_type === 'role_list_multi_select' || field.field_type === 'cast_members_multi_select') {
      result[field.field_key] = Array.isArray(value) ? value : [];
      continue;
    }

    result[field.field_key] = value ?? '';
  }

  return result;
}

function MyFormFillPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const assignmentId = String(params.assignmentId);
  const returnTo = searchParams.get('returnTo');
  const mode = searchParams.get('mode') || 'edit'; // 'view', 'edit', or default to 'edit'

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isViewMode, setIsViewMode] = useState(mode === 'view');
  const [assignment, setAssignment] = useState<any | null>(null);
  const [fields, setFields] = useState<CustomFormField[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [castOptions, setCastOptions] = useState<string[]>([]);

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

     // Load dynamic field options if needed
     const hasRoleFields = f.some(field => 
       field.field_type === 'role_list_single_select' || field.field_type === 'role_list_multi_select'
     );
     const hasCastFields = f.some(field => 
       field.field_type === 'cast_members_single_select' || field.field_type === 'cast_members_multi_select'
     );

     if (hasRoleFields && a.target_type === 'audition') {
       const { data: roles } = await getRolesForContext(a.target_id);
       setRoleOptions(roles || []);
     }

     if (hasCastFields && a.target_type === 'production') {
       const { data: cast } = await getCastMembersForContext(a.target_id);
       setCastOptions(cast || []);
     }

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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-neu-text-primary mb-2">{formName}</h1>
                <p className="text-neu-text-primary/70">
                  {isViewMode ? 'Viewing your form response' : 'Fill out the form and save when you\'re done.'}
                </p>
              </div>
              {assignment?.is_complete && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsViewMode(true)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isViewMode 
                        ? 'bg-neu-accent-primary text-white' 
                        : 'bg-neu-surface text-neu-text-primary border border-neu-border'
                    }`}
                  >
                    View
                  </button>
                  <button
                    onClick={() => setIsViewMode(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      !isViewMode 
                        ? 'bg-neu-accent-primary text-white' 
                        : 'bg-neu-surface text-neu-text-primary border border-neu-border'
                    }`}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="neu-card-raised p-4 rounded-xl mb-6 text-neu-accent-danger">{error}</div>
          )}

          <div className={`neu-card-raised p-6 rounded-xl space-y-4 ${
            isViewMode ? 'bg-neu-surface/50' : ''
          }`}>
            {isViewMode && (
              <div className="mb-4 p-3 bg-neu-accent-primary/10 border border-neu-accent-primary/20 rounded-lg">
                <p className="text-sm text-neu-accent-primary font-medium">
                  📋 You are viewing your submitted response. Click "Edit" above to make changes.
                </p>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isViewMode) handleSave();
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
                    onChange={isViewMode ? undefined : (e) => setAnswers((prev) => ({ ...prev, [field.field_key]: e.target.value }))}
                    disabled={isViewMode}
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
                        onChange={isViewMode ? undefined : (e) => setAnswers((prev) => ({ ...prev, [field.field_key]: e.target.checked }))}
                        disabled={isViewMode}
                        className={`w-5 h-5 rounded border-2 border-[#4a7bd9] bg-neu-surface checked:bg-[#5a8ff5] checked:border-[#5a8ff5] focus:outline-none focus:ring-2 focus:ring-[#5a8ff5]/50 transition-all ${
                          isViewMode ? 'cursor-default' : 'cursor-pointer'
                        }`}
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
                    onChange={isViewMode ? undefined : (e) => setAnswers((prev) => ({ ...prev, [field.field_key]: e.target.value }))}
                    disabled={isViewMode}
                  >
                    <option value="">Select...</option>
                    {opts.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </FormSelect>
                );
              }

              if (field.field_type === 'role_list_single_select') {
                return (
                  <FormSelect
                    key={field.field_id}
                    label={label}
                    required={field.required}
                    helperText={helperText}
                    value={String(value ?? '')}
                    onChange={isViewMode ? undefined : (e) => setAnswers((prev) => ({ ...prev, [field.field_key]: e.target.value }))}
                    disabled={isViewMode}
                  >
                    <option value="">Select a role...</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </FormSelect>
                );
              }

              if (field.field_type === 'cast_members_single_select') {
                return (
                  <FormSelect
                    key={field.field_id}
                    label={label}
                    required={field.required}
                    helperText={helperText}
                    value={String(value ?? '')}
                    onChange={isViewMode ? undefined : (e) => setAnswers((prev) => ({ ...prev, [field.field_key]: e.target.value }))}
                    disabled={isViewMode}
                  >
                    <option value="">Select a cast member...</option>
                    {castOptions.map((member) => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </FormSelect>
                );
              }

              if (field.field_type === 'multi_select') {
                const opts = fieldOptions.get(field.field_key) || [];
                const selected = Array.isArray(value) ? value : [];
                return (
                  <MultiSelectDropdown
                    key={field.field_id}
                    label={
                      <span>
                        {label}{field.required ? <span className="text-neu-accent-danger ml-1">*</span> : null}
                      </span>
                    }
                    options={opts}
                    selectedValues={selected}
                    onChange={isViewMode ? () => {} : (values) => setAnswers((prev) => ({ ...prev, [field.field_key]: values }))}
                    helperText={helperText}
                    placeholder={isViewMode ? "No options selected" : "Select options..."}
                    className={isViewMode ? "pointer-events-none opacity-75" : ""}
                  />
                );
              }

              if (field.field_type === 'role_list_multi_select') {
                const selected = Array.isArray(value) ? value : [];
                return (
                  <MultiSelectDropdown
                    key={field.field_id}
                    label={
                      <span>
                        {label}{field.required ? <span className="text-neu-accent-danger ml-1">*</span> : null}
                      </span>
                    }
                    options={roleOptions}
                    selectedValues={selected}
                    onChange={isViewMode ? () => {} : (values) => setAnswers((prev) => ({ ...prev, [field.field_key]: values }))}
                    helperText={helperText}
                    placeholder={isViewMode ? "No roles selected" : "Select roles..."}
                    className={isViewMode ? "pointer-events-none opacity-75" : ""}
                  />
                );
              }

              if (field.field_type === 'cast_members_multi_select') {
                const selected = Array.isArray(value) ? value : [];
                return (
                  <MultiSelectDropdown
                    key={field.field_id}
                    label={
                      <span>
                        {label}{field.required ? <span className="text-neu-accent-danger ml-1">*</span> : null}
                      </span>
                    }
                    options={castOptions}
                    selectedValues={selected}
                    onChange={isViewMode ? () => {} : (values) => setAnswers((prev) => ({ ...prev, [field.field_key]: values }))}
                    helperText={helperText}
                    placeholder={isViewMode ? "No cast members selected" : "Select cast members..."}
                    className={isViewMode ? "pointer-events-none opacity-75" : ""}
                  />
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

            {!isViewMode && (
              <div className="pt-2">
                <Button
                  type="submit"
                  text={saving ? 'Saving...' : 'Save'}
                  disabled={saving}
                />
              </div>
            )}
            </form>
          </div>
        </div>
      </div>
    </StarryContainer>
  );
}

export default function MyFormFillPage() {
  return (
    <Suspense fallback={
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading form...</div>
        </div>
      </StarryContainer>
    }>
      <MyFormFillPageContent />
    </Suspense>
  );
}
