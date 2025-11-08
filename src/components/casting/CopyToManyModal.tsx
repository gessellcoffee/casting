'use client';

import { useState } from 'react';
import { formatUSDate } from '@/lib/utils/dateUtils';
import Button from '../Button';

interface CopyToManyModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDates: Date[];
  sourceDayDate: Date;
  onConfirm: (selectedDates: Date[]) => void;
}

export default function CopyToManyModal({
  isOpen,
  onClose,
  availableDates,
  sourceDayDate,
  onConfirm,
}: CopyToManyModalProps) {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  // Filter out the source date from available dates
  const selectableDates = availableDates.filter(date => {
    return !(
      date.getFullYear() === sourceDayDate.getFullYear() &&
      date.getMonth() === sourceDayDate.getMonth() &&
      date.getDate() === sourceDayDate.getDate()
    );
  });

  const toggleDate = (dateStr: string) => {
    const newSelected = new Set(selectedDates);
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    setSelectedDates(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDates.size === selectableDates.length) {
      setSelectedDates(new Set());
    } else {
      setSelectedDates(new Set(selectableDates.map(d => d.toISOString())));
    }
  };

  const handleConfirm = () => {
    const dates = selectableDates.filter(d => selectedDates.has(d.toISOString()));
    onConfirm(dates);
  };

  return (
    <div className="neu-modal-overlay" onClick={onClose}>
      <div 
        className="neu-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-neu-text-primary mb-4">
          Copy Slots to Multiple Days
        </h3>

        <div className="mb-4 neu-info-box">
          <p className="text-sm text-neu-text-primary">
            <span className="font-medium">Source Day:</span> {formatUSDate(sourceDayDate)}
          </p>
        </div>

        <p className="text-sm text-neu-text-primary/70 mb-4">
          Select the days you want to copy slots to:
        </p>

        {/* Select All Toggle */}
        <div className="mb-3 pb-3 border-b border-neu-border">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-neu-surface/50 p-2 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={selectedDates.size === selectableDates.length && selectableDates.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-neu-border text-neu-accent-primary focus:ring-2 focus:ring-neu-accent-primary/20"
            />
            <span className="text-sm font-medium text-neu-text-primary">
              Select All ({selectableDates.length} days)
            </span>
          </label>
        </div>

        {/* Date Checkboxes */}
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {selectableDates.length === 0 ? (
            <p className="text-sm text-neu-text-primary/60 text-center py-4">
              No other audition dates available
            </p>
          ) : (
            selectableDates.map((date) => {
              const dateStr = date.toISOString();
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              
              return (
                <label
                  key={dateStr}
                  className="flex items-center gap-3 cursor-pointer hover:bg-neu-surface/50 p-3 rounded-lg transition-colors border border-neu-border"
                >
                  <input
                    type="checkbox"
                    checked={selectedDates.has(dateStr)}
                    onChange={() => toggleDate(dateStr)}
                    className="w-4 h-4 rounded border-neu-border text-neu-accent-primary focus:ring-2 focus:ring-neu-accent-primary/20"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neu-text-primary">
                      {dayName}, {formatUSDate(date)}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onClose}
            variant="secondary"
            text="Cancel"
          />
          <Button
            onClick={handleConfirm}
            disabled={selectedDates.size === 0}
            variant="primary"
            text= {`Continue (${selectedDates.size})`}
          />
        </div>
      </div>
    </div>
  );
}
