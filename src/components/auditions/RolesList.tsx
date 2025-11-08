'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuditionCastMembers } from '@/lib/supabase/castMembers';

interface RolesListProps {
  roles: any[];
  showId: string;
  auditionId: string;
}

interface CastMemberWithProfile {
  cast_member_id: string;
  user_id: string;
  role_id: string | null;
  audition_role_id: string | null;
  status: 'Offered' | 'Accepted' | 'Declined' | null;
  is_understudy: boolean;
  full_name: string;
  profile_photo_url: string | null;
}

export default function RolesList({ roles, showId, auditionId }: RolesListProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [castMembers, setCastMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCastMembers();
  }, [auditionId]);

  const loadCastMembers = async () => {
    try {
      const members = await getAuditionCastMembers(auditionId);
      
      // Only include accepted cast members
      const acceptedMembers = members.filter(m => m.status === 'Accepted');
      
      setCastMembers(acceptedMembers);
    } catch (error) {
      console.error('Error loading cast members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get cast members for a specific role (using audition_role_id)
  const getRoleCastMembers = (auditionRoleId: string) => {
    return castMembers.filter(m => m.audition_role_id === auditionRoleId && !m.is_understudy);
  };

  const getRoleUnderstudies = (auditionRoleId: string) => {
    return castMembers.filter(m => m.audition_role_id === auditionRoleId && m.is_understudy);
  };

  if (!roles || roles.length === 0) {
    return null;
  }

  return (
    <div className="p-6 rounded-xl bg-neu-surface/50 border border-neu-border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <h2 className="text-xl sm:text-2xl font-semibold text-neu-text-primary group-hover:text-neu-accent-primary transition-colors">
          Roles {roles.length > 0 && `(${roles.length})`}
        </h2>
        <span className="text-lg sm:text-xl text-neu-text-primary group-hover:text-neu-accent-primary transition-all duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-4">
        {roles.map((role) => {
          const principals = getRoleCastMembers(role.audition_role_id);
          const understudies = getRoleUnderstudies(role.audition_role_id);
          
          return (
            <div
              key={role.role_id}
              className="p-4 rounded-lg bg-neu-surface/50 border border-[#4a7bd9]/10"
            >
              {/* Mobile: Stack vertically, Desktop: Horizontal */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <h3 className="text-lg font-semibold text-neu-text-primary">
                  {role.role_name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {role.role_type && (
                    <span className="px-2 py-1 rounded text-xs bg-neu-surface/80 border border-neu-border-focus text-neu-text-primary shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)] whitespace-nowrap">
                      {role.role_type}
                    </span>
                  )}
                  {role.gender && (
                    <span className="px-2 py-1 rounded text-xs bg-neu-surface/80 border border-neu-border text-neu-accent-secondary capitalize shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)] whitespace-nowrap">
                      {role.gender}
                    </span>
                  )}
                </div>
              </div>

              {role.description && (
                <p className="text-neu-text-primary/70 text-sm mb-3">
                  {role.description}
                </p>
              )}

              {/* Cast Members */}
              {(principals.length > 0 || understudies.length > 0) && (
                <div className="mt-3 pt-3 border-t border-neu-border/30">
                  {/* Principals */}
                  {principals.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-neu-text-primary/70 uppercase mb-2 tracking-wide">Cast</p>
                      <div className="flex flex-wrap gap-2">
                        {principals.map((member) => (
                          <button
                            key={member.cast_member_id}
                            onClick={() => router.push(`/profile/${member.user_id}`)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors group"
                          >
                            {member.profile_photo_url && (
                              <img 
                                src={member.profile_photo_url} 
                                alt={member.full_name}
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            <span className="text-sm sm:text-base text-green-400 group-hover:text-green-300 font-medium">
                              {member.full_name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Understudies */}
                  {understudies.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-neu-text-primary/70 uppercase mb-2 tracking-wide">Understudy</p>
                      <div className="flex flex-wrap gap-2">
                        {understudies.map((member) => (
                          <button
                            key={member.cast_member_id}
                            onClick={() => router.push(`/profile/${member.user_id}`)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors group"
                          >
                            {member.profile_photo_url && (
                              <img 
                                src={member.profile_photo_url} 
                                alt={member.full_name}
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            <span className="text-sm sm:text-base text-purple-400 group-hover:text-purple-300 font-medium">
                              {member.full_name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
