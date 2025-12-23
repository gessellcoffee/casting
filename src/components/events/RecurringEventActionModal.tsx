'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Edit, Trash2, Calendar, Repeat } from 'lucide-react';
import Button from '../Button';

interface RecurringEventActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditThis: () => void;
  onEditAll: () => void;
  onDeleteThis: () => void;
  onDeleteAll: () => void;
  action: 'edit' | 'delete';
  eventTitle: string;
}

export default function RecurringEventActionModal({
  isOpen,
  onClose,
  onEditThis,
  onEditAll,
  onDeleteThis,
  onDeleteAll,
  action,
  eventTitle,
}: RecurringEventActionModalProps) {
  const isEdit = action === 'edit';
  const Icon = isEdit ? Edit : Trash2;
  const actionText = isEdit ? 'Edit' : 'Delete';
  const actionColor = isEdit ? 'blue' : 'red';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[10001]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto pt-24">
          <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all" style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isEdit ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
                      <Icon className={`w-5 h-5 ${isEdit ? 'text-blue-500' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold text-neu-text-primary"
                      >
                        {actionText} Recurring Event
                      </Dialog.Title>
                      <p className="text-sm text-neu-text-primary/70 mt-1">
                        "{eventTitle}" is a recurring event
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-neu-text-primary/60 hover:text-neu-text-primary transition-colors"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <p className="text-sm text-neu-text-primary/70">
                    Would you like to {action} just this occurrence or all occurrences of this recurring event?
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={isEdit ? onEditThis : onDeleteThis}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neu-surface border border-neu-border text-neu-text-primary hover:bg-neu-surface/70 transition-colors rounded-lg"
                  >
                    <Calendar className="w-4 h-4" />
                    {actionText} this occurrence
                  </Button>
                  
                  <Button
                    onClick={isEdit ? onEditAll : onDeleteAll}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                      isEdit 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <Repeat className="w-4 h-4" />
                    {actionText} all occurrences
                  </Button>
                  
                  <Button
                    onClick={onClose}
                    className="w-full px-4 py-2 text-neu-text-primary/70 hover:text-neu-text-primary transition-colors text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
