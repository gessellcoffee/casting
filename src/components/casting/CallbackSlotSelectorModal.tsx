'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose } from 'react-icons/md';
import { getCallbackSlots, createCallbackSlot } from '@/lib/supabase/callbackSlots';
import { sendCallbackInvitations } from '@/lib/supabase/callbackInvitations';
import type { CallbackSlot, CallbackInvitationInsert } from '@/lib/supabase/types';
import Button from '@/components/Button';
import ConfirmationModal from '../shared/ConfirmationModal';

interface CallbackSlotSelectorModalProps {
  auditionId: string;
  userId: string;
  signupId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CallbackSlotSelectorModal({
  auditionId,
  userId,
  signupId,
  onClose,
  onSuccess,
}: CallbackSlotSelectorModalProps) {
  const [slots, setSlots] = useState<CallbackSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [castingNotes, setCastingNotes] = useState('');
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true
  });
  
  // New slot form
  const [newSlot, setNewSlot] = useState({
    startTime: '',
    endTime: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    loadSlots();
  }, [auditionId]);

  const openModal = (title: string, message: string, onConfirmAction?: () => void, confirmText?: string, showCancelBtn: boolean = true) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        if (onConfirmAction) onConfirmAction();
        setModalConfig({ ...modalConfig, isOpen: false });
      },
      confirmButtonText: confirmText || 'Confirm',
      showCancel: showCancelBtn
    });
  };

  const loadSlots = async () => {
    setLoading(true);
    const slotsData = await getCallbackSlots(auditionId);
    setSlots(slotsData);
    setLoading(false);
  };

  const handleCreateSlot = async () => {
    if (!newSlot.startTime || !newSlot.endTime) {
      openModal('Missing Information', 'Please fill in both start and end times for the new slot.', undefined, 'OK', false);
      return;
    }

    const { data, error } = await createCallbackSlot({
      audition_id: auditionId,
      start_time: newSlot.startTime,
      end_time: newSlot.endTime,
      location: newSlot.location || null,
      notes: newSlot.notes || null,
    });

    if (error || !data) {
      openModal('Error', 'Failed to create the callback slot. Please try again.', undefined, 'OK', false);
      return;
    }

    // Auto-select the newly created slot
    setSelectedSlotId(data.callback_slot_id);
    setShowCreateForm(false);
    await loadSlots();
  };

  const handleSendInvitation = async () => {
    if (!selectedSlotId) {
      openModal('Slot Not Selected', 'Please select a callback slot before sending an invitation.', undefined, 'OK', false);
      return;
    }

    if (!signupId) {
      openModal('Error', 'Cannot send callback invitation: a signup ID is required but was not provided.', undefined, 'OK', false);
      return;
    }

    setSending(true);

    const invitation: CallbackInvitationInsert = {
      audition_id: auditionId,
      user_id: userId,
      callback_slot_id: selectedSlotId,
      signup_id: signupId,
      casting_notes: castingNotes || null,
      status: 'pending',
    };

    const { error } = await sendCallbackInvitations([invitation]);

    if (error) {
      openModal('Error', 'Failed to send the callback invitation. Please try again.', undefined, 'OK', false);
      setSending(false);
      return;
    }

    setSending(false);
    onSuccess();
  };

  return (
    <>
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
        confirmButtonText={modalConfig.confirmButtonText}
        showCancel={modalConfig.showCancel}
      />
      <Transition appear show={true} as={Fragment}>
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
              <Dialog.Panel className="rounded-3xl shadow-[20px_20px_60px_var(--neu-shadow-dark),-20px_-20px_60px_var(--neu-shadow-light)] max-w-2xl w-full max-h-[90vh] overflow-hidden border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
        {/* Header */}
        <div className="sticky top-0 p-6 border-b border-neu-border shadow-[inset_0_-2px_4px_var(--neu-shadow-dark)]" style={{ backgroundColor: 'var(--neu-surface)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neu-text-primary mb-1">Select Callback Slot</h2>
              <p className="text-neu-text-secondary">Choose an existing slot or create a new one</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] text-neu-text-primary hover:text-neu-accent-primary transition-all duration-200 border border-neu-border"
              style={{ backgroundColor: 'var(--neu-surface)' }}
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="text-center py-12 text-neu-text-secondary">Loading slots...</div>
          ) : (
            <div className="space-y-6">
              {/* Existing Slots */}
              <div>
                <h3 className="text-lg font-semibold text-neu-text-primary mb-4">Available Callback Slots</h3>
                <div className="space-y-3">
                  {slots.length === 0 ? (
                    <p className="text-neu-text-secondary text-sm">No callback slots available. Create one below.</p>
                  ) : (
                    slots.map((slot) => (
                      <button
                        key={slot.callback_slot_id}
                        onClick={() => setSelectedSlotId(slot.callback_slot_id)}
                        className={`w-full p-4 rounded-xl text-left transition-all border ${
                          selectedSlotId === slot.callback_slot_id
                            ? 'shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] border-neu-accent-primary'
                            : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border-neu-border hover:border-neu-accent-primary/50'
                        }`}
                        style={{ backgroundColor: 'var(--neu-surface)' }}
                      >
                        <div className="font-semibold text-neu-text-primary">
                          {new Date(slot.start_time).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-sm text-neu-accent-primary">
                          {new Date(slot.start_time).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })} - {new Date(slot.end_time).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                        {slot.location && (
                          <div className="text-xs text-neu-text-secondary mt-1">{slot.location}</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Create New Slot */}
              <div>
                {!showCreateForm ? (
                  <Button
                    text="+ Create New Callback Slot"
                    onClick={() => setShowCreateForm(true)}
                    variant="secondary"
                    className="w-full"
                  />
                ) : (
                  <div className="p-4 rounded-xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border space-y-4" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <h4 className="font-semibold text-neu-text-primary">New Callback Slot</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neu-text-secondary mb-2">Start Time</label>
                        <input
                          type="datetime-local"
                          value={newSlot.startTime}
                          onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-accent-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neu-text-secondary mb-2">End Time</label>
                        <input
                          type="datetime-local"
                          value={newSlot.endTime}
                          onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-accent-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neu-text-secondary mb-2">Location (Optional)</label>
                      <input
                        type="text"
                        value={newSlot.location}
                        onChange={(e) => setNewSlot({ ...newSlot, location: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-accent-primary"
                        placeholder="Studio A, Room 101, etc."
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        text="Create & Select"
                        onClick={handleCreateSlot}
                        variant="primary"
                        className="flex-1"
                      />
                      <Button
                        text="Cancel"
                        onClick={() => setShowCreateForm(false)}
                        variant="secondary"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Casting Notes */}
              <div>
                <label className="block text-sm font-medium text-neu-text-secondary mb-2">Casting Notes (Optional)</label>
                <textarea
                  value={castingNotes}
                  onChange={(e) => setCastingNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-accent-primary resize-none"
                  placeholder="Add any notes for this callback invitation..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 border-t border-neu-border shadow-[inset_0_2px_4px_var(--neu-shadow-dark)]" style={{ backgroundColor: 'var(--neu-surface)' }}>
          <div className="flex gap-3">
            <Button
              text="Cancel"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            />
            <Button
              text={sending ? 'Sending...' : 'Send Callback Invitation'}
              onClick={handleSendInvitation}
              disabled={!selectedSlotId || sending}
              variant="primary"
              className="flex-1"
            />
          </div>
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
