import { supabase } from './client';
import type { CalendarEvent } from './types';
import { expandRecurringEvents } from '@/lib/utils/recurrenceUtils';

/**
 * Get user events for casting directors to view availability
 * Returns events with titles hidden for privacy
 */
export async function getUserAvailability(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  // Debug: Check if user has ANY events at all
  const { data: allUserEvents, error: allEventsError } = await (supabase as any)
    .from('events')
    .select('id, start_time, end_time, all_day')
    .eq('user_id', userId)
    .limit(5);

  // Fetch non-recurring events that overlap with the date range
  // An event overlaps if: event.start <= rangeEnd AND event.end >= rangeStart
  const { data: nonRecurringData, error: nonRecurringError } = await (supabase as any)
    .from('events')
    .select('id, user_id, start_time, end_time, all_day, recurrence_rule_id, recurrence_rules(*)')
    .eq('user_id', userId)
    .is('recurrence_rule_id', null)
    .lte('start_time', endIso)
    .gte('end_time', startIso)
    .order('start_time', { ascending: true });

  if (nonRecurringError) {
    console.error('[getUserAvailability] Error fetching non-recurring events:', nonRecurringError);
    throw nonRecurringError;
  }

  // Fetch ALL recurring events for this user
  const { data: recurringData, error: recurringError } = await (supabase as any)
    .from('events')
    .select('id, user_id, start_time, end_time, all_day, recurrence_rule_id, recurrence_rules(*)')
    .eq('user_id', userId)
    .not('recurrence_rule_id', 'is', null)
    .order('start_time', { ascending: true });

  if (recurringError) {
    console.error('[getUserAvailability] Error fetching recurring events:', recurringError);
    throw recurringError;
  }

  // Map events with hidden titles
  const mapEventWithoutTitle = (row: any): CalendarEvent => {
    let recurrenceRule = null;
    if (row.recurrence_rules) {
      recurrenceRule = {
        frequency: row.recurrence_rules.frequency,
        interval: row.recurrence_rules.interval,
        byDay: row.recurrence_rules.by_day || [],
        byMonthDay: row.recurrence_rules.by_month_day || [],
        byMonth: row.recurrence_rules.by_month || [],
        until: row.recurrence_rules.until,
        count: row.recurrence_rules.count,
      };
    }

    return {
      id: row.id,
      event_id: row.id,
      user_id: row.user_id,
      title: 'Busy', // Hide the actual event name
      description: null, // Hide description
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
      location: null, // Hide location
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  };

  const nonRecurringEvents = (nonRecurringData || []).map(mapEventWithoutTitle);
  const recurringEvents = (recurringData || []).map(mapEventWithoutTitle);

  // Expand recurring events into instances within the date range
  const expandedRecurringEvents = expandRecurringEvents(recurringEvents, startDate, endDate);

  // Combine and sort all events
  const allEvents = [...nonRecurringEvents, ...expandedRecurringEvents];
  
  return allEvents.sort((a, b) => {
    const aTime = new Date(a.start).getTime();
    const bTime = new Date(b.start).getTime();
    return aTime - bTime;
  });
}
