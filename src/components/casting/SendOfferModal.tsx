'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose } from 'react-icons/md';
import { supabase } from '@/lib/supabase/client';
import { getShowRoles } from '@/lib/supabase/roles';
import { createCastingOffer, createBulkCastingOffers } from '@/lib/supabase/castingOffers';
import type { Role } from '@/lib/supabase/types';
import Button from '@/components/Button';

interface SendOfferModalProps {
  auditionId: string;
  users: Array<{
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  }>;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SendOfferModal({
  auditionId,
  users,
  currentUserId,
  onClose,
  onSuccess,
}: SendOfferModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [castingType, setCastingType] = useState<'cast' | 'understudy' | 'ensemble'>('cast');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerNotes, setOfferNotes] = useState('');

  const isBulk = users.length > 1;

  useEffect(() => {
    loadRoles();
  }, [auditionId]);

  const loadRoles = async () => {
    setLoading(true);
    // Get audition to find show_id, then get roles
    const { data: audition } = await supabase
      .from('auditions')
      .select('show_id')
      .eq('audition_id', auditionId)
      .single();
    
    if (audition?.show_id) {
      const rolesData = await getShowRoles(audition.show_id);
      setRoles(rolesData);
    }
    setLoading(false);
  };

  const handleSendOffers = async () => {
    if (castingType !== 'ensemble' && !selectedRoleId) {
      alert('Please select a role');
      return;
    }

    setSending(true);

    try {
      if (isBulk) {
        // Send bulk offers
        const offers = users.map(user => ({
          auditionId,
          userId: user.userId,
          roleId: castingType === 'ensemble' ? null : selectedRoleId,
          isUnderstudy: castingType === 'understudy',
          sentBy: currentUserId,
          offerMessage: offerMessage || undefined,
          offerNotes: offerNotes || undefined,
        }));

        const { successCount, failedCount } = await createBulkCastingOffers(offers);
        
        if (failedCount > 0) {
          alert(`Sent ${successCount} offers successfully. ${failedCount} failed.`);
        } else {
          alert(`Successfully sent ${successCount} offers!`);
        }
      } else {
        // Send single offer
        const { error } = await createCastingOffer({
          auditionId,
          userId: users[0].userId,
          roleId: castingType === 'ensemble' ? null : selectedRoleId,
          isUnderstudy: castingType === 'understudy',
          sentBy: currentUserId,
          offerMessage: offerMessage || undefined,
          offerNotes: offerNotes || undefined,
        });

        if (error) {
          alert('Failed to send offer: ' + error.message);
          setSending(false);
          return;
        }

        alert('Offer sent successfully!');
      }

      setSending(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error sending offers:', error);
      alert('Failed to send offers: ' + error.message);
      setSending(false);
    }
  };

  const selectedRole = roles.find(r => r.role_id === selectedRoleId);

  return (
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
                        {isBulk ? `Send Offers to ${users.length} Actors` : 'Send Casting Offer'}
                      </h2>
                      <p className="text-neu-text-secondary">
                        {isBulk ? 'Select role and send offers to multiple actors' : 'Select a role and send an offer'}
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
                      {/* Recipients Preview */}
                      <div className="p-4 rounded-xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                        <h4 className="font-semibold text-neu-text-primary mb-2">
                          {isBulk ? 'Recipients' : 'Recipient'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {users.map(user => (
                            <span
                              key={user.userId}
                              className="px-3 py-1 rounded-full bg-neu-accent-primary/20 text-neu-accent-primary text-sm font-medium"
                            >
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email}
                            </span>
                          ))}
                        </div>
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
                                  key={role.role_id}
                                  onClick={() => setSelectedRoleId(role.role_id)}
                                  className={`w-full p-4 rounded-xl text-left transition-all border ${
                                    selectedRoleId === role.role_id
                                      ? 'shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] border-neu-accent-primary'
                                      : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border-neu-border hover:border-neu-accent-primary/50'
                                  }`}
                                  style={{ backgroundColor: 'var(--neu-surface)' }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="font-semibold text-neu-text-primary">{role.role_name}</div>
                                      {role.description && (
                                        <div className="text-sm text-neu-text-secondary mt-1">{role.description}</div>
                                      )}
                                      <div className="flex gap-2 mt-2">
                                        {role.role_type && (
                                          <span className="px-2 py-0.5 rounded-full bg-neu-accent-primary/20 text-neu-accent-primary text-xs font-medium capitalize">
                                            {role.role_type}
                                          </span>
                                        )}
                                        {role.gender && (
                                          <span className="px-2 py-0.5 rounded-full bg-neu-surface border border-neu-border text-neu-text-secondary text-xs">
                                            {role.gender}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Offer Message */}
                      <div>
                        <label className="block text-sm font-semibold text-neu-text-primary mb-2">
                          Offer Message
                        </label>
                        <p className="text-xs text-neu-text-secondary mb-2">
                          This message will be sent to the actor(s) via email and in-app notification
                        </p>
                        <textarea
                          value={offerMessage}
                          onChange={(e) => setOfferMessage(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-accent-primary resize-none shadow-[inset_2px_2px_4px_var(--neu-shadow-dark)]"
                          placeholder="Congratulations! We would love to have you join our production..."
                        />
                      </div>

                      {/* Internal Notes */}
                      <div>
                        <label className="block text-sm font-semibold text-neu-text-primary mb-2">
                          Internal Notes (Optional)
                        </label>
                        <p className="text-xs text-neu-text-secondary mb-2">
                          These notes are for your reference only and will not be visible to the actor(s)
                        </p>
                        <textarea
                          value={offerNotes}
                          onChange={(e) => setOfferNotes(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-accent-primary resize-none shadow-[inset_2px_2px_4px_var(--neu-shadow-dark)]"
                          placeholder="Add any internal notes about this casting decision..."
                        />
                      </div>

                      {/* Summary */}
                      {(selectedRoleId || castingType === 'ensemble') && (
                        <div className="p-4 rounded-xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                          <h4 className="font-semibold text-neu-text-primary mb-2">Offer Summary</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-neu-text-secondary">Recipients:</span>
                              <span className="text-neu-text-primary font-medium">{users.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neu-text-secondary">Type:</span>
                              <span className="text-neu-text-primary font-medium capitalize">{castingType}</span>
                            </div>
                            {selectedRole && (
                              <div className="flex justify-between">
                                <span className="text-neu-text-secondary">Role:</span>
                                <span className="text-neu-text-primary font-medium">{selectedRole.role_name}</span>
                              </div>
                            )}
                            {castingType === 'ensemble' && (
                              <div className="flex justify-between">
                                <span className="text-neu-text-secondary">Role:</span>
                                <span className="text-neu-text-primary font-medium">Ensemble Member</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-neu-text-secondary">Status:</span>
                              <span className="text-neu-accent-primary font-medium">Offered</span>
                            </div>
                          </div>
                        </div>
                      )}
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
                      text={sending ? 'Sending...' : isBulk ? 'Send Offers' : 'Send Offer'}
                      onClick={handleSendOffers}
                      disabled={(castingType !== 'ensemble' && !selectedRoleId) || sending}
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
  );
}
