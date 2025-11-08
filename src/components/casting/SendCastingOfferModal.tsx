'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';

interface SendCastingOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  defaultMessage: string;
  roleName: string;
  actorName: string;
  isSubmitting: boolean;
}

export default function SendCastingOfferModal({
  isOpen,
  onClose,
  onConfirm,
  defaultMessage,
  roleName,
  actorName,
  isSubmitting,
}: SendCastingOfferModalProps) {
  const [message, setMessage] = useState(defaultMessage);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(message);
  };

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
              <Dialog.Panel className="neu-card-raised w-full max-w-2xl transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <Dialog.Title
                        as="h2"
                        className="text-2xl font-bold text-neu-text-primary"
                      >
                        Send Casting Offer
                      </Dialog.Title>
                      <Dialog.Description className="text-neu-text-primary/70 mt-1">
                        Sending offer to <span className="font-semibold">{actorName}</span> for <span className="font-semibold">{roleName}</span>
                      </Dialog.Description>
                    </div>
                    <button
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="text-neu-text-primary/50 hover:text-neu-text-primary transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="offer-message" className="block text-sm font-medium text-neu-text-primary mb-2">
                        Offer Message
                      </label>
                      <textarea
                        id="offer-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isSubmitting}
                        rows={8}
                        className="w-full px-4 py-3 bg-neu-surface border border-neu-border rounded-lg text-neu-text-primary placeholder-neu-text-primary/40 focus:outline-none focus:border-neu-border-focus transition-colors disabled:opacity-50 resize-none"
                        placeholder="Enter your message..."
                        required
                      />
                      <p className="text-xs text-neu-text-primary/50 mt-2">
                        This message will be included with the casting offer notification.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-neu-border text-neu-text-primary hover:bg-neu-surface/50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !message.trim()}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Offer'}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
