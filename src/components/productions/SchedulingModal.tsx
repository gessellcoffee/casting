'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Button from '@/components/Button';
import AddressInput from '@/components/ui/AddressInput';
import DateArrayInput from '@/components/ui/DateArrayInput';
import { formatUSDateWithFullWeekday } from '@/lib/utils/dateUtils';
import { createProductionEvent, createProductionEventType, createProductionEvents, getProductionEventTypes, setProductionEventAssignments } from '@/lib/supabase/productionEvents';
import { getCastMembers } from '@/lib/supabase/agendaItems';
import { createRehearsalEvent, createRehearsalEvents } from '@/lib/supabase/rehearsalEvents';

type Mode = 'production_event' | 'custom_type';

interface SchedulingModalProps {
  isOpen: boolean;
  auditionId: string;
  date: Date;
  onClose: () => void;
  onCreated: () => void;
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthKey(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  return `${year}-${month}`;
}

export default function SchedulingModal({
  isOpen,
  auditionId,
  date,
  onClose,
  onCreated,
}: SchedulingModalProps) {
  const [mode, setMode] = useState<Mode>('production_event');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [castMembers, setCastMembers] = useState<any[]>([]);

  const [form, setForm] = useState({
    production_event_type_id: '',
    start_time: '',
    end_time: '',
    location: '',
    notes: '',
    assignToEntireCast: true,
  });

  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const [customType, setCustomType] = useState({
    name: '',
    color: '#5a8ff5',
  });

  const dateLabel = useMemo(() => formatUSDateWithFullWeekday(date), [date]);

  useEffect(() => {
    if (!isOpen) return;

    setMode('production_event');
    setError(null);
    setForm(prev => ({
      ...prev,
      production_event_type_id: '',
      start_time: '',
      end_time: '',
      location: '',
      notes: '',
      assignToEntireCast: true,
    }));

    setSelectedDates([toISODate(date)]);

    void (async () => {
      const [types, cast] = await Promise.all([
        getProductionEventTypes(),
        getCastMembers(auditionId).then(r => r.data || []),
      ]);

      setEventTypes(types);
      setCastMembers(cast);

      const globalRehearsalType = types.find((t: any) => t.owner_user_id === null && t.name === 'Rehearsal');
      if (globalRehearsalType) {
        setForm(prev => ({ ...prev, production_event_type_id: globalRehearsalType.production_event_type_id }));
      } else if (types[0]) {
        setForm(prev => ({ ...prev, production_event_type_id: types[0].production_event_type_id }));
      }
    })();
  }, [isOpen, auditionId]);

  const selectedType = eventTypes.find((t: any) => t.production_event_type_id === form.production_event_type_id);
  const selectedTypeName = selectedType?.name;
  const isRehearsalType = selectedTypeName === 'Rehearsal';

  const handleDatesChange = (dates: string[]) => {
    if (dates.length === 0) {
      setSelectedDates([]);
      return;
    }

    const monthKey = getMonthKey(dates[0]);
    const filtered = dates.filter(d => getMonthKey(d) === monthKey);
    setSelectedDates(filtered);

    if (filtered.length !== dates.length) {
      setError('Please select dates within the same month.');
    } else {
      setError(null);
    }
  };

  const handleCreateCustomType = async () => {
    setLoading(true);
    setError(null);

    const name = customType.name.trim();
    if (!name) {
      setLoading(false);
      setError('Custom type name is required.');
      return;
    }

    const { data, error: createError } = await createProductionEventType({
      name,
      color: customType.color,
    });

    if (createError) {
      setLoading(false);
      setError(createError.message || 'Failed to create custom type.');
      return;
    }

    const types = await getProductionEventTypes();
    setEventTypes(types);
    if (data) {
      setForm(prev => ({ ...prev, production_event_type_id: data.production_event_type_id }));
    }

    setMode('production_event');
    setCustomType({ name: '', color: '#5a8ff5' });
    setLoading(false);
  };

  const handleCreateEvent = async () => {
    setLoading(true);
    setError(null);

    if (!form.production_event_type_id) {
      setLoading(false);
      setError('Event type is required.');
      return;
    }

    if (selectedDates.length === 0) {
      setLoading(false);
      setError('Please select at least one date.');
      return;
    }

    if (isRehearsalType) {
      if (!form.start_time || !form.end_time) {
        setLoading(false);
        setError('Start and end time are required for rehearsal events.');
        return;
      }
    }

    const start = form.start_time ? `${form.start_time}:00` : null;
    const end = form.end_time ? `${form.end_time}:00` : null;

    if (isRehearsalType) {
      const dates = selectedDates;

      if (dates.length === 1) {
        const { error: createError } = await createRehearsalEvent({
          audition_id: auditionId,
          date: dates[0],
          start_time: start as string,
          end_time: end as string,
          location: form.location || undefined,
          notes: form.notes || undefined,
        });

        if (createError) {
          setLoading(false);
          setError(createError?.message || 'Failed to create rehearsal event.');
          return;
        }
      } else {
        const { error: createError } = await createRehearsalEvents({
          audition_id: auditionId,
          dates,
          start_time: start as string,
          end_time: end as string,
          location: form.location || undefined,
          notes: form.notes || undefined,
        });

        if (createError) {
          setLoading(false);
          setError(createError?.message || 'Failed to create rehearsal events.');
          return;
        }
      }
    } else {
      const dates = selectedDates;

      if (dates.length === 1) {
        const { data, error: createError } = await createProductionEvent({
          audition_id: auditionId,
          production_event_type_id: form.production_event_type_id,
          date: dates[0],
          start_time: start,
          end_time: end,
          location: form.location || null,
          notes: form.notes || null,
        });

        if (createError || !data) {
          setLoading(false);
          setError(createError?.message || 'Failed to create production event.');
          return;
        }

        if (form.assignToEntireCast) {
          const userIds = (castMembers || []).map((m: any) => m.user_id).filter(Boolean);
          const { error: assignError } = await setProductionEventAssignments(data.production_event_id, userIds);
          if (assignError) {
            setLoading(false);
            setError(assignError.message || 'Event created, but failed to assign cast.');
            return;
          }
        }
      } else {
        const { data, error: createError } = await createProductionEvents({
          audition_id: auditionId,
          production_event_type_id: form.production_event_type_id,
          dates,
          start_time: start,
          end_time: end,
          location: form.location || null,
          notes: form.notes || null,
        });

        if (createError || !data || data.length === 0) {
          setLoading(false);
          setError(createError?.message || 'Failed to create production events.');
          return;
        }

        if (form.assignToEntireCast) {
          const userIds = (castMembers || []).map((m: any) => m.user_id).filter(Boolean);
          for (const ev of data) {
            const { error: assignError } = await setProductionEventAssignments(ev.production_event_id, userIds);
            if (assignError) {
              setLoading(false);
              setError(assignError.message || 'Events created, but failed to assign cast.');
              return;
            }
          }
        }
      }
    }

    setLoading(false);
    onCreated();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[10000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0" style={{ backgroundColor: 'rgba(10, 14, 39, 0.85)' }} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="neu-modal neu-modal-lg text-left">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Dialog.Title as="h2" className="text-xl font-bold text-neu-text-primary">
                      Schedule
                    </Dialog.Title>
                    <p className="text-sm text-neu-text-secondary">{dateLabel}</p>
                  </div>
                  <button onClick={onClose} className="neu-icon-btn" aria-label="Close">
                    ✕
                  </button>
                </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-neu-text-primary">
            {error}
          </div>
        )}

        {mode === 'production_event' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neu-text-primary">Event</h3>
              <Button
                text="Add Custom Type"
                onClick={() => setMode('custom_type')}
                variant="secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neu-text-primary mb-2">Event Type *</label>
              <select
                value={form.production_event_type_id}
                onChange={(e) => setForm({ ...form, production_event_type_id: e.target.value })}
                className="neu-input w-full"
              >
                {eventTypes.map((t: any) => (
                  <option key={t.production_event_type_id} value={t.production_event_type_id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <DateArrayInput
              value={selectedDates}
              onChange={handleDatesChange}
              label="Dates"
              placeholder="Select dates..."
              className="w-full"
              multiple
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neu-text-primary mb-2">
                  Start Time{isRehearsalType ? ' *' : ''}
                </label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="neu-input w-full"
                  required={isRehearsalType}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neu-text-primary mb-2">
                  End Time{isRehearsalType ? ' *' : ''}
                </label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="neu-input w-full"
                  required={isRehearsalType}
                />
              </div>
            </div>

            <AddressInput
              value={form.location}
              onChange={(value) => setForm({ ...form, location: value })}
              label="Location"
              placeholder="Location"
            />

            <div>
              <label className="block text-sm font-medium text-neu-text-primary mb-2">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="neu-input w-full"
                rows={3}
              />
            </div>

            {!isRehearsalType && (
              <div className="flex items-center gap-2">
                <input
                  id="assignToEntireCast"
                  type="checkbox"
                  checked={form.assignToEntireCast}
                  onChange={(e) => setForm({ ...form, assignToEntireCast: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="assignToEntireCast" className="text-sm text-neu-text-primary">
                  Assign to entire cast
                </label>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                text="Cancel"
                onClick={onClose}
                disabled={loading}
              />
              <Button
                text={loading ? 'Saving...' : 'Create Event'}
                onClick={handleCreateEvent}
                disabled={loading}
              />
            </div>
          </div>
        )}

                {mode === 'custom_type' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neu-text-primary">Custom Type</h3>

                    <div>
                      <label className="block text-sm font-medium text-neu-text-primary mb-2">Name *</label>
                      <input
                        value={customType.name}
                        onChange={(e) => setCustomType({ ...customType, name: e.target.value })}
                        className="neu-input w-full"
                        placeholder="e.g., Fight Call"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neu-text-primary mb-2">Color</label>
                      <input
                        type="color"
                        value={customType.color}
                        onChange={(e) => setCustomType({ ...customType, color: e.target.value })}
                        className="h-10 w-24"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        text="Back"
                        variant="secondary"
                        onClick={() => setMode('production_event')}
                        disabled={loading}
                      />
                      <Button
                        text={loading ? 'Saving...' : 'Create Type'}
                        onClick={handleCreateCustomType}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
