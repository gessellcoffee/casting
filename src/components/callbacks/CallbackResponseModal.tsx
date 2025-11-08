'use client';

import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface CallbackResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  responseType: 'accept' | 'decline';
  callbackDetails?: {
    showTitle?: string;
    date?: string;
    time?: string;
    location?: string;
  };
  isSubmitting?: boolean;
}

export default function CallbackResponseModal({
  isOpen,
  onClose,
  onConfirm,
  responseType,
  callbackDetails,
  isSubmitting = false,
}: CallbackResponseModalProps) {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(comment);
  };

  const isAccept = responseType === 'accept';

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="neu-card-raised w-full max-w-lg transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="mb-6">
                  <Dialog.Title
                    as="h2"
                    className="text-2xl font-bold text-neu-text-primary mb-2"
                  >
                    {isAccept ? 'Accept Callback' : 'Decline Callback'}
                  </Dialog.Title>
                  {callbackDetails && (
                    <Dialog.Description className="text-sm text-neu-text-primary/70 space-y-1">
                      {callbackDetails.showTitle && (
                        <p className="font-semibold">{callbackDetails.showTitle}</p>
                      )}
                      {callbackDetails.date && (
                        <p>📅 {callbackDetails.date}</p>
                      )}
                      {callbackDetails.time && (
                        <p>⏰ {callbackDetails.time}</p>
                      )}
                      {callbackDetails.location && (
                        <p>📍 {callbackDetails.location}</p>
                      )}
                    </Dialog.Description>
                  )}
                </div>

        {/* Form */}
                <form onSubmit={handleSubmit}>
                  {/* Comment Field */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-neu-text-primary mb-2">
                      {isAccept ? 'Add a message (optional)' : 'Reason for declining (optional)'}
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        isAccept
                          ? "e.g., Looking forward to it! I'll prepare the requested material."
                          : "e.g., I have a scheduling conflict. Thank you for considering me."
                      }
                      rows={4}
                      className="neu-input resize-none"
                    />
                    <p className="text-xs text-neu-text-primary/50 mt-2">
                      {isAccept
                        ? 'Let the casting director know you\'re excited!'
                        : 'Help the casting director understand your situation.'}
                    </p>
                  </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="n-button-secondary flex-1"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 ${
                      isAccept
                        ? 'n-button-primary'
                        : 'n-button-secondary'
                    }`}
                  >
                    {isSubmitting
                      ? isAccept
                        ? 'Accepting...'
                        : 'Declining...'
                      : isAccept
                      ? 'Confirm Acceptance'
                      : 'Confirm Decline'}
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
