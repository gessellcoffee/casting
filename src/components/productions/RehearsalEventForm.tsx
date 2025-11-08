'use client';

import { useState } from 'react';
import { createRehearsalEvent } from '@/lib/supabase/rehearsalEvents';
import Button from '@/components/Button';
import DateArrayInput from '@/components/ui/DateArrayInput';
import AddressInput from '@/components/ui/AddressInput';
import { MdClose } from 'react-icons/md';

interface RehearsalEventFormProps {
  auditionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RehearsalEventForm({
  auditionId,
  onSuccess,
  onCancel,
}: RehearsalEventFormProps) {
  const [dates, setDates] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    location: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (dates.length === 0) {
      setError('Please select at least one date');
      return;
    }
    if (!formData.start_time || !formData.end_time) {
      setError('Please fill in start and end times');
      return;
    }

    setSaving(true);

    // Create a rehearsal event for each selected date
    const promises = dates.map(date =>
      createRehearsalEvent({
        audition_id: auditionId,
        date: date,
        start_time: formData.start_time + ':00', // Add seconds
        end_time: formData.end_time + ':00', // Add seconds
        location: formData.location || undefined,
        notes: formData.notes || undefined,
      })
    );

    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);

    setSaving(false);

    if (errors.length > 0) {
      setError(`Failed to create ${errors.length} of ${dates.length} rehearsal events`);
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="neu-card-raised max-w-2xl w-full p-6"
        style={{
          background: 'var(--neu-surface)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neu-text-primary">
            Add Rehearsal Event
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
          {/* Dates */}
          <div>
            <DateArrayInput
              value={dates}
              onChange={setDates}
              label="Rehearsal Dates *"
              placeholder="Select one or more dates..."
              multiple={true}
            />
            <p className="text-xs text-neu-text-secondary mt-1">
              Select multiple dates to create rehearsals with the same time and location
            </p>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neu-text-secondary mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="neu-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neu-text-secondary mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="neu-input w-full"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <AddressInput
              value={formData.location}
              onChange={(value) => setFormData({ ...formData, location: value })}
              label="Location"
              placeholder="Rehearsal space, theater, etc."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neu-text-secondary mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="neu-input w-full"
              rows={4}
              placeholder="Any additional information about this rehearsal..."
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
            <button
              type="submit"
              disabled={saving}
              className="neu-button-primary"
            >
              {saving 
                ? `Creating ${dates.length} event${dates.length !== 1 ? 's' : ''}...` 
                : `Add ${dates.length} Rehearsal${dates.length !== 1 ? 's' : ''}`
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
