/**
 * Agenda Items API
 * Handles CRUD operations for rehearsal agenda items and assignments
 */

import { supabase } from '@/lib/supabase/client';
import { getUserSignupsWithDetails, getUserRehearsalAgendaItems } from './auditionSignups';
import { getUserAcceptedCallbacks } from './callbackInvitations';
import { getEvents } from './events';

/**
 * Check if two time ranges overlap
 */
function doTimeRangesOverlap(
  start1: string | Date,
  end1: string | Date,
  start2: string | Date,
  end2: string | Date
): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  
  // Overlaps if: start1 < end2 AND start2 < end1
  return s1 < e2 && s2 < e1;
}

/**
 * Get all agenda items for a rehearsal event
 */
export async function getAgendaItems(rehearsalEventId: string) {
  // First get the agenda items
  const { data: items, error: itemsError } = await supabase
    .from('rehearsal_agenda_items')
    .select('*')
    .eq('rehearsal_event_id', rehearsalEventId)
    .order('start_time', { ascending: true });

  if (itemsError) {
    console.error('Error fetching agenda items:', itemsError);
    return { data: null, error: itemsError };
  }

  if (!items || items.length === 0) {
    return { data: [], error: null };
  }

  // Then get assignments for each item
  const itemIds = items.map(item => item.rehearsal_agenda_items_id);
  
  const { data: assignments, error: assignmentsError } = await supabase
    .from('agenda_assignments')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      )
    `)
    .in('agenda_item_id', itemIds);

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError);
    // Return items without assignments rather than failing completely
    return { data: items.map(item => ({ ...item, agenda_assignments: [] })), error: null };
  }

  // Combine items with their assignments
  const itemsWithAssignments = items.map(item => ({
    ...item,
    agenda_assignments: assignments?.filter(a => a.agenda_item_id === item.rehearsal_agenda_items_id) || []
  }));

  return { data: itemsWithAssignments, error: null };
}

/**
 * Create a new agenda item
 */
export async function createAgendaItem(item: {
  rehearsal_event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}) {
  const insertData: any = {
    rehearsal_event_id: item.rehearsal_event_id,
    title: item.title,
    start_time: item.start_time,
    end_time: item.end_time,
  };
  
  // Only add optional fields if they have values
  if (item.description) {
    insertData.description = item.description;
  }

  const { data, error } = await supabase
    .from('rehearsal_agenda_items')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating agenda item:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update an agenda item
 */
export async function updateAgendaItem(
  itemId: string,
  updates: {
    title?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
  }
) {
  // Build update object, only including fields that are provided
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (updates.title !== undefined) {
    updateData.title = updates.title;
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description;
  }
  if (updates.start_time !== undefined) {
    updateData.start_time = updates.start_time;
  }
  if (updates.end_time !== undefined) {
    updateData.end_time = updates.end_time;
  }

  const { data, error } = await supabase
    .from('rehearsal_agenda_items')
    .update(updateData)
    .eq('rehearsal_agenda_items_id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating agenda item:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Delete an agenda item
 */
export async function deleteAgendaItem(itemId: string) {
  const { error } = await supabase
    .from('rehearsal_agenda_items')
    .delete()
    .eq('rehearsal_agenda_items_id', itemId);

  if (error) {
    console.error('Error deleting agenda item:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Reorder agenda items by updating their start/end times
 */
export async function reorderAgendaItems(items: { id: string; start_time: string; end_time: string }[]) {
  const promises = items.map(item =>
    supabase
      .from('rehearsal_agenda_items')
      .update({ start_time: item.start_time, end_time: item.end_time })
      .eq('rehearsal_agenda_items_id', item.id)
  );

  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);

  if (errors.length > 0) {
    console.error('Error reordering agenda items:', errors);
    return { error: errors[0].error };
  }

  return { error: null };
}

/**
 * Assign multiple cast members to an agenda item
 */
export async function assignMultipleCastMembers(agenda_item_id: string, user_ids: string[]) {
  const { data, error } = await supabase.rpc('bulk_assign_agenda_items', {
    p_agenda_item_id: agenda_item_id,
    p_user_ids: user_ids,
  });

  if (error) {
    console.error('Error assigning multiple cast members:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Assign a cast member to an agenda item
 */
export async function assignCastMember(assignment: {
  agenda_item_id: string;
  user_id: string;
}) {
  const { data, error } = await supabase
    .from('agenda_assignments')
    .insert(assignment)
    .select()
    .single();

  if (error) {
    console.error('Error assigning cast member:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Remove a cast member assignment
 */
export async function removeAssignment(assignmentId: string) {
  const { error } = await supabase
    .from('agenda_assignments')
    .delete()
    .eq('agenda_assignments_id', assignmentId);

  if (error) {
    console.error('Error removing assignment:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Update assignment status (for cast members to accept/decline/report conflict)
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  status: 'pending' | 'accepted' | 'declined' | 'conflict'
) {
  const { data, error } = await supabase
    .from('agenda_assignments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('agenda_assignments_id', assignmentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating assignment status:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get cast members for an audition (for assignment dropdown)
 */
export async function getCastMembers(auditionId: string) {
  const { data, error } = await supabase
    .from('cast_members')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      ),
      audition_roles ( role_name ),
      roles ( role_name )
    `)
    .eq('audition_id', auditionId)
    .eq('status', 'Accepted')
    .order('profiles(last_name)', { ascending: true });

  if (error) {
    console.error('Error fetching cast members:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get conflict summary for a rehearsal event based on actual calendar overlaps
 * Returns all agenda items with cast members who have scheduling conflicts
 */
export async function getConflictSummary(rehearsalEventId: string) {
  console.log('=== CONFLICT DETECTION STARTING ===');
  console.log('Rehearsal Event ID:', rehearsalEventId);

  // First get the rehearsal event to know the date
  const { data: rehearsalEvent, error: eventError } = await supabase
    .from('rehearsal_events')
    .select('date, audition_id')
    .eq('rehearsal_events_id', rehearsalEventId)
    .single();

  if (eventError || !rehearsalEvent) {
    console.error('Error fetching rehearsal event:', eventError);
    return { data: null, error: eventError };
  }

  console.log('Rehearsal Event:', rehearsalEvent);

  // Get all agenda items with their assignments
  const { data: items, error: itemsError } = await supabase
    .from('rehearsal_agenda_items')
    .select('rehearsal_agenda_items_id, title, start_time, end_time')
    .eq('rehearsal_event_id', rehearsalEventId)
    .order('start_time', { ascending: true });

  if (itemsError) {
    console.error('Error fetching agenda items:', itemsError);
    return { data: null, error: itemsError };
  }

  console.log(`Found ${items?.length || 0} agenda items`);

  if (!items || items.length === 0) {
    console.log('No agenda items found - returning empty array');
    return { data: [], error: null };
  }

  // Get all assignments for these items
  const itemIds = items.map(item => item.rehearsal_agenda_items_id);
  
  const { data: assignments, error: assignmentsError } = await supabase
    .from('agenda_assignments')
    .select(`
      agenda_assignments_id,
      agenda_item_id,
      user_id,
      status,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      )
    `)
    .in('agenda_item_id', itemIds);

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError);
    return { data: null, error: assignmentsError };
  }

  // Get ALL cast members for this production, not just assigned ones
  if (!rehearsalEvent.audition_id) {
    console.log('No audition_id found for rehearsal event');
    return { data: [], error: null };
  }
  
  const { data: castMembers, error: castError } = await getCastMembers(rehearsalEvent.audition_id);
  
  if (castError) {
    console.error('Error fetching cast members:', castError);
    return { data: null, error: castError };
  }

  console.log(`Found ${castMembers?.length || 0} total cast members in this production`);
  if (castMembers && castMembers.length > 0) {
    console.log('Cast members:', castMembers.map((cm: any) => ({
      user: cm.profiles ? `${cm.profiles.first_name} ${cm.profiles.last_name}` : 'Unknown',
      userId: cm.user_id
    })));
  } else {
    console.log('No cast members in this production - no conflicts to check');
    return { data: [], error: null };
  }
  
  // For each agenda item, check ALL cast members for conflicts
  const itemsWithConflicts = await Promise.all(items.map(async (item) => {
    const conflicts = [];

    console.log(`\n--- Checking agenda item: "${item.title}" ---`);
    console.log(`   Checking all ${castMembers?.length || 0} cast members for conflicts`);

    // Combine date and time for the agenda item
    const itemStart = new Date(`${rehearsalEvent.date}T${item.start_time}`);
    const itemEnd = new Date(`${rehearsalEvent.date}T${item.end_time}`);

    // Check EVERY cast member for conflicts with this agenda item
    for (const castMember of (castMembers || [])) {
      // Skip if user_id is null
      if (!castMember.user_id) continue;

      // Get all calendar events for this user
      // For personal events, fetch a range around the rehearsal date
      // Parse as local date to avoid timezone issues (YYYY-MM-DD string becomes midnight LOCAL, not UTC)
      const [year, month, day] = rehearsalEvent.date.split('-').map(Number);
      const rehearsalDate = new Date(year, month - 1, day); // month is 0-indexed
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      console.log(`[Conflict Detection] Checking conflicts for user ${castMember.user_id}`);
      console.log(`[Conflict Detection] Agenda item time: ${itemStart} to ${itemEnd}`);
      console.log(`[Conflict Detection] Fetching personal events from ${startOfDay} to ${endOfDay}`);

      // Fetch all calendar data, wrapping in try-catch to prevent errors from breaking conflict detection
      let signups: any[] = [];
      let callbacks: any[] = [];
      let agendaItems: any[] = [];
      let personalEvents: any[] = [];

      try {
        const results = await Promise.allSettled([
          getUserSignupsWithDetails(castMember.user_id),
          getUserAcceptedCallbacks(castMember.user_id),
          getUserRehearsalAgendaItems(castMember.user_id),
          getEvents(startOfDay, endOfDay, castMember.user_id)
        ]);

        signups = results[0].status === 'fulfilled' ? results[0].value : [];
        callbacks = results[1].status === 'fulfilled' ? results[1].value : [];
        agendaItems = results[2].status === 'fulfilled' ? results[2].value : [];
        personalEvents = results[3].status === 'fulfilled' ? results[3].value : [];

        // Log any failures
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const source = ['signups', 'callbacks', 'agendaItems', 'personalEvents'][index];
            console.warn(`[Conflict Detection] Failed to fetch ${source}:`, result.reason);
          }
        });
      } catch (error) {
        console.error('[Conflict Detection] Error fetching calendar data:', error);
      }

      console.log(`[Conflict Detection] Found ${personalEvents.length} personal events for user ${castMember.user_id}`);
      if (personalEvents.length > 0) {
        console.log('[Conflict Detection] Personal events:', personalEvents.map(e => ({
          title: e.title,
          start: e.start,
          end: e.end
        })));
      }

      const conflictingEvents = [];

      // Check audition signups
      for (const signupGroup of signups) {
        for (const signup of signupGroup.signups) {
          if (signup.audition_slots) {
            if (doTimeRangesOverlap(
              itemStart,
              itemEnd,
              signup.audition_slots.start_time,
              signup.audition_slots.end_time
            )) {
              conflictingEvents.push({
                type: 'Audition Signup',
                title: (signupGroup.audition as any)?.shows?.title || 'Audition',
                start_time: signup.audition_slots.start_time,
                end_time: signup.audition_slots.end_time
              });
            }
          }
        }
      }

      // Check callbacks
      for (const callback of callbacks) {
        // Callbacks have nested callback_slots with start_time and end_time
        if (callback.callback_slots?.start_time && callback.callback_slots?.end_time) {
          if (doTimeRangesOverlap(
            itemStart,
            itemEnd,
            callback.callback_slots.start_time,
            callback.callback_slots.end_time
          )) {
            conflictingEvents.push({
              type: 'Callback',
              title: callback.callback_slots?.auditions?.shows?.title || 'Callback',
              start_time: callback.callback_slots.start_time,
              end_time: callback.callback_slots.end_time
            });
          }
        }
      }

      // Check other agenda items (different rehearsals)
      for (const otherItem of agendaItems) {
        if (otherItem.rehearsal_agenda_items_id !== item.rehearsal_agenda_items_id &&
            otherItem.rehearsal_events?.date) {
          const otherStart = new Date(`${otherItem.rehearsal_events.date}T${otherItem.start_time}`);
          const otherEnd = new Date(`${otherItem.rehearsal_events.date}T${otherItem.end_time}`);
          if (doTimeRangesOverlap(itemStart, itemEnd, otherStart, otherEnd)) {
            conflictingEvents.push({
              type: 'Rehearsal',
              title: otherItem.rehearsal_events?.auditions?.shows?.title || 'Rehearsal',
              start_time: otherStart.toISOString(),
              end_time: otherEnd.toISOString()
            });
          }
        }
      }

      // Check personal events
      for (const event of personalEvents) {
        if (event.start && event.end) {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          console.log(`[Conflict Detection] Checking personal event "${event.title}"`);
          console.log(`[Conflict Detection]   Event time: ${eventStart} to ${eventEnd}`);
          console.log(`[Conflict Detection]   Agenda time: ${itemStart} to ${itemEnd}`);
          const overlaps = doTimeRangesOverlap(itemStart, itemEnd, eventStart, eventEnd);
          console.log(`[Conflict Detection]   Overlaps: ${overlaps}`);
          if (overlaps) {
            console.log(`[Conflict Detection]   ✓ CONFLICT FOUND with personal event "${event.title}"`);
            conflictingEvents.push({
              type: 'Personal Event',
              title: event.title,
              start_time: event.start,
              end_time: event.end
            });
          }
        }
      }

      // If user has conflicts, add them
      if (conflictingEvents.length > 0) {
        console.log(`[Conflict Detection] ✓ User ${castMember.user_id} has ${conflictingEvents.length} conflicts`);
        conflicts.push({
          agenda_assignments_id: null, // Not tied to a specific assignment anymore
          user_id: castMember.user_id,
          status: 'conflict',
          conflict_note: conflictingEvents.map(e => `${e.type}: ${e.title}`).join(', '),
          conflicting_events: conflictingEvents,
          profiles: castMember.profiles
        });
      } else {
        console.log(`[Conflict Detection] No conflicts found for user ${castMember.user_id}`);
      }
    }

    return {
      ...item,
      conflicts
    };
  }));

  // Filter to only items with conflicts
  const filteredItems = itemsWithConflicts.filter(item => item.conflicts.length > 0);

  console.log(`[Conflict Detection] FINAL RESULT: Found ${filteredItems.length} agenda items with conflicts`);
  console.log('[Conflict Detection] Items with conflicts:', filteredItems.map(item => ({
    title: item.title,
    conflictCount: item.conflicts.length,
    conflicts: item.conflicts.map(c => ({
      user: c.profiles ? `${c.profiles.first_name} ${c.profiles.last_name}` : 'Unknown',
      events: c.conflicting_events?.map(e => `${e.type}: ${e.title}`)
    }))
  })));

  return { data: filteredItems, error: null };
}

/**
 * Get conflict summary for multiple rehearsal events in a date range
 * Optimized to fetch user calendar data once per user instead of per event
 */
export async function getBatchConflictSummary(
  auditionId: string,
  startDate: Date,
  endDate: Date
) {
  console.log('=== BATCH CONFLICT DETECTION STARTING ===');
  console.log('Audition ID:', auditionId);
  console.log('Range:', startDate.toISOString(), 'to', endDate.toISOString());

  // 1. Get all rehearsal events with agenda items in range
  const { data: events, error: eventsError } = await supabase
    .from('rehearsal_events')
    .select(`
      rehearsal_events_id,
      date,
      start_time,
      end_time,
      rehearsal_agenda_items (
        rehearsal_agenda_items_id,
        title,
        start_time,
        end_time
      )
    `)
    .eq('audition_id', auditionId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  if (eventsError) {
    console.error('Error fetching batch rehearsal events:', eventsError);
    return { data: null, error: eventsError };
  }

  if (!events || events.length === 0) {
    return { data: {}, error: null };
  }

  // 2. Get all cast members
  const { data: castMembers, error: castError } = await getCastMembers(auditionId);
  
  if (castError || !castMembers || castMembers.length === 0) {
    return { data: {}, error: castError };
  }

  console.log(`Checking conflicts for ${events.length} events and ${castMembers.length} cast members`);

  // 3. Fetch calendar data for all cast members (parallel)
  const userDataMap = new Map();
  
  // Helper to fetch data for one user
  const fetchUserData = async (member: any) => {
    try {
      // Pass the date range to getEvents to limit personal events
      const results = await Promise.allSettled([
        getUserSignupsWithDetails(member.user_id),
        getUserAcceptedCallbacks(member.user_id),
        getUserRehearsalAgendaItems(member.user_id),
        getEvents(startDate, endDate, member.user_id)
      ]);

      const signups = results[0].status === 'fulfilled' ? results[0].value : [];
      const callbacks = results[1].status === 'fulfilled' ? results[1].value : [];
      const agendaItems = results[2].status === 'fulfilled' ? results[2].value : [];
      const personalEvents = results[3].status === 'fulfilled' ? results[3].value : [];

      userDataMap.set(member.user_id, {
        member,
        signups,
        callbacks,
        agendaItems,
        personalEvents
      });
    } catch (error) {
      console.error(`Error fetching data for user ${member.user_id}:`, error);
    }
  };

  // Run in parallel (browser will limit concurrency)
  await Promise.all(castMembers.map(fetchUserData));

  // 4. Compute conflicts
  const eventConflicts: Record<string, any[]> = {};

  for (const event of events) {
    const conflictingUsersMap = new Map(); // Use Map to track unique users and their conflict details

    // For each agenda item in this event
    for (const item of event.rehearsal_agenda_items) {
      const itemStart = new Date(`${event.date}T${item.start_time}`);
      const itemEnd = new Date(`${event.date}T${item.end_time}`);

      // Check each user
      for (const [userId, userData] of userDataMap.entries()) {
        const { member, signups, callbacks, agendaItems, personalEvents } = userData;
        const conflictingEvents = [];

        // Check audition signups
        for (const signupGroup of signups) {
          for (const signup of signupGroup.signups) {
            if (signup.audition_slots && doTimeRangesOverlap(
              itemStart, itemEnd,
              signup.audition_slots.start_time, signup.audition_slots.end_time
            )) {
              conflictingEvents.push({
                type: 'Audition Signup',
                title: (signupGroup.audition as any)?.shows?.title || 'Audition',
                start_time: signup.audition_slots.start_time,
                end_time: signup.audition_slots.end_time
              });
            }
          }
        }

        // Check callbacks
        for (const callback of callbacks) {
          if (callback.callback_slots?.start_time && callback.callback_slots?.end_time && doTimeRangesOverlap(
            itemStart, itemEnd,
            callback.callback_slots.start_time, callback.callback_slots.end_time
          )) {
            conflictingEvents.push({
              type: 'Callback',
              title: callback.callback_slots?.auditions?.shows?.title || 'Callback',
              start_time: callback.callback_slots.start_time,
              end_time: callback.callback_slots.end_time
            });
          }
        }

        // Check other rehearsals
        for (const otherItem of agendaItems) {
          if (otherItem.rehearsal_agenda_items_id !== item.rehearsal_agenda_items_id &&
              otherItem.rehearsal_events?.date) {
            const otherStart = new Date(`${otherItem.rehearsal_events.date}T${otherItem.start_time}`);
            const otherEnd = new Date(`${otherItem.rehearsal_events.date}T${otherItem.end_time}`);
            if (doTimeRangesOverlap(itemStart, itemEnd, otherStart, otherEnd)) {
              conflictingEvents.push({
                type: 'Rehearsal',
                title: otherItem.rehearsal_events?.auditions?.shows?.title || 'Rehearsal',
                start_time: otherStart.toISOString(),
                end_time: otherEnd.toISOString()
              });
            }
          }
        }

        // Check personal events
        for (const pEvent of personalEvents) {
          if (pEvent.start && pEvent.end) {
            const pStart = new Date(pEvent.start);
            const pEnd = new Date(pEvent.end);
            if (doTimeRangesOverlap(itemStart, itemEnd, pStart, pEnd)) {
              conflictingEvents.push({
                type: 'Personal Event',
                title: pEvent.title,
                start_time: pEvent.start,
                end_time: pEvent.end
              });
            }
          }
        }

        if (conflictingEvents.length > 0) {
          // If user already has conflicts for this event, merge them
          const existing = conflictingUsersMap.get(userId);
          if (existing) {
            // Add new conflicts avoiding duplicates
            const existingTitles = new Set(existing.conflicts.map((c: any) => `${c.type}:${c.title}`));
            conflictingEvents.forEach(c => {
              if (!existingTitles.has(`${c.type}:${c.title}`)) {
                existing.conflicts.push(c);
              }
            });
          } else {
            conflictingUsersMap.set(userId, {
              user: {
                id: member.profiles.id,
                first_name: member.profiles.first_name,
                last_name: member.profiles.last_name,
                profile_photo_url: member.profiles.profile_photo_url
              },
              conflicts: conflictingEvents
            });
          }
        }
      }
    }

    if (conflictingUsersMap.size > 0) {
      eventConflicts[event.rehearsal_events_id] = Array.from(conflictingUsersMap.values());
    }
  }

  console.log(`[Batch Conflict Detection] Found conflicts for ${Object.keys(eventConflicts).length} events`);
  return { data: eventConflicts, error: null };
}
