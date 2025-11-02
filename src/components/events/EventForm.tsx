'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { EventFormData, EventFrequency } from '@/lib/supabase/types';
import { createEvent, updateEvent, CalendarEvent } from '@/lib/supabase/events';
import DateArrayInput from '../ui/DateArrayInput';

const frequencyOptions = [
  { value: 'NONE', label: 'Does not repeat' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'CUSTOM', label: 'Custom...' },
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
    start: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
    end: selectedDate ? new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) : '',
    allDay: false,
    location: '',
    color: '#3b82f6',
    isRecurring: false,
    recurrence: {
      frequency: 'WEEKLY',
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
      setFormData({
        title: initialEvent.title,
        description: initialEvent.description || '',
        start: initialEvent.start instanceof Date ? initialEvent.start.toISOString().slice(0, 16) : initialEvent.start,
        end: initialEvent.end instanceof Date ? initialEvent.end.toISOString().slice(0, 16) : initialEvent.end,
        allDay: initialEvent.allDay || false,
        location: initialEvent.location || '',
        color: initialEvent.color || '#3b82f6',
        isRecurring: initialEvent.isRecurring || false,
        recurrence: {
          frequency: (initialEvent.recurrenceRule?.frequency as EventFrequency) || 'WEEKLY',
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
    } catch (error) {
      console.error('Error saving event:', error);
      // Handle error (show toast, etc.)
    }
  };

  const renderRecurrenceOptions = () => {
    if (!formData.isRecurring) return null;

    return (
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Repeats
          </label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.recurrence.frequency}
            onChange={(e) => handleRecurrenceChange('frequency', e.target.value as EventFrequency)}
          >
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {formData.recurrence.frequency === 'CUSTOM' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Every
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.recurrence.interval}
                  onChange={(e) => handleRecurrenceChange('interval', parseInt(e.target.value) || 1)}
                />
                <span className="ml-2">
                  {formData.recurrence.interval === 1
                    ? frequencyOptions.find(f => f.value === formData.recurrence.frequency)?.label?.toLowerCase() || 'day(s)'
                    : frequencyOptions.find(f => f.value === formData.recurrence.frequency)?.label?.toLowerCase() + 's' || 'days'}
                </span>
              </div>
            </div>

            { formData.recurrence.frequency === 'CUSTOM' && (
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  On days
                </label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      className={`px-3 py-1 text-sm rounded-md ${
                        formData.recurrence.byDay.includes(day.value)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ends
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="endNever"
                    name="endType"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    checked={formData.recurrence.endType === 'never'}
                    onChange={() => handleRecurrenceChange('endType', 'never')}
                  />
                  <label htmlFor="endNever" className="ml-2 block text-sm text-gray-700">
                    Never
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="endOn"
                    name="endType"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    checked={formData.recurrence.endType === 'on'}
                    onChange={() => handleRecurrenceChange('endType', 'on')}
                  />
                  <div className="ml-2 flex items-center">
                    <span className="text-sm text-gray-700 mr-2">On</span>
                    <input
                      type="date"
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    checked={formData.recurrence.endType === 'after'}
                    onChange={() => handleRecurrenceChange('endType', 'after')}
                  />
                  <div className="ml-2 flex items-center">
                    <span className="text-sm text-gray-700 mr-2">After</span>
                    <input
                      type="number"
                      min="1"
                      className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      value={formData.recurrence.occurrences}
                      onChange={(e) => handleRecurrenceChange('occurrences', parseInt(e.target.value) || 1)}
                      disabled={formData.recurrence.endType !== 'after'}
                    />
                    <span className="ml-2 text-sm text-gray-700">occurrences</span>
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
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {isEdit ? 'Edit Event' : 'New Event'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start" className="block text-sm font-medium text-gray-700">
                        Start <span className="text-red-500">*</span>
                      </label>
                      <input
                        type={formData.allDay ? 'date' : 'datetime-local'}
                        id="start"
                        name="start"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={formData.start}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="end" className="block text-sm font-medium text-gray-700">
                        End <span className="text-red-500">*</span>
                      </label>
                      <input
                        type={formData.allDay ? 'date' : 'datetime-local'}
                        id="end"
                        name="end"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={formData.end}
                        onChange={handleInputChange}
                        min={formData.start}
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allDay"
                      name="allDay"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.allDay}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="allDay" className="ml-2 block text-sm text-gray-700">
                      All day
                    </label>
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <DateArrayInput
                      value={formData.recurrence.byDay}
                      onChange={handleDateChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                      Color
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        type="color"
                        id="color"
                        name="color"
                        className="h-8 w-8 rounded border border-gray-300 cursor-pointer"
                        value={formData.color}
                        onChange={handleInputChange}
                      />
                      <span className="ml-2 text-sm text-gray-500">
                        {formData.color.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">Recurrence</h4>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">
                          {formData.isRecurring ? 'On' : 'Off'}
                        </span>
                        <button
                          type="button"
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            formData.isRecurring ? 'bg-blue-600' : 'bg-gray-200'
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
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isEdit ? 'Update Event' : 'Create Event'}
                    </button>
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
