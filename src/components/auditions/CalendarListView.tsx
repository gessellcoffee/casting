'use client';

import { useMemo, useState } from 'react';
import { MdCalendarToday, MdLocationOn, MdAccessTime } from 'react-icons/md';
import AuditionEventModal from './AuditionEventModal';
import CallbackDetailsModal from '@/components/callbacks/CallbackDetailsModal';
import EmptyState from '@/components/ui/feedback/EmptyState';
import Badge from '@/components/ui/feedback/Badge';

interface CalendarListViewProps {
  signups: any[];
  callbacks?: any[];
  userId: string;
  onRefresh?: () => void;
}

export default function CalendarListView({ signups, callbacks = [], userId, onRefresh }: CalendarListViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

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

  // Group signups and callbacks by month
  const groupedEvents = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    // Add signups
    filteredSignups.forEach((signup) => {
      const date = new Date(signup.audition_slots.start_time);
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push({ ...signup, type: 'audition' });
    });

    // Add callbacks
    filteredCallbacks.forEach((callback) => {
      const date = new Date(callback.callback_slots.start_time);
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push({ ...callback, type: 'callback' });
    });

    // Sort events within each month
    Object.keys(grouped).forEach(month => {
      grouped[month].sort((a, b) => {
        const timeA = new Date(a.type === 'audition' ? a.audition_slots.start_time : a.callback_slots.start_time).getTime();
        const timeB = new Date(b.type === 'audition' ? b.audition_slots.start_time : b.callback_slots.start_time).getTime();
        return filter === 'past' ? timeB - timeA : timeA - timeB;
      });
    });
    
    return grouped;
  }, [filteredSignups, filteredCallbacks, filter]);

  return (
    <>
      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
            filter === 'upcoming'
              ? 'bg-[#5a8ff5]/20 border border-neu-border-focus text-neu-accent-primary shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]'
              : 'bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
            filter === 'past'
              ? 'bg-[#5a8ff5]/20 border border-neu-border-focus text-neu-accent-primary shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]'
              : 'bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary'
          }`}
        >
          Past
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
            filter === 'all'
              ? 'bg-[#5a8ff5]/20 border border-neu-border-focus text-neu-accent-primary shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]'
              : 'bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary'
          }`}
        >
          All
        </button>
      </div>

      {/* List of events */}
      {Object.keys(groupedEvents).length === 0 ? (
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
                  const startTime = new Date(isCallback ? event.callback_slots.start_time : event.audition_slots.start_time);
                  const endTime = new Date(isCallback ? event.callback_slots.end_time : event.audition_slots.end_time);
                  const showTitle = isCallback 
                    ? event.callback_slots?.auditions?.shows?.title || 'Callback'
                    : event.audition_slots?.auditions?.shows?.title || 'Unknown Show';
                  const showAuthor = isCallback ? event.callback_slots?.auditions?.shows?.author : event.audition_slots?.auditions?.shows?.author;
                  const roleName = !isCallback ? event.roles?.role_name : null;
                  const location = isCallback ? event.callback_slots.location : (event.audition_slots.location || event.audition_slots?.auditions?.audition_location);
                  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

                  return (
                    <button
                      key={isCallback ? event.invitation_id : event.signup_id}
                      onClick={() => setSelectedEvent(isCallback ? { ...event, isCallback: true } : event)}
                      className="w-full text-left p-3 sm:p-4 rounded-lg bg-white/70 backdrop-blur-sm border border-neu-border/40 hover:border-neu-border-focus hover:bg-white/85 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <div className="text-center min-w-[50px] sm:min-w-[60px]">
                              <div className="text-xl sm:text-2xl font-bold text-neu-accent-primary">
                                {startTime.getDate()}
                              </div>
                              <div className="text-[10px] sm:text-xs text-neu-text-primary/70 uppercase">
                                {startTime.toLocaleDateString('en-US', { month: 'short' })}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-base sm:text-lg font-semibold mb-1 flex items-center gap-2 truncate ${isCallback ? 'text-[#9b87f5]' : 'text-neu-text-primary'}`}>
                                {isCallback && <span className="flex-shrink-0">📋</span>}
                                <span className="truncate">{showTitle}</span>
                              </h4>
                              {showAuthor && (
                                <p className="text-xs sm:text-sm text-neu-text-primary/60 truncate">
                                  by {showAuthor}
                                </p>
                              )}
                              {roleName && (
                                <p className="text-xs sm:text-sm text-neu-accent-primary font-medium mt-1 truncate">
                                  Role: {roleName}
                                </p>
                              )}
                              {isCallback && (
                                <p className="text-xs sm:text-sm text-[#9b87f5] font-medium mt-1">
                                  Callback
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neu-text-primary/70 ml-[54px] sm:ml-[72px]">
                            <div className="flex items-center gap-1">
                              <MdAccessTime className="w-3 h-3 sm:w-4 sm:h-4" />
                              {startTime.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })} - {endTime.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })} ({duration} min)
                            </div>
                            {location && (
                              <div className="flex items-center gap-1 truncate">
                                <MdLocationOn className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{location}</span>
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
                    </button>
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
    </>
  );
}
