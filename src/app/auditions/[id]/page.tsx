'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuditionById, updateAudition } from '@/lib/supabase/auditionQueries';
import { getUser } from '@/lib/supabase/auth';
import { isUserProductionMember } from '@/lib/supabase/productionTeamMembers';
import StarryContainer from '@/components/StarryContainer';
import AuditionHeader from '@/components/auditions/AuditionHeader';
import RolesList from '@/components/auditions/RolesList';
import SlotsList from '@/components/auditions/SlotsList';
import AuditionInfo from '@/components/auditions/AuditionInfo';
import ProductionTeamModal from '@/components/auditions/ProductionTeamModal';
import VirtualAuditionSubmission from '@/components/auditions/VirtualAuditionSubmission';
import Button from '@/components/Button';
import { getAuditionRoles } from '@/lib/supabase/auditionRoles';
import WorkflowTransition from '@/components/productions/WorkflowTransition';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
export default function AuditionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [audition, setAudition] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProductionTeamModal, setShowProductionTeamModal] = useState(false);
  const [isProductionMember, setIsProductionMember] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true
  });

  useEffect(() => {
    loadAudition();
    loadRoles();
    checkAuth();
  }, [params.id]);

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

  const handleToggleCastVisibility = async (value: boolean) => {
    if (!audition) return;

    // Optimistic UI update
    setAudition({ ...audition, show_cast_publicly: value });

    const { error } = await updateAudition(audition.audition_id, {
      show_cast_publicly: value,
    });

    if (error) {
      console.error('Error updating show_cast_publicly:', error);
      // revert on error
      setAudition({ ...audition, show_cast_publicly: !value });
    }
  };

  const loadAudition = async () => {
    setLoading(true);
    const { data, error } = await getAuditionById(params.id as string);
    
    if (error) {
      console.error('Error loading audition:', error);
      openModal('Error', `Error loading audition: ${error.message}`, () => router.push('/auditions'), 'OK', false);
      return;
    }
    
    if (!data) {
      openModal('Not Found', 'Audition not found. Redirecting to auditions list.', () => router.push('/auditions'), 'OK', false);
      return;
    }
    
    setAudition(data);
    console.log('Audition data loaded:', {
      virtual_auditions_enabled: data.virtual_auditions_enabled,
      virtual_audition_instructions: data.virtual_audition_instructions,
      workflow_status: data.workflow_status
    });
    setLoading(false);
  };

  const loadRoles = async () => {
    try {
      const data = await getAuditionRoles(params.id as string);
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
      // Don't redirect, just log the error - roles might not exist yet
    }
  };

  const checkAuth = async () => {
    const currentUser = await getUser();
    setUser(currentUser);
    
    if (currentUser && params.id) {
      const isMember = await isUserProductionMember(params.id as string, currentUser.id);
      setIsProductionMember(isMember);
    }
  };

  if (loading) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading audition details...</div>
        </div>
      </StarryContainer>
    );
  }

  if (!audition) {
    return null;
  }

  const isOwner = user && audition.user_id === user.id;
  const canManage = isOwner || isProductionMember;

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
      <div className="neu-card-raised min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/auditions')}
            className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-2"
          >
            ← Back to Auditions
          </button>

          {/* Header */}
          <AuditionHeader audition={audition} />

          {/* Management Buttons (Only for audition owner or production members) */}
          {canManage && (
            <div className="mt-6 neu-card-raised p-6 space-y-4">
              <label className="block text-lg font-semibold text-neu-text-primary mb-4">Manage Audition</label>
              
              {/* Workflow Status */}
              <div className="mb-4">
                <WorkflowTransition
                  auditionId={audition.audition_id}
                  currentStatus={audition.workflow_status}
                  onStatusChange={(newStatus) => {
                    setAudition({ ...audition, workflow_status: newStatus });
                  }}
                />
              </div>

              {/* Cast Visibility */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <input
                    id="show_cast_publicly"
                    type="checkbox"
                    checked={audition.show_cast_publicly}
                    onChange={(e) => handleToggleCastVisibility(e.target.checked)}
                    className="w-4 h-4 text-neu-accent-primary bg-neu-surface border-neu-border rounded focus:ring-2 focus:ring-neu-accent-primary/50"
                  />
                  <label
                    htmlFor="show_cast_publicly"
                    className="text-sm font-medium text-neu-text-primary cursor-pointer"
                  >
                    Publish cast list on audition page
                  </label>
                </div>
                {!audition.show_cast_publicly && (
                  <p className="text-xs text-neu-text-primary/70 mt-1 pl-7">
                    Cast list is currently hidden from actors. Only the role list is visible on the audition page.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 flex-wrap">
                <Button
                text='Edit Audition'
                onClick={() => router.push(`/cast/edit/${audition.audition_id}`)}
                />
                <Button
                  text="🎬 Live Audition Manager"
                  onClick={() => router.push(`/auditions/${audition.audition_id}/live`)}
                  variant="primary"
                />
                <Button
                  text="Manage Callbacks"
                  onClick={() => router.push(`/auditions/${audition.audition_id}/callbacks`)}
                  variant="secondary"
                />
                <Button
                  text="Production Team"
                  onClick={() => setShowProductionTeamModal(true)}
                  variant="primary"
                />
                <Button
                  text="Cast Show"
                  onClick={() => router.push(`/auditions/${audition.audition_id}/cast-show`)}
                  variant="primary"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 neu-card-raised">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Roles */}
              <RolesList 
                roles={roles} 
                showId={audition.show_id}
                auditionId={audition.audition_id} 
                canManage={canManage}
                showCastPublicly={audition.show_cast_publicly}
              />

              {/* Virtual Audition Submission (Only if enabled and user is logged in and not production team) */}
              {(() => {
                console.log('Virtual Audition Check:', {
                  enabled: audition.virtual_auditions_enabled,
                  user: !!user,
                  canManage,
                  shouldShow: audition.virtual_auditions_enabled && user && !canManage
                });
                return audition.virtual_auditions_enabled && user && !canManage ? (
                  <VirtualAuditionSubmission
                    auditionId={audition.audition_id}
                    instructions={audition.virtual_audition_instructions}
                  />
                ) : null;
              })()}

              {/* Audition Slots
                - Visible to all users while workflow_status is 'auditioning'
                - Always visible to managers (owner or production team) so they can review slots later
              */}
              {(audition.workflow_status === 'auditioning' || canManage) && (
                <SlotsList 
                  slots={audition.slots || []} 
                  auditionId={audition.audition_id}
                  auditionTitle={audition.show?.title || 'Audition'}
                  user={user}
                  onSignupSuccess={loadAudition}
                  canManage={canManage}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 neu-card-raised">
              <AuditionInfo audition={audition} />
            </div>
          </div>
        </div>
      </div>

      {/* Production Team Modal */}
      {showProductionTeamModal && user && (
        <ProductionTeamModal
          auditionId={audition.audition_id}
          auditionTitle={audition.show?.title || 'Audition'}
          currentUserId={user.id}
          onClose={() => setShowProductionTeamModal(false)}
        />
      )}
    </StarryContainer>
  );
}
