/**
 * Calendar utilities for generating ICS files for production team members
 * Follows iCalendar RFC 5545 specification
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
}

/**
 * Format a date for ICS file (YYYYMMDDTHHmmss or YYYYMMDD for all-day events)
 */
function formatICSDate(date: Date, allDay: boolean = false): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (allDay) {
    return `${year}${month}${day}`;
  }
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Escape special characters for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate a unique ID for calendar events
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@belongheretheater.com`;
}

/**
 * Generate an ICS file content for a single event
 */
export function generateICSEvent(event: CalendarEvent): string {
  const now = new Date();
  const uid = generateUID();
  
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Belong Here Theater//Casting App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
  ];

  // Add start date
  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatICSDate(event.startDate, true)}`);
    lines.push(`DTEND;VALUE=DATE:${formatICSDate(event.endDate, true)}`);
  } else {
    lines.push(`DTSTART:${formatICSDate(event.startDate)}`);
    lines.push(`DTEND:${formatICSDate(event.endDate)}`);
  }

  // Add title
  lines.push(`SUMMARY:${escapeICSText(event.title)}`);

  // Add description if provided
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }

  // Add location if provided
  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`);
  }

  lines.push('STATUS:CONFIRMED');
  lines.push('SEQUENCE:0');
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Generate an ICS file with multiple events
 */
export function generateICSFile(events: CalendarEvent[], calendarName: string = 'Production Calendar'): string {
  const now = new Date();
  
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Belong Here Theater//Casting App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(calendarName)}`,
    'X-WR-TIMEZONE:America/Chicago',
  ];

  // Add each event
  events.forEach(event => {
    const uid = generateUID();
    
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${formatICSDate(now)}`);

    // Add start and end dates
    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatICSDate(event.startDate, true)}`);
      lines.push(`DTEND;VALUE=DATE:${formatICSDate(event.endDate, true)}`);
    } else {
      lines.push(`DTSTART:${formatICSDate(event.startDate)}`);
      lines.push(`DTEND:${formatICSDate(event.endDate)}`);
    }

    // Add event details
    lines.push(`SUMMARY:${escapeICSText(event.title)}`);
    
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
    }
    
    if (event.location) {
      lines.push(`LOCATION:${escapeICSText(event.location)}`);
    }

    lines.push('STATUS:CONFIRMED');
    lines.push('SEQUENCE:0');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Parse YYYY-MM-DD date string as local date
 */
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Generate calendar events from audition data
 */
export interface AuditionCalendarData {
  showTitle: string;
  auditionDates: string[]; // YYYY-MM-DD format
  auditionLocation?: string;
  rehearsalDates: string[]; // YYYY-MM-DD format
  rehearsalLocation?: string;
  performanceDates: string[]; // YYYY-MM-DD format
  performanceLocation?: string;
  slots?: Array<{
    start_time: string; // ISO datetime
    end_time: string; // ISO datetime
    location?: string;
  }>;
  callbackSlots?: Array<{
    start_time: string; // ISO datetime
    end_time: string; // ISO datetime
    location?: string;
  }>;
}

export function generateAuditionCalendarEvents(data: AuditionCalendarData): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Add audition dates (all-day events)
  data.auditionDates.forEach(dateStr => {
    const date = parseLocalDate(dateStr);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    events.push({
      title: `Audition - ${data.showTitle}`,
      description: `Audition day for ${data.showTitle}`,
      location: data.auditionLocation,
      startDate: date,
      endDate: nextDay,
      allDay: true,
    });
  });

  // Add audition slots (specific times)
  data.slots?.forEach(slot => {
    events.push({
      title: `Audition Slot - ${data.showTitle}`,
      description: `Audition time slot for ${data.showTitle}`,
      location: slot.location || data.auditionLocation,
      startDate: new Date(slot.start_time),
      endDate: new Date(slot.end_time),
      allDay: false,
    });
  });

  // Add rehearsal dates (all-day events)
  data.rehearsalDates.forEach(dateStr => {
    const date = parseLocalDate(dateStr);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    events.push({
      title: `Rehearsal - ${data.showTitle}`,
      description: `Rehearsal for ${data.showTitle}`,
      location: data.rehearsalLocation,
      startDate: date,
      endDate: nextDay,
      allDay: true,
    });
  });

  // Add performance dates (all-day events)
  data.performanceDates.forEach(dateStr => {
    const date = parseLocalDate(dateStr);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    events.push({
      title: `Performance - ${data.showTitle}`,
      description: `Performance of ${data.showTitle}`,
      location: data.performanceLocation,
      startDate: date,
      endDate: nextDay,
      allDay: true,
    });
  });

  // Add callback slots (specific times)
  data.callbackSlots?.forEach(slot => {
    events.push({
      title: `Callback - ${data.showTitle}`,
      description: `Callback audition for ${data.showTitle}`,
      location: slot.location || data.auditionLocation,
      startDate: new Date(slot.start_time),
      endDate: new Date(slot.end_time),
      allDay: false,
    });
  });

  return events;
}

/**
 * Download an ICS file in the browser
 */
export function downloadICSFile(content: string, filename: string = 'calendar.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Generate calendar events for a user's personal audition schedule
 * Includes their signups, callbacks, and production events
 */
export interface UserAuditionData {
  signups?: Array<{
    audition_slots: {
      start_time: string;
      end_time: string;
      location?: string | null;
      auditions: {
        shows: { title: string };
      };
    };
  }>;
  callbacks?: Array<{
    callback_slots: {
      start_time: string;
      end_time: string;
      location?: string | null;
      auditions: {
        shows: { title: string };
      };
    };
  }>;
  productionEvents?: Array<{
    type: 'rehearsal' | 'performance';
    title: string;
    date: Date;
    location: string | null;
  }>;
}

export function generateUserCalendarEvents(data: UserAuditionData): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Add audition signup slots
  data.signups?.forEach(signup => {
    const slot = signup.audition_slots;
    const showTitle = slot.auditions?.shows?.title || 'Audition';
    
    events.push({
      title: `Audition - ${showTitle}`,
      description: `Your audition appointment for ${showTitle}`,
      location: slot.location || undefined,
      startDate: new Date(slot.start_time),
      endDate: new Date(slot.end_time),
      allDay: false,
    });
  });

  // Add callback slots
  data.callbacks?.forEach(callback => {
    const slot = callback.callback_slots;
    const showTitle = slot.auditions?.shows?.title || 'Callback';
    
    events.push({
      title: `Callback - ${showTitle}`,
      description: `Callback audition for ${showTitle}`,
      location: slot.location || undefined,
      startDate: new Date(slot.start_time),
      endDate: new Date(slot.end_time),
      allDay: false,
    });
  });

  // Add production events (rehearsals and performances)
  data.productionEvents?.forEach(event => {
    const startDate = new Date(event.date);
    const endDate = new Date(event.date);
    endDate.setDate(endDate.getDate() + 1);
    
    events.push({
      title: event.title,
      description: event.type === 'rehearsal' ? 'Rehearsal' : 'Performance',
      location: event.location || undefined,
      startDate,
      endDate,
      allDay: true,
    });
  });

  return events;
}
