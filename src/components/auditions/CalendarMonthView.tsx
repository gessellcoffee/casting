'use client';

import { useMemo, useState } from 'react';
import AuditionEventModal from './AuditionEventModal';
import CallbackDetailsModal from '@/components/callbacks/CallbackDetailsModal';
import { useGroupedSignups } from '@/lib/hooks/useGroupedSignups';
import { isToday } from '@/lib/utils/dateUtils';

interface CalendarMonthViewProps {
  signups: any[];
  callbacks?: any[];
  currentDate: Date;
  userId: string;
  onRefresh?: () => void;
}

export default function CalendarMonthView({ signups, callbacks = [], currentDate, userId, onRefresh }: CalendarMonthViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

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
          const today = isToday(day.fullDate);
          const totalEvents = daySignups.length + dayCallbacks.length;

          return (
            <div
              key={index}
              className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 rounded-lg border transition-all duration-200 ${
                day.isCurrentMonth
                  ? 'bg-neu-surface/30 border-neu-border'
                  : 'bg-neu-surface/10 border-[#4a7bd9]/10'
              } ${today ? 'ring-1 sm:ring-2 ring-[#5a8ff5]/50' : ''}`}
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
                      className="w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-white/80 backdrop-blur-sm border border-neu-accent-primary/30 text-neu-text-primary hover:bg-white/90 transition-all duration-200 truncate"
                    >
                      <div className="font-medium truncate">{showTitle}</div>
                      <div className="text-neu-text-primary/70 hidden sm:block">
                        {startTime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </button>
                  );
                })}

                {/* Callback Events */}
                {dayCallbacks.slice(0, Math.max(0, 3 - daySignups.length)).map((callback) => {
                  const startTime = new Date(callback.callback_slots.start_time);
                  const showTitle = callback.callback_slots?.auditions?.shows?.title || 'Callback';
                  
                  return (
                    <button
                      key={callback.invitation_id}
                      onClick={() => setSelectedEvent({ ...callback, isCallback: true })}
                      className="w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-white/80 backdrop-blur-sm border border-purple-400/30 text-neu-text-primary hover:bg-white/90 transition-all duration-200 truncate"
                    >
                      <div className="font-medium truncate flex items-center gap-1">
                        <span className="hidden sm:inline">📋</span>
                        {showTitle}
                      </div>
                      <div className="text-neu-text-primary/70 hidden sm:block">
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
    </>
  );
}
