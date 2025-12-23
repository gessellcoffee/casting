'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose, MdLocationOn, MdAccessTime, MdEventNote, MdTheaters, MdPeople } from 'react-icons/md';
import type { ProductionDateEvent } from '@/lib/utils/calendarEvents';

interface ProductionEventModalProps {
  event: ProductionDateEvent;
  onClose: () => void;
}

// Generate Google Maps link from address
const getGoogleMapsLink = (address: string): string => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};

export default function ProductionEventModal({ event, onClose }: ProductionEventModalProps) {
  const eventColor = event.eventTypeColor || '#5a8ff5';

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

                {/* Event Type Badge */}
                <div className="mb-6">
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: `${eventColor}20`, 
                      color: eventColor,
                      border: `1px solid ${eventColor}40`
                    }}
                  >
                    <span>📌</span>
                    {event.eventTypeName || 'Production Event'}
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-4 mb-6">
                  {/* Show Information */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-neu-surface/50">
                    <MdTheaters className="w-5 h-5 mt-0.5 shrink-0" style={{ color: eventColor }} />
                    <div>
                      <div className="text-sm font-medium text-neu-text-primary/70 mb-1">
                        Production
                      </div>
                      <div className="text-base font-semibold text-neu-text-primary">
                        {event.show?.title || 'Unknown Show'}
                      </div>
                      {event.show?.author && (
                        <div className="text-sm text-neu-text-primary/60">
                          by {event.show.author}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  {event.startTime && event.endTime && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-neu-surface/50">
                      <MdAccessTime className="w-5 h-5 mt-0.5 shrink-0" style={{ color: eventColor }} />
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
                      <MdLocationOn className="w-5 h-5 mt-0.5 shrink-0" style={{ color: eventColor }} />
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

                  {/* Who is Called */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-neu-surface/50">
                    <MdPeople className="w-5 h-5 mt-0.5 shrink-0" style={{ color: eventColor }} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neu-text-primary/70 mb-1">
                        Who is Called
                      </div>
                      <div className="text-base font-semibold text-neu-text-primary">
                        {event.userRole === 'cast' ? (
                          event.role ? `${event.role} Cast` : 'Cast Member'
                        ) : (
                          'Full Company'
                        )}
                      </div>
                      <div className="text-sm text-neu-text-primary/60 mt-1">
                        {event.userRole === 'cast' 
                          ? 'You are called for this event'
                          : 'All cast and crew members'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Notes/Description */}
                  {(event as any).notes && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-neu-surface/50">
                      <MdEventNote className="w-5 h-5 mt-0.5 shrink-0" style={{ color: eventColor }} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neu-text-primary/70 mb-1">
                          Notes
                        </div>
                        <div className="text-base text-neu-text-primary whitespace-pre-wrap">
                          {(event as any).notes}
                        </div>
                      </div>
                    </div>
                  )}

                  {event.description && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-neu-surface/50">
                      <MdEventNote className="w-5 h-5 mt-0.5 shrink-0" style={{ color: eventColor }} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neu-text-primary/70 mb-1">
                          Description
                        </div>
                        <div className="text-base text-neu-text-primary whitespace-pre-wrap">
                          {event.description}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Event Type Information */}
                <div className="bg-neu-surface/30 rounded-lg p-4 mb-6">
                  <div className="text-sm text-neu-text-primary/70">
                    <p className="mb-2">
                      <strong>Event Type:</strong> {event.eventTypeName || 'Production Event'}
                    </p>
                    <p>
                      This is a production-related event that may involve cast, crew, or other team members.
                      Please arrive on time and prepared according to any specific instructions provided.
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-end">
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
