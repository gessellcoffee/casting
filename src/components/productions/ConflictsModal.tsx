'use client';

import { MdClose, MdWarning, MdPerson, MdAccessTime } from 'react-icons/md';
import Avatar from '@/components/shared/Avatar';

interface ConflictingEvent {
  type: string;
  title: string;
}

interface ConflictAssignment {
  agenda_assignments_id: string;
  status: string;
  conflict_note?: string;
  conflicting_events?: ConflictingEvent[];
  user_id: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
}

interface AgendaItemWithConflicts {
  rehearsal_agenda_items_id: string;
  title: string;
  start_time: string;
  end_time: string;
  conflicts: ConflictAssignment[];
}

interface ConflictsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendaItems: AgendaItemWithConflicts[];
  formatTimeString: (timeString: string) => string;
  onAvatarClick?: (userId: string) => void;
}

export default function ConflictsModal({
  isOpen,
  onClose,
  agendaItems,
  formatTimeString,
  onAvatarClick,
}: ConflictsModalProps) {
  if (!isOpen) return null;

  const totalConflicts = agendaItems.reduce((sum, item) => sum + item.conflicts.length, 0);

  return (
    <div className="neu-modal-overlay" onClick={onClose}>
      <div className="neu-modal neu-modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MdWarning className="w-7 h-7 text-yellow-500" />
            <h2 className="text-2xl font-bold text-neu-text-primary">
              Rehearsal Conflicts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="neu-icon-btn"
            aria-label="Close"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-neu-text-primary font-medium">
            {totalConflicts === 0
              ? 'No conflicts reported for this rehearsal'
              : `${totalConflicts} conflict${totalConflicts === 1 ? '' : 's'} reported across ${agendaItems.length} agenda item${agendaItems.length === 1 ? '' : 's'}`
            }
          </p>
        </div>

        {/* Conflicts List */}
        {totalConflicts === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-neu-text-secondary text-lg">
              All cast members are available for this rehearsal
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {agendaItems.map((item) => (
              <div key={item.rehearsal_agenda_items_id} className="neu-card-raised p-4">
                {/* Agenda Item Header */}
                <div className="flex items-start gap-3 mb-3">
                  <MdAccessTime className="w-5 h-5 text-neu-accent-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-neu-text-primary mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-neu-text-secondary">
                      {formatTimeString(item.start_time)} - {formatTimeString(item.end_time)}
                    </p>
                  </div>
                  <span className="neu-badge-warning">
                    {item.conflicts.length} conflict{item.conflicts.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Cast Members with Conflicts */}
                <div className="space-y-2 ml-8">
                  {item.conflicts.map((conflict) => (
                    <div
                      key={conflict.agenda_assignments_id}
                      className="p-3 rounded-lg bg-neu-surface-light border border-neu-border"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <Avatar
                          src={conflict.profiles.profile_photo_url}
                          alt={`${conflict.profiles.first_name} ${conflict.profiles.last_name}`}
                          size="md"
                          onClick={onAvatarClick ? () => onAvatarClick(conflict.user_id) : undefined}
                        />

                        {/* Cast Member Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <MdPerson className="w-4 h-4 text-neu-text-secondary flex-shrink-0" />
                            <span className="font-medium text-neu-text-primary">
                              {conflict.profiles.first_name} {conflict.profiles.last_name}
                            </span>
                          </div>
                          {/* Show list of conflicting events */}
                          {conflict.conflicting_events && conflict.conflicting_events.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-neu-text-secondary mb-1">
                                Conflicts with:
                              </p>
                              <ul className="space-y-1">
                                {conflict.conflicting_events.map((event, idx) => (
                                  <li key={idx} className="text-sm text-neu-text-primary flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                    <span className="font-medium">{event.type}:</span>
                                    <span>{event.title}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Fallback to conflict note if no structured events */}
                          {(!conflict.conflicting_events || conflict.conflicting_events.length === 0) && conflict.conflict_note && (
                            <p className="text-sm text-neu-text-secondary italic mt-2">
                              "{conflict.conflict_note}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="neu-button-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
