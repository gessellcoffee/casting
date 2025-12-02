import { useState, useEffect, useCallback } from 'react';
import type { CalendarEvent } from '@/lib/supabase/types';
import { getEvents as fetchEvents, createEvent, updateEvent, deleteEvent } from '@/lib/supabase/events';

export function useEvents(userId: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadEvents = useCallback(async (startDate: Date, endDate: Date) => {
    if (!userId) return;
    
    console.log('[useEvents] Loading events for date range:', { startDate, endDate, userId });
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchEvents(startDate, endDate, userId);
      console.log(`[useEvents] Loaded ${data.length} personal events`);
      setEvents(data);
    } catch (err) {
      console.error('[useEvents] Error loading events:', err);
      setError(err instanceof Error ? err : new Error('Failed to load events'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addEvent = async (eventData: any) => {
    try {
      const newEvent = await createEvent(eventData, userId);
      if (newEvent) {
        setEvents(prev => [...prev, newEvent]);
      }
      return newEvent;
    } catch (err) {
      console.error('Error creating event:', err);
      throw err;
    }
  };

  const editEvent = async (eventId: string, updates: any) => {
    try {
      const updatedEvent = await updateEvent(eventId, updates, userId);
      if (updatedEvent) {
        setEvents(prev => 
          prev.map(evt => evt.id === eventId ? { ...evt, ...updatedEvent } : evt)
        );
      }
      return updatedEvent;
    } catch (err) {
      console.error('Error updating event:', err);
      throw err;
    }
  };

  const removeEvent = async (eventId: string) => {
    try {
      const success = await deleteEvent(eventId, userId);
      if (success) {
        setEvents(prev => prev.filter(evt => evt.id !== eventId));
      }
      return success;
    } catch (err) {
      console.error('Error deleting event:', err);
      throw err;
    }
  };

  return {
    events,
    loading,
    error,
    loadEvents,
    addEvent,
    editEvent,
    deleteEvent: removeEvent,
  };
}

export default useEvents;
