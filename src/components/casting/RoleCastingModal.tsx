'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose } from 'react-icons/md';
import { supabase } from '@/lib/supabase/client';
import { getUser } from '@/lib/supabase/auth';
import { getShowRoles } from '@/lib/supabase/roles';
import { createCastingOffer } from '@/lib/supabase/castingOffers';
import type { Role } from '@/lib/supabase/types';
import Button from '@/components/Button';
import ConfirmationModal from '../shared/ConfirmationModal';

interface RoleCastingModalProps {
  auditionId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RoleCastingModal({
  auditionId,
  userId,
  onClose,
  onSuccess,
}: RoleCastingModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [castingType, setCastingType] = useState<'cast' | 'understudy' | 'ensemble'>('cast');
  const [loading, setLoading] = useState(true);
  const [casting, setCasting] = useState(false);
  const [notes, setNotes] = useState('');
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

  const handleCast = async () => {
    if (castingType !== 'ensemble' && !selectedRoleId) {
      openModal('Role Required', 'Please select a role before sending an offer.', undefined, 'OK', false);
      return;
    }

    setCasting(true);

    // Get current user ID for sent_by
    const user = await getUser();
    if (!user) {
      openModal('Authentication Error', 'You must be logged in to send offers.', undefined, 'OK', false);
      setCasting(false);
      return;
    }

    const { error } = await createCastingOffer({
      auditionId,
      userId,
      roleId: castingType === 'ensemble' ? null : selectedRoleId,
      isUnderstudy: castingType === 'understudy',
      sentBy: user.id,
      offerMessage: notes || undefined,
    });

    if (error) {
      openModal('Error', `Failed to send casting offer: ${error.message}`, undefined, 'OK', false);
      setCasting(false);
      return;
    }

    openModal('Offer Sent', 'Casting offer sent successfully!', undefined, 'OK', false);
    setCasting(false);
    onSuccess();
  };

  const selectedRole = roles.find(r => r.role_id === selectedRoleId);

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
              <h2 className="text-2xl font-bold text-neu-text-primary mb-1">Cast User</h2>
              <p className="text-neu-text-secondary">Select a role and casting type</p>
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
                  <div className="space-y-3">
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

              {/* Casting Notes */}
              <div>
                <label className="block text-sm font-medium text-neu-text-secondary mb-2">Casting Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-neu-surface border border-neu-border text-neu-text-primary focus:outline-none focus:border-neu-accent-primary resize-none"
                  placeholder="Add any notes about this casting decision..."
                />
              </div>

              {/* Summary */}
              {(selectedRoleId || castingType === 'ensemble') && (
                <div className="p-4 rounded-xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                  <h4 className="font-semibold text-neu-text-primary mb-2">Casting Summary</h4>
                  <div className="space-y-1 text-sm">
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
          <div className="neu-button-group-equal">
            <Button
              text="Cancel"
              onClick={onClose}
              variant="secondary"
            />
            <Button
              text={casting ? 'Casting...' : 'Cast User'}
              onClick={handleCast}
              disabled={(castingType !== 'ensemble' && !selectedRoleId) || casting}
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
