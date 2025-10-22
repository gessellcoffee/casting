'use client';

import { useState } from 'react';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="mt-4 sm:mt-20 bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#9b87f5]/30 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border-b border-[#9b87f5]/20 p-4 sm:p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl sm:text-2xl">📋</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#9b87f5]">
                Callback
              </h2>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-[#c5ddff] mb-1">
              {show?.title || 'Unknown Show'}
            </h3>
            {show?.author && (
              <p className="text-[#c5ddff]/70">by {show.author}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#2e3e5e]/50 border border-[#9b87f5]/20 text-[#c5ddff] hover:text-[#9b87f5] hover:border-[#9b87f5]/40 transition-all duration-200"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MdCalendarToday className="w-5 h-5 text-[#9b87f5] mt-1" />
              <div>
                <div className="text-sm text-[#c5ddff]/70 mb-1">Date</div>
                <div className="text-[#c5ddff] font-medium">
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
              <MdAccessTime className="w-5 h-5 text-[#9b87f5] mt-1" />
              <div>
                <div className="text-sm text-[#c5ddff]/70 mb-1">Time</div>
                <div className="text-[#c5ddff] font-medium">
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
                <MdLocationOn className="w-5 h-5 text-[#9b87f5] mt-1" />
                <div>
                  <div className="text-sm text-[#c5ddff]/70 mb-1">Location</div>
                  <div className="text-[#c5ddff] font-medium">
                    {slot.location}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Callback Notes */}
          {slot.notes && (
            <div className="p-4 rounded-lg bg-[#9b87f5]/10 border border-[#9b87f5]/30 shadow-[inset_2px_2px_5px_rgba(155,135,245,0.1)]">
              <h4 className="text-sm font-semibold text-[#9b87f5] mb-2">Callback Notes</h4>
              <p className="text-[#c5ddff] text-sm whitespace-pre-wrap">
                {slot.notes}
              </p>
            </div>
          )}

          {/* Your Comment */}
          {callback.actor_comment && (
            <div className="p-4 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark)]">
              <h4 className="text-sm font-semibold text-[#c5ddff]/70 mb-2">Your Comment</h4>
              <p className="text-[#c5ddff] text-sm whitespace-pre-wrap">
                {callback.actor_comment}
              </p>
            </div>
          )}

          {/* Show Information */}
          {show && (
            <div className="pt-6 border-t border-[#9b87f5]/20">
              <div className="flex items-start gap-3 mb-4">
                <MdTheaters className="w-5 h-5 text-[#9b87f5] mt-1" />
                <div>
                  <div className="text-sm text-[#c5ddff]/70 mb-1">Production</div>
                  <div className="text-[#c5ddff] font-medium">
                    {show.title}
                    {show.author && <span className="text-[#c5ddff]/70"> by {show.author}</span>}
                  </div>
                </div>
              </div>

              {show.description && (
                <div className="text-sm text-[#c5ddff]/80 mt-3">
                  {show.description}
                </div>
              )}
            </div>
          )}

          {/* Status Badge and Actions */}
          <div className="flex flex-col items-center gap-3 sm:gap-4 pt-4">
            <div className="px-3 sm:px-4 py-2 rounded-full bg-[#9b87f5]/20 border border-[#9b87f5]/30 text-[#9b87f5] font-semibold shadow-[inset_1px_1px_3px_rgba(155,135,245,0.1)] text-sm sm:text-base">
              ✓ Callback Accepted
            </div>
            
            {/* Change Response Button */}
            <button
              onClick={() => setShowChangeModal(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff]/70 hover:text-[#c5ddff] hover:border-[#4a7bd9]/40 transition-all text-sm shadow-[2px_2px_5px_var(--cosmic-shadow-dark),-2px_-2px_5px_var(--cosmic-shadow-light)]"
            >
              Change Response to Declined
            </button>
          </div>
        </div>
      </div>

      {/* Change Response Confirmation Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/30 rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#c5ddff] mb-2">
              Decline Callback?
            </h3>
            <p className="text-[#c5ddff]/70 mb-4 text-sm">
              Are you sure you want to change your response to declined? The casting director will be notified.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Comment Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#c5ddff] mb-2">
                Reason for declining (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g., I have a scheduling conflict. Thank you for considering me."
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] placeholder-[#c5ddff]/30 focus:outline-none focus:border-[#5a8ff5] resize-none shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowChangeModal(false);
                  setComment('');
                  setError(null);
                }}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 rounded-lg border border-[#4a7bd9]/20 text-[#c5ddff] hover:bg-[#2e3e5e]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 rounded-lg bg-[#2e3e5e] border border-[#4a7bd9]/30 text-[#c5ddff] hover:bg-[#26364e] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark)]"
              >
                {isUpdating ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
