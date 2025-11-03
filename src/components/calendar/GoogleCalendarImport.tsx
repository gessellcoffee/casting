'use client';

import { useState, useEffect } from 'react';
import { Calendar, X, Check } from 'lucide-react';
import Button from '../Button';
import { createEvent } from '@/lib/supabase/events';

interface GoogleCalendarImportProps {
  userId: string;
  onImportComplete?: () => void;
}

export default function GoogleCalendarImport({ userId, onImportComplete }: GoogleCalendarImportProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('primary');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
  });
  const [events, setEvents] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState<'select' | 'preview' | 'importing'>('select');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setCheckingConnection(true);
    try {
      const response = await fetch('/api/google/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setIsConnected(response.ok);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/google/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const { authUrl } = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to Google:', error);
      alert('Failed to connect to Google Calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Calendar?')) {
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/google/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setIsConnected(false);
      alert('Successfully disconnected from Google Calendar');
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartImport = async () => {
    setShowImportModal(true);
    setImportStep('select');
    
    // Load calendars
    try {
      const response = await fetch('/api/google/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const { calendars: calendarList } = await response.json();
      setCalendars(calendarList);
    } catch (error) {
      console.error('Error loading calendars:', error);
      alert('Failed to load calendars');
    }
  };

  const handleFetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/google/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          calendarId: selectedCalendarId,
          timeMin: new Date(dateRange.start).toISOString(),
          timeMax: new Date(dateRange.end + 'T23:59:59').toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const { events: fetchedEvents } = await response.json();
      setEvents(fetchedEvents);
      setImportStep('preview');
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to fetch events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (events.length === 0) {
      alert('No events to import');
      return;
    }

    setImporting(true);
    setImportStep('importing');

    try {
      let importedCount = 0;
      let errorCount = 0;

      for (const event of events) {
        try {
          await createEvent(
            {
              title: event.title,
              description: event.description || '',
              start: event.start,
              end: event.end,
              allDay: event.allDay,
              location: event.location || '',
              color: event.color || '#4285f4',
              isRecurring: event.isRecurring,
              recurrence: {
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
            },
            userId
          );
          importedCount++;
        } catch (error) {
          console.error('Error importing event:', event.title, error);
          errorCount++;
        }
      }

      alert(`Successfully imported ${importedCount} events${errorCount > 0 ? `. ${errorCount} events failed to import.` : '!'}`);
      
      setShowImportModal(false);
      setEvents([]);
      setImportStep('select');
      
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Error during import:', error);
      alert('Failed to import events. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  if (checkingConnection) {
    return (
      <div className="text-sm text-neu-text-primary/70">
        Checking Google Calendar connection...
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {!isConnected ? (
          <Button
            text="Connect Google Calendar"
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2"
          />
        ) : (
          <>
            <Button
              text="Import from Google Calendar"
              onClick={handleStartImport}
              disabled={loading}
              className="flex items-center gap-2"
            />
            <button
              onClick={handleDisconnect}
              className="px-3 py-2 text-sm text-neu-text-primary/70 hover:text-neu-text-primary transition-colors"
              title="Disconnect Google Calendar"
            >
              Disconnect
            </button>
          </>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-neu-surface border border-neu-border rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neu-text-primary">
                Import from Google Calendar
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-neu-text-primary/60 hover:text-neu-text-primary transition-colors"
                disabled={importing}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {importStep === 'select' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neu-text-primary mb-2">
                    Select Calendar
                  </label>
                  <select
                    value={selectedCalendarId}
                    onChange={(e) => setSelectedCalendarId(e.target.value)}
                    className="neu-input w-full"
                  >
                    {calendars.map((cal) => (
                      <option key={cal.id} value={cal.id}>
                        {cal.summary} {cal.primary ? '(Primary)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neu-text-primary mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="neu-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neu-text-primary mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="neu-input w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    text="Cancel"
                    onClick={() => setShowImportModal(false)}
                    disabled={loading}
                  />
                  <Button
                    text={loading ? 'Loading...' : 'Next'}
                    onClick={handleFetchEvents}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {importStep === 'preview' && (
              <div className="space-y-4">
                <div className="mb-4">
                  <p className="text-neu-text-primary mb-2">
                    Found <strong>{events.length}</strong> events to import
                  </p>
                  {events.length === 0 && (
                    <p className="text-neu-text-primary/70 text-sm">
                      No events found in the selected date range.
                    </p>
                  )}
                </div>

                {events.length > 0 && (
                  <div className="max-h-96 overflow-y-auto space-y-2 border border-neu-border rounded-lg p-3">
                    {events.slice(0, 20).map((event, index) => (
                      <div
                        key={index}
                        className="p-3 rounded bg-neu-surface/50 border border-neu-border"
                      >
                        <div className="font-medium text-neu-text-primary">{event.title}</div>
                        <div className="text-sm text-neu-text-primary/70">
                          {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
                        </div>
                        {event.location && (
                          <div className="text-xs text-neu-text-primary/60 mt-1">
                            📍 {event.location}
                          </div>
                        )}
                      </div>
                    ))}
                    {events.length > 20 && (
                      <p className="text-sm text-neu-text-primary/70 text-center py-2">
                        ... and {events.length - 20} more events
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    text="Back"
                    onClick={() => setImportStep('select')}
                    disabled={importing}
                  />
                  <Button
                    text="Import All"
                    onClick={handleImport}
                    disabled={importing || events.length === 0}
                  />
                </div>
              </div>
            )}

            {importStep === 'importing' && (
              <div className="text-center py-8">
                <div className="animate-spin h-12 w-12 border-4 border-neu-border border-t-neu-accent-primary rounded-full mx-auto mb-4"></div>
                <p className="text-neu-text-primary">Importing events...</p>
                <p className="text-sm text-neu-text-primary/70 mt-2">Please wait</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
