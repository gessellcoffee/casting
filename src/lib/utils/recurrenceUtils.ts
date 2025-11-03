import { RRule, Frequency } from 'rrule';
import type { CalendarEvent } from '@/lib/supabase/types';

/**
 * Expands a recurring event into individual instances within a date range
 */
export function expandRecurringEvent(
  event: CalendarEvent,
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  // If not recurring, return the original event
  if (!event.isRecurring || !event.recurrenceRule) {
    return [event];
  }

  const { recurrenceRule } = event;
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const duration = eventEnd.getTime() - eventStart.getTime();

  console.log('[expandRecurringEvent] Processing event:', {
    title: event.title,
    eventStart,
    recurrenceRule,
    dateRange: { startDate, endDate }
  });

  try {
    // Map frequency string to RRule frequency
    const frequencyMap: Record<string, Frequency> = {
      DAILY: RRule.DAILY,
      WEEKLY: RRule.WEEKLY,
      MONTHLY: RRule.MONTHLY,
      YEARLY: RRule.YEARLY,
    };

    const freq = frequencyMap[recurrenceRule.frequency];
    if (!freq) {
      console.warn(`Unknown frequency: ${recurrenceRule.frequency}`);
      return [event];
    }

    // Map day strings to RRule weekday objects
    const byweekday = recurrenceRule.byDay?.map((day: string) => {
      const dayMap: Record<string, any> = {
        MO: RRule.MO,
        TU: RRule.TU,
        WE: RRule.WE,
        TH: RRule.TH,
        FR: RRule.FR,
        SA: RRule.SA,
        SU: RRule.SU,
      };
      return dayMap[day];
    }).filter(Boolean);

    // Build RRule options
    const rruleOptions: any = {
      freq,
      interval: recurrenceRule.interval || 1,
      dtstart: eventStart,
    };

    // Add end conditions
    if (recurrenceRule.until) {
      rruleOptions.until = new Date(recurrenceRule.until);
    } else if (recurrenceRule.count) {
      rruleOptions.count = recurrenceRule.count;
    }

    // Add by-rules
    if (byweekday && byweekday.length > 0) {
      rruleOptions.byweekday = byweekday;
    }
    if (recurrenceRule.byMonthDay && recurrenceRule.byMonthDay.length > 0) {
      rruleOptions.bymonthday = recurrenceRule.byMonthDay;
    }
    if (recurrenceRule.byMonth && recurrenceRule.byMonth.length > 0) {
      rruleOptions.bymonth = recurrenceRule.byMonth;
    }

    // Create RRule and generate occurrences
    const rule = new RRule(rruleOptions);
    const occurrences = rule.between(startDate, endDate, true);

    console.log('[expandRecurringEvent] Generated occurrences:', occurrences.length, occurrences.slice(0, 3));

    // Map occurrences to event instances
    return occurrences.map((occurrenceDate, index) => {
      const instanceStart = new Date(occurrenceDate);
      const instanceEnd = new Date(instanceStart.getTime() + duration);

      return {
        ...event,
        id: `${event.id}_${instanceStart.getTime()}`, // Unique ID for each instance
        start: instanceStart.toISOString(),
        end: instanceEnd.toISOString(),
        // Add metadata to identify this as an instance
        _isInstance: true,
        _originalEventId: event.id,
        _instanceDate: instanceStart.toISOString(),
      } as CalendarEvent;
    });
  } catch (error) {
    console.error('Error expanding recurring event:', error, event);
    return [event]; // Return original event on error
  }
}

/**
 * Expands all recurring events in an array
 */
export function expandRecurringEvents(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  const expandedEvents: CalendarEvent[] = [];

  for (const event of events) {
    const instances = expandRecurringEvent(event, startDate, endDate);
    expandedEvents.push(...instances);
  }

  // Sort by start time
  return expandedEvents.sort((a, b) => {
    const aTime = new Date(a.start).getTime();
    const bTime = new Date(b.start).getTime();
    return aTime - bTime;
  });
}
