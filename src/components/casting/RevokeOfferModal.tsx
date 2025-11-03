'use client';

import React, { useState } from 'react';
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="neu-card-raised rounded-xl bg-neu-surface border border-neu-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-red-400">Revoke Casting Offer</h2>
              <p className="text-neu-text-primary/70 mt-1">
                Revoking offer to <span className="font-semibold">{actorName}</span> for <span className="font-semibold">{roleName}</span>
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
      </div>
    </div>
  );
}
