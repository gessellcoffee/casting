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

/**
 * Create a new Google Calendar
 */
export async function createCalendar(
  accessToken: string,
  summary: string,
  description?: string,
  timeZone: string = 'America/Chicago'
): Promise<GoogleCalendar> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const response = await calendar.calendars.insert({
    requestBody: {
      summary,
      description,
      timeZone,
    },
  });
  
  return response.data as GoogleCalendar;
}

/**
 * Delete a Google Calendar
 */
export async function deleteCalendar(
  accessToken: string,
  calendarId: string
): Promise<void> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  await calendar.calendars.delete({ calendarId });
}

/**
 * Create an event in a Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: string; // ISO 8601 format
    end: string;   // ISO 8601 format
    allDay?: boolean;
    colorId?: string;
  }
): Promise<GoogleCalendarEvent> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const eventData: any = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    colorId: event.colorId,
  };
  
  if (event.allDay) {
    // All-day events use date format (YYYY-MM-DD)
    eventData.start = { date: event.start.split('T')[0] };
    eventData.end = { date: event.end.split('T')[0] };
  } else {
    // Timed events use dateTime format
    eventData.start = { dateTime: event.start, timeZone: 'America/Chicago' };
    eventData.end = { dateTime: event.end, timeZone: 'America/Chicago' };
  }
  
  const response = await calendar.events.insert({
    calendarId,
    requestBody: eventData,
  });
  
  return response.data as GoogleCalendarEvent;
}

/**
 * Update an event in a Google Calendar
 */
export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    location?: string;
    start?: string;
    end?: string;
    allDay?: boolean;
    colorId?: string;
  }
): Promise<GoogleCalendarEvent> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const eventData: any = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    colorId: event.colorId,
  };
  
  if (event.start && event.end) {
    if (event.allDay) {
      eventData.start = { date: event.start.split('T')[0] };
      eventData.end = { date: event.end.split('T')[0] };
    } else {
      eventData.start = { dateTime: event.start, timeZone: 'America/Chicago' };
      eventData.end = { dateTime: event.end, timeZone: 'America/Chicago' };
    }
  }
  
  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: eventData,
  });
  
  return response.data as GoogleCalendarEvent;
}

/**
 * Delete an event from a Google Calendar
 */
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  await calendar.events.delete({ calendarId, eventId });
}
