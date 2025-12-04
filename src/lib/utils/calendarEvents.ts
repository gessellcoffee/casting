/**
 * Parse YYYY-MM-DD string as local date to avoid timezone issues
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 */
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Parse date data - handles both arrays and comma-separated strings
 */
function parseDateData(dateData: string | string[] | null | undefined): Date[] {
  if (!dateData) return [];
  
  // Handle array of date strings
  if (Array.isArray(dateData)) {
    return dateData.map(d => parseLocalDate(d)).filter(date => !isNaN(date.getTime()));
  }
  
  // Handle comma-separated string
  const dates = dateData.split(',').map(d => d.trim()).filter(Boolean);
  return dates.map(d => parseLocalDate(d)).filter(date => !isNaN(date.getTime()));
}

/**
 * Get the first and last date from a date range (array or comma-separated string)
 */
export function getDateRange(dateData: string | string[] | null | undefined): { start: Date | null; end: Date | null } {
  const dates = parseDateData(dateData);
  if (dates.length === 0) return { start: null, end: null };
  
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
  return {
    start: sortedDates[0],
    end: sortedDates[sortedDates.length - 1]
  };
}

/**
 * Generate calendar events for all production-related activities
 */
export interface ProductionDateEvent {
  type: 'rehearsal' | 'performance' | 'audition_slot' | 'rehearsal_event' | 'agenda_item';
  title: string;
  show: any;
  date: Date;
  startTime?: Date; // For timed events (slots, rehearsal events, agenda items)
  endTime?: Date;   // For timed events (slots, rehearsal events, agenda items)
  location: string | null;
  auditionId: string;
  role?: string;
  userRole?: 'cast' | 'owner' | 'production_team';
  eventId?: string; // For rehearsal events
  slotId?: string;  // For audition slots
  agendaItemId?: string; // For agenda items
  description?: string; // For agenda items
}

export function generateProductionEvents(
  auditions: any[],
  userRole: 'cast' | 'owner' | 'production_team',
  auditionSlots?: any[], // For owners/production team
  rehearsalEvents?: any[] // For owners/production team
): ProductionDateEvent[] {
  const events: ProductionDateEvent[] = [];

  auditions.forEach((item) => {
    // Handle different data structures based on source
    let audition: any;
    let role: string | undefined;

    if (userRole === 'cast') {
      // From getUserCastShows - nested in audition_slots
      audition = item.audition_slots?.auditions;
      role = item.roles?.role_name;
    } else if (userRole === 'production_team') {
      // From getUserProductionTeamAuditions - nested in auditions
      audition = item.auditions;
      role = item.role_title;
    } else {
      // From getUserOwnedAuditions - direct audition object
      audition = item;
    }

    if (!audition || !audition.shows) return;

    // NOTE: rehearsal_dates and performance_dates are just date ranges for reference
    // Actual scheduled events come from rehearsal_events, agenda_items, and performance_events tables
    // We don't create calendar events from these date arrays anymore
  });

  // Add audition slots for owners/production team
  if ((userRole === 'owner' || userRole === 'production_team') && auditionSlots) {
    console.log(`Processing ${auditionSlots.length} audition slots for ${userRole}`, auditionSlots);
    auditionSlots.forEach(slot => {
      const startTime = new Date(slot.start_time);
      const endTime = new Date(slot.end_time);
      const audition = slot.auditions;
      
      console.log('Processing slot:', {
        slot_id: slot.slot_id,
        start_time: slot.start_time,
        has_audition: !!audition,
        has_shows: !!(audition && audition.shows)
      });
      
      if (audition && audition.shows) {
        const event: ProductionDateEvent = {
          type: 'audition_slot',
          title: `${audition.shows.title} - Audition Slot`,
          show: audition.shows,
          date: startTime,
          startTime,
          endTime,
          location: slot.location,
          auditionId: audition.audition_id,
          userRole,
          slotId: slot.slot_id
        };
        console.log('Adding audition slot event:', event);
        events.push(event);
      } else {
        console.warn('Skipping slot - missing audition or shows data:', slot);
      }
    });
  }

  // Add rehearsal events for owners/production team/cast
  if (rehearsalEvents) {
    rehearsalEvents.forEach(event => {
      const audition = event.auditions;
      
      if (audition && audition.shows) {
        // Combine date and time for proper datetime - use parseLocalDate to avoid UTC conversion
        const eventDate = parseLocalDate(event.date);
        const [startHours, startMinutes] = event.start_time.split(':');
        const [endHours, endMinutes] = event.end_time.split(':');
        
        const startTime = new Date(eventDate);
        startTime.setHours(parseInt(startHours), parseInt(startMinutes), 0);
        
        const endTime = new Date(eventDate);
        endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);
        
        events.push({
          type: 'rehearsal_event',
          title: `${audition.shows.title} - Rehearsal`,
          show: audition.shows,
          date: startTime,
          startTime,
          endTime,
          location: event.location,
          auditionId: audition.audition_id,
          userRole,
          eventId: event.rehearsal_events_id
        });
      }
    });
  }

  return events;
}

/**
 * Generate calendar events from rehearsal agenda items
 * This replaces the old rehearsal_event display with individual agenda items
 */
export function generateAgendaItemEvents(agendaItems: any[]): ProductionDateEvent[] {
  const events: ProductionDateEvent[] = [];

  agendaItems.forEach(item => {
    const rehearsalEvent = item.rehearsal_event;
    
    if (!rehearsalEvent || !rehearsalEvent.auditions || !rehearsalEvent.auditions.shows) {
      return;
    }

    const audition = rehearsalEvent.auditions;
    // Use parseLocalDate to avoid UTC conversion
    const eventDate = parseLocalDate(rehearsalEvent.date);
    
    // Parse start and end times
    const [startHours, startMinutes] = item.start_time.split(':');
    const [endHours, endMinutes] = item.end_time.split(':');
    
    const startTime = new Date(eventDate);
    startTime.setHours(parseInt(startHours), parseInt(startMinutes), 0);
    
    const endTime = new Date(eventDate);
    endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);
    
    events.push({
      type: 'agenda_item',
      title: `${audition.shows.title} - ${item.title}`,
      show: audition.shows,
      date: startTime,
      startTime,
      endTime,
      location: rehearsalEvent.location,
      auditionId: audition.audition_id,
      userRole: 'cast', // All users seeing agenda items are involved in the production
      eventId: rehearsalEvent.rehearsal_events_id,
      agendaItemId: item.rehearsal_agenda_items_id,
      description: item.description
    });
  });

  return events;
}

/**
 * Filter production events by specific audition ID
 */
export function filterEventsByAuditionId(
  events: ProductionDateEvent[],
  auditionId: string
): ProductionDateEvent[] {
  return events.filter(event => event.auditionId === auditionId);
}
