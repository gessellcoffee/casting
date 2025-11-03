'use client';

import React, { useState } from 'react';
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="neu-card-raised rounded-xl bg-neu-surface border border-neu-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neu-text-primary">Send Casting Offer</h2>
              <p className="text-neu-text-primary/70 mt-1">
                Sending offer to <span className="font-semibold">{actorName}</span> for <span className="font-semibold">{roleName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-neu-text-primary/50 hover:text-neu-text-primary transition-colors disabled:opacity-50"
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
      </div>
    </div>
  );
}
