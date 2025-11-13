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
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
