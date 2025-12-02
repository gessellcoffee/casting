'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import Button from '../Button';

interface SyncPreference {
  event_type: string;
  sync_enabled: boolean;
  calendar_name: string;
}

interface SyncPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const EVENT_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  audition_slots: {
    label: 'Audition Slots',
    description: 'Audition time slots you are managing (Owner/Production Team)'
  },
  auditions: {
    label: 'Audition Signups',
    description: 'Auditions you have signed up for'
  },
  callbacks: {
    label: 'Callbacks',
    description: 'Callback invitations you have received'
  },
  rehearsals: {
    label: 'Rehearsals',
    description: 'Rehearsal dates, events, and agenda items'
  },
  performances: {
    label: 'Performances',
    description: 'Performance dates for shows you are in'
  },
  personal: {
    label: 'Personal Events',
    description: 'Events imported from Google Calendar (not synced back)'
  }
};

export default function SyncPreferencesModal({ isOpen, onClose, userId }: SyncPreferencesModalProps) {
  const [preferences, setPreferences] = useState<SyncPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen, userId]);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/google/sync/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to load sync preferences');
      }

      const { preferences: prefs } = await response.json();
      setPreferences(prefs);
    } catch (error: any) {
      console.error('Error loading preferences:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (eventType: string) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.event_type === eventType
          ? { ...pref, sync_enabled: !pref.sync_enabled }
          : pref
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/google/sync/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferences }),
      });

      if (!response.ok) {
        throw new Error('Failed to save sync preferences');
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="rounded-3xl shadow-[20px_20px_60px_var(--neu-shadow-dark),-20px_-20px_60px_var(--neu-shadow-light)] max-w-2xl w-full max-h-[90vh] overflow-hidden border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                {/* Header */}
                <div className="sticky top-0 p-6 border-b border-neu-border shadow-[inset_0_-2px_4px_var(--neu-shadow-dark)]" style={{ backgroundColor: 'var(--neu-surface)' }}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-neu-text-primary mb-1">
                        Sync Preferences
                      </h2>
                      <p className="text-sm text-neu-text-secondary">
                        Choose which event types to sync to Google Calendar
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] text-neu-text-primary hover:text-neu-accent-primary transition-all duration-200 border border-neu-border"
                      style={{ backgroundColor: 'var(--neu-surface)' }}
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Preferences List */}
                  {loading ? (
                    <div className="text-center py-8 text-neu-text-secondary">
                      Loading preferences...
                    </div>
                  ) : (
                    <div className="space-y-3 mb-6">
                      {preferences.map((pref) => {
                        const isPersonal = pref.event_type === 'personal';
                        const info = EVENT_TYPE_LABELS[pref.event_type] || {
                          label: pref.event_type,
                          description: ''
                        };

                        return (
                          <div
                            key={pref.event_type}
                            className={`p-4 rounded-lg border ${
                              isPersonal 
                                ? 'bg-gray-50 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700 opacity-60 cursor-not-allowed'
                                : 'bg-neu-surface border-neu-border hover:border-neu-border-focus transition-colors'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-neu-text-primary">
                                    {info.label}
                                  </h3>
                                  {isPersonal && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                      Import Only
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-neu-text-primary/70 mt-1">
                                  {info.description}
                                </p>
                                <p className="text-xs text-neu-text-primary/50 mt-1">
                                  Calendar: {pref.calendar_name}
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={pref.sync_enabled}
                                  onChange={() => !isPersonal && handleToggle(pref.event_type)}
                                  disabled={isPersonal}
                                  className="sr-only peer"
                                />
                                <div className={`
                                  w-11 h-6 rounded-full peer 
                                  ${isPersonal 
                                    ? 'bg-gray-300 dark:bg-gray-700' 
                                    : 'bg-gray-200 dark:bg-gray-600 peer-checked:bg-blue-500'
                                  }
                                  peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800
                                  after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                                  after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all
                                  peer-checked:after:translate-x-full peer-checked:after:border-white
                                  ${!isPersonal && 'cursor-pointer'}
                                `} />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Note:</strong> Personal events are imported from Google Calendar and won't be synced back to avoid duplicates. 
                      All other event types will be pushed to their dedicated calendars in Google.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <Button
                      text="Cancel"
                      onClick={onClose}
                      disabled={saving}
                    />
                    <Button
                      text={saving ? 'Saving...' : 'Save Preferences'}
                      onClick={handleSave}
                      disabled={saving || loading}
                    />
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
