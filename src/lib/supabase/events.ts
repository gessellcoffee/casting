import { supabase } from './client';
import type { EventFormData, CalendarEvent } from './types';
import { expandRecurringEvents } from '@/lib/utils/recurrenceUtils';

// Map a DB row to the CalendarEvent shape expected by UI
function mapRow(row: any): CalendarEvent {
  // Map recurrence rule from the joined table or recurrence_rule_id
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
    title: row.title,
    description: row.description ?? null,
    date: row.date,
    start_time: row.start_time,
    end_time: row.end_time,
    all_day: row.all_day ?? false,
    location: row.location ?? null,
    color: row.color ?? null,
    recurrence_rule_id: row.recurrence_rule_id ?? null,
    is_recurring: row.is_recurring ?? false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getEvents(startDate: Date, endDate: Date, userId: string): Promise<CalendarEvent[]> {
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  // Fetch non-recurring events within the date range
  const { data: nonRecurringData, error: nonRecurringError } = await (supabase as any)
    .from('events')
    .select('*, recurrence_rules(*)')
    .eq('user_id', userId)
    .is('recurrence_rule_id', null)
    .gte('start_time', startIso)
    .lte('start_time', endIso)
    .order('start_time', { ascending: true });

  if (nonRecurringError) {
    throw nonRecurringError;
  }

  // Fetch ALL recurring events for this user (regardless of start date)
  // We need to expand them to see which instances fall within the date range
  const { data: recurringData, error: recurringError } = await (supabase as any)
    .from('events')
    .select('*, recurrence_rules(*)')
    .eq('user_id', userId)
    .not('recurrence_rule_id', 'is', null)
    .order('start_time', { ascending: true });

  if (recurringError) {
    throw recurringError;
  }

  // Map all events
  const nonRecurringEvents = (nonRecurringData || []).map(mapRow);
  const recurringEvents = (recurringData || []).map(mapRow);

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

export async function createEvent(form: EventFormData, userId: string): Promise<CalendarEvent | null> {
  try {
    let recurrenceRuleId: string | null = null;

    // If recurring, create the recurrence rule first
    if (form.isRecurring && form.recurrence && form.recurrence.frequency !== 'NONE') {
      const recurrence = form.recurrence;
      // Use customFrequencyType when frequency is CUSTOM, otherwise use frequency
      const actualFrequency = recurrence.frequency === 'CUSTOM' 
        ? recurrence.customFrequencyType || 'WEEKLY'
        : recurrence.frequency;
      
      const recurrencePayload: any = {
        frequency: actualFrequency,
        interval: recurrence.interval,
        by_day: recurrence.byDay.length > 0 ? recurrence.byDay : null,
        by_month_day: recurrence.byMonthDay.length > 0 ? recurrence.byMonthDay : null,
        by_month: recurrence.byMonth.length > 0 ? recurrence.byMonth : null,
      };

      // Add end conditions
      if (recurrence.endType === 'on' && recurrence.endDate) {
        recurrencePayload.until = new Date(recurrence.endDate).toISOString();
      } else if (recurrence.endType === 'after' && recurrence.occurrences) {
        recurrencePayload.count = recurrence.occurrences;
      }

      const { data: ruleData, error: ruleError } = await (supabase as any)
        .from('recurrence_rules')
        .insert(recurrencePayload)
        .select('id')
        .single();

      if (ruleError) {
        console.error('Error creating recurrence rule:', ruleError);
        throw ruleError;
      }

      recurrenceRuleId = ruleData.id;
    }

    // Create the event
    const payload: any = {
      user_id: userId,
      title: form.title,
      description: form.description ?? null,
      start_time: form.start,
      end_time: form.end,
      all_day: !!form.allDay,
      location: form.location ?? null,
      color: form.color ?? null,
      recurrence_rule_id: recurrenceRuleId,
    };

    const { data, error } = await (supabase as any)
      .from('events')
      .insert(payload)
      .select('*, recurrence_rules(*)')
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }
    return data ? mapRow(data) : null;
  } catch (error) {
    console.error('Error in createEvent:', error);
    throw error;
  }
}

export async function updateEvent(eventId: string, form: EventFormData, userId: string): Promise<CalendarEvent | null> {
  try {
    // Get the current event to check if it has a recurrence rule
    const { data: currentEvent, error: fetchError } = await (supabase as any)
      .from('events')
      .select('recurrence_rule_id')
      .eq('id', eventId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching current event:', fetchError);
      throw fetchError;
    }

    let recurrenceRuleId: string | null = null;

    // Handle recurrence rule updates
    if (form.isRecurring && form.recurrence && form.recurrence.frequency !== 'NONE') {
      const recurrence = form.recurrence;
      // Use customFrequencyType when frequency is CUSTOM, otherwise use frequency
      const actualFrequency = recurrence.frequency === 'CUSTOM' 
        ? recurrence.customFrequencyType || 'WEEKLY'
        : recurrence.frequency;
      
      const recurrencePayload: any = {
        frequency: actualFrequency,
        interval: recurrence.interval,
        by_day: recurrence.byDay.length > 0 ? recurrence.byDay : null,
        by_month_day: recurrence.byMonthDay.length > 0 ? recurrence.byMonthDay : null,
        by_month: recurrence.byMonth.length > 0 ? recurrence.byMonth : null,
      };

      // Add end conditions
      if (recurrence.endType === 'on' && recurrence.endDate) {
        recurrencePayload.until = new Date(recurrence.endDate).toISOString();
      } else if (recurrence.endType === 'after' && recurrence.occurrences) {
        recurrencePayload.count = recurrence.occurrences;
      }

      if (currentEvent.recurrence_rule_id) {
        // Update existing rule
        const { error: ruleError } = await (supabase as any)
          .from('recurrence_rules')
          .update(recurrencePayload)
          .eq('id', currentEvent.recurrence_rule_id);

        if (ruleError) {
          console.error('Error updating recurrence rule:', ruleError);
          throw ruleError;
        }
        recurrenceRuleId = currentEvent.recurrence_rule_id;
      } else {
        // Create new rule
        const { data: ruleData, error: ruleError } = await (supabase as any)
          .from('recurrence_rules')
          .insert(recurrencePayload)
          .select('id')
          .single();

        if (ruleError) {
          console.error('Error creating recurrence rule:', ruleError);
          throw ruleError;
        }
        recurrenceRuleId = ruleData.id;
      }
    } else if (currentEvent.recurrence_rule_id) {
      // Delete the recurrence rule if it exists and is no longer needed
      const { error: deleteError } = await (supabase as any)
        .from('recurrence_rules')
        .delete()
        .eq('id', currentEvent.recurrence_rule_id);

      if (deleteError) {
        console.error('Error deleting recurrence rule:', deleteError);
        // Don't throw here, just log the error
      }
    }

    // Update the event
    const updates: any = {
      title: form.title,
      description: form.description ?? null,
      start_time: form.start,
      end_time: form.end,
      all_day: !!form.allDay,
      location: form.location ?? null,
      color: form.color ?? null,
      recurrence_rule_id: recurrenceRuleId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase as any)
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .eq('user_id', userId)
      .select('*, recurrence_rules(*)')
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }
    return data ? mapRow(data) : null;
  } catch (error) {
    console.error('Error in updateEvent:', error);
    throw error;
  }
}

export async function deleteEvent(eventId: string, userId: string): Promise<boolean> {
  const { error } = await (supabase as any)
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
  return true;
}

// Existing documentation and types retained below for reference

// --- TypeScript Types ---
// These types are used by your React frontend and (optionally) your
// Supabase Edge Functions. They define the shape of the data.

/**
 * Defines the recurrence rule structure.
 * This is flexible and mirrors what rrule.js expects.
 */
export type RecurrenceRule = {
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom';
  interval: number; // e.g., 1 for "Every 1 week", 2 for "Every 2 months"
  endDate: string; // ISO string: 'YYYY-MM-DD'
  
  // For 'Custom' frequency
  customFrequency?: 'weeks' | 'months' | 'years';
  
  // For 'Weekly' or 'Custom' (e.g., every 2 weeks on Mon, Wed)
  // Uses rrule's day constants (RRule.MO, RRule.TU, etc.)
  daysOfWeek?: number[]; 
};

/**
 * Base Event type. This is what you store in the database.
 * It stores the *definition* of the event, not every single instance.
 * This matches the 'events' table schema below.
 */
export type EventDefinition = {
  id: string; // UUID
  userId: string; // To associate with a user
  title: string;
  
  // The start and end time of the *first* occurrence
  startTime: string; // ISO string
  endTime: string; // ISO string
  
  // Null if it does not repeat
  recurrenceRule: RecurrenceRule | null;
};

/**
 * Event Instance type. This is what you pass to the calendar component.
 * It represents a single, viewable occurrence of an event.
 * This type is generated *on the frontend* and is not stored in the DB.
 */
export type EventInstance = {
  id: string; // Can be a composite key like `${eventDefinition.id}-${instanceDate}`
  title: string;
  start: Date;
  end: Date;
  sourceEventId: string; // The ID of the EventDefinition it came from
};


// --- Database Schema (Supabase / PostgreSQL) ---

/*
-- This is the SQL you can run in your Supabase SQL Editor to create the table.
-- This table stores the *definitions* or *rules* for events.

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- This assumes you have a 'profiles' table for users.
    -- Supabase auth uses `auth.users`, but it's common practice to have a
    -- public 'profiles' table with a matching user_id.
    -- If you just want to link to the auth user, you can use:
    -- user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    -- Or, if you have a public profiles table:
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    title TEXT NOT NULL,
    
    -- The start and end time of the *first* occurrence
    start_time TIMESTAMPTZ NOT NULL, 
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Store the complex recurrence rule as a single JSON object.
    -- This is far more flexible than having many nullable columns.
    recurrence_rule JSONB, -- Can be null if the event does not repeat.
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- *** SUPABASE KEY FEATURE: Row Level Security (RLS) ***
-- This is crucial for multi-user security.

-- 1. Enable RLS on the table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy that allows users to see *only their own* events.
--    `auth.uid()` is a Supabase function that gets the ID of the
--    currently authenticated user making the request.
CREATE POLICY "Users can view their own events."
ON public.events FOR SELECT
USING ( auth.uid() = user_id );

-- 3. Create a policy that allows users to insert events *for themselves*.
CREATE POLICY "Users can create their own events."
ON public.events FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- 4. Create a policy that allows users to update *their own* events.
CREATE POLICY "Users can update their own events."
ON public.events FOR UPDATE
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

-- 5. Create a policy that allows users to delete *their own* events.
CREATE POLICY "Users can delete their own events."
ON public.events FOR DELETE
USING ( auth.uid() = user_id );

*/


