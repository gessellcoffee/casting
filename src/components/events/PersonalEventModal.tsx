'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Edit, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import type { CalendarEvent } from '@/lib/supabase/types';
import { deleteEvent } from '@/lib/supabase/events';
import Button from '../Button';

interface PersonalEventModalProps {
  event: CalendarEvent;
  userId: string;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: (event: CalendarEvent) => void;
}

export default function PersonalEventModal({
  event,
  userId,
  onClose,
  onDelete,
  onEdit,
}: PersonalEventModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const startTime = new Date(event.start);
  const endTime = new Date(event.end);
  const isRecurringInstance = event._isInstance;
  const originalEventId = event._originalEventId || event.id;

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      // Delete the original event (this will delete all instances for recurring events)
      await deleteEvent(originalEventId, userId);
      
      if (onDelete) {
        onDelete();
      }
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      // Pass the original event for editing, not the instance
      onEdit({
        ...event,
        id: originalEventId,
      });
    }
  };

  return (
    <Transition appear show={true} as={Fragment}>
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
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-semibold text-neu-text-primary mb-1"
                    >
                      {event.title}
                    </Dialog.Title>
                    {isRecurringInstance && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#5a8ff5]/20 border border-[#5a8ff5]/50 text-[#5a8ff5]">
                        🔁 Recurring Event
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className=" text-neu-text-primary/60 hover:text-neu-text-primary transition-colors"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Event Details */}
                <div className="space-y-4">
                  {/* Date and Time */}
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-neu-text-primary/60 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-neu-text-primary">
                        {startTime.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-sm text-neu-text-primary/70 mt-1 space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {startTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {endTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-neu-text-primary/60 mt-0.5" />
                      <div className="text-sm text-neu-text-primary">
                        {event.location}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {event.description && (
                    <div className="pt-2 border-t border-neu-border">
                      <p className="text-sm text-neu-text-primary/70 whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>
                  )}

                  {/* Recurrence Info */}
                  {event.isRecurring && event.recurrenceRule && (
                    <div className="pt-2 border-t border-neu-border">
                      <div className="text-sm text-neu-text-primary/70">
                        <span className="font-medium text-neu-text-primary">Repeats:</span>{' '}
                        {event.recurrenceRule.frequency}
                        {event.recurrenceRule.interval > 1 &&
                          ` (every ${event.recurrenceRule.interval})`}
                        {event.recurrenceRule.until && (
                          <span>
                            {' '}
                            until{' '}
                            {new Date(event.recurrenceRule.until).toLocaleDateString()}
                          </span>
                        )}
                        {event.recurrenceRule.count && (
                          <span> for {event.recurrenceRule.count} occurrences</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-500 mb-3">
                      {isRecurringInstance
                        ? 'This will delete all occurrences of this recurring event. Are you sure?'
                        : 'Are you sure you want to delete this event?'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        title="Delete"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="neu-button-primary flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                      </Button>
                      <Button
                        title="Cancel"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="flex-1 px-3 py-2 bg-neu-surface text-neu-text-primary text-sm font-medium rounded-md border border-neu-border hover:bg-neu-surface/70 disabled:opacity-50 transition-colors"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!showDeleteConfirm && (
                  <div className="mt-6 flex gap-3">
                    <Button
                      text="Edit"
                      variant="primary"
                      onClick={handleEdit}
                      className='w-full'
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      text="Delete"
                      variant="danger"
                      onClick={() => setShowDeleteConfirm(true)}
                      className='w-full'
                    />
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
