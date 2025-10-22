import { supabase } from './client';
import type { Audition, AuditionInsert, AuditionUpdate } from './types';

/**
 * Get an audition by ID
 */
export async function getAudition(auditionId: string): Promise<Audition | null> {
  const { data, error } = await supabase
    .from('auditions')
    .select('*')
    .eq('audition_id', auditionId)
    .single();

  if (error) {
    console.error('Error fetching audition:', error);
    return null;
  }

  return data;
}

/**
 * Get audition with related show and company data
 */
export async function getAuditionWithDetails(auditionId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('auditions')
    .select(`
      *,
      shows (
        show_id,
        title,
        author,
        description
      ),
      companies (
        company_id,
        name
      )
    `)
    .eq('audition_id', auditionId)
    .single();

  if (error) {
    console.error('Error fetching audition with details:', error);
    return null;
  }

  return data;
}

/**
 * Get all auditions for a specific show
 */
export async function getShowAuditions(showId: string): Promise<Audition[]> {
  const { data, error } = await supabase
    .from('auditions')
    .select('*')
    .eq('show_id', showId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching show auditions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all auditions created by a specific user
 */
export async function getUserAuditions(userId: string): Promise<Audition[]> {
  const { data, error } = await supabase
    .from('auditions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user auditions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all auditions for a specific company
 */
export async function getCompanyAuditions(companyId: string): Promise<Audition[]> {
  const { data, error } = await supabase
    .from('auditions')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching company auditions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all active auditions (for browsing)
 */
export async function getAllAuditions(limit: number = 50): Promise<Audition[]> {
  const { data, error } = await supabase
    .from('auditions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching all auditions:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new audition
 */
export async function createAudition(
  auditionData: AuditionInsert
): Promise<{ data: Audition | null; error: any }> {
  // Verify the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Set the user_id to the authenticated user
  const dataToInsert = {
    ...auditionData,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('auditions')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    console.error('Error creating audition:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update an audition
 */
export async function updateAudition(
  auditionId: string,
  updates: AuditionUpdate
): Promise<{ data: Audition | null; error: any }> {
  // Verify the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // First, verify the user owns this audition
  const audition = await getAudition(auditionId);
  
  if (!audition) {
    const notFoundError = new Error('Audition not found');
    console.error('Audition not found:', auditionId);
    return { data: null, error: notFoundError };
  }

  // Authorization check: user can only update their own auditions
  if (audition.user_id !== user.id) {
    const unauthorizedError = new Error('Unauthorized: You can only update your own auditions');
    console.error('Authorization failed:', { 
      authenticatedUserId: user.id, 
      auditionUserId: audition.user_id 
    });
    return { data: null, error: unauthorizedError };
  }

  const { data, error } = await supabase
    .from('auditions')
    .update(updates)
    .eq('audition_id', auditionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating audition:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Delete an audition
 */
export async function deleteAudition(
  auditionId: string
): Promise<{ error: any }> {
  // Verify the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { error: authError || new Error('Not authenticated') };
  }

  // First, verify the user owns this audition
  const audition = await getAudition(auditionId);
  
  if (!audition) {
    const notFoundError = new Error('Audition not found');
    console.error('Audition not found:', auditionId);
    return { error: notFoundError };
  }

  // Authorization check: user can only delete their own auditions
  if (audition.user_id !== user.id) {
    const unauthorizedError = new Error('Unauthorized: You can only delete your own auditions');
    console.error('Authorization failed:', { 
      authenticatedUserId: user.id, 
      auditionUserId: audition.user_id 
    });
    return { error: unauthorizedError };
  }

  const { error } = await supabase
    .from('auditions')
    .delete()
    .eq('audition_id', auditionId);

  if (error) {
    console.error('Error deleting audition:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Mark audition slots as filled
 */
export async function markAuditionSlotsFilled(
  auditionId: string,
  filled: boolean
): Promise<{ error: any }> {
  const { error } = await updateAudition(auditionId, { show_filled_slots: filled });
  
  if (error) {
    return { error };
  }

  return { error: null };
}

/**
 * Search auditions by show title
 */
export async function searchAuditions(searchTerm: string, limit: number = 20): Promise<any[]> {
  const { data, error } = await supabase
    .from('auditions')
    .select(`
      *,
      shows (
        show_id,
        title,
        author,
        description
      )
    `)
    .ilike('shows.title', `%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching auditions:', error);
    return [];
  }

  return data || [];
}
