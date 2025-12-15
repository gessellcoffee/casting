'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';
import { getUserSignupsWithDetails, getUserCastShows, getUserOwnedAuditions, getUserProductionTeamAuditions, getUserOwnedAuditionSlots, getUserProductionTeamAuditionSlots, getUserOwnedRehearsalEvents, getUserProductionTeamRehearsalEvents, getUserCastRehearsalEvents, getUserRehearsalAgendaItems } from '@/lib/supabase/auditionSignups';
import { getUserAcceptedCallbacks } from '@/lib/supabase/callbackInvitations';
import { getEvents } from '@/lib/supabase/events';
import AuditionCalendar from '@/components/auditions/AuditionCalendar';
import DownloadMyCalendarButton from '@/components/auditions/DownloadMyCalendarButton';
import GoogleCalendarSync from '@/components/calendar/GoogleCalendarSync';
import { generateProductionEvents, mapProductionEventsToCalendarEvents, ProductionDateEvent } from '@/lib/utils/calendarEvents';
import { getProductionEventsByAuditionIds, getUserAssignedProductionEvents } from '@/lib/supabase/productionEventsCalendar';
import { Check, X } from 'lucide-react';

// Component that uses searchParams - must be wrapped in Suspense
function ConnectionStatusHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connectionStatus, setConnectionStatus] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const googleConnected = searchParams.get('google_connected');
    const googleError = searchParams.get('google_error');

    if (googleConnected === 'true') {
      setConnectionStatus({
        show: true,
        type: 'success',
        message: 'Successfully connected to Google Calendar!'
      });
      // Clear query params after 3 seconds
      setTimeout(() => {
        setConnectionStatus(null);
        router.replace('/my-calendar');
      }, 3000);
    } else if (googleError) {
      const errorMessages: Record<string, string> = {
        cancelled: 'Google Calendar connection was cancelled.',
        invalid: 'Invalid OAuth callback. Please try again.',
        storage: 'Failed to save connection. Please try again.',
        unknown: 'An error occurred. Please try again.'
      };
      setConnectionStatus({
        show: true,
        type: 'error',
        message: errorMessages[googleError] || 'An error occurred.'
      });
      // Clear query params after 5 seconds
      setTimeout(() => {
        setConnectionStatus(null);
        router.replace('/my-calendar');
      }, 5000);
    }
  }, [searchParams, router]);

  if (!connectionStatus?.show) return null;

  return (
    <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
      connectionStatus.type === 'success' 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
    }`}>
      {connectionStatus.type === 'success' ? (
        <Check className="w-5 h-5 flex-shrink-0" />
      ) : (
        <X className="w-5 h-5 flex-shrink-0" />
      )}
      <span>{connectionStatus.message}</span>
    </div>
  );
}

function MyCalendarContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [signups, setSignups] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [personalEvents, setPersonalEvents] = useState<any[]>([]);
  const [productionEvents, setProductionEvents] = useState<ProductionDateEvent[]>([]);
  const [filteredProductionEvents, setFilteredProductionEvents] = useState<ProductionDateEvent[]>([]);
  const [hasOwnedAuditions, setHasOwnedAuditions] = useState(false);
  const [hasProductionTeamAuditions, setHasProductionTeamAuditions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calendarKey, setCalendarKey] = useState(0); // Force calendar refresh

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('[MyCalendar] Loading calendar data...');
    setLoading(true);
    
    try {
      const currentUser = await getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      
      // Calculate date range for personal events (6 months back and forward)
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
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
        castRehearsalEvents,
        userAgendaItems,
        userPersonalEvents,
        assignedProductionEvents
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
        getUserCastRehearsalEvents(currentUser.id),
        getUserRehearsalAgendaItems(currentUser.id),
        getEvents(sixMonthsAgo, sixMonthsFromNow, currentUser.id),
        getUserAssignedProductionEvents(currentUser.id)
      ]);
      
      setSignups(userSignups);
      setCallbacks(userCallbacks);
      setPersonalEvents(userPersonalEvents);
      setHasOwnedAuditions(ownedAuditions.length > 0);
      setHasProductionTeamAuditions(productionTeamAuditions.length > 0);
      
      console.log('[MyCalendar] Personal events loaded:', userPersonalEvents.length);
      
      // Combine slots and rehearsal events
      const allSlots = [...ownedSlots, ...productionTeamSlots];
      const allRehearsalEvents = [...ownedRehearsalEvents, ...productionTeamRehearsalEvents, ...castRehearsalEvents];
      
      console.log('Calendar Data Summary:', {
        ownedAuditions: ownedAuditions.length,
        ownedSlots: ownedSlots.length,
        productionTeamSlots: productionTeamSlots.length,
        allSlots: allSlots.length,
        castRehearsalEvents: castRehearsalEvents.length,
        allRehearsalEvents: allRehearsalEvents.length,
        userAgendaItems: userAgendaItems.length,
        personalEvents: userPersonalEvents.length,
        hasOwnedAuditions: ownedAuditions.length > 0,
        hasProductionTeamAuditions: productionTeamAuditions.length > 0
      });
      
      // Generate production events (rehearsal/performance dates, audition slots, rehearsal events)
      // Note: Agenda items are shown within rehearsal event modals, not as separate calendar events
      const ownerAuditionIds = ownedAuditions.map((a: any) => a.audition_id).filter(Boolean);
      const teamAuditionIds = productionTeamAuditions.map((a: any) => a.auditions?.audition_id).filter(Boolean);
      const managedAuditionIds = Array.from(new Set([...ownerAuditionIds, ...teamAuditionIds]));
      const managedProductionEventRows = await getProductionEventsByAuditionIds(managedAuditionIds);

      const allProductionEvents = [
        ...generateProductionEvents(castShows, 'cast', [], castRehearsalEvents),
        ...generateProductionEvents(ownedAuditions, 'owner', allSlots, ownedRehearsalEvents),
        ...generateProductionEvents(productionTeamAuditions, 'production_team', allSlots, productionTeamRehearsalEvents),
        ...mapProductionEventsToCalendarEvents(assignedProductionEvents, 'cast'),
        ...mapProductionEventsToCalendarEvents(managedProductionEventRows, 'owner')
        // Removed: generateAgendaItemEvents(userAgendaItems) - agenda items shown in rehearsal event modals instead
      ];
      
      console.log('Generated production events:', allProductionEvents.length, allProductionEvents);
      
      // Deduplicate events - if user has multiple roles (owner + team + cast), they may get the same event multiple times
      const seenKeys = new Set<string>();
      const deduplicatedEvents: ProductionDateEvent[] = [];
      
      allProductionEvents.forEach((event: ProductionDateEvent) => {
        // For rehearsal events and audition slots, deduplicate by eventId/slotId
        const uniqueKey = event.productionEventId || event.eventId || event.slotId || `${event.type}-${event.date.getTime()}-${event.title}`;
        
        if (!seenKeys.has(uniqueKey)) {
          seenKeys.add(uniqueKey);
          deduplicatedEvents.push(event);
        } else {
          console.log('[MyCalendar] DUPLICATE FOUND - Skipping:', {
            title: event.title,
            type: event.type,
            eventId: event.eventId,
            date: event.date,
            uniqueKey
          });
        }
      });
      
      console.log('[MyCalendar] Deduplication:', {
        beforeDedup: allProductionEvents.length,
        afterDedup: deduplicatedEvents.length,
        removed: allProductionEvents.length - deduplicatedEvents.length
      });
      
      setProductionEvents(deduplicatedEvents);
      
      // Force calendar to remount and reload personal events
      setCalendarKey(prev => prev + 1);
      
      console.log('[MyCalendar] Calendar data loaded successfully');
    } catch (error) {
      console.error('[MyCalendar] Error loading data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
      console.log('[MyCalendar] Loading complete');
    }
  };

  if (loading) {
    return (
      <div className="text-neu-text-primary/70">Loading your calendar...</div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Connection Status Alert */}
        <Suspense fallback={null}>
          <ConnectionStatusHandler />
        </Suspense>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-neu-text-primary mb-2">
              My Calendar
            </h1>
            <p className="text-neu-text-primary/70">
              View, update, and manage your auditions, rehearsals, and performances
            </p>
          </div>
          
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
            <GoogleCalendarSync 
              userId={user.id}
              onSyncComplete={loadData}
            />
            <DownloadMyCalendarButton
              signups={signups}
              callbacks={callbacks}
              productionEvents={filteredProductionEvents.length > 0 ? filteredProductionEvents : productionEvents}
            />
          </div>
        </div>

        <AuditionCalendar 
          key={calendarKey}
          signups={signups} 
          callbacks={callbacks} 
          productionEvents={productionEvents}
          userId={user.id} 
          onRefresh={loadData}
          hasOwnedAuditions={hasOwnedAuditions}
          hasProductionTeamAuditions={hasProductionTeamAuditions}
          onFilteredEventsChange={setFilteredProductionEvents}
        />
      </div>
    </div>
  );
}

export default function MyCalendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-6">
        <div className="text-neu-text-primary/70">Loading your calendar...</div>
      </div>
    }>
      <MyCalendarContent />
    </Suspense>
  );
}
