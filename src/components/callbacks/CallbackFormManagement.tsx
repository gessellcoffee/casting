'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMyFormAssignments } from '@/lib/supabase/customForms';
import { getUser } from '@/lib/supabase/auth';

interface CallbackFormManagementProps {
  auditionId: string;
  auditionTitle: string;
}

export default function CallbackFormManagement({ auditionId, auditionTitle }: CallbackFormManagementProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [auditionId]);

  const loadData = async () => {
    setLoading(true);
    
    const currentUser = await getUser();
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    setUser(currentUser);
    
    // Get all form assignments and filter for callback-related ones
    const allAssignments = await getMyFormAssignments();
    
    // Filter for assignments related to this audition and callback context
    const callbackAssignments = allAssignments.filter(assignment => 
      assignment.target_type === 'audition' && 
      assignment.target_id === auditionId &&
      assignment.filled_out_by === 'assignee'
    );
    
    setAssignments(callbackAssignments);
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="neu-card-raised p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-neu-text-primary mb-4">📋 Callback Forms</h3>
        <div className="text-neu-text-primary/70">Please log in to view your callback forms.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="neu-card-raised p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-neu-text-primary mb-4">📋 Callback Forms</h3>
        <div className="text-neu-text-primary/70">Loading callback forms...</div>
      </div>
    );
  }

  const completedCount = assignments.filter(a => a.is_complete).length;
  const totalCount = assignments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neu-card-raised p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-neu-text-primary mb-2">📋 Callback Forms Management</h3>
        <p className="text-neu-text-primary/70">
          Manage forms assigned to actors for callback participation in {auditionTitle}.
        </p>
      </div>

      {/* Forms Overview */}
      {totalCount > 0 ? (
        <div className="neu-card-raised p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-neu-text-primary">Your Assigned Forms</h4>
            <div className="text-sm text-neu-text-primary/70">
              {completedCount}/{totalCount} completed
            </div>
          </div>

          {totalCount > 0 && completedCount < totalCount && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-400 font-medium">
                ⚠️ You have {totalCount - completedCount} incomplete callback form{totalCount - completedCount !== 1 ? 's' : ''}.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {assignments.map((assignment) => {
              const formName = assignment.form?.name || 'Untitled Form';
              const statusClass = assignment.is_complete ? 'neu-badge-success' : 'neu-badge-warning';
              const statusLabel = assignment.is_complete ? 'Complete' : 'Pending';

              return (
                <div key={assignment.assignment_id} className="flex items-center justify-between p-4 rounded-lg bg-neu-surface/50 border border-neu-border">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-neu-text-primary">{formName}</div>
                      <div className="text-sm text-neu-text-primary/60">
                        Assigned {new Date(assignment.created_at).toLocaleDateString()}
                      </div>
                      <span className={`${statusClass} text-xs`}>{statusLabel}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {assignment.is_complete ? (
                      <>
                        <Link
                          href={`/my-forms/${assignment.assignment_id}?mode=view&returnTo=${encodeURIComponent(`/auditions/${auditionId}/callbacks`)}`}
                        >
                          <button className="n-button-secondary text-sm px-3 py-2">
                            View
                          </button>
                        </Link>
                        <Link
                          href={`/my-forms/${assignment.assignment_id}?mode=edit&returnTo=${encodeURIComponent(`/auditions/${auditionId}/callbacks`)}`}
                        >
                          <button className="n-button-primary text-sm px-3 py-2">
                            Edit
                          </button>
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/my-forms/${assignment.assignment_id}?returnTo=${encodeURIComponent(`/auditions/${auditionId}/callbacks`)}`}
                      >
                        <button className="n-button-primary text-sm px-3 py-2">
                          Fill Out
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <Link
              href={`/my-forms?auditionId=${auditionId}&returnTo=${encodeURIComponent(`/auditions/${auditionId}/callbacks`)}`}
              className="text-neu-accent-primary hover:text-neu-accent-secondary transition-colors text-sm"
            >
              View all my forms →
            </Link>
          </div>
        </div>
      ) : (
        <div className="neu-card-raised p-6 rounded-xl text-center">
          <div className="text-neu-text-primary/70 mb-4">
            No callback forms have been assigned yet.
          </div>
          <p className="text-sm text-neu-text-primary/60">
            Callback forms will appear here when the production team assigns them to you.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="neu-card-raised p-6 rounded-xl">
        <h4 className="text-lg font-semibold text-neu-text-primary mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/my-forms?auditionId=${auditionId}`}
            className="neu-card-inset p-4 rounded-lg hover:shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)] transition-all"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium text-neu-text-primary">View All Forms</div>
            <div className="text-sm text-neu-text-primary/70">See all forms for this audition</div>
          </Link>
          
          <Link
            href={`/auditions/${auditionId}`}
            className="neu-card-inset p-4 rounded-lg hover:shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)] transition-all"
          >
            <div className="text-2xl mb-2">🎭</div>
            <div className="font-medium text-neu-text-primary">Back to Audition</div>
            <div className="text-sm text-neu-text-primary/70">Return to audition details</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
