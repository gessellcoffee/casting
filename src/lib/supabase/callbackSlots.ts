import { supabase } from './client';
import { getAuthenticatedUser } from './auth';
import { isUserProductionMember } from './productionTeamMembers';
import type { CallbackSlot, CallbackSlotInsert, CallbackSlotUpdate } from './types';

/**
 * Get a callback slot by ID
 */
export async function getCallbackSlot(callbackSlotId: string): Promise<CallbackSlot | null> {
  const { data, error } = await supabase
    .from('callback_slots')
    .select('*')
    .eq('callback_slot_id', callbackSlotId)
    .single();

  if (error) {
    console.error('Error fetching callback slot:', error);
    return null;
  }

  return data;
}

/**
 * Get all callback slots for a specific audition
 */
export async function getCallbackSlots(auditionId: string): Promise<CallbackSlot[]> {
  const { data, error } = await supabase
    .from('callback_slots')
    .select('*')
    .eq('audition_id', auditionId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching callback slots:', error);
    return [];
  }

  return data || [];
}

/**
 * Get callback slots with invitation count
 */
export async function getCallbackSlotsWithInvitationCount(auditionId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('callback_slots')
    .select(`
      *,
      callback_invitations (count)
    `)
    .eq('audition_id', auditionId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching callback slots with invitation count:', error);
    return [];
  }

  return data || [];
}

/**
 * Get callback slots with full invitation details
 */
export async function getCallbackSlotsWithInvitations(auditionId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('callback_slots')
    .select(`
      *,
      callback_invitations (
        *,
        profiles (
          id,
          first_name,
          last_name,
          profile_photo_url
        ),
        audition_signups (
          signup_id,
          role_id,
          roles (
            role_id,
            role_name
          )
        )
      )
    `)
    .eq('audition_id', auditionId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching callback slots with invitations:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new callback slot
 */
export async function createCallbackSlot(
  slotData: CallbackSlotInsert
): Promise<{ data: CallbackSlot | null; error: any }> {
  // Verify the authenticated user owns the audition
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Verify user owns the audition
  const { data: audition, error: auditionError } = await supabase
    .from('auditions')
    .select('user_id')
    .eq('audition_id', slotData.audition_id)
    .single();

  if (auditionError || !audition) {
    console.error('Error fetching audition:', auditionError);
    return { data: null, error: auditionError || new Error('Audition not found') };
  }

  // Check if user is owner or production team member
  const isOwner = audition.user_id === user.id;
  const isMember = await isUserProductionMember(slotData.audition_id, user.id);
  
  if (!isOwner && !isMember) {
    const unauthorizedError = new Error('Unauthorized: You must be the audition owner or production team member to create callback slots');
    console.error('Authorization failed:', { isOwner, isMember });
    return { data: null, error: unauthorizedError };
  }

  const { data, error } = await supabase
    .from('callback_slots')
    .insert(slotData)
    .select()
    .single();

  if (error) {
    console.error('Error creating callback slot:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Create multiple callback slots at once
 */
export async function createCallbackSlots(
  slotsData: CallbackSlotInsert[]
): Promise<{ data: CallbackSlot[] | null; error: any }> {
  if (slotsData.length === 0) {
    return { data: [], error: null };
  }

  // Verify the authenticated user owns the audition
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Verify user owns the audition (check first slot's audition_id)
  const { data: audition, error: auditionError } = await supabase
    .from('auditions')
    .select('user_id')
    .eq('audition_id', slotsData[0].audition_id)
    .single();

  if (auditionError || !audition) {
    console.error('Error fetching audition:', auditionError);
    return { data: null, error: auditionError || new Error('Audition not found') };
  }

  // Check if user is owner or production team member
  const isOwner = audition.user_id === user.id;
  const isMember = await isUserProductionMember(slotsData[0].audition_id, user.id);
  
  if (!isOwner && !isMember) {
    const unauthorizedError = new Error('Unauthorized: You must be the audition owner or production team member to create callback slots');
    console.error('Authorization failed:', { isOwner, isMember });
    return { data: null, error: unauthorizedError };
  }

  const { data, error } = await supabase
    .from('callback_slots')
    .insert(slotsData)
    .select();

  if (error) {
    console.error('Error creating callback slots:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update a callback slot
 */
export async function updateCallbackSlot(
  callbackSlotId: string,
  updates: CallbackSlotUpdate
): Promise<{ data: CallbackSlot | null; error: any }> {
  const { data, error } = await supabase
    .from('callback_slots')
    .update(updates)
    .eq('callback_slot_id', callbackSlotId)
    .select()
    .single();

  if (error) {
    console.error('Error updating callback slot:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Delete a callback slot
 */
export async function deleteCallbackSlot(
  callbackSlotId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('callback_slots')
    .delete()
    .eq('callback_slot_id', callbackSlotId);

  if (error) {
    console.error('Error deleting callback slot:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Delete all callback slots for an audition
 */
export async function deleteCallbackSlots(
  auditionId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('callback_slots')
    .delete()
    .eq('audition_id', auditionId);

  if (error) {
    console.error('Error deleting callback slots:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Check if a callback slot is full
 */
export async function isCallbackSlotFull(callbackSlotId: string): Promise<boolean> {
  const slot = await getCallbackSlot(callbackSlotId);
  
  if (!slot) {
    return true; // Consider non-existent slots as full
  }

  const { count, error } = await supabase
    .from('callback_invitations')
    .select('*', { count: 'exact', head: true })
    .eq('callback_slot_id', callbackSlotId)
    .eq('status', 'accepted');

  if (error) {
    console.error('Error checking callback slot capacity:', error);
    return true; // Assume full on error for safety
  }

  const maxSignups = slot.max_signups ?? 1;
  return (count ?? 0) >= maxSignups;
}

/**
 * Get available callback slots for an audition (not full)
 */
export async function getAvailableCallbackSlots(auditionId: string): Promise<CallbackSlot[]> {
  const slots = await getCallbackSlots(auditionId);
  const availableSlots: CallbackSlot[] = [];

  for (const slot of slots) {
    const isFull = await isCallbackSlotFull(slot.callback_slot_id);
    if (!isFull) {
      availableSlots.push(slot);
    }
  }

  return availableSlots;
}

/**
 * Get callback slot count for an audition
 */
export async function getCallbackSlotCount(auditionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('callback_slots')
    .select('*', { count: 'exact', head: true })
    .eq('audition_id', auditionId);

  if (error) {
    console.error('Error counting callback slots:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Get callback slots by date range
 */
export async function getCallbackSlotsByDateRange(
  auditionId: string,
  startDate: string,
  endDate: string
): Promise<CallbackSlot[]> {
  const { data, error } = await supabase
    .from('callback_slots')
    .select('*')
    .eq('audition_id', auditionId)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching callback slots by date range:', error);
    return [];
  }

  return data || [];
}
