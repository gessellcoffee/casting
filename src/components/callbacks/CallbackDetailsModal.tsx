'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose, MdCalendarToday, MdAccessTime, MdLocationOn, MdTheaters } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { respondToCallbackInvitation } from '@/lib/supabase/callbackInvitations';

interface CallbackDetailsModalProps {
  callback: any;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function CallbackDetailsModal({ callback, onClose, onUpdate }: CallbackDetailsModalProps) {
  const router = useRouter();
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [comment, setComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slot = callback.callback_slots;
  const startTime = new Date(slot.start_time);
  const endTime = new Date(slot.end_time);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  
  const show = slot?.auditions?.shows;
  const audition = slot?.auditions;

  const handleDecline = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      const { error: updateError } = await respondToCallbackInvitation(
        callback.invitation_id,
        'rejected',
        comment || undefined
      );

      if (updateError) throw updateError;

      // Call onUpdate to refresh the calendar
      if (onUpdate) {
        onUpdate();
      }
      
      // Close both modals
      setShowChangeModal(false);
      onClose();
    } catch (err: any) {
      console.error('Error updating callback response:', err);
      setError(err.message || 'Failed to update response');
    } finally {
      setIsUpdating(false);
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
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
              <Dialog.Panel className="mt-4 sm:mt-20 backdrop-blur-md rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}>
        {/* Header */}
        <div className="sticky top-0 backdrop-blur-md p-4 sm:p-6 flex items-start justify-between" style={{ background: 'var(--neu-surface)', borderBottom: '1px solid var(--neu-border)' }}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl sm:text-2xl">📋</span>
              <h2 className="text-xl sm:text-2xl font-bold text-neu-accent-primary">
                Callback
              </h2>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-neu-text-primary mb-1">
              {show?.title || 'Unknown Show'}
            </h3>
            {show?.author && (
              <p className="text-neu-text-primary/70">by {show.author}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="n-button-secondary p-2 rounded-lg bg-neu-surface-light border border-neu-border text-neu-text-primary hover:text-neu-accent-primary hover:border-neu-border-focus transition-all duration-200"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MdCalendarToday className="w-5 h-5 text-neu-accent-primary mt-1" />
              <div>
                <div className="text-sm text-neu-text-primary/70 mb-1">Date</div>
                <div className="text-neu-text-primary font-medium">
                  {startTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MdAccessTime className="w-5 h-5 text-neu-accent-primary mt-1" />
              <div>
                <div className="text-sm text-neu-text-primary/70 mb-1">Time</div>
                <div className="text-neu-text-primary font-medium">
                  {startTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })} - {endTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })} ({duration} minutes)
                </div>
              </div>
            </div>

            {slot.location && (
              <div className="flex items-start gap-3">
                <MdLocationOn className="w-5 h-5 text-neu-accent-primary mt-1" />
                <div>
                  <div className="text-sm text-neu-text-primary/70 mb-1">Location</div>
                  <div className="text-neu-text-primary font-medium">
                    {slot.location}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Callback Notes */}
          {slot.notes && (
            <div className="p-4 rounded-lg bg-neu-surface-light border border-neu-border shadow-[inset_2px_2px_5px_var(--neu-shadow-dark)]">
              <h4 className="text-sm font-semibold text-neu-accent-primary mb-2">Callback Notes</h4>
              <p className="text-neu-text-primary text-sm whitespace-pre-wrap">
                {slot.notes}
              </p>
            </div>
          )}

          {/* Your Comment */}
          {callback.actor_comment && (
            <div className="p-4 rounded-lg bg-neu-surface-light border border-neu-border shadow-[inset_2px_2px_5px_var(--neu-shadow-dark)]">
              <h4 className="text-sm font-semibold text-neu-text-primary/70 mb-2">Your Comment</h4>
              <p className="text-neu-text-primary text-sm whitespace-pre-wrap">
                {callback.actor_comment}
              </p>
            </div>
          )}

          {/* Show Information */}
          {show && (
            <div className="pt-6 border-t border-neu-border">
              <div className="flex items-start gap-3 mb-4">
                <MdTheaters className="w-5 h-5 text-neu-accent-primary mt-1" />
                <div>
                  <div className="text-sm text-neu-text-primary/70 mb-1">Production</div>
                  <div className="text-neu-text-primary font-medium">
                    {show.title}
                    {show.author && <span className="text-neu-text-primary/70"> by {show.author}</span>}
                  </div>
                </div>
              </div>

              {show.description && (
                <div className="text-sm text-neu-text-primary/80 mt-3">
                  {show.description}
                </div>
              )}
            </div>
          )}

          {/* Status Badge and Actions */}
          <div className="flex flex-col items-center gap-3 sm:gap-4 pt-4">
            <div className="px-3 sm:px-4 py-2 rounded-full bg-neu-accent-primary/20 border border-neu-accent-primary/30 text-neu-accent-primary font-semibold shadow-[inset_1px_1px_3px_var(--neu-shadow-dark)] text-sm sm:text-base">
              ✓ Callback Accepted
            </div>
            
            {/* Change Response Button */}
            <button
              onClick={() => setShowChangeModal(true)}
              className="n-button-danger w-full sm:w-auto px-4 py-2 rounded-lg bg-neu-surface-light border border-neu-border text-neu-text-primary/70 hover:text-neu-text-primary hover:border-neu-border-focus transition-all text-sm shadow-[2px_2px_5px_var(--neu-shadow-dark),-2px_-2px_5px_var(--neu-shadow-light)]"
            >
              Change Response to Declined
            </button>
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
