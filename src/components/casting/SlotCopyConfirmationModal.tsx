'use client';

import { useState } from 'react';
import { formatUSDate, formatUSTime } from '@/lib/utils/dateUtils';
import Button from '../Button';

interface AffectedUser {
  user_id: string;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  slot: {
    slot_id: string;
    start_time: string;
    end_time: string;
  } | null;
}

interface SlotCopyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customMessage: string) => void;
  targetDaysCount: number;
  slotsToCopyCount: number;
  slotsToDeleteCount: number;
  affectedUsers: AffectedUser[];
  isReplacing: boolean;
}

export default function SlotCopyConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  targetDaysCount,
  slotsToCopyCount,
  slotsToDeleteCount,
  affectedUsers,
  isReplacing,
}: SlotCopyConfirmationModalProps) {
  const [customMessage, setCustomMessage] = useState('');
  const [showAffectedUsers, setShowAffectedUsers] = useState(false);

  if (!isOpen) return null;

  const uniqueUsers = Array.from(
    new Map(affectedUsers.map(u => [u.user_id, u])).values()
  );

  const handleConfirm = () => {
    onConfirm(customMessage.trim());
  };

  return (
    <div className="neu-modal-overlay" style={{ zIndex: 10002 }} onClick={onClose}>
      <div 
        className="neu-modal neu-modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-neu-text-primary mb-4">
          Confirm Slot Copy
        </h3>

        {/* Summary */}
        <div className="mb-6 space-y-3">
          <div className="p-3 rounded-lg bg-neu-surface/50 border border-neu-border">
            <div className="text-sm text-neu-text-primary/70 mb-1">Target Days</div>
            <div className="text-lg font-semibold text-neu-text-primary">{targetDaysCount} day{targetDaysCount !== 1 ? 's' : ''}</div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-400/30">
            <div className="text-sm text-neu-text-primary/70 mb-1">Slots to Copy</div>
            <div className="text-lg font-semibold text-blue-400">{slotsToCopyCount} slot{slotsToCopyCount !== 1 ? 's' : ''}</div>
          </div>

          {isReplacing && slotsToDeleteCount > 0 && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-400/30">
              <div className="text-sm text-neu-text-primary/70 mb-1">Slots to Delete</div>
              <div className="text-lg font-semibold text-red-400">{slotsToDeleteCount} slot{slotsToDeleteCount !== 1 ? 's' : ''}</div>
            </div>
          )}

          {affectedUsers.length > 0 && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-400/30">
              <div className="text-sm text-neu-text-primary/70 mb-1">Users to Notify</div>
              <div className="text-lg font-semibold text-yellow-400">{uniqueUsers.length} user{uniqueUsers.length !== 1 ? 's' : ''}</div>
              
              <Button
                onClick={() => setShowAffectedUsers(!showAffectedUsers)}
                variant="secondary"
                text={showAffectedUsers ? '− Hide affected users' : '+ Show affected users'}
              />

              {showAffectedUsers && (
                <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                  {affectedUsers.map((affected, idx) => {
                    const userName = affected.user
                      ? `${affected.user.first_name || ''} ${affected.user.last_name || ''}`.trim() || affected.user.email
                      : 'Unknown User';
                    
                    const slotTime = affected.slot
                      ? `${formatUSDate(new Date(affected.slot.start_time))} at ${formatUSTime(new Date(affected.slot.start_time))}`
                      : 'Unknown time';

                    return (
                      <div key={idx} className="text-xs text-neu-text-primary/70 p-2 bg-neu-surface/30 rounded">
                        <div className="font-medium">{userName}</div>
                        <div className="text-[10px] text-neu-text-primary/50">{slotTime}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Custom Message */}
        {affectedUsers.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add any additional context for affected users..."
              rows={3}
              className="neu-input w-full resize-y text-sm"
            />
            <p className="text-xs text-neu-text-primary/60 mt-1">
              This message will be included in the notification sent to users whose slots are being cancelled.
            </p>
          </div>
        )}

        {/* Warning */}
        {affectedUsers.length > 0 && (
          <div className="mb-6 p-3 rounded-lg bg-yellow-500/10 border border-yellow-400/30">
            <p className="text-xs text-neu-text-primary/70">
              <span className="font-medium text-yellow-400">⚠ Note:</span> Affected users will receive an email and in-app notification about their cancelled slots.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onClose}
            variant="secondary"
            text="Cancel"
          />
          <Button
            onClick={handleConfirm}
            variant="primary"
            text={`Confirm & ${affectedUsers.length > 0 ? 'Notify' : 'Copy'}`}
          />
        </div>
      </div>
    </div>
  );
}
