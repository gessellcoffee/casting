/**
 * Rehearsal Events API
 * Handles CRUD operations for rehearsal events
 */

import { supabase } from '@/lib/supabase/client';
import type { RehearsalEvent } from './types';

/**
 * Get all rehearsal events for an audition
 */
export async function getRehearsalEvents(auditionId: string) {
  const { data, error } = await supabase
    .from('rehearsal_events')
    .select('*')
    .eq('audition_id', auditionId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching rehearsal events:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get a single rehearsal event by ID
 */
export async function getRehearsalEvent(eventId: string) {
  const { data, error } = await supabase
    .from('rehearsal_events')
    .select('*')
    .eq('rehearsal_events_id', eventId)
    .single();

  if (error) {
    console.error('Error fetching rehearsal event:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Create a new rehearsal event
 */
export async function createRehearsalEvent(event: {
  audition_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  location?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('rehearsal_events')
    .insert(event)
    .select()
    .single();

  if (error) {
    console.error('Error creating rehearsal event:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update a rehearsal event
 */
export async function updateRehearsalEvent(
  eventId: string,
  updates: {
    date?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    notes?: string;
  }
) {
  const { data, error } = await supabase
    .from('rehearsal_events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('rehearsal_events_id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating rehearsal event:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Delete a rehearsal event
 */
export async function deleteRehearsalEvent(eventId: string) {
  const { error } = await supabase
    .from('rehearsal_events')
    .delete()
    .eq('rehearsal_events_id', eventId);

  if (error) {
    console.error('Error deleting rehearsal event:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Get rehearsal events with agenda items
 */
export async function getRehearsalEventsWithAgenda(auditionId: string) {
  const { data, error } = await supabase
    .from('rehearsal_events')
    .select(`
      *,
      rehearsal_agenda_items (
        *,
        agenda_assignments (
          *,
          profiles (
            id,
            first_name,
            last_name,
            profile_photo_url
          )
        )
      )
    `)
    .eq('audition_id', auditionId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching rehearsal events with agenda:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Check if user has permission to manage rehearsal events
 */
export async function canManageRehearsalEvents(auditionId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Check if user is audition owner
  const { data: audition } = await supabase
    .from('auditions')
    .select('user_id, company_id')
    .eq('audition_id', auditionId)
    .single();

  if (!audition) return false;
  if (audition.user_id === user.id) return true;

  // Check if user is production team member
  if (audition.company_id) {
    const { data: membership } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', audition.company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin', 'member'])
      .single();

    return !!membership;
  }

  return false;
}
