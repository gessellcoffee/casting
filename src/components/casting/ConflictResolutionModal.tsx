'use client';

import Button from "../Button";

interface ConflictResolutionModalProps {
  isOpen: boolean;
  conflictCount: number;
  onReplace: () => void;
  onAllowOverlapping: () => void;
  onCancel: () => void;
}

export default function ConflictResolutionModal({
  isOpen,
  conflictCount,
  onReplace,
  onAllowOverlapping,
  onCancel,
}: ConflictResolutionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="neu-modal-overlay" style={{ zIndex: 10001 }} onClick={onCancel}>
      <div 
        className="neu-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-neu-text-primary mb-4">
          Conflicting Slots Detected
        </h3>

        <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-400/30">
          <p className="text-sm text-neu-text-primary mb-2">
            <span className="font-medium text-yellow-400">⚠ Warning:</span> {conflictCount} slot{conflictCount !== 1 ? 's' : ''} with overlapping times detected on the selected days.
          </p>
          <p className="text-xs text-neu-text-primary/70">
            Choose how you want to handle these conflicts:
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {/* Replace Option */}
          <button
            onClick={onReplace}
            className="w-full p-4 rounded-lg border-2 border-neu-border hover:border-red-400/50 bg-neu-surface hover:bg-red-500/5 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-neu-border group-hover:border-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-red-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-neu-text-primary mb-1">
                  Replace Conflicting Slots
                </div>
                <div className="text-xs text-neu-text-primary/60">
                  Delete existing slots that overlap with the new times and paste the new slots. Users signed up for deleted slots will be notified.
                </div>
              </div>
            </div>  
          </button>

          {/* Allow Overlapping Option */}
          <button
            onClick={onAllowOverlapping}
            className="w-full p-4 rounded-lg border-2 border-neu-border hover:border-blue-400/50 bg-neu-surface hover:bg-blue-500/5 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-neu-border group-hover:border-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-neu-text-primary mb-1">
                  Allow Overlapping Slots
                </div>
                <div className="text-xs text-neu-text-primary/60">
                  Keep existing slots and add the new slots anyway. This will create overlapping time slots on the calendar.
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <Button
          onClick={onCancel}
          variant="secondary"
          text="Cancel"
        />
      </div>
    </div>
  );
}
