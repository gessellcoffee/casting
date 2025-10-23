'use client';

import { useState, useMemo } from 'react';
import { MdChevronLeft, MdChevronRight, MdCalendarToday, MdList } from 'react-icons/md';
import CalendarMonthView from './CalendarMonthView';
import CalendarWeekView from './CalendarWeekView';
import CalendarListView from './CalendarListView';

type ViewMode = 'month' | 'week' | 'list';

interface AuditionCalendarProps {
  signups: any[];
  callbacks?: any[];
  userId: string;
  onRefresh?: () => void;
}

export default function AuditionCalendar({ signups, callbacks = [], userId, onRefresh }: AuditionCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCallbacks, setShowCallbacks] = useState(true);

  // Navigate to previous period
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next period
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Format the current period display
  const periodDisplay = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return 'All Auditions';
  }, [currentDate, viewMode]);

  return (
    <div className="rounded-xl bg-white/90 backdrop-blur-md border border-neu-border/60 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 sm:p-6 border-b border-neu-border/60">
        {/* Title - Always visible on mobile */}
        <h2 className="text-xl sm:text-2xl font-semibold text-neu-text-primary mb-4">
          {periodDisplay}
        </h2>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            {viewMode !== 'list' && (
              <>
                <button
                  onClick={handlePrevious}
                  className="p-2 rounded-lg bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary transition-all duration-200"
                  aria-label="Previous"
                >
                  <MdChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary transition-all duration-200 font-medium text-sm sm:text-base"
                >
                  Today
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-lg bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary transition-all duration-200"
                  aria-label="Next"
                >
                  <MdChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* View Mode Toggles */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {/* Show Callbacks Toggle */}
            {callbacks.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCallbacks}
                  onChange={(e) => setShowCallbacks(e.target.checked)}
                  className="w-4 h-4 rounded border-neu-border bg-neu-surface/50 text-[#9b87f5] focus:ring-[#9b87f5] focus:ring-offset-0 shadow-[inset_2px_2px_5px_var(--neu-shadow-dark)]"
                />
                <span className="text-sm text-neu-text-primary font-medium">Show Callbacks ({callbacks.length})</span>
              </label>
            )}

            <div className="flex flex-row items-center gap-2 justify-center sm:justify-start">
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                viewMode === 'month'
                  ? 'bg-[#5a8ff5]/20 border border-neu-border-focus text-neu-accent-primary shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]'
                  : 'bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary'
              }`}
            >
              <MdCalendarToday className="w-4 h-4" />
              <span className="hidden xs:inline">Month</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                viewMode === 'week'
                  ? 'bg-[#5a8ff5]/20 border border-neu-border-focus text-neu-accent-primary shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]'
                  : 'bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary'
              }`}
            >
              <MdCalendarToday className="w-4 h-4" />
              <span className="hidden xs:inline">Week</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                viewMode === 'list'
                  ? 'bg-[#5a8ff5]/20 border border-neu-border-focus text-neu-accent-primary shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]'
                  : 'bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary'
              }`}
            >
              <MdList className="w-4 h-4" />
              <span className="hidden xs:inline">List</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {viewMode === 'month' && (
          <CalendarMonthView 
            signups={signups}
            callbacks={showCallbacks ? callbacks : []}
            currentDate={currentDate}
            userId={userId}
            onRefresh={onRefresh}
          />
        )}
        {viewMode === 'week' && (
          <CalendarWeekView 
            signups={signups}
            callbacks={showCallbacks ? callbacks : []}
            currentDate={currentDate}
            userId={userId}
            onRefresh={onRefresh}
          />
        )}
        {viewMode === 'list' && (
          <CalendarListView 
            signups={signups}
            callbacks={showCallbacks ? callbacks : []}
            userId={userId}
            onRefresh={onRefresh}
          />
        )}
      </div>
    </div>
  );
}
