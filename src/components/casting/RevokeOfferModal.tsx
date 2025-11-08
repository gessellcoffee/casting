'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';

interface RevokeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  roleName: string;
  actorName: string;
  isSubmitting: boolean;
}

export default function RevokeOfferModal({
  isOpen,
  onClose,
  onConfirm,
  roleName,
  actorName,
  isSubmitting,
}: RevokeOfferModalProps) {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onConfirm(message);
    }
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
                        className="text-2xl font-bold text-red-400"
                      >
                        Revoke Casting Offer
                      </Dialog.Title>
                      <Dialog.Description className="text-neu-text-primary/70 mt-1">
                        Revoking offer to <span className="font-semibold">{actorName}</span> for <span className="font-semibold">{roleName}</span>
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

                  {/* Warning */}
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">
                      ⚠️ This action will notify the actor that their casting offer has been revoked. Please provide a message explaining the reason.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="revoke-message" className="block text-sm font-medium text-neu-text-primary mb-2">
                        Message to the Actor <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        id="revoke-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isSubmitting}
                        rows={6}
                        className="w-full px-4 py-3 bg-neu-surface border border-neu-border rounded-lg text-neu-text-primary placeholder-neu-text-primary/40 focus:outline-none focus:border-neu-border-focus transition-colors disabled:opacity-50 resize-none"
                        placeholder="Please provide a reason for revoking this offer..."
                        required
                      />
                      <p className="text-xs text-neu-text-primary/50 mt-2">
                        This message will be sent to the actor as a notification.
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
                        className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Revoking...' : 'Revoke Offer'}
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
