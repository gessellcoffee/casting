'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';
import { getUserSignupsWithDetails, getUserCastShows, getUserOwnedAuditions, getUserProductionTeamAuditions, getUserOwnedAuditionSlots, getUserProductionTeamAuditionSlots, getUserOwnedRehearsalEvents, getUserProductionTeamRehearsalEvents, getUserRehearsalAgendaItems } from '@/lib/supabase/auditionSignups';
import { getUserAcceptedCallbacks } from '@/lib/supabase/callbackInvitations';
import AuditionCalendar from '@/components/auditions/AuditionCalendar';
import DownloadMyCalendarButton from '@/components/auditions/DownloadMyCalendarButton';
import GoogleCalendarImport from '@/components/calendar/GoogleCalendarImport';
import { generateProductionEvents, generateAgendaItemEvents, ProductionDateEvent } from '@/lib/utils/calendarEvents';

export default function MyAuditionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [signups, setSignups] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [productionEvents, setProductionEvents] = useState<ProductionDateEvent[]>([]);
  const [hasOwnedAuditions, setHasOwnedAuditions] = useState(false);
  const [hasProductionTeamAuditions, setHasProductionTeamAuditions] = useState(false);
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
      const [
        userSignups,
        userCallbacks,
        castShows,
        ownedAuditions,
        productionTeamAuditions,
        ownedSlots,
        productionTeamSlots,
        ownedRehearsalEvents,
        productionTeamRehearsalEvents,
        userAgendaItems
      ] = await Promise.all([
        getUserSignupsWithDetails(currentUser.id),
        getUserAcceptedCallbacks(currentUser.id),
        getUserCastShows(currentUser.id),
        getUserOwnedAuditions(currentUser.id),
        getUserProductionTeamAuditions(currentUser.id),
        getUserOwnedAuditionSlots(currentUser.id),
        getUserProductionTeamAuditionSlots(currentUser.id),
        getUserOwnedRehearsalEvents(currentUser.id),
        getUserProductionTeamRehearsalEvents(currentUser.id),
        getUserRehearsalAgendaItems(currentUser.id)
      ]);
      
      setSignups(userSignups);
      setCallbacks(userCallbacks);
      setHasOwnedAuditions(ownedAuditions.length > 0);
      setHasProductionTeamAuditions(productionTeamAuditions.length > 0);
      
      // Combine slots and rehearsal events
      const allSlots = [...ownedSlots, ...productionTeamSlots];
      const allRehearsalEvents = [...ownedRehearsalEvents, ...productionTeamRehearsalEvents];
      
      console.log('Calendar Data Summary:', {
        ownedAuditions: ownedAuditions.length,
        ownedSlots: ownedSlots.length,
        productionTeamSlots: productionTeamSlots.length,
        allSlots: allSlots.length,
        allRehearsalEvents: allRehearsalEvents.length,
        userAgendaItems: userAgendaItems.length,
        hasOwnedAuditions: ownedAuditions.length > 0,
        hasProductionTeamAuditions: productionTeamAuditions.length > 0
      });
      
      // Generate production events (rehearsal/performance dates, audition slots, agenda items)
      const allProductionEvents = [
        ...generateProductionEvents(castShows, 'cast'),
        ...generateProductionEvents(ownedAuditions, 'owner', allSlots),
        ...generateProductionEvents(productionTeamAuditions, 'production_team', allSlots),
        ...generateAgendaItemEvents(userAgendaItems)
      ];
      
      console.log('Generated production events:', allProductionEvents.length, allProductionEvents);
      
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
          
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
            {/* <GoogleCalendarImport 
              userId={user.id}
              onImportComplete={loadData}
            /> */}
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
          hasOwnedAuditions={hasOwnedAuditions}
          hasProductionTeamAuditions={hasProductionTeamAuditions}
        />
      </div>
    </div>
  );
}
