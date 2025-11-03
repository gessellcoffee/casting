'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';
import { getUserSignupsWithDetails, getUserCastShows, getUserOwnedAuditions, getUserProductionTeamAuditions } from '@/lib/supabase/auditionSignups';
import { getUserAcceptedCallbacks } from '@/lib/supabase/callbackInvitations';
import AuditionCalendar from '@/components/auditions/AuditionCalendar';
import DownloadMyCalendarButton from '@/components/auditions/DownloadMyCalendarButton';
import { generateProductionEvents, ProductionDateEvent } from '@/lib/utils/calendarEvents';

export default function MyAuditionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [signups, setSignups] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [productionEvents, setProductionEvents] = useState<ProductionDateEvent[]>([]);
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
      const [userSignups, userCallbacks, castShows, ownedAuditions, productionTeamAuditions] = await Promise.all([
        getUserSignupsWithDetails(currentUser.id),
        getUserAcceptedCallbacks(currentUser.id),
        getUserCastShows(currentUser.id),
        getUserOwnedAuditions(currentUser.id),
        getUserProductionTeamAuditions(currentUser.id)
      ]);
      
      setSignups(userSignups);
      setCallbacks(userCallbacks);
      
      // Generate production events (rehearsal and performance dates)
      const allProductionEvents = [
        ...generateProductionEvents(castShows, 'cast'),
        ...generateProductionEvents(ownedAuditions, 'owner'),
        ...generateProductionEvents(productionTeamAuditions, 'production_team')
      ];
      
      setProductionEvents(allProductionEvents);
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-neu-text-primary/70">Loading your auditions...</div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-neu-text-primary mb-2">
              My Audition Calendar
            </h1>
            <p className="text-neu-text-primary/70">
              View, update, and manage your audition signups
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <DownloadMyCalendarButton
              signups={signups}
              callbacks={callbacks}
              productionEvents={productionEvents}
              variant="primary"
              size="md"
            />
          </div>
        </div>

        <AuditionCalendar 
          signups={signups} 
          callbacks={callbacks} 
          productionEvents={productionEvents}
          userId={user.id} 
          onRefresh={loadData} 
        />
      </div>
    </div>
  );
}
