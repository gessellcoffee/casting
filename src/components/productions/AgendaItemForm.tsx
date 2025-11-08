'use client';

import { useState } from 'react';
import { createAgendaItem, updateAgendaItem } from '@/lib/supabase/agendaItems';
import Button from '@/components/Button';
import TimeInput from '@/components/ui/TimeInput';
import { MdClose } from 'react-icons/md';

interface AgendaItemFormProps {
  rehearsalEventId: string;
  rehearsalStartTime: string; // Rehearsal event start time for validation
  rehearsalEndTime: string; // Rehearsal event end time for validation
  existingItem?: {
    rehearsal_agenda_items_id: string;
    title: string;
    description?: string | null;
    start_time: string;
    end_time: string;
  };
  nextOrderIndex: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AgendaItemForm({
  rehearsalEventId,
  rehearsalStartTime,
  rehearsalEndTime,
  existingItem,
  nextOrderIndex,
  onSuccess,
  onCancel,
}: AgendaItemFormProps) {
  const [formData, setFormData] = useState({
    title: existingItem?.title || '',
    description: existingItem?.description || '',
    start_time: existingItem?.start_time || '',
    end_time: existingItem?.end_time || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert time string to minutes for comparison
  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper to convert minutes back to HH:MM format
  const minutesToTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Generate smart quick select times based on rehearsal timeframe
  const generateQuickSelectTimes = (): string[] => {
    const startMinutes = timeToMinutes(rehearsalStartTime);
    const endMinutes = timeToMinutes(rehearsalEndTime);
    const times: string[] = [];
    
    // Add rehearsal start time
    times.push(rehearsalStartTime);
    
    // Generate times in 30-minute increments
    let current = startMinutes + 30;
    while (current < endMinutes) {
      times.push(minutesToTime(current));
      current += 30;
    }
    
    // Add rehearsal end time if not already included
    if (times[times.length - 1] !== rehearsalEndTime) {
      times.push(rehearsalEndTime);
    }
    
    return times;
  };

  const quickSelectTimes = generateQuickSelectTimes();

  // Helper to format time for display in error messages
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      setError('Please select both start and end times');
      return;
    }

    // Validate times are within rehearsal event timeframe
    const rehearsalStart = timeToMinutes(rehearsalStartTime);
    const rehearsalEnd = timeToMinutes(rehearsalEndTime);
    const itemStart = timeToMinutes(formData.start_time);
    const itemEnd = timeToMinutes(formData.end_time);

    if (itemStart < rehearsalStart || itemStart > rehearsalEnd) {
      setError(`Start time must be between ${formatTime(rehearsalStartTime)} and ${formatTime(rehearsalEndTime)}`);
      return;
    }

    if (itemEnd < rehearsalStart || itemEnd > rehearsalEnd) {
      setError(`End time must be between ${formatTime(rehearsalStartTime)} and ${formatTime(rehearsalEndTime)}`);
      return;
    }

    if (itemEnd <= itemStart) {
      setError('End time must be after start time');
      return;
    }

    setSaving(true);

    let result;
    if (existingItem) {
      // Update existing item
      result = await updateAgendaItem(existingItem.rehearsal_agenda_items_id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        start_time: formData.start_time.trim(),
        end_time: formData.end_time.trim(),
      });
    } else {
      // Create new item
      result = await createAgendaItem({
        rehearsal_event_id: rehearsalEventId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        start_time: formData.start_time.trim(),
        end_time: formData.end_time.trim(),
      });
    }

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    onSuccess();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="neu-card-raised max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--neu-surface)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neu-text-primary">
            {existingItem ? 'Edit Agenda Item' : 'Add Agenda Item'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-neu-surface-light transition-colors"
          >
            <MdClose className="w-6 h-6 text-neu-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neu-text-secondary mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="neu-input w-full"
              placeholder="e.g., Scene 1, Song: Defying Gravity"
              required
            />
          </div>

          {/* Time Range */}
          <div>
            <div className="grid grid-cols-2 gap-4">
              <TimeInput
                value={formData.start_time}
                onChange={(value) => setFormData({ ...formData, start_time: value })}
                label="Start Time"
                placeholder="Select start time"
                required
                quickSelectTimes={quickSelectTimes}
              />
              <TimeInput
                value={formData.end_time}
                onChange={(value) => setFormData({ ...formData, end_time: value })}
                label="End Time"
                placeholder="Select end time"
                required
                quickSelectTimes={quickSelectTimes}
              />
            </div>
            <p className="text-xs text-neu-text-secondary mt-2">
              Times must be within rehearsal: {formatTime(rehearsalStartTime)} - {formatTime(rehearsalEndTime)}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neu-text-secondary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="neu-input w-full"
              rows={3}
              placeholder="Notes about this agenda item..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              onClick={onCancel}
              text="Cancel"
              className="neu-button-secondary"
              disabled={saving}
            />
            <Button
              type="submit"
              disabled={saving}
              className="neu-button-primary"
              text={saving ? 'Saving...' : existingItem ? 'Update Item' : 'Add Item'}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
