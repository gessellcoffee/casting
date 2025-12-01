'use client';

import { useState, useMemo } from 'react';
import { MdChevronLeft, MdChevronRight, MdCalendarToday, MdList } from 'react-icons/md';
import CalendarMonthView from './CalendarMonthView';
import CalendarWeekView from './CalendarWeekView';
import CalendarListView from './CalendarListView';
import CalendarLegend, { EventTypeFilter } from './CalendarLegend';
import type { ProductionDateEvent } from '@/lib/utils/calendarEvents';

type ViewMode = 'month' | 'week' | 'list';

interface AuditionCalendarProps {
  signups: any[];
  callbacks?: any[];
  productionEvents?: ProductionDateEvent[];
  userId: string;
  onRefresh?: () => void;
  hasOwnedAuditions?: boolean;
  hasProductionTeamAuditions?: boolean;
  onFilteredEventsChange?: (events: ProductionDateEvent[]) => void;
}

export default function AuditionCalendar({ 
  signups, 
  callbacks = [], 
  productionEvents = [], 
  userId, 
  onRefresh,
  hasOwnedAuditions = false,
  hasProductionTeamAuditions = false,
  onFilteredEventsChange
}: AuditionCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCallbacks, setShowCallbacks] = useState(true);
  
  // Event type filters
  const [eventFilters, setEventFilters] = useState<EventTypeFilter>({
    auditionSignups: true,
    callbacks: true,
    personalEvents: true,
    rehearsalDates: true,
    performanceDates: true,
    auditionSlots: true,
    rehearsalEvents: true
  });
  
  // Determine user role based on what events they have
  const userRole = useMemo(() => {
    const hasActorEvents = signups.length > 0 || callbacks.length > 0;
    // Check if user has any events where they are owner or production team
    // OR if they have owned/production team auditions (even without events yet)
    const hasCreatorEvents = hasOwnedAuditions || 
                            hasProductionTeamAuditions || 
                            productionEvents.some(e => 
                              e.userRole === 'owner' || e.userRole === 'production_team'
                            );
    
    console.log('User role detection:', {
      hasActorEvents,
      hasCreatorEvents,
      hasOwnedAuditions,
      hasProductionTeamAuditions,
      productionEventsCount: productionEvents.length,
      productionEventTypes: productionEvents.map(e => ({ type: e.type, userRole: e.userRole }))
    });
    
    if (hasActorEvents && hasCreatorEvents) return 'both';
    if (hasCreatorEvents) return 'creator';
    return 'actor';
  }, [signups, callbacks, productionEvents, hasOwnedAuditions, hasProductionTeamAuditions]);
  
  // Filter events based on selected filters
  const filteredSignups = useMemo(() => 
    eventFilters.auditionSignups ? signups : [],
    [signups, eventFilters.auditionSignups]
  );
  
  const filteredCallbacks = useMemo(() => 
    eventFilters.callbacks ? callbacks : [],
    [callbacks, eventFilters.callbacks]
  );
  
  const filteredProductionEvents = useMemo(() => {
    const filtered = productionEvents.filter(evt => {
      if (evt.type === 'rehearsal' && !eventFilters.rehearsalDates) return false;
      if (evt.type === 'performance' && !eventFilters.performanceDates) return false;
      if (evt.type === 'audition_slot' && !eventFilters.auditionSlots) return false;
      if (evt.type === 'rehearsal_event' && !eventFilters.rehearsalEvents) return false;
      if (evt.type === 'agenda_item' && !eventFilters.rehearsalEvents) return false; // Use same filter as rehearsal_event
      return true;
    });
    
    // Notify parent of filtered events change
    if (onFilteredEventsChange) {
      onFilteredEventsChange(filtered);
    }
    
    return filtered;
  }, [productionEvents, eventFilters, onFilteredEventsChange]);

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
    <div className="calendar-container rounded-xl">
      {/* Calendar Header */}
      <div className="calendar-header-border p-4 sm:p-6">
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
        {/* Event Type Legend/Filter */}
        <CalendarLegend 
          filters={eventFilters}
          onFilterChange={setEventFilters}
          userRole={userRole}
        />
        
        {viewMode === 'month' && (
          <CalendarMonthView 
            signups={filteredSignups}
            callbacks={showCallbacks ? filteredCallbacks : []}
            productionEvents={filteredProductionEvents}
            currentDate={currentDate}
            userId={userId}
            onRefresh={onRefresh}
            eventFilters={eventFilters}
          />
        )}
        {viewMode === 'week' && (
          <CalendarWeekView 
            signups={filteredSignups}
            callbacks={showCallbacks ? filteredCallbacks : []}
            productionEvents={filteredProductionEvents}
            currentDate={currentDate}
            userId={userId}
            onRefresh={onRefresh}
          />
        )}
        {viewMode === 'list' && (
          <CalendarListView 
            signups={filteredSignups}
            callbacks={showCallbacks ? filteredCallbacks : []}
            productionEvents={filteredProductionEvents}
            userId={userId}
            onRefresh={onRefresh}
          />
        )}
      </div>
    </div>
  );
}
