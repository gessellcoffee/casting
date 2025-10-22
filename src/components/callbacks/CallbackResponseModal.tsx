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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#c5ddff] mb-2">
            {isAccept ? 'Accept Callback' : 'Decline Callback'}
          </h2>
          {callbackDetails && (
            <div className="text-sm text-[#c5ddff]/70 space-y-1">
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
            <label className="block text-sm font-medium text-[#c5ddff] mb-2">
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
              className="w-full px-4 py-3 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] placeholder-[#c5ddff]/30 focus:outline-none focus:border-[#5a8ff5] resize-none shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
            />
            <p className="text-xs text-[#c5ddff]/50 mt-2">
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
              className="flex-1 px-6 py-3 rounded-lg border border-[#4a7bd9]/20 text-[#c5ddff] hover:bg-[#2e3e5e]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-6 py-3 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] ${
                isAccept
                  ? 'bg-[#5a8ff5] hover:bg-[#4a7bd9]'
                  : 'bg-[#2e3e5e] hover:bg-[#26364e] border border-[#4a7bd9]/30'
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
  );
}
