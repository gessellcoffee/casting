'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose, MdLocationOn, MdAccessTime, MdEventNote } from 'react-icons/md';

interface AgendaItem {
  rehearsal_agenda_items_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}

interface RehearsalEventModalProps {
  event: {
    title: string;
    date: Date;
    startTime?: Date;
    endTime?: Date;
    location?: string;
    notes?: string;
    agendaItems?: AgendaItem[];
  };
  onClose: () => void;
}

// Format time string (HH:MM:SS) to readable format (7:00 PM)
const formatTimeString = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Generate Google Maps link from address
const getGoogleMapsLink = (address: string): string => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};

export default function RehearsalEventModal({ event, onClose }: RehearsalEventModalProps) {
  const hasAgendaItems = event.agendaItems && event.agendaItems.length > 0;

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all" style={{ background: 'var(--neu-bg-base)', border: '1px solid var(--neu-border)' }}>
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-bold text-neu-text-primary mb-2"
                    >
                      {event.title}
                    </Dialog.Title>
                    <div className="text-sm text-neu-text-primary/70">
                      {event.date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-neu-surface transition-colors touch-manipulation"
                    aria-label="Close modal"
                  >
                    <MdClose className="w-6 h-6 text-neu-text-primary" />
                  </button>
                </div>

                {/* Event Details */}
                <div className="space-y-4 mb-6">
                  {/* Time */}
                  {event.startTime && event.endTime && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-neu-surface/50">
                      <MdAccessTime className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-neu-text-primary/70 mb-1">
                          Time
                        </div>
                        <div className="text-base font-semibold text-neu-text-primary">
                          {event.startTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {event.endTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-neu-surface/50">
                      <MdLocationOn className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neu-text-primary/70 mb-1">
                          Location
                        </div>
                        <a
                          href={getGoogleMapsLink(event.location)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-semibold text-neu-accent-primary hover:text-neu-accent-secondary underline decoration-dotted underline-offset-2 transition-colors"
                        >
                          {event.location}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {event.notes && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-neu-surface/50">
                      <MdEventNote className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neu-text-primary/70 mb-1">
                          Notes
                        </div>
                        <div className="text-base text-neu-text-primary whitespace-pre-wrap">
                          {event.notes}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agenda Items */}
                {hasAgendaItems && (
                  <div>
                    <h4 className="text-lg font-bold text-neu-text-primary mb-3 flex items-center gap-2">
                      <span className="text-amber-500">📋</span>
                      Agenda
                    </h4>
                    <div className="space-y-2">
                      {event.agendaItems!.map((item) => (
                        <div
                          key={item.rehearsal_agenda_items_id}
                          className="p-4 rounded-lg bg-neu-surface border border-neu-border hover:border-amber-500/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h5 className="font-semibold text-neu-text-primary mb-1">
                                {item.title}
                              </h5>
                              {item.description && (
                                <p className="text-sm text-neu-text-primary/70 mb-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-medium text-neu-text-primary/60 mb-0.5">
                                Time
                              </div>
                              <div className="text-sm font-semibold text-amber-500">
                                {formatTimeString(item.start_time)} - {formatTimeString(item.end_time)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Agenda Items Message */}
                {!hasAgendaItems && (
                  <div className="text-center py-6 text-neu-text-primary/60">
                    <p className="text-sm">No agenda items have been added yet.</p>
                    <p className="text-xs mt-1">This is a full cast call.</p>
                  </div>
                )}

                {/* Close Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-lg bg-neu-surface hover:bg-neu-surface-hover border border-neu-border text-neu-text-primary font-medium transition-colors touch-manipulation"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
