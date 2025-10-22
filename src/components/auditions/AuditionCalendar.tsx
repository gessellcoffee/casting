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
    <div className="rounded-xl bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-6 border-b border-[#4a7bd9]/20">
        <div className="flex items-center justify-between mb-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            {viewMode !== 'list' && (
              <>
                <button
                  onClick={handlePrevious}
                  className="p-2 rounded-lg bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#5a8ff5]/30 text-[#c5ddff] shadow-[3px_3px_6px_var(--cosmic-shadow-dark),-3px_-3px_6px_var(--cosmic-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)] hover:text-[#5a8ff5] transition-all duration-200"
                  aria-label="Previous"
                >
                  <MdChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-4 py-2 rounded-lg bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#5a8ff5]/30 text-[#c5ddff] shadow-[3px_3px_6px_var(--cosmic-shadow-dark),-3px_-3px_6px_var(--cosmic-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)] hover:text-[#5a8ff5] transition-all duration-200 font-medium"
                >
                  Today
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-lg bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#5a8ff5]/30 text-[#c5ddff] shadow-[3px_3px_6px_var(--cosmic-shadow-dark),-3px_-3px_6px_var(--cosmic-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)] hover:text-[#5a8ff5] transition-all duration-200"
                  aria-label="Next"
                >
                  <MdChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <h2 className="text-2xl font-semibold text-[#c5ddff] ml-4">
              {periodDisplay}
            </h2>
          </div>

          {/* View Mode Toggles */}
          <div className="flex items-center gap-4">
            {/* Show Callbacks Toggle */}
            {callbacks.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCallbacks}
                  onChange={(e) => setShowCallbacks(e.target.checked)}
                  className="w-4 h-4 rounded border-[#4a7bd9]/30 bg-[#2e3e5e]/50 text-[#9b87f5] focus:ring-[#9b87f5] focus:ring-offset-0 shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark)]"
                />
                <span className="text-sm text-[#c5ddff] font-medium">Show Callbacks ({callbacks.length})</span>
              </label>
            )}

            <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'month'
                  ? 'bg-[#5a8ff5]/20 border border-[#5a8ff5]/50 text-[#5a8ff5] shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)]'
                  : 'bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#5a8ff5]/30 text-[#c5ddff] shadow-[3px_3px_6px_var(--cosmic-shadow-dark),-3px_-3px_6px_var(--cosmic-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)] hover:text-[#5a8ff5]'
              }`}
            >
              <MdCalendarToday className="w-4 h-4" />
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'week'
                  ? 'bg-[#5a8ff5]/20 border border-[#5a8ff5]/50 text-[#5a8ff5] shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)]'
                  : 'bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#5a8ff5]/30 text-[#c5ddff] shadow-[3px_3px_6px_var(--cosmic-shadow-dark),-3px_-3px_6px_var(--cosmic-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)] hover:text-[#5a8ff5]'
              }`}
            >
              <MdCalendarToday className="w-4 h-4" />
              Week
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-[#5a8ff5]/20 border border-[#5a8ff5]/50 text-[#5a8ff5] shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)]'
                  : 'bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#5a8ff5]/30 text-[#c5ddff] shadow-[3px_3px_6px_var(--cosmic-shadow-dark),-3px_-3px_6px_var(--cosmic-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)] hover:text-[#5a8ff5]'
              }`}
            >
              <MdList className="w-4 h-4" />
              List
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
