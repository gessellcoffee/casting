// =============================================
// PENDING SIGNUPS API
// =============================================
// Functions for managing pending signup invitations

import { supabase } from './client';
import type { 
  PendingSignupRow, 
  PendingSignupInsert, 
  PendingSignupWithInviter,
  PendingSignupStats,
  PendingSignupRequestType
} from '@/types/pendingSignup';

/**
 * Create a new pending signup invitation
 */
export async function createPendingSignup(
  data: PendingSignupInsert
): Promise<{ data: PendingSignupRow | null; error: any }> {
  try {
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Ensure invited_by matches authenticated user
    if (data.invited_by !== user.id) {
      return { data: null, error: new Error('Unauthorized') };
    }

    // Normalize email to lowercase
    const normalizedEmail = data.email.toLowerCase().trim();

    // Check if user already exists with this email
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', normalizedEmail)
      .single();

    if (existingUser) {
      return { 
        data: null, 
        error: new Error('A user with this email already exists. Please use the regular invitation flow.') 
      };
    }

    // Create pending signup
    const { data: pendingSignup, error } = await supabase
      .from('pending_signups' as any)
      .insert({
        email: normalizedEmail,
        request_type: data.request_type,
        request_data: data.request_data,
        invited_by: data.invited_by
      })
      .select()
      .single() as any;

    if (error) {
      console.error('Error creating pending signup:', error);
      return { data: null, error };
    }

    return { data: pendingSignup as PendingSignupRow, error: null };
  } catch (error) {
    console.error('Error in createPendingSignup:', error);
    return { data: null, error };
  }
}

/**
 * Get all pending signups created by the current user
 */
export async function getUserPendingSignups(
  includeCompleted: boolean = false
): Promise<{ data: PendingSignupWithInviter[] | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    let query = supabase
      .from('pending_signups' as any)
      .select(`
        *,
        inviter_profile:profiles!pending_signups_invited_by_fkey(
          first_name,
          last_name,
          email,
          profile_photo_url
        )
      `)
      .eq('invited_by', user.id)
      .order('created_at', { ascending: false }) as any;

    // Filter out completed/cancelled/expired if requested
    if (!includeCompleted) {
      query = query
        .is('completed_at', null)
        .is('cancelled_at', null)
        .gt('expires_at', new Date().toISOString());
    }

    const { data, error } = await query as any;

    if (error) {
      console.error('Error fetching pending signups:', error);
      return { data: null, error };
    }

    return { data: data as PendingSignupWithInviter[], error: null };
  } catch (error) {
    console.error('Error in getUserPendingSignups:', error);
    return { data: null, error };
  }
}

/**
 * Get pending signups for a specific email
 */
export async function getPendingSignupsByEmail(
  email: string
): Promise<{ data: PendingSignupRow[] | null; error: any }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    const { data, error } = await supabase
      .from('pending_signups' as any)
      .select('*')
      .ilike('email', normalizedEmail)
      .is('completed_at', null)
      .is('cancelled_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }) as any;

    if (error) {
      console.error('Error fetching pending signups by email:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getPendingSignupsByEmail:', error);
    return { data: null, error };
  }
}

/**
 * Cancel a pending signup invitation
 */
export async function cancelPendingSignup(
  pendingSignupId: string
): Promise<{ data: PendingSignupRow | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Verify ownership before cancelling
    const { data: existing, error: fetchError } = await supabase
      .from('pending_signups' as any)
      .select('*')
      .eq('pending_signup_id', pendingSignupId)
      .eq('invited_by', user.id)
      .single() as any;

    if (fetchError || !existing) {
      return { data: null, error: new Error('Pending signup not found or unauthorized') };
    }

    // Check if already completed or cancelled
    if (existing.completed_at) {
      return { data: null, error: new Error('This invitation has already been accepted') };
    }

    if (existing.cancelled_at) {
      return { data: null, error: new Error('This invitation has already been cancelled') };
    }

    // Cancel the pending signup
    const { data, error } = await supabase
      .from('pending_signups' as any)
      .update({
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id
      })
      .eq('pending_signup_id', pendingSignupId)
      .select()
      .single() as any;

    if (error) {
      console.error('Error cancelling pending signup:', error);
      return { data: null, error };
    }

    // Send cancellation email (non-blocking)
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single() as any;

    if (inviterProfile) {
      const inviterFullName = `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim() || inviterProfile.email;
      fetch('/api/send-cancellation-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: existing.email,
          requestType: existing.request_type,
          requestData: existing.request_data,
          inviterUsername: inviterProfile.email,
          inviterFullName: inviterFullName
        })
      }).catch(err => console.error('Error sending cancellation email:', err));
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in cancelPendingSignup:', error);
    return { data: null, error };
  }
}

/**
 * Resend invitation email for a pending signup
 */
export async function resendPendingSignupInvitation(
  pendingSignupId: string
): Promise<{ success: boolean; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: new Error('User not authenticated') };
    }

    // Fetch pending signup with inviter info
    const { data: pendingSignup, error: fetchError } = await supabase
      .from('pending_signups' as any)
      .select(`
        *,
        inviter:profiles!invited_by(
          first_name,
          last_name,
          email
        )
      `)
      .eq('pending_signup_id', pendingSignupId)
      .eq('invited_by', user.id)
      .single() as any;

    if (fetchError || !pendingSignup) {
      return { success: false, error: new Error('Pending signup not found or unauthorized') };
    }

    // Check if still active
    if (pendingSignup.completed_at || pendingSignup.cancelled_at) {
      return { success: false, error: new Error('This invitation is no longer active') };
    }

    if (new Date(pendingSignup.expires_at) < new Date()) {
      return { success: false, error: new Error('This invitation has expired') };
    }

    // Resend email via API route
    const response = await fetch('/api/send-pending-signup-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pendingSignupId: pendingSignup.pending_signup_id,
        email: pendingSignup.email,
        requestType: pendingSignup.request_type,
        requestData: pendingSignup.request_data,
        inviterUsername: pendingSignup.inviter_profile.username,
        inviterFullName: pendingSignup.inviter_profile.full_name
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: new Error(errorData.error || 'Failed to send email') };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in resendPendingSignupInvitation:', error);
    return { success: false, error };
  }
}

/**
 * Get statistics for pending signups created by current user
 */
export async function getPendingSignupStats(): Promise<{ data: PendingSignupStats | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data: allSignups, error } = await supabase
      .from('pending_signups' as any)
      .select('*')
      .eq('invited_by', user.id) as any;

    if (error) {
      console.error('Error fetching pending signup stats:', error);
      return { data: null, error };
    }

    const now = new Date();
    const stats: PendingSignupStats = {
      total_sent: allSignups.length,
      total_completed: allSignups.filter((s: any) => s.completed_at).length,
      total_cancelled: allSignups.filter((s: any) => s.cancelled_at).length,
      total_expired: allSignups.filter((s: any) => !s.completed_at && !s.cancelled_at && new Date(s.expires_at) < now).length,
      total_active: allSignups.filter((s: any) => !s.completed_at && !s.cancelled_at && new Date(s.expires_at) >= now).length,
      by_type: {
        casting_offer: allSignups.filter((s: any) => s.request_type === 'casting_offer').length,
        company_member: allSignups.filter((s: any) => s.request_type === 'company_member').length,
        callback_invitation: allSignups.filter((s: any) => s.request_type === 'callback_invitation').length
      }
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error in getPendingSignupStats:', error);
    return { data: null, error };
  }
}

/**
 * Check how many active pending signups exist for an email
 */
export async function getActivePendingSignupCount(
  email: string
): Promise<{ count: number; error: any }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    const { count, error } = await supabase
      .from('pending_signups' as any)
      .select('*', { count: 'exact', head: true })
      .ilike('email', normalizedEmail)
      .is('completed_at', null)
      .is('cancelled_at', null)
      .gt('expires_at', new Date().toISOString()) as any;

    if (error) {
      console.error('Error counting active pending signups:', error);
      return { count: 0, error };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error in getActivePendingSignupCount:', error);
    return { count: 0, error };
  }
}
