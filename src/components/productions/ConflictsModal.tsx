'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose, MdWarning, MdPerson, MdAccessTime } from 'react-icons/md';
import Avatar from '@/components/shared/Avatar';

interface ConflictingEvent {
  type: string;
  title: string;
  start_time: string;
  end_time: string;
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
  title?: string;
  agendaItems: AgendaItemWithConflicts[];
  formatTimeString: (timeString: string) => string;
  onAvatarClick?: (userId: string) => void;
}

export default function ConflictsModal({
  isOpen,
  onClose,
  title = 'Rehearsal Conflicts',
  agendaItems,
  formatTimeString,
  onAvatarClick,
}: ConflictsModalProps) {
  const totalConflicts = agendaItems.reduce((sum, item) => sum + item.conflicts.length, 0);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[10000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0" style={{ backgroundColor: 'rgba(10, 14, 39, 0.85)' }} />
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
              <Dialog.Panel className="neu-modal neu-modal-lg text-left">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <MdWarning className="w-7 h-7 text-yellow-500" />
                    <Dialog.Title as="h2" className="text-2xl font-bold text-neu-text-primary">
                      {title}
                    </Dialog.Title>
                  </div>
                  <button onClick={onClose} className="neu-icon-btn" aria-label="Close">
                    <MdClose className="w-5 h-5" />
                  </button>
                </div>

                {/* Summary */}
                <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-neu-text-primary font-medium">
                    {totalConflicts === 0
                      ? 'No conflicts reported for this rehearsal'
                      : `${totalConflicts} conflict${totalConflicts === 1 ? '' : 's'} reported across ${agendaItems.length} agenda item${agendaItems.length === 1 ? '' : 's'}`}
                  </p>
                </div>

                {/* Conflicts List */}
                {totalConflicts === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                      <svg
                        className="w-8 h-8 text-green-600 dark:text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-neu-text-secondary text-lg">All cast members are available for this rehearsal</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {agendaItems.map((item) => (
                      <div key={item.rehearsal_agenda_items_id} className="neu-card-raised p-4">
                        {/* Agenda Item Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <MdAccessTime className="w-5 h-5 text-neu-accent-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-neu-text-primary mb-1">{item.title}</h3>
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
                                  {/* Generic conflict message - privacy protected */}
                                  <div className="mt-2 space-y-1">
                                    {conflict.conflicting_events?.map((event, index) => (
                                      <div key={index} className="text-sm text-neu-text-secondary flex flex-col">
                                        <span className="font-medium">Busy</span>
                                        <span className="text-xs opacity-75">
                                          {formatTimeString(event.start_time)} - {formatTimeString(event.end_time)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
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
                  <button onClick={onClose} className="neu-button-secondary">
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
