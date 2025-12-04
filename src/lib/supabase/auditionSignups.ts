import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './client';
import { getAuthenticatedUser } from './auth';
import type { AuditionSignup, AuditionSignupInsert, AuditionSignupUpdate, AuditionSignupWithDetails, UserSignupsWithDetails, Json } from './types';

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
      profiles!audition_signups_user_id_fkey (
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
  // First, get all signups with slot details
  const { data: signups, error: signupsError } = await supabase
    .from('audition_signups')
    .select(`
      *,
      audition_slots (
        *
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

  if (signupsError) {
    console.error('Error fetching user signups with details:', signupsError);
    return [];
  }

  if (!signups || signups.length === 0) return [];

  // Get unique audition IDs
  const auditionIds = [...new Set(
    signups
      .map(s => s.audition_slots?.audition_id)
      .filter((id): id is string => id !== undefined && id !== null)
  )];

  if (auditionIds.length === 0) return [];

  // Fetch full audition details
  const { data: auditions, error: auditionsError } = await supabase
    .from('auditions')
    .select(`
      *,
      shows (
        show_id,
        title,
        author,
        description
      )
    `)
    .in('audition_id', auditionIds);

  if (auditionsError) {
    console.error('Error fetching auditions:', auditionsError);
    return [];
  }

  if (!auditions) return [];

  // Group signups by audition
  const result: UserSignupsWithDetails[] = auditions.map(audition => ({
    audition,
    signups: signups.filter(
      signup => signup.audition_slots?.audition_id === audition.audition_id
    ) as AuditionSignupWithDetails[]
  })) as any;

  return result;
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
      profiles!audition_signups_user_id_fkey (
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
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Get the audition_id and time information for this slot
  const { data: slotData, error: slotError } = await supabase
    .from('audition_slots')
    .select('audition_id, start_time, end_time, max_signups')
    .eq('slot_id', signupData.slot_id)
    .single();

  if (slotError || !slotData) {
    console.error('Error fetching slot data:', slotError);
    return { data: null, error: slotError || new Error('Slot not found') };
  }

  // Check if slot is full
  const { count: currentSignups, error: countError } = await supabase
    .from('audition_signups')
    .select('*', { count: 'exact', head: true })
    .eq('slot_id', signupData.slot_id);

  if (countError) {
    console.error('Error checking slot capacity:', countError);
    return { data: null, error: countError };
  }

  const maxSignups = slotData.max_signups ?? 1;
  if ((currentSignups ?? 0) >= maxSignups) {
    const error = new Error('This slot is full. Please choose a different time slot.');
    return { data: null, error };
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
  const { user, error: authError } = await getAuthenticatedUser();
  
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
      profiles!audition_signups_user_id_fkey (
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

/**
 * Get auditions where user has accepted a casting offer (status = 'Offer Accepted')
 * These shows should appear in the user's calendar with rehearsal and performance dates
 */
export async function getUserCastShows(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select(`
      *,
      audition_slots (
        auditions (
          audition_id,
          rehearsal_dates,
          rehearsal_location,
          performance_dates,
          performance_location,
          shows (
            show_id,
            title,
            author
          )
        )
      ),
      roles (
        role_id,
        role_name
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'Offer Accepted');

  if (error) {
    console.error('Error fetching user cast shows:', error);
    return [];
  }

  return data || [];
}

/**
 * Get auditions owned by the user
 * These shows should appear in the owner's calendar with rehearsal and performance dates
 */
export async function getUserOwnedAuditions(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('auditions')
    .select(`
      audition_id,
      rehearsal_dates,
      rehearsal_location,
      performance_dates,
      performance_location,
      shows (
        show_id,
        title,
        author
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user owned auditions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get auditions where user is a production team member
 * These shows should appear in the team member's calendar with rehearsal and performance dates
 */
export async function getUserProductionTeamAuditions(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('production_team_members')
    .select(`
      role_title,
      auditions (
        audition_id,
        rehearsal_dates,
        rehearsal_location,
        performance_dates,
        performance_location,
        shows (
          show_id,
          title,
          author
        )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching user production team auditions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all audition slots for auditions owned by the user
 * For calendar display
 */
export async function getUserOwnedAuditionSlots(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('audition_slots')
    .select(`
      slot_id,
      audition_id,
      start_time,
      end_time,
      location,
      auditions!inner (
        audition_id,
        user_id,
        shows (
          show_id,
          title,
          author
        )
      )
    `)
    .eq('auditions.user_id', userId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching user owned audition slots:', error);
    return [];
  }

  console.log('Owned audition slots fetched:', data?.length || 0, data);
  return data || [];
}

/**
 * Get all audition slots for auditions where user is production team
 * For calendar display
 */
export async function getUserProductionTeamAuditionSlots(userId: string): Promise<any[]> {
  // First get audition IDs where user is production team
  const { data: teamData, error: teamError } = await supabase
    .from('production_team_members')
    .select('audition_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (teamError || !teamData || teamData.length === 0) {
    return [];
  }

  const auditionIds = teamData.map(t => t.audition_id);

  // Get slots for those auditions
  const { data, error } = await supabase
    .from('audition_slots')
    .select(`
      slot_id,
      audition_id,
      start_time,
      end_time,
      location,
      auditions!inner (
        audition_id,
        shows (
          show_id,
          title,
          author
        )
      )
    `)
    .in('audition_id', auditionIds)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching production team audition slots:', error);
    return [];
  }

  console.log('Production team audition slots fetched:', data?.length || 0, data);
  return data || [];
}

/**
 * Get all rehearsal events for auditions owned by the user
 * For calendar display
 */
export async function getUserOwnedRehearsalEvents(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('rehearsal_events')
    .select(`
      rehearsal_events_id,
      date,
      start_time,
      end_time,
      location,
      notes,
      auditions!inner (
        audition_id,
        user_id,
        shows (
          show_id,
          title,
          author
        )
      )
    `)
    .eq('auditions.user_id', userId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching user owned rehearsal events:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all rehearsal events for auditions where user is production team
 * For calendar display
 */
export async function getUserProductionTeamRehearsalEvents(userId: string): Promise<any[]> {
  // First get audition IDs where user is production team
  const { data: teamData, error: teamError } = await supabase
    .from('production_team_members')
    .select('audition_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (teamError || !teamData || teamData.length === 0) {
    return [];
  }

  const auditionIds = teamData.map(t => t.audition_id);

  // Get rehearsal events for those auditions
  const { data, error } = await supabase
    .from('rehearsal_events')
    .select(`
      rehearsal_events_id,
      date,
      start_time,
      end_time,
      location,
      notes,
      auditions!inner (
        audition_id,
        shows (
          show_id,
          title,
          author
        )
      )
    `)
    .in('audition_id', auditionIds)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching production team rehearsal events:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all rehearsal events for shows where user is a cast member
 * Shows rehearsal events where user is assigned to at least one agenda item
 * OR where the event has no agenda items assigned to anyone (full cast call)
 */
export async function getUserCastRehearsalEvents(userId: string): Promise<any[]> {
  try {
    // Get all shows where user is cast (from cast_members table with status 'Accepted')
    const { data: castMemberships, error: castError } = await supabase
      .from('cast_members')
      .select('audition_id')
      .eq('user_id', userId)
      .eq('status', 'Accepted');

    if (castError) {
      console.error('Error fetching cast memberships:', castError);
      return [];
    }

    const castAuditionIds = (castMemberships || [])
      .map(m => m.audition_id)
      .filter((id): id is string => !!id);

    console.log('[getUserCastRehearsalEvents] Cast audition IDs:', castAuditionIds);

    if (castAuditionIds.length === 0) {
      console.log('[getUserCastRehearsalEvents] No cast memberships found');
      return [];
    }

    // Get all rehearsal events for these auditions
    const { data: rehearsalEvents, error: eventsError } = await supabase
      .from('rehearsal_events')
      .select(`
        rehearsal_events_id,
        audition_id,
        date,
        start_time,
        end_time,
        location,
        notes,
        auditions!inner (
          audition_id,
          shows (
            show_id,
            title,
            author
          )
        )
      `)
      .in('audition_id', castAuditionIds)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    console.log('[getUserCastRehearsalEvents] Rehearsal events query result:', {
      error: eventsError,
      count: rehearsalEvents?.length || 0,
      events: rehearsalEvents
    });

    if (eventsError || !rehearsalEvents) {
      console.error('Error fetching cast rehearsal events:', eventsError);
      return [];
    }

    if (rehearsalEvents.length === 0) {
      console.log('[getUserCastRehearsalEvents] No rehearsal events found for cast member');
      return [];
    }

    const rehearsalEventIds = rehearsalEvents.map(e => e.rehearsal_events_id);
    console.log('[getUserCastRehearsalEvents] Found rehearsal event IDs:', rehearsalEventIds);

    // Get all agenda items for these rehearsal events
    const { data: allAgendaItems, error: itemsError } = await supabase
      .from('rehearsal_agenda_items')
      .select('rehearsal_agenda_items_id, rehearsal_event_id')
      .in('rehearsal_event_id', rehearsalEventIds);

    if (itemsError) {
      console.error('Error fetching agenda items for cast events:', itemsError);
      // Return all events if we can't check assignments
      return rehearsalEvents;
    }

    // Get all assignments for these agenda items
    const agendaItemIds = (allAgendaItems || []).map(item => item.rehearsal_agenda_items_id);
    
    let assignments: any[] = [];
    if (agendaItemIds.length > 0) {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('agenda_assignments')
        .select('agenda_item_id, user_id')
        .in('agenda_item_id', agendaItemIds);

      if (assignmentsError) {
        console.error('Error fetching assignments for cast events:', assignmentsError);
      } else {
        assignments = assignmentsData || [];
      }
    }

    // Filter events: show if user is assigned to any agenda item OR event has no assignments
    const visibleEvents = rehearsalEvents.filter(event => {
      const eventAgendaItems = (allAgendaItems || [])
        .filter(item => item.rehearsal_event_id === event.rehearsal_events_id);
      
      // If no agenda items exist for this event, show it (full cast call)
      if (eventAgendaItems.length === 0) {
        console.log(`[getUserCastRehearsalEvents] Event ${event.rehearsal_events_id} has no agenda items - showing`);
        return true;
      }

      const eventItemIds = eventAgendaItems.map(item => item.rehearsal_agenda_items_id);
      const eventAssignments = assignments.filter(a => eventItemIds.includes(a.agenda_item_id));

      // If no assignments for this event's agenda items, show it (full cast call)
      if (eventAssignments.length === 0) {
        console.log(`[getUserCastRehearsalEvents] Event ${event.rehearsal_events_id} has agenda items but no assignments - showing`);
        return true;
      }

      // Check if user is assigned to any agenda item in this event
      const isAssigned = eventAssignments.some(a => a.user_id === userId);
      console.log(`[getUserCastRehearsalEvents] Event ${event.rehearsal_events_id} user assigned:`, isAssigned);
      return isAssigned;
    });

    console.log('[getUserCastRehearsalEvents] Filtered visible events:', visibleEvents.length, visibleEvents);
    return visibleEvents;
  } catch (error) {
    console.error('Error in getUserCastRehearsalEvents:', error);
    return [];
  }
}

/**
 * Get signups with user details for multiple slot IDs
 * Used for checking which users will be affected by slot deletions
 */
export async function getSignupsForSlots(slotIds: string[]): Promise<Array<{
  signup_id: string;
  user_id: string;
  slot_id: string;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  slot: {
    slot_id: string;
    start_time: string;
    end_time: string;
  } | null;
}>> {
  if (slotIds.length === 0) return [];

  const { data, error } = await supabase
    .from('audition_signups')
    .select(`
      signup_id,
      user_id,
      slot_id,
      profiles!audition_signups_user_id_fkey (
        id,
        first_name,
        last_name,
        email
      ),
      audition_slots:slot_id (
        slot_id,
        start_time,
        end_time
      )
    `)
    .in('slot_id', slotIds);

  if (error) {
    console.error('Error fetching signups for slots:', error);
    return [];
  }

  return (data || []).map((signup: any) => ({
    signup_id: signup.signup_id,
    user_id: signup.user_id,
    slot_id: signup.slot_id,
    user: signup.profiles,
    slot: signup.audition_slots,
  }));
}

/**
 * Get rehearsal agenda items for a user across all their productions
 * Returns items where:
 * 1. User is explicitly assigned to the agenda item, OR
 * 2. User is a cast member AND the agenda item has no assigned users (full cast call), OR
 * 3. User is the production owner AND the agenda item has no assigned users, OR
 * 4. User is a production team member AND the agenda item has no assigned users
 */
export async function getUserRehearsalAgendaItems(userId: string): Promise<any[]> {
  try {
    // Step 1: Get all auditions where user is involved (cast, owner, or production team)
    const [castShows, ownedAuditions, productionTeamData] = await Promise.all([
      getUserCastShows(userId),
      getUserOwnedAuditions(userId),
      supabase
        .from('production_team_members')
        .select('audition_id')
        .eq('user_id', userId)
        .eq('status', 'active')
    ]);

    const castAuditionIds = castShows.map((show: any) => show.audition_id);
    const ownedAuditionIds = ownedAuditions.map((aud: any) => aud.audition_id);
    const teamAuditionIds = productionTeamData.data?.map((t: any) => t.audition_id) || [];

    // Combine all audition IDs (user is involved in these productions)
    const allAuditionIds = Array.from(new Set([...castAuditionIds, ...ownedAuditionIds, ...teamAuditionIds]));

    if (allAuditionIds.length === 0) {
      return [];
    }

    // Step 2: Get all rehearsal events for these auditions
    const { data: rehearsalEvents, error: eventsError } = await supabase
      .from('rehearsal_events')
      .select(`
        rehearsal_events_id,
        audition_id,
        date,
        start_time,
        end_time,
        location,
        notes,
        auditions!inner (
          audition_id,
          user_id,
          shows (
            show_id,
            title,
            author
          )
        )
      `)
      .in('audition_id', allAuditionIds)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (eventsError || !rehearsalEvents || rehearsalEvents.length === 0) {
      console.error('Error fetching rehearsal events:', eventsError);
      return [];
    }

    const rehearsalEventIds = rehearsalEvents.map(e => e.rehearsal_events_id);

    // Step 3: Get all agenda items for these rehearsal events
    const { data: allAgendaItems, error: itemsError } = await supabase
      .from('rehearsal_agenda_items')
      .select('*')
      .in('rehearsal_event_id', rehearsalEventIds)
      .order('start_time', { ascending: true });

    if (itemsError || !allAgendaItems) {
      console.error('Error fetching agenda items:', itemsError);
      return [];
    }

    // Step 4: Get all assignments for these agenda items
    const agendaItemIds = allAgendaItems.map(item => item.rehearsal_agenda_items_id);
    
    const { data: assignments, error: assignmentsError } = await supabase
      .from('agenda_assignments')
      .select(`
        agenda_assignments_id,
        agenda_item_id,
        user_id,
        status,
        conflict_note,
        notified_at
      `)
      .in('agenda_item_id', agendaItemIds);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
    }

    // Step 5: Filter agenda items based on user eligibility
    const userAgendaItems = allAgendaItems.filter(item => {
      const itemAssignments = assignments?.filter(a => a.agenda_item_id === item.rehearsal_agenda_items_id) || [];
      const hasAssignments = itemAssignments.length > 0;
      const isAssignedToUser = itemAssignments.some(a => a.user_id === userId);

      // Find the rehearsal event for this item
      const rehearsalEvent = rehearsalEvents.find(e => e.rehearsal_events_id === item.rehearsal_event_id);
      if (!rehearsalEvent) return false;

      const auditionId = rehearsalEvent.audition_id;
      const isOwner = ownedAuditionIds.includes(auditionId);
      const isCast = castAuditionIds.includes(auditionId);
      const isTeam = teamAuditionIds.includes(auditionId);

      // User sees this item if:
      // 1. They are explicitly assigned, OR
      // 2. No assignments exist AND they are (cast OR owner OR team)
      return isAssignedToUser || (!hasAssignments && (isCast || isOwner || isTeam));
    });

    // Step 6: Combine with rehearsal event data for display
    const agendaItemsWithEvents = userAgendaItems.map(item => {
      const rehearsalEvent = rehearsalEvents.find(e => e.rehearsal_events_id === item.rehearsal_event_id);
      return {
        ...item,
        rehearsal_event: rehearsalEvent
      };
    });

    return agendaItemsWithEvents;
  } catch (error) {
    console.error('Error in getUserRehearsalAgendaItems:', error);
    return [];
  }
}

/**
 * Media file interface for audition signups
 */
export interface MediaFile {
  url: string;
  path: string;
  type: 'image' | 'video';
  filename: string;
  uploaded_at: string;
}

/**
 * Update notes for an audition signup
 */
export async function updateSignupNotes(
  signupId: string,
  notes: string,
  updatedBy: string
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('audition_signups')
    .update({
      notes,
      last_updated_by: updatedBy,
    })
    .eq('signup_id', signupId)
    .select()
    .single();

  if (error) {
    console.error('Error updating signup notes:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Add media file to an audition signup
 */
export async function addSignupMedia(
  signupId: string,
  mediaFile: MediaFile,
  updatedBy: string
): Promise<{ data: any; error: any }> {
  // First, get the current media files
  const { data: signup, error: fetchError } = await supabase
    .from('audition_signups')
    .select('media_files')
    .eq('signup_id', signupId)
    .single();

  if (fetchError) {
    console.error('Error fetching signup:', fetchError);
    return { data: null, error: fetchError };
  }

  // Add new media file to array
  const currentMedia = (signup.media_files as unknown as MediaFile[]) || [];
  const updatedMedia = [...currentMedia, mediaFile];

  // Update the signup
  const { data, error } = await supabase
    .from('audition_signups')
    .update({
      media_files: updatedMedia as unknown as Json,
      last_updated_by: updatedBy,
    })
    .eq('signup_id', signupId)
    .select()
    .single();

  if (error) {
    console.error('Error adding media to signup:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Remove media file from an audition signup
 */
export async function removeSignupMedia(
  signupId: string,
  mediaPath: string,
  updatedBy: string
): Promise<{ data: any; error: any }> {
  // First, get the current media files
  const { data: signup, error: fetchError } = await supabase
    .from('audition_signups')
    .select('media_files')
    .eq('signup_id', signupId)
    .single();

  if (fetchError) {
    console.error('Error fetching signup:', fetchError);
    return { data: null, error: fetchError };
  }

  // Remove media file from array
  const currentMedia = (signup.media_files as unknown as MediaFile[]) || [];
  const updatedMedia = currentMedia.filter(file => file.path !== mediaPath);

  // Update the signup
  const { data, error } = await supabase
    .from('audition_signups')
    .update({
      media_files: updatedMedia as unknown as Json,
      last_updated_by: updatedBy,
    })
    .eq('signup_id', signupId)
    .select()
    .single();

  if (error) {
    console.error('Error removing media from signup:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get signup with full details including notes and media
 */
export async function getSignupWithDetails(signupId: string): Promise<any> {
  const { data, error } = await supabase
    .from('audition_signups')
    .select(`
      *,
      profiles!audition_signups_user_id_fkey (
        id,
        first_name,
        last_name,
        email,
        profile_photo_url
      ),
      audition_slots (
        slot_id,
        start_time,
        end_time,
        location,
        audition_id
      )
    `)
    .eq('signup_id', signupId)
    .single();

  if (error) {
    console.error('Error fetching signup details:', error);
    return null;
  }

  return data;
}

/**
 * Get all signups for slots with notes and media
 * Used by live audition manager
 */
export async function getSignupsWithDetailsForSlots(slotIds: string[]): Promise<any[]> {
  if (slotIds.length === 0) return [];

  const { data, error } = await supabase
    .from('audition_signups')
    .select(`
      *,
      profiles!user_id (
        id,
        first_name,
        last_name,
        email,
        profile_photo_url
      ),
      audition_slots (
        slot_id,
        start_time,
        end_time,
        location
      )
    `)
    .in('slot_id', slotIds)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching signups with details:', error);
    return [];
  }

  return data || [];
}
