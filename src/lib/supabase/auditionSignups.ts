import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './client';
import type { AuditionSignup, AuditionSignupInsert, AuditionSignupUpdate, AuditionSignupWithDetails, UserSignupsWithDetails } from './types';

/**
 * Get an audition signup by ID
 */
export async function getAuditionSignup(signupId: string): Promise<AuditionSignup | null> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select('*')
    .eq('signup_id', signupId)
    .single();

  if (error) {
    console.error('Error fetching audition signup:', error);
    return null;
  }

  return data;
}

/**
 * Get signup with related user, slot, and role data
 */
export async function getAuditionSignupWithDetails(signupId: string): Promise<AuditionSignupWithDetails | null> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      ),
      audition_slots (
        slot_id,
        start_time,
        end_time,
        location
      ),
      roles (
        role_id,
        role_name,
        description
      )
    `)
    .eq('signup_id', signupId)
    .single();

  if (error) {
    console.error('Error fetching audition signup with details:', error);
    return null;
  }

  return data;
}

/**
 * Get all signups for a specific slot
 */
export async function getSlotSignups(slotId: string): Promise<AuditionSignup[]> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select('*')
    .eq('slot_id', slotId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching slot signups:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all signups for a specific user
 */
export async function getUserSignups(userId: string): Promise<AuditionSignup[]> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user signups:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all signups for a specific user with full details (slot, audition, show, role)
 */
export async function getUserSignupsWithDetails(userId: string): Promise<UserSignupsWithDetails[]> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select(`
      *,
      audition_slots (
        slot_id,
        start_time,
        end_time,
        location,
        auditions (
          audition_id,
          rehearsal_dates,
          rehearsal_location,
          performance_dates,
          performance_location,
          shows (
            show_id,
            title,
            author,
            description
          )
        )
      ),
      roles (
        role_id,
        role_name,
        description,
        role_type,
        gender
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user signups with details:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all signups for a specific role
 */
export async function getRoleSignups(roleId: string): Promise<AuditionSignup[]> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select('*')
    .eq('role_id', roleId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching role signups:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all signups for an audition (via slots)
 */
export async function getAuditionSignups(auditionId: string): Promise<AuditionSignup[]> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select(`
      *,
      audition_slots!inner (
        audition_id,
        start_time,
        end_time,
        location
      ),
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      ),
      roles (
        role_id,
        role_name
      )
    `)
    .eq('audition_slots.audition_id', auditionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching audition signups:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new audition signup
 */
export async function createAuditionSignup(
  signupData: AuditionSignupInsert
): Promise<{ data: AuditionSignup | null; error: any }> {
  // Verify the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Get the audition_id and time information for this slot
  const { data: slotData, error: slotError } = await supabase
    .from('audition_slots')
    .select('audition_id, start_time, end_time')
    .eq('slot_id', signupData.slot_id)
    .single();

  if (slotError || !slotData) {
    console.error('Error fetching slot data:', slotError);
    return { data: null, error: slotError || new Error('Slot not found') };
  }

  // Check if user already has a signup for this audition
  const existingSignup = await getUserSignupForAudition(user.id, slotData.audition_id);
  
  if (existingSignup) {
    const error = new Error('You have already signed up for a slot in this audition. You can only sign up for one slot per audition.');
    return { data: null, error };
  }

  // Check for time conflicts with other signups
  const { hasConflict, conflictingSignup } = await checkSlotConflict(
    user.id,
    slotData.start_time,
    slotData.end_time
  );

  if (hasConflict && conflictingSignup) {
    const conflictStart = new Date(conflictingSignup.audition_slots.start_time);
    const conflictEnd = new Date(conflictingSignup.audition_slots.end_time);
    const error = new Error(
      `This slot conflicts with another audition you're signed up for (${conflictStart.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })} - ${conflictEnd.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}). Please choose a different time slot.`
    );
    return { data: null, error };
  }

  // Set the user_id to the authenticated user
  const dataToInsert = {
    ...signupData,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('audition_signups')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    console.error('Error creating audition signup:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update an audition signup
 */
export async function updateAuditionSignup(
  signupId: string,
  updates: AuditionSignupUpdate
): Promise<{ data: AuditionSignup | null; error: any }> {
  const { data, error } = await supabase
    .from('audition_signups')
    .update(updates)
    .eq('signup_id', signupId)
    .select()
    .single();

  if (error) {
    console.error('Error updating audition signup:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update signup status
 */
export async function updateSignupStatus(
  signupId: string,
  status: AuditionSignupUpdate['status']
): Promise<{ data: AuditionSignup | null; error: any }> {
  return updateAuditionSignup(signupId, { status });
}

/**
 * Delete an audition signup
 */
export async function deleteAuditionSignup(
  signupId: string
): Promise<{ error: any }> {
  // Verify the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { error: authError || new Error('Not authenticated') };
  }

  // First, verify the user owns this signup
  const signup = await getAuditionSignup(signupId);
  
  if (!signup) {
    const notFoundError = new Error('Signup not found');
    console.error('Signup not found:', signupId);
    return { error: notFoundError };
  }

  // Authorization check: user can only delete their own signups
  if (signup.user_id !== user.id) {
    const unauthorizedError = new Error('Unauthorized: You can only delete your own signups');
    console.error('Authorization failed:', { 
      authenticatedUserId: user.id, 
      signupUserId: signup.user_id 
    });
    return { error: unauthorizedError };
  }

  const { error } = await supabase
    .from('audition_signups')
    .delete()
    .eq('signup_id', signupId);

  if (error) {
    console.error('Error deleting audition signup:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Check if a user has already signed up for a slot
 */
export async function hasUserSignedUpForSlot(
  userId: string,
  slotId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select('signup_id')
    .eq('user_id', userId)
    .eq('slot_id', slotId)
    .limit(1);

  if (error) {
    console.error('Error checking user signup:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Check if a user has already signed up for any slot in an audition
 * Returns the signup details if found, null otherwise
 */
export async function getUserSignupForAudition(
  userId: string,
  auditionId: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select(`
      *,
      audition_slots!inner (
        slot_id,
        audition_id,
        start_time,
        end_time,
        location
      )
    `)
    .eq('user_id', userId)
    .eq('audition_slots.audition_id', auditionId)
    .limit(1)
    .single();

  if (error) {
    // Not found is expected, don't log as error
    if (error.code !== 'PGRST116') {
      console.error('Error checking user audition signup:', error);
    }
    return null;
  }

  return data;
}

/**
 * Check if two time slots overlap
 */
export function doSlotsOverlap(
  slot1Start: string | Date,
  slot1End: string | Date,
  slot2Start: string | Date,
  slot2End: string | Date
): boolean {
  const start1 = new Date(slot1Start).getTime();
  const end1 = new Date(slot1End).getTime();
  const start2 = new Date(slot2Start).getTime();
  const end2 = new Date(slot2End).getTime();

  // Two slots overlap if one starts before the other ends
  return start1 < end2 && start2 < end1;
}

/**
 * Get all user signups with slot time information for conflict checking
 */
export async function getUserSignupsWithTimes(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select(`
      *,
      audition_slots (
        slot_id,
        audition_id,
        start_time,
        end_time,
        location
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user signups with times:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if a slot conflicts with any of the user's existing signups
 */
export async function checkSlotConflict(
  userId: string,
  slotStartTime: string,
  slotEndTime: string
): Promise<{ hasConflict: boolean; conflictingSignup: any | null }> {
  const userSignups = await getUserSignupsWithTimes(userId);

  for (const signup of userSignups) {
    if (signup.audition_slots) {
      const conflict = doSlotsOverlap(
        slotStartTime,
        slotEndTime,
        signup.audition_slots.start_time,
        signup.audition_slots.end_time
      );

      if (conflict) {
        return { hasConflict: true, conflictingSignup: signup };
      }
    }
  }

  return { hasConflict: false, conflictingSignup: null };
}

/**
 * Get signup count for a slot
 */
export async function getSlotSignupCount(slotId: string): Promise<number> {
  const { count, error } = await supabase
    .from('audition_signups')
    .select('*', { count: 'exact', head: true })
    .eq('slot_id', slotId);

  if (error) {
    console.error('Error counting slot signups:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Get signups by status
 */
export async function getSignupsByStatus(
  auditionId: string,
  status: NonNullable<AuditionSignup['status']>
): Promise<any[]> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select(`
      *,
      audition_slots!inner (
        audition_id,
        start_time,
        end_time,
        location
      ),
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      ),
      roles (
        role_id,
        role_name
      )
    `)
    .eq('audition_slots.audition_id', auditionId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching signups by status:', error);
    return [];
  }

  return data || [];
}

/**
 * Bulk update signup statuses
 */
export async function bulkUpdateSignupStatus(
  signupIds: string[],
  status: AuditionSignup['status']
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('audition_signups')
    .update({ status })
    .in('signup_id', signupIds);

  if (error) {
    console.error('Error bulk updating signup statuses:', error);
    return { error };
  }

  return { error: null };
}
