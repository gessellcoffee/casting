import React, { useState } from 'react';
import { RRule } from 'rrule';
import { RecurrenceRule } from '../../lib/supabase/events';
import DateArrayInput from '../ui/DateArrayInput';

// Helper for days of the week
const weekDays = [
  { label: 'Mon', value: RRule.MO.weekday },
  { label: 'Tue', value: RRule.TU.weekday },
  { label: 'Wed', value: RRule.WE.weekday },
  { label: 'Thu', value: RRule.TH.weekday },
  { label: 'Fri', value: RRule.FR.weekday },
  { label: 'Sat', value: RRule.SA.weekday },
  { label: 'Sun', value: RRule.SU.weekday },
];

type Props = {
  onSave: (eventData: any) => void;
  onClose: () => void;
};

export default function RecurringEventForm({ onSave, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [frequency, setFrequency] = useState<RecurrenceRule['frequency']>('Daily');
  const [interval, setInterval] = useState(1);
  const [customFrequency, setCustomFrequency] = useState<'weeks' | 'months' | 'years'>('weeks');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);

  const handleDayToggle = (dayValue: number) => {
    setDaysOfWeek(prev =>
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate inputs (e.g., end time > start time)
    if (!title || !startTime || !endTime) {
      console.error("Missing required fields");
      return;
    }

    // 2. Build the recurrence rule object
    const rule: RecurrenceRule = {
      frequency,
      interval: frequency === 'Custom' ? interval : 1,
      endDate: endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 20)).toISOString().split('T')[0], // Default 20 years
      customFrequency: frequency === 'Custom' ? customFrequency : undefined,
      daysOfWeek: (frequency === 'Weekly' || (frequency === 'Custom' && customFrequency === 'weeks')) ? daysOfWeek : undefined,
    };
    
    // 3. Get start/end times as full ISO strings
    const startDateTime = new Date(startTime).toISOString();
    const endDateTime = new Date(endTime).toISOString();

    // 4. Construct the final event definition to save
    const eventToSave = {
      title,
      startTime: startDateTime,
      endTime: endDateTime,
      recurrenceRule: frequency === 'Daily' ? null : rule, // Assuming 'Daily' means no rule for simplicity
    };
    
    console.log('Saving event:', eventToSave);
    // This is where you would call your API
    // await fetch('/api/events', { method: 'POST', body: JSON.stringify(eventToSave) });
    onSave(eventToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 neu-card-raised">
      <h2 className="text-2xl font-bold neu-text">Create New Event</h2>
      
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium neu-text">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="neu-input"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="start-time" className="block text-sm font-medium neu-text">Start Time</label>
          <input
            type="datetime-local"
            id="start-time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="neu-input"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="end-time" className="block text-sm font-medium neu-text">End Time</label>
          <input
            type="datetime-local"
            id="end-time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="neu-input"
            min={startTime}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="frequency" className="block text-sm font-medium neu-text">Frequency</label>
          <select
            id="frequency"
            value={frequency}
            onChange={e => setFrequency(e.target.value as RecurrenceRule['frequency'])}
            className="neu-input"
          >
            <option value="Daily">Does not repeat</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
            <option value="Custom">Custom...</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="end-date" className="block text-sm font-medium neu-text">End Date (optional)</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="neu-input"
          />
        </div>
      </div>

      {/* --- Custom Recurrence Fields --- */}
      {frequency === 'Custom' && (
        <div className="p-4 neu-card-raised space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium neu-text">Every</span>
            <input
              type="number"
              min="1"
              value={interval}
              onChange={e => setInterval(parseInt(e.target.value, 10))}
              className="neu-input"
            />
            <select
              value={customFrequency}
              onChange={e => setCustomFrequency(e.target.value as any)}
              className="neu-input"
            >
              <option value="weeks">weeks</option>
              <option value="months">months</option>
              <option value="years">years</option>
            </select>
          </div>
          
          {customFrequency === 'weeks' && (
            <div className="space-y-2">
              <span className="block text-sm font-medium neu-text">On:</span>
              <div className="flex flex-wrap gap-2">
                {weekDays.map(day => (
                  <button
                    type="button"
                    key={day.value}
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      daysOfWeek.includes(day.value)    
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Form Actions --- */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 neu-card-raised text-sm font-medium neu-text hover:bg-gray-50 focus:outline-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 neu-card-raised text-sm font-medium neu-text hover:bg-gray-50 focus:outline-none"
        >
          Save Event
        </button>
      </div>
    </form>
  );
};

