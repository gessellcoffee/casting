import React, { useState, useEffect } from 'react';
import { getAuditionRoles, updateAuditionRole } from '@/lib/supabase/auditionRoles';
import type { AuditionRole, User, CastMember, Audition } from '@/lib/supabase/types';
import FormSelect from '@/components/ui/forms/FormSelect';
import { Alert } from '@/components/ui/feedback';
import StarryContainer from '../StarryContainer';
import { getAuditionSignups } from '@/lib/supabase/auditionSignups';
import { createCastMember, getAuditionCastMembers, deleteCastMember } from '@/lib/supabase/castMembers';
import { createBulkCastingOffers, createCastingOffer, getAuditionOffers, revokeCastingOffer } from '@/lib/supabase/castingOffers';
import type { CastingOfferWithDetails } from '@/lib/supabase/types';
import { X } from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import SendOfferModal from './SendOfferModal';
import SendCastingOfferModal from './SendCastingOfferModal';
import RevokeOfferModal from './RevokeOfferModal';
import SearchableCastSelect from './SearchableCastSelect';
import Button from '../Button';
import Avatar from '../shared/Avatar';
import ConfirmationModal from '../shared/ConfirmationModal';
import { useToast } from '@/contexts/ToastContext';

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
    profile_photo_url?: string | null;
  }>;
}

interface EnsembleMember {
  cast_member_id: string;
  user_id: string;
  full_name: string;
  email: string;
  profile_photo_url?: string | null;
}

export default function CastShow({
  audition,
  user,
  onSave,
  onError,
}: CastShowProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleWithCast[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [roleSelections, setRoleSelections] = useState<Record<string, string>>({});
  const [understudySelections, setUnderstudySelections] = useState<Record<string, string>>({});
  const [ensembleMembers, setEnsembleMembers] = useState<EnsembleMember[]>([]);
  const [availableActors, setAvailableActors] = useState<Array<{
    user_id: string;
    full_name: string;
    email: string;
    profile_photo_url?: string | null;
  }>>([]);
  const [selectedEnsembleActor, setSelectedEnsembleActor] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showSendOffersModal, setShowSendOffersModal] = useState(false);
  const [sendingOffers, setSendingOffers] = useState(false);
  const [sendingIndividualOffer, setSendingIndividualOffer] = useState<string | null>(null);
  const [castingOffers, setCastingOffers] = useState<CastingOfferWithDetails[]>([]);
  
  // Individual offer modal state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerModalData, setOfferModalData] = useState<{
    userId: string;
    auditionRoleId: string;
    isUnderstudy: boolean;
    roleName: string;
    actorName: string;
  } | null>(null);

  // Revoke offer modal state
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeModalData, setRevokeModalData] = useState<{
    offerId: string;
    roleName: string;
    actorName: string;
  } | null>(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true
  });

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Get all audition-specific roles
      const auditionRoles = await getAuditionRoles(audition.audition_id);

      // Get all signups for this audition
      const signups = await getAuditionSignups(audition.audition_id);

      // Get existing cast members
      const castMembers = await getAuditionCastMembers(audition.audition_id);

      // Combine actors from signups and cast members
      const actorsMap = new Map();
      
      // Add actors from signups
      signups.forEach((s: any) => {
        actorsMap.set(s.user_id, {
          user_id: s.user_id,
          full_name: s.profiles?.first_name && s.profiles.last_name
            ? `${s.profiles.first_name} ${s.profiles.last_name}`
            : s.profiles?.email || 'Unknown User',
          email: s.profiles?.email || 'No email',
          profile_photo_url: s.profiles?.profile_photo_url || null,
        });
      });
      
      // Add actors from cast members (includes those cast via email/search)
      castMembers.forEach((cm: any) => {
        if (!actorsMap.has(cm.user_id)) {
          // Cast members already have profiles joined and full_name computed
          actorsMap.set(cm.user_id, {
            user_id: cm.user_id,
            full_name: cm.full_name || cm.profiles?.email || 'Unknown User',
            email: cm.profiles?.email || 'No email',
            profile_photo_url: cm.profile_photo_url || cm.profiles?.profile_photo_url || null,
          });
        }
      });
      
      const uniqueActors = Array.from(actorsMap.values());
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
            profile_photo_url: s.profiles?.profile_photo_url || null,
          })),
        };
      });

      // Initialize selections with existing cast (single per role)
      const initialSelections: Record<string, string> = {};
      const initialUnderstudySelections: Record<string, string> = {}; 
      rolesWithCast.forEach((role) => {
        // Take the first cast member if multiple exist
        initialSelections[role.audition_role_id] = role.castMembers[0]?.user_id || '';
        initialUnderstudySelections[role.audition_role_id] = role.understudyCastMembers[0]?.user_id || '';
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
            profile_photo_url: actor?.profile_photo_url || null,
          };
        });
      setEnsembleMembers(ensemble);

      // Get all casting offers for this audition
      const offers = await getAuditionOffers(audition.audition_id);
      setCastingOffers(offers);

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

  // Helper function to get offer status for a cast member
  const getOfferStatus = (userId: string, auditionRoleId?: string | null, isUnderstudy?: boolean) => {
    // Find the cast member first
    const castMember = roles
      .flatMap(r => [...r.castMembers, ...r.understudyCastMembers])
      .find(cm => {
        if (auditionRoleId) {
          return cm.user_id === userId && cm.audition_role_id === auditionRoleId && cm.is_understudy === (isUnderstudy || false);
        } else {
          // For ensemble
          const ensembleMember = ensembleMembers.find(em => em.user_id === userId);
          return ensembleMember && cm.user_id === userId && !cm.audition_role_id;
        }
      });

    if (!castMember) {
      return null;
    }

    // Find offer by cast_member_id
    const offer = castingOffers.find(o => o.cast_member_id === castMember.cast_member_id);

    if (!offer) {
      return null;
    }

    return {
      exists: true,
      status: offer.cast_member?.status || 'Offered',
      respondedAt: offer.responded_at,
    };
  };

  const handleRoleCastChange = (roleId: string, userId: string) => {
    setRoleSelections((prev) => ({
      ...prev,
      [roleId]: userId,
    }));
  };

  const handleUnderstudyCastChange = (roleId: string, userId: string) => {
    setUnderstudySelections((prev) => ({
      ...prev,
      [roleId]: userId,
    }));
  };

  // Generate default offer message
  const generateOfferMessage = (actorName: string, roleName: string, isUnderstudy: boolean) => {
    const showTitle = audition.show?.title || 'this production';
    const rolePhrase = isUnderstudy ? `the understudy role for ${roleName}` : `the role of ${roleName}`;
    
    return `Thank you ${actorName} for auditioning for this production of ${showTitle}. We are so proud to offer you ${rolePhrase}. Please accept in the Belong Here Theater Casting application to confirm your involvement with the production.`;
  };

  // Open the send offer modal
  const openSendOfferModal = (userId: string, roleId: string, isUnderstudy: boolean) => {
    console.log('🎭 openSendOfferModal called:', { userId, roleId, isUnderstudy });
    console.log('Available actors:', availableActors);
    console.log('Roles:', roles);
    
    const role = roles.find((r) => r.audition_role_id === roleId);
    if (!role) {
      console.error('❌ Role not found:', roleId);
      return;
    }
    console.log('✅ Role found:', role);
    
    // Try to find actor in availableActors first
    let actor = availableActors.find(a => a.user_id === userId);
    console.log('Actor in availableActors?', actor);
    
    // If not found, look in the cast members directly (for newly saved cast)
    if (!actor) {
      console.log('Looking in cast members...', role.castMembers, role.understudyCastMembers);
      const castMember: any = role.castMembers.find((cm: any) => cm.user_id === userId) ||
                              role.understudyCastMembers.find((cm: any) => cm.user_id === userId);
      
      console.log('Cast member found?', castMember);
      
      if (castMember) {
        actor = {
          user_id: castMember.user_id,
          full_name: castMember.full_name || 'Unknown User',
          email: castMember.profiles?.email || 'No email',
          profile_photo_url: castMember.profile_photo_url || null,
        };
        console.log('✅ Actor created from cast member:', actor);
      }
    }
    
    if (!actor) {
      console.error('❌ Actor not found:', userId);
      showToast('Unable to find actor information. Please refresh the page.', 'error');
      return;
    }

    console.log('✅ Setting offer modal data and opening modal');
    setOfferModalData({
      userId,
      auditionRoleId: roleId,
      isUnderstudy,
      roleName: role.role_name,
      actorName: actor.full_name,
    });
    setShowOfferModal(true);
  };

  // Confirm and send the offer
  const handleConfirmSendOffer = async (offerMessage: string) => {
    if (!offerModalData) return;

    try {
      setSendingIndividualOffer(offerModalData.userId);
      
      const role = roles.find((r) => r.audition_role_id === offerModalData.auditionRoleId);
      if (!role) {
        throw new Error('Role not found');
      }

      // Send the offer
      const { data, error } = await createCastingOffer({
        auditionId: audition.audition_id,
        userId: offerModalData.userId,
        roleId: role.role_id || null,
        auditionRoleId: offerModalData.auditionRoleId,
        isUnderstudy: offerModalData.isUnderstudy,
        sentBy: user.id,
        offerMessage: offerMessage,
      });

      if (error) {
        throw error;
      }

      // Close modal and show success
      setShowOfferModal(false);
      setOfferModalData(null);
      setError(null);
      
      // Refresh data to update status
      await loadData();
      
      openModal('Offer Sent', `Casting offer sent successfully to ${offerModalData.actorName}!`, undefined, 'OK', false);
    } catch (err) {
      console.error('Error sending casting offer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send casting offer';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setSendingIndividualOffer(null);
    }
  };

  // Open the revoke offer modal
  const openRevokeOfferModal = (userId: string, auditionRoleId: string, isUnderstudy: boolean) => {
    const role = roles.find((r) => r.audition_role_id === auditionRoleId);
    const actor = availableActors.find(a => a.user_id === userId);
    const offerStatus = getOfferStatus(userId, auditionRoleId, isUnderstudy);
    
    if (!role || !actor || !offerStatus) return;

    // Find the offer ID
    const castMember = roles
      .flatMap(r => [...r.castMembers, ...r.understudyCastMembers])
      .find(cm => cm.user_id === userId && cm.audition_role_id === auditionRoleId && cm.is_understudy === isUnderstudy);
    
    if (!castMember) return;

    const offer = castingOffers.find(o => o.cast_member_id === castMember.cast_member_id);
    if (!offer) return;

    setRevokeModalData({
      offerId: offer.offer_id,
      roleName: role.role_name,
      actorName: actor.full_name,
    });
    setShowRevokeModal(true);
  };

  // Confirm and revoke the offer
  const handleConfirmRevokeOffer = async (revokeMessage: string) => {
    if (!revokeModalData) return;

    try {
      setSendingIndividualOffer('revoking');

      const { error } = await revokeCastingOffer(
        revokeModalData.offerId,
        user.id,
        revokeMessage
      );

      if (error) {
        throw error;
      }

      // Close modal and show success
      setShowRevokeModal(false);
      setRevokeModalData(null);
      setError(null);
      openModal('Offer Revoked', `Offer revoked successfully for ${revokeModalData.actorName}!`, undefined, 'OK', false);
      
      // Refresh data to update status
      await loadData();
    } catch (err) {
      console.error('Error revoking offer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke offer';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setSendingIndividualOffer(null);
    }
  };

  const handleSendEnsembleOffer = async (userId: string) => {
    try {
      setSendingIndividualOffer(userId);

      // Send the offer (cast member must already exist from save)
      const { data, error } = await createCastingOffer({
        auditionId: audition.audition_id,
        userId: userId,
        roleId: null,
        auditionRoleId: null,
        isUnderstudy: false,
        sentBy: user.id,
        offerMessage: `You have been offered an ensemble role in ${audition.show?.title || 'this production'}.`,
      });

      if (error) {
        throw error;
      }

      // Show success message
      setError(null);
      openModal('Offer Sent', `Casting offer sent successfully to ${availableActors.find(a => a.user_id === userId)?.full_name || 'the actor'}!`, undefined, 'OK', false);
      
      // Refresh data to update status
      await loadData();
    } catch (err) {
      console.error('Error sending casting offer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send casting offer';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setSendingIndividualOffer(null);
    }
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
      for (const [auditionRoleId, userId] of Object.entries(roleSelections)) {
        const role = roles.find((r) => r.audition_role_id === auditionRoleId);
        if (!role) continue;

        const existingForRole = existingCast.filter(
          (cm) => cm.audition_role_id === auditionRoleId && !cm.is_understudy
        );

        // If a user is selected
        if (userId) {
          const existingCastForUser = existingForRole.find((cm) => cm.user_id === userId);
          
          // Add new cast member if not already assigned
          if (!existingCastForUser) {
            const { error: createError } = await createCastMember({
              audition_id: audition.audition_id,
              role_id: role.role_id || null,
              audition_role_id: auditionRoleId,
              user_id: userId,
              status: 'Offered',
              is_understudy: false,
            });
            if (createError) {
              throw new Error(`Failed to assign ${role.role_name}: ${createError.message}`);
            }
          }
          
          // Remove any other cast members for this role
          for (const existing of existingForRole) {
            if (existing.user_id !== userId) {
              await deleteCastMember(existing.cast_member_id);
            }
          }
        } else {
          // No user selected, remove all cast members for this role
          for (const existing of existingForRole) {
            await deleteCastMember(existing.cast_member_id);
          }
        }
      }

      // Process understudy assignments
      for (const [auditionRoleId, userId] of Object.entries(understudySelections)) {
        const role = roles.find((r) => r.audition_role_id === auditionRoleId);
        if (!role) continue;

        const existingForRole = existingCast.filter(
          (cm) => cm.audition_role_id === auditionRoleId && cm.is_understudy
        );

        // If a user is selected
        if (userId) {
          const existingCastForUser = existingForRole.find((cm) => cm.user_id === userId);
          
          // Add new understudy cast member if not already assigned
          if (!existingCastForUser) {
            const { error: createError } = await createCastMember({
              audition_id: audition.audition_id,
              role_id: role.role_id || null,
              audition_role_id: auditionRoleId,
              user_id: userId,
              status: 'Offered',
              is_understudy: true,
            });
            if (createError) {
              throw new Error(`Failed to assign understudy for ${role.role_name}: ${createError.message}`);
            }
          }
          
          // Remove any other understudy cast members for this role
          for (const existing of existingForRole) {
            if (existing.user_id !== userId) {
              await deleteCastMember(existing.cast_member_id);
            }
          }
        } else {
          // No user selected, remove all understudy cast members for this role
          for (const existing of existingForRole) {
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
          const { error: createError } = await createCastMember({
            audition_id: audition.audition_id,
            role_id: null as any,
            audition_role_id: null as any,
            user_id: member.user_id,
            status: 'Offered',
            is_understudy: false,
          });
          if (createError) {
            throw new Error(`Failed to add ensemble member ${member.full_name}: ${createError.message}`);
          }
        }
      }

      // Remove ensemble members no longer selected
      for (const existing of existingEnsemble) {
        if (!newEnsembleUserIds.includes(existing.user_id)) {
          await deleteCastMember(existing.cast_member_id);
        }
      }

      // Only refresh data if save was successful
      await loadData();
      setError(null);
      onSave();
    } catch (err) {
      console.error('Error saving cast:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save cast assignments';
      setError(errorMessage);
      onError(errorMessage);
      // Don't reload data on error to preserve user's selections
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate statistics
  const totalCastMembers = roles.reduce((acc, role) => 
    acc + role.castMembers.length + role.understudyCastMembers.length, 0
  ) + ensembleMembers.length;

  const totalOffers = castingOffers.length;
  const pendingOffers = castingOffers.filter(o => 
    o.cast_member?.status === 'Offered' && !o.responded_at
  ).length;
  const acceptedOffers = castingOffers.filter(o => 
    o.cast_member?.status === 'Accepted'
  ).length;
  const declinedOffers = castingOffers.filter(o => 
    o.cast_member?.status === 'Declined'
  ).length;

  if (isLoading) {
    return (
      <StarryContainer>
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-neu-surface/50 rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-neu-surface/50 rounded-xl"></div>
          </div>
        </div>
      </StarryContainer>
    );
  }

  return (
    <StarryContainer>
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
        confirmButtonText={modalConfig.confirmButtonText}
        showCancel={modalConfig.showCancel}
      />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neu-text-primary">Cast Show</h1>
            <p className="text-neu-text-primary/70 mt-1">{audition.show?.title}</p>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Cast */}
          <div className="neu-card-raised rounded-xl p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neu-text-primary/70 uppercase tracking-wide">Total Cast</p>
                <p className="text-4xl font-bold text-blue-400 mt-2">{totalCastMembers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pending Offers */}
          <div className="neu-card-raised rounded-xl p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neu-text-primary/70 uppercase tracking-wide">Pending</p>
                <p className="text-4xl font-bold text-yellow-400 mt-2">{pendingOffers}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Accepted */}
          <div className="neu-card-raised rounded-xl p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neu-text-primary/70 uppercase tracking-wide">Accepted</p>
                <p className="text-4xl font-bold text-green-400 mt-2">{acceptedOffers}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Declined */}
          <div className="neu-card-raised rounded-xl p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neu-text-primary/70 uppercase tracking-wide">Declined</p>
                <p className="text-4xl font-bold text-red-400 mt-2">{declinedOffers}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        <div className="space-y-6 neu-card-raised">
          {/* Roles Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-neu-text-primary flex items-center gap-2">
              <svg className="w-6 h-6 text-neu-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cast Roles
            </h2>
            <p className="text-sm text-neu-text-primary/60 mb-4">
              Search by name or email. Enter any email to invite someone not yet on the platform.
            </p>
            <div className="overflow-hidden border border-neu-border rounded-lg">
              <table className="min-w-full divide-y divide-neu-border">
                <thead className="bg-neu-surface/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neu-text-primary/70 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neu-text-primary/70 uppercase tracking-wider">
                    Cast Members
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-neu-surface/20 divide-y divide-neu-border">
                  {roles.length > 0 ? (
                    roles.map((role) => {
                      const selectedActor = roleSelections[role.audition_role_id] || '';
                      const selectedUnderstudy = understudySelections[role.audition_role_id] || '';
                      return (
                        <tr key={role.audition_role_id} className="hover:bg-neu-surface/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-neu-text-primary">{role.role_name}</div>
                            {role.description && (
                              <div className="text-sm text-neu-text-primary/60">{role.description}</div>
                            )}
                            <div className="text-xs text-neu-text-primary/50 mt-1">
                              {role.auditionees.length} auditionee{role.auditionees.length !== 1 ? 's' : ''}
                            </div>
                            <div className="mt-2">
                              <label className="flex items-center gap-2 text-sm text-neu-text-primary cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={role.needs_understudy ?? false}
                                  onChange={() => handleToggleUnderstudy(role.audition_role_id, role.needs_understudy ?? false)}
                                  className="rounded border-2 border-[#4a7bd9] bg-neu-surface checked:bg-[#5a8ff5] checked:border-[#5a8ff5] focus:outline-none focus:ring-2 focus:ring-[#5a8ff5]/50 cursor-pointer transition-all"
                                />
                                <span>Needs Understudy</span>
                              </label>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-4">
                              {/* Principal Cast */}
                              <div>
                                <div className="text-xs font-semibold text-neu-text-primary/70 mb-2 uppercase">Principal</div>
                                <SearchableCastSelect
                                  value={selectedActor}
                                  onChange={(userId) => handleRoleCastChange(role.audition_role_id, userId)}
                                  availableActors={availableActors}
                                  placeholder="Search by name or email..."
                                  disabled={false}
                                  auditionId={audition.audition_id}
                                  roleId={role.role_id || null}
                                  auditionRoleId={role.audition_role_id}
                                  isUnderstudy={false}
                                  currentUserId={user.id}
                                  onInviteSent={() => {
                                    showToast('Invitation sent successfully!', 'success');
                                    loadData();
                                  }}
                                />
                                {selectedActor && (() => {
                                  const offerStatus = getOfferStatus(selectedActor, role.audition_role_id, false);
                                  const actorData = availableActors.find(a => a.user_id === selectedActor);
                                  return (
                                    <div className="mt-2 flex gap-3 items-center">
                                      <Avatar
                                        src={actorData?.profile_photo_url}
                                        alt={actorData?.full_name || 'Actor'}
                                        size="sm"
                                        onClick={() => setSelectedUserId(selectedActor)}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setSelectedUserId(selectedActor)}
                                        className="text-sm text-[#5a8ff5] hover:text-[#4a7bd9] hover:underline transition-colors"
                                      >
                                        View Profile
                                      </button>
                                      {offerStatus ? (
                                        <>
                                          <span className={`text-xs px-2 py-1 rounded-full ${
                                            offerStatus.status === 'Accepted' ? 'bg-green-500/20 text-green-400' :
                                            offerStatus.status === 'Declined' ? 'bg-red-500/20 text-red-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                          }`}>
                                            {offerStatus.status === 'Accepted' ? '✓ Accepted' :
                                             offerStatus.status === 'Declined' ? '✗ Declined' :
                                             '⏳ Pending'}
                                          </span>
                                          {!offerStatus.respondedAt && (
                                            <button
                                              type="button"
                                              onClick={() => openRevokeOfferModal(selectedActor, role.audition_role_id, false)}
                                              disabled={sendingIndividualOffer === 'revoking'}
                                              className="text-sm text-red-600 hover:text-red-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              {sendingIndividualOffer === 'revoking' ? 'Revoking...' : '🚫 Revoke Offer'}
                                            </button>
                                          )}
                                        </>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const exists = role.castMembers.some(cm => cm.user_id === selectedActor);
                                            if (!exists) {
                                              showToast('Please save the cast assignment first before sending an offer.', 'warning');
                                              return;
                                            }
                                            openSendOfferModal(selectedActor, role.audition_role_id, false);
                                          }}
                                          disabled={sendingIndividualOffer === selectedActor}
                                          className="text-sm text-green-600 hover:text-green-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          title={role.castMembers.some(cm => cm.user_id === selectedActor) ? 'Send casting offer' : 'Save cast first'}
                                        >
                                          {sendingIndividualOffer === selectedActor ? 'Sending...' : '📧 Send Offer'}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Understudy Cast */}
                              {role.needs_understudy && (
                                <div className="border-t border-neu-border pt-3">
                                  <div className="text-xs font-semibold text-neu-text-primary/70 mb-2 uppercase">Understudy</div>
                                  <SearchableCastSelect
                                    value={selectedUnderstudy}
                                    onChange={(userId) => handleUnderstudyCastChange(role.audition_role_id, userId)}
                                    availableActors={availableActors}
                                    placeholder="Search by name or email..."
                                    disabled={false}
                                    auditionId={audition.audition_id}
                                    roleId={role.role_id || null}
                                    auditionRoleId={role.audition_role_id}
                                    isUnderstudy={true}
                                    currentUserId={user.id}
                                    onInviteSent={() => {
                                      showToast('Invitation sent successfully!', 'success');
                                      loadData();
                                    }}
                                  />
                                  {selectedUnderstudy && (() => {
                                    const offerStatus = getOfferStatus(selectedUnderstudy, role.audition_role_id, true);
                                    const understudyData = availableActors.find(a => a.user_id === selectedUnderstudy);
                                    return (
                                      <div className="mt-2 flex gap-3 items-center">
                                        <Avatar
                                          src={understudyData?.profile_photo_url}
                                          alt={understudyData?.full_name || 'Actor'}
                                          size="sm"
                                          onClick={() => setSelectedUserId(selectedUnderstudy)}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setSelectedUserId(selectedUnderstudy)}
                                          className="text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                                        >
                                          View Profile
                                        </button>
                                        {offerStatus ? (
                                          <>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                              offerStatus.status === 'Accepted' ? 'bg-green-500/20 text-green-400' :
                                              offerStatus.status === 'Declined' ? 'bg-red-500/20 text-red-400' :
                                              'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                              {offerStatus.status === 'Accepted' ? '✓ Accepted' :
                                               offerStatus.status === 'Declined' ? '✗ Declined' :
                                               '⏳ Pending'}
                                            </span>
                                            {!offerStatus.respondedAt && (
                                              <button
                                                type="button"
                                                onClick={() => openRevokeOfferModal(selectedUnderstudy, role.audition_role_id, true)}
                                                disabled={sendingIndividualOffer === 'revoking'}
                                                className="text-sm text-red-600 hover:text-red-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                {sendingIndividualOffer === 'revoking' ? 'Revoking...' : '🚫 Revoke Offer'}
                                              </button>
                                            )}
                                          </>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const exists = role.understudyCastMembers.some(cm => cm.user_id === selectedUnderstudy);
                                              if (!exists) {
                                                showToast('Please save the cast assignment first before sending an offer.', 'warning');
                                                return;
                                              }
                                              openSendOfferModal(selectedUnderstudy, role.audition_role_id, true);
                                            }}
                                            disabled={sendingIndividualOffer === selectedUnderstudy}
                                            className="text-sm text-green-600 hover:text-green-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={role.understudyCastMembers.some(cm => cm.user_id === selectedUnderstudy) ? 'Send casting offer' : 'Save cast first'}
                                          >
                                            {sendingIndividualOffer === selectedUnderstudy ? 'Sending...' : '📧 Send Offer'}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-center text-neu-text-primary/60">
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
              <h2 className="text-xl font-semibold mb-4 text-neu-text-primary flex items-center gap-2">
                <svg className="w-6 h-6 text-neu-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Ensemble (Size: {audition.ensemble_size})
              </h2>
              <div className="border border-neu-border rounded-lg p-6 bg-neu-surface/30">
                <div className="space-y-4">
                  {/* Current ensemble members */}
                  {ensembleMembers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-neu-text-primary mb-2">
                        Ensemble Members ({ensembleMembers.length}/{audition.ensemble_size})
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {ensembleMembers.map(member => (
                          <div key={member.user_id} className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-neu-text-primary px-3 py-2 rounded-md">
                            <Avatar
                              src={member.profile_photo_url}
                              alt={member.full_name}
                              size="sm"
                              onClick={() => setSelectedUserId(member.user_id)}
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedUserId(member.user_id)}
                              className="text-neu-text-primary hover:text-green-400 hover:underline transition-colors"
                            >
                              {member.full_name}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveEnsembleMember(member.user_id)}
                              className="text-green-400 hover:text-green-300 transition-colors"
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
                      <Button
                        type="button"
                        text="Add to Ensemble"
                        onClick={handleAddEnsembleMember}
                        disabled={!selectedEnsembleActor}
                      />
                    </div>
                  )}
                  
                  {ensembleMembers.length >= audition.ensemble_size && (
                    <div className="text-sm text-green-400 font-medium">
                      ✓ Ensemble is full
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={loadData}
              className="n-button-secondary px-6 py-3 rounded-xl bg-neu-surface text-neu-text-primary border border-neu-border shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--neu-shadow-dark),inset_-5px_-5px_10px_var(--neu-shadow-light)] hover:text-neu-accent-primary hover:border-neu-border-focus transition-all duration-300 font-medium disabled:opacity-50"
              disabled={isSaving || sendingOffers}
            >
              Refresh
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleSave}
                className="n-button-primary px-6 py-3 rounded-xl bg-[#5a8ff5] text-white hover:bg-[#4a7bd9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving || sendingOffers}
              >
                {isSaving ? 'Saving...' : 'Save Cast'}
              </button>
              <Button
                text="Send Offers"
                onClick={() => setShowSendOffersModal(true)}
                disabled={isSaving || sendingOffers}
              />
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          auditionId={audition.audition_id}
          onClose={() => setSelectedUserId(null)}
          onActionComplete={loadData}
        />
      )}

      {/* Send Offers Modal */}
      {showSendOffersModal && (
        <SendOfferModal
          auditionId={audition.audition_id}
          users={[
            ...Object.entries(roleSelections)
              .filter(([_, userId]) => userId) // Only include roles with selected users
              .map(([roleId, userId]) => {
                const actor = availableActors.find(a => a.user_id === userId);
                return actor ? {
                  userId: actor.user_id,
                  firstName: actor.full_name.split(' ')[0] || null,
                  lastName: actor.full_name.split(' ').slice(1).join(' ') || null,
                  username: actor.full_name,
                  email: actor.email,
                } : null;
              })
              .filter(Boolean),
            ...Object.entries(understudySelections)
              .filter(([_, userId]) => userId) // Only include roles with selected understudies
              .map(([roleId, userId]) => {
                const actor = availableActors.find(a => a.user_id === userId);
                return actor ? {
                  userId: actor.user_id,
                  firstName: actor.full_name.split(' ')[0] || null,
                  lastName: actor.full_name.split(' ').slice(1).join(' ') || null,
                  username: actor.full_name,
                  email: actor.email,
                } : null;
              })
              .filter(Boolean),
            ...ensembleMembers.map(member => ({
              userId: member.user_id,
              firstName: member.full_name.split(' ')[0] || null,
              lastName: member.full_name.split(' ').slice(1).join(' ') || null,
              username: member.full_name,
              email: member.email,
            }))
          ].filter((user, index, self) => 
            user && self.findIndex(u => u && u.userId === user.userId) === index
          ) as any}
          currentUserId={user.id}
          onClose={() => setShowSendOffersModal(false)}
          onSuccess={() => {
            setShowSendOffersModal(false);
            loadData();
            onSave();
          }}
        />
      )}

      {/* Send Casting Offer Modal */}
      {showOfferModal && offerModalData && (
        <SendCastingOfferModal
          isOpen={showOfferModal}
          onClose={() => {
            setShowOfferModal(false);
            setOfferModalData(null);
          }}
          onConfirm={handleConfirmSendOffer}
          defaultMessage={generateOfferMessage(
            offerModalData.actorName,
            offerModalData.roleName,
            offerModalData.isUnderstudy
          )}
          roleName={offerModalData.roleName}
          actorName={offerModalData.actorName}
          isSubmitting={sendingIndividualOffer !== null}
        />
      )}

      {/* Revoke Offer Modal */}
      {showRevokeModal && revokeModalData && (
        <RevokeOfferModal
          isOpen={showRevokeModal}
          onClose={() => {
            setShowRevokeModal(false);
            setRevokeModalData(null);
          }}
          onConfirm={handleConfirmRevokeOffer}
          roleName={revokeModalData.roleName}
          actorName={revokeModalData.actorName}
          isSubmitting={sendingIndividualOffer === 'revoking'}
        />
      )}
    </StarryContainer>
  );
}