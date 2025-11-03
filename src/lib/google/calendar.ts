import { google } from 'googleapis';
import { getOAuth2Client } from './auth';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  recurrence?: string[];
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

export async function listCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const response = await calendar.calendarList.list();
  return (response.data.items || []) as GoogleCalendar[];
}

export async function getCalendarEvents(
  accessToken: string,
  calendarId: string = 'primary',
  timeMin?: Date,
  timeMax?: Date
): Promise<GoogleCalendarEvent[]> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin?.toISOString(),
    timeMax: timeMax?.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250, // Limit to prevent overwhelming imports
  });
  
  return (response.data.items || []) as GoogleCalendarEvent[];
}

export function convertGoogleEventToLocal(googleEvent: GoogleCalendarEvent) {
  const isAllDay = !!googleEvent.start.date;
  
  return {
    title: googleEvent.summary || 'Untitled Event',
    description: googleEvent.description || null,
    start: isAllDay ? googleEvent.start.date! : googleEvent.start.dateTime!,
    end: isAllDay ? googleEvent.end.date! : googleEvent.end.dateTime!,
    allDay: isAllDay,
    location: googleEvent.location || null,
    color: '#4285f4', // Google Calendar blue
    isRecurring: !!googleEvent.recurrence && googleEvent.recurrence.length > 0,
    // Note: Recurrence rules would need separate parsing
  };
}
