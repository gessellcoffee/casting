'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose } from 'react-icons/md';
import { 
  getCompanyMembers, 
  addCompanyMember, 
  removeCompanyMember, 
  updateCompanyMemberRole,
  searchUsers 
} from '@/lib/supabase/companyMembers';
import type { CompanyMemberWithProfile, CompanyMemberRole } from '@/lib/supabase/types';
import Button from '@/components/Button';

interface CompanyMembersModalProps {
  companyId: string;
  companyName: string;
  currentUserId: string;
  onClose: () => void;
}

export default function CompanyMembersModal({
  companyId,
  companyName,
  currentUserId,
  onClose,
}: CompanyMembersModalProps) {
  const [members, setMembers] = useState<CompanyMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, [companyId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadMembers = async () => {
    setLoading(true);
    const data = await getCompanyMembers(companyId);
    setMembers(data);
    setLoading(false);
  };

  const handleSearch = async () => {
    setSearching(true);
    const results = await searchUsers(searchQuery);
    
    // Filter out users who are already members
    const memberIds = members.map(m => m.user_id);
    const filteredResults = results.filter(user => !memberIds.includes(user.id));
    
    setSearchResults(filteredResults);
    setSearching(false);
  };

  const handleAddMember = async (userId: string, email: string) => {
    setAdding(true);
    setError(null);
    setSuccess(null);

    const { data, error: addError } = await addCompanyMember(companyId, userId);

    if (addError) {
      setError(addError.message || 'Failed to add member');
      setAdding(false);
      return;
    }

    setSuccess(`${email} has been added to the company`);
    setSearchQuery('');
    setSearchResults([]);
    await loadMembers();
    setAdding(false);   
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from this company?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    const { error: removeError } = await removeCompanyMember(memberId);

    if (removeError) {
      setError(removeError.message || 'Failed to remove member');
      return;
    }

    setSuccess(`${email} has been removed from the company`);
    await loadMembers();
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUpdateRole = async (memberId: string, newRole: CompanyMemberRole, email: string) => {
    setError(null);
    setSuccess(null);

    const { data, error: updateError } = await updateCompanyMemberRole(memberId, newRole);

    if (updateError) {
      setError(updateError.message || 'Failed to update member role');
      return;
    }

    setSuccess(`Role updated to ${newRole} for ${email}`);
    await loadMembers();
    setTimeout(() => setSuccess(null), 3000);
  };

  const getRoleBadgeColor = (role: CompanyMemberRole) => {
    const baseStyle = 'shadow-[inset_2px_2px_4px_var(--neu-shadow-light),inset_-2px_-2px_4px_var(--neu-shadow-dark)] text-neu-text-primary';
    
    switch (role) {
      case 'Owner':
        return `${baseStyle} border-2 border-purple-400/60`;
      case 'Admin':
        return `${baseStyle} border-2 border-blue-400/60`;
      case 'Member':
        return `${baseStyle} border-2 border-green-400/60`;
      case 'Viewer':
        return `${baseStyle} border-2 border-gray-400/60`;
      default:
        return `${baseStyle} border-2 border-gray-400/60`;
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
                      <h2 className="text-2xl font-bold text-neu-text-primary mb-1">Company Members</h2>
                      <p className="text-neu-text-secondary">{companyName}</p>
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
                    <h3 className="text-lg font-medium text-neu-text-primary">Add Member</h3>
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
                                <p className="text-neu-text-primary font-medium">{user.email}</p>
                                {(user.first_name || user.last_name) && (
                                  <p className="text-neu-text-primary/60 text-sm">
                                    {user.first_name} {user.last_name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddMember(user.id, user.email)}
                              disabled={adding}
                              className="px-4 py-2 rounded-xl bg-neu-accent-primary text-white hover:bg-neu-accent-secondary transition-colors disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Current Members */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-neu-text-primary">
                      Current Members ({members.length})
                    </h3>

                    {loading ? (
                      <div className="text-neu-text-primary/70">Loading members...</div>
                    ) : members.length === 0 ? (
                      <div className="text-neu-text-primary/60 text-center py-8">
                        No members yet. Add some members to get started.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {members.map((member) => (
                          <div
                            key={member.company_member_id}
                            className="flex items-center justify-between p-4 rounded-xl bg-neu-surface/50 border border-neu-border"
                          >
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                              <div className="flex items-center gap-3 flex-1">
                                {member.profiles?.profile_photo_url ? (
                                  <img
                                    src={member.profiles.profile_photo_url}
                                    alt={member.profiles.email}
                                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-neu-accent-primary/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-neu-accent-primary font-medium text-lg">
                                      {member.profiles?.email.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-neu-text-primary font-medium truncate">
                                    {member.profiles?.email}
                                  </p>
                                  {(member.profiles?.first_name || member.profiles?.last_name) && (
                                    <p className="text-neu-text-primary/60 text-sm truncate">
                                      {member.profiles.first_name} {member.profiles.last_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <select
                                  value={member.role}
                                  onChange={(e) => handleUpdateRole(
                                    member.company_member_id, 
                                    e.target.value as CompanyMemberRole,
                                    member.profiles?.email || 'User'
                                  )}
                                  className={`flex-1 sm:flex-none px-3 py-1 rounded-xl border text-sm font-medium ${getRoleBadgeColor(member.role as CompanyMemberRole)}`}
                                >
                                  <option value="Owner">Owner</option>
                                  <option value="Admin">Admin</option>
                                  <option value="Member">Member</option>
                                  <option value="Viewer">Viewer</option>
                                </select>
                                {member.user_id !== currentUserId && (
                                  <button
                                    onClick={() => handleRemoveMember(
                                      member.company_member_id,
                                      member.profiles?.email || 'User'
                                    )}
                                    className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                                    title="Remove member"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
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
