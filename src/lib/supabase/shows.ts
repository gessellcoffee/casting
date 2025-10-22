import { supabase } from './client';
import type { Show, ShowInsert, ShowUpdate } from './types';

/**
 * Get a show by ID
 */
export async function getShow(showId: string): Promise<Show | null> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .eq('show_id', showId)
    .single();

  if (error) {
    console.error('Error fetching show:', error);
    return null;
  }

  return data;
}

/**
 * Get all shows created by a specific user
 */
export async function getUserShows(userId: string): Promise<Show[]> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .eq('creator_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user shows:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all shows (for dropdown selection)
 */
export async function getAllShows(): Promise<Show[]> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching all shows:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new show
 */
export async function createShow(
  showData: ShowInsert
): Promise<{ data: Show | null; error: any }> {
  // Verify the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Set the creator_user_id to the authenticated user if not provided
  const dataToInsert = {
    ...showData,
    creator_user_id: showData.creator_user_id || user.id,
  };

  const { data, error } = await supabase
    .from('shows')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    console.error('Error creating show:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update a show
 */
export async function updateShow(
  showId: string,
  updates: ShowUpdate
): Promise<{ data: Show | null; error: any }> {
  // Verify the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // First, verify the user owns this show
  const show = await getShow(showId);
  
  if (!show) {
    const notFoundError = new Error('Show not found');
    console.error('Show not found:', showId);
    return { data: null, error: notFoundError };
  }

  // Authorization check: user can only update their own shows
  if (show.creator_user_id && show.creator_user_id !== user.id) {
    const unauthorizedError = new Error('Unauthorized: You can only update your own shows');
    console.error('Authorization failed:', { 
      authenticatedUserId: user.id, 
      showCreatorId: show.creator_user_id 
    });
    return { data: null, error: unauthorizedError };
  }

  const { data, error } = await supabase
    .from('shows')
    .update(updates)
    .eq('show_id', showId)
    .select()
    .single();

  if (error) {
    console.error('Error updating show:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Delete a show
 */
export async function deleteShow(
  showId: string
): Promise<{ error: any }> {
  // Verify the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { error: authError || new Error('Not authenticated') };
  }

  // First, verify the user owns this show
  const show = await getShow(showId);
  
  if (!show) {
    const notFoundError = new Error('Show not found');
    console.error('Show not found:', showId);
    return { error: notFoundError };
  }

  // Authorization check: user can only delete their own shows
  if (show.creator_user_id && show.creator_user_id !== user.id) {
    const unauthorizedError = new Error('Unauthorized: You can only delete your own shows');
    console.error('Authorization failed:', { 
      authenticatedUserId: user.id, 
      showCreatorId: show.creator_user_id 
    });
    return { error: unauthorizedError };
  }

  const { error } = await supabase
    .from('shows')
    .delete()
    .eq('show_id', showId);

  if (error) {
    console.error('Error deleting show:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Search shows by title
 */
export async function searchShows(searchTerm: string): Promise<Show[]> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .ilike('title', `%${searchTerm}%`)
    .order('title', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error searching shows:', error);
    return [];
  }

  return data || [];
}
