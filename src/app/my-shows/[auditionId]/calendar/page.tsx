'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';
import { getUserSignupsWithDetails, getUserCastShows, getUserCastShowsFromCastMembers, getUserOwnedAuditions, getUserProductionTeamAuditions, getUserOwnedAuditionSlots, getUserProductionTeamAuditionSlots, getUserOwnedRehearsalEvents, getUserProductionTeamRehearsalEvents, getUserRehearsalAgendaItems } from '@/lib/supabase/auditionSignups';
import { getUserAcceptedCallbacks } from '@/lib/supabase/callbackInvitations';
import { getCastMemberWithDetails } from '@/lib/supabase/castMembers';
import AuditionCalendar from '@/components/auditions/AuditionCalendar';
import StarryContainer from '@/components/StarryContainer';
import Button from '@/components/Button';
import { generateProductionEvents, filterEventsByAuditionId, mapProductionEventsToCalendarEvents, ProductionDateEvent } from '@/lib/utils/calendarEvents';
import { getProductionEvents } from '@/lib/supabase/productionEvents';
import { ArrowLeft, Download } from 'lucide-react';
import DownloadShowPDFButton from '@/components/shows/DownloadShowPDFButton';
import { getAgendaItems, getCastMembers } from '@/lib/supabase/agendaItems';
import { getRehearsalEventsWithAgenda } from '@/lib/supabase/rehearsalEvents';
import { formatUSTime } from '@/lib/utils/dateUtils';
import type { EventTypeFilter } from '@/components/auditions/CalendarLegend';

function ShowCalendarPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const auditionId = params.auditionId as string;
  
  const [user, setUser] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<any>(null);
  const [castMembership, setCastMembership] = useState<any>(null);
  const [productionEvents, setProductionEvents] = useState<ProductionDateEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ProductionDateEvent[]>([]);
  const [agendaItemEventsForPdf, setAgendaItemEventsForPdf] = useState<ProductionDateEvent[]>([]);
  const [activeFilters, setActiveFilters] = useState<EventTypeFilter | null>(null);
  const [activeProductionEventTypeFilters, setActiveProductionEventTypeFilters] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [auditionId]);

  useEffect(() => {
    // Check if download param is present
    const downloadParam = searchParams.get('download');
    if (downloadParam === 'pdf' && showDetails && productionEvents.length > 0) {
      // Trigger PDF download
      // This will be handled by the DownloadShowPDFButton component
    }
  }, [searchParams, showDetails, productionEvents]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const currentUser = await getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      
      // Load all calendar data
      const [
        userSignups,
        userCallbacks,
        castShows,
        castShowsFromMembers,
        ownedAuditions,
        productionTeamAuditions,
        ownedSlots,
        productionTeamSlots,
        ownedRehearsalEvents,
        productionTeamRehearsalEvents,
        userAgendaItems,
        productionEventRows,
        rehearsalEventsWithAgenda
      ] = await Promise.all([
        getUserSignupsWithDetails(currentUser.id),
        getUserAcceptedCallbacks(currentUser.id),
        getUserCastShows(currentUser.id),
        getUserCastShowsFromCastMembers(currentUser.id),
        getUserOwnedAuditions(currentUser.id),
        getUserProductionTeamAuditions(currentUser.id),
        getUserOwnedAuditionSlots(currentUser.id),
        getUserProductionTeamAuditionSlots(currentUser.id),
        getUserOwnedRehearsalEvents(currentUser.id),
        getUserProductionTeamRehearsalEvents(currentUser.id),
        getUserRehearsalAgendaItems(currentUser.id),
        getProductionEvents(auditionId),
        getRehearsalEventsWithAgenda(auditionId)
      ]);
      
      console.log('DEBUG - Calendar data loaded:', {
        auditionId,
        castShowsCount: castShows.length,
        castShowsFromMembersCount: castShowsFromMembers.length,
        castShowsFromMembers: castShowsFromMembers,
        ownedAuditionsCount: ownedAuditions.length,
        ownedRehearsalEventsCount: ownedRehearsalEvents.length,
        productionTeamRehearsalEventsCount: productionTeamRehearsalEvents.length,
        castRehearsalEventsCount: (rehearsalEventsWithAgenda as any)?.data?.length || 0
      });
      
      // Combine slots (but keep rehearsal events separate to avoid duplicates)
      const allSlots = [...ownedSlots, ...productionTeamSlots];

      const { data: castData } = await getCastMembers(auditionId);
      const fullCastUsers = (castData || [])
        .map((m: any) => {
          const id = m?.user_id;
          const p = m?.profiles;
          const full_name = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : '';
          if (!id || !full_name) return null;
          return { id, full_name, profile_photo_url: p?.profile_photo_url || null };
        })
        .filter(Boolean);

      const showRehearsalEventsRaw = (rehearsalEventsWithAgenda as any)?.data || [];
      const showRehearsalEvents = (showRehearsalEventsRaw || []).map((evt: any) => {
        const agendaItems = Array.isArray(evt?.rehearsal_agenda_items) ? evt.rehearsal_agenda_items : [];

        // If no agenda items, treat as a full-cast call in show calendar
        if (agendaItems.length === 0) {
          return {
            ...evt,
            showEventCalledUsers: true,
            calledUsers: fullCastUsers,
          };
        }

        const agendaWithCalled = agendaItems.map((ai: any) => {
          const assignments = Array.isArray(ai?.agenda_assignments) ? ai.agenda_assignments : [];
          const calledUsers = assignments
            .map((a: any) => {
              const id = a?.user_id;
              const p = a?.profiles;
              const full_name = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : '';
              if (!id || !full_name) return null;
              return { id, full_name, profile_photo_url: p?.profile_photo_url || null };
            })
            .filter(Boolean);

          return {
            ...ai,
            calledUsers,
          };
        });

        const calledMap = new Map<string, any>();
        agendaWithCalled.forEach((ai: any) => {
          (ai.calledUsers || []).forEach((u: any) => {
            calledMap.set(u.id, u);
          });
        });

        return {
          ...evt,
          showEventCalledUsers: true,
          calledUsers: Array.from(calledMap.values()),
          rehearsal_agenda_items: agendaWithCalled,
        };
      });
      
      // Transform castShowsFromMembers to match calendar event format
      const castMemberAuditions = castShowsFromMembers
        .filter((member: any) => member.auditions)
        .map((member: any) => ({
          audition_id: member.auditions.audition_id,
          rehearsal_dates: member.auditions.rehearsal_dates,
          rehearsal_location: member.auditions.rehearsal_location,
          performance_dates: member.auditions.performance_dates,
          performance_location: member.auditions.performance_location,
          shows: member.auditions.shows,
          is_understudy: member.is_understudy,
          role_name: member.audition_roles?.role_name || member.roles?.role_name
        }));
      
      // Generate ALL production events
      // Note: Pass rehearsal events separately to each call to avoid duplicates
      // Note: Agenda items are shown within rehearsal event modals, not as separate calendar events
      const castShowsEvents = generateProductionEvents(castShows, 'cast', undefined, []);
      const castMemberEvents = generateProductionEvents(castMemberAuditions, 'cast', undefined, showRehearsalEvents);
      const ownedEvents = generateProductionEvents(ownedAuditions, 'owner', allSlots, ownedRehearsalEvents);
      const teamEvents = generateProductionEvents(productionTeamAuditions, 'production_team', allSlots, productionTeamRehearsalEvents);
      
      console.log('DEBUG - Generated events:', {
        castShowsEvents: castShowsEvents.length,
        castMemberEvents: castMemberEvents.length,
        ownedEvents: ownedEvents.length,
        teamEvents: teamEvents.length,
        castShowsRehearsals: castShowsEvents.filter(e => e.type === 'rehearsal_event').length,
        castMemberRehearsals: castMemberEvents.filter(e => e.type === 'rehearsal_event').length,
        ownedRehearsals: ownedEvents.filter(e => e.type === 'rehearsal_event').length,
        teamRehearsals: teamEvents.filter(e => e.type === 'rehearsal_event').length
      });
      
      const allProductionEvents = [
        ...castShowsEvents,
        ...castMemberEvents,
        ...ownedEvents,
        ...teamEvents,
        ...mapProductionEventsToCalendarEvents(productionEventRows, 'cast')
        // Removed: generateAgendaItemEvents(userAgendaItems) - agenda items shown in rehearsal event modals instead
      ];
      
      // Filter to only this show's events
      const filteredEvents = filterEventsByAuditionId(allProductionEvents, auditionId);
      
      // Deduplicate events - if user has multiple roles (owner + team + cast), they may get the same event multiple times
      const seenKeys = new Set<string>();
      const deduplicatedEvents: ProductionDateEvent[] = [];
      
      filteredEvents.forEach((event: ProductionDateEvent) => {
        // For rehearsal events and audition slots, deduplicate by eventId/slotId
        const uniqueKey = event.productionEventId || event.eventId || event.slotId || `${event.type}-${event.date.getTime()}-${event.title}`;
        
        if (!seenKeys.has(uniqueKey)) {
          seenKeys.add(uniqueKey);
          deduplicatedEvents.push(event);
        } else {
          console.log('DUPLICATE FOUND - Skipping:', {
            title: event.title,
            type: event.type,
            eventId: event.eventId,
            date: event.date,
            uniqueKey
          });
        }
      });
      
      console.log('DEBUG - Deduplication:', {
        beforeDedup: filteredEvents.length,
        afterDedup: deduplicatedEvents.length,
        removed: filteredEvents.length - deduplicatedEvents.length,
        seenKeys: Array.from(seenKeys)
      });
      
      // Enrich rehearsal events with agenda + called people summaries (for PDF export)
      const rehearsalEventIds = Array.from(
        new Set(
          deduplicatedEvents
            .filter(e => e.type === 'rehearsal_event' && !!e.eventId)
            .map(e => e.eventId as string)
        )
      );

      let rehearsalDescriptionByEventId = new Map<string, string>();
      const agendaItemEvents: ProductionDateEvent[] = [];
      if (rehearsalEventIds.length > 0) {
        const roleByUserId = new Map<string, string>();

        (castData || []).forEach((m: any) => {
          const userId = m?.user_id;
          if (!userId) return;
          const roleName = m?.audition_roles?.role_name || m?.roles?.role_name;
          if (roleName) roleByUserId.set(userId, roleName);
        });

        const agendaResults = await Promise.all(
          rehearsalEventIds.map(async (rehearsalEventId) => {
            const { data } = await getAgendaItems(rehearsalEventId);
            return { rehearsalEventId, items: data || [] };
          })
        );

        agendaResults.forEach(({ rehearsalEventId, items }) => {
          if (!items || items.length === 0) return;

          const rehearsalEvent = deduplicatedEvents.find(e => e.type === 'rehearsal_event' && e.eventId === rehearsalEventId);
          const baseDate = rehearsalEvent?.date ? new Date(rehearsalEvent.date) : null;

          const lines: string[] = [];
          items.forEach((item: any) => {
            const start = item?.start_time ? formatUSTime(item.start_time) : '';
            const end = item?.end_time ? formatUSTime(item.end_time) : '';
            const timeLabel = start && end ? `${start}-${end}` : start || end;

            const assignments = Array.isArray(item?.agenda_assignments) ? item.agenda_assignments : [];
            const called = assignments
              .map((a: any) => {
                const first = a?.profiles?.first_name || '';
                const last = a?.profiles?.last_name || '';
                const name = `${first} ${last}`.trim();
                const role = a?.user_id ? roleByUserId.get(a.user_id) : undefined;
                if (!name) return '';
                return role ? `${name} (${role})` : name;
              })
              .filter(Boolean);

            const calledLabel = called.length > 0 ? `Called: ${called.join(', ')}` : 'Called: (none)';
            lines.push(`${timeLabel} ${item?.title || 'Agenda Item'} — ${calledLabel}`.trim());

            // Also add agenda items as their own events for PDF export
            if (baseDate) {
              const startTime = item?.start_time ? new Date(baseDate) : undefined;
              const endTime = item?.end_time ? new Date(baseDate) : undefined;

              if (startTime && item?.start_time) {
                const [h, m] = String(item.start_time).split(':');
                startTime.setHours(parseInt(h, 10), parseInt(m, 10), 0);
              }
              if (endTime && item?.end_time) {
                const [h, m] = String(item.end_time).split(':');
                endTime.setHours(parseInt(h, 10), parseInt(m, 10), 0);
              }

              agendaItemEvents.push({
                type: 'agenda_item',
                title: item?.title || 'Agenda Item',
                show: rehearsalEvent?.show,
                date: startTime || new Date(baseDate),
                startTime,
                endTime,
                location: rehearsalEvent?.location || null,
                auditionId,
                userRole: 'cast',
                eventId: rehearsalEventId,
                agendaItemId: item?.rehearsal_agenda_items_id,
                description: calledLabel,
              } as any);
            }
          });

          if (lines.length > 0) {
            rehearsalDescriptionByEventId.set(rehearsalEventId, `Agenda:\n${lines.map(l => `- ${l}`).join('\n')}`);
          }
        });
      }

      const deduplicatedEventsWithAgenda: ProductionDateEvent[] = deduplicatedEvents.map((e) => {
        if (e.type !== 'rehearsal_event' || !e.eventId) return e;
        const desc = rehearsalDescriptionByEventId.get(e.eventId);
        if (!desc) return e;
        return { ...e, description: desc };
      });

      setProductionEvents(deduplicatedEventsWithAgenda);
      setAgendaItemEventsForPdf(agendaItemEvents);
      
      // Get show details from the first event OR from cast membership data
      if (filteredEvents.length > 0) {
        setShowDetails(filteredEvents[0].show);
      } else {
        // Fallback: Get show details from cast membership
        const castMember = castShowsFromMembers.find((member: any) => 
          member.auditions?.audition_id === auditionId
        );
        if (castMember && castMember.auditions?.shows) {
          setShowDetails(castMember.auditions.shows);
        }
      }
      
      // Find the cast membership for this show to get role info
      // First try from cast_members table (more reliable)
      let castMember = castShowsFromMembers.find((member: any) => 
        member.auditions?.audition_id === auditionId
      );
      
      // Fall back to audition_signups if not found
      if (!castMember) {
        castMember = castShows.find((show: any) => 
          show.audition_slots?.auditions?.audition_id === auditionId
        );
      }
      
      if (castMember) {
        setCastMembership({
          role_name: castMember.audition_roles?.role_name || castMember.roles?.role_name || 'Ensemble',
          is_understudy: castMember.is_understudy || false,
        });
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading calendar...</div>
        </div>
      </StarryContainer>
    );
  }

  if (!user || !showDetails) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Show not found</div>
        </div>
      </StarryContainer>
    );
  }

  const exportAgendaItemsEnabled = activeFilters ? activeFilters.rehearsalEvents : true;
  const exportEvents: ProductionDateEvent[] = [
    ...filteredEvents,
    ...(exportAgendaItemsEnabled ? agendaItemEventsForPdf : []),
  ];

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={() => router.push('/my-shows')}
              variant="secondary"
              className="flex items-center gap-2 mb-4"
            >
              <ArrowLeft size={20} />
              <span>Back to My Shows</span>
            </Button>
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-neu-text-primary mb-2">
                  {showDetails.title}
                </h1>
                {showDetails.author && (
                  <p className="text-neu-text-secondary text-lg mb-2">
                    by {showDetails.author}
                  </p>
                )}
                {castMembership && (
                  <p className="text-neu-text-primary font-medium">
                    Your Role: {castMembership.is_understudy ? 'Understudy - ' : ''}{castMembership.role_name}
                  </p>
                )}
              </div>
              
              <div className="shrink-0">
                <DownloadShowPDFButton
                  events={exportEvents}
                  showDetails={{
                    title: showDetails.title,
                    author: showDetails.author,
                    roleName: castMembership?.role_name,
                    isUnderstudy: castMembership?.is_understudy,
                  }}
                  actorName={`${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim()}
                  format="production"
                />
              </div>
            </div>
          </div>

          {/* Calendar */}
          {productionEvents.length > 0 ? (
            <AuditionCalendar 
              signups={[]} 
              callbacks={[]} 
              productionEvents={productionEvents}
              userId={user.id} 
              onRefresh={loadData}
              hasOwnedAuditions={false}
              hasProductionTeamAuditions={false}
              onFilteredEventsChange={setFilteredEvents}
              onFilterStateChange={(filters, productionEventTypeFilters, _showCallbacks) => {
                setActiveFilters(filters);
                setActiveProductionEventTypeFilters(productionEventTypeFilters);
              }}
            />
          ) : (
            <div className="p-12 text-center rounded-xl border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
              <p className="text-neu-text-secondary text-lg mb-2">No calendar events yet</p>
              <p className="text-neu-text-secondary text-sm">
                Rehearsal and performance dates will appear here once they're scheduled
              </p>
            </div>
          )}
        </div>
      </div>
    </StarryContainer>
  );
}

export default function ShowCalendarPage() {
  return (
    <Suspense fallback={
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading calendar...</div>
        </div>
      </StarryContainer>
    }>
      <ShowCalendarPageContent />
    </Suspense>
  );
}
