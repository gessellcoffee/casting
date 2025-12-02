'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose } from 'react-icons/md';
import { supabase } from '@/lib/supabase/client';
import { sendCallbackInvitationByEmail } from '@/lib/supabase/callbackInvitations';
import { formatUSDate, formatUSTime } from '@/lib/utils/dateUtils';
import Button from '@/components/Button';
import ConfirmationModal from '../shared/ConfirmationModal';

interface CallbackSlot {
  callback_slot_id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
}

interface CallbackByEmailModalProps {
  auditionId: string;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CallbackByEmailModal({
  auditionId,
  currentUserId,
  onClose,
  onSuccess,
}: CallbackByEmailModalProps) {
  const [slots, setSlots] = useState<CallbackSlot[]>([]);
  const [email, setEmail] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true
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
    const { data, error } = await supabase
      .from('callback_slots')
      .select('*')
      .eq('audition_id', auditionId)
      .order('start_time', { ascending: true });

    if (!error && data) {
      setSlots(data);
    }
    setLoading(false);
  };

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      openModal('Email Required', 'Please enter an email address.', undefined, 'OK', false);
      return;
    }

    if (!selectedSlotId) {
      openModal('Slot Required', 'Please select a callback slot.', undefined, 'OK', false);
      return;
    }

    setSending(true);

    try {
      const { data, error, userExists, invitationSent } = await sendCallbackInvitationByEmail({
        auditionId,
        email: email.trim(),
        callbackSlotId: selectedSlotId,
        invitedBy: currentUserId,
        message: message || undefined,
      });

      if (error) {
        openModal('Error', `Failed to send invitation: ${error.message}`, undefined, 'OK', false);
        setSending(false);
        return;
      }

      if (userExists) {
        openModal('Invitation Sent', `Callback invitation sent successfully to ${email}!`, undefined, 'OK', false);
      } else if (invitationSent) {
        openModal(
          'Invitation Sent', 
          `${email} is not yet a member. We've sent them an invitation email to join Belong Here Theater and respond to your callback invitation.`,
          undefined,
          'OK',
          false
        );
      }

      setSending(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error sending callback invitation:', err);
      openModal('Error', `Failed to send invitation: ${err.message}`, undefined, 'OK', false);
      setSending(false);
    }
  };

  const selectedSlot = slots.find(s => s.callback_slot_id === selectedSlotId);

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
              <Dialog.Panel className="rounded-3xl shadow-[20px_20px_60px_var(--neu-shadow-dark),-20px_-20px_60px_var(--neu-shadow-light)] max-w-3xl w-full max-h-[90vh] overflow-hidden border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                {/* Header */}
                <div className="sticky top-0 p-6 border-b border-neu-border shadow-[inset_0_-2px_4px_var(--neu-shadow-dark)]" style={{ backgroundColor: 'var(--neu-surface)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-neu-text-primary mb-1">
                        Invite to Callback by Email
                      </h2>
                      <p className="text-neu-text-secondary">
                        Send a callback invitation to anyone by email address
                      </p>
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
                    <div className="text-center py-12 text-neu-text-secondary">Loading callback slots...</div>
                  ) : (
                    <div className="space-y-6">
                      {/* Email Input */}
                      <div>
                        <label className="block text-sm font-semibold text-neu-text-primary mb-3">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="actor@example.com"
                          className="w-full px-4 py-3 rounded-xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border text-neu-text-primary placeholder-neu-text-secondary/50 focus:outline-none focus:border-neu-accent-primary transition-colors"
                          style={{ backgroundColor: 'var(--neu-surface)' }}
                        />
                        <p className="text-xs text-neu-text-secondary mt-2">
                          If this email is not in our system, we'll send them an invitation to join Belong Here Theater.
                        </p>
                      </div>

                      {/* Callback Slot Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-neu-text-primary mb-3">
                          Select Callback Slot <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {slots.length === 0 ? (
                            <p className="text-neu-text-secondary text-sm">No callback slots available. Please create callback slots first.</p>
                          ) : (
                            slots.map((slot) => {
                              const startDate = new Date(slot.start_time);
                              const endDate = new Date(slot.end_time);
                              
                              return (
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
                                    {formatUSDate(slot.start_time)}
                                  </div>
                                  <div className="text-sm text-neu-text-secondary mt-1">
                                    {formatUSTime(slot.start_time)} - {formatUSTime(slot.end_time)}
                                  </div>
                                  {slot.location && (
                                    <div className="text-sm text-neu-text-secondary mt-1">
                                      📍 {slot.location}
                                    </div>
                                  )}
                                  {slot.notes && (
                                    <div className="text-sm text-neu-text-secondary mt-1 line-clamp-2">
                                      {slot.notes}
                                    </div>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Personal Message */}
                      <div>
                        <label className="block text-sm font-semibold text-neu-text-primary mb-3">
                          Personal Message (Optional)
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                          placeholder="Add a personal message to your callback invitation..."
                          className="w-full px-4 py-3 rounded-xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border text-neu-text-primary placeholder-neu-text-secondary/50 focus:outline-none focus:border-neu-accent-primary transition-colors resize-none"
                          style={{ backgroundColor: 'var(--neu-surface)' }}
                        />
                      </div>

                      {/* Selected Slot Preview */}
                      {selectedSlot && (
                        <div className="p-4 rounded-xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                          <h4 className="font-semibold text-neu-text-primary mb-2">Invitation Summary</h4>
                          <p className="text-neu-text-secondary text-sm">
                            Inviting <span className="font-semibold text-neu-text-primary">{email}</span> to callback on{' '}
                            <span className="font-semibold text-neu-text-primary">{formatUSDate(selectedSlot.start_time)}</span> at{' '}
                            <span className="font-semibold text-neu-text-primary">{formatUSTime(selectedSlot.start_time)}</span>
                            {selectedSlot.location && (
                              <> at <span className="font-semibold text-neu-text-primary">{selectedSlot.location}</span></>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 p-6 border-t border-neu-border shadow-[inset_0_2px_4px_var(--neu-shadow-dark)]" style={{ backgroundColor: 'var(--neu-surface)' }}>
                  <div className="neu-button-group-equal">
                    <Button
                      text="Cancel"
                      onClick={onClose}
                      disabled={sending}
                      variant="secondary"
                    />
                    <Button
                      text={sending ? 'Sending...' : 'Send Invitation'}
                      onClick={handleSendInvitation}
                      disabled={sending || !email.trim() || !selectedSlotId}
                      variant="primary"
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
