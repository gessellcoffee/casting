'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';
import { getUserSignupsWithDetails } from '@/lib/supabase/auditionSignups';
import { getUserAcceptedCallbacks } from '@/lib/supabase/callbackInvitations';
import AuditionCalendar from '@/components/auditions/AuditionCalendar';

export default function MyAuditionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [signups, setSignups] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const currentUser = await getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      const [userSignups, userCallbacks] = await Promise.all([
        getUserSignupsWithDetails(currentUser.id),
        getUserAcceptedCallbacks(currentUser.id)
      ]);
      setSignups(userSignups);
      setCallbacks(userCallbacks);
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a2332] via-[#2e3e5e] to-[#1a2332] p-6 flex items-center justify-center">
        <div className="text-[#c5ddff]/70">Loading your auditions...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2332] via-[#2e3e5e] to-[#1a2332] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#c5ddff] mb-2">
            My Audition Calendar
          </h1>
          <p className="text-[#c5ddff]/70">
            View, update, and manage your audition signups
          </p>
        </div>

        <AuditionCalendar signups={signups} callbacks={callbacks} userId={user.id} onRefresh={loadData} />
      </div>
    </div>
  );
}
