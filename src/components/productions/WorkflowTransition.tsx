'use client';

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { WorkflowStatus } from '@/lib/supabase/workflowStatus';
import { 
  updateWorkflowStatus, 
  getWorkflowStatusInfo, 
  getAvailableTransitions 
} from '@/lib/supabase/workflowStatus';
import WorkflowStatusBadge from './WorkflowStatusBadge';
import Button from '@/components/Button';
import { MdArrowForward, MdCheck, MdClose } from 'react-icons/md';

interface WorkflowTransitionProps {
  auditionId: string;
  currentStatus: WorkflowStatus;
  onStatusChange?: (newStatus: WorkflowStatus) => void;
}

/**
 * WorkflowTransition Component
 * Allows production team to change workflow status with confirmation
 */
export default function WorkflowTransition({
  auditionId,
  currentStatus,
  onStatusChange,
}: WorkflowTransitionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTransitions = getAvailableTransitions(currentStatus);

  const handleStatusSelect = (status: WorkflowStatus) => {
    setSelectedStatus(status);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selectedStatus) return;

    setIsUpdating(true);
    setError(null);

    const { data, error: updateError } = await updateWorkflowStatus(
      auditionId,
      selectedStatus
    );

    setIsUpdating(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    // Success
    setIsOpen(false);
    setSelectedStatus(null);
    if (onStatusChange) {
      onStatusChange(selectedStatus);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSelectedStatus(null);
    setError(null);
  };

  return (
    <>
      {/* Current Status Display */}
      <div className="flex items-center gap-3">
        <WorkflowStatusBadge status={currentStatus} />
        <Button
          onClick={() => setIsOpen(true)}
          text="Change Status"
          className="neu-button-secondary text-sm"
        />
      </div>

      {/* Transition Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCancel}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className="neu-card-raised max-w-2xl w-full p-6 transform transition-all"
                  style={{
                    background: 'var(--neu-surface)',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-2xl font-bold text-neu-text-primary">
                      Change Workflow Status
                    </Dialog.Title>
                    <button
                      onClick={handleCancel}
                      className="p-2 rounded-lg hover:bg-neu-surface-light transition-colors"
                    >
                      <MdClose className="w-6 h-6 text-neu-text-secondary" />
                    </button>
                  </div>

                  {/* Current Status */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-neu-text-secondary mb-2">
                      Current Status
                    </label>
                    <WorkflowStatusBadge status={currentStatus} showDescription />
                  </div>

                  {/* Available Transitions */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-neu-text-secondary mb-3">
                      Select New Status
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableTransitions.map((status) => {
                        const info = getWorkflowStatusInfo(status);
                        const isSelected = selectedStatus === status;

                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusSelect(status)}
                            className={`
                              p-4 rounded-xl border-2 transition-all text-left
                              ${
                                isSelected
                                  ? 'border-neu-accent-primary bg-neu-accent-primary/10'
                                  : 'border-neu-border hover:border-neu-accent-primary/50'
                              }
                            `}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-semibold text-neu-text-primary mb-1">
                                  {info.label}
                                </div>
                                <div className="text-sm text-neu-text-secondary">
                                  {info.description}
                                </div>
                              </div>
                              {isSelected && (
                                <MdCheck className="w-5 h-5 text-neu-accent-primary flex-shrink-0 mt-0.5" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Confirmation Message */}
                  {selectedStatus && (
                    <div className="mb-6 p-4 rounded-lg bg-neu-surface-light border border-neu-border">
                      <div className="flex items-center gap-3 text-sm text-neu-text-primary">
                        <MdArrowForward className="w-5 h-5 text-neu-accent-primary" />
                        <span>
                          This will change the production status from{' '}
                          <strong>{getWorkflowStatusInfo(currentStatus).label}</strong> to{' '}
                          <strong>{getWorkflowStatusInfo(selectedStatus).label}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 justify-end">
                    <Button
                      onClick={handleCancel}
                      text="Cancel"
                      className="neu-button-secondary"
                      disabled={isUpdating}
                    />
                    <Button
                      onClick={handleConfirm}
                      text={isUpdating ? 'Updating...' : 'Confirm Change'}
                      className="neu-button-primary"
                      disabled={!selectedStatus || isUpdating}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
