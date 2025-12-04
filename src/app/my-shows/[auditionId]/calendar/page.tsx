'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';
import { getUserSignupsWithDetails, getUserCastShows, getUserCastShowsFromCastMembers, getUserOwnedAuditions, getUserProductionTeamAuditions, getUserOwnedAuditionSlots, getUserProductionTeamAuditionSlots, getUserOwnedRehearsalEvents, getUserProductionTeamRehearsalEvents, getUserCastRehearsalEvents, getUserRehearsalAgendaItems } from '@/lib/supabase/auditionSignups';
import { getUserAcceptedCallbacks } from '@/lib/supabase/callbackInvitations';
import { getCastMemberWithDetails } from '@/lib/supabase/castMembers';
import AuditionCalendar from '@/components/auditions/AuditionCalendar';
import StarryContainer from '@/components/StarryContainer';
import Button from '@/components/Button';
import { generateProductionEvents, generateAgendaItemEvents, filterEventsByAuditionId, ProductionDateEvent } from '@/lib/utils/calendarEvents';
import { ArrowLeft, Download } from 'lucide-react';
import DownloadShowPDFButton from '@/components/shows/DownloadShowPDFButton';

export default function ShowCalendarPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const auditionId = params.auditionId as string;
  
  const [user, setUser] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<any>(null);
  const [castMembership, setCastMembership] = useState<any>(null);
  const [productionEvents, setProductionEvents] = useState<ProductionDateEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ProductionDateEvent[]>([]);
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
        castRehearsalEvents,
        userAgendaItems
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
        getUserCastRehearsalEvents(currentUser.id),
        getUserRehearsalAgendaItems(currentUser.id)
      ]);
      
      console.log('DEBUG - Calendar data loaded:', {
        auditionId,
        castShowsCount: castShows.length,
        castShowsFromMembersCount: castShowsFromMembers.length,
        castShowsFromMembers: castShowsFromMembers,
        ownedAuditionsCount: ownedAuditions.length
      });
      
      // Combine slots and rehearsal events
      const allSlots = [...ownedSlots, ...productionTeamSlots];
      const allRehearsalEvents = [...ownedRehearsalEvents, ...productionTeamRehearsalEvents, ...castRehearsalEvents];
      
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
      const allProductionEvents = [
        ...generateProductionEvents(castShows, 'cast', undefined, allRehearsalEvents),
        ...generateProductionEvents(castMemberAuditions, 'cast', undefined, allRehearsalEvents),
        ...generateProductionEvents(ownedAuditions, 'owner', allSlots, allRehearsalEvents),
        ...generateProductionEvents(productionTeamAuditions, 'production_team', allSlots, allRehearsalEvents),
        ...generateAgendaItemEvents(userAgendaItems)
      ];
      
      // Filter to only this show's events
      const filteredEvents = filterEventsByAuditionId(allProductionEvents, auditionId);
      setProductionEvents(filteredEvents);
      
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
                  events={filteredEvents.length > 0 ? filteredEvents : productionEvents}
                  showDetails={{
                    title: showDetails.title,
                    author: showDetails.author,
                    roleName: castMembership?.role_name,
                    isUnderstudy: castMembership?.is_understudy,
                  }}
                  actorName={`${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim()}
                  format="actor"
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
