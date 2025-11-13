'use client';

import { useState } from 'react';
import { MdFilterList, MdExpandMore, MdExpandLess } from 'react-icons/md';

export interface EventTypeFilter {
  auditionSignups: boolean;
  callbacks: boolean;
  personalEvents: boolean;
  rehearsalDates: boolean;
  performanceDates: boolean;
  auditionSlots: boolean;
  rehearsalEvents: boolean;
}

interface CalendarLegendProps {
  filters: EventTypeFilter;
  onFilterChange: (filters: EventTypeFilter) => void;
  userRole: 'actor' | 'creator' | 'both'; // Determines which event types to show
}

export default function CalendarLegend({ filters, onFilterChange, userRole }: CalendarLegendProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleFilter = (key: keyof EventTypeFilter) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key]
    });
  };

  const eventTypes = [
    // Actor events
    ...(userRole === 'actor' || userRole === 'both' ? [
      {
        key: 'auditionSignups' as keyof EventTypeFilter,
        label: 'Audition Signups',
        icon: '🎭',
        color: 'bg-[#5a8ff5]/20',
        borderColor: 'border-[#5a8ff5]/50',
        textColor: 'text-[#5a8ff5]',
        description: 'Auditions you signed up for'
      },
      {
        key: 'callbacks' as keyof EventTypeFilter,
        label: 'Callbacks',
        icon: '📋',
        color: 'bg-purple-500/20',
        borderColor: 'border-purple-500/50',
        textColor: 'text-purple-400',
        description: 'Callback invitations'
      },
      {
        key: 'rehearsalDates' as keyof EventTypeFilter,
        label: 'Rehearsal Dates',
        icon: '🎭',
        color: 'bg-orange-500/20',
        borderColor: 'border-orange-500/50',
        textColor: 'text-orange-400',
        description: 'Rehearsal period (if cast)'
      },
      {
        key: 'performanceDates' as keyof EventTypeFilter,
        label: 'Performance Dates',
        icon: '🎪',
        color: 'bg-red-500/20',
        borderColor: 'border-red-500/50',
        textColor: 'text-red-400',
        description: 'Performance run (if cast)'
      }
    ] : []),
    // Creator/Production Team events
    ...(userRole === 'creator' || userRole === 'both' ? [
      {
        key: 'auditionSlots' as keyof EventTypeFilter,
        label: 'Audition Slots',
        icon: '📋',
        color: 'bg-teal-500/20',
        borderColor: 'border-teal-500/50',
        textColor: 'text-teal-400',
        description: 'Slots you\'re managing'
      },
      {
        key: 'rehearsalEvents' as keyof EventTypeFilter,
        label: 'Rehearsal Events',
        icon: '🎬',
        color: 'bg-amber-500/20',
        borderColor: 'border-amber-500/50',
        textColor: 'text-amber-400',
        description: 'Scheduled rehearsals'
      }
    ] : []),
    // Personal events (everyone)
    {
      key: 'personalEvents' as keyof EventTypeFilter,
      label: 'Personal Events',
      icon: '🗓️',
      color: 'bg-green-500/20',
      borderColor: 'border-green-500/50',
      textColor: 'text-green-400',
      description: 'Your personal calendar events'
    }
  ];

  return (
    <div className="mb-4 sm:mb-6">
      <div className="bg-neu-surface rounded-lg border border-neu-border shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-neu-surface/70 transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <MdFilterList className="w-5 h-5 text-neu-accent-primary" />
            <h3 className="text-sm sm:text-base font-semibold text-neu-text-primary">
              Event Types
            </h3>
            <span className="text-xs text-neu-text-primary/60">
              ({eventTypes.filter(et => filters[et.key]).length}/{eventTypes.length} visible)
            </span>
          </div>
          {isExpanded ? (
            <MdExpandLess className="w-5 h-5 text-neu-text-primary/60" />
          ) : (
            <MdExpandMore className="w-5 h-5 text-neu-text-primary/60" />
          )}
        </button>

        {/* Legend Items */}
        {isExpanded && (
          <div className="p-3 sm:p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {eventTypes.map((eventType) => (
              <button
                key={eventType.key}
                onClick={() => toggleFilter(eventType.key)}
                className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all duration-200 ${
                  filters[eventType.key]
                    ? `${eventType.color} ${eventType.borderColor}`
                    : 'bg-neu-surface/30 border-neu-border opacity-50'
                } hover:opacity-100`}
                title={eventType.description}
              >
                {/* Checkbox */}
                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  filters[eventType.key]
                    ? `${eventType.borderColor} ${eventType.color}`
                    : 'border-neu-border bg-neu-surface'
                }`}>
                  {filters[eventType.key] && (
                    <svg
                      className={`w-3 h-3 ${eventType.textColor}`}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>

                {/* Event Type Info */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 mb-0.5">
                    <span className="text-sm sm:text-base">{eventType.icon}</span>
                    <span className={`text-xs sm:text-sm font-medium truncate ${
                      filters[eventType.key] ? 'text-neu-text-primary' : 'text-neu-text-primary/50'
                    }`}>
                      {eventType.label}
                    </span>
                  </div>
                  <p className={`text-[10px] sm:text-xs truncate ${
                    filters[eventType.key] ? 'text-neu-text-primary/60' : 'text-neu-text-primary/30'
                  }`}>
                    {eventType.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {isExpanded && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex gap-2">
            <button
              onClick={() => {
                const allEnabled: EventTypeFilter = {
                  auditionSignups: true,
                  callbacks: true,
                  personalEvents: true,
                  rehearsalDates: true,
                  performanceDates: true,
                  auditionSlots: true,
                  rehearsalEvents: true
                };
                onFilterChange(allEnabled);
              }}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-neu-surface border border-neu-border text-neu-text-primary hover:border-neu-border-focus hover:text-neu-accent-primary transition-all duration-200 shadow-[2px_2px_4px_var(--neu-shadow-dark),-2px_-2px_4px_var(--neu-shadow-light)] hover:shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px_4px_var(--neu-shadow-light)]"
            >
              Show All
            </button>
            <button
              onClick={() => {
                const allDisabled: EventTypeFilter = {
                  auditionSignups: false,
                  callbacks: false,
                  personalEvents: false,
                  rehearsalDates: false,
                  performanceDates: false,
                  auditionSlots: false,
                  rehearsalEvents: false
                };
                onFilterChange(allDisabled);
              }}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-neu-surface border border-neu-border text-neu-text-primary hover:border-neu-border-focus hover:text-neu-accent-primary transition-all duration-200 shadow-[2px_2px_4px_var(--neu-shadow-dark),-2px_-2px_4px_var(--neu-shadow-light)] hover:shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px_4px_var(--neu-shadow-light)]"
            >
              Hide All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
