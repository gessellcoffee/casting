'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuditionById } from '@/lib/supabase/auditionQueries';
import { getUser } from '@/lib/supabase/auth';
import StarryContainer from '@/components/StarryContainer';
import CallbackManagement from '@/components/callbacks/CallbackManagement';

export default function CallbackManagementPage() {
  const params = useParams();
  const router = useRouter();
  const [audition, setAudition] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Check if user owns this audition
      if (auditionData.user_id !== currentUser.id) {
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
          <div className="text-[#c5ddff]/70">Loading callback management...</div>
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
              className="mb-6 text-[#5a8ff5] hover:text-[#94b0f6] transition-colors flex items-center gap-2"
            >
              ← Back to Audition
            </button>
            <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30">
              <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
              <p className="text-[#c5ddff]/70">{error}</p>
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
            className="mb-6 text-[#5a8ff5] hover:text-[#94b0f6] transition-colors flex items-center gap-2"
          >
            ← Back to Audition
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#c5ddff] mb-2">
              Callback Management
            </h1>
            <p className="text-[#c5ddff]/70">
              {audition.shows?.title || 'Untitled Show'}
            </p>
          </div>

          {/* Callback Management Component */}
          <CallbackManagement 
            audition={audition} 
            user={user}
            onUpdate={loadData}
          />
        </div>
      </div>
    </StarryContainer>
  );
}
