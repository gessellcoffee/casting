'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose } from 'react-icons/md';
import { supabase } from '@/lib/supabase/client';
import { getAuditionRoles } from '@/lib/supabase/auditionRoles';
import { createCastingOfferByEmail } from '@/lib/supabase/castingOffers';
import type { AuditionRole } from '@/lib/supabase/types';
import Button from '@/components/Button';
import ConfirmationModal from '../shared/ConfirmationModal';

interface CastByEmailModalProps {
  auditionId: string;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CastByEmailModal({
  auditionId,
  currentUserId,
  onClose,
  onSuccess,
}: CastByEmailModalProps) {
  const [roles, setRoles] = useState<AuditionRole[]>([]);
  const [email, setEmail] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [castingType, setCastingType] = useState<'cast' | 'understudy' | 'ensemble'>('cast');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true
  });

  useEffect(() => {
    loadRoles();
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

  const loadRoles = async () => {
    setLoading(true);
    const rolesData = await getAuditionRoles(auditionId);
    setRoles(rolesData);
    setLoading(false);
  };

  const handleSendOffer = async () => {
    if (!email.trim()) {
      openModal('Email Required', 'Please enter an email address.', undefined, 'OK', false);
      return;
    }

    if (castingType !== 'ensemble' && !selectedRoleId) {
      openModal('Role Required', 'Please select a role before sending an offer.', undefined, 'OK', false);
      return;
    }

    setSending(true);

    try {
      const selectedRole = roles.find(r => r.audition_role_id === selectedRoleId);

      const { data, error, userExists, invitationSent } = await createCastingOfferByEmail({
        auditionId,
        email: email.trim(),
        roleId: selectedRole?.role_id || null,
        auditionRoleId: castingType === 'ensemble' ? null : selectedRoleId,
        isUnderstudy: castingType === 'understudy',
        sentBy: currentUserId,
        offerMessage: offerMessage || undefined,
      });

      if (error) {
        openModal('Error', `Failed to send offer: ${error.message}`, undefined, 'OK', false);
        setSending(false);
        return;
      }

      if (userExists) {
        openModal('Offer Sent', `Casting offer sent successfully to ${email}!`, undefined, 'OK', false);
      } else if (invitationSent) {
        openModal(
          'Invitation Sent', 
          `${email} is not yet a member. We've sent them an invitation email to join Belong Here Theater and accept your casting offer.`,
          undefined,
          'OK',
          false
        );
      }

      setSending(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error sending casting offer:', err);
      openModal('Error', `Failed to send offer: ${err.message}`, undefined, 'OK', false);
      setSending(false);
    }
  };

  const selectedRole = roles.find(r => r.audition_role_id === selectedRoleId);

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
                        Cast by Email
                      </h2>
                      <p className="text-neu-text-secondary">
                        Send a casting offer to anyone by email address
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
                    <div className="text-center py-12 text-neu-text-secondary">Loading roles...</div>
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

                      {/* Casting Type Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-neu-text-primary mb-3">Casting Type</label>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => setCastingType('cast')}
                            className={`p-4 rounded-xl text-center transition-all border ${
                              castingType === 'cast'
                                ? 'shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] border-neu-accent-primary'
                                : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border-neu-border hover:border-neu-accent-primary/50'
                            }`}
                            style={{ backgroundColor: 'var(--neu-surface)' }}
                          >
                            <div className="font-semibold text-neu-text-primary">Cast</div>
                            <div className="text-xs text-neu-text-secondary mt-1">Primary role</div>
                          </button>
                          <button
                            onClick={() => setCastingType('understudy')}
                            className={`p-4 rounded-xl text-center transition-all border ${
                              castingType === 'understudy'
                                ? 'shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] border-neu-accent-primary'
                                : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border-neu-border hover:border-neu-accent-primary/50'
                            }`}
                            style={{ backgroundColor: 'var(--neu-surface)' }}
                          >
                            <div className="font-semibold text-neu-text-primary">Understudy</div>
                            <div className="text-xs text-neu-text-secondary mt-1">Backup role</div>
                          </button>
                          <button
                            onClick={() => {
                              setCastingType('ensemble');
                              setSelectedRoleId(null);
                            }}
                            className={`p-4 rounded-xl text-center transition-all border ${
                              castingType === 'ensemble'
                                ? 'shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] border-neu-accent-primary'
                                : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border-neu-border hover:border-neu-accent-primary/50'
                            }`}
                            style={{ backgroundColor: 'var(--neu-surface)' }}
                          >
                            <div className="font-semibold text-neu-text-primary">Ensemble</div>
                            <div className="text-xs text-neu-text-secondary mt-1">No specific role</div>
                          </button>
                        </div>
                      </div>

                      {/* Role Selection (hidden for ensemble) */}
                      {castingType !== 'ensemble' && (
                        <div>
                          <label className="block text-sm font-semibold text-neu-text-primary mb-3">
                            Select Role {castingType === 'understudy' && '(Understudy)'}
                          </label>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {roles.length === 0 ? (
                              <p className="text-neu-text-secondary text-sm">No roles available for this audition.</p>
                            ) : (
                              roles.map((role) => (
                                <button
                                  key={role.audition_role_id}
                                  onClick={() => setSelectedRoleId(role.audition_role_id)}
                                  className={`w-full p-4 rounded-xl text-left transition-all border ${
                                    selectedRoleId === role.audition_role_id
                                      ? 'shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] border-neu-accent-primary'
                                      : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border-neu-border hover:border-neu-accent-primary/50'
                                  }`}
                                  style={{ backgroundColor: 'var(--neu-surface)' }}
                                >
                                  <div className="font-semibold text-neu-text-primary">{role.role_name}</div>
                                  {role.description && (
                                    <div className="text-sm text-neu-text-secondary mt-1 line-clamp-2">{role.description}</div>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Personal Message */}
                      <div>
                        <label className="block text-sm font-semibold text-neu-text-primary mb-3">
                          Personal Message (Optional)
                        </label>
                        <textarea
                          value={offerMessage}
                          onChange={(e) => setOfferMessage(e.target.value)}
                          rows={4}
                          placeholder="Add a personal message to your casting offer..."
                          className="w-full px-4 py-3 rounded-xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border text-neu-text-primary placeholder-neu-text-secondary/50 focus:outline-none focus:border-neu-accent-primary transition-colors resize-none"
                          style={{ backgroundColor: 'var(--neu-surface)' }}
                        />
                      </div>

                      {/* Selected Role Preview */}
                      {selectedRole && (
                        <div className="p-4 rounded-xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                          <h4 className="font-semibold text-neu-text-primary mb-2">Offer Summary</h4>
                          <p className="text-neu-text-secondary text-sm">
                            Sending {castingType === 'understudy' ? 'understudy' : 'casting'} offer for{' '}
                            <span className="font-semibold text-neu-text-primary">{selectedRole.role_name}</span> to{' '}
                            <span className="font-semibold text-neu-text-primary">{email}</span>
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
                      text={sending ? 'Sending...' : 'Send Offer'}
                      onClick={handleSendOffer}
                      disabled={sending || !email.trim() || (castingType !== 'ensemble' && !selectedRoleId)}
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
