'use client';

import { useEffect, useMemo, useState } from 'react';
import AuditionEventModal from './AuditionEventModal';
import CallbackDetailsModal from '@/components/callbacks/CallbackDetailsModal';
import { useGroupedSignups } from '@/lib/hooks/useGroupedSignups';
import { isToday } from '@/lib/utils/dateUtils';
import useEvents from '@/hooks/useEvents';
import EventForm from '@/components/events/EventForm';

interface CalendarWeekViewProps {
  signups: any[];
  callbacks?: any[];
  currentDate: Date;
  userId: string;
  onRefresh?: () => void;
}

export default function CalendarWeekView({ signups, callbacks = [], currentDate, userId, onRefresh }: CalendarWeekViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showPersonalEventsModal, setShowPersonalEventsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
      const dt = new Date((evt as any).start);
      const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
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


  return (
    <>
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="grid grid-cols-7 gap-3 min-w-[800px]">
          {weekDays.map((date, index) => {
            const daySignups = getSignupsForDate(date);
            const dayCallbacks = getCallbacksForDate(date);
            const dayPersonal = getPersonalForDate(date);
            const today = isToday(date);

            return (
              <div
                key={index}
                className={`rounded-lg border p-3 min-w-[100px] ${
                  today
                    ? 'bg-[#5a8ff5]/10 border-neu-border-focus ring-2 ring-[#5a8ff5]/30'
                    : 'bg-neu-surface/30 border-neu-border'
                }`}
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
                    className="w-full text-center px-2 py-1 rounded text-xs bg-white/80 backdrop-blur-sm border border-neu-border/60 text-neu-text-primary hover:bg-white/90 transition-all duration-200"
                  >
                    + Add Personal Event
                  </button>
                </div>
              </div>

              {/* Events for this day */}
              <div className="space-y-2">
                {daySignups.length === 0 && dayCallbacks.length === 0 ? (
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
                        className="w-full text-left p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-neu-accent-primary/30 hover:bg-white/90 transition-all duration-200"
                      >
                        <div className="text-xs font-semibold text-neu-accent-primary mb-1">
                          {startTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })} - {endTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-sm font-medium text-neu-text-primary truncate">
                          {showTitle}
                        </div>
                        {roleName && (
                          <div className="text-xs text-neu-text-primary/70 truncate">
                            {roleName}
                          </div>
                        )}
                        {signup.audition_slots.location && (
                          <div className="text-xs text-neu-text-primary/60 truncate mt-1">
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
                      <div
                        key={evt.id || `${evt.title}-${evt.start}`}
                        className="w-full text-left p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-green-400/40"
                      >
                        <div className="text-xs font-semibold text-green-600 mb-1">
                          {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          {endTime ? ` - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}
                        </div>
                        <div className="text-sm font-medium text-neu-text-primary truncate">
                          {evt.title}
                        </div>
                        {evt.location && (
                          <div className="text-xs text-neu-text-primary/60 truncate mt-1">
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
                        className="w-full text-left p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-purple-400/30 hover:bg-white/90 transition-all duration-200"
                      >
                        <div className="text-xs font-semibold text-[#9b87f5] mb-1">
                          {startTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })} - {endTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-sm font-medium text-neu-text-primary truncate flex items-center gap-1">
                          <span>📋</span>
                          {showTitle}
                        </div>
                        {callback.callback_slots.location && (
                          <div className="text-xs text-neu-text-primary/60 truncate mt-1">
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
      {showPersonalEventsModal && (
        <EventForm
          isOpen={showPersonalEventsModal}
          onClose={() => setShowPersonalEventsModal(false)}
          onSave={() => loadEvents(weekRange.start, weekRange.end)}
          selectedDate={selectedDate || undefined}
          userId={userId}
        />
      )}
    </>
  );
}

