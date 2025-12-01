'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';
import { getAuditionWithDetails } from '@/lib/supabase/auditions';
import { getAuditionSlots } from '@/lib/supabase/auditionSlots';
import { getProductionTeamMembers } from '@/lib/supabase/productionTeamMembers';
import LiveAuditionManager from '@/components/auditions/LiveAuditionManager';
import Alert from '@/components/ui/feedback/Alert';

export default function LiveAuditionPage() {
  const params = useParams();
  const router = useRouter();
  const auditionId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [audition, setAudition] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Get user
        const currentUser = await getUser();
        if (!currentUser) {
          setError('You must be logged in to access this page');
          setLoading(false);
          return;
        }
        setUser(currentUser);

        // Get audition with show details
        const auditionData = await getAuditionWithDetails(auditionId);
        if (!auditionData) {
          setError('Audition not found');
          setLoading(false);
          return;
        }
        setAudition(auditionData);

        // Get slots
        const slotsData = await getAuditionSlots(auditionId);
        setSlots(slotsData);

        // Check if user can manage (owner or production team)
        const isOwner = auditionData.user_id === currentUser.id;
        const teamMembers = await getProductionTeamMembers(auditionId);
        const isTeamMember = teamMembers.some((member: any) => member.user_id === currentUser.id);

        if (!isOwner && !isTeamMember) {
          setError('You do not have permission to access this page');
          setLoading(false);
          return;
        }

        setCanManage(true);
        setLoading(false);
      } catch (err) {
        console.error('Error loading live audition page:', err);
        setError('Failed to load audition data');
        setLoading(false);
      }
    }

    loadData();
  }, [auditionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neu-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neu-accent-primary mx-auto"></div>
          <p className="text-neu-text-primary mt-4">Loading audition...</p>
        </div>
      </div>
    );
  }

  if (error || !canManage || !audition || !user) {
    return (
      <div className="min-h-screen bg-neu-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="error" className="mb-4">
            {error || 'Access denied'}
          </Alert>
          <button
            onClick={() => router.push(`/auditions/${auditionId}`)}
            className="n-button-primary w-full py-3 rounded-lg"
          >
            Back to Audition
          </button>
        </div>
      </div>
    );
  }

  // Filter slots - show today's slots if available, otherwise show all upcoming slots
  const now = new Date();
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Get today's slots
  const todaySlots = slots.filter((slot: any) => {
    const slotTime = new Date(slot.start_time);
    return slotTime >= todayStart && slotTime < todayEnd;
  });

  // If no slots today, show all future slots
  const upcomingSlots = slots.filter((slot: any) => {
    const slotTime = new Date(slot.start_time);
    return slotTime >= now;
  });

  const slotsToShow = todaySlots.length > 0 ? todaySlots : upcomingSlots;

  return (
    <LiveAuditionManager
      auditionId={auditionId}
      auditionTitle={audition.shows?.title || 'Audition'}
      slots={slotsToShow}
      userId={user.id}
      onClose={() => router.push(`/auditions/${auditionId}`)}
    />
  );
}
