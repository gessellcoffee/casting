import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/serverClient';
import { refreshAccessToken } from '@/lib/google/auth';
import { createCalendarEvent } from '@/lib/google/calendar';

/**
 * POST /api/google/sync/push
 * Syncs app events to Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Get stored access token
    const { data: tokenData, error: tokenError } = await supabaseServer
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', userId)
      .single();
    
    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Not connected to Google Calendar' }, 
        { status: 401 }
      );
    }
    
    let accessToken: string = tokenData.access_token;
    
    // Refresh token if needed
    if (tokenData.expiry_date && tokenData.refresh_token !== null) {
      const now = Date.now();
      if (now >= tokenData.expiry_date) {
        const newTokens = await refreshAccessToken(tokenData.refresh_token);
        accessToken = newTokens.access_token!;
        
        // Update token in database
        await supabaseServer
          .from('google_calendar_tokens')
          .update({
            access_token: accessToken,
            expiry_date: newTokens.expiry_date ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }
    }
    
    // Get sync settings - which calendars are enabled
    const { data: syncSettings, error: syncError } = await supabaseServer
      .from('google_calendar_sync' as any)
      .select('*')
      .eq('user_id', userId)
      .eq('sync_enabled', true);
    
    if (syncError || !syncSettings || syncSettings.length === 0) {
      return NextResponse.json(
        { error: 'No sync calendars configured. Run setup first.' }, 
        { status: 400 }
      );
    }
    
    let syncedCount = 0;
    let errorCount = 0;
    
    // Sync each event type
    for (const syncSetting of syncSettings) {
      try {
        const result = await syncEventType(
          userId,
          syncSetting.event_type,
          syncSetting.google_calendar_id,
          accessToken
        );
        syncedCount += result.synced;
        errorCount += result.errors;
      } catch (error) {
        console.error(`Error syncing ${syncSetting.event_type}:`, error);
        errorCount++;
      }
    }
    
    // Update last synced timestamp
    await supabaseServer
      .from('google_calendar_sync' as any)
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    return NextResponse.json({ 
      success: true,
      synced: syncedCount,
      errors: errorCount
    });
  } catch (error: any) {
    console.error('Error pushing sync:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to sync' }, 
      { status: 500 }
    );
  }
}

/**
 * Sync events of a specific type to Google Calendar
 */
async function syncEventType(
  userId: string,
  eventType: string,
  googleCalendarId: string,
  accessToken: string
): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;
  
  console.log(`Syncing ${eventType} for user ${userId} to calendar ${googleCalendarId}`);
  
  try {
    switch (eventType) {
      case 'audition_slots':
        await syncAuditionSlots(userId, googleCalendarId, accessToken);
        break;
      case 'auditions':
        await syncAuditionSignups(userId, googleCalendarId, accessToken);
        break;
      case 'callbacks':
        await syncCallbacks(userId, googleCalendarId, accessToken);
        break;
      case 'rehearsals':
        await syncRehearsals(userId, googleCalendarId, accessToken);
        break;
      case 'performances':
        await syncPerformances(userId, googleCalendarId, accessToken);
        break;
      case 'personal':
        await syncPersonalEvents(userId, googleCalendarId, accessToken);
        break;
      default:
        console.warn(`Unknown event type: ${eventType}`);
    }
    synced++;
  } catch (error) {
    console.error(`Error syncing ${eventType}:`, error);
    errors++;
  }
  
  return { synced, errors };
}

/**
 * Sync audition slots (for owners/production team)
 */
async function syncAuditionSlots(userId: string, calendarId: string, accessToken: string) {
  // Get audition slots for auditions owned by user or where user is production team
  const { data: slots } = await supabaseServer
    .from('audition_slots')
    .select(`
      *,
      auditions!inner(
        auditions_id,
        show_title,
        creator_user_id,
        company_id
      )
    `)
    .or(`auditions.creator_user_id.eq.${userId},auditions.company_id.in.(select company_id from company_members where user_id = '${userId}')`)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
  
  if (!slots || slots.length === 0) return;
  
  for (const slot of slots) {
    try {
      const startDateTime = `${slot.date}T${slot.start_time}`;
      const endDateTime = `${slot.date}T${slot.end_time}`;
      
      await createCalendarEvent(accessToken, calendarId, {
        summary: `Audition Slot: ${slot.auditions.show_title}`,
        description: `Audition slot for ${slot.auditions.show_title}`,
        location: slot.location || undefined,
        start: startDateTime,
        end: endDateTime,
        allDay: false,
        colorId: '7' // Teal
      });
    } catch (error) {
      console.error(`Error creating slot event:`, error);
    }
  }
}

/**
 * Sync audition signups (for actors)
 */
async function syncAuditionSignups(userId: string, calendarId: string, accessToken: string) {
  const { data: signups } = await supabaseServer
    .from('audition_signups')
    .select(`
      *,
      audition_slots!inner(
        date,
        start_time,
        end_time,
        location
      ),
      auditions!inner(
        show_title
      )
    `)
    .eq('user_id', userId)
    .order('audition_slots.date', { ascending: true });
  
  if (!signups || signups.length === 0) return;
  
  for (const signup of signups) {
    try {
      const startDateTime = `${signup.audition_slots.date}T${signup.audition_slots.start_time}`;
      const endDateTime = `${signup.audition_slots.date}T${signup.audition_slots.end_time}`;
      
      await createCalendarEvent(accessToken, calendarId, {
        summary: `Audition: ${signup.auditions.show_title}`,
        description: `Audition for ${signup.auditions.show_title}`,
        location: signup.audition_slots.location || undefined,
        start: startDateTime,
        end: endDateTime,
        allDay: false,
        colorId: '9' // Blue
      });
    } catch (error) {
      console.error(`Error creating audition signup event:`, error);
    }
  }
}

/**
 * Sync callbacks
 */
async function syncCallbacks(userId: string, calendarId: string, accessToken: string) {
  const { data: callbacks } = await supabaseServer
    .from('callback_invitations')
    .select(`
      *,
      auditions!inner(
        show_title
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .order('callback_date', { ascending: true });
  
  if (!callbacks || callbacks.length === 0) return;
  
  for (const callback of callbacks) {
    try {
      const startDateTime = `${callback.callback_date}T${callback.callback_time || '00:00:00'}`;
      // Assume 1 hour if no end time
      const endTime = callback.callback_time 
        ? new Date(new Date(`${callback.callback_date}T${callback.callback_time}`).getTime() + 60 * 60 * 1000).toISOString().split('T')[1].substring(0, 8)
        : '01:00:00';
      const endDateTime = `${callback.callback_date}T${endTime}`;
      
      await createCalendarEvent(accessToken, calendarId, {
        summary: `Callback: ${callback.auditions.show_title}`,
        description: `Callback for ${callback.auditions.show_title}`,
        location: callback.location || undefined,
        start: startDateTime,
        end: endDateTime,
        allDay: false,
        colorId: '3' // Purple
      });
    } catch (error) {
      console.error(`Error creating callback event:`, error);
    }
  }
}

/**
 * Sync rehearsals (rehearsal events and agenda items)
 */
async function syncRehearsals(userId: string, calendarId: string, accessToken: string) {
  // Get rehearsal events for user's cast shows
  const { data: rehearsalEvents } = await supabaseServer
    .from('rehearsal_events')
    .select(`
      *,
      auditions!inner(
        show_title,
        cast_members!inner(user_id)
      )
    `)
    .eq('auditions.cast_members.user_id', userId)
    .order('date', { ascending: true });
  
  if (rehearsalEvents && rehearsalEvents.length > 0) {
    for (const event of rehearsalEvents) {
      try {
        const startDateTime = `${event.date}T${event.start_time}`;
        const endDateTime = `${event.date}T${event.end_time}`;
        
        await createCalendarEvent(accessToken, calendarId, {
          summary: `Rehearsal: ${event.auditions.show_title}`,
          description: event.notes || `Rehearsal for ${event.auditions.show_title}`,
          location: event.location || undefined,
          start: startDateTime,
          end: endDateTime,
          allDay: false,
          colorId: '6' // Orange
        });
      } catch (error) {
        console.error(`Error creating rehearsal event:`, error);
      }
    }
  }
  
  // Get agenda items assigned to user
  const { data: agendaItems } = await supabaseServer
    .from('rehearsal_agenda_items')
    .select(`
      *,
      rehearsal_events!inner(
        date,
        location
      ),
      auditions!inner(
        show_title
      ),
      agenda_assignments!inner(user_id)
    `)
    .eq('agenda_assignments.user_id', userId)
    .order('rehearsal_events.date', { ascending: true });
  
  if (agendaItems && agendaItems.length > 0) {
    for (const item of agendaItems) {
      try {
        const startDateTime = `${item.rehearsal_events.date}T${item.start_time}`;
        const endDateTime = `${item.rehearsal_events.date}T${item.end_time}`;
        
        await createCalendarEvent(accessToken, calendarId, {
          summary: `${item.title} - ${item.auditions.show_title}`,
          description: item.description || item.title,
          location: item.rehearsal_events.location || undefined,
          start: startDateTime,
          end: endDateTime,
          allDay: false,
          colorId: '6' // Orange
        });
      } catch (error) {
        console.error(`Error creating agenda item event:`, error);
      }
    }
  }
}

/**
 * Sync performances
 */
async function syncPerformances(userId: string, calendarId: string, accessToken: string) {
  // Get performance dates for shows user is cast in
  const { data: castShows } = await supabaseServer
    .from('cast_members')
    .select(`
      auditions!inner(
        show_title,
        performance_dates
      )
    `)
    .eq('user_id', userId)
    .not('auditions.performance_dates', 'is', null);
  
  if (!castShows || castShows.length === 0) return;
  
  for (const cast of castShows) {
    const performanceDates = cast.auditions.performance_dates as string[];
    if (!performanceDates || performanceDates.length === 0) continue;
    
    for (const date of performanceDates) {
      try {
        await createCalendarEvent(accessToken, calendarId, {
          summary: `Performance: ${cast.auditions.show_title}`,
          description: `Performance of ${cast.auditions.show_title}`,
          start: date,
          end: date,
          allDay: true,
          colorId: '11' // Red
        });
      } catch (error) {
        console.error(`Error creating performance event:`, error);
      }
    }
  }
}

/**
 * Sync personal events
 */
async function syncPersonalEvents(userId: string, calendarId: string, accessToken: string) {
  const { data: events } = await supabaseServer
    .from('user_events')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: true });
  
  if (!events || events.length === 0) return;
  
  for (const event of events) {
    try {
      const isAllDay = !event.start_time;
      const startDateTime = isAllDay 
        ? event.start_date 
        : `${event.start_date}T${event.start_time}`;
      const endDateTime = isAllDay 
        ? (event.end_date || event.start_date)
        : `${event.end_date || event.start_date}T${event.end_time || event.start_time}`;
      
      await createCalendarEvent(accessToken, calendarId, {
        summary: event.title,
        description: event.description || undefined,
        location: event.location || undefined,
        start: startDateTime,
        end: endDateTime,
        allDay: isAllDay,
        colorId: '10' // Green
      });
    } catch (error) {
      console.error(`Error creating personal event:`, error);
    }
  }
}
