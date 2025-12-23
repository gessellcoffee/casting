'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { getCastMembers, assignMultipleCastMembers } from '@/lib/supabase/agendaItems';
import Avatar from '@/components/shared/Avatar';
import Button from '@/components/Button';
import { MdClose, MdSearch } from 'react-icons/md';

interface AssignCastMemberModalProps {
  isOpen: boolean;
  agendaItemId: string;
  auditionId: string;
  existingAssignments: string[]; // Array of user IDs already assigned
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AssignCastMemberModal({
  isOpen,
  agendaItemId,
  auditionId,
  existingAssignments,
  onSuccess,
  onCancel,
}: AssignCastMemberModalProps) {
  const [castMembers, setCastMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCastMembers();
      // Reset state on open
      setSelectedMembers([]);
      setSearchQuery('');
    }
  }, [isOpen, auditionId]);

  useEffect(() => {
    // Filter cast members based on search query
    if (searchQuery.trim() === '') {
      setFilteredMembers(castMembers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMembers(
        castMembers.filter(member => {
          const fullName = `${member.profiles.first_name} ${member.profiles.last_name}`.toLowerCase();
          return fullName.includes(query);
        })
      );
    }
  }, [searchQuery, castMembers]);

  const loadCastMembers = async () => {
    setLoading(true);
    const { data } = await getCastMembers(auditionId);

    if (data) {
      // Aggregate roles for each unique user
      const membersMap = new Map();
      data.forEach(member => {
        let roleName = member.audition_roles?.role_name || member.roles?.role_name;
        if (roleName && member.is_understudy) {
          roleName += ' (Understudy)';
        }
        if (membersMap.has(member.user_id)) {
          // Add role to existing member
          const existingMember = membersMap.get(member.user_id);
          if (roleName && !existingMember.roles.includes(roleName)) {
            existingMember.roles.push(roleName);
          }
        } else {
          // Add new member
          membersMap.set(member.user_id, {
            ...member,
            roles: roleName ? [roleName] : [],
          });
        }
      });

      const uniqueMembers = Array.from(membersMap.values());

      // Filter out already assigned members
      const available = uniqueMembers.filter(
        member => !existingAssignments.includes(member.user_id)
      );

      setCastMembers(available);
      setFilteredMembers(available);
    }

    setLoading(false);
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedMembers(filteredMembers.map(m => m.user_id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSelectMember = (userId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedMembers(prev => [...prev, userId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleAssign = async (userIds: string[]) => {
    if (userIds.length === 0) return;

    setAssigning(true);
    setError(null);

    const { error: assignError } = await assignMultipleCastMembers(agendaItemId, userIds);

    setAssigning(false);

    if (assignError) {
      setError(assignError.message);
      return;
    }

    onSuccess();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="neu-card-raised w-full max-w-2xl transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h2"
                    className="text-2xl font-bold text-neu-text-primary"
                  >
                    Assign Cast Member
                  </Dialog.Title>
                  <button
                    onClick={onCancel}
                    className="p-2 rounded-lg hover:bg-neu-surface-light transition-colors"
                  >
                    <MdClose className="w-6 h-6 text-neu-text-secondary" />
                  </button>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neu-text-secondary" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search cast members..."
                      className="neu-input w-full pl-12"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Cast Members List */}
                {loading ? (
                  <div className="text-center py-8 text-neu-text-secondary">
                    Loading cast members...
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-neu-text-secondary">
                    {castMembers.length === 0 
                      ? 'No cast members available to assign'
                      : 'No cast members match your search'
                    }
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between p-2 sticky top-0 bg-neu-surface-dark z-10">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="neu-checkbox"
                        />
                        <label className="text-sm text-neu-text-secondary">Select All</label>
                      </div>
                      <span className="text-sm text-neu-text-secondary">{selectedMembers.length} selected</span>
                    </div>
                    {filteredMembers.map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between p-4 rounded-lg neu-card-raised hover:shadow-neu-raised-lg transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.user_id)}
                            onChange={(e) => handleSelectMember(member.user_id, e.target.checked)}
                            className="neu-checkbox"
                          />
                          <Avatar
                            src={member.profiles.profile_photo_url}
                            alt={`${member.profiles.first_name} ${member.profiles.last_name}`}
                            size="md"
                          />
                          <div>
                            <div className="font-medium text-neu-text-primary">
                              {member.profiles.first_name} {member.profiles.last_name}
                            </div>
                            <div className="text-sm text-neu-text-secondary">
                              Roles: {member.roles.join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="mt-6 flex justify-between items-center">
                  <Button
                    onClick={() => handleAssign(filteredMembers.map(m => m.user_id))}
                    text="Assign All Visible"
                    className="neu-button-secondary"
                    disabled={assigning || filteredMembers.length === 0}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={onCancel}
                      text="Cancel"
                      className="neu-button-secondary"
                    />
                    <Button
                      onClick={() => handleAssign(selectedMembers)}
                      text={`Assign Selected (${selectedMembers.length})`}
                      className="neu-button-primary"
                      disabled={assigning || selectedMembers.length === 0}
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
