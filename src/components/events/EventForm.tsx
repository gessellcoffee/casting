'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { EventFormData, CalendarEvent } from '@/lib/supabase/types';
import { createEvent, updateEvent } from '@/lib/supabase/events';
import DateArrayInput from '../ui/DateArrayInput';
import AddressInput from '../ui/AddressInput';
import { FormSelect } from '../ui/forms';
import Button from '../Button';

const frequencyOptions = [
  { value: 'NONE', label: 'Does not repeat' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'CUSTOM', label: 'Custom...' },
];

const customFrequencyOptions = [
  { value: 'WEEKLY', label: 'week' },
  { value: 'MONTHLY', label: 'month' },
  { value: 'YEARLY', label: 'year' },
];

const dayOptions = [
  { value: 'MO', label: 'Monday' },
  { value: 'TU', label: 'Tuesday' },
  { value: 'WE', label: 'Wednesday' },
  { value: 'TH', label: 'Thursday' },
  { value: 'FR', label: 'Friday' },
  { value: 'SA', label: 'Saturday' },
  { value: 'SU', label: 'Sunday' },
];

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
}));

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  selectedDate?: Date;
  event?: CalendarEvent | null;
  userId: string;
}

export default function EventForm({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  event: initialEvent,
  userId,
}: EventFormProps) {
  const isEdit = !!initialEvent?.id;
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: selectedDate ? selectedDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    start: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
    end: selectedDate ? new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) : '',
    allDay: false,
    location: '',
    color: '#3b82f6',
    isRecurring: false,
    recurrence: {
      enabled: true,
      frequency: 'WEEKLY',
      customFrequencyType: 'WEEKLY',
      interval: 1,
      byDay: [],
      byMonthDay: [],
      byMonth: [],
      endType: 'never',
      endDate: '',
      occurrences: 10,
    },
  });

  // Initialize form with event data when in edit mode
  useEffect(() => {
    if (initialEvent) {
      const actualFrequency = initialEvent.recurrenceRule?.frequency || 'WEEKLY';
      // Determine if this was a custom recurrence (has byDay selections and interval > 1 or specific pattern)
      const hasCustomPattern = initialEvent.recurrenceRule?.byDay && initialEvent.recurrenceRule.byDay.length > 0;
      const isCustom = hasCustomPattern && (actualFrequency === 'WEEKLY' || actualFrequency === 'MONTHLY' || actualFrequency === 'YEARLY');
      
      setFormData({
        title: initialEvent.title,
        description: initialEvent.description || '',
        date: initialEvent.date || new Date().toISOString().slice(0, 10),
        start: initialEvent.start,
        end: initialEvent.end,
        allDay: initialEvent.allDay || false,
        location: initialEvent.location || '',
        color: initialEvent.color || '#3b82f6',
        isRecurring: initialEvent.isRecurring || false,
        recurrence: {
          enabled: true,
          frequency: isCustom ? 'CUSTOM' : actualFrequency,
          customFrequencyType: actualFrequency,
          interval: initialEvent.recurrenceRule?.interval || 1,
          byDay: initialEvent.recurrenceRule?.byDay || [],
          byMonthDay: initialEvent.recurrenceRule?.byMonthDay || [],
          byMonth: initialEvent.recurrenceRule?.byMonth || [],
          endType: initialEvent.recurrenceRule?.until ? 'on' : 
                  initialEvent.recurrenceRule?.count ? 'after' : 'never',
          endDate: initialEvent.recurrenceRule?.until || '',
          occurrences: initialEvent.recurrenceRule?.count || 10,
        },
      });
    } else if (selectedDate) {
      // Reset form with selected date for new events
      setFormData(prev => ({
        ...prev,
        start: selectedDate.toISOString().slice(0, 16),
        end: new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
      }));
    }
  }, [initialEvent, selectedDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDateChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: (value instanceof Date ? value : new Date(value)),
    }));
  };

  const handleRecurrenceChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        [field]: value,
      },
    }));
  };

  const toggleDay = (day: string) => {
    const newDays = formData.recurrence.byDay.includes(day)
      ? formData.recurrence.byDay.filter(d => d !== day)
      : [...formData.recurrence.byDay, day];

    handleRecurrenceChange('byDay', newDays);
  };

  const toggleMonthDay = (day: number) => {
    const newDays = formData.recurrence.byMonthDay.includes(day)
      ? formData.recurrence.byMonthDay.filter(d => d !== day)
      : [...formData.recurrence.byMonthDay, day];

    handleRecurrenceChange('byMonthDay', newDays);
  };

  const toggleMonth = (month: number) => {
    const newMonths = formData.recurrence.byMonth.includes(month)
      ? formData.recurrence.byMonth.filter(m => m !== month)
      : [...formData.recurrence.byMonth, month];

    handleRecurrenceChange('byMonth', newMonths);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let result: CalendarEvent | null = null;
      
      if (isEdit && initialEvent?.id) {
        result = await updateEvent(initialEvent.id, formData, userId);
      } else {
        result = await createEvent(formData, userId);
      }
      
      if (result) {
        onSave(result);
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving event:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: error
      });
      // TODO: Show user-friendly error message (toast notification)
      alert(`Failed to save event: ${error?.message || 'Unknown error'}`);
    }
  };

  const renderRecurrenceOptions = () => {
    if (!formData.isRecurring) return null;

    return (
      <div className="mt-4 space-y-4 ">
        <div>
          <label className="block text-sm font-medium text-neu-text-primary mb-1">
            Repeats
          </label>
          <FormSelect
            className="neu-input w-full"
            value={formData.recurrence.frequency}
            onChange={(e) => handleRecurrenceChange('frequency', e.target.value)}
          >
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
        </div>

        {formData.recurrence.frequency === 'CUSTOM' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neu-text-primary mb-1">
                Every
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  className="neu-input w-20"
                  value={formData.recurrence.interval}
                  onChange={(e) => handleRecurrenceChange('interval', parseInt(e.target.value) || 1)}
                />
                <FormSelect
                  className="neu-input"
                  value={formData.recurrence.customFrequencyType || 'WEEKLY'}
                  onChange={(e) => handleRecurrenceChange('customFrequencyType', e.target.value as 'WEEKLY' | 'MONTHLY' | 'YEARLY')}
                >
                  {customFrequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {formData.recurrence.interval === 1 ? option.label : option.label + 's'}
                    </option>
                  ))}
                </FormSelect>
              </div>
            </div>

            { formData.recurrence.frequency === 'CUSTOM' && (
                <div>
                <label className="block text-sm font-medium text-neu-text-primary mb-1">
                  On days
                </label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        formData.recurrence.byDay.includes(day.value)
                          ? 'bg-neu-accent-primary text-white'
                          : 'bg-neu-surface border border-neu-border text-neu-text-primary hover:bg-neu-surface/70'
                      }`}
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label[0]}
                    </button>
                  ))}
                </div>
              </div>
            )} 

            <div>
              <label className="block text-sm font-medium text-neu-text-primary mb-1">
                Ends
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="endNever"
                    name="endType"
                    className="h-4 w-4 text-neu-accent-primary focus:ring-neu-accent-primary border-neu-border bg-neu-surface"
                    checked={formData.recurrence.endType === 'never'}
                    onChange={() => handleRecurrenceChange('endType', 'never')}
                  />
                  <label htmlFor="endNever" className="ml-2 block text-sm text-neu-text-primary">
                    Never
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="endOn"
                    name="endType"
                    className="h-4 w-4 text-neu-accent-primary focus:ring-neu-accent-primary border-neu-border bg-neu-surface"
                    checked={formData.recurrence.endType === 'on'}
                    onChange={() => handleRecurrenceChange('endType', 'on')}
                  />
                  <div className="ml-2 flex items-center">
                    <span className="text-sm text-neu-text-primary mr-2">On</span>
                    <input
                      type="date"
                      className="neu-input"
                      value={formData.recurrence.endDate}
                      onChange={(e) => handleRecurrenceChange('endDate', e.target.value)}
                      disabled={formData.recurrence.endType !== 'on'}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="endAfter"
                    name="endType"
                    className="neu-input"
                    checked={formData.recurrence.endType === 'after'}
                    onChange={() => handleRecurrenceChange('endType', 'after')}
                  />
                  <div className="ml-2 flex items-center">
                    <span className="text-sm text-neu-text-primary mr-2">After</span>
                    <input
                      type="number"
                      min="1"
                      className="neu-input w-20"
                      value={formData.recurrence.occurrences}
                      onChange={(e) => handleRecurrenceChange('occurrences', parseInt(e.target.value) || 1)}
                      disabled={formData.recurrence.endType !== 'after'}
                    />
                    <span className="ml-2 text-sm text-neu-text-primary">occurrences</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
          <div className="fixed inset-0 bg-black/25 dark:bg-black/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto pt-24">
          <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all" style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}>
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-neu-text-primary">
                    {isEdit ? 'Edit Event' : 'New Event'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-neu-text-primary/60 hover:text-neu-text-primary transition-colors"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-neu-text-primary">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      className="neu-input"
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-neu-text-primary">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="neu-input"
                      value={formData.description ?? ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start" className="block text-sm font-medium text-neu-text-primary">
                        Start <span className="text-red-400">*</span>
                      </label>
                      <input
                        type={formData.allDay ? 'date' : 'datetime-local'}
                        id="start"
                        name="start"
                        required
                        className="neu-input w-auto"
                        value={formData.start ?? ''}
                        onChange={handleInputChange}
                      />
                    </div>
        <br/>
                    <div>
                      <label htmlFor="end" className="block text-sm font-medium text-neu-text-primary">
                        End <span className="text-red-400">*</span>
                      </label>
                      <input
                        type={formData.allDay ? 'date' : 'datetime-local'}
                        id="end"
                        name="end"
                        required
                        className="neu-input w-auto"
                        value={formData.end ?? ''}
                        onChange={handleInputChange}
                        min={formData.start ?? ''}
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allDay"
                      name="allDay"
                      checked={formData.allDay}
                      onChange={handleInputChange}
                      className="rounded border-2 border-neu-border bg-neu-surface checked:bg-neu-accent-primary checked:border-neu-accent-primary focus:outline-none focus:ring-2 focus:ring-neu-accent-primary/50 cursor-pointer transition-all"
                    />
                    <label htmlFor="allDay" className="ml-2 block text-sm text-neu-text-primary cursor-pointer">
                      All day
                    </label>
                  </div>

                  <div>
                    <AddressInput
                      value={formData.location || ''}
                      onChange={(value, isVerified, placeDetails) => {
                        setFormData((prev) => ({ ...prev, location: value }));
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-neu-text-primary">
                      Color
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        type="color"
                        id="color"
                        name="color"
                        value={formData.color || '#3b82f6'}
                        onChange={handleInputChange}
                        className="h-10 w-20 rounded border border-neu-border bg-neu-surface cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-neu-text-primary/70">
                        {formData.color?.toUpperCase() || '#3B82F6'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-neu-border pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-neu-text-primary">Recurrence</h4>
                      <div className="flex items-center">
                        <span className="text-sm text-neu-text-primary/70 mr-2">
                          {formData.isRecurring ? 'On' : 'Off'}
                        </span>
                        <button
                          type="button"
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neu-accent-primary focus:ring-offset-2 ${
                            formData.isRecurring ? 'bg-neu-accent-primary' : 'bg-neu-surface border-neu-border'
                          }`}
                          role="switch"
                          aria-checked={formData.isRecurring}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              isRecurring: !prev.isRecurring,
                            }));
                          }}
                        >
                          <span className="sr-only">Enable recurrence</span>
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              formData.isRecurring ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {renderRecurrenceOptions()}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <Button
                      text="Cancel"
                      type="button"
                      onClick={onClose}
                    />
                    <Button
                      text={isEdit ? 'Update Event' : 'Create Event'}
                      type="submit"
                    />
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
