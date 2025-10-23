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
        return <span className="neu-badge-accepted">Accepted</span>;
      case 'rejected':
        return <span className="neu-badge-rejected">Declined</span>;
      case 'pending':
        return <span className="neu-badge-pending">Pending</span>;
      default:
        return null;
    }
  };

  if (allInvitations.length === 0) {
    return (
      <div className="neu-inset p-6">
        <h2 className="text-2xl font-bold text-neu-text-primary mb-4">Manage Invitations</h2>
        <p className="text-neu-text-primary/70 mb-4">
          No callback invitations have been sent yet. Select auditionees and send invitations to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="neu-card-raised">
        <h2 className="text-2xl font-bold text-neu-text-primary mb-2">Manage Callback Invitations</h2>
        <p className="text-neu-text-primary/70 mb-6">
          View and manage callback invitation responses from actors.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="neu-stat-box">
            <div className="text-xs text-neu-text-primary/70 mb-1">Total</div>
            <div className="text-xl font-bold text-neu-text-primary">{stats.total}</div>
          </div>
          <div className="neu-stat-box">
            <div className="text-xs text-neu-text-primary/70 mb-1">Pending</div>
            <div className="text-xl font-bold text-yellow-400">{stats.pending}</div>
          </div>
          <div className="neu-stat-box">
            <div className="text-xs text-neu-text-primary/70 mb-1">Accepted</div>
            <div className="text-xl font-bold text-green-400">{stats.accepted}</div>
          </div>
          <div className="neu-stat-box">
            <div className="text-xs text-neu-text-primary/70 mb-1">Rejected</div>
            <div className="text-xl font-bold text-red-400">{stats.rejected}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              Search by Name
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search actors..."
              className="neu-form-input"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="neu-form-input"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Slot Filter */}
          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              Filter by Slot
            </label>
            <select
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value)}
              className="neu-form-input"
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
          <div className="text-center py-8 text-neu-text-primary/50">
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
                <div key={slotId} className="neu-inset">
                  {/* Slot Header */}
                  <div className="mb-4 pb-3 border-b border-[#4a7bd9]/10">
                    <h3 className="text-lg font-semibold text-neu-text-primary mb-1">
                      {new Date(slot.start_time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-neu-text-primary/70">
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
                      <div className="mt-2 text-sm text-neu-text-primary/60 italic">
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
                          className="neu-item-card"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-neu-text-primary mb-1">
                                {profile?.first_name} {profile?.last_name}
                              </h4>
                              {role && (
                                <p className="text-sm text-neu-text-primary/70 mb-2">
                                  Role: {role.role_name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(invitation.status)}
                              <button
                                onClick={() => handleDeleteInvitation(invitation.invitation_id)}
                                disabled={deletingId === invitation.invitation_id}
                                className="neu-btn-small"
                                title="Delete invitation"
                              >
                                {deletingId === invitation.invitation_id ? '⏳' : '🗑️'}
                              </button>
                            </div>
                          </div>

                          {/* Casting Notes */}
                          {invitation.casting_notes && (
                            <div className="mb-2 neu-inset p-3">
                              <p className="text-xs font-semibold text-neu-text-primary/70 mb-1">Your Notes:</p>
                              <p className="text-sm text-neu-text-primary/90">{invitation.casting_notes}</p>
                            </div>
                          )}

                          {/* Actor Comment */}
                          {invitation.actor_comment && (
                            <div className="mb-2 neu-info-box p-3">
                              <p className="text-xs font-semibold text-neu-text-primary/70 mb-1">Actor's Comment:</p>
                              <p className="text-sm text-neu-text-primary">{invitation.actor_comment}</p>
                            </div>
                          )}

                          {/* Timestamps */}
                          <div className="flex items-center gap-4 text-xs text-neu-text-primary/50">
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
