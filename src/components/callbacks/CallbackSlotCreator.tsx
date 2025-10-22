'use client';

import { useState } from 'react';
import { createCallbackSlots } from '@/lib/supabase/callbackSlots';
import type { CallbackSlotInsert } from '@/lib/supabase/types';
import DateArrayInput from '@/components/ui/DateArrayInput';
import AddressInput from '@/components/ui/AddressInput';

interface CallbackSlotCreatorProps {
  auditionId: string;
  existingSlots: any[];
  onSlotsCreated: () => void;
  onCancel: () => void;
}

interface SlotForm {
  dates: string[]; // Using array for DateArrayInput compatibility
  startTime: string;
  endTime: string;
  location: string;
  maxSignups: number;
  notes: string;
}

export default function CallbackSlotCreator({
  auditionId,
  existingSlots,
  onSlotsCreated,
  onCancel,
}: CallbackSlotCreatorProps) {
  const [slots, setSlots] = useState<SlotForm[]>([
    {
      dates: [],
      startTime: '10:00',
      endTime: '11:00',
      location: '',
      maxSignups: 5,
      notes: '',
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSlot = () => {
    const lastSlot = slots[slots.length - 1];
    setSlots([
      ...slots,
      {
        dates: [],
        startTime: lastSlot?.startTime || '10:00',
        endTime: lastSlot?.endTime || '11:00',
        location: lastSlot?.location || '',
        maxSignups: 5,
        notes: '',
      },
    ]);
  };

  const removeSlot = (index: number) => {
    if (slots.length === 1) return;
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof SlotForm, value: string | number) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const validateSlots = (): boolean => {
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot.dates || slot.dates.length === 0) {
        setError(`Slot ${i + 1}: Please select a date`);
        return false;
      }

      if (!slot.startTime || !slot.endTime) {
        setError(`Slot ${i + 1}: Please fill in start time and end time`);
        return false;
      }

      const startDateTime = new Date(`${slot.dates[0]}T${slot.startTime}`);
      const endDateTime = new Date(`${slot.dates[0]}T${slot.endTime}`);

      if (endDateTime <= startDateTime) {
        setError(`Slot ${i + 1}: End time must be after start time`);
        return false;
      }

      if (slot.maxSignups < 1) {
        setError(`Slot ${i + 1}: Max signups must be at least 1`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateSlots()) {
      return;
    }

    setSaving(true);

    try {
      // Convert form data to callback slot inserts
      const slotsToCreate: CallbackSlotInsert[] = slots.map(slot => ({
        audition_id: auditionId,
        start_time: new Date(`${slot.dates[0]}T${slot.startTime}`).toISOString(),
        end_time: new Date(`${slot.dates[0]}T${slot.endTime}`).toISOString(),
        location: slot.location || null,
        max_signups: slot.maxSignups,
        notes: slot.notes || null,
      }));

      const { error: createError } = await createCallbackSlots(slotsToCreate);

      if (createError) {
        throw createError;
      }

      onSlotsCreated();
    } catch (err: any) {
      console.error('Error creating callback slots:', err);
      setError(err.message || 'Failed to create callback slots');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]">
        <h2 className="text-2xl font-bold text-[#c5ddff] mb-2">Create Callback Slots</h2>
        <p className="text-[#c5ddff]/70 mb-6">
          Set up time slots for callbacks. You can create multiple slots for different dates or times.
        </p>

        {/* Existing Slots Summary */}
        {existingSlots.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-[#1e2e4e]/50 border border-[#4a7bd9]/20 shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
            <h3 className="text-sm font-semibold text-[#c5ddff] mb-2">
              Existing Callback Slots ({existingSlots.length})
            </h3>
            <div className="space-y-2">
              {existingSlots.map((slot, index) => (
                <div key={slot.callback_slot_id} className="text-sm text-[#c5ddff]/70">
                  {new Date(slot.start_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  {new Date(slot.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  - {new Date(slot.end_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {slot.location && ` • ${slot.location}`}
                  {' • Max: '}{slot.max_signups} actor{slot.max_signups !== 1 ? 's' : ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 shadow-[inset_2px_2px_5px_rgba(239,68,68,0.1)]">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {slots.map((slot, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-[#1e2e4e]/50 border border-[#4a7bd9]/20 space-y-4 shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-[#c5ddff]">
                  Slot {index + 1}
                </h3>
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Date Selection */}
              <div className="mb-4">
                <DateArrayInput
                  value={slot.dates}
                  onChange={(dates) => {
                    const newSlots = [...slots];
                    newSlots[index] = { ...newSlots[index], dates: dates.slice(0, 1) }; // Only keep first date
                    setSlots(newSlots);
                  }}
                  label="Callback Date *"
                  placeholder="Click to select a date..."
                />
                {slot.dates.length > 0 && (
                  <p className="text-xs text-[#c5ddff]/50 mt-1">
                    Selected: {new Date(slot.dates[0]).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-[#c5ddff] mb-2">
                    Start Time *
                  </label>
                  <select
                    value={slot.startTime}
                    onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] focus:outline-none focus:border-[#5a8ff5] shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
                  >
                    {Array.from({ length: 48 }, (_, i) => {
                      const hour = Math.floor(i / 2);
                      const minute = i % 2 === 0 ? '00' : '30';
                      const time24 = `${String(hour).padStart(2, '0')}:${minute}`;
                      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      const ampm = hour < 12 ? 'AM' : 'PM';
                      const time12 = `${hour12}:${minute} ${ampm}`;
                      return (
                        <option key={time24} value={time24}>
                          {time12}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-[#c5ddff] mb-2">
                    End Time *
                  </label>
                  <select
                    value={slot.endTime}
                    onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] focus:outline-none focus:border-[#5a8ff5] shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
                  >
                    {Array.from({ length: 48 }, (_, i) => {
                      const hour = Math.floor(i / 2);
                      const minute = i % 2 === 0 ? '00' : '30';
                      const time24 = `${String(hour).padStart(2, '0')}:${minute}`;
                      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      const ampm = hour < 12 ? 'AM' : 'PM';
                      const time12 = `${hour12}:${minute} ${ampm}`;
                      return (
                        <option key={time24} value={time24}>
                          {time12}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="mb-4">
                <AddressInput
                  value={slot.location}
                  onChange={(value) => updateSlot(index, 'location', value)}
                  label="Callback Location"
                  placeholder="Enter address or venue name..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Max Signups */}
                <div>
                  <label className="block text-sm font-medium text-[#c5ddff] mb-2">
                    Max Actors per Slot *
                  </label>
                  <input
                    type="number"
                    value={slot.maxSignups}
                    onChange={(e) => updateSlot(index, 'maxSignups', parseInt(e.target.value) || 1)}
                    min="1"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] focus:outline-none focus:border-[#5a8ff5] shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
                  />
                  <p className="text-xs text-[#c5ddff]/50 mt-1">
                    How many actors can be invited to this slot
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#c5ddff] mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={slot.notes}
                  onChange={(e) => updateSlot(index, 'notes', e.target.value)}
                  placeholder="e.g., Bring sheet music, Wear comfortable clothing for movement"
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] placeholder-[#c5ddff]/30 focus:outline-none focus:border-[#5a8ff5] resize-none shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
                />
              </div>
            </div>
          ))}

          {/* Add Another Slot Button */}
          <button
            type="button"
            onClick={addSlot}
            className="w-full py-3 rounded-lg border-2 border-dashed border-[#4a7bd9]/30 text-[#5a8ff5] hover:border-[#5a8ff5]/50 hover:bg-[#2e3e5e]/30 transition-all hover:shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
          >
            + Add Another Slot
          </button>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="n-button-secondary flex-1 px-6 py-3 rounded-lg border border-[#4a7bd9]/20 text-[#c5ddff] hover:bg-[#2e3e5e]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="n-button-primary flex-1 px-6 py-3 rounded-lg bg-[#5a8ff5] text-white hover:bg-[#4a7bd9] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]"
            >
              {saving ? 'Creating Slots...' : `Create ${slots.length} Slot${slots.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
