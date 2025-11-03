'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase';
import { getAuditionsWithDetails } from '@/lib/supabase/auditionQueries';
import { deleteAudition } from '@/lib/supabase/auditions';
import StarryContainer from '@/components/StarryContainer';
import Link from 'next/link';
import Button from '@/components/Button';
import DownloadCalendarButton from '@/components/auditions/DownloadCalendarButton';
import { MdEdit, MdDelete, MdVisibility, MdAssignment, MdCast, MdOutlinePersonAdd } from 'react-icons/md';

export default function CastDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [auditions, setAuditions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const loadAuditions = async (userId: string) => {
    setLoading(true);
    const { data } = await getAuditionsWithDetails();
    
    // Filter to only show user's auditions
    const userAuditions = data?.filter(audition => audition.user_id === userId) || [];
    setAuditions(userAuditions);
    setLoading(false);
  };

  const handleDelete = async (auditionId: string) => {
    if (!confirm('Are you sure you want to delete this audition? This cannot be undone.')) {
      return;
    }

    setDeleting(auditionId);
    const { error } = await deleteAudition(auditionId);
    
    if (!error) {
      setAuditions(auditions.filter(a => a.audition_id !== auditionId));
    } else {
      alert('Failed to delete audition');
    }
    
    setDeleting(null);
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
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-neu-text-primary mb-2">
                My Auditions
              </h1>
              <p className="text-neu-text-primary/70">
                Manage your audition postings
              </p>
            </div>
            <div className="nav-buttons">
              <Button text="+ Create New Audition" href="/cast/new" />
            </div>
          </div>

          {/* Auditions List */}
          {auditions.length === 0 ? (
            <div className="text-center py-12 p-8 rounded-xl neu-card-raised">
              <div className="text-neu-text-primary/70 mb-4">
                You haven't posted any auditions yet
              </div>
              <div className="nav-buttons inline-block">
                <Button text="Post Your First Audition" href="/cast/new" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {auditions.map((audition) => (
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
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-shrink-0">
                      <div className="flex flex-row flex-wrap gap-2">
                        <Link href={`/cast/edit/${audition.audition_id}`}>
                          <button className="neu-icon-btn" title="Edit Audition">
                            <MdEdit className="w-5 h-5" />
                          </button>
                        </Link>
                        <Link href={`/auditions/${audition.audition_id}/callbacks`}>
                          <button className="neu-icon-btn" title="Manage Callbacks">
                            <MdAssignment className="w-5 h-5" />
                          </button>
                        </Link>
                        <Link href={`/auditions/${audition.audition_id}/cast-show`}>
                          <button className="neu-icon-btn" title="Cast Show">
                            <MdOutlinePersonAdd className="w-5 h-5" />
                          </button>
                        </Link>
                        <Link href={`/auditions/${audition.audition_id}`}>
                          <button className="neu-icon-btn" title="View Audition">
                            <MdVisibility className="w-5 h-5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(audition.audition_id)}
                          disabled={deleting === audition.audition_id}
                          className="neu-icon-btn hover:text-neu-accent-danger disabled:opacity-50"
                          title="Delete Audition"
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
              ))}
            </div>
          )}
        </div>
      </div>
    </StarryContainer>
  );
}
