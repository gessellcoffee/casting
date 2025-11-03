/**
 * Parse date data - handles both arrays and comma-separated strings
 */
function parseDateData(dateData: string | string[] | null | undefined): Date[] {
  if (!dateData) return [];
  
  // Handle array of date strings
  if (Array.isArray(dateData)) {
    return dateData.map(d => new Date(d)).filter(date => !isNaN(date.getTime()));
  }
  
  // Handle comma-separated string
  const dates = dateData.split(',').map(d => d.trim()).filter(Boolean);
  return dates.map(d => new Date(d)).filter(date => !isNaN(date.getTime()));
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
 * Generate calendar events for rehearsal and performance dates
 */
export interface ProductionDateEvent {
  type: 'rehearsal' | 'performance';
  title: string;
  show: any;
  date: Date;
  location: string | null;
  auditionId: string;
  role?: string;
  userRole?: 'cast' | 'owner' | 'production_team';
}

export function generateProductionEvents(
  auditions: any[],
  userRole: 'cast' | 'owner' | 'production_team'
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

    const showTitle = audition.shows.title || 'Unknown Show';

    // Add individual rehearsal date events for each date in the array
    if (audition.rehearsal_dates) {
      const dates = parseDateData(audition.rehearsal_dates);
      dates.forEach(date => {
        events.push({
          type: 'rehearsal',
          title: `${showTitle} - Rehearsal`,
          show: audition.shows,
          date,
          location: audition.rehearsal_location,
          auditionId: audition.audition_id,
          role,
          userRole
        });
      });
    }

    // Add individual performance date events for each date in the array
    if (audition.performance_dates) {
      const dates = parseDateData(audition.performance_dates);
      dates.forEach(date => {
        events.push({
          type: 'performance',
          title: `${showTitle} - Performance`,
          show: audition.shows,
          date,
          location: audition.performance_location,
          auditionId: audition.audition_id,
          role,
          userRole
        });
      });
    }
  });

  return events;
}
