'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMyAuditionSignupFormAssignments } from '@/lib/supabase/customForms';
import { getUser } from '@/lib/supabase/auth';

interface AuditionFormManagementProps {
  auditionId: string;
  auditionTitle: string;
}

export default function AuditionFormManagement({ auditionId, auditionTitle }: AuditionFormManagementProps) {
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
    const formAssignments = await getMyAuditionSignupFormAssignments(auditionId);
    setAssignments(formAssignments);
    setLoading(false);
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="neu-card-raised p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-neu-text-primary mb-4">📋 Required Forms</h3>
        <div className="text-neu-text-primary/70">Loading forms...</div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return null; // Don't show section if no forms
  }

  const completedCount = assignments.filter(a => a.is_complete).length;
  const totalCount = assignments.length;

  return (
    <div className="neu-card-raised p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neu-text-primary">📋 Required Forms</h3>
        <div className="text-sm text-neu-text-primary/70">
          {completedCount}/{totalCount} completed
        </div>
      </div>

      {totalCount > 0 && completedCount < totalCount && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400 font-medium">
            ⚠️ You have {totalCount - completedCount} incomplete form{totalCount - completedCount !== 1 ? 's' : ''} for this audition.
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
                  <span className={`${statusClass} text-xs`}>{statusLabel}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {assignment.is_complete ? (
                  <>
                    <Link
                      href={`/my-forms/${assignment.assignment_id}?mode=view&returnTo=${encodeURIComponent(`/auditions/${auditionId}`)}`}
                    >
                      <button className="n-button-secondary text-sm px-3 py-2">
                        View
                      </button>
                    </Link>
                    <Link
                      href={`/my-forms/${assignment.assignment_id}?mode=edit&returnTo=${encodeURIComponent(`/auditions/${auditionId}`)}`}
                    >
                      <button className="n-button-primary text-sm px-3 py-2">
                        Edit
                      </button>
                    </Link>
                  </>
                ) : (
                  <Link
                    href={`/my-forms/${assignment.assignment_id}?returnTo=${encodeURIComponent(`/auditions/${auditionId}`)}`}
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

      {assignments.length > 1 && (
        <div className="mt-4 text-center">
          <Link
            href={`/my-forms?auditionId=${auditionId}&returnTo=${encodeURIComponent(`/auditions/${auditionId}`)}`}
            className="text-neu-accent-primary hover:text-neu-accent-secondary transition-colors text-sm"
          >
            View all forms →
          </Link>
        </div>
      )}
    </div>
  );
}
