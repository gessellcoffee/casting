'use client';

import { useState, useMemo } from 'react';
import { deleteCallbackInvitation } from '@/lib/supabase/callbackInvitations';

interface CallbackInvitationsListProps {
  auditionId: string;
  callbackSlots: any[];
  onUpdate: () => void;
}

type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected';

export default function CallbackInvitationsList({
  auditionId,
  callbackSlots,
  onUpdate,
}: CallbackInvitationsListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [slotFilter, setSlotFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Flatten all invitations from all slots
  const allInvitations = useMemo(() => {
    return callbackSlots.flatMap(slot =>
      (slot.callback_invitations || []).map((inv: any) => ({
        ...inv,
        slot,
      }))
    );
  }, [callbackSlots]);

  // Filter invitations
  const filteredInvitations = useMemo(() => {
    return allInvitations.filter(invitation => {
      // Status filter
      if (statusFilter !== 'all' && invitation.status !== statusFilter) {
        return false;
      }

      // Slot filter
      if (slotFilter !== 'all' && invitation.callback_slot_id !== slotFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const profile = invitation.profiles;
        const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.toLowerCase();
        if (!fullName.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [allInvitations, statusFilter, slotFilter, searchTerm]);

  // Group invitations by slot
  const invitationsBySlot = useMemo(() => {
    const grouped = new Map<string, any[]>();
    filteredInvitations.forEach(invitation => {
      const slotId = invitation.callback_slot_id;
      if (!grouped.has(slotId)) {
        grouped.set(slotId, []);
      }
      grouped.get(slotId)!.push(invitation);
    });
    return grouped;
  }, [filteredInvitations]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: allInvitations.length,
      pending: allInvitations.filter(inv => inv.status === 'pending').length,
      accepted: allInvitations.filter(inv => inv.status === 'accepted').length,
      rejected: allInvitations.filter(inv => inv.status === 'rejected').length,
    };
  }, [allInvitations]);

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this invitation? This cannot be undone.')) {
      return;
    }

    setDeletingId(invitationId);
    try {
      const { error } = await deleteCallbackInvitation(invitationId);
      if (error) throw error;
      onUpdate();
    } catch (err: any) {
      console.error('Error deleting invitation:', err);
      alert('Failed to delete invitation: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#5a8ff5]/20 text-[#94b0f6] border border-[#5a8ff5]/30 shadow-[inset_1px_1px_3px_rgba(90,143,245,0.1)]">Accepted</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#2e3e5e]/80 text-[#c5ddff]/50 border border-[#4a7bd9]/20 shadow-[inset_1px_1px_3px_var(--cosmic-shadow-dark)]">Declined</span>;
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#4a7bd9]/20 text-[#c5ddff]/70 border border-[#4a7bd9]/30 shadow-[inset_1px_1px_3px_rgba(74,123,217,0.1)]">Pending</span>;
      default:
        return null;
    }
  };

  if (allInvitations.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]">
        <h2 className="text-2xl font-bold text-[#c5ddff] mb-4">Manage Invitations</h2>
        <p className="text-[#c5ddff]/70 mb-4">
          No callback invitations have been sent yet. Select auditionees and send invitations to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]">
        <h2 className="text-2xl font-bold text-[#c5ddff] mb-2">Manage Callback Invitations</h2>
        <p className="text-[#c5ddff]/70 mb-6">
          View and manage callback invitation responses from actors.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-[#1e2e4e]/50 border border-[#4a7bd9]/10 shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
            <div className="text-xs text-[#c5ddff]/70 mb-1">Total</div>
            <div className="text-xl font-bold text-[#c5ddff]">{stats.total}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#1e2e4e]/50 border border-[#4a7bd9]/10 shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
            <div className="text-xs text-[#c5ddff]/70 mb-1">Pending</div>
            <div className="text-xl font-bold text-yellow-400">{stats.pending}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#1e2e4e]/50 border border-[#4a7bd9]/10 shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
            <div className="text-xs text-[#c5ddff]/70 mb-1">Accepted</div>
            <div className="text-xl font-bold text-green-400">{stats.accepted}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#1e2e4e]/50 border border-[#4a7bd9]/10 shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
            <div className="text-xs text-[#c5ddff]/70 mb-1">Rejected</div>
            <div className="text-xl font-bold text-red-400">{stats.rejected}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-[#c5ddff] mb-2">
              Search by Name
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search actors..."
              className="w-full px-4 py-2 rounded-lg bg-[#1e2e4e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] placeholder-[#c5ddff]/30 focus:outline-none focus:border-[#5a8ff5] shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-[#c5ddff] mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-4 py-2 rounded-lg bg-[#1e2e4e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] focus:outline-none focus:border-[#5a8ff5] shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Slot Filter */}
          <div>
            <label className="block text-sm font-medium text-[#c5ddff] mb-2">
              Filter by Slot
            </label>
            <select
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#1e2e4e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] focus:outline-none focus:border-[#5a8ff5] shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
            >
              <option value="all">All Slots</option>
              {callbackSlots.map(slot => (
                <option key={slot.callback_slot_id} value={slot.callback_slot_id}>
                  {new Date(slot.start_time).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(slot.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Invitations by Slot */}
        {filteredInvitations.length === 0 ? (
          <div className="text-center py-8 text-[#c5ddff]/50">
            No invitations match your filters
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(invitationsBySlot.entries()).map(([slotId, invitations]) => {
              const slot = callbackSlots.find(s => s.callback_slot_id === slotId);
              if (!slot) return null;

              const acceptedCount = invitations.filter(inv => inv.status === 'accepted').length;
              const pendingCount = invitations.filter(inv => inv.status === 'pending').length;

              return (
                <div key={slotId} className="p-4 rounded-lg bg-[#1e2e4e]/50 border border-[#4a7bd9]/10 shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
                  {/* Slot Header */}
                  <div className="mb-4 pb-3 border-b border-[#4a7bd9]/10">
                    <h3 className="text-lg font-semibold text-[#c5ddff] mb-1">
                      {new Date(slot.start_time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-[#c5ddff]/70">
                      <span>
                        ⏰ {new Date(slot.start_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}{' '}
                        - {new Date(slot.end_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      {slot.location && <span>📍 {slot.location}</span>}
                      <span>
                        👥 {acceptedCount}/{slot.max_signups} accepted
                        {pendingCount > 0 && ` (${pendingCount} pending)`}
                      </span>
                    </div>
                    {slot.notes && (
                      <div className="mt-2 text-sm text-[#c5ddff]/60 italic">
                        Note: {slot.notes}
                      </div>
                    )}
                  </div>

                  {/* Invitations for this slot */}
                  <div className="space-y-3">
                    {invitations.map(invitation => {
                      const profile = invitation.profiles;
                      const role = invitation.audition_signups?.roles;

                      return (
                        <div
                          key={invitation.invitation_id}
                          className="p-4 rounded-lg bg-[#2e3e5e]/30 border border-[#4a7bd9]/10 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-[#c5ddff] mb-1">
                                {profile?.first_name} {profile?.last_name}
                              </h4>
                              {role && (
                                <p className="text-sm text-[#c5ddff]/70 mb-2">
                                  Role: {role.role_name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(invitation.status)}
                              <button
                                onClick={() => handleDeleteInvitation(invitation.invitation_id)}
                                disabled={deletingId === invitation.invitation_id}
                                className="px-3 py-1 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff]/60 hover:bg-[#2e3e5e]/80 hover:text-[#c5ddff] hover:border-[#4a7bd9]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_5px_var(--cosmic-shadow-dark),-2px_-2px_5px_var(--cosmic-shadow-light)] hover:shadow-[inset_1px_1px_3px_var(--cosmic-shadow-dark)] text-sm"
                                title="Delete invitation"
                              >
                                {deletingId === invitation.invitation_id ? '⏳' : '🗑️'}
                              </button>
                            </div>
                          </div>

                          {/* Casting Notes */}
                          {invitation.casting_notes && (
                            <div className="mb-2 p-3 rounded-lg bg-[#1e2e4e]/50 border border-[#4a7bd9]/20 shadow-[inset_1px_1px_3px_var(--cosmic-shadow-dark)]">
                              <p className="text-xs font-semibold text-[#c5ddff]/70 mb-1">Your Notes:</p>
                              <p className="text-sm text-[#c5ddff]/90">{invitation.casting_notes}</p>
                            </div>
                          )}

                          {/* Actor Comment */}
                          {invitation.actor_comment && (
                            <div className="mb-2 p-3 rounded-lg bg-[#5a8ff5]/10 border border-[#5a8ff5]/30 shadow-[inset_1px_1px_3px_rgba(90,143,245,0.15)]">
                              <p className="text-xs font-semibold text-[#c5ddff]/70 mb-1">Actor's Comment:</p>
                              <p className="text-sm text-[#c5ddff]">{invitation.actor_comment}</p>
                            </div>
                          )}

                          {/* Timestamps */}
                          <div className="flex items-center gap-4 text-xs text-[#c5ddff]/50">
                            <span>
                              Invited: {new Date(invitation.invited_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                            {invitation.responded_at && (
                              <span>
                                Responded: {new Date(invitation.responded_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
