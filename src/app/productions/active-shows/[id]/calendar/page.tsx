'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';
import { getAudition } from '@/lib/supabase/auditions';
import { getUserOwnedAuditionSlots, getUserProductionTeamAuditionSlots, getUserOwnedRehearsalEvents, getUserProductionTeamRehearsalEvents } from '@/lib/supabase/auditionSignups';
import { getAuditionCastMembers } from '@/lib/supabase/castMembers';
import AuditionCalendar from '@/components/auditions/AuditionCalendar';
import StarryContainer from '@/components/StarryContainer';
import Button from '@/components/Button';
import { generateProductionEvents, filterEventsByAuditionId, ProductionDateEvent } from '@/lib/utils/calendarEvents';
import { ArrowLeft, Filter, X } from 'lucide-react';
import DownloadShowPDFButton from '@/components/shows/DownloadShowPDFButton';

type EventTypeFilter = 'all' | 'audition_slot' | 'rehearsal_event' | 'rehearsal' | 'performance' | 'agenda_item';

export default function ProductionCalendarPage() {
  const router = useRouter();
  const params = useParams();
  const auditionId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [audition, setAudition] = useState<any>(null);
  const [castMembers, setCastMembers] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<ProductionDateEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ProductionDateEvent[]>([]);
  const [calendarFilteredEvents, setCalendarFilteredEvents] = useState<ProductionDateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  
  // Filter states
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('all');
  const [castMemberFilter, setCastMemberFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [auditionId]);

  useEffect(() => {
    applyFilters();
  }, [eventTypeFilter, castMemberFilter, allEvents]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const currentUser = await getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      
      // Get audition details
      const auditionData = await getAudition(auditionId);
      if (!auditionData) {
        router.push('/productions');
        return;
      }
      setAudition(auditionData);
      
      // Check if user can manage (owner or production team)
      const isOwner = auditionData.user_id === currentUser.id;
      setCanManage(isOwner); // TODO: Also check production team membership
      
      if (!isOwner) {
        // TODO: Check if user is on production team
        // For now, redirect if not owner
        router.push(`/auditions/${auditionId}`);
        return;
      }
      
      // Load cast members
      const cast = await getAuditionCastMembers(auditionId);
      setCastMembers(cast);
      
      // Load calendar data
      const [
        ownedSlots,
        productionTeamSlots,
        ownedRehearsalEvents,
        productionTeamRehearsalEvents,
      ] = await Promise.all([
        getUserOwnedAuditionSlots(currentUser.id),
        getUserProductionTeamAuditionSlots(currentUser.id),
        getUserOwnedRehearsalEvents(currentUser.id),
        getUserProductionTeamRehearsalEvents(currentUser.id),
      ]);
      
      // Combine slots and rehearsal events
      const allSlots = [...ownedSlots, ...productionTeamSlots];
      const allRehearsalEvents = [...ownedRehearsalEvents, ...productionTeamRehearsalEvents];
      
      // Generate ALL production events for this user
      const allProductionEvents = [
        ...generateProductionEvents([auditionData], 'owner', allSlots, allRehearsalEvents),
      ];
      
      // Filter to only this show's events
      const filteredByAudition = filterEventsByAuditionId(allProductionEvents, auditionId);
      setAllEvents(filteredByAudition);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allEvents];

    // Filter by event type
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === eventTypeFilter);
    }

    // Filter by cast member
    if (castMemberFilter !== 'all') {
      // This would need to check if the cast member is assigned to the event
      // For now, we'll implement this for agenda items
      // TODO: Implement cast member filtering
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setEventTypeFilter('all');
    setCastMemberFilter('all');
  };

  const hasActiveFilters = eventTypeFilter !== 'all' || castMemberFilter !== 'all';

  // Count events by type
  const eventTypeCounts = {
    audition_slot: allEvents.filter(e => e.type === 'audition_slot').length,
    rehearsal_event: allEvents.filter(e => e.type === 'rehearsal_event').length,
    rehearsal: allEvents.filter(e => e.type === 'rehearsal').length,
    performance: allEvents.filter(e => e.type === 'performance').length,
    agenda_item: allEvents.filter(e => e.type === 'agenda_item').length,
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

  if (!user || !audition) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Production not found</div>
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
              onClick={() => router.push(`/productions/active-shows/${auditionId}`)}
              variant="secondary"
              className="flex items-center gap-2 mb-4"
            >
              <ArrowLeft size={20} />
              <span>Back to Production</span>
            </Button>
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-neu-text-primary mb-2">
                  Production Calendar
                </h1>
                <p className="text-neu-text-secondary text-lg mb-2">
                  {audition.shows?.title}
                  {audition.shows?.author && ` by ${audition.shows.author}`}
                </p>
                <p className="text-neu-text-primary">
                  Full schedule with all cast and crew events
                </p>
              </div>
              
              <div className="shrink-0">
                <DownloadShowPDFButton
                  events={calendarFilteredEvents.length > 0 ? calendarFilteredEvents : filteredEvents}
                  showDetails={{
                    title: audition.shows?.title || 'Production',
                    author: audition.shows?.author,
                    workflowStatus: audition.workflow_status,
                  }}
                  actorName="Production Team"
                  format="production"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
              <div className="text-2xl font-bold text-neu-text-primary">{allEvents.length}</div>
              <div className="text-sm text-neu-text-secondary">Total Events</div>
            </div>
            <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
              <div className="text-2xl font-bold text-teal-400">{eventTypeCounts.audition_slot}</div>
              <div className="text-sm text-neu-text-secondary">Audition Slots</div>
            </div>
            <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
              <div className="text-2xl font-bold text-amber-400">{eventTypeCounts.rehearsal_event}</div>
              <div className="text-sm text-neu-text-secondary">Rehearsals</div>
            </div>
            <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
              <div className="text-2xl font-bold text-red-400">{eventTypeCounts.performance}</div>
              <div className="text-sm text-neu-text-secondary">Performances</div>
            </div>
            <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
              <div className="text-2xl font-bold text-green-400">{castMembers.filter(c => c.status === 'Accepted').length}</div>
              <div className="text-sm text-neu-text-secondary">Cast Members</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Filter size={18} />
              <span className="font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-neu-accent-primary text-white text-xs">
                  Active
                </span>
              )}
            </Button>

            {showFilters && (
              <div className="mt-4 p-6 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neu-text-primary">Filter Events</h3>
                  {hasActiveFilters && (
                    <Button
                      onClick={clearFilters}
                      variant="secondary"
                      className="flex items-center gap-1 text-sm"
                    >
                      <X size={16} />
                      <span>Clear All</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neu-text-primary mb-2">
                      Event Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'audition_slot', 'rehearsal_event', 'rehearsal', 'performance', 'agenda_item'] as EventTypeFilter[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setEventTypeFilter(type)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            eventTypeFilter === type
                              ? 'shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border-neu-accent-primary text-neu-accent-primary'
                              : 'shadow-[2px_2px_4px_var(--neu-shadow-dark),-2px_-2px_4px_var(--neu-shadow-light)] text-neu-text-primary hover:border-neu-accent-primary/50'
                          } border`}
                          style={{ backgroundColor: 'var(--neu-surface)' }}
                        >
                          {type === 'all' ? 'All' : type.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cast Member Filter - Coming Soon */}
                  <div>
                    <label className="block text-sm font-medium text-neu-text-primary mb-2">
                      Cast Member
                    </label>
                    <select
                      value={castMemberFilter}
                      onChange={(e) => setCastMemberFilter(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-neu-border bg-neu-surface text-neu-text-primary shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px_4px_var(--neu-shadow-light)] focus:outline-none focus:border-neu-accent-primary"
                      disabled
                    >
                      <option value="all">All Cast Members (Coming Soon)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 text-sm text-neu-text-secondary">
                  Showing {filteredEvents.length} of {allEvents.length} events
                </div>
              </div>
            )}
          </div>

          {/* Calendar */}
          {filteredEvents.length > 0 ? (
            <AuditionCalendar 
              signups={[]} 
              callbacks={[]} 
              productionEvents={filteredEvents}
              userId={user.id} 
              onRefresh={loadData}
              hasOwnedAuditions={true}
              hasProductionTeamAuditions={false}
              onFilteredEventsChange={setCalendarFilteredEvents}
            />
          ) : (
            <div className="p-12 text-center rounded-xl border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
              <p className="text-neu-text-secondary text-lg mb-2">
                {hasActiveFilters ? 'No events match your filters' : 'No calendar events yet'}
              </p>
              <p className="text-neu-text-secondary text-sm">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results'
                  : 'Schedule auditions, rehearsals, and performances to see them here'}
              </p>
            </div>
          )}
        </div>
      </div>
    </StarryContainer>
  );
}
