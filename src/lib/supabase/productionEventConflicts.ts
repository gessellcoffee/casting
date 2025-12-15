import { supabase } from '@/lib/supabase/client';
import { getUserSignupsWithDetails, getUserRehearsalAgendaItems } from './auditionSignups';
import { getUserAcceptedCallbacks } from './callbackInvitations';
import { getEvents } from './events';

function doTimeRangesOverlap(start1: string | Date, end1: string | Date, start2: string | Date, end2: string | Date): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  return s1 < e2 && s2 < e1;
}

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function combineLocalDateAndTime(dateStr: string, timeStr: string): Date {
  const d = parseLocalDate(dateStr);
  const [h, m] = timeStr.split(':');
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d;
}

export async function getProductionEventConflictSummary(productionEventId: string) {
  const { data: event, error: eventError } = await supabase
    .from('production_events')
    .select(`
      production_event_id,
      audition_id,
      date,
      start_time,
      end_time,
      location,
      notes,
      production_event_types (name, color),
      production_event_assignments (
        production_event_assignment_id,
        user_id,
        profiles (
          id,
          first_name,
          last_name,
          profile_photo_url
        )
      )
    `)
    .eq('production_event_id', productionEventId)
    .single();

  if (eventError || !event) {
    console.error('Error fetching production event for conflicts:', eventError);
    return { data: [], error: eventError };
  }

  const eventType = Array.isArray((event as any).production_event_types)
    ? (event as any).production_event_types[0]
    : (event as any).production_event_types;
  const eventTypeName = eventType?.name || 'Production Event';

  if (!event.start_time || !event.end_time) {
    return {
      data: [
        {
          rehearsal_agenda_items_id: event.production_event_id,
          title: eventTypeName,
          start_time: event.start_time || '',
          end_time: event.end_time || '',
          conflicts: [],
        },
      ],
      error: null,
    };
  }

  const dayStart = new Date(parseLocalDate(event.date));
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(parseLocalDate(event.date));
  dayEnd.setHours(23, 59, 59, 999);

  const eventStart = combineLocalDateAndTime(event.date, event.start_time);
  const eventEnd = combineLocalDateAndTime(event.date, event.end_time);

  const assignments = event.production_event_assignments || [];

  const conflicts = await Promise.all(
    assignments.map(async (a: any) => {
      const userId = a.user_id;
      if (!userId) return null;

      const [signups, callbacks, agendaItems, personalEvents] = await Promise.all([
        getUserSignupsWithDetails(userId),
        getUserAcceptedCallbacks(userId),
        getUserRehearsalAgendaItems(userId),
        getEvents(dayStart, dayEnd, userId),
      ]);

      const conflictingEvents: { type: string; title: string; start_time: string; end_time: string }[] = [];

      (signups || []).forEach((s: any) => {
        const slot = s.audition_slots;
        if (!slot?.start_time || !slot?.end_time) return;
        if (doTimeRangesOverlap(eventStart, eventEnd, slot.start_time, slot.end_time)) {
          conflictingEvents.push({
            type: 'Audition Signup',
            title: slot.auditions?.shows?.title ? `${slot.auditions.shows.title} - Audition` : 'Audition',
            start_time: slot.start_time,
            end_time: slot.end_time,
          });
        }
      });

      (callbacks || []).forEach((c: any) => {
        const slot = c.callback_slots;
        if (!slot?.start_time || !slot?.end_time) return;
        if (doTimeRangesOverlap(eventStart, eventEnd, slot.start_time, slot.end_time)) {
          conflictingEvents.push({
            type: 'Callback',
            title: slot.auditions?.shows?.title ? `${slot.auditions.shows.title} - Callback` : 'Callback',
            start_time: slot.start_time,
            end_time: slot.end_time,
          });
        }
      });

      (agendaItems || []).forEach((item: any) => {
        const rehearsalEvent = item.rehearsal_event;
        if (!rehearsalEvent?.date || !item.start_time || !item.end_time) return;
        if (rehearsalEvent.date !== event.date) return;

        const start = combineLocalDateAndTime(rehearsalEvent.date, item.start_time);
        const end = combineLocalDateAndTime(rehearsalEvent.date, item.end_time);

        if (doTimeRangesOverlap(eventStart, eventEnd, start, end)) {
          conflictingEvents.push({
            type: 'Rehearsal',
            title: rehearsalEvent.auditions?.shows?.title ? `${rehearsalEvent.auditions.shows.title} - Rehearsal` : 'Rehearsal',
            start_time: start.toISOString(),
            end_time: end.toISOString(),
          });
        }
      });

      (personalEvents || []).forEach((pe: any) => {
        const start = pe.start_time || pe.start;
        const end = pe.end_time || pe.end;
        if (!start || !end) return;
        if (doTimeRangesOverlap(eventStart, eventEnd, start, end)) {
          conflictingEvents.push({
            type: 'Personal Event',
            title: pe.title || 'Personal Event',
            start_time: start,
            end_time: end,
          });
        }
      });

      if (conflictingEvents.length === 0) return null;

      return {
        agenda_assignments_id: `prod-${event.production_event_id}-${userId}`,
        status: 'conflict',
        user_id: userId,
        profiles: a.profiles,
        conflicting_events: conflictingEvents,
      };
    })
  );

  const conflictsList = conflicts.filter(Boolean);

  return {
    data: [
      {
        rehearsal_agenda_items_id: event.production_event_id,
        title: eventTypeName,
        start_time: event.start_time,
        end_time: event.end_time,
        conflicts: conflictsList,
      },
    ],
    error: null,
  };
}
