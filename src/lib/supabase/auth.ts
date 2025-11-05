import { supabase } from './client';

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with OAuth provider (Google, GitHub, etc.)
 */
export async function signInWithOAuth(provider: 'google' | 'github' | 'gitlab' | 'bitbucket') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current user session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Get the current user
 * Returns null if no session exists (user not logged in)
 */
export async function getUser() {
  // First check if there's a session to avoid "Auth session missing!" errors
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return null;
  }
  
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) throw error;
  return data;
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Get authenticated user for authorization checks
 * This is specifically for server-side authorization in API functions
 * Returns { user, error } instead of throwing to allow graceful handling
 */
export async function getAuthenticatedUser() {
  // First check if there's a session to avoid "Auth session missing!" errors
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { user: null, error: new Error('Not authenticated') };
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
