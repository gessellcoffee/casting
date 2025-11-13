import { supabase } from './client';
import type { Profile } from './types';

/**
 * Look up a user by email address
 * Returns the user profile if found, null otherwise
 */
export async function getUserByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error) {
    // User not found is expected, don't log as error
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error looking up user by email:', error);
    return null;
  }

  return data;
}

/**
 * Check if an email exists in the system
 */
export async function emailExists(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return user !== null;
}

/**
 * Minimal profile info for search results
 */
export interface ProfileSearchResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  profile_photo_url: string | null;
}

/**
 * Search for users by name or email
 * Returns up to 10 matching profiles
 */
export async function searchUsers(query: string): Promise<ProfileSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, profile_photo_url')
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .limit(10);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return data || [];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
