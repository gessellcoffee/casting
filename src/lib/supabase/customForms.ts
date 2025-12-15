import { supabase } from './client';
import { getAuthenticatedUser } from './auth';
import { createNotification } from './notifications';
import type {
  CustomForm,
  CustomFormAssignment,
  CustomFormAssignmentInsert,
  CustomFormAssignmentUpdate,
  CustomFormFilledOutBy,
  CustomFormField,
  CustomFormFieldInsert,
  CustomFormFieldUpdate,
  CustomFormInsert,
  CustomFormResponse,
  CustomFormTargetType,
  CustomFormUpdate,
  Json,
} from './types';

function isEmptyAnswer(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

async function notifyCastMembersForAssignments(input: {
  assignments: CustomFormAssignment[];
  senderId: string;
}): Promise<void> {
  const castMemberIds = input.assignments
    .filter(a => a.target_type === 'cast_member')
    .map(a => a.target_id);

  if (castMemberIds.length === 0) return;

  const { data: castMembers } = await supabase
    .from('cast_members')
    .select(`
      cast_member_id,
      user_id,
      auditions (
        audition_id,
        shows (title)
      )
    `)
    .in('cast_member_id', castMemberIds);

  const assignmentsByTargetId = new Map(input.assignments.map(a => [a.target_id, a]));

  await Promise.all(
    (castMembers || []).map(async (cm: any) => {
      const assignment = assignmentsByTargetId.get(cm.cast_member_id);
      if (!assignment) return;

      const showTitle = cm.auditions?.shows?.title || 'a production';

      await createNotification({
        recipient_id: cm.user_id,
        sender_id: input.senderId,
        type: 'general',
        title: 'New form assigned',
        message: `You have a new form to complete for ${showTitle}.`,
        action_url: `/my-forms/${assignment.assignment_id}`,
        link_url: `/my-forms/${assignment.assignment_id}`,
        reference_id: assignment.assignment_id,
        reference_type: 'custom_form_assignment',
        is_actionable: true,
      });
    })
  );
}

export async function assignCustomFormToTargets(input: {
  formId: string;
  targetType: CustomFormTargetType;
  targetIds: string[];
  required?: boolean;
  filledOutBy?: CustomFormFilledOutBy;
}): Promise<{ data: CustomFormAssignment[] | null; error: any }> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const rows = input.targetIds.map((targetId) => ({
    form_id: input.formId,
    target_type: input.targetType,
    target_id: targetId,
    required: input.required ?? true,
    filled_out_by: input.filledOutBy ?? 'assignee',
    created_by: user.id,
  }));

  const { data, error } = await supabase
    .from('custom_form_assignments')
    .upsert(rows, { onConflict: 'form_id,target_type,target_id' })
    .select('*');

  if (error) {
    console.error('Error bulk assigning custom form:', error);
    return { data: null, error };
  }

  const assignments = ((data as any) || []) as CustomFormAssignment[];
  if (input.targetType === 'cast_member' && (input.filledOutBy ?? 'assignee') === 'assignee') {
    await notifyCastMembersForAssignments({ assignments, senderId: user.id });
  }

  return { data: assignments, error: null };
}

export async function getMyFormAssignments(): Promise<any[]> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return [];
  }

  const [{ data: ownedAuditions }, { data: productionTeamAuditions }, { data: castAuditions }] = await Promise.all([
    supabase.from('auditions').select('audition_id').eq('user_id', user.id),
    supabase.from('production_team_members').select('audition_id').eq('user_id', user.id).eq('status', 'active'),
    supabase.from('cast_members').select('audition_id').eq('user_id', user.id),
  ]);

  const manageableAuditionIds = Array.from(
    new Set(
      ([] as string[])
        .concat((ownedAuditions || []).map((a: any) => a.audition_id))
        .concat((productionTeamAuditions || []).map((a: any) => a.audition_id))
        .concat((castAuditions || []).map((a: any) => a.audition_id))
    )
  );

  const baseQuery = supabase
    .from('custom_form_assignments')
    .select(`
      *,
      custom_forms (*)
    `)
    .order('created_at', { ascending: false });

  const { data: assignments, error } = manageableAuditionIds.length > 0
    ? await baseQuery.or(`target_type.neq.audition,and(target_type.eq.audition,target_id.in.(${manageableAuditionIds.join(',')}))`)
    : await baseQuery.neq('target_type', 'audition');

  if (error) {
    console.error('Error fetching my form assignments:', error);
    return [];
  }

  const list = ((assignments as any) || []) as Array<CustomFormAssignment & { custom_forms: CustomForm | null }>;

  const castMemberTargets = list
    .filter(a => a.target_type === 'cast_member' && a.filled_out_by === 'assignee')
    .map(a => a.target_id);

  let myCastMemberTargetIds = new Set<string>();
  if (castMemberTargets.length > 0) {
    const { data: castMembers } = await supabase
      .from('cast_members')
      .select('cast_member_id, user_id')
      .in('cast_member_id', castMemberTargets);

    myCastMemberTargetIds = new Set(
      (castMembers || [])
        .filter((cm: any) => cm.user_id === user.id)
        .map((cm: any) => cm.cast_member_id)
    );
  }

  const filtered = list.filter(a => {
    if (a.filled_out_by === 'production_team') {
      return true;
    }

    if (a.filled_out_by === 'assignee') {
      if (a.target_type === 'cast_member') {
        return myCastMemberTargetIds.has(a.target_id);
      }
      if (a.target_type === 'callback_slot') {
        return true;
      }
      if (a.target_type === 'audition') {
        return true;
      }
      return false;
    }

    return false;
  });

  const assignmentIds = filtered.map(a => a.assignment_id);

  let completedIds = new Set<string>();
  if (assignmentIds.length > 0) {
    const { data: responses } = await supabase
      .from('custom_form_responses')
      .select('assignment_id')
      .in('assignment_id', assignmentIds)
      .eq('respondent_user_id', user.id);

    completedIds = new Set((responses || []).map((r: any) => r.assignment_id));
  }

  return filtered.map(a => ({
    ...a,
    form: (a as any).custom_forms,
    is_complete: completedIds.has(a.assignment_id),
  }));
}

export async function getMyAuditionSignupFormAssignments(auditionId: string): Promise<any[]> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return [];
  }

  const { data: assignments, error } = await supabase
    .from('custom_form_assignments')
    .select(`
      *,
      custom_forms (*)
    `)
    .eq('target_type', 'audition')
    .eq('target_id', auditionId)
    .eq('required', true)
    .eq('filled_out_by', 'assignee')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching audition signup form assignments:', error);
    return [];
  }

  const list = ((assignments as any) || []) as Array<CustomFormAssignment & { custom_forms: CustomForm | null }>;
  const assignmentIds = list.map(a => a.assignment_id);

  let completedIds = new Set<string>();
  if (assignmentIds.length > 0) {
    const { data: responses } = await supabase
      .from('custom_form_responses')
      .select('assignment_id')
      .in('assignment_id', assignmentIds)
      .eq('respondent_user_id', user.id);

    completedIds = new Set((responses || []).map((r: any) => r.assignment_id));
  }

  return list.map(a => ({
    ...a,
    form: (a as any).custom_forms,
    is_complete: completedIds.has(a.assignment_id),
  }));
}

export async function getIncompleteRequiredAuditionForms(auditionId: string): Promise<{ incompleteAssignmentIds: string[]; error: any }> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { incompleteAssignmentIds: [], error: authError || new Error('Not authenticated') };
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('custom_form_assignments')
    .select('assignment_id')
    .eq('target_type', 'audition')
    .eq('target_id', auditionId)
    .eq('required', true)
    .eq('filled_out_by', 'assignee');

  if (assignmentsError) {
    return { incompleteAssignmentIds: [], error: assignmentsError };
  }

  const ids = (assignments || []).map((a: any) => a.assignment_id);
  if (ids.length === 0) {
    return { incompleteAssignmentIds: [], error: null };
  }

  const { data: responses, error: responsesError } = await supabase
    .from('custom_form_responses')
    .select('assignment_id')
    .in('assignment_id', ids)
    .eq('respondent_user_id', user.id);

  if (responsesError) {
    return { incompleteAssignmentIds: [], error: responsesError };
  }

  const completed = new Set((responses || []).map((r: any) => r.assignment_id));
  const incomplete = ids.filter(id => !completed.has(id));
  return { incompleteAssignmentIds: incomplete, error: null };
}

export async function getMySlotFormAssignments(slotId: string): Promise<any[]> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return [];
  }

  const { data: assignments, error } = await supabase
    .from('custom_form_assignments')
    .select(`
      *,
      custom_forms (*)
    `)
    .eq('target_type', 'audition_slot')
    .eq('target_id', slotId)
    .eq('filled_out_by', 'assignee')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching slot form assignments:', error);
    return [];
  }

  const list = ((assignments as any) || []) as Array<CustomFormAssignment & { custom_forms: CustomForm | null }>;
  const assignmentIds = list.map(a => a.assignment_id);

  let completedIds = new Set<string>();
  if (assignmentIds.length > 0) {
    const { data: responses } = await supabase
      .from('custom_form_responses')
      .select('assignment_id')
      .in('assignment_id', assignmentIds)
      .eq('respondent_user_id', user.id);

    completedIds = new Set((responses || []).map((r: any) => r.assignment_id));
  }

  return list.map(a => ({
    ...a,
    form: (a as any).custom_forms,
    is_complete: completedIds.has(a.assignment_id),
  }));
}

export async function getFormAssignmentWithForm(assignmentId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('custom_form_assignments')
    .select(`
      *,
      custom_forms (*)
    `)
    .eq('assignment_id', assignmentId)
    .single();

  if (error) {
    console.error('Error fetching custom form assignment:', error);
    return null;
  }

  return data as any;
}

export async function getIncompleteRequiredSlotForms(slotId: string): Promise<{ incompleteAssignmentIds: string[]; error: any }>{
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { incompleteAssignmentIds: [], error: authError || new Error('Not authenticated') };
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('custom_form_assignments')
    .select('assignment_id')
    .eq('target_type', 'audition_slot')
    .eq('target_id', slotId)
    .eq('required', true)
    .eq('filled_out_by', 'assignee');

  if (assignmentsError) {
    return { incompleteAssignmentIds: [], error: assignmentsError };
  }

  const ids = (assignments || []).map((a: any) => a.assignment_id);
  if (ids.length === 0) {
    return { incompleteAssignmentIds: [], error: null };
  }

  const { data: responses, error: responsesError } = await supabase
    .from('custom_form_responses')
    .select('assignment_id')
    .in('assignment_id', ids)
    .eq('respondent_user_id', user.id);

  if (responsesError) {
    return { incompleteAssignmentIds: [], error: responsesError };
  }

  const completed = new Set((responses || []).map((r: any) => r.assignment_id));
  const incomplete = ids.filter(id => !completed.has(id));
  return { incompleteAssignmentIds: incomplete, error: null };
}

function validateRequiredFields(fields: CustomFormField[], answers: Record<string, any>): { ok: true } | { ok: false; message: string } {
  for (const field of fields) {
    if (!field.required) continue;
    const value = answers[field.field_key];
    if (isEmptyAnswer(value)) {
      return { ok: false, message: `Missing required field: ${field.label}` };
    }
  }
  return { ok: true };
}

export async function getCustomForms(): Promise<CustomForm[]> {
  const { data, error } = await supabase
    .from('custom_forms')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom forms:', error);
    return [];
  }

  return (data as any) || [];
}

export async function getCustomForm(formId: string): Promise<CustomForm | null> {
  const { data, error } = await supabase
    .from('custom_forms')
    .select('*')
    .eq('form_id', formId)
    .single();

  if (error) {
    console.error('Error fetching custom form:', error);
    return null;
  }

  return data as any;
}

export async function createCustomForm(input: Omit<CustomFormInsert, 'owner_user_id'>): Promise<{ data: CustomForm | null; error: any }> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('custom_forms')
    .insert({
      owner_user_id: user.id,
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? 'draft',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating custom form:', error);
    return { data: null, error };
  }

  return { data: data as any, error: null };
}

export async function updateCustomForm(formId: string, updates: CustomFormUpdate): Promise<{ data: CustomForm | null; error: any }> {
  const { data, error } = await supabase
    .from('custom_forms')
    .update(updates)
    .eq('form_id', formId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating custom form:', error);
    return { data: null, error };
  }

  return { data: data as any, error: null };
}

export async function deleteCustomForm(formId: string): Promise<{ error: any }> {
  const { error } = await supabase.from('custom_forms').delete().eq('form_id', formId);
  if (error) {
    console.error('Error deleting custom form:', error);
    return { error };
  }
  return { error: null };
}

export async function getCustomFormFields(formId: string): Promise<CustomFormField[]> {
  const { data, error } = await supabase
    .from('custom_form_fields')
    .select('*')
    .eq('form_id', formId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching custom form fields:', error);
    return [];
  }

  return (data as any) || [];
}

export async function createCustomFormField(input: CustomFormFieldInsert): Promise<{ data: CustomFormField | null; error: any }> {
  const { data, error } = await supabase
    .from('custom_form_fields')
    .insert({
      ...input,
      required: input.required ?? false,
      help_text: input.help_text ?? null,
      options: (input.options as any) ?? null,
      sort_order: input.sort_order ?? 0,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating custom form field:', error);
    return { data: null, error };
  }

  return { data: data as any, error: null };
}

export async function updateCustomFormField(fieldId: string, updates: CustomFormFieldUpdate): Promise<{ data: CustomFormField | null; error: any }> {
  const { data, error } = await supabase
    .from('custom_form_fields')
    .update({
      ...updates,
      help_text: updates.help_text ?? undefined,
      options: (updates.options as any) ?? undefined,
    })
    .eq('field_id', fieldId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating custom form field:', error);
    return { data: null, error };
  }

  return { data: data as any, error: null };
}

export async function deleteCustomFormField(fieldId: string): Promise<{ error: any }> {
  const { error } = await supabase.from('custom_form_fields').delete().eq('field_id', fieldId);
  if (error) {
    console.error('Error deleting custom form field:', error);
    return { error };
  }
  return { error: null };
}

export async function getCustomFormAssignmentsForTarget(targetType: CustomFormTargetType, targetId: string): Promise<CustomFormAssignment[]> {
  const { data, error } = await supabase
    .from('custom_form_assignments')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId);

  if (error) {
    console.error('Error fetching custom form assignments:', error);
    return [];
  }

  return (data as any) || [];
}

export async function assignCustomFormToTarget(input: Omit<CustomFormAssignmentInsert, 'created_by'>): Promise<{ data: CustomFormAssignment | null; error: any }> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('custom_form_assignments')
    .insert({
      ...input,
      required: input.required ?? true,
      filled_out_by: input.filled_out_by ?? 'assignee',
      created_by: user.id,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating custom form assignment:', error);
    return { data: null, error };
  }

  return { data: data as any, error: null };
}

export async function updateCustomFormAssignment(assignmentId: string, updates: CustomFormAssignmentUpdate): Promise<{ data: CustomFormAssignment | null; error: any }> {
  const { data, error } = await supabase
    .from('custom_form_assignments')
    .update(updates)
    .eq('assignment_id', assignmentId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating custom form assignment:', error);
    return { data: null, error };
  }

  return { data: data as any, error: null };
}

export async function deleteCustomFormAssignment(assignmentId: string): Promise<{ error: any }> {
  const { error } = await supabase.from('custom_form_assignments').delete().eq('assignment_id', assignmentId);
  if (error) {
    console.error('Error deleting custom form assignment:', error);
    return { error };
  }
  return { error: null };
}

export async function getCustomFormResponseForAssignment(assignmentId: string): Promise<CustomFormResponse | null> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from('custom_form_responses')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('respondent_user_id', user.id)
    .single();

  if (error) {
    return null;
  }

  return data as any;
}

export async function submitCustomFormResponse(input: {
  assignmentId: string;
  answers: Record<string, any>;
}): Promise<{ data: CustomFormResponse | null; error: any }> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('custom_form_assignments')
    .select('assignment_id, form_id, target_type, target_id')
    .eq('assignment_id', input.assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return { data: null, error: assignmentError || new Error('Assignment not found') };
  }

  const fields = await getCustomFormFields((assignment as any).form_id);
  const validation = validateRequiredFields(fields, input.answers);
  if (!validation.ok) {
    return { data: null, error: new Error(validation.message) };
  }

  const payload = {
    assignment_id: input.assignmentId,
    form_id: (assignment as any).form_id,
    target_type: (assignment as any).target_type,
    target_id: (assignment as any).target_id,
    respondent_user_id: user.id,
    answers: input.answers as unknown as Json,
    submitted_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('custom_form_responses')
    .upsert(payload, { onConflict: 'assignment_id,respondent_user_id' })
    .select('*')
    .single();

  if (error) {
    console.error('Error submitting custom form response:', error);
    return { data: null, error };
  }

  return { data: data as any, error: null };
}
