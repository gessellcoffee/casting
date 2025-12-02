'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUser } from '@/lib/supabase';
import { getUserManageableAuditions } from '@/lib/supabase/auditionQueries';
import { deleteAudition } from '@/lib/supabase/auditions';
import StarryContainer from '@/components/StarryContainer';
import Link from 'next/link';
import Button from '@/components/Button';
import DownloadCalendarButton from '@/components/auditions/DownloadCalendarButton';
import { MdEdit, MdDelete, MdVisibility, MdAssignment, MdCast, MdOutlinePersonAdd, MdEventNote, MdTheaterComedy } from 'react-icons/md';
import WorkflowTransition from '@/components/productions/WorkflowTransition';
import type { WorkflowStatus } from '@/lib/supabase/workflowStatus';
import ConfirmationModal from '@/components/shared/ConfirmationModal';

function CastDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [auditions, setAuditions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'casting' | 'active'>(
    (searchParams.get('filter') as 'all' | 'casting' | 'active') || 'all'
  );
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true
  });

  // Update filter when URL changes
  useEffect(() => {
    const urlFilter = (searchParams.get('filter') as 'all' | 'casting' | 'active') || 'all';
    if (urlFilter !== filter) {
      setFilter(urlFilter);
    }
  }, [searchParams, filter]);

  useEffect(() => {
    const init = async () => {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      await loadAuditions(currentUser.id);
    };

    init();
  }, [router]);

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

  const loadAuditions = async (userId: string) => {
    setLoading(true);
    // Get auditions where user is owner or production team member
    const { data } = await getUserManageableAuditions(userId);
    
    setAuditions(data || []);
    setLoading(false);
  };

  const handleDelete = async (auditionId: string) => {
    const deleteAction = async () => {
      setDeleting(auditionId);
      const { error } = await deleteAudition(auditionId);
      if (error) {
        openModal('Error', 'Failed to delete audition.', undefined, 'OK', false);
      } else {
        setAuditions(auditions.filter(a => a.audition_id !== auditionId));
      }
      setDeleting(null);
    };

    openModal('Confirm Deletion', 'Are you sure you want to delete this audition? This action cannot be undone.', deleteAction, 'Delete');
  };

  // Filter auditions based on workflow status
  const filteredAuditions = auditions.filter(audition => {
    if (filter === 'all') return true;
    if (filter === 'casting') {
      return ['auditioning', 'casting', 'offering_roles'].includes(audition.workflow_status);
    }
    if (filter === 'active') {
      return ['rehearsing', 'performing'].includes(audition.workflow_status);
    }
    return true;
  });

  // Helper function to determine which buttons to show based on workflow status
  const getActionButtons = (audition: any) => {
    const status = audition.workflow_status as WorkflowStatus;
    const isCasting = ['auditioning', 'casting', 'offering_roles'].includes(status);
    const isActive = ['rehearsing', 'performing'].includes(status);

    return {
      showCallbacks: isCasting,
      showCastShow: true, // Always show cast show button for all workflow states
      showRehearsals: isActive,
      showPerformances: status === 'performing',
    };
  };

  if (loading) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary">Loading your auditions...</div>
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
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto on-background">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-neu-text-primary mb-2">
                My Productions
              </h1>
              <p className="text-neu-text-primary/70">
                Manage your shows from auditions through performances
              </p>
            </div>
            <div className="nav-buttons">
              <Button text="+ Create New Production" href="/cast/new" />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setFilter('all');
                router.push('/cast');
              }}
              className={filter === 'all' ? 'n-button-primary' : 'n-button-secondary'}
            >
              All Productions ({auditions.length})
            </button>
            <button
              onClick={() => {
                setFilter('casting');
                router.push('/cast?filter=casting');
              }}
              className={filter === 'casting' ? 'n-button-primary' : 'n-button-secondary'}
            >
              Casting ({auditions.filter(a => ['auditioning', 'casting', 'offering_roles'].includes(a.workflow_status)).length})
            </button>
            <button
              onClick={() => {
                setFilter('active');
                router.push('/cast?filter=active');
              }}
              className={filter === 'active' ? 'n-button-primary' : 'n-button-secondary'}
            >
              Active Shows ({auditions.filter(a => ['rehearsing', 'performing'].includes(a.workflow_status)).length})
            </button>
          </div>

          {/* Auditions List */}
          {filteredAuditions.length === 0 ? (
            <div className="text-center py-12 p-8 rounded-xl neu-card-raised">
              <div className="text-neu-text-primary/70 mb-4">
                {auditions.length === 0 
                  ? "You haven't posted any productions yet"
                  : `No productions in ${filter === 'casting' ? 'casting phase' : 'active shows'}`
                }
              </div>
              <div className="nav-buttons inline-block">
                <Button text="Post Your First Production" href="/cast/new" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAuditions.map((audition) => {
                const actions = getActionButtons(audition);
                return (
                <div
                  key={audition.audition_id}
                  className="p-6 rounded-xl neu-card-raised hover:shadow-neu-raised-lg transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-neu-text-primary mb-2">
                        {audition.show?.title || 'Untitled Show'}
                      </h3>
                      {audition.show?.author && (
                        <p className="text-neu-text-primary/60 mb-3">
                          by {audition.show.author}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {audition.company && (
                          <span className="px-3 py-1 rounded-lg bg-neu-surface/80 border border-neu-border-focus text-neu-text-primary text-sm shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)]">
                            {audition.company.name}
                          </span>
                        )}
                        {audition.equity_status && (
                          <span className="px-3 py-1 rounded-lg bg-neu-surface/80 border border-neu-border text-neu-accent-secondary text-sm shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)]">
                            {audition.equity_status}
                          </span>
                        )}
                        {audition.slots && (
                          <span className="px-3 py-1 rounded-lg bg-neu-surface/80 border border-neu-border-focus text-neu-accent-primary text-sm shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)]">
                            {audition.slots.length} slots
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-neu-text-primary/70">
                        Posted {new Date(audition.created_at).toLocaleDateString()}
                      </div>

                      {/* Workflow Status */}
                      <div className="mt-4">
                        <WorkflowTransition
                          auditionId={audition.audition_id}
                          currentStatus={audition.workflow_status}
                          onStatusChange={(newStatus) => {
                            // Update the audition in the list
                            setAuditions(prev => 
                              prev.map(a => 
                                a.audition_id === audition.audition_id 
                                  ? { ...a, workflow_status: newStatus }
                                  : a
                              )
                            );
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-shrink-0">
                      <div className="flex flex-row flex-wrap gap-2">
                        {/* Always show */}
                        <Link href={`/cast/edit/${audition.audition_id}`}>
                          <button className="neu-icon-btn" title="Edit Audition">
                            <MdEdit className="w-5 h-5" />
                          </button>
                        </Link>
                        <Link href={`/auditions/${audition.audition_id}`}>
                          <button className="neu-icon-btn" title="View Details">
                            <MdVisibility className="w-5 h-5" />
                          </button>
                        </Link>

                        {/* Casting phase buttons */}
                        {actions.showCallbacks && (
                          <Link href={`/auditions/${audition.audition_id}/callbacks`}>
                            <button className="neu-icon-btn" title="Manage Callbacks">
                              <MdAssignment className="w-5 h-5" />
                            </button>
                          </Link>
                        )}
                        {actions.showCastShow && (
                          <Link href={`/auditions/${audition.audition_id}/cast-show`}>
                            <button className="neu-icon-btn" title="Cast Show">
                              <MdOutlinePersonAdd className="w-5 h-5" />
                            </button>
                          </Link>
                        )}

                        {/* Active show buttons */}
                        {actions.showRehearsals && (
                          <Link href={`/productions/active-shows/${audition.audition_id}/rehearsals`}>
                            <button className="neu-icon-btn" title="Rehearsal Schedule">
                              <MdEventNote className="w-5 h-5" />
                            </button>
                          </Link>
                        )}
                        {actions.showPerformances && (
                          <Link href={`/productions/active-shows/${audition.audition_id}/performances`}>
                            <button className="neu-icon-btn" title="Performance Schedule">
                              <MdTheaterComedy className="w-5 h-5" />
                            </button>
                          </Link>
                        )}

                        {/* Always show delete */}
                        <button
                          onClick={() => handleDelete(audition.audition_id)}
                          disabled={deleting === audition.audition_id}
                          className="neu-icon-btn hover:text-neu-accent-danger disabled:opacity-50"
                          title="Delete Production"
                        >
                          <MdDelete className="w-5 h-5" />
                        </button>
                      </div>
                      <DownloadCalendarButton
                        auditionId={audition.audition_id}
                        showTitle={audition.show?.title || 'Production'}
                        variant="secondary"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StarryContainer>
  );
}

export default function CastDashboard() {
  return (
    <Suspense fallback={
      <StarryContainer>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neu-primary)]"></div>
            <p className="mt-4 text-[var(--neu-text-secondary)]">Loading...</p>
          </div>
        </div>
      </StarryContainer>
    }>
      <CastDashboardContent />
    </Suspense>
  );
}
