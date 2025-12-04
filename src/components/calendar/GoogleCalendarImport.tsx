'use client';

import { useState, useEffect } from 'react';
import { Calendar, X, Check, Trash2 } from 'lucide-react';
import Button from '../Button';
import { createEvent } from '@/lib/supabase/events';
import ConfirmationModal from '../shared/ConfirmationModal';

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
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentEvent: '' });
  const [deleting, setDeleting] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const openModal = (title: string, message: string, onConfirmAction?: () => void, confirmText?: string, showCancelBtn: boolean = true) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        if (onConfirmAction) onConfirmAction();
        setModalConfig({ ...modalConfig, isOpen: false });
      },
      confirmButtonText: confirmText || 'Confirm',
      showCancel: showCancelBtn
    });
  };

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
      openModal('Connection Failed', 'Failed to connect to Google Calendar. Please try again.', undefined, 'OK', false);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const disconnectAction = async () => {
      setLoading(true);
      try {
        await fetch('/api/google/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        setIsConnected(false);
        openModal('Success', 'Successfully disconnected from Google Calendar.', undefined, 'OK', false);
      } catch (error) {
        console.error('Error disconnecting:', error);
        openModal('Error', 'Failed to disconnect. Please try again.', undefined, 'OK', false);
      } finally {
        setLoading(false);
      }
    };

    openModal('Confirm Disconnect', 'Are you sure you want to disconnect your Google Calendar?', disconnectAction, 'Disconnect');
  };

  const handleDeleteAllPersonal = async () => {
    const deleteAction = async () => {
      setDeleting(true);
      try {
        const response = await fetch('/api/events/delete-all-personal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        const result = await response.json();
        
        if (response.ok) {
          openModal('Success', `Successfully deleted ${result.deletedCount} personal event${result.deletedCount !== 1 ? 's' : ''}.`, undefined, 'OK', false);
          if (onImportComplete) {
            onImportComplete(); // Refresh calendar
          }
        } else {
          throw new Error(result.error || 'Failed to delete events');
        }
      } catch (error: any) {
        console.error('Error deleting personal events:', error);
        openModal('Error', error.message || 'Failed to delete personal events. Please try again.', undefined, 'OK', false);
      } finally {
        setDeleting(false);
      }
    };

    openModal(
      'Delete All Personal Events', 
      'Are you sure you want to delete ALL of your personal events? This will remove all personal calendar entries and cannot be undone.', 
      deleteAction, 
      'Delete All'
    );
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
      openModal('Error', 'Failed to load calendars.', undefined, 'OK', false);
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
      openModal('Error', 'Failed to fetch events. Please try again.', undefined, 'OK', false);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (events.length === 0) {
      openModal('No Events', 'There are no events to import in the selected range.', undefined, 'OK', false);
      return;
    }

    setImporting(true);
    setImportStep('importing');
    setImportProgress({ current: 0, total: events.length, currentEvent: '' });

    try {
      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        setImportProgress({ current: i + 1, total: events.length, currentEvent: event.title });
        
        // Small delay to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 50));
        
        try {
          // Debug: Log event data
          console.log('Processing event:', { 
            title: event.title, 
            hasGoogleId: !!event.googleEventId,
            googleEventId: event.googleEventId 
          });
          
          // Check if this Google event has already been imported
          if (event.googleEventId) {
            const response = await fetch('/api/google/event-mapping', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                googleEventId: event.googleEventId,
                action: 'check'
              }),
            });
            
            const result = await response.json();
            console.log('Mapping check result:', result);
            
            if (result.exists) {
              console.log('Skipping already imported event:', event.title);
              skippedCount++;
              continue; // Skip this event
            }
          } else {
            console.warn('Event missing googleEventId:', event.title);
          }
          
          // Create the event
          const createdEvent = await createEvent(
            {
              title: event.title,
              description: event.description || '',
              date: event.start ? new Date(event.start).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
              start: event.start,
              end: event.end,
              allDay: event.allDay,
              location: event.location || '',
              color: event.color || '#4285f4',
              isRecurring: event.isRecurring,
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
            },
            userId
          );
          
          // Create mapping if we have a Google event ID
          if (event.googleEventId && createdEvent) {
            await fetch('/api/google/event-mapping', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                googleEventId: event.googleEventId,
                eventId: createdEvent.id,
                calendarId: selectedCalendarId,
                action: 'create'
              }),
            });
          }
          
          importedCount++;
        } catch (error) {
          console.error('Error importing event:', event.title, error);
          errorCount++;
        }
      }

      const messages = [];
      if (importedCount > 0) messages.push(`${importedCount} new event${importedCount !== 1 ? 's' : ''} imported`);
      if (skippedCount > 0) messages.push(`${skippedCount} duplicate${skippedCount !== 1 ? 's' : ''} skipped`);
      if (errorCount > 0) messages.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`);

      openModal('Import Complete', messages.join(', ') + '.', undefined, 'OK', false);
      
      setShowImportModal(false);
      setEvents([]);
      setImportStep('select');
      
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Error during import:', error);
      openModal('Import Failed', 'An error occurred while importing events. Please try again.', undefined, 'OK', false);
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
              disabled={loading || deleting}
              className="flex items-center gap-2"
            />
            <button
              onClick={handleDeleteAllPersonal}
              disabled={deleting}
              className="px-3 py-2 text-sm text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              title="Delete all personal events"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">{deleting ? 'Deleting...' : 'Reset Personal Events'}</span>
            </button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-neu-border rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                        className="p-3 rounded neu-bg-solid border border-neu-border"
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
              <div className="py-8 px-4">
                <div className="mb-6 text-center">
                  <p className="text-lg font-medium text-neu-text-primary mb-2">
                    Importing events...
                  </p>
                  <p className="text-sm text-neu-text-primary/70">
                    {importProgress.current} of {importProgress.total}
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-neu-border rounded-full h-3 mb-4 overflow-hidden">
                  <div 
                    className="bg-neu-accent-primary h-full transition-all duration-300 ease-out"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
                
                {/* Current Event */}
                {importProgress.currentEvent && (
                  <div className="text-center">
                    <p className="text-xs text-neu-text-primary/60 mb-1">Currently importing:</p>
                    <p className="text-sm text-neu-text-primary font-medium truncate px-4">
                      {importProgress.currentEvent}
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-neu-text-primary/50 text-center mt-4">
                  Please wait, do not close this window
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
        confirmButtonText={modalConfig.confirmButtonText}
        showCancel={modalConfig.showCancel}
      />
    </>
  );
}
