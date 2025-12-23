import React, { useState, useRef, useEffect } from 'react';
import { MdWarning } from 'react-icons/md';
import Avatar from '@/components/shared/Avatar';
import type { DailyConflictSummary } from '@/lib/supabase/dailyConflicts';

interface DailyConflictsDisplayProps {
  conflicts: DailyConflictSummary | null;
  showConflicts: boolean;
}

export default function DailyConflictsDisplay({ conflicts, showConflicts }: DailyConflictsDisplayProps) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const tooltipRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  if (!showConflicts || !conflicts || conflicts.total_conflicts === 0) {
    return null;
  }

  const { conflicts: conflictList } = conflicts;

  // Smart positioning function
  const getTooltipClasses = (elementId: string, isOverflow = false) => {
    const baseClasses = "absolute px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] shadow-lg";
    const maxWidthClass = isOverflow ? "max-w-xs" : "whitespace-nowrap";
    
    if (hoveredElement !== elementId) {
      return `${baseClasses} ${maxWidthClass} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }

    const tooltipEl = tooltipRefs.current[elementId];
    if (!tooltipEl) {
      return `${baseClasses} ${maxWidthClass} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }

    const rect = tooltipEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check if tooltip would overflow horizontally
    const wouldOverflowLeft = rect.left < 10;
    const wouldOverflowRight = rect.right > viewportWidth - 10;
    const wouldOverflowTop = rect.top < 10;
    
    let positionClasses = "";
    
    if (wouldOverflowTop) {
      // Position below if would overflow top
      positionClasses = "top-full left-1/2 transform -translate-x-1/2 mt-2";
    } else if (wouldOverflowLeft) {
      // Position to the right if would overflow left
      positionClasses = "bottom-full left-0 mb-2";
    } else if (wouldOverflowRight) {
      // Position to the left if would overflow right
      positionClasses = "bottom-full right-0 mb-2";
    } else {
      // Default position (centered above)
      positionClasses = "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
    
    return `${baseClasses} ${maxWidthClass} ${positionClasses}`;
  };

  // Get arrow classes based on tooltip position
  const getArrowClasses = (elementId: string) => {
    if (hoveredElement !== elementId) {
      return "absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900";
    }

    const tooltipEl = tooltipRefs.current[elementId];
    if (!tooltipEl) {
      return "absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900";
    }

    const rect = tooltipEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const wouldOverflowLeft = rect.left < 10;
    const wouldOverflowRight = rect.right > viewportWidth - 10;
    const wouldOverflowTop = rect.top < 10;
    
    if (wouldOverflowTop) {
      // Arrow points up when tooltip is below
      return "absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900";
    } else if (wouldOverflowLeft) {
      // Arrow points left when tooltip is to the right
      return "absolute top-1/2 right-full transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900";
    } else if (wouldOverflowRight) {
      // Arrow points right when tooltip is to the left
      return "absolute top-1/2 left-full transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900";
    } else {
      // Default arrow points down
      return "absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900";
    }
  };

  const handleMouseEnter = (elementId: string) => {
    setHoveredElement(elementId);
  };

  const handleMouseLeave = () => {
    setHoveredElement(null);
  };
  
  // Group conflicts by user_id to show only one avatar per user
  const conflictsByUser = new Map<string, typeof conflictList>();
  conflictList.forEach(conflict => {
    if (!conflictsByUser.has(conflict.user_id)) {
      conflictsByUser.set(conflict.user_id, []);
    }
    conflictsByUser.get(conflict.user_id)!.push(conflict);
  });

  const uniqueUsers = Array.from(conflictsByUser.entries());
  const displayUsers = uniqueUsers.slice(0, 5);
  const hasMoreUsers = uniqueUsers.length > 5;
  const extraUserCount = uniqueUsers.length - 5;

  return (
    <div className="mt-1 flex items-center gap-1 flex-wrap">
      {/* Display up to 5 user avatars */}
      {displayUsers.map(([userId, userConflicts]) => {
        const user = userConflicts[0]; // Get user info from first conflict
        const conflictTimes = userConflicts
          .sort((a, b) => {
            // Sort by start_time chronologically
            if (!a.start_time && !b.start_time) return 0;
            if (!a.start_time) return 1; // All-day events go to end
            if (!b.start_time) return -1;
            return a.start_time.localeCompare(b.start_time);
          })
          .map(c => {
            if (!c.start_time) return 'All day';
            const start = formatTimeString(c.start_time);
            const end = c.end_time ? formatTimeString(c.end_time) : '';
            return end ? `${start} - ${end}` : start;
          })
          .filter(Boolean);

        return (
          <div
            key={userId}
            className="relative group"
            onMouseEnter={() => handleMouseEnter(userId)}
            onMouseLeave={handleMouseLeave}
          >
            <Avatar
              src={user.profile_photo_url}
              alt={user.full_name}
              size="sm"
              className="ring-2 ring-red-400 ring-opacity-60"
            />
            {/* Conflict indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
            
            {/* Smart positioned tooltip */}
            <div 
              ref={(el) => { tooltipRefs.current[userId] = el; }}
              className={getTooltipClasses(userId)}
            >
              <div className="font-medium">{user.full_name}</div>
              {conflictTimes.map((time, index) => (
                <div key={index} className="text-gray-300">{time}</div>
              ))}
              {/* Smart positioned arrow */}
              <div className={getArrowClasses(userId)}></div>
            </div>
          </div>
        );
      })}
      
      {/* Show caution sign with count if more than 5 users */}
      {hasMoreUsers && (
        <div 
          className="relative group"
          onMouseEnter={() => handleMouseEnter('overflow')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">
            <MdWarning className="w-4 h-4" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
            +{extraUserCount}
          </div>
          
          {/* Smart positioned overflow tooltip */}
          <div 
            ref={(el) => { tooltipRefs.current['overflow'] = el; }}
            className={getTooltipClasses('overflow', true)}
          >
            <div className="font-medium">{extraUserCount} more user{extraUserCount > 1 ? 's' : ''}:</div>
            {uniqueUsers.slice(5).map(([userId, userConflicts]) => {
              const user = userConflicts[0];
              const conflictTimes = userConflicts
                .sort((a, b) => {
                  // Sort by start_time chronologically
                  if (!a.start_time && !b.start_time) return 0;
                  if (!a.start_time) return 1; // All-day events go to end
                  if (!b.start_time) return -1;
                  return a.start_time.localeCompare(b.start_time);
                })
                .map(c => {
                  if (!c.start_time) return 'All day';
                  const start = formatTimeString(c.start_time);
                  const end = c.end_time ? formatTimeString(c.end_time) : '';
                  return end ? `${start} - ${end}` : start;
                })
                .filter(Boolean);
              
              return (
                <div key={userId} className="text-gray-300">
                  {user.full_name} - {conflictTimes.join(', ')}
                </div>
              );
            })}
            {/* Smart positioned arrow */}
            <div className={getArrowClasses('overflow')}></div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeString(timeString: string): string {
  if (!timeString) return '';

  if (timeString.includes('T')) {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}
