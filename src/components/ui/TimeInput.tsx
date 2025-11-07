'use client';

import { useState, useRef, useEffect } from 'react';
import { MdAccessTime, MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/md';

interface TimeInputProps {
  value: string; // HH:MM format
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  quickSelectTimes?: string[]; // Optional custom quick select times in HH:MM format
}

export default function TimeInput({
  value,
  onChange,
  label,
  placeholder = 'Select time',
  required = false,
  disabled = false,
  quickSelectTimes,
}: TimeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse the value when it changes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const hour = parseInt(h, 10);
      const minute = parseInt(m, 10);
      
      if (hour === 0) {
        setHours('12');
        setPeriod('AM');
      } else if (hour < 12) {
        setHours(hour.toString());
        setPeriod('AM');
      } else if (hour === 12) {
        setHours('12');
        setPeriod('PM');
      } else {
        setHours((hour - 12).toString());
        setPeriod('PM');
      }
      
      setMinutes(minute.toString().padStart(2, '0'));
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayTime = () => {
    if (!value) return placeholder;
    const h = hours.padStart(2, '0');
    const m = minutes.padStart(2, '0');
    return `${h}:${m} ${period}`;
  };

  const updateTime = (newHours: string, newMinutes: string, newPeriod: 'AM' | 'PM') => {
    let hour24 = parseInt(newHours, 10);
    
    if (newPeriod === 'AM') {
      if (hour24 === 12) hour24 = 0;
    } else {
      if (hour24 !== 12) hour24 += 12;
    }
    
    const timeString = `${hour24.toString().padStart(2, '0')}:${newMinutes.padStart(2, '0')}`;
    onChange(timeString);
  };

  const incrementHours = () => {
    const newHours = hours === '12' ? '1' : (parseInt(hours, 10) + 1).toString();
    setHours(newHours);
    updateTime(newHours, minutes, period);
  };

  const decrementHours = () => {
    const newHours = hours === '1' ? '12' : (parseInt(hours, 10) - 1).toString();
    setHours(newHours);
    updateTime(newHours, minutes, period);
  };

  const incrementMinutes = () => {
    const newMinutes = ((parseInt(minutes, 10) + 5) % 60).toString().padStart(2, '0');
    setMinutes(newMinutes);
    updateTime(hours, newMinutes, period);
  };

  const decrementMinutes = () => {
    const currentMin = parseInt(minutes, 10);
    const newMinutes = (currentMin - 5 < 0 ? 55 : currentMin - 5).toString().padStart(2, '0');
    setMinutes(newMinutes);
    updateTime(hours, newMinutes, period);
  };

  const togglePeriod = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    setPeriod(newPeriod);
    updateTime(hours, minutes, newPeriod);
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-neu-text-secondary mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Input Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          neu-input w-full text-left flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-2">
          <MdAccessTime className="w-5 h-5 text-neu-accent-primary" />
          <span className={value ? 'text-neu-text-primary' : 'text-neu-text-secondary'}>
            {formatDisplayTime()}
          </span>
        </div>
      </button>

      {/* Dropdown Picker */}
      {isOpen && (
        <div className="absolute z-50 mt-2 neu-card-raised p-4 bg-neu-surface min-w-[280px]">
          <div className="flex items-center justify-center gap-4">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementHours}
                className="p-2 hover:bg-neu-surface-light rounded-lg transition-colors"
              >
                <MdKeyboardArrowUp className="w-6 h-6 text-neu-text-secondary" />
              </button>
              <div className="neu-card-inset px-4 py-3 min-w-[60px] text-center">
                <span className="text-2xl font-bold text-neu-text-primary">{hours.padStart(2, '0')}</span>
              </div>
              <button
                type="button"
                onClick={decrementHours}
                className="p-2 hover:bg-neu-surface-light rounded-lg transition-colors"
              >
                <MdKeyboardArrowDown className="w-6 h-6 text-neu-text-secondary" />
              </button>
            </div>

            <span className="text-2xl font-bold text-neu-text-secondary">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementMinutes}
                className="p-2 hover:bg-neu-surface-light rounded-lg transition-colors"
              >
                <MdKeyboardArrowUp className="w-6 h-6 text-neu-text-secondary" />
              </button>
              <div className="neu-card-inset px-4 py-3 min-w-[60px] text-center">
                <span className="text-2xl font-bold text-neu-text-primary">{minutes}</span>
              </div>
              <button
                type="button"
                onClick={decrementMinutes}
                className="p-2 hover:bg-neu-surface-light rounded-lg transition-colors"
              >
                <MdKeyboardArrowDown className="w-6 h-6 text-neu-text-secondary" />
              </button>
            </div>

            {/* AM/PM */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={togglePeriod}
                className="neu-button-secondary px-4 py-2 text-sm font-medium"
              >
                {period}
              </button>
            </div>
          </div>

          {/* Quick Select Times */}
          {quickSelectTimes && quickSelectTimes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neu-border">
              <div className="text-xs text-neu-text-secondary mb-2">Quick Select</div>
              <div className="grid grid-cols-3 gap-2">
                {quickSelectTimes.map((time) => {
                  const [h, m] = time.split(':');
                  const hour = parseInt(h, 10);
                  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                  const displayPeriod = hour >= 12 ? 'PM' : 'AM';
                  
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        onChange(time);
                        setIsOpen(false);
                      }}
                      className="neu-button-secondary text-xs py-2"
                    >
                      {displayHour}:{m} {displayPeriod}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Done Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="neu-button-primary w-full mt-4"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
