import { useState, useEffect } from 'react';
import { getAuditionRoles, updateAuditionRole } from '@/lib/supabase/auditionRoles';
import type { AuditionRole, User, CastMember, Audition } from '@/lib/supabase/types';
import FormSelect from '@/components/ui/forms/FormSelect';
import { Alert } from '@/components/ui/feedback';
import StarryContainer from '../StarryContainer';
import { getAuditionSignups } from '@/lib/supabase/auditionSignups';
import { createCastMember, getAuditionCastMembers, deleteCastMember } from '@/lib/supabase/castMembers';
import { X } from 'lucide-react';

interface CastShowProps {
  audition: Audition & {
    show: {
      title: string;
      author: string | null;
      description: string | null;
    };
  };
  user: User;
  onSave: () => void;
  onError: (error: string) => void;
}

interface RoleWithCast extends AuditionRole {
  castMembers: CastMember[];
  understudyCastMembers: CastMember[];
  auditionees: Array<{
    user_id: string;
    full_name: string | null;
    email: string;
    signup_id: string;
  }>;
}

interface EnsembleMember {
  cast_member_id: string;
  user_id: string;
  full_name: string;
  email: string;
}

export default function CastShow({
  audition,
  user,
  onSave,
  onError,
}: CastShowProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleWithCast[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [roleSelections, setRoleSelections] = useState<Record<string, string[]>>({});
  const [understudySelections, setUnderstudySelections] = useState<Record<string, string[]>>({});
  const [ensembleMembers, setEnsembleMembers] = useState<EnsembleMember[]>([]);
  const [availableActors, setAvailableActors] = useState<Array<{
    user_id: string;
    full_name: string;
    email: string;
  }>>([]);
  const [selectedEnsembleActor, setSelectedEnsembleActor] = useState<string>('');

  const loadData = async () => {
    try {
      setIsLoading(true);

      console.log('CastShow - audition data:', audition);
      console.log('CastShow - audition_id:', audition.audition_id);

      // Get all audition-specific roles
      const auditionRoles = await getAuditionRoles(audition.audition_id);
      console.log('CastShow - auditionRoles:', auditionRoles);
      console.log('CastShow - auditionRoles length:', auditionRoles.length);

      // Get all signups for this audition
      const signups = await getAuditionSignups(audition.audition_id);
      console.log('CastShow - signups:', signups);
      console.log('CastShow - signups length:', signups.length);

      // Get existing cast members
      const castMembers = await getAuditionCastMembers(audition.audition_id);

      // Get unique actors from all signups
      const uniqueActors = Array.from(
        new Map(
          signups.map((s: any) => [
            s.user_id,
            {
              user_id: s.user_id,
              full_name: s.profiles?.first_name && s.profiles.last_name
                ? `${s.profiles.first_name} ${s.profiles.last_name}`
                : s.profiles?.email || 'Unknown User',
              email: s.profiles?.email || 'No email',
            },
          ])
        ).values()
      );
      setAvailableActors(uniqueActors);

      // Group signups by role
      const rolesWithCast = auditionRoles.map((role) => {
        const roleSignups = signups.filter((s: any) => s.role_id === role.role_id);
        const roleCastMembers = castMembers.filter(
          (cm) => cm.audition_role_id === role.audition_role_id && !cm.is_understudy
        );
        const understudyCastMembers = castMembers.filter(
          (cm) => cm.audition_role_id === role.audition_role_id && cm.is_understudy
        );

        return {
          ...role,
          castMembers: roleCastMembers,
          understudyCastMembers: understudyCastMembers,
          auditionees: roleSignups.map((s: any) => ({
            user_id: s.user_id,
            full_name: s.profiles?.first_name && s.profiles.last_name
              ? `${s.profiles.first_name} ${s.profiles.last_name}`
              : s.profiles?.email || 'Unknown User',
            email: s.profiles?.email || 'No email',
            signup_id: s.signup_id,
          })),
        };
      });

      // Initialize selections with existing cast (multiple per role)
      const initialSelections: Record<string, string[]> = {};
      const initialUnderstudySelections: Record<string, string[]> = {};
      rolesWithCast.forEach((role) => {
        initialSelections[role.audition_role_id] = role.castMembers.map((cm) => cm.user_id);
        initialUnderstudySelections[role.audition_role_id] = role.understudyCastMembers.map(
          (cm) => cm.user_id
        );
      });
      setRoleSelections(initialSelections);
      setUnderstudySelections(initialUnderstudySelections);

      // Get ensemble members (cast members with null role_id and audition_role_id)
      const ensemble = castMembers
        .filter((cm) => !cm.role_id && !cm.audition_role_id)
        .map((cm) => {
          const actor = uniqueActors.find((a) => a.user_id === cm.user_id);
          return {
            cast_member_id: cm.cast_member_id,
            user_id: cm.user_id,
            full_name: actor?.full_name || 'Unknown',
            email: actor?.email || 'No email',
          };
        });
      setEnsembleMembers(ensemble);

      setRoles(rolesWithCast);
      setError(null);
    } catch (err) {
      console.error('Error loading casting data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load casting data';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [audition.audition_id]);

  const handleAddRoleCast = (roleId: string, userId: string) => {
    if (!userId) return;

    setRoleSelections((prev) => {
      const current = prev[roleId] || [];
      if (current.includes(userId)) {
        return prev; // Already added
      }
      return {
        ...prev,
        [roleId]: [...current, userId],
      };
    });
  };

  const handleRemoveRoleCast = (roleId: string, userId: string) => {
    setRoleSelections((prev) => ({
      ...prev,
      [roleId]: (prev[roleId] || []).filter((id) => id !== userId),
    }));
  };

  const handleAddUnderstudyCast = (roleId: string, userId: string) => {
    if (!userId) return;

    setUnderstudySelections((prev) => {
      const current = prev[roleId] || [];
      if (current.includes(userId)) {
        return prev; // Already added
      }
      return {
        ...prev,
        [roleId]: [...current, userId],
      };
    });
  };

  const handleRemoveUnderstudyCast = (roleId: string, userId: string) => {
    setUnderstudySelections((prev) => ({
      ...prev,
      [roleId]: (prev[roleId] || []).filter((id) => id !== userId),
    }));
  };

  const handleToggleUnderstudy = async (roleId: string, currentValue: boolean) => {
    try {
      const { error } = await updateAuditionRole(roleId, {
        needs_understudy: !currentValue,
      });

      if (error) {
        throw error;
      }

      // Refresh data to show the update
      await loadData();
    } catch (err) {
      console.error('Error toggling understudy:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update understudy setting';
      setError(errorMessage);
      onError(errorMessage);
    }
  };

  const handleAddEnsembleMember = () => {
    if (!selectedEnsembleActor) return;

    const actor = availableActors.find((a) => a.user_id === selectedEnsembleActor);
    if (!actor) return;

    // Check if already in ensemble
    if (ensembleMembers.some((em) => em.user_id === selectedEnsembleActor)) {
      return;
    }

    setEnsembleMembers((prev) => [
      ...prev,
      {
        cast_member_id: '', // Will be created on save
        user_id: actor.user_id,
        full_name: actor.full_name,
        email: actor.email,
      },
    ]);
    setSelectedEnsembleActor('');
  };

  const handleRemoveEnsembleMember = (userId: string) => {
    setEnsembleMembers((prev) => prev.filter((em) => em.user_id !== userId));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Get existing cast members
      const existingCast = await getAuditionCastMembers(audition.audition_id);

      // Process role assignments (principals)
      for (const [auditionRoleId, userIds] of Object.entries(roleSelections)) {
        const role = roles.find((r) => r.audition_role_id === auditionRoleId);
        if (!role) continue;

        const existingForRole = existingCast.filter(
          (cm) => cm.audition_role_id === auditionRoleId && !cm.is_understudy
        );
        const existingUserIds = existingForRole.map((cm) => cm.user_id);

        // Add new cast members
        for (const userId of userIds) {
          if (!existingUserIds.includes(userId)) {
            await createCastMember({
              audition_id: audition.audition_id,
              role_id: role.role_id,
              audition_role_id: auditionRoleId,
              user_id: userId,
              status: 'Offered',
              is_understudy: false,
            });
          }
        }

        // Remove cast members no longer selected
        for (const existing of existingForRole) {
          if (!userIds.includes(existing.user_id)) {
            await deleteCastMember(existing.cast_member_id);
          }
        }
      }

      // Process understudy assignments
      for (const [auditionRoleId, userIds] of Object.entries(understudySelections)) {
        const role = roles.find((r) => r.audition_role_id === auditionRoleId);
        if (!role) continue;

        const existingForRole = existingCast.filter(
          (cm) => cm.audition_role_id === auditionRoleId && cm.is_understudy
        );
        const existingUserIds = existingForRole.map((cm) => cm.user_id);

        // Add new understudy cast members
        for (const userId of userIds) {
          if (!existingUserIds.includes(userId)) {
            await createCastMember({
              audition_id: audition.audition_id,
              role_id: role.role_id,
              audition_role_id: auditionRoleId,
              user_id: userId,
              status: 'Offered',
              is_understudy: true,
            });
          }
        }

        // Remove understudy cast members no longer selected
        for (const existing of existingForRole) {
          if (!userIds.includes(existing.user_id)) {
            await deleteCastMember(existing.cast_member_id);
          }
        }
      }

      // Process ensemble members
      const existingEnsemble = existingCast.filter((cm) => !cm.role_id && !cm.audition_role_id);
      const existingEnsembleUserIds = existingEnsemble.map((cm) => cm.user_id);
      const newEnsembleUserIds = ensembleMembers.map((em) => em.user_id);

      // Add new ensemble members
      for (const member of ensembleMembers) {
        if (!existingEnsembleUserIds.includes(member.user_id)) {
          await createCastMember({
            audition_id: audition.audition_id,
            role_id: null as any,
            audition_role_id: null as any,
            user_id: member.user_id,
            status: 'Offered',
            is_understudy: false,
          });
        }
      }

      // Remove ensemble members no longer selected
      for (const existing of existingEnsemble) {
        if (!newEnsembleUserIds.includes(existing.user_id)) {
          await deleteCastMember(existing.cast_member_id);
        }
      }

      // Refresh data to show updates
      await loadData();
      onSave();
    } catch (err) {
      console.error('Error saving cast:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save cast assignments';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <StarryContainer>
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-4 mt-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-md"></div>
              ))}
            </div>
          </div>
        </div>
      </StarryContainer>
    );
  }

  return (
    <StarryContainer>
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2">Cast Show: {audition.show?.title}</h1>
        {audition.show?.author && (
          <p className="text-gray-600 mb-6">by {audition.show.author}</p>
        )}

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="space-y-6">
          {/* Roles Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Cast Roles</h2>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cast Members
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.length > 0 ? (
                    roles.map((role) => {
                      const selectedActors = roleSelections[role.audition_role_id] || [];
                      const selectedUnderstudies = understudySelections[role.audition_role_id] || [];
                      return (
                        <tr key={role.audition_role_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{role.role_name}</div>
                            {role.description && (
                              <div className="text-sm text-gray-500">{role.description}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {role.auditionees.length} auditionee{role.auditionees.length !== 1 ? 's' : ''}
                            </div>
                            <div className="mt-2">
                              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={role.needs_understudy}
                                  onChange={() => handleToggleUnderstudy(role.audition_role_id, role.needs_understudy)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Needs Understudy</span>
                              </label>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-4">
                              {/* Principal Cast */}
                              <div>
                                <div className="text-xs font-semibold text-gray-600 mb-1 uppercase">Principal</div>
                                {selectedActors.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedActors.map((userId) => {
                                      const actor = availableActors.find((a) => a.user_id === userId);
                                      return actor ? (
                                        <div key={userId} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                                          <span>{actor.full_name}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveRoleCast(role.audition_role_id, userId)}
                                            className="text-blue-600 hover:text-blue-800"
                                          >
                                            <X size={14} />
                                          </button>
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                                <FormSelect
                                  value=""
                                  onChange={(e) => handleAddRoleCast(role.audition_role_id, e.target.value)}
                                  className="mt-1 block w-full"
                                  disabled={availableActors.length === 0}
                                >
                                  <option value="">
                                    {availableActors.length === 0
                                      ? 'No actors available'
                                      : 'Add principal actor...'}
                                  </option>
                                  {availableActors
                                    .filter((actor) => !selectedActors.includes(actor.user_id) && !selectedUnderstudies.includes(actor.user_id))
                                    .map((actor) => (
                                      <option key={actor.user_id} value={actor.user_id}>
                                        {actor.full_name} ({actor.email})
                                      </option>
                                    ))}
                                </FormSelect>
                              </div>

                              {/* Understudy Cast */}
                              {role.needs_understudy && (
                                <div className="border-t border-gray-200 pt-3">
                                  <div className="text-xs font-semibold text-gray-600 mb-1 uppercase">Understudy</div>
                                  {selectedUnderstudies.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      {selectedUnderstudies.map((userId) => {
                                        const actor = availableActors.find((a) => a.user_id === userId);
                                        return actor ? (
                                          <div key={userId} className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm">
                                            <span>{actor.full_name}</span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveUnderstudyCast(role.audition_role_id, userId)}
                                              className="text-purple-600 hover:text-purple-800"
                                            >
                                              <X size={14} />
                                            </button>
                                          </div>
                                        ) : null;
                                      })}
                                    </div>
                                  )}
                                  <FormSelect
                                    value=""
                                    onChange={(e) => handleAddUnderstudyCast(role.audition_role_id, e.target.value)}
                                    className="mt-1 block w-full"
                                    disabled={availableActors.length === 0}
                                  >
                                    <option value="">
                                      {availableActors.length === 0
                                        ? 'No actors available'
                                        : 'Add understudy actor...'}
                                    </option>
                                    {availableActors
                                      .filter((actor) => !selectedActors.includes(actor.user_id) && !selectedUnderstudies.includes(actor.user_id))
                                      .map((actor) => (
                                        <option key={actor.user_id} value={actor.user_id}>
                                          {actor.full_name} ({actor.email})
                                        </option>
                                      ))}
                                  </FormSelect>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                        <div className="space-y-2">
                          <p className="font-medium">No roles found for this show.</p>
                          <p className="text-sm">Please add roles to the show before casting actors.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ensemble Section */}
          {audition.ensemble_size && audition.ensemble_size > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Ensemble (Size: {audition.ensemble_size})
              </h2>
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="space-y-4">
                  {/* Current ensemble members */}
                  {ensembleMembers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Cast Members ({ensembleMembers.length}/{audition.ensemble_size})
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {ensembleMembers.map(member => (
                          <div key={member.user_id} className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-2 rounded-md">
                            <span>{member.full_name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEnsembleMember(member.user_id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Add ensemble member */}
                  {ensembleMembers.length < audition.ensemble_size && (
                    <div className="flex gap-2">
                      <FormSelect
                        value={selectedEnsembleActor}
                        onChange={(e) => setSelectedEnsembleActor(e.target.value)}
                        className="flex-1"
                        disabled={availableActors.length === 0}
                      >
                        <option value="">
                          {availableActors.length === 0 
                            ? 'No actors available' 
                            : 'Select an actor...'}
                        </option>
                        {availableActors
                          .filter(actor => !ensembleMembers.some(em => em.user_id === actor.user_id))
                          .map((actor) => (
                            <option key={actor.user_id} value={actor.user_id}>
                              {actor.full_name} ({actor.email})
                            </option>
                          ))}
                      </FormSelect>
                      <button
                        type="button"
                        onClick={handleAddEnsembleMember}
                        disabled={!selectedEnsembleActor}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Add to Ensemble
                      </button>
                    </div>
                  )}
                  
                  {ensembleMembers.length >= audition.ensemble_size && (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Ensemble is full
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSaving}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Cast'}
            </button>
          </div>
        </div>
      </div>
    </StarryContainer>
  );
}