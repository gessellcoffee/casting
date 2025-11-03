'use client';

import { useEffect, useMemo, useState } from 'react';
import AuditionEventModal from './AuditionEventModal';
import CallbackDetailsModal from '@/components/callbacks/CallbackDetailsModal';
import PersonalEvents from './PersonalEvents';
import useEvents from '@/hooks/useEvents';
import EventForm from '@/components/events/EventForm';
import PersonalEventModal from '@/components/events/PersonalEventModal';
import { useGroupedSignups } from '@/lib/hooks/useGroupedSignups';
import { isToday } from '@/lib/utils/dateUtils';
import { useRouter } from 'next/navigation';
import type { CalendarEvent } from '@/lib/supabase/types';
import type { ProductionDateEvent } from '@/lib/utils/calendarEvents';


interface CalendarMonthViewProps {
  signups: any[];
  callbacks?: any[];
  productionEvents?: ProductionDateEvent[];
  currentDate: Date;
  userId: string;
  onRefresh?: () => void;
}

export default function CalendarMonthView({ signups, callbacks = [], productionEvents = [], currentDate, userId, onRefresh }: CalendarMonthViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showPersonalEventsModal, setShowPersonalEventsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPersonalEvent, setSelectedPersonalEvent] = useState<CalendarEvent | null>(null);
  const [editingPersonalEvent, setEditingPersonalEvent] = useState<CalendarEvent | null>(null);
  const { events, loadEvents } = useEvents(userId);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = Array.from(
      { length: startingDayOfWeek },
      (_, i) => ({
        date: prevMonthLastDay - startingDayOfWeek + i + 1,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonthLastDay - startingDayOfWeek + i + 1),
      })
    );
    
    // Days in current month
    const currentMonthDays = Array.from(
      { length: daysInMonth },
      (_, i) => ({
        date: i + 1,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i + 1),
      })
    );
    
    // Days from next month to fill the grid
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
    const nextMonthDays = Array.from(
      { length: remainingDays },
      (_, i) => ({
        date: i + 1,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i + 1),
      })
    );
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentDate]);

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
    return signupsByDate[dateKey] || [];
  };

  // Get callbacks for a specific date
  const getCallbacksForDate = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return callbacksByDate[dateKey] || [];
  };

  // Load and group personal events by date for current month range
  const monthRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }, [currentDate]);

  useEffect(() => {
    loadEvents(monthRange.start, monthRange.end);
  }, [monthRange.start.getTime(), monthRange.end.getTime(), loadEvents]);

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

  const getPersonalForDate = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return personalByDate[dateKey] || [];
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
    return productionByDate[dateKey] || [];
  };


  return (
    <>
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[600px]">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-semibold text-neu-text-primary/70 py-1 sm:py-2"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const daySignups = getSignupsForDate(day.fullDate);
          const dayCallbacks = getCallbacksForDate(day.fullDate);
          const dayPersonal = getPersonalForDate(day.fullDate);
          const dayProduction = getProductionForDate(day.fullDate);
          const today = isToday(day.fullDate);
          const totalEvents = daySignups.length + dayCallbacks.length + dayPersonal.length + dayProduction.length;

          return (
            <div
              key={index}
              className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 rounded-lg border transition-all duration-200 ${
                day.isCurrentMonth
                  ? 'bg-neu-surface/30 border-neu-border'
                  : 'bg-neu-surface/10 border-[#4a7bd9]/10'
              } ${today ? 'ring-1 sm:ring-2 ring-[#5a8ff5]/50' : ''}`}
              onClick={() => {
                setSelectedDate(day.fullDate);
                setShowAddEventModal(true);
              }}
            >
              <div
                className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                  day.isCurrentMonth ? 'text-neu-text-primary' : 'text-neu-text-primary/40'
                } ${today ? 'text-neu-accent-primary font-bold' : ''}`}
              >
                {day.date}
              </div>

              {/* Events for this day */}
              <div className="space-y-1">
                {/* Audition Events */}
                {daySignups.slice(0, 2).map((signup) => {
                  const startTime = new Date(signup.audition_slots.start_time);
                  const showTitle = signup.audition_slots?.auditions?.shows?.title || 'Unknown Show';
                   
                  return (
                    <button
                      key={signup.signup_id}
                      onClick={() => setSelectedEvent(signup)}
                      className="w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-[#5a8ff5]/20 backdrop-blur-sm border border-[#5a8ff5]/50 text-neu-text-primary hover:bg-[#5a8ff5]/30 hover:border-[#5a8ff5]/70 transition-all duration-200 truncate"
                    >
                      <div className="font-medium truncate">{showTitle}</div>
                      <div className="text-[#5a8ff5] hidden sm:block">
                        {startTime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </button>
                  );
                })}

                {/* Personal Events */}
                {dayPersonal.slice(0, Math.max(0, 2 - daySignups.length)).map((evt: any) => {
                  const startTime = new Date(evt.start);
                  return (
                    <button
                      key={evt.id || `${evt.title}-${evt.start}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPersonalEvent(evt);
                      }}
                      className="w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-green-500/20 backdrop-blur-sm border border-green-500/50 text-neu-text-primary hover:bg-green-500/30 hover:border-green-500/70 transition-all duration-200 truncate"
                      title={evt.title}
                    >
                      <div className="font-medium truncate">{evt.title}</div>
                      <div className="text-green-400 hidden sm:block">
                        {startTime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </button>
                  );
                })}

                {/* Production Events (Rehearsal/Performance) */}
                {dayProduction.slice(0, Math.max(0, 3 - daySignups.length - Math.min(dayPersonal.length, Math.max(0, 2 - daySignups.length)))).map((evt) => {
                  return (
                    <div
                      key={`prod-${evt.auditionId}-${evt.type}-${evt.date}`}
                      className={`w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs backdrop-blur-sm border text-neu-text-primary transition-all duration-200 truncate ${
                        evt.type === 'rehearsal' 
                          ? 'bg-orange-500/20 border-orange-500/50' 
                          : 'bg-blue-500/20 border-blue-500/50'
                      }`}
                      title={evt.title}
                    >
                      <div className="font-medium truncate flex items-center gap-1">
                        <span className="flex-shrink-0">{evt.type === 'rehearsal' ? '🎭' : '🎪'}</span>
                        <span className="truncate">{evt.show.title}</span>
                      </div>
                      {evt.role && (
                        <div className={`text-[9px] sm:text-[10px] truncate ${evt.type === 'rehearsal' ? 'text-orange-400' : 'text-blue-400'}`}>
                          {evt.role}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Event Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(day.fullDate);
                    setShowPersonalEventsModal(true);
                  }}
                  className="w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-neu-surface/80 backdrop-blur-sm border border-neu-border-focus text-neu-text-primary hover:bg-neu-surface hover:text-neu-accent-primary transition-all duration-200 truncate"
                >
                  + Add Personal Event
                </button>


                {/* Callback Events */}
                {dayCallbacks.slice(0, Math.max(0, 3 - daySignups.length - Math.min(dayPersonal.length, Math.max(0, 3 - daySignups.length)))).map((callback) => {
                  const startTime = new Date(callback.callback_slots.start_time);
                  const showTitle = callback.callback_slots?.auditions?.shows?.title || 'Callback';
                   
                  return (
                    <button
                      key={callback.invitation_id}
                      onClick={() => setSelectedEvent({ ...callback, isCallback: true })}
                      className="w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-purple-500/20 backdrop-blur-sm border border-purple-500/50 text-neu-text-primary hover:bg-purple-500/30 hover:border-purple-500/70 transition-all duration-200 truncate"
                    >
                      <div className="font-medium truncate flex items-center gap-1">
                        <span className="hidden sm:inline">📋</span>
                        {showTitle}
                      </div>
                      <div className="text-purple-400 hidden sm:block">
                        {startTime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </button>
                  );
                })}

                {totalEvents > 3 && (
                  <div className="text-[10px] sm:text-xs text-neu-text-primary/60 px-1 sm:px-2">
                    +{totalEvents - 3}
                  </div>
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
          onSave={() => {
            if (monthRange) {
              loadEvents(monthRange.start, monthRange.end);
            }
          }}
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
            if (monthRange) {
              loadEvents(monthRange.start, monthRange.end);
            }
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
            if (monthRange) {
              loadEvents(monthRange.start, monthRange.end);
            }
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

