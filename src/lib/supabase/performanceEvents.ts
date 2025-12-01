/**
 * Performance Events API
 * Handles CRUD operations for performance events
 */

import { supabase } from '@/lib/supabase/client';
import type { PerformanceEvent } from './types';


/**
 * Get all performance events for an audition/production
 */
export async function getPerformanceEvents(auditionId: string) {
  const { data, error } = await supabase
    .from('performance_events')
    .select('*')
    .eq('audition_id', auditionId)
    .order('date', { ascending: true })
    .order('curtain_time', { ascending: true });

  if (error) {
    console.error('Error fetching performance events:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get a single performance event by ID
 */
export async function getPerformanceEvent(eventId: string) {
  const { data, error } = await supabase
    .from('performance_events')
    .select('*')
    .eq('performance_events_id', eventId)
    .single();

  if (error) {
    console.error('Error fetching performance event:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Create a new performance event
 */
export async function createPerformanceEvent(event: {
  audition_id: string;
  date: string; // YYYY-MM-DD
  call_time: string; // HH:MM:SS - when actors should arrive
  curtain_time: string; // HH:MM:SS - when the show starts
  location?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('performance_events')
    .insert(event)
    .select()
    .single();

  if (error) {
    console.error('Error creating performance event:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update a performance event
 */
export async function updatePerformanceEvent(
  eventId: string,
  updates: {
    date?: string;
    call_time?: string;
    curtain_time?: string;
    location?: string;
    notes?: string;
  }
) {
  const { data, error } = await supabase
    .from('performance_events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('performance_events_id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating performance event:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Delete a performance event
 */
export async function deletePerformanceEvent(eventId: string) {
  const { error } = await supabase
    .from('performance_events')
    .delete()
    .eq('performance_events_id', eventId);

  if (error) {
    console.error('Error deleting performance event:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Batch create performance events (for multiple dates at once)
 */
export async function createPerformanceEvents(events: {
  audition_id: string;
  dates: string[]; // Array of YYYY-MM-DD strings
  call_time: string; // HH:MM:SS - when actors should arrive
  curtain_time: string; // HH:MM:SS - when the show starts
  location?: string;
  notes?: string;
}) {
  const { audition_id, dates, call_time, curtain_time, location, notes } = events;
  
  const performanceEvents = dates.map(date => ({
    audition_id,
    date,
    call_time,
    curtain_time,
    location,
    notes
  }));

  const { data, error } = await supabase
    .from('performance_events')
    .insert(performanceEvents)
    .select();

  if (error) {
    console.error('Error creating performance events:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Check if user has permission to manage performance events
 */
export async function canManagePerformanceEvents(auditionId: string): Promise<boolean> {
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
    const { data: teamMember } = await supabase
      .from('production_team_members')
      .select('role')
      .eq('audition_id', auditionId)
      .eq('user_id', user.id)
      .in('role', ['Owner', 'Admin', 'Member'])
      .single();

    return !!teamMember;
  }

  return false;
}

/**
 * Get performance events for user's owned auditions
 */
export async function getUserOwnedPerformanceEvents(userId: string) {
  const { data, error } = await supabase
    .from('performance_events')
    .select(`
      *,
      auditions (
        audition_id,
        created_by,
        shows (
          show_id,
          title,
          author
        )
      )
    `)
    .eq('auditions.created_by', userId)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching user owned performance events:', error);
    return [];
  }

  return data || [];
}

/**
 * Get performance events for productions where user is a team member
 */
export async function getUserProductionTeamPerformanceEvents(userId: string) {
  // First get audition IDs where user is a production team member
  const { data: teamMemberships, error: teamError } = await supabase
    .from('production_team_members')
    .select('audition_id')
    .eq('user_id', userId);

  if (teamError || !teamMemberships) {
    console.error('Error fetching production team memberships:', teamError);
    return [];
  }

  if (teamMemberships.length === 0) return [];

  const auditionIds = teamMemberships.map(m => m.audition_id);

  // Get performance events for those auditions
  const { data, error } = await supabase
    .from('performance_events')
    .select(`
      *,
      auditions (
        audition_id,
        created_by,
        shows (
          show_id,
          title,
          author
        )
      )
    `)
    .in('audition_id', auditionIds)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching production team performance events:', error);
    return [];
  }

  return data || [];
}
