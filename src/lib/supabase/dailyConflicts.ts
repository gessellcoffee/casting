import { supabase } from './client';
import { getAuthenticatedUser } from './auth';

export interface DailyConflict {
  user_id: string;
  full_name: string;
  profile_photo_url?: string | null;
  conflict_type: 'rehearsal' | 'production_event' | 'callback' | 'audition' | 'personal_calendar';
  event_title?: string;
  start_time?: string;
  end_time?: string;
}

export interface DailyConflictSummary {
  date: string; // YYYY-MM-DD format
  conflicts: DailyConflict[];
  total_conflicts: number;
}

/**
 * Get daily conflicts for a specific rehearsal event
 */
export async function getDailyConflictsForRehearsalEvent(
  auditionId: string,
  eventDate: string, // YYYY-MM-DD format
  startTime: string, // HH:MM:SS format
  endTime: string    // HH:MM:SS format
): Promise<{ data: DailyConflictSummary | null; error: any }> {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return { data: null, error: authError || new Error('Not authenticated') };
    }

    // Get all production team members and cast members for this audition
    const [productionTeamResult, castMembersResult] = await Promise.all([
      // Production team members
      supabase
        .from('production_team_members')
        .select(`
          user_id,
          profiles!user_id (
            id,
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .eq('audition_id', auditionId),

      // Cast members
      supabase
        .from('cast_members')
        .select(`
          user_id,
          profiles!user_id (
            id,
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .eq('audition_id', auditionId)
    ]);

    if (productionTeamResult.error) {
      return { data: null, error: productionTeamResult.error };
    }
    if (castMembersResult.error) {
      return { data: null, error: castMembersResult.error };
    }

    // Combine all users and create a map for quick lookup
    const allUsers = new Map<string, any>();
    
    (productionTeamResult.data || []).forEach((member: any) => {
      if (member.profiles) {
        allUsers.set(member.user_id, {
          user_id: member.user_id,
          full_name: `${member.profiles.first_name} ${member.profiles.last_name}`,
          profile_photo_url: member.profiles.profile_photo_url,
        });
      }
    });

    (castMembersResult.data || []).forEach((member: any) => {
      if (member.profiles) {
        allUsers.set(member.user_id, {
          user_id: member.user_id,
          full_name: `${member.profiles.first_name} ${member.profiles.last_name}`,
          profile_photo_url: member.profiles.profile_photo_url,
        });
      }
    });

    const userIds = Array.from(allUsers.keys());
    if (userIds.length === 0) {
      return { 
        data: { 
          date: eventDate, 
          conflicts: [], 
          total_conflicts: 0 
        }, 
        error: null 
      };
    }

    // Create datetime strings for the rehearsal event (assume local timezone)
    const eventStartDateTime = `${eventDate}T${startTime}`;
    const eventEndDateTime = `${eventDate}T${endTime}`;
    
    console.log('Rehearsal event time range:', { eventStartDateTime, eventEndDateTime });

    // Get all conflicts for these users on the event date
    const [rehearsalConflicts, productionConflicts, callbackConflicts, auditionConflicts, personalCalendarConflicts] = await Promise.all([
      // Other rehearsal events conflicts - simplified to avoid complex joins
      Promise.resolve({ data: [], error: null }),

      // Production events conflicts - simplified
      Promise.resolve({ data: [], error: null }),

      // Callback conflicts - simplified
      Promise.resolve({ data: [], error: null }),

      // Audition conflicts - simplified
      Promise.resolve({ data: [], error: null }),

      // Personal calendar events conflicts - get events that might overlap with the rehearsal
      supabase
        .from('events')
        .select(`
          user_id,
          title,
          start_time,
          end_time,
          all_day
        `)
        .in('user_id', userIds)
        .gte('start_time', `${eventDate}T00:00:00`)
        .lt('start_time', `${eventDate}T23:59:59`)
    ]);

    const conflicts: DailyConflict[] = [];

    // Helper function to check if two time ranges overlap
    const doTimeRangesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
      const s1 = new Date(start1).getTime();
      const e1 = new Date(end1).getTime();
      const s2 = new Date(start2).getTime();
      const e2 = new Date(end2).getTime();
      return s1 < e2 && s2 < e1;
    };

    // Process rehearsal conflicts
    (rehearsalConflicts.data || []).forEach((event: any) => {
      const eventStart = `${event.date}T${event.start_time}`;
      const eventEnd = `${event.date}T${event.end_time}`;
      
      if (doTimeRangesOverlap(eventStartDateTime, eventEndDateTime, eventStart, eventEnd)) {
        // Get unique users assigned to this rehearsal
        const assignedUsers = new Set<string>();
        (event.rehearsal_agenda_items || []).forEach((item: any) => {
          (item.agenda_assignments || []).forEach((assignment: any) => {
            assignedUsers.add(assignment.user_id);
          });
        });

        assignedUsers.forEach(userId => {
          const user = allUsers.get(userId);
          if (user) {
            conflicts.push({
              ...user,
              conflict_type: 'rehearsal',
              event_title: event.auditions?.shows?.title || 'Rehearsal',
              start_time: event.start_time,
              end_time: event.end_time,
            });
          }
        });
      }
    });

    // Process production event conflicts
    (productionConflicts.data || []).forEach((event: any) => {
      const eventStart = `${event.date}T${event.start_time}`;
      const eventEnd = `${event.date}T${event.end_time}`;
      
      if (doTimeRangesOverlap(eventStartDateTime, eventEndDateTime, eventStart, eventEnd)) {
        (event.production_event_assignments || []).forEach((assignment: any) => {
          const user = allUsers.get(assignment.user_id);
          if (user) {
            conflicts.push({
              ...user,
              conflict_type: 'production_event',
              event_title: event.title || 'Production Event',
              start_time: event.start_time,
              end_time: event.end_time,
            });
          }
        });
      }
    });

    // Process callback conflicts
    (callbackConflicts.data || []).forEach((callback: any) => {
      const callbackDateTime = `${callback.callback_date}T${callback.callback_time}:00`;
      const callbackEndTime = new Date(new Date(callbackDateTime).getTime() + 30 * 60000).toISOString(); // Assume 30 min duration
      
      if (doTimeRangesOverlap(eventStartDateTime, eventEndDateTime, callbackDateTime, callbackEndTime)) {
        const user = allUsers.get(callback.user_id);
        if (user) {
          conflicts.push({
            ...user,
            conflict_type: 'callback',
            event_title: callback.auditions?.shows?.title || 'Callback',
            start_time: callback.callback_time,
            end_time: null,
          });
        }
      }
    });

    // Process audition conflicts
    (auditionConflicts.data || []).forEach((signup: any) => {
      const slotStart = `${signup.audition_slots.date}T${signup.audition_slots.start_time}`;
      const slotEnd = `${signup.audition_slots.date}T${signup.audition_slots.end_time}`;
      
      if (doTimeRangesOverlap(eventStartDateTime, eventEndDateTime, slotStart, slotEnd)) {
        const user = allUsers.get(signup.user_id);
        if (user) {
          conflicts.push({
            ...user,
            conflict_type: 'audition',
            event_title: signup.audition_slots.auditions?.shows?.title || 'Audition',
            start_time: signup.audition_slots.start_time,
            end_time: signup.audition_slots.end_time,
          });
        }
      }
    });

    // Process personal calendar conflicts
    (personalCalendarConflicts.data || []).forEach((event: any) => {
      console.log('Processing personal calendar event:', {
        title: event.title,
        user_id: event.user_id,
        start_time: event.start_time,
        end_time: event.end_time,
        all_day: event.all_day
      });
      
      if (event.all_day) {
        // All-day events conflict with any event on that day
        const user = allUsers.get(event.user_id);
        if (user) {
          console.log('Adding all-day conflict for user:', user.full_name);
          conflicts.push({
            ...user,
            conflict_type: 'personal_calendar',
            event_title: event.title || 'Personal Event',
            start_time: null,
            end_time: null,
          });
        }
      } else {
        // Check time overlap for timed events - handle timezone conversion properly
        const eventEnd = event.end_time || new Date(new Date(event.start_time).getTime() + 60 * 60000).toISOString();
        
        // Convert UTC times to local timezone (CST is UTC-6)
        const personalStartUTC = new Date(event.start_time);
        const personalEndUTC = new Date(eventEnd);
        
        // Convert to local time by adjusting for timezone offset
        const personalStartLocal = new Date(personalStartUTC.getTime() - (personalStartUTC.getTimezoneOffset() * 60000));
        const personalEndLocal = new Date(personalEndUTC.getTime() - (personalEndUTC.getTimezoneOffset() * 60000));
        
        const personalStartLocalStr = personalStartLocal.toISOString().replace('Z', '');
        const personalEndLocalStr = personalEndLocal.toISOString().replace('Z', '');
        
        console.log('Checking time overlap:', {
          rehearsalStart: eventStartDateTime,
          rehearsalEnd: eventEndDateTime,
          personalStart: event.start_time,
          personalEnd: eventEnd,
          personalStartLocal: personalStartLocalStr,
          personalEndLocal: personalEndLocalStr,
          personalStartUTC: personalStartUTC.toISOString(),
          personalEndUTC: personalEndUTC.toISOString()
        });
        
        const overlaps = doTimeRangesOverlap(eventStartDateTime, eventEndDateTime, personalStartLocalStr, personalEndLocalStr);
        console.log('Time ranges overlap:', overlaps);
        
        if (overlaps) {
          const user = allUsers.get(event.user_id);
          if (user) {
            console.log('Adding timed conflict for user:', user.full_name);
            conflicts.push({
              ...user,
              conflict_type: 'personal_calendar',
              event_title: event.title || 'Personal Event',
              start_time: event.start_time,
              end_time: event.end_time,
            });
          }
        }
      }
    });

    return {
      data: {
        date: eventDate,
        conflicts,
        total_conflicts: conflicts.length,
      },
      error: null
    };

  } catch (error) {
    console.error('Error fetching daily conflicts for rehearsal event:', error);
    return { data: null, error };
  }
}

/**
 * Get daily conflicts for all production team members and cast members for a date range
 */
export async function getDailyConflictsForAudition(
  auditionId: string,
  startDate: Date,
  endDate: Date
): Promise<{ data: Record<string, DailyConflictSummary> | null; error: any }> {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return { data: null, error: authError || new Error('Not authenticated') };
    }

    // Format dates for SQL
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    // Get all production team members and cast members for this audition
    const [productionTeamResult, castMembersResult] = await Promise.all([
      // Production team members
      supabase
        .from('production_team_members')
        .select(`
          user_id,
          profiles!user_id (
            id,
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .eq('audition_id', auditionId)
        .eq('status', 'active'),
      
      // Cast members
      supabase
        .from('cast_members')
        .select(`
          user_id,
          profiles!user_id (
            id,
            first_name,
            last_name,
            profile_photo_url
          ),
          auditions!inner(audition_id)
        `)
        .eq('auditions.audition_id', auditionId)
    ]);

    if (productionTeamResult.error) {
      console.error('Error fetching production team members:', productionTeamResult.error);
      return { data: null, error: productionTeamResult.error };
    }

    if (castMembersResult.error) {
      console.error('Error fetching cast members:', castMembersResult.error);
      return { data: null, error: castMembersResult.error };
    }

    // Combine and deduplicate users
    const allUsers = new Map();
    
    (productionTeamResult.data || []).forEach((member: any) => {
      if (member.profiles) {
        allUsers.set(member.user_id, {
          user_id: member.user_id,
          full_name: `${member.profiles.first_name || ''} ${member.profiles.last_name || ''}`.trim() || 'Unknown User',
          profile_photo_url: member.profiles.profile_photo_url,
        });
      }
    });

    (castMembersResult.data || []).forEach((member: any) => {
      if (member.profiles) {
        allUsers.set(member.user_id, {
          user_id: member.user_id,
          full_name: `${member.profiles.first_name || ''} ${member.profiles.last_name || ''}`.trim() || 'Unknown User',
          profile_photo_url: member.profiles.profile_photo_url,
        });
      }
    });

    const userIds = Array.from(allUsers.keys());
    if (userIds.length === 0) {
      return { data: {}, error: null };
    }

    // Get all conflicts for these users in the date range
    const [rehearsalConflicts, productionConflicts, callbackConflicts, auditionConflicts, personalCalendarConflicts] = await Promise.all([
      // Rehearsal events conflicts
      supabase
        .from('agenda_assignments')
        .select(`
          user_id,
          rehearsal_agenda_items!inner(
            title,
            start_time,
            end_time,
            rehearsal_events!inner(
              date,
              audition_id
            )
          )
        `)
        .in('user_id', userIds)
        .gte('rehearsal_agenda_items.rehearsal_events.date', startDateStr)
        .lte('rehearsal_agenda_items.rehearsal_events.date', endDateStr)
        .neq('rehearsal_agenda_items.rehearsal_events.audition_id', auditionId),

      // Production events conflicts
      supabase
        .from('production_event_assignments')
        .select(`
          user_id,
          production_events!inner(
            date,
            start_time,
            end_time,
            audition_id,
            production_event_types(name)
          )
        `)
        .in('user_id', userIds)
        .gte('production_events.date', startDateStr)
        .lte('production_events.date', endDateStr)
        .neq('production_events.audition_id', auditionId),

      // Callback conflicts
      supabase
        .from('callback_invitations')
        .select(`
          user_id,
          callback_slots!inner(
            date,
            start_time,
            end_time,
            auditions!inner(
              audition_id,
              shows(title)
            )
          )
        `)
        .in('user_id', userIds)
        .eq('status', 'accepted')
        .gte('callback_slots.date', startDateStr)
        .lte('callback_slots.date', endDateStr)
        .neq('callback_slots.auditions.audition_id', auditionId),

      // Audition signup conflicts
      supabase
        .from('audition_signups')
        .select(`
          user_id,
          audition_slots!inner(
            date,
            start_time,
            end_time,
            auditions!inner(
              audition_id,
              shows(title)
            )
          )
        `)
        .in('user_id', userIds)
        .gte('audition_slots.date', startDateStr)
        .lte('audition_slots.date', endDateStr)
        .neq('audition_slots.auditions.audition_id', auditionId),

      // Personal calendar events conflicts
      supabase
        .from('events')
        .select(`
          user_id,
          title,
          start_time,
          end_time,
          all_day
        `)
        .in('user_id', userIds)
        .gte('start_time', startDateStr)
        .lte('start_time', endDateStr + 'T23:59:59')
    ]);

    // Process conflicts by date
    const conflictsByDate: Record<string, DailyConflictSummary> = {};

    const addConflict = (dateStr: string, conflict: DailyConflict) => {
      if (!conflictsByDate[dateStr]) {
        conflictsByDate[dateStr] = {
          date: dateStr,
          conflicts: [],
          total_conflicts: 0,
        };
      }
      conflictsByDate[dateStr].conflicts.push(conflict);
      conflictsByDate[dateStr].total_conflicts++;
    };

    // Process rehearsal conflicts
    (rehearsalConflicts.data || []).forEach((assignment: any) => {
      const user = allUsers.get(assignment.user_id);
      if (user && assignment.rehearsal_agenda_items) {
        addConflict(assignment.rehearsal_agenda_items.rehearsal_events.date, {
          ...user,
          conflict_type: 'rehearsal',
          event_title: assignment.rehearsal_agenda_items.title,
          start_time: assignment.rehearsal_agenda_items.start_time,
          end_time: assignment.rehearsal_agenda_items.end_time,
        });
      }
    });

    // Process production event conflicts
    (productionConflicts.data || []).forEach((assignment: any) => {
      const user = allUsers.get(assignment.user_id);
      if (user && assignment.production_events) {
        addConflict(assignment.production_events.date, {
          ...user,
          conflict_type: 'production_event',
          event_title: assignment.production_events.production_event_types?.name || 'Production Event',
          start_time: assignment.production_events.start_time,
          end_time: assignment.production_events.end_time,
        });
      }
    });

    // Process callback conflicts
    (callbackConflicts.data || []).forEach((invitation: any) => {
      const user = allUsers.get(invitation.user_id);
      if (user && invitation.callback_slots) {
        addConflict(invitation.callback_slots.date, {
          ...user,
          conflict_type: 'callback',
          event_title: `${invitation.callback_slots.auditions.shows.title} Callback`,
          start_time: invitation.callback_slots.start_time,
          end_time: invitation.callback_slots.end_time,
        });
      }
    });

    // Process audition conflicts
    (auditionConflicts.data || []).forEach((signup: any) => {
      const user = allUsers.get(signup.user_id);
      if (user && signup.audition_slots) {
        addConflict(signup.audition_slots.date, {
          ...user,
          conflict_type: 'audition',
          event_title: `${signup.audition_slots.auditions.shows.title} Audition`,
          start_time: signup.audition_slots.start_time,
          end_time: signup.audition_slots.end_time,
        });
      }
    });

    // Process personal calendar conflicts
    (personalCalendarConflicts.data || []).forEach((event: any) => {
      const user = allUsers.get(event.user_id);
      if (user) {
        // Extract date from start_time for grouping
        const eventDate = event.start_time ? event.start_time.split('T')[0] : null;
        if (eventDate) {
          addConflict(eventDate, {
            ...user,
            conflict_type: 'personal_calendar',
            event_title: event.title || 'Personal Event',
            start_time: event.all_day ? null : event.start_time,
            end_time: event.all_day ? null : event.end_time,
          });
        }
      }
    });

    return { data: conflictsByDate, error: null };
  } catch (error) {
    console.error('Error fetching daily conflicts:', error);
    return { data: null, error };
  }
}
