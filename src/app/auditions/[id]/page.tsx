'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuditionById } from '@/lib/supabase/auditionQueries';
import { getUser } from '@/lib/supabase/auth';
import StarryContainer from '@/components/StarryContainer';
import AuditionHeader from '@/components/auditions/AuditionHeader';
import RolesList from '@/components/auditions/RolesList';
import SlotsList from '@/components/auditions/SlotsList';
import AuditionInfo from '@/components/auditions/AuditionInfo';


export default function AuditionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [audition, setAudition] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAudition();
    checkAuth();
  }, [params.id]);

  const loadAudition = async () => {
    setLoading(true);
    const { data, error } = await getAuditionById(params.id as string);
    
    console.log('Loading audition:', params.id);
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (error) {
      console.error('Error loading audition:', error);
      alert('Error loading audition: ' + error.message);
      router.push('/auditions');
      return;
    }
    
    if (!data) {
      console.error('No audition data found');
      alert('Audition not found');
      router.push('/auditions');
      return;
    }
    
    setAudition(data);
    setLoading(false);
  };

  const checkAuth = async () => {
    const currentUser = await getUser();
    setUser(currentUser);
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

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
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

          {/* Callback Management Button (Only for audition owner) */}
          {isOwner && (
            <div className="mt-6">
              <button
                onClick={() => router.push(`/auditions/${audition.audition_id}/callbacks`)}
                className="px-6 py-3 rounded-lg bg-[#5a8ff5] text-white hover:bg-[#4a7bd9] transition-all font-semibold shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]"
              >
                📋 Manage Callbacks
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Roles */}
              <RolesList roles={audition.roles || []} showId={audition.show_id} />

              {/* Audition Slots */}
              <SlotsList 
                slots={audition.slots || []} 
                auditionId={audition.audition_id}
                user={user}
                onSignupSuccess={loadAudition}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <AuditionInfo audition={audition} />
            </div>
          </div>
        </div>
      </div>
    </StarryContainer>
  );
}
