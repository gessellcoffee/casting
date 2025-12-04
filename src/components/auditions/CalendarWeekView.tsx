'use client';

import { useEffect, useMemo, useState } from 'react';
import { MdAdd } from 'react-icons/md';
import AuditionEventModal from './AuditionEventModal';
import CallbackDetailsModal from '@/components/callbacks/CallbackDetailsModal';
import { useGroupedSignups } from '@/lib/hooks/useGroupedSignups';
import { isToday } from '@/lib/utils/dateUtils';
import useEvents from '@/hooks/useEvents';
import EventForm from '@/components/events/EventForm';
import PersonalEventModal from '@/components/events/PersonalEventModal';
import type { CalendarEvent } from '@/lib/supabase/types';
import type { ProductionDateEvent } from '@/lib/utils/calendarEvents';
import RehearsalEventModal from './RehearsalEventModal';

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
  const [selectedRehearsalEvent, setSelectedRehearsalEvent] = useState<ProductionDateEvent | null>(null);
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


  // Time grid setup
  const START_HOUR = 7; // 7 AM
  const END_HOUR = 20; // 8 PM (exclusive, so last slot is 7 PM)
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
  const HOUR_HEIGHT = 60; // pixels per hour
  const GRID_HEIGHT = hours.length * HOUR_HEIGHT;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimePosition = ((currentHour - START_HOUR) * HOUR_HEIGHT) + (currentMinute / 60 * HOUR_HEIGHT);

  // Helper to position events in time grid with clamping
  const getEventPosition = (startTime: Date) => {
    const hour = startTime.getHours();
    const minute = startTime.getMinutes();
    const position = ((hour - START_HOUR) * HOUR_HEIGHT) + (minute / 60 * HOUR_HEIGHT);
    // Clamp to visible area
    return Math.max(0, Math.min(position, GRID_HEIGHT));
  };

  const getEventHeight = (startTime: Date, endTime: Date) => {
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    
    // Clamp start and end to visible hours
    const clampedStart = Math.max(START_HOUR, Math.min(END_HOUR, startHour));
    const clampedEnd = Math.max(START_HOUR, Math.min(END_HOUR, endHour));
    
    const duration = clampedEnd - clampedStart;
    return Math.max(duration * HOUR_HEIGHT, 30); // Minimum 30px height
  };

  // Check if event is visible in current time range
  const isEventVisible = (startTime: Date, endTime: Date) => {
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    return !(endHour < START_HOUR || startHour >= END_HOUR);
  };

  return (
    <>
      <div className="-mx-6 px-6 pb-4">
        {/* Week day headers - sticky */}
        <div className="grid grid-cols-[50px_repeat(7,1fr)] md:grid-cols-[60px_repeat(7,1fr)] gap-0 sticky top-0 z-20 border-b-2 border-neu-border shadow-sm" style={{ background: 'var(--neu-bg-base)' }}>
          <div className="h-16 md:h-20 border-r border-neu-border"></div>
          {weekDays.map((date, index) => {
            const today = isToday(date);
            return (
              <div
                key={index}
                className={`text-center py-2 md:py-3 border-r border-neu-border ${
                  today ? 'bg-[#5a8ff5]/10' : ''
                }`}
              >
                <div className="text-[10px] md:text-xs uppercase tracking-wide text-neu-text-primary/60 font-semibold mb-0.5 md:mb-1">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={`text-xl md:text-2xl font-bold ${
                    today ? 'text-neu-accent-primary' : 'text-neu-text-primary'
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="text-[10px] md:text-xs text-neu-text-primary/50">
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="relative grid grid-cols-[50px_repeat(7,1fr)] md:grid-cols-[60px_repeat(7,1fr)] gap-0">
          {/* Time labels column */}
          <div className="relative border-r border-neu-border">
            {hours.map((hour, hourIndex) => (
              <div
                key={hour}
                className="text-[10px] md:text-[11px] text-neu-text-primary/60 text-right pr-1 md:pr-2 relative"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="absolute top-0 right-1 md:right-2 -translate-y-2">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : hour === 0 ? '12 AM' : `${hour} AM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((date, dayIndex) => {
            const daySignups = getSignupsForDate(date);
            const dayCallbacks = getCallbacksForDate(date);
            const dayPersonal = getPersonalForDate(date);
            const dayProduction = getProductionForDate(date);
            const today = isToday(date);

            return (
              <div
                key={dayIndex}
                className={`relative border-r border-neu-border ${
                  today ? 'bg-[#5a8ff5]/5' : ''
                }`}
                style={{ height: `${GRID_HEIGHT}px` }}
              >
                {/* Hour grid lines */}
                {hours.map((hour, hourIndex) => (
                  <button
                    key={hour}
                    onClick={() => {
                      const eventDate = new Date(date);
                      eventDate.setHours(hour, 0, 0, 0);
                      setSelectedDate(eventDate);
                      setShowPersonalEventsModal(true);
                    }}
                    className="absolute w-full border-t border-neu-border hover:bg-neu-accent-primary/5 active:bg-neu-accent-primary/10 transition-colors cursor-pointer group touch-manipulation"
                    style={{
                      top: `${hourIndex * HOUR_HEIGHT}px`,
                      height: `${HOUR_HEIGHT}px`
                    }}
                    aria-label={`Add event at ${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 text-xs md:text-sm text-neu-accent-primary font-medium transition-opacity">
                      +
                    </span>
                  </button>
                ))}

                {/* Audition Events - positioned absolutely */}
                {daySignups.filter(signup => {
                  const startTime = new Date(signup.audition_slots.start_time);
                  const endTime = new Date(signup.audition_slots.end_time);
                  return isEventVisible(startTime, endTime);
                }).map((signup) => {
                  const startTime = new Date(signup.audition_slots.start_time);
                  const endTime = new Date(signup.audition_slots.end_time);
                  const showTitle = signup.audition_slots?.auditions?.shows?.title || 'Unknown Show';
                  const roleName = signup.roles?.role_name;
                  const top = getEventPosition(startTime);
                  const height = getEventHeight(startTime, endTime);

                  return (
                    <button
                      key={signup.signup_id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(signup);
                      }}
                      className="absolute left-0.5 right-0.5 md:left-1 md:right-1 text-left px-1.5 md:px-2 py-1 md:py-1.5 rounded-md bg-[#5a8ff5] backdrop-blur-sm border border-[#5a8ff5] hover:shadow-lg active:shadow-xl transition-all duration-200 z-20 overflow-hidden touch-manipulation"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                      }}
                    >
                      <div className="text-[9px] md:text-[10px] font-bold text-white/90 mb-0.5 truncate">
                        {startTime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-[11px] md:text-xs font-semibold text-white truncate leading-tight">
                        {showTitle}
                      </div>
                      {roleName && height > 50 && (
                        <div className="text-[9px] md:text-[10px] text-white/75 truncate mt-0.5">
                          {roleName}
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Personal Events - positioned absolutely */}
                {dayPersonal.filter(evt => {
                  const startTime = new Date(evt.start);
                  const endTime = evt.end ? new Date(evt.end) : new Date(startTime.getTime() + 60 * 60 * 1000);
                  return isEventVisible(startTime, endTime);
                }).map((evt: any) => {
                  const startTime = new Date(evt.start);
                  const endTime = evt.end ? new Date(evt.end) : new Date(startTime.getTime() + 60 * 60 * 1000);
                  const top = getEventPosition(startTime);
                  const height = getEventHeight(startTime, endTime);

                  return (
                    <button
                      key={evt.id || `${evt.title}-${evt.start}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPersonalEvent(evt);
                      }}
                      className="absolute left-0.5 right-0.5 md:left-1 md:right-1 text-left px-1.5 md:px-2 py-1 md:py-1.5 rounded-md bg-green-600 backdrop-blur-sm border border-green-600 hover:shadow-lg active:shadow-xl transition-all duration-200 z-20 overflow-hidden touch-manipulation"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                      }}
                    >
                      <div className="text-[9px] md:text-[10px] font-bold text-white/90 mb-0.5 truncate">
                        {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div className="text-[11px] md:text-xs font-semibold text-white truncate leading-tight">
                        {evt.title}
                      </div>
                    </button>
                  );
                })}

                {/* Callback Events - positioned absolutely */}
                {dayCallbacks.filter(callback => {
                  const startTime = new Date(callback.callback_slots.start_time);
                  const endTime = new Date(callback.callback_slots.end_time);
                  return isEventVisible(startTime, endTime);
                }).map((callback) => {
                  const startTime = new Date(callback.callback_slots.start_time);
                  const endTime = new Date(callback.callback_slots.end_time);
                  const showTitle = callback.callback_slots?.auditions?.shows?.title || 'Callback';
                  const top = getEventPosition(startTime);
                  const height = getEventHeight(startTime, endTime);

                  return (
                    <button
                      key={callback.invitation_id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent({ ...callback, isCallback: true });
                      }}
                      className="absolute left-0.5 right-0.5 md:left-1 md:right-1 text-left px-1.5 md:px-2 py-1 md:py-1.5 rounded-md bg-purple-600 backdrop-blur-sm border border-purple-600 hover:shadow-lg active:shadow-xl transition-all duration-200 z-20 overflow-hidden touch-manipulation"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                      }}
                    >
                      <div className="text-[9px] md:text-[10px] font-bold text-white/90 mb-0.5 truncate">
                        {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div className="text-[11px] md:text-xs font-semibold text-white truncate leading-tight">
                        📋 {showTitle}
                      </div>
                    </button>
                  );
                })}

                {/* Production Events - positioned absolutely */}
                {dayProduction.filter(evt => {
                  if (!evt.startTime || !evt.endTime) return false;
                  return isEventVisible(evt.startTime, evt.endTime);
                }).map((evt) => {
                  const startTime = evt.startTime!;
                  const endTime = evt.endTime!;
                  const top = getEventPosition(startTime);
                  const height = getEventHeight(startTime, endTime);
                  const isRehearsalEvent = evt.type === 'rehearsal_event' || evt.type === 'agenda_item';

                  let bgColor, borderColor;
                  if (evt.type === 'rehearsal') {
                    bgColor = 'bg-orange-600';
                    borderColor = 'border-orange-600';
                  } else if (evt.type === 'performance') {
                    bgColor = 'bg-red-600';
                    borderColor = 'border-red-600';
                  } else if (evt.type === 'audition_slot') {
                    bgColor = 'bg-teal-600';
                    borderColor = 'border-teal-600';
                  } else if (isRehearsalEvent) {
                    bgColor = 'bg-amber-600';
                    borderColor = 'border-amber-600';
                  } else {
                    bgColor = 'bg-gray-600';
                    borderColor = 'border-gray-600';
                  }

                  const label = evt.type === 'rehearsal' ? 'Rehearsal' :
                               evt.type === 'performance' ? 'Performance' :
                               evt.type === 'audition_slot' ? 'Audition Slot' :
                               isRehearsalEvent ? 'Rehearsal Event' :
                               'Event';

                  const Component = isRehearsalEvent ? 'button' : 'div';

                  return (
                    <Component
                      key={evt.slotId || evt.eventId || `prod-${evt.auditionId}-${evt.type}-${evt.date}`}
                      className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 text-left px-1.5 md:px-2 py-1 md:py-1.5 rounded-md backdrop-blur-sm hover:shadow-lg active:shadow-xl transition-all duration-200 z-20 overflow-hidden touch-manipulation ${bgColor} ${borderColor} ${isRehearsalEvent ? 'cursor-pointer' : 'cursor-default'}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                      }}
                      onClick={isRehearsalEvent ? (e: any) => {
                        e.stopPropagation();
                        setSelectedRehearsalEvent(evt);
                      } : undefined}
                    >
                      <div className="text-[9px] md:text-[10px] font-bold text-white/90 mb-0.5 truncate">
                        {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div className="text-[11px] md:text-xs font-semibold text-white truncate leading-tight">
                        {evt.show.title}
                      </div>
                      {height > 45 && (
                        <div className="text-[9px] md:text-[10px] text-white/75 truncate mt-0.5">
                          {label}
                        </div>
                      )}
                    </Component>
                  );
                })}

                {/* Current time indicator */}
                {today && currentHour >= START_HOUR && currentHour < END_HOUR && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-30 pointer-events-none"
                    style={{ top: `${currentTimePosition}px` }}
                  >
                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500 shadow-md" />
                  </div>
                )}
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

      {/* Floating Action Button for adding events */}
      <button
        onClick={() => {
          setSelectedDate(new Date());
          setShowPersonalEventsModal(true);
        }}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-neu-accent-primary text-white shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center justify-center z-50 touch-manipulation"
        aria-label="Add event"
      >
        <MdAdd className="w-7 h-7" />
      </button>

      {/* Rehearsal Event Modal */}
      {selectedRehearsalEvent && (
        <RehearsalEventModal
          event={{
            title: selectedRehearsalEvent.show.title,
            date: selectedRehearsalEvent.date,
            startTime: selectedRehearsalEvent.startTime,
            endTime: selectedRehearsalEvent.endTime,
            location: selectedRehearsalEvent.location || undefined,
            notes: (selectedRehearsalEvent as any).notes,
            agendaItems: (selectedRehearsalEvent as any).agendaItems,
          }}
          onClose={() => setSelectedRehearsalEvent(null)}
        />
      )}
    </>
  );
}

