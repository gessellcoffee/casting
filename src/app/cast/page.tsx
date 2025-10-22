'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase';
import { getAuditionsWithDetails } from '@/lib/supabase/auditionQueries';
import { deleteAudition } from '@/lib/supabase/auditions';
import StarryContainer from '@/components/StarryContainer';
import Link from 'next/link';
import Button from '@/components/Button';

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
          <div className="text-[#c5ddff]">Loading your auditions...</div>
        </div>
      </StarryContainer>
    );
  }

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#c5ddff] mb-2">
                My Auditions
              </h1>
              <p className="text-[#c5ddff]/70">
                Manage your audition postings
              </p>
            </div>
            <div className="nav-buttons">
              <Button text="+ Create New Audition" href="/cast/new" />
            </div>
          </div>

          {/* Auditions List */}
          {auditions.length === 0 ? (
            <div className="text-center py-12 p-8 rounded-xl bg-[#2e3e5e]/50 border border-[#4a7bd9]/20">
              <div className="text-[#c5ddff]/70 mb-4">
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
                  className="p-6 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#c5ddff] mb-2">
                        {audition.show?.title || 'Untitled Show'}
                      </h3>
                      {audition.show?.author && (
                        <p className="text-[#c5ddff]/60 mb-3">
                          by {audition.show.author}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {audition.company && (
                          <span className="px-3 py-1 rounded-lg bg-[#2e3e5e]/80 border border-[#5a8ff5]/30 text-[#c5ddff] text-sm shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
                            {audition.company.name}
                          </span>
                        )}
                        {audition.equity_status && (
                          <span className="px-3 py-1 rounded-lg bg-[#2e3e5e]/80 border border-[#4a7bd9]/30 text-[#94b0f6] text-sm shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
                            {audition.equity_status}
                          </span>
                        )}
                        {audition.slots && (
                          <span className="px-3 py-1 rounded-lg bg-[#2e3e5e]/80 border border-[#5a8ff5]/30 text-[#5a8ff5] text-sm shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
                            {audition.slots.length} slots
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-[#c5ddff]/70">
                        Posted {new Date(audition.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button text="Edit" href={`/cast/edit/${audition.audition_id}`} className="n-button-primary" />
                      <button
                        onClick={() => handleDelete(audition.audition_id)}
                        disabled={deleting === audition.audition_id}
                        className="n-button-danger"
                      >
                        {deleting === audition.audition_id ? 'Deleting...' : 'Delete'}
                      </button>
                      <Button text="View" href={`/auditions/${audition.audition_id}`} className='n-button-secondary' />
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
