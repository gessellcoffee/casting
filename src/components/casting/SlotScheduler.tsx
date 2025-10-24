'use client';

import { useState, useRef, useEffect } from 'react';
import AddressInput from '@/components/ui/AddressInput';

interface SlotData {
  start_time: string;
  end_time: string;
  location: string;
  max_signups: number;
}

interface SlotSchedulerProps {
  slots: SlotData[];
  auditionDates?: string[]; // Date strings from audition details
  onUpdate: (slots: SlotData[]) => void;
  onNext: (slots: SlotData[]) => void;
  onBack: () => void;
}

interface TimeBlock {
  day: number; // 0-6 (Sun-Sat)
  hour: number; // 0-23
  minute: number; // 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
}

interface SelectedSlot {
  startBlock: TimeBlock;
  endBlock: TimeBlock;
  location: string;
  max_signups: number;
}

export default function SlotScheduler({
  slots,
  auditionDates = [],
  onUpdate,
  onNext,
  onBack,
}: SlotSchedulerProps) {
  const [localSlots, setLocalSlots] = useState<SlotData[]>(
    slots.length > 0 ? slots : []
  );
  const [error, setError] = useState<string | null>(null);
  
  // Sync localSlots with slots prop when it changes
  useEffect(() => {
    setLocalSlots(slots.length > 0 ? slots : []);
  }, [slots]);
  
  // Parse audition dates into Date objects
  // Audition dates are now stored as individual date strings (YYYY-MM-DD)
  // Parse as local dates to avoid timezone issues
  const availableDates = auditionDates.map(dateStr => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  });

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    // If we have audition dates, start with the first available date's week
    if (availableDates.length > 0) {
      const firstDate = new Date(availableDates[0]);
      const day = firstDate.getDay();
      const diff = firstDate.getDate() - day;
      return new Date(firstDate.setDate(diff));
    }
    // Otherwise, start with current week
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });
  
  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<TimeBlock | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<TimeBlock | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showMultiSlotModal, setShowMultiSlotModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Multi-slot generation
  const [slotDuration, setSlotDuration] = useState(30); // minutes
  const [bufferTime, setBufferTime] = useState(0); // minutes
  const [defaultLocation, setDefaultLocation] = useState('');
  const [defaultMaxSignups, setDefaultMaxSignups] = useState(1);

  // Helper functions
  const getDayDate = (dayOffset: number): Date => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayOffset);
    return date;
  };

  const isDateAvailable = (date: Date): boolean => {
    // If no audition dates specified, all dates are available
    if (availableDates.length === 0) return true;
    
    // Check if this date matches any available dates
    return availableDates.some(availableDate => {
      return (
        availableDate.getFullYear() === date.getFullYear() &&
        availableDate.getMonth() === date.getMonth() &&
        availableDate.getDate() === date.getDate()
      );
    });
  };

  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const timeBlockToDate = (block: TimeBlock): Date => {
    const date = getDayDate(block.day);
    date.setHours(block.hour, block.minute, 0, 0);
    return date;
  };

  const isBlockSelected = (day: number, hour: number, minute: number): boolean => {
    if (!selectionStart || !selectionEnd) return false;

    const blockTime = day * 10000 + hour * 100 + minute;
    const startTime = selectionStart.day * 10000 + selectionStart.hour * 100 + selectionStart.minute;
    const endTime = selectionEnd.day * 10000 + selectionEnd.hour * 100 + selectionEnd.minute;

    const min = Math.min(startTime, endTime);
    const max = Math.max(startTime, endTime);

    return blockTime >= min && blockTime <= max;
  };

  const isBlockInSlot = (day: number, hour: number, minute: number): boolean => {
    const blockDate = getDayDate(day);
    blockDate.setHours(hour, minute, 0, 0);

    return localSlots.some(slot => {
      const slotStart = new Date(slot.start_time);
      const slotEnd = new Date(slot.end_time);
      return blockDate >= slotStart && blockDate < slotEnd;
    });
  };

  const getSlotAtBlock = (day: number, hour: number, minute: number): SlotData | null => {
    const blockDate = getDayDate(day);
    blockDate.setHours(hour, minute, 0, 0);

    const slot = localSlots.find(slot => {
      const slotStart = new Date(slot.start_time);
      return (
        slotStart.getTime() === blockDate.getTime()
      );
    });

    return slot || null;
  };

  const getSlotHeight = (slot: SlotData): number => {
    const start = new Date(slot.start_time);
    const end = new Date(slot.end_time);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    // Each 5-minute block is h-12 (48px), so calculate proportional height
    return (durationMinutes / 5) * 48;
  };

  const handleMouseDown = (day: number, hour: number, minute: number, e: React.MouseEvent) => {
    const dayDate = getDayDate(day);
    // Only allow selection on available dates
    if (!isDateAvailable(dayDate)) return;
    
    setIsSelecting(true);
    const block = { day, hour, minute };
    setSelectionStart(block);
    setSelectionEnd(block);
    
    // Set initial position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    console.log('MouseDown - Rect:', rect);
    setPopupPosition({ 
      x: rect.left + rect.width / 2, 
      y: rect.bottom 
    });
  };

  const handleMouseEnter = (day: number, hour: number, minute: number, e: React.MouseEvent) => {
    if (isSelecting && selectionStart) {
      setSelectionEnd({ day, hour, minute });
      // Update position as we drag - use currentTarget to get the cell div
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPopupPosition({ 
        x: rect.left + rect.width / 2, 
        y: rect.bottom 
      });
    }
  };

  const handleMouseUp = (day: number, hour: number, minute: number, e: React.MouseEvent) => {
    if (isSelecting && selectionStart && selectionEnd) {
      setIsSelecting(false);
      setShowSlotModal(true);
      
      // Scroll to bring the modal into view
      setTimeout(() => {
        const modalElement = document.querySelector('[data-modal="slot-modal"]');
        if (modalElement) {
          modalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const addSingleSlot = () => {
    if (!selectionStart || !selectionEnd) return;

    const startDate = timeBlockToDate(selectionStart);
    const endDate = timeBlockToDate(selectionEnd);

    // Ensure end is after start
    if (endDate <= startDate) {
      endDate.setMinutes(endDate.getMinutes() + 5);
    }

    const newSlot: SlotData = {
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      location: defaultLocation,
      max_signups: defaultMaxSignups,
    };

    setLocalSlots([...localSlots, newSlot]);
    clearSelection();
    setShowSlotModal(false);
  };

  const generateMultipleSlots = () => {
    if (!selectionStart || !selectionEnd || slotDuration <= 0) return;

    const startDate = timeBlockToDate(selectionStart);
    const endDate = timeBlockToDate(selectionEnd);

    // Ensure end is after start
    if (endDate <= startDate) {
      endDate.setMinutes(endDate.getMinutes() + 5);
    }

    const totalMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    // Calculate how many slots fit with buffer time included
    const slotWithBuffer = slotDuration + bufferTime;
    const numSlots = Math.floor(totalMinutes / slotWithBuffer);

    const newSlots: SlotData[] = [];
    let currentTime = new Date(startDate);

    for (let i = 0; i < numSlots; i++) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

      newSlots.push({
        start_time: slotStart.toISOString(),
        end_time: slotEnd.toISOString(),
        location: defaultLocation,
        max_signups: defaultMaxSignups,
      });

      // Move to next slot start (current slot end + buffer time)
      currentTime.setMinutes(currentTime.getMinutes() + slotWithBuffer);
    }

    setLocalSlots([...localSlots, ...newSlots]);
    clearSelection();
    setShowMultiSlotModal(false);
  };

  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
  };

  const removeSlot = (index: number) => {
    const updated = localSlots.filter((_, i) => i !== index);
    setLocalSlots(updated);
  };

  const clearAllSlots = () => {
    if (window.confirm('Are you sure you want to clear all slots?')) {
      setLocalSlots([]);
    }
  };

  const handleNext = () => {
    if (localSlots.length === 0) {
      setError('Please add at least one time slot');
      return;
    }

    onUpdate(localSlots);
    onNext(localSlots);
  };

  const changeWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeekStart(newDate);
  };

  // Generate time blocks (5-minute intervals)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">
          Schedule Audition Slots
        </h2>
        <p className="text-neu-text-primary/70 mb-2">
          Drag to select time blocks on the calendar below. You can create single slots or generate multiple slots automatically.
        </p>
        {availableDates.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-[#5a8ff5]/10 border border-neu-border-focus">
            <p className="text-sm text-neu-text-primary">
              📅 Only showing dates from your selected audition dates ({availableDates.length} {availableDates.length === 1 ? 'day' : 'days'} available)
            </p>
          </div>
        )}
      </div>

      {/* Default Settings */}
      <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border space-y-4">
        <h3 className="text-lg font-medium text-neu-text-primary">Default Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AddressInput
            label="Location"
            value={defaultLocation}
            onChange={(value) => setDefaultLocation(value)}
            placeholder="e.g., Studio A"
          />
          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              Max Signups
            </label>
            <input
              type="number"
              value={defaultMaxSignups}
              onChange={(e) => setDefaultMaxSignups(parseInt(e.target.value) || 1)}
              min="1"
              className="neu-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              Slot Duration
            </label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(parseInt(e.target.value))}
              className="neu-input"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              Buffer Time
            </label>
            <select
              value={bufferTime}
              onChange={(e) => setBufferTime(parseInt(e.target.value))}
              className="neu-input"
            >
              <option value={0}>No buffer</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-neu-text-primary/60">
          Buffer time adds a gap between consecutive slots when generating multiple slots.
        </p>
      </div>

      {/* Week Navigation */}
      <div className="neu-card-raised flex items-center justify-between">
        <button
          onClick={() => changeWeek(-1)}
          className="neu-button"
        >
          ← Previous Week
        </button>
        <div className="text-neu-text-primary font-medium">
          {currentWeekStart.toLocaleDateString()} - {getDayDate(6).toLocaleDateString()}
        </div>
        <button
          onClick={() => changeWeek(1)}
          className="neu-button"
        >
          Next Week →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="relative overflow-x-auto overflow-y-auto" style={{ maxHeight: '80vh' }}>
        <div className="inline-block min-w-full">
          {/* Sticky Header Row */}
          <div className="sticky top-0 z-30 text-black bg-(--neu-surface)">
            <div className="grid grid-cols-8 gap-px bg-neu-surface border-t border-x border-neu-border rounded-t-xl">
              <div className="bg-neu-surface p-2 text-center text-sm font-medium text-neu-text-primary">
                <div>Time</div>
                {localSlots.length > 0 && (
                  <button
                    onClick={clearAllSlots}
                    className="mt-1 text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                    title="Clear all slots"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {days.map((day, index) => {
                const dayDate = getDayDate(index);
                const isAvailable = isDateAvailable(dayDate);
                
                return (
                  <div 
                    key={day} 
                    className={`bg-neu-surface p-2 text-center ${!isAvailable ? 'opacity-40' : ''}`}
                  >
                    <div className="text-sm font-medium text-neu-text-primary">{day}</div>
                    <div className="text-xs text-neu-text-primary/60">
                      {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    {!isAvailable && (
                      <div className="text-[10px] text-red-400/60 mt-0.5">Unavailable</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Scrollable Grid Body */}
          <div className="grid grid-cols-8 gap-px bg-[#4a7bd9]/20 border-b border-x border-neu-border rounded-b-xl overflow-hidden">
            {/* Time Rows */}
            {hours.map((hour) =>
              minutes.map((minute) => (
                <>
                  {/* Time Label */}
                  <div key={`time-${hour}-${minute}`} className="bg-neu-surface/50 relative flex items-start justify-end pr-2">
                    <span className="absolute -top-2 right-2 text-xs text-neu-text-primary/60 px-1">
                      {formatTime(hour, minute)}
                    </span>
                  </div>

                  {/* Day Cells */}
                  {days.map((_, dayIndex) => {
                    const dayDate = getDayDate(dayIndex);
                    const isAvailable = isDateAvailable(dayDate);
                    const isSelected = isBlockSelected(dayIndex, hour, minute);
                    const hasSlot = isBlockInSlot(dayIndex, hour, minute);
                    const slotAtBlock = getSlotAtBlock(dayIndex, hour, minute);

                    return (
                      <div
                        key={`cell-${dayIndex}-${hour}-${minute}`}
                        data-cell={`${dayIndex}-${hour}-${minute}`}
                        onMouseDown={(e) => handleMouseDown(dayIndex, hour, minute, e)}
                        onMouseEnter={(e) => handleMouseEnter(dayIndex, hour, minute, e)}
                        onMouseUp={(e) => handleMouseUp(dayIndex, hour, minute, e)}
                        className={`h-12 transition-colors relative ${
                          !isAvailable
                            ? 'bg-[#1e2e4e]/50 cursor-not-allowed opacity-40'
                            : hasSlot && !slotAtBlock
                            ? ' cursor-pointer border border-black'
                            : isSelected
                            ? 'bg-[#5a8ff5]/20 border border-black cursor-pointer'
                            : 'bg-neu-surface/30 hover:bg-neu-surface/60 cursor-pointer'
                        }`}
                      >
                        {slotAtBlock && (
                          <div
                            className="absolute inset-0 rounded-md border border-black overflow-hidden group cursor-pointer transition-all z-10 shadow-[2px_2px_4px_var(--neu-shadow-dark),-2px_-2px_4px_var(--neu-shadow-light)] hover:shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px_4px_var(--neu-shadow-light)]"
                            style={{ height: `${getSlotHeight(slotAtBlock)}px` }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const slotIndex = localSlots.findIndex(s => s.start_time === slotAtBlock.start_time);
                                if (slotIndex !== -1) {
                                  removeSlot(slotIndex);
                                }
                              }}
                              className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-sm text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-red-400/30"
                              title="Remove slot"
                            >
                              ×
                            </button>
                            <div className="p-1 text-neu-text-primary text-[10px] leading-tight">
                              <div className="font-semibold text-neu-accent-primary">
                                {new Date(slotAtBlock.start_time).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </div>
                              <div className="text-[9px] text-neu-text-primary/70">
                                {(() => {
                                  const start = new Date(slotAtBlock.start_time);
                                  const end = new Date(slotAtBlock.end_time);
                                  const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                                  return `${duration}min`;
                                })()}
                              </div>
                              {slotAtBlock.location && (
                                <div className="text-[9px] text-neu-text-primary/60 truncate">
                                  📍 {slotAtBlock.location}
                                </div>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-[#5a8ff5]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Scheduled Slots List */}
      {localSlots.length > 0 && (
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border">
          <h3 className="text-lg font-medium text-neu-text-primary mb-3">
            Scheduled Slots ({localSlots.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {localSlots.map((slot, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-neu-surface/50 text-sm"
              >
                <div className="text-neu-text-primary">
                  <div className="font-medium">
                    {new Date(slot.start_time).toLocaleString()} - {new Date(slot.end_time).toLocaleTimeString()}
                  </div>
                  {slot.location && (
                    <div className="text-neu-text-primary/60 text-xs">{slot.location}</div>
                  )}
                  <div className="text-neu-text-primary/60 text-xs">Max: {slot.max_signups}</div>
                </div>
                <button
                  onClick={() => removeSlot(index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Single Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            data-modal="slot-modal"
            className="neu-card-raised p-6 rounded-xl border border-neu-border max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-semibold text-neu-text-primary mb-4">Add Time Slot</h3>
            <div className="p-4">
              {selectionStart && selectionEnd && (
                <div className="mb-4">
                  <div className="text-sm text-neu-text-primary/70 mb-3">
                    <span className="font-medium text-neu-text-primary">Date:</span> {getDayDate(selectionStart.day).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  
                  {/* Time Range Selectors */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-neu-text-primary mb-2">Start Time</label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={selectionStart.hour}
                          onChange={(e) => setSelectionStart({ ...selectionStart, hour: parseInt(e.target.value) })}
                          className="px-3 py-2 rounded-lg bg-neu-surface border border-neu-border neu-input text-neu-text-primary focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all text-sm"
                        >
                          {hours.map(h => (
                            <option key={h} value={h}>{formatTime(h, 0).split(':')[0] + (h >= 12 ? ' PM' : ' AM')}</option>
                          ))}
                        </select>
                        <select
                          value={selectionStart.minute}
                          onChange={(e) => setSelectionStart({ ...selectionStart, minute: parseInt(e.target.value) })}
                          className="neu-input px-3 py-2 rounded-lg bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all text-sm"
                        >
                          {minutes.map(m => (
                            <option key={m} value={m}>:{m.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neu-text-primary mb-2">End Time</label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={selectionEnd.hour}
                          onChange={(e) => setSelectionEnd({ ...selectionEnd, hour: parseInt(e.target.value) })}
                          className="neu-input px-3 py-2 rounded-lg bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all text-sm"
                        >
                          {hours.map(h => (
                            <option key={h} value={h}>{formatTime(h, 0).split(':')[0] + (h >= 12 ? ' PM' : ' AM')}</option>
                          ))}
                        </select>
                        <select
                          value={selectionEnd.minute}
                          onChange={(e) => setSelectionEnd({ ...selectionEnd, minute: parseInt(e.target.value) })}
                          className="neu-input px-3 py-2 rounded-lg bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all text-sm"
                        >
                          {minutes.map(m => (
                            <option key={m} value={m}>:{m.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  onClick={addSingleSlot}
                  className="n-button-primary w-full px-4 py-2 rounded-lg bg-[#5a8ff5] text-white hover:bg-[#4a7bd9] transition-colors text-sm font-medium"
                >
                  Add Single Slot
                </button>
                <button
                  onClick={() => {
                    setShowSlotModal(false);
                    setShowMultiSlotModal(true);
                  }}
                  className="n-button-secondary w-full px-4 py-2 rounded-lg bg-neu-surface text-neu-text-primary hover:bg-[#3e4e6e] transition-colors text-sm"
                >
                  Generate Multiple Slots
                </button>
                <button
                  onClick={() => {
                    setShowSlotModal(false);
                    clearSelection();
                  }}
                  className="n-button-secondary w-full px-4 py-2 rounded-lg bg-neu-surface text-neu-text-primary hover:bg-[#3e4e6e] transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Slot Modal */}
      {showMultiSlotModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="neu-card-raised p-6 rounded-xl border border-neu-border max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-neu-text-primary mb-4">Generate Multiple Slots</h3>
            
            {/* Time Range Selectors */}
            {selectionStart && selectionEnd && (
              <div className="mb-4">
                <div className="text-sm text-neu-text-primary/70 mb-3">
                  <span className="font-medium text-neu-text-primary">Date:</span> {getDayDate(selectionStart.day).toLocaleDateString()}
                </div>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-neu-text-primary mb-2">Start Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectionStart.hour}
                        onChange={(e) => setSelectionStart({ ...selectionStart, hour: parseInt(e.target.value) })}
                        className="px-3 py-2 rounded-lg bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all text-sm"
                      >
                        {hours.map(h => (
                          <option key={h} value={h}>{formatTime(h, 0).split(':')[0] + (h >= 12 ? ' PM' : ' AM')}</option>
                        ))}
                      </select>
                      <select
                        value={selectionStart.minute}
                        onChange={(e) => setSelectionStart({ ...selectionStart, minute: parseInt(e.target.value) })}
                        className="px-3 py-2 rounded-lg bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all text-sm"
                      >
                        {minutes.map(m => (
                          <option key={m} value={m}>:{m.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neu-text-primary mb-2">End Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectionEnd.hour}
                        onChange={(e) => setSelectionEnd({ ...selectionEnd, hour: parseInt(e.target.value) })}
                        className="px-3 py-2 rounded-lg bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all text-sm"
                      >
                        {hours.map(h => (
                          <option key={h} value={h}>{formatTime(h, 0).split(':')[0] + (h >= 12 ? ' PM' : ' AM')}</option>
                        ))}
                      </select>
                      <select
                        value={selectionEnd.minute}
                        onChange={(e) => setSelectionEnd({ ...selectionEnd, minute: parseInt(e.target.value) })}
                        className="px-3 py-2 rounded-lg bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all text-sm"
                      >
                        {minutes.map(m => (
                          <option key={m} value={m}>:{m.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Editable Inputs */}
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neu-text-primary mb-2">
                  Slot Duration (minutes)
                </label>
                <input
                  type="number"
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="w-full px-4 py-2 rounded-xl bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-text-primary mb-2">
                  Buffer Time (minutes)
                </label>
                <input
                  type="number"
                  value={bufferTime}
                  onChange={(e) => setBufferTime(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  className="w-full px-4 py-2 rounded-xl bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="mb-4 p-3 rounded-lg bg-[#5a8ff5]/10 border border-neu-border-focus">
              {selectionStart && selectionEnd && (
                <>
                  <div className="text-sm text-neu-text-primary">
                    <span className="font-semibold text-neu-accent-primary">
                      {Math.floor(((timeBlockToDate(selectionEnd).getTime() - timeBlockToDate(selectionStart).getTime()) / (1000 * 60)) / (slotDuration + bufferTime))} slots
                    </span>
                    {' '}will be created
                  </div>
                  {bufferTime > 0 && (
                    <div className="text-xs text-neu-text-primary/70 mt-1">
                      {slotDuration}min slot + {bufferTime}min buffer = {slotDuration + bufferTime}min per slot
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={generateMultipleSlots}
                className="n-button-primary flex-1 px-4 py-2 rounded-xl bg-[#5a8ff5] text-white hover:bg-[#4a7bd9] transition-colors"
              >
                Generate Slots
              </button>
              <button
                onClick={() => {
                  setShowMultiSlotModal(false);
                  clearSelection();
                }}
                className="n-button-secondary px-4 py-2 rounded-xl bg-neu-surface text-neu-text-primary hover:bg-[#3e4e6e] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-neu-surface text-neu-text-primary border border-neu-border shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--neu-shadow-dark),inset_-5px_-5px_10px_var(--neu-shadow-light)] hover:text-neu-accent-primary hover:border-neu-border-focus transition-all duration-300 font-medium"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-xl bg-neu-surface text-neu-text-primary border border-neu-border shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--neu-shadow-dark),inset_-5px_-5px_10px_var(--neu-shadow-light)] hover:text-neu-accent-primary hover:border-neu-border-focus transition-all duration-300 font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
}
