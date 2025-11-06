import { supabase } from './client';
import { getAuthenticatedUser } from './auth';
import type { Profile, ProfileUpdate, ProfileInsert } from './types';

/**
 * Get the current user's profile
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Update the current user's profile
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<{ data: Profile | null; error: any }> {
  // Verify the authenticated user matches the userId being updated
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Authorization check: user can only update their own profile
  if (user.id !== userId) {
    const unauthorizedError = new Error('Unauthorized: You can only update your own profile');
    console.error('Authorization failed:', { authenticatedUserId: user.id, requestedUserId: userId });
    return { data: null, error: unauthorizedError };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Create a new profile (typically called after user signup)
 */
export async function createProfile(
  userId: string,
  email: string,
  additionalData?: Partial<ProfileInsert>
): Promise<{ data: Profile | null; error: any }> {
  const profileData = {
    id: userId,
    email,
    ...additionalData,
  } as ProfileInsert;

  const { data, error } = (await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single()) as { data: Profile | null; error: any };

  if (error) {
    console.error('Error creating profile:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Check if an email is available
 */
export async function isEmailAvailable(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();

  // If there's an error and it's not a "not found" error, return false
  if (error && error.code !== 'PGRST116') {
    return false;
  }

  // If data exists, email is taken
  return !data;
}
