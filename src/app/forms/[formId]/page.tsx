'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import StarryContainer from '@/components/StarryContainer';
import Button from '@/components/Button';
import FormInput from '@/components/ui/forms/FormInput';
import FormSelect from '@/components/ui/forms/FormSelect';
import FormTextarea from '@/components/ui/forms/FormTextarea';
import { getUser } from '@/lib/supabase/auth';
import { getUserManageableAuditions } from '@/lib/supabase/auditionQueries';
import { getAuditionCastMembers } from '@/lib/supabase/castMembers';
import {
  assignCustomFormToTarget,
  assignCustomFormToTargets,
  createCustomFormField,
  deleteCustomForm,
  deleteCustomFormField,
  getCustomForm,
  getCustomFormAssignmentsForTarget,
  getCustomFormFields,
  updateCustomForm,
  updateCustomFormField,
} from '@/lib/supabase/customForms';
import type { CustomForm, CustomFormAssignment, CustomFormField, CustomFormFieldType, CustomFormFilledOutBy, CustomFormStatus, CustomFormTargetType, Json } from '@/lib/supabase/types';

type FieldDraft = {
  field_id: string;
  form_id: string;
  field_key: string;
  label: string;
  field_type: CustomFormFieldType;
  required: boolean;
  help_text: string | null;
  options: Json | null;
  sort_order: number;
};

function toFieldDraft(field: CustomFormField): FieldDraft {
  return {
    field_id: field.field_id,
    form_id: field.form_id,
    field_key: field.field_key,
    label: field.label,
    field_type: field.field_type,
    required: field.required,
    help_text: field.help_text,
    options: field.options,
    sort_order: field.sort_order,
  };
}

function slugifyKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

function getFieldTypeOptions(): Array<{ value: CustomFormFieldType; label: string }> {
  return [
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
  ];
}

function optionsToLines(options: Json | null): string {
  if (!options) return '';
  if (Array.isArray(options)) {
    return options.map((v) => String(v)).join('\n');
  }
  return '';
}

function linesToOptions(lines: string): Json | null {
  const values = lines
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);
  if (values.length === 0) return null;
  return values;
}

export default function FormEditorPage() {
  const router = useRouter();
  const params = useParams();
  const formId = String(params.formId);

  const [loading, setLoading] = useState(true);
  const [savingForm, setSavingForm] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CustomForm | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CustomFormStatus>('draft');

  const [fields, setFields] = useState<FieldDraft[]>([]);

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFormFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldHelpText, setNewFieldHelpText] = useState('');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [creatingField, setCreatingField] = useState(false);

  const [auditionsLoading, setAuditionsLoading] = useState(false);
  const [auditions, setAuditions] = useState<any[]>([]);
  const [assignmentTargetType, setAssignmentTargetType] = useState<CustomFormTargetType>('cast_member');
  const [selectedAuditionId, setSelectedAuditionId] = useState<string>('');
  const [castMembersLoading, setCastMembersLoading] = useState(false);
  const [castMembers, setCastMembers] = useState<any[]>([]);
  const [selectedCastMemberId, setSelectedCastMemberId] = useState<string>('');
  const [assignmentRequired, setAssignmentRequired] = useState(true);
  const [assignmentFilledOutBy, setAssignmentFilledOutBy] = useState<CustomFormFilledOutBy>('assignee');
  const [assigning, setAssigning] = useState(false);
  const [assigningCast, setAssigningCast] = useState(false);
  const [currentTargetAssignments, setCurrentTargetAssignments] = useState<CustomFormAssignment[]>([]);

  const fieldTypeOptions = useMemo(() => getFieldTypeOptions(), []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  useEffect(() => {
    if (!selectedAuditionId) {
      setCastMembers([]);
      setSelectedCastMemberId('');
      return;
    }

    if (assignmentTargetType !== 'cast_member') {
      setCastMembers([]);
      setSelectedCastMemberId('');
    }

    if (assignmentTargetType === 'cast_member') {
      loadCastMembers(selectedAuditionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentTargetType, selectedAuditionId]);

  useEffect(() => {
    loadCurrentTargetAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentTargetType, selectedAuditionId, selectedCastMemberId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const user = await getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setAuditionsLoading(true);
    const { data: manageable } = await getUserManageableAuditions(user.id);
    setAuditions((manageable as any) || []);
    setAuditionsLoading(false);

    const f = await getCustomForm(formId);
    if (!f) {
      setLoading(false);
      setError('Form not found');
      return;
    }

    const formFields = await getCustomFormFields(formId);

    setForm(f);
    setName(f.name);
    setDescription(f.description || '');
    setStatus(f.status);
    setFields(formFields.map(toFieldDraft));

    setLoading(false);
  };

  const loadCastMembers = async (auditionId: string) => {
    setCastMembersLoading(true);
    const members = await getAuditionCastMembers(auditionId);
    setCastMembers(members || []);
    setCastMembersLoading(false);
  };

  const loadCurrentTargetAssignments = async () => {
    setCurrentTargetAssignments([]);

    if (assignmentTargetType === 'audition') {
      if (!selectedAuditionId) return;
      const a = await getCustomFormAssignmentsForTarget('audition', selectedAuditionId);
      setCurrentTargetAssignments(a);
      return;
    }

    if (assignmentTargetType === 'cast_member') {
      if (!selectedCastMemberId) return;
      const a = await getCustomFormAssignmentsForTarget('cast_member', selectedCastMemberId);
      setCurrentTargetAssignments(a);
      return;
    }
  };

  const handleAssign = async () => {
    setError(null);

    let targetId = '';
    if (assignmentTargetType === 'audition') {
      targetId = selectedAuditionId;
    } else if (assignmentTargetType === 'cast_member') {
      targetId = selectedCastMemberId;
    }

    if (!targetId) {
      setError('Please select a target to assign this form to.');
      return;
    }

    setAssigning(true);

    const { error: assignError } = await assignCustomFormToTarget({
      form_id: formId,
      target_type: assignmentTargetType,
      target_id: targetId,
      required: assignmentRequired,
      filled_out_by: assignmentFilledOutBy,
    });

    if (assignError) {
      setError(assignError.message || 'Failed to assign form');
      setAssigning(false);
      return;
    }

    setAssigning(false);
    await loadCurrentTargetAssignments();
  };

  const handleAssignToWholeCast = async () => {
    setError(null);

    if (!selectedAuditionId) {
      setError('Please select a production first.');
      return;
    }

    setAssigningCast(true);

    const members = await getAuditionCastMembers(selectedAuditionId);
    const targetIds = (members || []).map((m: any) => m.cast_member_id).filter(Boolean);

    if (targetIds.length === 0) {
      setError('No cast members found for this production.');
      setAssigningCast(false);
      return;
    }

    const { error: bulkError } = await assignCustomFormToTargets({
      formId,
      targetType: 'cast_member',
      targetIds,
      required: assignmentRequired,
      filledOutBy: assignmentFilledOutBy,
    });

    if (bulkError) {
      setError(bulkError.message || 'Failed to assign to cast');
      setAssigningCast(false);
      return;
    }

    setAssigningCast(false);
    if (assignmentTargetType === 'cast_member' && selectedCastMemberId) {
      await loadCurrentTargetAssignments();
    }
  };

  const handleSaveForm = async () => {
    if (!form) return;

    setSavingForm(true);
    setError(null);

    const { data, error: updateError } = await updateCustomForm(form.form_id, {
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
      status,
    });

    if (updateError || !data) {
      setError(updateError?.message || 'Failed to save form');
      setSavingForm(false);
      return;
    }

    setForm(data);
    setSavingForm(false);
  };

  const handleSaveAllFields = async () => {
    setSavingFields(true);
    setError(null);

    for (const field of fields) {
      if (!field.label.trim()) {
        setSavingFields(false);
        setError('Each field must have a label');
        return;
      }
      if (!field.field_key.trim()) {
        setSavingFields(false);
        setError('Each field must have a key');
        return;
      }

      const { error: updateError } = await updateCustomFormField(field.field_id, {
        field_key: field.field_key.trim(),
        label: field.label.trim(),
        field_type: field.field_type,
        required: field.required,
        help_text: field.help_text?.trim() ? field.help_text.trim() : null,
        options: field.options,
        sort_order: field.sort_order,
      });

      if (updateError) {
        setSavingFields(false);
        setError(updateError.message || 'Failed to save fields');
        return;
      }
    }

    setSavingFields(false);
    await loadData();
  };

  const handleAddField = async () => {
    const label = newFieldLabel.trim();
    if (!label) return;

    const computedKey = (newFieldKey || slugifyKey(label)).trim();
    if (!computedKey) {
      setError('Field key is required');
      return;
    }

    setCreatingField(true);
    setError(null);

    const isSelect = newFieldType === 'single_select' || newFieldType === 'multi_select';
    const options = isSelect ? linesToOptions(newFieldOptions) : null;

    const sortOrder = fields.length;

    const { data, error: createError } = await createCustomFormField({
      form_id: formId,
      field_key: computedKey,
      label,
      field_type: newFieldType,
      required: newFieldRequired,
      help_text: newFieldHelpText.trim() ? newFieldHelpText.trim() : null,
      options,
      sort_order: sortOrder,
    });

    if (createError || !data) {
      setError(createError?.message || 'Failed to create field');
      setCreatingField(false);
      return;
    }

    setNewFieldLabel('');
    setNewFieldKey('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldHelpText('');
    setNewFieldOptions('');

    setFields((prev) => [...prev, toFieldDraft(data)]);
    setCreatingField(false);
  };

  const handleDeleteField = async (fieldId: string) => {
    const ok = window.confirm('Delete this field? This cannot be undone.');
    if (!ok) return;

    const { error: deleteError } = await deleteCustomFormField(fieldId);
    if (deleteError) {
      setError(deleteError.message || 'Failed to delete field');
      return;
    }

    const remaining = fields.filter((f) => f.field_id !== fieldId);
    const normalized = remaining.map((f, idx) => ({ ...f, sort_order: idx }));
    setFields(normalized);

    for (const f of normalized) {
      await updateCustomFormField(f.field_id, { sort_order: f.sort_order });
    }
  };

  const moveField = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const copy = [...fields];
    const a = copy[index];
    const b = copy[newIndex];

    copy[index] = { ...b, sort_order: index };
    copy[newIndex] = { ...a, sort_order: newIndex };

    setFields(copy);

    await updateCustomFormField(copy[index].field_id, { sort_order: copy[index].sort_order });
    await updateCustomFormField(copy[newIndex].field_id, { sort_order: copy[newIndex].sort_order });
  };

  const handleDeleteForm = async () => {
    if (!form) return;
    const ok = window.confirm(`Delete "${form.name}"? This cannot be undone.`);
    if (!ok) return;

    const { error: deleteError } = await deleteCustomForm(form.form_id);
    if (deleteError) {
      setError(deleteError.message || 'Failed to delete form');
      return;
    }

    router.push('/forms');
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

  if (!form) {
    return (
      <StarryContainer>
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-3xl mx-auto neu-card-raised p-6 rounded-xl">
            <div className="text-neu-text-primary">{error || 'Form not found'}</div>
            <div className="mt-4">
              <Link href="/forms" className="neu-link">Back to Forms</Link>
            </div>
          </div>
        </div>
      </StarryContainer>
    );
  }

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/forms" className="neu-link">← Back to Forms</Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-neu-text-primary mb-2">Edit Form</h1>
              <p className="text-neu-text-primary/70">Build the fields for this form.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                text={savingForm ? 'Saving...' : 'Save Form'}
                onClick={handleSaveForm}
                disabled={savingForm || !name.trim()}
                variant="primary"
              />
              <Button
                text={savingFields ? 'Saving...' : 'Save Fields'}
                onClick={handleSaveAllFields}
                disabled={savingFields}
                variant="secondary"
              />
              <Button
                text="Delete Form"
                onClick={handleDeleteForm}
                variant="danger"
              />
            </div>
          </div>

          {error && (
            <div className="neu-card-raised p-4 rounded-xl mb-6 text-neu-accent-danger">{error}</div>
          )}

          <div className="neu-card-raised p-6 rounded-xl mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <FormSelect
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomFormStatus)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </FormSelect>

              <div className="md:col-span-2">
                <FormTextarea
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
            </div>
          </div>

          <div className="neu-card-raised p-6 rounded-xl mb-6">
            <h2 className="text-xl font-semibold text-neu-text-primary mb-4">Add field</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Label"
                value={newFieldLabel}
                onChange={(e) => {
                  setNewFieldLabel(e.target.value);
                  if (!newFieldKey.trim()) {
                    setNewFieldKey(slugifyKey(e.target.value));
                  }
                }}
                placeholder="e.g., Height"
                required
              />

              <FormInput
                label="Key"
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
                placeholder="e.g., height"
                helperText="Used to store answers. Must be unique per form."
                required
              />

              <FormSelect
                label="Type"
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as CustomFormFieldType)}
              >
                {fieldTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </FormSelect>

              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-[#4a7bd9] bg-neu-surface checked:bg-[#5a8ff5] checked:border-[#5a8ff5] focus:outline-none focus:ring-2 focus:ring-[#5a8ff5]/50 cursor-pointer transition-all"
                  />
                  <span className="text-sm font-medium text-neu-text-primary">Required</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <FormTextarea
                  label="Help text"
                  value={newFieldHelpText}
                  onChange={(e) => setNewFieldHelpText(e.target.value)}
                  rows={2}
                  placeholder="Optional helper text..."
                />
              </div>

              {(newFieldType === 'single_select' || newFieldType === 'multi_select') && (
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Options (one per line)"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    rows={4}
                    placeholder="Small\nMedium\nLarge"
                  />
                </div>
              )}
            </div>

            <div className="mt-4">
              <Button
                text={creatingField ? 'Adding...' : 'Add Field'}
                onClick={handleAddField}
                disabled={creatingField || !newFieldLabel.trim()}
              />
            </div>
          </div>

          <div className="neu-card-raised p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-neu-text-primary mb-4">Fields</h2>

            {fields.length === 0 ? (
              <div className="text-neu-text-primary/70">No fields yet.</div>
            ) : (
              <div className="space-y-4">
                {fields
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((field, idx) => (
                    <div key={field.field_id} className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                        <div>
                          <div className="text-lg font-semibold text-neu-text-primary">{field.label || 'Untitled field'}</div>
                          <div className="text-xs text-neu-text-primary/60">Key: {field.field_key} • Type: {field.field_type}</div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            className="n-button-secondary"
                            onClick={() => moveField(idx, -1)}
                            disabled={idx === 0}
                          >
                            Up
                          </button>
                          <button
                            className="n-button-secondary"
                            onClick={() => moveField(idx, 1)}
                            disabled={idx === fields.length - 1}
                          >
                            Down
                          </button>
                          <button className="n-button-danger" onClick={() => handleDeleteField(field.field_id)}>
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                          label="Label"
                          value={field.label}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFields((prev) => prev.map((f) => (f.field_id === field.field_id ? { ...f, label: value } : f)));
                          }}
                          required
                        />

                        <FormInput
                          label="Key"
                          value={field.field_key}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFields((prev) => prev.map((f) => (f.field_id === field.field_id ? { ...f, field_key: value } : f)));
                          }}
                          required
                        />

                        <FormSelect
                          label="Type"
                          value={field.field_type}
                          onChange={(e) => {
                            const value = e.target.value as CustomFormFieldType;
                            setFields((prev) =>
                              prev.map((f) =>
                                f.field_id === field.field_id
                                  ? { ...f, field_type: value, options: value === 'single_select' || value === 'multi_select' ? f.options : null }
                                  : f
                              )
                            );
                          }}
                        >
                          {fieldTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </FormSelect>

                        <div className="flex items-end">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFields((prev) => prev.map((f) => (f.field_id === field.field_id ? { ...f, required: checked } : f)));
                              }}
                              className="w-5 h-5 rounded border-2 border-[#4a7bd9] bg-neu-surface checked:bg-[#5a8ff5] checked:border-[#5a8ff5] focus:outline-none focus:ring-2 focus:ring-[#5a8ff5]/50 cursor-pointer transition-all"
                            />
                            <span className="text-sm font-medium text-neu-text-primary">Required</span>
                          </label>
                        </div>

                        <div className="md:col-span-2">
                          <FormTextarea
                            label="Help text"
                            value={field.help_text || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFields((prev) => prev.map((f) => (f.field_id === field.field_id ? { ...f, help_text: value } : f)));
                            }}
                            rows={2}
                          />
                        </div>

                        {(field.field_type === 'single_select' || field.field_type === 'multi_select') && (
                          <div className="md:col-span-2">
                            <FormTextarea
                              label="Options (one per line)"
                              value={optionsToLines(field.options)}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFields((prev) =>
                                  prev.map((f) => (f.field_id === field.field_id ? { ...f, options: linesToOptions(value) } : f))
                                );
                              }}
                              rows={4}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="neu-card-raised p-6 rounded-xl mt-6">
            <h2 className="text-xl font-semibold text-neu-text-primary mb-2">Assign form</h2>
            <p className="text-sm text-neu-text-primary/70 mb-4">
              Assign this form to a production or a cast member.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Assign to"
                value={assignmentTargetType}
                onChange={(e) => {
                  const next = e.target.value as CustomFormTargetType;
                  setAssignmentTargetType(next);
                  setCurrentTargetAssignments([]);
                  setSelectedCastMemberId('');
                }}
              >
                <option value="cast_member">Cast Member</option>
                <option value="audition">Production</option>
              </FormSelect>

              <FormSelect
                label="Production"
                value={selectedAuditionId}
                onChange={(e) => {
                  setSelectedAuditionId(e.target.value);
                  setSelectedCastMemberId('');
                  setCurrentTargetAssignments([]);
                }}
                disabled={auditionsLoading}
              >
                <option value="">Select a production...</option>
                {auditions.map((a: any) => (
                  <option key={a.audition_id} value={a.audition_id}>
                    {a.show?.title || a.shows?.title || 'Untitled Production'}
                  </option>
                ))}
              </FormSelect>

              {assignmentTargetType === 'cast_member' && (
                <FormSelect
                  label="Cast member"
                  value={selectedCastMemberId}
                  onChange={(e) => setSelectedCastMemberId(e.target.value)}
                  disabled={!selectedAuditionId || castMembersLoading}
                >
                  <option value="">Select a cast member...</option>
                  {castMembers.map((m: any) => (
                    <option key={m.cast_member_id} value={m.cast_member_id}>
                      {m.full_name || 'Unknown User'}
                    </option>
                  ))}
                </FormSelect>
              )}

              <FormSelect
                label="Filled out by"
                value={assignmentFilledOutBy}
                onChange={(e) => setAssignmentFilledOutBy(e.target.value as CustomFormFilledOutBy)}
              >
                <option value="assignee">Assigned person</option>
                <option value="production_team">Production team</option>
              </FormSelect>

              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignmentRequired}
                    onChange={(e) => setAssignmentRequired(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-[#4a7bd9] bg-neu-surface checked:bg-[#5a8ff5] checked:border-[#5a8ff5] focus:outline-none focus:ring-2 focus:ring-[#5a8ff5]/50 cursor-pointer transition-all"
                  />
                  <span className="text-sm font-medium text-neu-text-primary">Required</span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <Button
                text={assigning ? 'Assigning...' : 'Assign Form'}
                onClick={handleAssign}
                disabled={assigning}
              />
              {assignmentTargetType === 'cast_member' && (
                <Button
                  text={assigningCast ? 'Assigning...' : 'Assign to Entire Cast'}
                  onClick={handleAssignToWholeCast}
                  disabled={assigningCast || !selectedAuditionId}
                  variant="secondary"
                />
              )}
              <div className="text-sm text-neu-text-primary/70">
                {currentTargetAssignments.some((a) => a.form_id === formId) ? (
                  <span className="text-neu-accent-primary">This form is assigned to the selected target.</span>
                ) : (
                  <span>Not assigned to the selected target yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StarryContainer>
  );
}
