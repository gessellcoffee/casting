'use client';

import { useEffect, useMemo, useState } from 'react';
import AuditionEventModal from './AuditionEventModal';
import CallbackDetailsModal from '@/components/callbacks/CallbackDetailsModal';
import { useGroupedSignups } from '@/lib/hooks/useGroupedSignups';
import { isToday } from '@/lib/utils/dateUtils';
import useEvents from '@/hooks/useEvents';
import EventForm from '@/components/events/EventForm';
import PersonalEventModal from '@/components/events/PersonalEventModal';
import type { CalendarEvent } from '@/lib/supabase/types';
import type { ProductionDateEvent } from '@/lib/utils/calendarEvents';

interface CalendarWeekViewProps {
  signups: any[];
  callbacks?: any[];
  productionEvents?: ProductionDateEvent[];
  currentDate: Date;
  userId: string;
  onRefresh?: () => void;
}

export default function CalendarWeekView({ signups, callbacks = [], productionEvents = [], currentDate, userId, onRefresh }: CalendarWeekViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showPersonalEventsModal, setShowPersonalEventsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPersonalEvent, setSelectedPersonalEvent] = useState<CalendarEvent | null>(null);
  const [editingPersonalEvent, setEditingPersonalEvent] = useState<CalendarEvent | null>(null);
  const { events, loadEvents } = useEvents(userId);

  // Generate week days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [currentDate]);

  // Load personal events in week range
  const weekRange = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [currentDate]);

  useEffect(() => {
    loadEvents(weekRange.start, weekRange.end);
  }, [weekRange.start.getTime(), weekRange.end.getTime(), loadEvents]);

  const personalByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    events.forEach(evt => {
      // Create Date from ISO string - this will be in local time
      const dt = new Date((evt as any).start);
      // Use local date components to avoid UTC conversion issues
      const year = dt.getFullYear();
      const month = dt.getMonth();
      const date = dt.getDate();
      const key = `${year}-${month}-${date}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(evt);
    });
    return grouped;
  }, [events]);

  // Group signups by date
  const signupsByDate = useGroupedSignups(signups);

  // Group callbacks by date
  const callbacksByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    callbacks.forEach(callback => {
      if (callback.callback_slots?.start_time) {
        const date = new Date(callback.callback_slots.start_time);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(callback);
      }
    });
    return grouped;
  }, [callbacks]);

  // Get signups for a specific date
  const getSignupsForDate = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return (signupsByDate[dateKey] || []).sort((a, b) => {
      const timeA = new Date(a.audition_slots.start_time).getTime();
      const timeB = new Date(b.audition_slots.start_time).getTime();
      return timeA - timeB;
    });
  };

  // Get callbacks for a specific date
  const getCallbacksForDate = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return (callbacksByDate[dateKey] || []).sort((a, b) => {
      const timeA = new Date(a.callback_slots.start_time).getTime();
      const timeB = new Date(b.callback_slots.start_time).getTime();
      return timeA - timeB;
    });
  };

  const getPersonalForDate = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return (personalByDate[dateKey] || []).sort((a: any, b: any) => {
      const timeA = new Date(a.start).getTime();
      const timeB = new Date(b.start).getTime();
      return timeA - timeB;
    });
  };

  // Group production events by individual dates
  const productionByDate = useMemo(() => {
    const grouped: Record<string, ProductionDateEvent[]> = {};
    productionEvents.forEach(evt => {
      const eventDate = new Date(evt.date);
      const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(evt);
    });
    return grouped;
  }, [productionEvents]);

  const getProductionForDate = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return (productionByDate[dateKey] || []).sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return timeA - timeB;
    });
  };


  return (
    <>
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="grid grid-cols-7 gap-3 min-w-[800px]">
          {weekDays.map((date, index) => {
            const daySignups = getSignupsForDate(date);
            const dayCallbacks = getCallbacksForDate(date);
            const dayPersonal = getPersonalForDate(date);
            const dayProduction = getProductionForDate(date);
            const today = isToday(date);

            return (
              <div
                key={index}
                className={`rounded-lg border p-3 min-w-[100px] ${
                  today
                    ? 'bg-[#5a8ff5]/10 border-neu-border-focus ring-2 ring-[#5a8ff5]/30'
                    : 'bg-neu-surface/30 border-neu-border'
                }`}
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
              >
              {/* Day header */}
              <div className="text-center mb-3 pb-2 border-b border-neu-border">
                <div className="text-xs text-neu-text-primary/70 font-medium">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={`text-2xl font-bold ${
                    today ? 'text-neu-accent-primary' : 'text-neu-text-primary'
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => { setSelectedDate(date); setShowPersonalEventsModal(true); }}
                    className="w-full text-center px-2 py-1 rounded text-xs bg-neu-surface/80 backdrop-blur-sm border border-neu-border-focus text-neu-text-primary hover:bg-neu-surface hover:text-neu-accent-primary transition-all duration-200"
                  >
                    + Add Personal Event
                  </button>
                </div>
              </div>

              {/* Events for this day */}
              <div className="space-y-2">
                {daySignups.length === 0 && dayCallbacks.length === 0 && dayPersonal.length === 0 && dayProduction.length === 0 ? (
                  <div className="text-xs text-neu-text-primary/40 text-center py-4">
                    No events
                  </div>
                ) : (
                  <>
                  {/* Audition Events */}
                  {daySignups.map((signup) => {
                    const startTime = new Date(signup.audition_slots.start_time);
                    const endTime = new Date(signup.audition_slots.end_time);
                    const showTitle = signup.audition_slots?.auditions?.shows?.title || 'Unknown Show';
                    const roleName = signup.roles?.role_name;

                    return (
                      <button
                        key={signup.signup_id}
                        onClick={() => setSelectedEvent(signup)}
                        className="w-full text-left p-2 rounded-lg bg-[#5a8ff5]/20 backdrop-blur-sm border border-[#5a8ff5]/50 hover:bg-[#5a8ff5]/30 hover:border-[#5a8ff5]/70 transition-all duration-200"
                      >
                        <div className="text-xs font-semibold text-[#5a8ff5] mb-1">
                          {startTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })} - {endTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-sm font-medium text-neu-text-primary break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {showTitle}
                        </div>
                        {roleName && (
                          <div className="text-xs text-neu-text-primary/70 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {roleName}
                          </div>
                        )}
                        {signup.audition_slots.location && (
                          <div className="text-xs text-neu-text-primary/60 break-words mt-1 flex items-start gap-1" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            📍 {signup.audition_slots.location}
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {/* Personal Events */}
                  {dayPersonal.map((evt: any) => {
                    const startTime = new Date(evt.start);
                    const endTime = evt.end ? new Date(evt.end) : null;
                    return (
                      <button
                        key={evt.id || `${evt.title}-${evt.start}`}
                        onClick={() => setSelectedPersonalEvent(evt)}
                        className="w-full text-left p-2 rounded-lg bg-green-500/20 backdrop-blur-sm border border-green-500/50 hover:bg-green-500/30 hover:border-green-500/70 transition-all duration-200"
                      >
                        <div className="text-xs font-semibold text-green-400 mb-1">
                          {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          {endTime ? ` - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}
                        </div>
                        <div className="text-sm font-medium text-neu-text-primary break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {evt.title}
                        </div>
                        {evt.location && (
                          <div className="text-xs text-neu-text-primary/60 break-words mt-1 flex items-start gap-1" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            📍 {evt.location}
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {/* Production Events (Rehearsal/Performance) */}
                  {dayProduction.map((evt) => {
                    return (
                      <div
                        key={`prod-${evt.auditionId}-${evt.type}-${evt.date}`}
                        className={`w-full text-left p-2 rounded-lg backdrop-blur-sm border transition-all duration-200 ${
                          evt.type === 'rehearsal' 
                            ? 'bg-orange-500/20 border-orange-500/50' 
                            : 'bg-blue-500/20 border-blue-500/50'
                        }`}
                      >
                        <div className={`text-xs font-semibold mb-1 ${evt.type === 'rehearsal' ? 'text-orange-400' : 'text-blue-400'}`}>
                          {evt.type === 'rehearsal' ? 'Rehearsal' : 'Performance'}
                        </div>
                        <div className="text-sm font-medium text-neu-text-primary break-words flex items-start gap-1" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          <span>{evt.type === 'rehearsal' ? '🎭' : '🎪'}</span>
                          <span className="break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{evt.show.title}</span>
                        </div>
                        {evt.role && (
                          <div className="text-xs text-neu-text-primary/70 break-words mt-1" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {evt.role}
                          </div>
                        )}
                        {evt.location && (
                          <div className="text-xs text-neu-text-primary/60 break-words mt-1 flex items-start gap-1" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            📍 {evt.location}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Callback Events */}
                  {dayCallbacks.map((callback) => {
                    const startTime = new Date(callback.callback_slots.start_time);
                    const endTime = new Date(callback.callback_slots.end_time);
                    const showTitle = callback.callback_slots?.auditions?.shows?.title || 'Callback';

                    return (
                      <button
                        key={callback.invitation_id}
                        onClick={() => setSelectedEvent({ ...callback, isCallback: true })}
                        className="w-full text-left p-2 rounded-lg bg-purple-500/20 backdrop-blur-sm border border-purple-500/50 hover:bg-purple-500/30 hover:border-purple-500/70 transition-all duration-200"
                      >
                        <div className="text-xs font-semibold text-purple-400 mb-1">
                          {startTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })} - {endTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-sm font-medium text-neu-text-primary break-words flex items-start gap-1" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          <span>📋</span>
                          {showTitle}
                        </div>
                        {callback.callback_slots.location && (
                          <div className="text-xs text-neu-text-primary/60 break-words mt-1 flex items-start gap-1" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            📍 {callback.callback_slots.location}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  </>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Event Modals */}
      {selectedEvent && !selectedEvent.isCallback && (
        <AuditionEventModal
          signup={selectedEvent}
          userId={userId}
          onClose={() => setSelectedEvent(null)}
          onDelete={onRefresh}
        />
      )}
      {selectedEvent && selectedEvent.isCallback && (
        <CallbackDetailsModal
          callback={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={onRefresh}
        />
      )}
      {showPersonalEventsModal && !editingPersonalEvent && (
        <EventForm
          isOpen={showPersonalEventsModal}
          onClose={() => setShowPersonalEventsModal(false)}
          onSave={() => loadEvents(weekRange.start, weekRange.end)}
          selectedDate={selectedDate || undefined}
          userId={userId}
        />
      )}
      {editingPersonalEvent && (
        <EventForm
          isOpen={true}
          onClose={() => {
            setEditingPersonalEvent(null);
            setSelectedPersonalEvent(null);
          }}
          onSave={() => {
            loadEvents(weekRange.start, weekRange.end);
            setEditingPersonalEvent(null);
            setSelectedPersonalEvent(null);
          }}
          event={editingPersonalEvent}
          userId={userId}
        />
      )}
      {selectedPersonalEvent && !editingPersonalEvent && (
        <PersonalEventModal
          event={selectedPersonalEvent}
          userId={userId}
          onClose={() => setSelectedPersonalEvent(null)}
          onDelete={() => {
            loadEvents(weekRange.start, weekRange.end);
            setSelectedPersonalEvent(null);
          }}
          onEdit={(event) => {
            setEditingPersonalEvent(event);
          }}
        />
      )}
    </>
  );
}

