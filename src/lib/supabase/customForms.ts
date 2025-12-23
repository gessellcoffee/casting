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
    .select(`
      *,
      custom_forms (
        form_id,
        name,
        description,
        status
      )
    `)
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
  // Return null if assignmentId is undefined/null
  if (!assignmentId) {
    return null;
  }

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
  console.log('🔧 submitCustomFormResponse called with:', input);
  
  // Return error if assignmentId is undefined/null
  if (!input.assignmentId) {
    console.error('❌ Assignment ID is missing');
    return { data: null, error: new Error('Assignment ID is required') };
  }

  const { user, error: authError } = await getAuthenticatedUser();
  console.log('👤 Auth check result:', { user: user?.id, authError });
  if (authError || !user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  console.log('🔍 Fetching assignment details...');
  const { data: assignment, error: assignmentError } = await supabase
    .from('custom_form_assignments')
    .select('assignment_id, form_id, target_type, target_id')
    .eq('assignment_id', input.assignmentId)
    .single();

  console.log('📋 Assignment fetch result:', { assignment, assignmentError });

  if (assignmentError || !assignment) {
    return { data: null, error: assignmentError || new Error('Assignment not found') };
  }

  console.log('📋 Validating form fields...');
  const fields = await getCustomFormFields((assignment as any).form_id);
  console.log('📝 Form fields:', fields);
  
  const validation = validateRequiredFields(fields, input.answers);
  console.log('✅ Validation result:', validation);
  if (!validation.ok) {
    console.error('❌ Validation failed:', validation.message);
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
  
  console.log('📤 Payload to insert:', payload);

  const { data, error } = await supabase
    .from('custom_form_responses')
    .upsert(payload, { onConflict: 'assignment_id,respondent_user_id' })
    .select('*')
    .single();

  console.log('💾 Database upsert result:', { data, error });

  if (error) {
    console.error('❌ Error submitting custom form response:', error);
    return { data: null, error };
  }

  console.log('✅ Form response submitted successfully!');
  return { data: data as any, error: null };
}

// Context resolution functions for dynamic field types
export async function getRolesForContext(auditionId?: string, productionId?: string): Promise<{ data: string[] | null; error: any }> {
  try {
    if (auditionId) {
      // Get roles from audition_roles table
      const { data: auditionRoles, error } = await supabase
        .from('audition_roles')
        .select('role_name')
        .eq('audition_id', auditionId)
        .order('role_name', { ascending: true });

      if (error) {
        return { data: null, error };
      }

      const roles = (auditionRoles || []).map(role => role.role_name);
      return { data: roles, error: null };
    }

    if (productionId) {
      // Get roles from production
      const { data: production, error } = await supabase
        .from('productions')
        .select('role_list')
        .eq('production_id', productionId)
        .single();

      if (error) {
        return { data: null, error };
      }

      const roles = production?.role_list || [];
      return { data: Array.isArray(roles) ? roles : [], error: null };
    }

    return { data: null, error: new Error('No audition or production context provided for role list field') };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getCastMembersForContext(productionId?: string): Promise<{ data: string[] | null; error: any }> {
  try {
    if (!productionId) {
      return { data: null, error: new Error('No production context provided for cast members field') };
    }

    // Get cast members from production
    const { data: castMembers, error } = await supabase
      .from('cast_members')
      .select(`
        user_id,
        profiles!inner(first_name, last_name)
      `)
      .eq('production_id', productionId);

    if (error) {
      return { data: null, error };
    }

    const memberNames = castMembers?.map((member: any) => 
      `${member.profiles.first_name} ${member.profiles.last_name}`.trim()
    ) || [];

    return { data: memberNames, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

// Function to validate if a form can be assigned to a specific context
export function validateFormContextCompatibility(fields: any[], targetType: string, targetId: string): { compatible: boolean; error?: string } {
  const dynamicFieldTypes = [
    'role_list_single_select',
    'role_list_multi_select', 
    'cast_members_single_select',
    'cast_members_multi_select'
  ];

  const hasDynamicFields = fields.some(field => dynamicFieldTypes.includes(field.field_type));
  
  if (!hasDynamicFields) {
    return { compatible: true };
  }

  const hasRoleFields = fields.some(field => 
    field.field_type === 'role_list_single_select' || field.field_type === 'role_list_multi_select'
  );
  
  const hasCastFields = fields.some(field =>
    field.field_type === 'cast_members_single_select' || field.field_type === 'cast_members_multi_select'
  );

  // Role fields require audition or production context
  if (hasRoleFields && targetType !== 'audition' && targetType !== 'production') {
    return { 
      compatible: false, 
      error: 'This form contains role selection fields and can only be assigned to auditions or productions.' 
    };
  }

  // Cast member fields require production context
  if (hasCastFields && targetType !== 'production') {
    return { 
      compatible: false, 
      error: 'This form contains cast member selection fields and can only be assigned to productions.' 
    };
  }

  return { compatible: true };
}

// Function to check if user has forms management access (production member or audition owner)
export async function checkUserFormsAccess(userId: string): Promise<{ hasAccess: boolean; error: any }> {
  try {
    // Check if user owns any auditions
    const { data: ownedAuditions, error: auditionError } = await supabase
      .from('auditions')
      .select('audition_id')
      .eq('user_id', userId)
      .limit(1);

    if (auditionError) {
      console.error('Error checking owned auditions:', auditionError);
      return { hasAccess: false, error: auditionError };
    }

    if (ownedAuditions && ownedAuditions.length > 0) {
      return { hasAccess: true, error: null };
    }

    // Check if user is a production team member
    const { data: productionMemberships, error: membershipError } = await supabase
      .from('production_team_members')
      .select('audition_id')
      .eq('user_id', userId)
      .limit(1);

    if (membershipError) {
      console.error('Error checking production memberships:', membershipError);
      return { hasAccess: false, error: membershipError };
    }

    const hasAccess = (productionMemberships && productionMemberships.length > 0);
    return { hasAccess, error: null };

  } catch (err) {
    console.error('Error in checkUserFormsAccess:', err);
    return { hasAccess: false, error: err };
  }
}

// Function to get user's form responses for a specific audition
export async function getUserFormResponsesForAudition(auditionId: string, userId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data: responses, error } = await supabase
      .from('custom_form_responses')
      .select(`
        *,
        custom_form_assignments!inner(
          assignment_id,
          form_id,
          target_type,
          target_id,
          required,
          custom_forms(
            form_id,
            name,
            description
          )
        )
      `)
      .eq('respondent_user_id', userId)
      .eq('custom_form_assignments.target_type', 'audition')
      .eq('custom_form_assignments.target_id', auditionId);

    if (error) {
      console.error('Error fetching user form responses:', error);
      return { data: null, error };
    }

    return { data: responses || [], error: null };
  } catch (err) {
    console.error('Error in getUserFormResponsesForAudition:', err);
    return { data: null, error: err };
  }
}

// Enhanced form assignment functions for workflow integration

export async function assignFormsOnAuditionSignup(auditionId: string, userId: string): Promise<{ error: any }> {
  try {
    // Get audition's required signup forms
    const { data: audition, error: auditionError } = await supabase
      .from('auditions')
      .select('required_signup_forms')
      .eq('audition_id', auditionId)
      .single();

    if (auditionError || !audition) {
      return { error: auditionError || new Error('Audition not found') };
    }

    const requiredFormIds = audition.required_signup_forms || [];
    if (requiredFormIds.length === 0) {
      return { error: null }; // No forms required
    }

    // Check if user already has these forms assigned
    const { data: existingAssignments } = await supabase
      .from('custom_form_assignments')
      .select('form_id')
      .eq('target_type', 'audition')
      .eq('target_id', auditionId)
      .eq('filled_out_by', 'assignee');

    const existingFormIds = new Set((existingAssignments || []).map((a: any) => a.form_id));
    const newFormIds = requiredFormIds.filter((formId: string) => !existingFormIds.has(formId));

    if (newFormIds.length === 0) {
      return { error: null }; // All forms already assigned
    }

    // Assign new forms to user for this audition
    const assignments = newFormIds.map((formId: string) => ({
      form_id: formId,
      target_type: 'audition' as CustomFormTargetType,
      target_id: auditionId,
      required: true,
      filled_out_by: 'assignee' as CustomFormFilledOutBy,
      created_by: userId,
    }));

    const { error: assignError } = await supabase
      .from('custom_form_assignments')
      .upsert(assignments, { onConflict: 'form_id,target_type,target_id' });

    if (assignError) {
      return { error: assignError };
    }

    // Send notifications for new form assignments
    await Promise.all(
      newFormIds.map(async (formId: string) => {
        const { data: form } = await supabase
          .from('custom_forms')
          .select('name')
          .eq('form_id', formId)
          .single();

        const { data: auditionData } = await supabase
          .from('auditions')
          .select('shows(title)')
          .eq('audition_id', auditionId)
          .single();

        const formName = form?.name || 'Form';
        const showTitle = (auditionData as any)?.shows?.title || 'Production';

        await createNotification({
          recipient_id: userId,
          sender_id: userId, // System assignment
          type: 'general',
          title: 'Required form for audition',
          message: `Please complete the "${formName}" form for ${showTitle} before your audition.`,
          action_url: `/my-forms?auditionId=${auditionId}`,
          link_url: `/my-forms?auditionId=${auditionId}`,
          reference_id: auditionId,
          reference_type: 'audition',
          is_actionable: true,
        });
      })
    );

    return { error: null };
  } catch (error) {
    console.error('Error assigning forms on audition signup:', error);
    return { error };
  }
}

export async function assignFormsOnCallbackInvitation(auditionId: string, userId: string): Promise<{ error: any }> {
  try {
    // Get audition's required callback forms
    const { data: audition, error: auditionError } = await supabase
      .from('auditions')
      .select('required_callback_forms')
      .eq('audition_id', auditionId)
      .single();

    if (auditionError || !audition) {
      return { error: auditionError || new Error('Audition not found') };
    }

    const requiredFormIds = audition.required_callback_forms || [];
    if (requiredFormIds.length === 0) {
      return { error: null }; // No forms required
    }

    // Check if user already has these forms assigned
    const { data: existingAssignments } = await supabase
      .from('custom_form_assignments')
      .select('form_id')
      .eq('target_type', 'audition')
      .eq('target_id', auditionId)
      .eq('filled_out_by', 'assignee');

    const existingFormIds = new Set((existingAssignments || []).map((a: any) => a.form_id));
    const newFormIds = requiredFormIds.filter((formId: string) => !existingFormIds.has(formId));

    if (newFormIds.length === 0) {
      return { error: null }; // All forms already assigned
    }

    // Assign new forms to user for this audition
    const assignments = newFormIds.map((formId: string) => ({
      form_id: formId,
      target_type: 'audition' as CustomFormTargetType,
      target_id: auditionId,
      required: true,
      filled_out_by: 'assignee' as CustomFormFilledOutBy,
      created_by: userId,
    }));

    const { error: assignError } = await supabase
      .from('custom_form_assignments')
      .upsert(assignments, { onConflict: 'form_id,target_type,target_id' });

    if (assignError) {
      return { error: assignError };
    }

    // Send notifications for new form assignments
    await Promise.all(
      newFormIds.map(async (formId: string) => {
        const { data: form } = await supabase
          .from('custom_forms')
          .select('name')
          .eq('form_id', formId)
          .single();

        const { data: auditionData } = await supabase
          .from('auditions')
          .select('shows(title)')
          .eq('audition_id', auditionId)
          .single();

        const formName = form?.name || 'Form';
        const showTitle = (auditionData as any)?.shows?.title || 'Production';

        await createNotification({
          recipient_id: userId,
          sender_id: userId, // System assignment
          type: 'general',
          title: 'Required form for callback',
          message: `Please complete the "${formName}" form for your ${showTitle} callback.`,
          action_url: `/my-forms?auditionId=${auditionId}`,
          link_url: `/my-forms?auditionId=${auditionId}`,
          reference_id: auditionId,
          reference_type: 'audition',
          is_actionable: true,
        });
      })
    );

    return { error: null };
  } catch (error) {
    console.error('Error assigning forms on callback invitation:', error);
    return { error };
  }
}

export async function getIncompleteRequiredCallbackForms(auditionId: string): Promise<{ incompleteAssignmentIds: string[]; error: any }> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { incompleteAssignmentIds: [], error: authError || new Error('Not authenticated') };
  }

  // Get audition's required callback forms
  const { data: audition, error: auditionError } = await supabase
    .from('auditions')
    .select('required_callback_forms')
    .eq('audition_id', auditionId)
    .single();

  if (auditionError || !audition) {
    return { incompleteAssignmentIds: [], error: auditionError || new Error('Audition not found') };
  }

  const requiredFormIds = audition.required_callback_forms || [];
  if (requiredFormIds.length === 0) {
    return { incompleteAssignmentIds: [], error: null };
  }

  // Get assignments for these forms
  const { data: assignments, error: assignmentsError } = await supabase
    .from('custom_form_assignments')
    .select('assignment_id, form_id')
    .eq('target_type', 'audition')
    .eq('target_id', auditionId)
    .eq('required', true)
    .eq('filled_out_by', 'assignee')
    .in('form_id', requiredFormIds);

  if (assignmentsError) {
    return { incompleteAssignmentIds: [], error: assignmentsError };
  }

  const assignmentIds = (assignments || []).map((a: any) => a.assignment_id);
  if (assignmentIds.length === 0) {
    return { incompleteAssignmentIds: [], error: null };
  }

  // Check which forms are completed
  const { data: responses, error: responsesError } = await supabase
    .from('custom_form_responses')
    .select('assignment_id')
    .in('assignment_id', assignmentIds)
    .eq('respondent_user_id', user.id);

  if (responsesError) {
    return { incompleteAssignmentIds: [], error: responsesError };
  }

  const completed = new Set((responses || []).map((r: any) => r.assignment_id));
  const incomplete = assignmentIds.filter(id => !completed.has(id));
  return { incompleteAssignmentIds: incomplete, error: null };
}

export async function sendFormToUsers(input: {
  formId: string;
  userIds: string[];
  auditionId?: string;
  message?: string;
}): Promise<{ error: any }> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { error: authError || new Error('Not authenticated') };
  }

  try {
    // Get form details
    const { data: form, error: formError } = await supabase
      .from('custom_forms')
      .select('name, description')
      .eq('form_id', input.formId)
      .single();

    if (formError || !form) {
      return { error: formError || new Error('Form not found') };
    }

    // Create assignments for each user
    const assignments = input.userIds.map(userId => ({
      form_id: input.formId,
      target_type: 'audition' as CustomFormTargetType,
      target_id: input.auditionId || 'manual',
      required: false, // Manual assignments are not required by default
      filled_out_by: 'assignee' as CustomFormFilledOutBy,
      created_by: user.id,
    }));

    const { error: assignError } = await supabase
      .from('custom_form_assignments')
      .upsert(assignments, { onConflict: 'form_id,target_type,target_id' });

    if (assignError) {
      return { error: assignError };
    }

    // Send notifications to each user
    await Promise.all(
      input.userIds.map(async (userId) => {
        const customMessage = input.message || `You have been assigned the form "${form.name}". Please complete it at your earliest convenience.`;
        
        await createNotification({
          recipient_id: userId,
          sender_id: user.id,
          type: 'general',
          title: 'New form assigned',
          message: customMessage,
          action_url: `/my-forms`,
          link_url: `/my-forms`,
          reference_id: input.formId,
          reference_type: 'custom_form',
          is_actionable: true,
        });
      })
    );

    return { error: null };
  } catch (error) {
    console.error('Error sending form to users:', error);
    return { error };
  }
}
