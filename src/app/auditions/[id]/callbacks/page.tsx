'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuditionById } from '@/lib/supabase/auditionQueries';
import { getUser } from '@/lib/supabase/auth';
import { isUserProductionMember } from '@/lib/supabase/productionTeamMembers';
import StarryContainer from '@/components/StarryContainer';
import CallbackManagement from '@/components/callbacks/CallbackManagement';
import CastingOffersPanel from '@/components/casting/CastingOffersPanel';

export default function CallbackManagementPage() {
  const params = useParams();
  const router = useRouter();
  const [audition, setAudition] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'callbacks' | 'offers'>('callbacks');

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      // Get audition details
      const { data: auditionData, error: auditionError } = await getAuditionById(params.id as string);
      
      if (auditionError) {
        throw new Error(auditionError.message);
      }
      
      if (!auditionData) {
        throw new Error('Audition not found');
      }

      // Check if user owns this audition or is a production member
      const isOwner = auditionData.user_id === currentUser.id;
      const isMember = await isUserProductionMember(params.id as string, currentUser.id);
      
      if (!isOwner && !isMember) {
        setError('You do not have permission to manage callbacks for this audition');
        return;
      }

      setAudition(auditionData);
    } catch (err: any) {
      console.error('Error loading callback management:', err);
      setError(err.message || 'Failed to load callback management');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading callback management...</div>
        </div>
      </StarryContainer>
    );
  }

  if (error) {
    return (
      <StarryContainer>
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => router.push(`/auditions/${params.id}`)}
              className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-2"
            >
              ← Back to Audition
            </button>
            <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30">
              <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
              <p className="text-neu-text-primary/70">{error}</p>
            </div>
          </div>
        </div>
      </StarryContainer>
    );
  }

  if (!audition) {
    return null;
  }

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push(`/auditions/${params.id}`)}
            className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-2"
          >
            ← Back to Audition
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neu-text-primary mb-2">
              Casting Management
            </h1>
            <p className="text-neu-text-primary/70">
              {audition.shows?.title || 'Untitled Show'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('callbacks')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all border ${
                activeTab === 'callbacks'
                  ? 'shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] border-neu-accent-primary text-neu-accent-primary'
                  : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border-neu-border text-neu-text-primary hover:border-neu-accent-primary/50'
              }`}
              style={{ backgroundColor: 'var(--neu-surface)' }}
            >
              📋 Callbacks
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all border ${
                activeTab === 'offers'
                  ? 'shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] border-neu-accent-primary text-neu-accent-primary'
                  : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border-neu-border text-neu-text-primary hover:border-neu-accent-primary/50'
              }`}
              style={{ backgroundColor: 'var(--neu-surface)' }}
            >
              🎭 Casting Offers
            </button>
          </div>

          {/* Content */}
          {activeTab === 'callbacks' && (
            <CallbackManagement 
              audition={audition} 
              user={user}
              onUpdate={loadData}
            />
          )}

          {activeTab === 'offers' && (
            <CastingOffersPanel
              auditionId={audition.audition_id}
              currentUserId={user.id}
            />
          )}
        </div>
      </div>
    </StarryContainer>
  );
}
