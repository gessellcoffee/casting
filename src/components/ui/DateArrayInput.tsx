'use client';

import { useState, useRef, useEffect } from 'react';

interface DateArrayInputProps {
  value: string[]; // Array of date strings in YYYY-MM-DD format
  onChange: (dates: string[]) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  multiple?: boolean;
}

export default function DateArrayInput({
  value,
  onChange,
  label,
  placeholder = 'Select dates...',
  className = '',
  multiple = true,
}: DateArrayInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Stop dragging when mouse is released anywhere
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDate = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isDateSelected = (dateStr: string): boolean => {
    return value.includes(dateStr);
  };

  const toggleDate = (dateStr: string) => {
    const isSelected = isDateSelected(dateStr);
    
    if (isSelected) {
      // Remove date
      onChange(value.filter(d => d !== dateStr).sort());
    } else {
      // Add date
      onChange([...value, dateStr].sort());
    }
  };

  const handleDateMouseDown = (dateStr: string) => {
    const isSelected = isDateSelected(dateStr);
    setDragMode(isSelected ? 'deselect' : 'select');
    setIsDragging(true);
    toggleDate(dateStr);
  };

  const handleDateMouseEnter = (dateStr: string) => {
    if (!isDragging) return;

    const isSelected = isDateSelected(dateStr);
    
    if (dragMode === 'select' && !isSelected) {
      onChange([...value, dateStr].sort());
    } else if (dragMode === 'deselect' && isSelected) {
      onChange(value.filter(d => d !== dateStr).sort());
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const clearAll = () => {
    onChange([]);
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  // Create array of day cells including empty cells for alignment
  const dayCells = [];
  
  // Add empty cells for days before the first of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    dayCells.push(<div key={`empty-${i}`} className="h-10" />);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, month, day);
    const isSelected = isDateSelected(dateStr);
    const isToday = dateStr === formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    dayCells.push(
      <div
        key={dateStr}
        onMouseDown={() => handleDateMouseDown(dateStr)}
        onMouseEnter={() => handleDateMouseEnter(dateStr)}
        className={`
          h-10 flex items-center justify-center rounded-lg cursor-pointer select-none transition-all
          ${isSelected 
            ? 'bg-neu-accent-primary text-white font-semibold shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)]' 
            : 'bg-neu-surface text-neu-text-primary hover:bg-neu-surface-light shadow-[2px_2px_5px_var(--neu-shadow-dark),-2px_-2px_5px_var(--neu-shadow-light)]'
          }
          ${isToday && !isSelected ? 'ring-2 ring-neu-accent-primary/40' : ''}
        `}
      >
        {day}
      </div>
    );
  }

  // Format display text
  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    
    if (value.length === 1) {
      return new Date(value[0]).toLocaleDateString();
    }

    // Show first and last date as range
    const sortedDates = [...value].sort();
    const sortedDatesLength = sortedDates.length;
    const firstDate = new Date(sortedDates[1]);
    const lastDate = new Date(sortedDates[sortedDatesLength-1]);
    lastDate.setDate(lastDate.getDate() + 1);
  
    return `${firstDate.toLocaleDateString()} - ${lastDate.toLocaleDateString()} (${value.length} days)`;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neu-text-primary mb-2">
          {label}
        </label>
      )}
      
      {/* Input Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="neu-input cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className={value.length === 0 ? 'text-neu-text-primary/40' : ''}>
            {getDisplayText()}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full min-w-[320px] neu-card-raised">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={previousMonth}
              className="neu-icon-btn"
            >
              <svg className="w-5 h-5 text-neu-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="text-neu-text-primary font-medium">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            
            <button
              onClick={nextMonth}
              className="neu-icon-btn"
            >
              <svg className="w-5 h-5 text-neu-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={goToToday}
              className="flex-1 neu-btn-small"
            >
              Today
            </button>
            {value.length > 0 && (
              <button
                onClick={clearAll}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-neu-accent-danger/20 text-neu-accent-danger hover:bg-neu-accent-danger/30 transition-colors border border-neu-accent-danger/30"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-xs text-neu-text-primary/60 font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {dayCells}
          </div>

          {/* Instructions */}
          {multiple===true && (
          <div className="mt-3 pt-3 border-t border-neu-border">
            <p className="text-xs text-neu-text-primary/60 text-center">
              Click and drag to select/deselect multiple dates
            </p>
          </div>
          )}

          {/* Selected Dates Summary */}
          {value.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neu-border">
              <p className="text-xs text-neu-text-primary/70 mb-2">
                Selected: {value.length} {value.length === 1 ? 'day' : 'days'}
              </p>
              <div className="max-h-32 overflow-y-auto flex flex-wrap gap-1">
                {value.slice(0, 10).map(dateStr => (
                  <span
                    key={dateStr}
                    className="neu-badge-accepted"
                  >
                    {new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                ))}
                {value.length > 10 && (
                  <span className="px-2 py-0.5 text-xs text-neu-text-primary/60">
                    +{value.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
