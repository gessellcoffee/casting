'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, X, Check, Calendar, Download, Upload, Settings } from 'lucide-react';
import Button from '../Button';
import ConfirmationModal from '../shared/ConfirmationModal';
import SyncPreferencesModal from './SyncPreferencesModal';

interface GoogleCalendarSyncProps {
  userId: string;
  onSyncComplete?: () => void;
}

export default function GoogleCalendarSync({ userId, onSyncComplete }: GoogleCalendarSyncProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [syncStatus, setSyncStatus] = useState<{
    lastSynced?: string;
    calendarsSetup: boolean;
  }>({ calendarsSetup: false });
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
    currentType: string;
    message: string;
  } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('primary');
  const [importing, setImporting] = useState(false);
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
      
      if (response.ok) {
        // Check if sync calendars are already setup
        try {
          const statusResponse = await fetch('/api/google/sync/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
          
          if (statusResponse.ok) {
            const { calendarsSetup, calendars } = await statusResponse.json();
            console.log('[GoogleCalendarSync] Sync status:', { calendarsSetup, calendarsCount: calendars?.length });
            setSyncStatus({ 
              ...syncStatus, 
              calendarsSetup 
            });
          }
        } catch (statusError) {
          console.error('[GoogleCalendarSync] Error checking sync status:', statusError);
          // Default to false if we can't check
          setSyncStatus({ ...syncStatus, calendarsSetup: false });
        }
      }
    } catch (error) {
      setIsConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleConnect = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/google/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const { authUrl } = await response.json();
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to Google:', error);
      openModal('Connection Failed', 'Failed to connect to Google Calendar. Please try again.', undefined, 'OK', false);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSetupSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/google/sync/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Setup sync failed:', data);
        throw new Error(data.error || 'Failed to setup sync');
      }
      
      const { calendars } = data;
      
      console.log('[GoogleCalendarSync] Setup complete, updating status');
      setSyncStatus({ ...syncStatus, calendarsSetup: true });
      openModal(
        'Sync Setup Complete', 
        `Successfully set up ${calendars.length} calendars in your Google Calendar:\n\n${calendars.map((c: any) => `• ${c.name}`).join('\n')}\n\nYou can now use "Sync to Google" and "Import from Google"!`,
        undefined,
        'OK',
        false
      );
    } catch (error: any) {
      console.error('Error setting up sync:', error);
      let errorMessage = error?.message || 'Failed to setup sync calendars. Please try again.';
      
      // Check if it's a permission error
      if (errorMessage.includes('insufficient authentication scopes') || errorMessage.includes('Insufficient permissions')) {
        errorMessage = 'Your Google Calendar connection needs updated permissions.\n\nPlease:\n1. Click "Disconnect" below\n2. Click "Connect Google Calendar" again\n3. Accept the new permissions\n4. Try "Setup Sync" again';
      }
      
      openModal('Setup Failed', errorMessage, undefined, 'OK', false);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 6, currentType: 'Starting...', message: 'Initializing sync...' });
    
    try {
      const response = await fetch('/api/google/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync');
      }
      
      // Check if response is streaming
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (reader) {
          let buffer = '';
          let finalResult = { synced: 0, errors: 0 };
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'progress') {
                    setSyncProgress({
                      current: data.current,
                      total: data.total,
                      currentType: data.eventType,
                      message: data.message
                    });
                  } else if (data.type === 'complete') {
                    finalResult = { synced: data.synced, errors: data.errors };
                  }
                } catch (e) {
                  console.error('Error parsing SSE:', e);
                }
              }
            }
          }
          
          setSyncStatus({ 
            ...syncStatus, 
            lastSynced: new Date().toISOString() 
          });
          
          openModal(
            'Sync Complete', 
            `Successfully synced ${finalResult.synced} events to Google Calendar${finalResult.errors > 0 ? `. ${finalResult.errors} events failed.` : '!'}`,
            undefined,
            'OK',
            false
          );
        }
      } else {
        // Fallback to regular JSON response
        const { synced, errors } = await response.json();
        
        setSyncStatus({ 
          ...syncStatus, 
          lastSynced: new Date().toISOString() 
        });
        
        openModal(
          'Sync Complete', 
          `Successfully synced ${synced} events to Google Calendar${errors > 0 ? `. ${errors} events failed.` : '!'}`,
          undefined,
          'OK',
          false
        );
      }
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('Error syncing:', error);
      openModal('Sync Failed', 'Failed to sync events. Please try again.', undefined, 'OK', false);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleStartImport = async () => {
    setShowImportModal(true);
    
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

  const handleImportFromGoogle = async () => {
    setImporting(true);
    console.log('[GoogleCalendarSync] Starting import...');
    try {
      // Calculate date range (next 6 months from now)
      const now = new Date();
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      const requestBody = { 
        userId,
        calendarId: selectedCalendarId,
        timeMin: now.toISOString(),
        timeMax: sixMonthsFromNow.toISOString()
      };
      console.log('[GoogleCalendarSync] Request body:', requestBody);
      
      console.log('[GoogleCalendarSync] Calling /api/google/import...');
      const response = await fetch('/api/google/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      console.log('[GoogleCalendarSync] Response status:', response.status);
      
      if (!response.ok) {
        const data = await response.json();
        console.error('[GoogleCalendarSync] Error response:', data);
        throw new Error(data.error || 'Failed to import events');
      }
      
      const result = await response.json();
      console.log('[GoogleCalendarSync] Import result:', result);
      
      const { imported, errors, total, message, errorDetails } = result;
      
      let modalMessage = `Successfully imported ${imported} of ${total} events from Google Calendar`;
      if (errors > 0) {
        modalMessage += `. ${errors} events failed to import.`;
        if (errorDetails && errorDetails.length > 0) {
          console.error('[GoogleCalendarSync] Error details:', errorDetails);
        }
      } else if (total === 0) {
        modalMessage = message || 'No events found in the selected calendar for the next 6 months.';
      } else {
        modalMessage += '!';
      }
      
      openModal(
        'Import Complete', 
        modalMessage,
        undefined,
        'OK',
        false
      );
      setShowImportModal(false);
      
      if (onSyncComplete) {
        console.log('[GoogleCalendarSync] Calling onSyncComplete...');
        onSyncComplete();
      }
    } catch (error: any) {
      console.error('[GoogleCalendarSync] Fatal error importing:', error);
      openModal('Import Failed', error?.message || 'Failed to import events. Please try again.', undefined, 'OK', false);
    } finally {
      setImporting(false);
      console.log('[GoogleCalendarSync] Import process finished');
    }
  };

  const handleDisconnect = async () => {
    const disconnectAction = async () => {
      setIsSyncing(true);
      try {
        await fetch('/api/google/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        setIsConnected(false);
        setSyncStatus({ calendarsSetup: false });
        openModal('Success', 'Successfully disconnected from Google Calendar.', undefined, 'OK', false);
      } catch (error) {
        console.error('Error disconnecting:', error);
        openModal('Error', 'Failed to disconnect. Please try again.', undefined, 'OK', false);
      } finally {
        setIsSyncing(false);
      }
    };

    openModal('Confirm Disconnect', 'Are you sure you want to disconnect your Google Calendar? This will stop syncing.', disconnectAction, 'Disconnect');
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
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {!isConnected ? (
            <Button
              text="Connect Google Calendar"
              onClick={handleConnect}
              disabled={isSyncing}
              className="flex items-center gap-2"
              title="Connect your Google Calendar to sync events"
            />
          ) : !syncStatus.calendarsSetup ? (
            <>
              <Button
                text="Setup Sync"
                onClick={handleSetupSync}
                disabled={isSyncing}
                className="flex items-center gap-2"
                title="Create sync calendars in Google Calendar"
              >
                <Calendar className="w-4 h-4" />
              </Button>
              <button
                onClick={handleDisconnect}
                className="px-3 py-2 text-sm text-neu-text-primary/70 hover:text-neu-text-primary transition-colors"
                title="Disconnect Google Calendar"
              >
                Disconnect
              </button>
            </>
          ) : (
            <>
              <Button
                text={isSyncing ? 'Syncing...' : 'Sync to Google'}
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2"
                title="Push your events to Google Calendar"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                text="Import from Google"
                onClick={handleStartImport}
                disabled={isSyncing}
                className="flex items-center gap-2"
                title="Import events from your Google Calendar"
              >
                <Download className="w-4 h-4" />
              </Button>
              <button
                onClick={() => setShowPreferencesModal(true)}
                className="px-3 py-2 text-sm text-neu-text-primary/70 hover:text-neu-text-primary transition-colors flex items-center gap-2"
                title="Sync Settings"
                disabled={isSyncing}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              {syncStatus.lastSynced && (
                <span className="text-xs text-neu-text-primary/60">
                  Last synced: {new Date(syncStatus.lastSynced).toLocaleString()}
                </span>
              )}
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

        {/* Progress Bar */}
        {syncProgress && (
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between text-xs text-neu-text-primary/70 mb-1">
              <span>{syncProgress.currentType}</span>
              <span>{syncProgress.current} / {syncProgress.total}</span>
            </div>
            <div className="w-full h-2 bg-neu-surface rounded-full overflow-hidden neu-card-inset">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              />
            </div>
            <div className="text-xs text-neu-text-primary/60 mt-1">
              {syncProgress.message}
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white border border-neu-border rounded-xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neu-text-primary">
                Import from Google Calendar
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-neu-text-primary/60 hover:text-neu-text-primary transition-colors"
                disabled={importing}
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neu-text-primary mb-2">
                  Select Calendar to Import
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

              <p className="text-sm text-neu-text-primary/70">
                All events from this calendar will be imported as "Personal Events" in your Belong Here Theater calendar.
              </p>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  text="Cancel"
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                />
                <Button
                  text={importing ? 'Importing...' : 'Import'}
                  onClick={handleImportFromGoogle}
                  disabled={importing}
                />
              </div>
            </div>
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

      <SyncPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        userId={userId}
      />
    </>
  );
}
