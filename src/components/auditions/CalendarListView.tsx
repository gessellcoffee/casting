'use client';

import { useEffect, useMemo, useState } from 'react';
import { MdCalendarToday, MdLocationOn, MdAccessTime, MdChevronLeft, MdChevronRight, MdExpandMore } from 'react-icons/md';
import AuditionEventModal from './AuditionEventModal';
import CallbackDetailsModal from '@/components/callbacks/CallbackDetailsModal';
import EmptyState from '@/components/ui/feedback/EmptyState';
import Badge from '@/components/ui/feedback/Badge';
import useEvents from '@/hooks/useEvents';
import EventForm from '@/components/events/EventForm';
import PersonalEventModal from '@/components/events/PersonalEventModal';
import type { CalendarEvent } from '@/lib/supabase/types';
import type { ProductionDateEvent } from '@/lib/utils/calendarEvents';
import { formatUSMonthYear, formatUSMonthShort, formatUSTime } from '@/lib/utils/dateUtils';

// Generate Google Maps link from address
const getGoogleMapsLink = (address: string): string => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};

interface CalendarListViewProps {
  signups: any[];
  callbacks?: any[];
  productionEvents?: ProductionDateEvent[];
  userId: string;
  timeZone?: string;
  onRefresh?: () => void;
}

export default function CalendarListView({ signups, callbacks = [], productionEvents = [], userId, timeZone, onRefresh }: CalendarListViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [showPersonalEventsModal, setShowPersonalEventsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedPersonalEvent, setSelectedPersonalEvent] = useState<CalendarEvent | null>(null);
  const [editingPersonalEvent, setEditingPersonalEvent] = useState<CalendarEvent | null>(null);
  const [currentDay, setCurrentDay] = useState<Date>(new Date());
  const [expandedSlotGroups, setExpandedSlotGroups] = useState<Set<string>>(new Set());
  const { events, loadEvents } = useEvents(userId);

  // Day navigation functions
  const handlePreviousDay = () => {
    const newDate = new Date(currentDay);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDay(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDay);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDay(newDate);
  };

  const handleToday = () => {
    setCurrentDay(new Date());
  };

  const toggleSlotGroup = (showId: string) => {
    const newExpanded = new Set(expandedSlotGroups);
    if (newExpanded.has(showId)) {
      newExpanded.delete(showId);
    } else {
      newExpanded.add(showId);
    }
    setExpandedSlotGroups(newExpanded);
  };

  // Load a broad range of personal events initially
  useEffect(() => {
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    const end = new Date();
    end.setMonth(end.getMonth() + 6);
    loadEvents(start, end);
  }, [loadEvents]);

  // Filter and sort signups
  const filteredSignups = useMemo(() => {
    const now = new Date();
    
    let filtered = signups.filter((signup) => {
      if (!signup.audition_slots?.start_time) return false;
      
      const startTime = new Date(signup.audition_slots.start_time);
      
      if (filter === 'upcoming') {
        return startTime >= now;
      } else if (filter === 'past') {
        return startTime < now;
      }
      return true;
    });

    // Sort by start time
    return filtered.sort((a, b) => {
      const timeA = new Date(a.audition_slots.start_time).getTime();
      const timeB = new Date(b.audition_slots.start_time).getTime();
      return filter === 'past' ? timeB - timeA : timeA - timeB;
    });
  }, [signups, filter]);

  // Filter and sort callbacks
  const filteredCallbacks = useMemo(() => {
    const now = new Date();
    
    let filtered = callbacks.filter((callback) => {
      if (!callback.callback_slots?.start_time) return false;
      
      const startTime = new Date(callback.callback_slots.start_time);
      
      if (filter === 'upcoming') {
        return startTime >= now;
      } else if (filter === 'past') {
        return startTime < now;
      }
      return true;
    });

    // Sort by start time
    return filtered.sort((a, b) => {
      const timeA = new Date(a.callback_slots.start_time).getTime();
      const timeB = new Date(b.callback_slots.start_time).getTime();
      return filter === 'past' ? timeB - timeA : timeA - timeB;
    });
  }, [callbacks, filter]);

  // Filter and sort personal events
  const filteredPersonal = useMemo(() => {
    const now = new Date();
    let filtered = events.filter((evt: any) => {
      if (!evt.start) return false;
      const start = new Date(evt.start);
      if (filter === 'upcoming') return start >= now;
      if (filter === 'past') return start < now;
      return true;
    });
    return filtered.sort((a: any, b: any) => {
      const timeA = new Date(a.start).getTime();
      const timeB = new Date(b.start).getTime();
      return filter === 'past' ? timeB - timeA : timeA - timeB;
    });
  }, [events, filter]);

  // Filter and sort production events
  const filteredProduction = useMemo(() => {
    const now = new Date();
    let filtered = productionEvents.filter((evt) => {
      const eventDate = new Date(evt.date);
      if (filter === 'upcoming') return eventDate >= now;
      if (filter === 'past') return eventDate < now;
      return true;
    });
    return filtered.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return filter === 'past' ? timeB - timeA : timeA - timeB;
    });
  }, [productionEvents, filter]);

  // Filter events for current day
  const dayEvents = useMemo(() => {
    const dayKey = `${currentDay.getFullYear()}-${currentDay.getMonth()}-${currentDay.getDate()}`;
    const events: any[] = [];
    
    // Filter signups for this day
    filteredSignups.forEach(signup => {
      const date = new Date(signup.audition_slots.start_time);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (key === dayKey) events.push({ ...signup, type: 'audition' });
    });
    
    // Filter callbacks for this day
    filteredCallbacks.forEach(callback => {
      const date = new Date(callback.callback_slots.start_time);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (key === dayKey) events.push({ ...callback, type: 'callback' });
    });
    
    // Filter personal events for this day
    filteredPersonal.forEach(evt => {
      const date = new Date(evt.start_time || evt.start || new Date());
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (key === dayKey) events.push({ ...evt, type: 'personal' });
    });
    
    // Filter production events for this day
    filteredProduction.forEach(evt => {
      const date = new Date(evt.date);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (key === dayKey) events.push({ ...evt, type: 'production' });
    });
    
    // Sort by time
    return events.sort((a, b) => {
      const timeA = new Date(
        a.type === 'audition' ? a.audition_slots.start_time : 
        a.type === 'callback' ? a.callback_slots.start_time : 
        a.type === 'production' ? (a.startTime || a.date) :
        a.start
      ).getTime();
      const timeB = new Date(
        b.type === 'audition' ? b.audition_slots.start_time : 
        b.type === 'callback' ? b.callback_slots.start_time : 
        b.type === 'production' ? (b.startTime || b.date) :
        b.start
      ).getTime();
      return timeA - timeB;
    });
  }, [currentDay, filteredSignups, filteredCallbacks, filteredPersonal, filteredProduction]);

  // Group events by month for display
  const groupedEvents = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    dayEvents.forEach(event => {
      const date = new Date(
        event.type === 'audition' ? event.audition_slots.start_time : 
        event.type === 'callback' ? event.callback_slots.start_time : 
        event.type === 'production' ? (event.startTime || event.date) :
        event.start
      );
      const monthKey = formatUSMonthYear(date);
      
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(event);
    });
    
    return grouped;
  }, [dayEvents]);

  return (
    <>
      {/* Add Personal Event Button */}
      <div className="mb-4">
        <button
          onClick={() => { setSelectedDate(new Date()); setShowPersonalEventsModal(true); }}
          className="px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary"
        >
          + Add Personal Event
        </button>
      </div>

      {/* Day Navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 p-4 bg-neu-surface rounded-lg border border-neu-border shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)]">
        <button
          onClick={handlePreviousDay}
          className="p-2 rounded-lg bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[2px_2px_4px_var(--neu-shadow-dark),-2px_-2px_4px_var(--neu-shadow-light)] hover:shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px_4px_var(--neu-shadow-light)] transition-all duration-200"
          aria-label="Previous day"
        >
          <MdChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center flex-1 mx-4">
          <h2 className="text-lg sm:text-xl font-semibold text-neu-text-primary">
            {currentDay.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </h2>
          <p className="text-sm text-neu-text-primary/60 mt-1">
            {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
          </p>
        </div>
        
        <button
          onClick={handleNextDay}
          className="p-2 rounded-lg bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[2px_2px_4px_var(--neu-shadow-dark),-2px_-2px_4px_var(--neu-shadow-light)] hover:shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px_4px_var(--neu-shadow-light)] transition-all duration-200"
          aria-label="Next day"
        >
          <MdChevronRight className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={handleToday}
        className="mb-4 px-4 py-2 rounded-lg bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] transition-all duration-200 font-medium"
      >
        Today
      </button>

      {/* List of events */}
      {dayEvents.length === 0 ? (
        <EmptyState
          icon={<MdCalendarToday className="w-16 h-16 text-neu-text-primary/30 mx-auto" />}
          title="No events found"
          description={`No ${filter === 'upcoming' ? 'upcoming' : filter === 'past' ? 'past' : ''} events found`}
        />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {Object.entries(groupedEvents).map(([month, monthEvents]) => (
            <div key={month}>
              <h3 className="text-lg sm:text-xl font-semibold text-neu-text-primary mb-3 sm:mb-4 pb-2 border-b border-neu-border">
                {month}
              </h3>
              <div className="space-y-3">
                {monthEvents.map((event: any) => {
                  const isCallback = event.type === 'callback';
                  const isPersonal = event.type === 'personal';
                  const isProduction = event.type === 'production';
                  
                  // Debug log for production events
                  if (isProduction) {
                    console.log('Production event in list:', {
                      title: event.title,
                      eventType: event.type,
                      startTime: event.startTime,
                      date: event.date,
                      hasStartTime: !!event.startTime
                    });
                  }
                  
                  // Get start time - production events use startTime (capital T), others use start_time
                  const startTime = new Date(
                    isProduction ? (event.startTime || event.date) :
                    event.start_time || event.start || new Date()
                  );
                  const endTime = new Date(
                    isCallback ? event.callback_slots.end_time :
                    isProduction ? (event.endTime || event.date) :
                    event.audition_slots ? event.audition_slots.end_time : event.end || event.start
                  );
                  
                  const showTitle = isCallback 
                    ? event.callback_slots?.auditions?.shows?.title || 'Callback'
                    : isProduction 
                    ? event.title
                    : event.audition_slots?.auditions?.shows?.title || event.title || 'Unknown Show';
                  const showAuthor = isCallback ? event.callback_slots?.auditions?.shows?.author : isProduction ? event.show?.author : event.audition_slots?.auditions?.shows?.author;
                  const roleName = !isCallback && !isProduction ? event.roles?.role_name : isProduction ? event.role : null;
                  const location = isCallback ? event.callback_slots.location : isProduction ? event.location : (event.audition_slots ? (event.audition_slots.location || event.audition_slots?.auditions?.audition_location) : event.location);
                  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

                  const Wrapper: any = 'button';
                  return (
                    <Wrapper
                      key={isCallback ? event.invitation_id : isProduction ? `prod-${event.auditionId}-${event.type}-${event.date}` : event.signup_id || event.id || `${event.title}-${event.start}`}
                      onClick={() => {
                        if (isPersonal) {
                          setSelectedPersonalEvent(event);
                        } else if (!isProduction) {
                          setSelectedEvent(isCallback ? { ...event, isCallback: true } : event);
                        }
                      }}
                      className={`w-full text-left p-3 sm:p-4 rounded-lg bg-neu-surface/50 backdrop-blur-sm border border-neu-border hover:border-neu-border-focus hover:bg-neu-surface/70 transition-all duration-200 ${isProduction ? 'cursor-default' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <div className="text-center min-w-[50px] sm:min-w-[60px]">
                              <div className="text-xl sm:text-2xl font-bold text-neu-accent-primary">
                                {startTime.getDate()}
                              </div>
                              <div className="text-[10px] sm:text-xs text-neu-text-primary/70 uppercase">
                                {formatUSMonthShort(startTime)}
                              </div>
                            </div>
                            <div className="text-[10px] sm:text-xs text-neu-text-primary/70 uppercase">
                              {formatUSMonthShort(startTime)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm sm:text-base font-semibold flex items-center gap-2 mb-1 break-words overflow-wrap-anywhere ${
                              isCallback ? 'text-purple-400 dark:text-purple-300' : 
                              isPersonal ? '' : 
                              isProduction ? (
                                event.type === 'rehearsal' ? 'text-orange-500 dark:text-orange-400' : 
                                event.type === 'performance' ? 'text-red-500 dark:text-red-400' :
                                event.type === 'audition_slot' ? 'text-teal-500 dark:text-teal-400' :
                                event.type === 'rehearsal_event' ? 'text-amber-500 dark:text-amber-400' :
                                event.type === 'agenda_item' ? 'text-amber-500 dark:text-amber-400' :
                                event.type === 'production_event' ? 'text-neu-text-primary' :
                                'text-neu-accent-primary'
                              ) : 'text-neu-accent-primary'
                            }`}
                            style={isPersonal ? { color: event.color || '#34d399' } : undefined}>
                              {isCallback && <span className="flex-shrink-0">📋</span>}
                              {isPersonal && <span className="flex-shrink-0">🗓️</span>}
                              {isProduction && event.type === 'rehearsal' && <span className="flex-shrink-0">🎭</span>}
                              {isProduction && event.type === 'performance' && <span className="flex-shrink-0">🎪</span>}
                              {isProduction && event.type === 'audition_slot' && <span className="flex-shrink-0">📋</span>}
                              {isProduction && event.type === 'rehearsal_event' && <span className="flex-shrink-0">🎬</span>}
                              {isProduction && event.type === 'agenda_item' && <span className="flex-shrink-0">🎬</span>}
                              {isProduction && event.type === 'production_event' && <span className="flex-shrink-0">📌</span>}
                              <span className="break-words overflow-wrap-anywhere">{showTitle}</span>
                            </h4>
                            {showAuthor && (
                              <p className="text-xs sm:text-sm text-neu-text-primary/60 break-words overflow-wrap-anywhere">
                                by {showAuthor}
                              </p>
                            )}
                            {roleName && (
                              <p className="text-xs sm:text-sm text-neu-accent-primary font-medium mt-1 break-words overflow-wrap-anywhere">
                                Role: {roleName}
                              </p>
                            )}
                            {isCallback && (
                              <p className="text-xs sm:text-sm text-purple-400 dark:text-purple-300 font-medium mt-1">
                                Callback
                              </p>
                            )}
                            {isPersonal && (
                              <p className="text-xs sm:text-sm text-green-500 dark:text-green-400 font-medium mt-1">
                                Personal
                              </p>
                            )}
                            {isProduction && (
                              <>
                                <p className={`text-xs font-medium mb-1 ${isProduction ? (
                                  event.type === 'rehearsal' ? 'text-orange-500 dark:text-orange-400' : 
                                  event.type === 'performance' ? 'text-red-500 dark:text-red-400' :
                                  event.type === 'audition_slot' ? 'text-teal-500 dark:text-teal-400' :
                                  event.type === 'rehearsal_event' ? 'text-amber-500 dark:text-amber-400' :
                                  event.type === 'agenda_item' ? 'text-amber-500 dark:text-amber-400' :
                                  event.type === 'production_event' ? 'text-neu-text-primary' :
                                  'text-neu-accent-primary'
                                ) : 'text-neu-accent-primary'
                                }`}>
                                  {event.type === 'rehearsal' ? 'Rehearsal Period' : 
                                   event.type === 'performance' ? 'Performance Run' :
                                   event.type === 'audition_slot' ? 'Audition Slot' :
                                   event.type === 'rehearsal_event' ? 'Rehearsal Event' :
                                   event.type === 'agenda_item' ? 'Rehearsal' :
                                   event.type === 'production_event' ? ((event as any).eventTypeName || 'Production Event') :
                                   'Production Event'}
                                </p>
                                {(event.eventId || event.slotId) && (
                                  <p className="text-[10px] text-neu-text-primary/40 mt-0.5 font-mono">
                                    ID: {event.eventId || event.slotId}
                                  </p>
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neu-text-primary/70 ml-[54px] sm:ml-[72px]">
                            <div className="flex items-center gap-1">
                              <MdAccessTime className="w-3 h-3 sm:w-4 sm:h-4" />
                              {formatUSTime(startTime, timeZone)} - {formatUSTime(endTime, timeZone)} ({duration} min)
                            </div>
                            {location && (
                              <div className="flex items-start gap-1 break-words overflow-wrap-anywhere">
                                <MdLocationOn className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 mt-0.5" />
                                <a
                                  href={getGoogleMapsLink(location)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="break-words overflow-wrap-anywhere text-neu-accent-primary hover:text-neu-accent-secondary underline decoration-dotted underline-offset-2 transition-colors"
                                >
                                  {location}
                                </a>
                              </div>
                            )}
                          </div>

                          {!isCallback && event.status && event.status !== 'Signed Up' && (
                            <div className="ml-[54px] sm:ml-[72px] mt-2">
                              <Badge
                                variant={
                                  event.status === 'Callback' ? 'info' :
                                  event.status === 'Offer Extended' ? 'info' :
                                  event.status === 'Offer Accepted' ? 'success' :
                                  event.status === 'Offer Rejected' ? 'warning' :
                                  event.status === 'Rejected' ? 'danger' :
                                  'default'
                                }
                                className="inline-block px-3 py-1 rounded-full"
                              >
                                {event.status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            </div>
          ))}
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
            // Reload a reasonable range: one year window
            const start = new Date();
            start.setMonth(start.getMonth() - 6);
            const end = new Date();
            end.setMonth(end.getMonth() + 6);
            loadEvents(start, end);
          }}
          selectedDate={selectedDate || undefined}
          userId={userId}
          timeZone={timeZone}
        />
      )}
      {selectedPersonalEvent && !editingPersonalEvent && (
        <PersonalEventModal
          event={selectedPersonalEvent}
          userId={userId}
          onClose={() => setSelectedPersonalEvent(null)}
          onDelete={() => {
            const start = new Date();
            start.setMonth(start.getMonth() - 6);
            const end = new Date();
            end.setMonth(end.getMonth() + 6);
            loadEvents(start, end);
            setSelectedPersonalEvent(null);
          }}
          onEdit={(event) => {
            setEditingPersonalEvent(event);
            setSelectedPersonalEvent(null);
          }}
          timeZone={timeZone}
        />
      )}
      {editingPersonalEvent && (
        <EventForm
          isOpen={true}
          onClose={() => setEditingPersonalEvent(null)}
          onSave={() => {
            const start = new Date();
            start.setMonth(start.getMonth() - 6);
            const end = new Date();
            end.setMonth(end.getMonth() + 6);
            loadEvents(start, end);
            setEditingPersonalEvent(null);
          }}
          event={editingPersonalEvent}
          userId={userId}
          timeZone={timeZone}
        />
      )}
    </>
  );
}
