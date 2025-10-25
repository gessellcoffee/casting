import { supabase } from './client';
import type { EventFormData } from './types';

export type CalendarEvent = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  start: string | Date; // stored as ISO string from DB, UI may convert to Date
  end: string | Date;
  allDay?: boolean;
  location?: string | null;
  color?: string | null;
  isRecurring?: boolean;
  recurrenceRule?: any | null;
};

// Map a DB row to the CalendarEvent shape expected by UI
function mapRow(row: any): CalendarEvent {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? null,
    start: row.start_time,
    end: row.end_time,
    allDay: row.all_day ?? false,
    location: row.location ?? null,
    color: row.color ?? null,
    isRecurring: !!row.recurrence_rule,
    recurrenceRule: row.recurrence_rule ?? null,
  };
}

export async function getEvents(startDate: Date, endDate: Date, userId: string): Promise<CalendarEvent[]> {
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  const { data, error } = await (supabase as any)
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', startIso)
    .lte('start_time', endIso)
    .order('start_time', { ascending: true });

  if (error) {
    throw error;
  }
  return (data || []).map(mapRow);
}

export async function createEvent(form: EventFormData, userId: string): Promise<CalendarEvent | null> {
  const payload: any = {
    user_id: userId,
    title: form.title,
    description: form.description ?? null,
    start_time: form.start,
    end_time: form.end,
    all_day: !!form.allDay,
    location: form.location ?? null,
    color: form.color ?? null,
    recurrence_rule: form.isRecurring ? {
      frequency: form.recurrence.frequency,
      interval: form.recurrence.interval,
      byDay: form.recurrence.byDay,
      byMonthDay: form.recurrence.byMonthDay,
      byMonth: form.recurrence.byMonth,
      endType: form.recurrence.endType,
      endDate: form.recurrence.endDate,
      occurrences: form.recurrence.occurrences,
    } : null,
  };

  const { data, error } = await (supabase as any)
    .from('events')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data ? mapRow(data) : null;
}

export async function updateEvent(eventId: string, form: EventFormData, userId: string): Promise<CalendarEvent | null> {
  const updates: any = {
    title: form.title,
    description: form.description ?? null,
    start_time: form.start,
    end_time: form.end,
    all_day: !!form.allDay,
    location: form.location ?? null,
    color: form.color ?? null,
    recurrence_rule: form.isRecurring ? {
      frequency: form.recurrence.frequency,
      interval: form.recurrence.interval,
      byDay: form.recurrence.byDay,
      byMonthDay: form.recurrence.byMonthDay,
      byMonth: form.recurrence.byMonth,
      endType: form.recurrence.endType,
      endDate: form.recurrence.endDate,
      occurrences: form.recurrence.occurrences,
    } : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase as any)
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data ? mapRow(data) : null;
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


