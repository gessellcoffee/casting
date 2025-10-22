import { supabase } from './client';
import type { UserResume, UserResumeInsert, UserResumeUpdate } from './types';
import { createApprovalRequest } from './companyApprovals';

/**
 * Get all resume entries for a user
 */
export async function getUserResumes(userId: string): Promise<UserResume[]> {
  const { data, error } = await supabase
    .from('user_resume')
    .select('*')
    .eq('user_id', userId)
    .order('date_of_production', { ascending: false });

  if (error) {
    console.error('Error fetching user resumes:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single resume entry by ID
 */
export async function getResumeEntry(resumeEntryId: string): Promise<UserResume | null> {
  const { data, error } = await supabase
    .from('user_resume')
    .select('*')
    .eq('resume_entry_id', resumeEntryId)
    .single();

  if (error) {
    console.error('Error fetching resume entry:', error);
    return null;
  }

  return data;
}

/**
 * Create a new resume entry
 */
export async function createResumeEntry(
  resumeData: UserResumeInsert
): Promise<{ data: UserResume | null; error: any }> {
  console.log('createResumeEntry called with data:', resumeData);
  
  // Verify the authenticated user matches the userId being created
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  console.log('Authenticated user:', user.id);

  // Authorization check: user can only create their own resume entries
  if (user.id !== resumeData.user_id) {
    const unauthorizedError = new Error('Unauthorized: You can only create your own resume entries');
    console.error('Authorization failed:', { authenticatedUserId: user.id, requestedUserId: resumeData.user_id });
    return { data: null, error: unauthorizedError };
  }

  console.log('About to insert into database...');
  const { data, error } = await supabase
    .from('user_resume')
    .insert(resumeData)
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return { data: null, error };
  }

  console.log('Successfully created resume entry:', data);

  // If a company_id was provided, create an approval request
  if (data && resumeData.company_id) {
    console.log('Creating approval request for company:', resumeData.company_id);
    const { error: approvalError } = await createApprovalRequest(
      data.resume_entry_id,
      resumeData.company_id,
      user.id
    );

    if (approvalError) {
      console.error('Error creating approval request:', approvalError);
      // Don't fail the entire operation if approval request fails
    }
  }

  return { data, error: null };
}

/**
 * Update a resume entry
 */
export async function updateResumeEntry(
  resumeEntryId: string,
  updates: UserResumeUpdate
): Promise<{ data: UserResume | null; error: any }> {
  // Verify the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // First, get the existing resume entry to verify ownership
  const existingEntry = await getResumeEntry(resumeEntryId);
  
  if (!existingEntry) {
    const notFoundError = new Error('Resume entry not found');
    console.error('Resume entry not found:', resumeEntryId);
    return { data: null, error: notFoundError };
  }

  // Authorization check: user can only update their own resume entries
  if (user.id !== existingEntry.user_id) {
    const unauthorizedError = new Error('Unauthorized: You can only update your own resume entries');
    console.error('Authorization failed:', { authenticatedUserId: user.id, entryUserId: existingEntry.user_id });
    return { data: null, error: unauthorizedError };
  }

  const { data, error } = await supabase
    .from('user_resume')
    .update(updates)
    .eq('resume_entry_id', resumeEntryId)
    .select()
    .single();

  if (error) {
    console.error('Error updating resume entry:', error);
    return { data: null, error };
  }

  // If company_id was updated and is different from before, create a new approval request
  if (data && updates.company_id && updates.company_id !== existingEntry.company_id) {
    console.log('Company changed, creating new approval request');
    const { error: approvalError } = await createApprovalRequest(
      data.resume_entry_id,
      updates.company_id,
      user.id
    );

    if (approvalError) {
      console.error('Error creating approval request:', approvalError);
      // Don't fail the entire operation if approval request fails
    }

    // Reset approval status since it's a new company
    await supabase
      .from('user_resume')
      .update({ company_approved: null })
      .eq('resume_entry_id', resumeEntryId);
  }

  return { data, error: null };
}

/**
 * Delete a resume entry
 */
export async function deleteResumeEntry(
  resumeEntryId: string
): Promise<{ success: boolean; error: any }> {
  // Verify the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { success: false, error: authError || new Error('Not authenticated') };
  }

  // First, get the existing resume entry to verify ownership
  const existingEntry = await getResumeEntry(resumeEntryId);
  
  if (!existingEntry) {
    const notFoundError = new Error('Resume entry not found');
    console.error('Resume entry not found:', resumeEntryId);
    return { success: false, error: notFoundError };
  }

  // Authorization check: user can only delete their own resume entries
  if (user.id !== existingEntry.user_id) {
    const unauthorizedError = new Error('Unauthorized: You can only delete your own resume entries');
    console.error('Authorization failed:', { authenticatedUserId: user.id, entryUserId: existingEntry.user_id });
    return { success: false, error: unauthorizedError };
  }

  const { error } = await supabase
    .from('user_resume')
    .delete()
    .eq('resume_entry_id', resumeEntryId);

  if (error) {
    console.error('Error deleting resume entry:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}
