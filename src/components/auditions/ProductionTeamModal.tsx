'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose } from 'react-icons/md';
import { 
  getProductionTeamMembers, 
  addProductionTeamMember, 
  inviteProductionTeamMember,
  removeProductionTeamMember,
  updateProductionTeamMember,
  searchUsersForProductionTeam 
} from '@/lib/supabase/productionTeamMembers';
import type { ProductionTeamMemberWithProfile } from '@/lib/supabase/types';
import Button from '@/components/Button';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface ProductionTeamModalProps {
  auditionId: string;
  auditionTitle: string;
  currentUserId: string;
  onClose: () => void;
}

export default function ProductionTeamModal({
  auditionId,
  auditionTitle,
  currentUserId,
  onClose,
}: ProductionTeamModalProps) {
  const [members, setMembers] = useState<ProductionTeamMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roleTitle, setRoleTitle] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRoleTitle, setEditingRoleTitle] = useState('');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadMembers();
  }, [auditionId]);

  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  const loadMembers = async () => {
    setLoading(true);
    const data = await getProductionTeamMembers(auditionId);
    setMembers(data);
    setLoading(false);
  };

  const handleSearch = async () => {
    setSearching(true);
    const results = await searchUsersForProductionTeam(debouncedSearchQuery);
    
    // Filter out users who are already members
    const memberUserIds = members.map(m => m.user_id).filter(Boolean);
    const filteredResults = results.filter(user => !memberUserIds.includes(user.id));
    
    setSearchResults(filteredResults);
    setSearching(false);
  };

  const handleAddMember = async (userId: string, email: string) => {
    if (!roleTitle.trim()) {
      setError('Please enter a role title');
      return;
    }

    setAdding(true);
    setError(null);
    setSuccess(null);

    const { data, error: addError } = await addProductionTeamMember(
      auditionId,
      userId,
      roleTitle.trim(),
      currentUserId
    );

    if (addError) {
      setError(addError.message || 'Failed to add production team member');
      setAdding(false);
      return;
    }

    setSuccess(`${email} has been added as ${roleTitle}`);
    setSearchQuery('');
    setSearchResults([]);
    setRoleTitle('');
    await loadMembers();
    setAdding(false);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!roleTitle.trim()) {
      setError('Please enter a role title');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setAdding(true);
    setError(null);
    setSuccess(null);

    const { data, error: inviteError } = await inviteProductionTeamMember(
      auditionId,
      inviteEmail.trim(),
      roleTitle.trim(),
      currentUserId
    );

    if (inviteError) {
      setError(inviteError.message || 'Failed to send invitation');
      setAdding(false);
      return;
    }

    setSuccess(`Invitation sent to ${inviteEmail} for ${roleTitle} role`);
    setInviteEmail('');
    setRoleTitle('');
    setShowInviteForm(false);
    await loadMembers();
    setAdding(false);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleRemoveMember = async (memberId: string, roleTitle: string) => {
    if (!confirm(`Are you sure you want to remove this ${roleTitle}?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    const { error: removeError } = await removeProductionTeamMember(memberId);

    if (removeError) {
      setError(removeError.message || 'Failed to remove production team member');
      return;
    }

    setSuccess(`${roleTitle} has been removed from the production team`);
    await loadMembers();
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUpdateRoleTitle = async (memberId: string) => {
    if (!editingRoleTitle.trim()) {
      setError('Role title cannot be empty');
      return;
    }

    setError(null);
    setSuccess(null);

    const { data, error: updateError } = await updateProductionTeamMember(memberId, {
      role_title: editingRoleTitle.trim(),
    });

    if (updateError) {
      setError(updateError.message || 'Failed to update role title');
      return;
    }

    setSuccess('Role title updated successfully');
    setEditingMemberId(null);
    setEditingRoleTitle('');
    await loadMembers();
    setTimeout(() => setSuccess(null), 3000);
  };

  const startEditingRole = (memberId: string, currentRoleTitle: string) => {
    setEditingMemberId(memberId);
    setEditingRoleTitle(currentRoleTitle);
  };

  const cancelEditing = () => {
    setEditingMemberId(null);
    setEditingRoleTitle('');
  };

  const getStatusBadge = (status: string) => {
    const baseStyle = 'px-2 py-1 rounded-lg text-xs font-medium';
    
    switch (status) {
      case 'active':
        return `${baseStyle} bg-green-500/20 border border-green-500/30 text-green-400`;
      case 'pending':
        return `${baseStyle} bg-yellow-500/20 border border-yellow-500/30 text-yellow-400`;
      case 'declined':
        return `${baseStyle} bg-red-500/20 border border-red-500/30 text-red-400`;
      default:
        return `${baseStyle} bg-gray-500/20 border border-gray-500/30 text-gray-400`;
    }
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-[999999]" onClose={onClose}>
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
                <div className="sticky top-0 h-[80px] p-6 border-b border-neu-border shadow-[inset_0_-2px_4px_var(--neu-shadow-dark)]" style={{ backgroundColor: 'var(--neu-surface)' }}>
                  <div className="flex h-full items-center justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-neu-text-primary mb-1">Production Team</h2>
                      <p className="text-neu-text-secondary">{auditionTitle}</p>
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
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
                  {/* Error/Success Messages */}
                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
                      {success}
                    </div>
                  )}

                  {/* Add Member Section */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-neu-text-primary">Add Team Member</h3>
                    
                    {/* Role Title Input */}
                    <div>
                      <label className="block text-sm font-medium text-neu-text-primary mb-1">
                        Role Title
                      </label>
                      <input
                        type="text"
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        placeholder="e.g., Director, Stage Manager, Choreographer"
                        className="neu-input w-full"
                      />
                    </div>

                    {/* Search for existing user */}
                    <div>
                      <label className="block text-sm font-medium text-neu-text-primary mb-1">
                        Search for User
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by email or name..."
                          className="neu-input w-full"
                        />
                        {searching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin h-5 w-5 border-2 border-neu-accent-primary border-t-transparent rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-neu-surface/50 border border-neu-border hover:border-neu-accent-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {user.profile_photo_url ? (
                                <img
                                  src={user.profile_photo_url}
                                  alt={user.email}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center">
                                  <span className="text-neu-accent-primary font-medium">
                                    {user.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-neu-text-primary font-medium">@{user.email}</p>
                                {(user.first_name || user.last_name) && (
                                  <p className="text-neu-text-primary/60 text-sm">
                                    {user.first_name} {user.last_name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddMember(user.id, user.email)}
                              disabled={adding || !roleTitle.trim()}
                              className="px-4 py-2 rounded-xl bg-neu-accent-primary text-white hover:bg-neu-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Invite by Email */}
                    <div className="pt-3 border-t border-neu-border">
                      <button
                        onClick={() => setShowInviteForm(!showInviteForm)}
                        className="text-neu-accent-primary hover:text-neu-accent-secondary transition-colors text-sm font-medium"
                      >
                        {showInviteForm ? '− Hide Email Invitation' : '+ Invite by Email'}
                      </button>

                      {showInviteForm && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-neu-text-primary mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="user@example.com"
                              className="neu-input w-full"
                            />
                          </div>
                          <button
                            onClick={handleInviteByEmail}
                            disabled={adding || !roleTitle.trim() || !inviteEmail.trim()}
                            className="px-4 py-2 rounded-xl bg-neu-accent-primary text-white hover:bg-neu-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Send Invitation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Members */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-neu-text-primary">
                      Current Team ({members.length})
                    </h3>

                    {loading ? (
                      <div className="text-neu-text-primary/70">Loading team members...</div>
                    ) : members.length === 0 ? (
                      <div className="text-neu-text-primary/60 text-center py-8">
                        No production team members yet. Add some members to get started.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {members.map((member) => (
                          <div
                            key={member.production_team_member_id}
                            className="flex items-center justify-between p-4 rounded-xl bg-neu-surface/50 border border-neu-border"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {member.user_id && member.profiles ? (
                                <>
                                  {member.profiles.profile_photo_url ? (
                                    <img
                                      src={member.profiles.profile_photo_url}
                                      alt={member.profiles.email}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-neu-accent-primary/20 flex items-center justify-center">
                                      <span className="text-neu-accent-primary font-medium text-lg">
                                        {member.profiles.email.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="text-neu-text-primary font-medium">
                                      @{member.profiles.email}
                                    </p>
                                    {(member.profiles.first_name || member.profiles.last_name) && (
                                      <p className="text-neu-text-primary/60 text-sm">
                                        {member.profiles.first_name} {member.profiles.last_name}
                                      </p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <span className="text-yellow-400 font-medium text-lg">
                                      ?
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-neu-text-primary font-medium">
                                      {member.invited_email}
                                    </p>
                                    <p className="text-neu-text-primary/60 text-sm">
                                      Invitation pending
                                    </p>
                                  </div>
                                </>
                              )}
                              <div className="flex items-center gap-3">
                                {editingMemberId === member.production_team_member_id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editingRoleTitle}
                                      onChange={(e) => setEditingRoleTitle(e.target.value)}
                                      className="neu-input px-3 py-1 text-sm w-40"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleUpdateRoleTitle(member.production_team_member_id)}
                                      className="text-green-400 hover:text-green-300 transition-colors text-sm"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="text-neu-text-primary/60 hover:text-neu-text-primary transition-colors text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditingRole(member.production_team_member_id, member.role_title)}
                                    className="px-3 py-1 rounded-xl text-sm font-medium shadow-[inset_2px_2px_4px_var(--neu-shadow-light),inset_-2px_-2px_4px_var(--neu-shadow-dark)] text-neu-text-primary border-2 border-blue-400/60 hover:border-blue-400/80 transition-colors"
                                  >
                                    {member.role_title}
                                  </button>
                                )}
                                <span className={getStatusBadge(member.status)}>
                                  {member.status}
                                </span>
                                <button
                                  onClick={() => handleRemoveMember(
                                    member.production_team_member_id,
                                    member.role_title
                                  )}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  title="Remove member"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 p-6 border-t border-neu-border shadow-[inset_0_2px_4px_var(--neu-shadow-dark)]" style={{ backgroundColor: 'var(--neu-surface)' }}>
                  <div className="flex justify-end">
                    <Button onClick={onClose} text="Close" />
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
