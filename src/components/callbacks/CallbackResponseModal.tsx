'use client';

import { useState } from 'react';

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
    <div 
      className="bg-black/60 backdrop-blur-sm overflow-y-auto"
      style={{ 
        position: 'fixed',
        top: '0px', 
        left: '0px', 
        right: '0px', 
        bottom: '0px',
        height: '100vh', 
        width: '100vw',
        zIndex: 10000,
        margin: 0,
        padding: 0
      }}
    >
      <div 
        className="flex items-center justify-center"
        style={{ minHeight: '100vh', padding: '1rem' }}
      >
        <div 
          className="w-full max-w-lg rounded-xl bg-white/98 backdrop-blur-md border border-neu-border/60 shadow-2xl p-6" 
          style={{ position: 'relative', margin: '2rem 0' }}
        >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neu-text-primary mb-2">
            {isAccept ? 'Accept Callback' : 'Decline Callback'}
          </h2>
          {callbackDetails && (
            <div className="text-sm text-neu-text-primary/70 space-y-1">
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
            </div>
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
              onClick={onClose}
              disabled={isSubmitting}
              className="n-button-secondary flex-1"
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
        </div>
      </div>
    </div>
  );
}
