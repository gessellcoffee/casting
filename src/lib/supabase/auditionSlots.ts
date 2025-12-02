import { supabase } from './client';
import type { AuditionSlot, AuditionSlotInsert, AuditionSlotUpdate } from './types';

/**
 * Get an audition slot by ID
 */
export async function getAuditionSlot(slotId: string): Promise<AuditionSlot | null> {
  const { data, error } = await supabase
    .from('audition_slots')
    .select('*')
    .eq('slot_id', slotId)
    .single();

  if (error) {
    console.error('Error fetching audition slot:', error);
    return null;
  }

  return data;
}

/**
 * Get all slots for a specific audition
 */
export async function getAuditionSlots(auditionId: string): Promise<AuditionSlot[]> {
  const { data, error } = await supabase
    .from('audition_slots')
    .select('*')
    .eq('audition_id', auditionId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching audition slots:', error);
    return [];
  }

  return data || [];
}

/**
 * Get slots with signup count
 */
export async function getAuditionSlotsWithSignupCount(auditionId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('audition_slots')
    .select(`
      *,
      audition_signups (count)
    `)
    .eq('audition_id', auditionId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching audition slots with signup count:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new audition slot
 */
export async function createAuditionSlot(
  slotData: AuditionSlotInsert
): Promise<{ data: AuditionSlot | null; error: any }> {
  const { data, error } = await supabase
    .from('audition_slots')
    .insert(slotData)
    .select()
    .single();

  if (error) {
    console.error('Error creating audition slot:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Create multiple audition slots at once
 */
export async function createAuditionSlots(
  slotsData: AuditionSlotInsert[]
): Promise<{ data: AuditionSlot[] | null; error: any }> {
  const { data, error } = await supabase
    .from('audition_slots')
    .insert(slotsData)
    .select();

  if (error) {
    console.error('Error creating audition slots:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update an audition slot
 */
export async function updateAuditionSlot(
  slotId: string,
  updates: AuditionSlotUpdate
): Promise<{ data: AuditionSlot | null; error: any }> {
  // Perform the update without SELECT to avoid RLS policy conflicts
  const { error } = await supabase
    .from('audition_slots')
    .update(updates)
    .eq('slot_id', slotId);

  if (error) {
    console.error('Error updating audition slot:', error);
    return { data: null, error };
  }

  // Fetch the updated slot separately
  const updatedSlot = await getAuditionSlot(slotId);
  
  if (!updatedSlot) {
    return { data: null, error: new Error('Update succeeded but could not retrieve updated data') };
  }

  return { data: updatedSlot, error: null };
}

/**
 * Delete an audition slot
 */
export async function deleteAuditionSlot(
  slotId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('audition_slots')
    .delete()
    .eq('slot_id', slotId);

  if (error) {
    console.error('Error deleting audition slot:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Delete all slots for an audition
 */
export async function deleteAuditionSlots(
  auditionId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('audition_slots')
    .delete()
    .eq('audition_id', auditionId);

  if (error) {
    console.error('Error deleting audition slots:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Check if a slot is full
 */
export async function isSlotFull(slotId: string): Promise<boolean> {
  const slot = await getAuditionSlot(slotId);
  
  if (!slot) {
    return true; // Consider non-existent slots as full
  }

  const { count, error } = await supabase
    .from('audition_signups')
    .select('*', { count: 'exact', head: true })
    .eq('slot_id', slotId);

  if (error) {
    console.error('Error checking slot capacity:', error);
    return true; // Assume full on error for safety
  }

  const maxSignups = slot.max_signups ?? 1;
  return (count ?? 0) >= maxSignups;
}

/**
 * Get available slots for an audition (not full)
 */
export async function getAvailableSlots(auditionId: string): Promise<AuditionSlot[]> {
  const slots = await getAuditionSlots(auditionId);
  const availableSlots: AuditionSlot[] = [];

  for (const slot of slots) {
    const isFull = await isSlotFull(slot.slot_id);
    if (!isFull) {
      availableSlots.push(slot);
    }
  }

  return availableSlots;
}

/**
 * Get slot count for an audition
 */
export async function getAuditionSlotCount(auditionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('audition_slots')
    .select('*', { count: 'exact', head: true })
    .eq('audition_id', auditionId);

  if (error) {
    console.error('Error counting audition slots:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Get slots by date range
 */
export async function getSlotsByDateRange(
  auditionId: string,
  startDate: string,
  endDate: string
): Promise<AuditionSlot[]> {
  const { data, error } = await supabase
    .from('audition_slots')
    .select('*')
    .eq('audition_id', auditionId)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching slots by date range:', error);
    return [];
  }

  return data || [];
}
