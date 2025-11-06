'use client';

import { useState, useMemo } from 'react';
import { sendCallbackInvitations } from '@/lib/supabase/callbackInvitations';
import type { CallbackInvitationInsert } from '@/lib/supabase/types';
import UserProfileModal from '@/components/casting/UserProfileModal';

interface AuditoneeSelectorProps {
  auditionId: string;
  auditionees: any[];
  callbackSlots: any[];
  onInvitationsSent: () => void;
  onCancel: () => void;
}

interface SelectedInvitation {
  signupId: string;
  userId: string;
  callbackSlotId: string;
  castingNotes: string;
}

export default function AuditioneeSelector({
  auditionId,
  auditionees,
  callbackSlots,
  onInvitationsSent,
  onCancel,
}: AuditoneeSelectorProps) {
  const [selectedInvitations, setSelectedInvitations] = useState<SelectedInvitation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Get unique roles for filtering
  const roles = useMemo(() => {
    const roleSet = new Set<string>();
    auditionees.forEach(auditionee => {
      if (auditionee.roles?.role_name) {
        roleSet.add(auditionee.roles.role_name);
      }
    });
    return Array.from(roleSet).sort();
  }, [auditionees]);

  // Filter auditionees based on search and role filter
  const filteredAuditionees = useMemo(() => {
    return auditionees.filter(auditionee => {
      const profile = auditionee.profiles;
      const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || auditionee.roles?.role_name === filterRole;
      
      return matchesSearch && matchesRole;
    });
  }, [auditionees, searchTerm, filterRole]);

  // Check if an auditionee is already invited
  const isAlreadyInvited = (signupId: string): boolean => {
    return callbackSlots.some(slot =>
      slot.callback_invitations?.some((inv: any) => inv.signup_id === signupId)
    );
  };

  // Get existing invitation for an auditionee
  const getExistingInvitation = (signupId: string) => {
    for (const slot of callbackSlots) {
      const invitation = slot.callback_invitations?.find((inv: any) => inv.signup_id === signupId);
      if (invitation) {
        return { invitation, slot };
      }
    }
    return null;
  };

  // Toggle auditionee selection
  const toggleAuditionee = (auditionee: any, slotId: string) => {
    const signupId = auditionee.signup_id;
    const userId = auditionee.user_id;

    const existingIndex = selectedInvitations.findIndex(
      inv => inv.signupId === signupId
    );

    if (existingIndex >= 0) {
      // Remove if already selected
      setSelectedInvitations(selectedInvitations.filter((_, i) => i !== existingIndex));
    } else {
      // Add new selection
      setSelectedInvitations([
        ...selectedInvitations,
        {
          signupId,
          userId,
          callbackSlotId: slotId,
          castingNotes: '',
        },
      ]);
    }
  };

  // Update callback slot for a selected auditionee
  const updateSlotForAuditionee = (signupId: string, newSlotId: string) => {
    setSelectedInvitations(
      selectedInvitations.map(inv =>
        inv.signupId === signupId ? { ...inv, callbackSlotId: newSlotId } : inv
      )
    );
  };

  // Update casting notes for a selected auditionee
  const updateNotesForAuditionee = (signupId: string, notes: string) => {
    setSelectedInvitations(
      selectedInvitations.map(inv =>
        inv.signupId === signupId ? { ...inv, castingNotes: notes } : inv
      )
    );
  };

  // Check if auditionee is selected
  const isSelected = (signupId: string): boolean => {
    return selectedInvitations.some(inv => inv.signupId === signupId);
  };

  // Get selected slot for auditionee
  const getSelectedSlot = (signupId: string): string => {
    return selectedInvitations.find(inv => inv.signupId === signupId)?.callbackSlotId || '';
  };

  // Handle send invitations
  const handleSendInvitations = async () => {
    if (selectedInvitations.length === 0) {
      setError('Please select at least one auditionee to invite');
      return;
    }

    // Validate all have slots selected
    const missingSlots = selectedInvitations.filter(inv => !inv.callbackSlotId);
    if (missingSlots.length > 0) {
      setError('Please select a callback slot for all selected auditionees');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const invitations: CallbackInvitationInsert[] = selectedInvitations.map(inv => ({
        callback_slot_id: inv.callbackSlotId,
        signup_id: inv.signupId,
        user_id: inv.userId,
        audition_id: auditionId,
        casting_notes: inv.castingNotes || null,
      }));

      const { error: sendError } = await sendCallbackInvitations(invitations);

      if (sendError) {
        throw sendError;
      }

      onInvitationsSent();
    } catch (err: any) {
      console.error('Error sending callback invitations:', err);
      setError(err.message || 'Failed to send callback invitations');
    } finally {
      setSending(false);
    }
  };

  if (callbackSlots.length === 0) {
    return (
      <div className="neu-inset p-6">
        <h2 className="text-2xl font-bold text-neu-text-primary mb-4">Select Auditionees</h2>
        <p className="text-neu-text-primary/70 mb-4">
          You need to create callback slots before you can invite auditionees.
        </p>
        <button
          onClick={onCancel}
          className="neu-btn-action"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="neu-card-raised">
        <h2 className="text-2xl font-bold text-neu-text-primary mb-2">Select Auditionees for Callbacks</h2>
        <p className="text-neu-text-primary/70 mb-6">
          Choose which actors to invite and assign them to callback slots.
        </p>

        {error && (
          <div className="mb-6 neu-error-box">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              Search by Name
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search auditionees..."
              className="neu-input"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              Filter by Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="neu-input"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selection Summary */}
        {selectedInvitations.length > 0 && (
          <div className="mb-6 neu-info-box">
            <p className="text-neu-text-primary font-semibold">
              {selectedInvitations.length} auditionee{selectedInvitations.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Auditionees List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredAuditionees.length === 0 ? (
            <div className="text-center py-8 text-neu-text-primary/50">
              No auditionees found
            </div>
          ) : (
            filteredAuditionees.map((auditionee) => {
              const profile = auditionee.profiles;
              const alreadyInvited = isAlreadyInvited(auditionee.signup_id);
              const existingInvitation = getExistingInvitation(auditionee.signup_id);
              const selected = isSelected(auditionee.signup_id);
              const selectedSlot = getSelectedSlot(auditionee.signup_id);

              return (
                <div
                  key={auditionee.signup_id}
                  className={`transition-all ${
                    selected
                      ? 'neu-item-card-selected'
                      : alreadyInvited
                      ? 'neu-item-card-disabled'
                      : 'neu-item-card'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={alreadyInvited}
                        onChange={() => toggleAuditionee(auditionee, callbackSlots[0]?.callback_slot_id || '')}
                        className="neu-checkbox"
                      />
                    </div>

                    {/* Auditionee Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <button
                            onClick={() => setSelectedUserId(auditionee.user_id)}
                            className="text-lg font-semibold text-neu-accent-primary hover:text-neu-accent-secondary hover:underline transition-colors text-left"
                          >
                            {profile?.first_name} {profile?.last_name}
                          </button>
                          {profile?.email && (
                            <p className="text-sm text-neu-text-primary/50 mb-1">
                              @{profile.email}
                            </p>
                          )}
                          {auditionee.roles && (
                            <p className="text-sm text-neu-text-primary/70">
                              Role: {auditionee.roles.role_name}
                            </p>
                          )}
                        </div>
                        {alreadyInvited && existingInvitation && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            existingInvitation.invitation.status === 'accepted'
                              ? 'bg-green-500/20 text-green-400'
                              : existingInvitation.invitation.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {existingInvitation.invitation.status === 'pending' ? 'Invited' : existingInvitation.invitation.status}
                          </span>
                        )}
                      </div>

                      {alreadyInvited && existingInvitation && (
                        <div className="text-sm text-neu-text-primary/50 mb-2">
                          Already invited to:{' '}
                          {new Date(existingInvitation.slot.start_time).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {new Date(existingInvitation.slot.start_time).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      )}

                      {/* Slot Selection (only if selected) */}
                      {selected && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-neu-text-primary mb-2">
                              Callback Slot *
                            </label>
                            <select
                              value={selectedSlot}
                              onChange={(e) => updateSlotForAuditionee(auditionee.signup_id, e.target.value)}
                              className="neu-input text-sm"
                            >
                              <option value="">Select a callback slot...</option>
                              {callbackSlots.map(slot => {
                                const acceptedCount = slot.callback_invitations?.filter((inv: any) => inv.status === 'accepted').length || 0;
                                const isFull = acceptedCount >= slot.max_signups;
                                return (
                                  <option key={slot.callback_slot_id} value={slot.callback_slot_id}>
                                    {new Date(slot.start_time).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}{' '}
                                    {new Date(slot.start_time).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}{' '}
                                    - {new Date(slot.end_time).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}
                                    {slot.location && ` • ${slot.location}`}
                                    {' • '}{acceptedCount}/{slot.max_signups}
                                    {isFull && ' (Full)'}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neu-text-primary mb-2">
                              Casting Notes (Optional)
                            </label>
                            <textarea
                              value={selectedInvitations.find(inv => inv.signupId === auditionee.signup_id)?.castingNotes || ''}
                              onChange={(e) => updateNotesForAuditionee(auditionee.signup_id, e.target.value)}
                              placeholder="Private notes about this callback..."
                              rows={2}
                              className="neu-input text-sm resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="neu-btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendInvitations}
            disabled={sending || selectedInvitations.length === 0}
            className="neu-btn-action flex-1"
          >
            {sending
              ? 'Sending Invitations...'
              : `Send ${selectedInvitations.length} Invitation${selectedInvitations.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          auditionId={auditionId}
          onClose={() => setSelectedUserId(null)}
          onActionComplete={onInvitationsSent}
        />
      )}
    </div>
  );
}
