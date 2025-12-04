'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import AuditionEventModal from './AuditionEventModal';
import CallbackDetailsModal from '@/components/callbacks/CallbackDetailsModal';
import PersonalEvents from './PersonalEvents';
import useEvents from '@/hooks/useEvents';
import EventForm from '@/components/events/EventForm';
import PersonalEventModal from '@/components/events/PersonalEventModal';
import { useGroupedSignups } from '@/lib/hooks/useGroupedSignups';
import { isToday } from '@/lib/utils/dateUtils';
import { useRouter } from 'next/navigation';
import { MdAdd } from 'react-icons/md';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import type { CalendarEvent } from '@/lib/supabase/types';
import type { ProductionDateEvent } from '@/lib/utils/calendarEvents';
import type { EventTypeFilter } from './CalendarLegend';


interface CalendarMonthViewProps {
  signups: any[];
  callbacks?: any[];
  productionEvents?: ProductionDateEvent[];
  currentDate: Date;
  userId: string;
  onRefresh?: () => void;
  eventFilters?: EventTypeFilter;
}

export default function CalendarMonthView({ signups, callbacks = [], productionEvents = [], currentDate, userId, onRefresh, eventFilters }: CalendarMonthViewProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showPersonalEventsModal, setShowPersonalEventsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPersonalEvent, setSelectedPersonalEvent] = useState<CalendarEvent | null>(null);
  const [editingPersonalEvent, setEditingPersonalEvent] = useState<CalendarEvent | null>(null);
  const [showDayView, setShowDayView] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<any>({ date: null, signups: [], callbacks: [], personal: [], production: [] });
  const { events, loadEvents } = useEvents(userId);

  // Detect mobile for vertical scrolling layout - runs only on client
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Only run on client side
    if (typeof window !== 'undefined') {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Generate calendar grids for vertical scrolling (3 months)
  const generateMonthGrid = (year: number, month: number) => {
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Empty cells before the first day of the month
    const emptyStartCells = Array.from(
      { length: startingDayOfWeek },
      (_, i) => ({
        date: null,
        isCurrentMonth: false,
        isEmpty: true,
        fullDate: null,
      })
    );
    
    // Days in current month only
    const currentMonthDays = Array.from(
      { length: daysInMonth },
      (_, i) => ({
        date: i + 1,
        isCurrentMonth: true,
        isEmpty: false,
        fullDate: new Date(year, month, i + 1),
      })
    );
    
    // Empty cells after the last day to complete the week
    const totalDays = emptyStartCells.length + currentMonthDays.length;
    const remainingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
    const emptyEndCells = Array.from(
      { length: remainingDays },
      (_, i) => ({
        date: null,
        isCurrentMonth: false,
        isEmpty: true,
        fullDate: null,
      })
    );
    
    return [...emptyStartCells, ...currentMonthDays, ...emptyEndCells];
  };

  // For vertical scrolling: generate 3 months (previous, current, next)
  const monthsToDisplay = useMemo(() => {
    if (!isMobile) return [];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    return [
      {
        year: prevYear,
        month: prevMonth,
        days: generateMonthGrid(prevYear, prevMonth),
        title: new Date(prevYear, prevMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      },
      {
        year,
        month,
        days: generateMonthGrid(year, month),
        title: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      },
      {
        year: nextYear,
        month: nextMonth,
        days: generateMonthGrid(nextYear, nextMonth),
        title: new Date(nextYear, nextMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
    ];
  }, [currentDate, isMobile]);

  // Generate calendar grid (desktop single month view)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Empty cells before the first day of the month
    const emptyStartCells = Array.from(
      { length: startingDayOfWeek },
      (_, i) => ({
        date: null,
        isCurrentMonth: false,
        isEmpty: true,
        fullDate: null,
      })
    );
    
    // Days in current month only
    const currentMonthDays = Array.from(
      { length: daysInMonth },
      (_, i) => ({
        date: i + 1,
        isCurrentMonth: true,
        isEmpty: false,
        fullDate: new Date(year, month, i + 1),
      })
    );
    
    // Empty cells after the last day to complete the week
    const totalDays = emptyStartCells.length + currentMonthDays.length;
    const remainingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
    const emptyEndCells = Array.from(
      { length: remainingDays },
      (_, i) => ({
        date: null,
        isCurrentMonth: false,
        isEmpty: true,
        fullDate: null,
      })
    );
    
    return [...emptyStartCells, ...currentMonthDays, ...emptyEndCells];
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
    console.log('[CalendarMonthView] Loading personal events for month:', monthRange);
    loadEvents(monthRange.start, monthRange.end);
  }, [monthRange.start.getTime(), monthRange.end.getTime(), loadEvents]);

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

  const getPersonalForDate = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const personalEvents = personalByDate[dateKey] || [];
    // Filter based on eventFilters if provided
    return eventFilters?.personalEvents === false ? [] : personalEvents;
  };

  // Group production events by individual dates
  const productionByDate = useMemo(() => {
    const grouped: Record<string, ProductionDateEvent[]> = {};
    productionEvents.forEach(evt => {
      // evt.date is already a Date object from calendarEvents.ts, use it directly
      const eventDate = evt.date;
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


  // Render a single day cell
  const renderDayCell = (day: any, monthYear: string, index?: number) => {
    // Handle empty cells
    if (day.isEmpty || !day.fullDate) {
      return (
        <div
          key={`${monthYear}-empty-${index || Math.random()}`}
          className="min-h-[70px] md:min-h-[100px] p-2 rounded-lg border border-transparent bg-transparent"
        />
      );
    }

    const daySignups = getSignupsForDate(day.fullDate);
    const dayCallbacks = getCallbacksForDate(day.fullDate);
    const dayPersonal = getPersonalForDate(day.fullDate);
    const dayProduction = getProductionForDate(day.fullDate);
    const today = isToday(day.fullDate);
    const totalEvents = daySignups.length + dayCallbacks.length + dayPersonal.length + dayProduction.length;

    // Count events by type for dot indicators
    const hasAuditions = daySignups.length > 0;
    const hasCallbacks = dayCallbacks.length > 0;
    const hasPersonal = dayPersonal.length > 0;
    const hasRehearsals = dayProduction.some(e => e.type === 'rehearsal' || e.type === 'rehearsal_event' || e.type === 'agenda_item');
    const hasPerformances = dayProduction.some(e => e.type === 'performance');
    const hasAuditionSlots = dayProduction.some(e => e.type === 'audition_slot');

    return (
      <div
        key={`${monthYear}-${day.fullDate.getTime()}`}
        className={`min-h-[70px] md:min-h-[100px] p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-neu-surface/50 bg-neu-surface/30 border-neu-border ${
          today ? 'ring-2 ring-[#5a8ff5] bg-[#5a8ff5]/10' : ''
        }`}
        onClick={() => {
          setSelectedDate(day.fullDate);
          setSelectedDayEvents({
            date: day.fullDate,
            signups: daySignups,
            callbacks: dayCallbacks,
            personal: dayPersonal,
            production: dayProduction,
          });
          setShowDayView(true);
        }}
      >
        <div
          className={`text-lg md:text-xl font-bold text-center mb-1 text-neu-text-primary ${
            today ? 'text-neu-accent-primary' : ''
          }`}
        >
          {day.date}
        </div>

        {/* Event indicator dots */}
        {totalEvents > 0 && (
          <div className="flex flex-col items-center gap-1 md:gap-1.5">
            {/* Colored dots for event types */}
            <div className="flex justify-center gap-1 md:gap-1.5 flex-wrap">
              {hasAuditions && (
                <div 
                  className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#5a8ff5] shadow-sm" 
                  title="Auditions"
                />
              )}
              {hasCallbacks && (
                <div 
                  className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-purple-500 shadow-sm" 
                  title="Callbacks"
                />
              )}
              {hasPersonal && (
                <div 
                  className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500 shadow-sm" 
                  title="Personal Events"
                />
              )}
              {hasRehearsals && (
                <div 
                  className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-orange-500 shadow-sm" 
                  title="Rehearsals"
                />
              )}
              {hasPerformances && (
                <div 
                  className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500 shadow-sm" 
                  title="Performances"
                />
              )}
              {hasAuditionSlots && (
                <div 
                  className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-teal-500 shadow-sm" 
                  title="Audition Slots"
                />
              )}
            </div>
            {/* Event count */}
            {totalEvents > 1 && (
              <div className="text-[10px] md:text-xs font-medium text-neu-text-primary/70">
                {totalEvents}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile: Vertical Scrolling Multi-Month View */}
      {isMobile ? (
        <div className="space-y-8">
          {monthsToDisplay.map((monthData) => (
            <div key={`${monthData.year}-${monthData.month}`}>
              <h3 className="text-lg font-semibold text-neu-text-primary mb-3 px-2">
                {monthData.title}
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <div
                    key={index}
                    className="text-center text-xs font-semibold text-neu-text-primary/70 py-1"
                  >
                    {day}
                  </div>
                ))}
                {/* Calendar days */}
                {monthData.days.map((day) => renderDayCell(day, monthData.title))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop: Traditional Single Month Grid */
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="grid grid-cols-7 gap-2 sm:gap-3 min-w-0 sm:min-w-[600px]">
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
          {calendarDays.map((day, index) => renderDayCell(day, ''))}
          </div>
        </div>
      )}

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

      {/* Floating Action Button for adding events (mobile optimized) */}
      <button
        onClick={() => {
          setSelectedDate(new Date());
          setShowPersonalEventsModal(true);
        }}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-neu-accent-primary text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
        aria-label="Add event"
      >
        <MdAdd className="w-6 h-6" />
      </button>

      {/* Day View Modal - Shows all events for selected day */}
      <Transition appear show={showDayView && selectedDayEvents.date !== null} as={Fragment}>
        <Dialog as="div" className="relative z-[10000]" onClose={() => setShowDayView(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 dark:bg-black/60" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl p-0 text-left align-middle shadow-xl transition-all" style={{ background: 'var(--neu-bg-base)', border: '1px solid var(--neu-border)' }}>
                  {/* Header */}
                  <div className="border-b border-neu-border p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Dialog.Title as="h2" className="text-xl md:text-2xl font-bold text-neu-text-primary">
                        {selectedDayEvents.date && selectedDayEvents.date.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Dialog.Title>
                      <button
                        onClick={() => setShowDayView(false)}
                        className="p-2 rounded-lg hover:bg-neu-surface/50 transition-colors"
                        aria-label="Close"
                      >
                        <svg className="w-6 h-6 text-neu-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-neu-text-primary/60">
                      {selectedDayEvents.signups.length + selectedDayEvents.callbacks.length + selectedDayEvents.personal.length + selectedDayEvents.production.length} events
                    </p>
                  </div>

            {/* Events List */}
            <div className="p-4 md:p-6 space-y-3">
              {/* Audition Signups */}
              {selectedDayEvents.signups.map((signup: any) => {
                const startTime = new Date(signup.audition_slots.start_time);
                const showTitle = signup.audition_slots?.auditions?.shows?.title || 'Unknown Show';
                return (
                  <button
                    key={signup.signup_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(signup);
                      setShowDayView(false);
                    }}
                    className="w-full text-left p-4 rounded-lg bg-[#5a8ff5]/20 border border-[#5a8ff5]/50 hover:bg-[#5a8ff5]/30 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🎭</div>
                      <div className="flex-1">
                        <div className="font-semibold text-neu-text-primary mb-1">{showTitle}</div>
                        <div className="text-sm font-semibold text-[#3d6cb5] dark:text-[#6b9eff]">
                          {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                        {signup.roles?.role_name && (
                          <div className="text-sm text-neu-text-primary/70 mt-1">Role: {signup.roles.role_name}</div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Callbacks */}
              {selectedDayEvents.callbacks.map((callback: any) => {
                const startTime = new Date(callback.callback_slots.start_time);
                const showTitle = callback.callback_slots?.auditions?.shows?.title || 'Callback';
                return (
                  <button
                    key={callback.invitation_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent({ ...callback, isCallback: true });
                      setShowDayView(false);
                    }}
                    className="w-full text-left p-4 rounded-lg bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/30 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📋</div>
                      <div className="flex-1">
                        <div className="font-semibold text-neu-text-primary mb-1">{showTitle}</div>
                        <div className="text-sm font-semibold text-[#7c3aed] dark:text-[#a78bfa]">
                          {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                        <div className="text-sm font-semibold text-[#7c3aed] dark:text-[#a78bfa] mt-1">Callback</div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Personal Events */}
              {selectedDayEvents.personal.map((evt: any) => {
                const startTime = new Date(evt.start);
                return (
                  <button
                    key={evt.id || `${evt.title}-${evt.start}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPersonalEvent(evt);
                      setShowDayView(false);
                    }}
                    className="w-full text-left p-4 rounded-lg bg-green-500/20 border border-green-500/50 hover:bg-green-500/30 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🗓️</div>
                      <div className="flex-1">
                        <div className="font-semibold text-neu-text-primary mb-1">{evt.title}</div>
                        <div className="text-sm font-semibold text-[#059669] dark:text-[#34d399]">
                          {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                        <div className="text-sm font-semibold text-[#059669] dark:text-[#34d399] mt-1">Personal Event</div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Production Events */}
              {selectedDayEvents.production.map((evt: any) => {
                let bgColor, borderColor, textColor, icon, label;
                if (evt.type === 'rehearsal') {
                  bgColor = 'bg-orange-500/20';
                  borderColor = 'border-orange-500/50';
                  textColor = 'text-[#ea580c] dark:text-[#fb923c]';
                  icon = '🎭';
                  label = 'Rehearsal';
                } else if (evt.type === 'performance') {
                  bgColor = 'bg-red-500/20';
                  borderColor = 'border-red-500/50';
                  textColor = 'text-[#dc2626] dark:text-[#f87171]';
                  icon = '🎪';
                  label = 'Performance';
                } else if (evt.type === 'audition_slot') {
                  bgColor = 'bg-teal-500/20';
                  borderColor = 'border-teal-500/50';
                  textColor = 'text-[#0d9488] dark:text-[#2dd4bf]';
                  icon = '📋';
                  label = 'Audition Slot';
                } else if (evt.type === 'rehearsal_event' || evt.type === 'agenda_item') {
                  bgColor = 'bg-amber-500/20';
                  borderColor = 'border-amber-500/50';
                  textColor = 'text-[#d97706] dark:text-[#fbbf24]';
                  icon = '🎬';
                  label = 'Rehearsal Event';
                }
                return (
                  <div
                    key={evt.slotId || evt.eventId || `prod-${evt.auditionId}-${evt.type}-${evt.date}`}
                    className={`w-full text-left p-4 rounded-lg border ${bgColor} ${borderColor}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-neu-text-primary mb-1">{evt.show.title}</div>
                        {evt.startTime && (
                          <div className={`text-sm font-semibold ${textColor}`}>
                            {evt.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        )}
                        <div className={`text-sm font-semibold ${textColor} mt-1`}>{label}</div>
                        {evt.role && <div className="text-sm text-neu-text-primary/70 mt-1">Role: {evt.role}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty State */}
              {selectedDayEvents.signups.length === 0 && 
               selectedDayEvents.callbacks.length === 0 && 
               selectedDayEvents.personal.length === 0 && 
               selectedDayEvents.production.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-neu-text-primary/60">No events scheduled for this day</p>
                </div>
              )}

              {/* Add Event Button */}
              <button
                onClick={() => {
                  setShowDayView(false);
                  setShowPersonalEventsModal(true);
                }}
                className="w-full p-4 rounded-lg bg-neu-accent-primary text-neu-text-primary hover:opacity-90 transition-opacity font-semibold flex items-center justify-center gap-2"
              >
                <MdAdd className="w-5 h-5" />
                Add Personal Event
              </button>
            </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
    </>
  );
}

