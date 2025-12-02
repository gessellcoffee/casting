import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/serverClient';
import { refreshAccessToken } from '@/lib/google/auth';
import { createCalendarEvent } from '@/lib/google/calendar';

/**
 * POST /api/google/sync/push
 * Syncs app events to Google Calendar with progress updates
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (current: number, total: number, eventType: string, message: string) => {
          const data = JSON.stringify({ 
            type: 'progress', 
            current, 
            total, 
            eventType, 
            message 
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };
        
        try {
          // Get user's access token
          const { data: tokenData, error: tokenError } = await supabaseServer
            .from('google_calendar_tokens')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (tokenError || !tokenData) {
            const errorData = JSON.stringify({ type: 'error', message: 'Not connected to Google Calendar' });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
            return;
          }
          
          let accessToken = tokenData.access_token;
          
          // Check if token needs refresh
          if (tokenData.expiry_date && new Date(tokenData.expiry_date) <= new Date()) {
            const newTokens = await refreshAccessToken(tokenData.refresh_token || '');
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
          
          // Get sync settings - which calendars are enabled
          const { data: syncSettings, error: syncError } = await supabaseServer
            .from('google_calendar_sync' as any)
            .select('*')
            .eq('user_id', userId)
            .eq('sync_enabled', true);
          
          if (syncError || !syncSettings || syncSettings.length === 0) {
            const errorData = JSON.stringify({ type: 'error', message: 'No sync calendars configured. Run setup first.' });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
            return;
          }
          
          // Type assertion for sync settings
          type SyncSetting = {
            event_type: string;
            google_calendar_id: string;
            sync_enabled: boolean;
            user_id: string;
          };
          
          let syncedCount = 0;
          let errorCount = 0;
          const settings = syncSettings as unknown as SyncSetting[];
          const total = settings.length;
          
          // Sync each event type
          for (let i = 0; i < settings.length; i++) {
            const syncSetting = settings[i];
            const current = i + 1;
            
            sendProgress(current, total, syncSetting.event_type, `Syncing ${syncSetting.event_type}...`);
            
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
          
          // Send completion message
          const completeData = JSON.stringify({ 
            type: 'complete', 
            synced: syncedCount, 
            errors: errorCount 
          });
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
          controller.close();
        } catch (error: any) {
          console.error('Error in sync stream:', error);
          const errorData = JSON.stringify({ type: 'error', message: error?.message || 'Failed to sync' });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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
  console.log(`[Audition Slots] Fetching slots for user ${userId}`);
  
  // Get audition slots for auditions owned by user
  const { data: slots, error } = await supabaseServer
    .from('audition_slots')
    .select(`
      slot_id,
      audition_id,
      start_time,
      end_time,
      location,
      auditions!inner(
        audition_id,
        user_id,
        shows(
          title
        )
      )
    `)
    .eq('auditions.user_id', userId)
    .order('start_time', { ascending: true });
  
  if (error) {
    console.error('[Audition Slots] Query error:', error);
    return;
  }
  
  console.log(`[Audition Slots] Found ${slots?.length || 0} slots`);
  
  if (!slots || slots.length === 0) return;
  
  // Get existing mappings to avoid duplicates
  const slotIds = slots.map(s => s.slot_id);
  const { data: existingMappings } = await supabaseServer
    .from('google_event_mappings' as any)
    .select('event_id')
    .eq('user_id', userId)
    .eq('event_type', 'audition_slot')
    .in('event_id', slotIds);
  
  const existingIds = new Set(existingMappings?.map((m: any) => m.event_id) || []);
  
  for (const slot of slots) {
    try {
      // Handle potential array types from Supabase
      const audition = Array.isArray(slot.auditions) ? slot.auditions[0] : slot.auditions;
      const show = Array.isArray(audition?.shows) ? audition.shows[0] : audition?.shows;
      
      // Skip if already synced
      if (existingIds.has(slot.slot_id)) {
        console.log(`[Audition Slots] Skipping already synced: ${show?.title}`);
        continue;
      }
      
      console.log(`[Audition Slots] Creating event: ${show?.title} at ${slot.start_time}`);
      
      const googleEvent = await createCalendarEvent(accessToken, calendarId, {
        summary: `Audition Slot: ${show?.title}`,
        description: `Audition slot for ${show?.title}`,
        location: slot.location || undefined,
        start: slot.start_time,
        end: slot.end_time,
        allDay: false,
        colorId: '7' // Teal
      });
      
      // Store mapping
      if (googleEvent?.id) {
        await supabaseServer
          .from('google_event_mappings' as any)
          .insert({
            user_id: userId,
            event_type: 'audition_slot',
            event_id: slot.slot_id,
            google_calendar_id: calendarId,
            google_event_id: googleEvent.id
          });
      }
      
      console.log(`[Audition Slots] Successfully created event`);
    } catch (error) {
      console.error(`[Audition Slots] Error creating event:`, error);
    }
  }
}

/**
 * Sync audition signups (for actors)
 */
async function syncAuditionSignups(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Audition Signups] Fetching signups for user ${userId}`);
  
  const { data: signups, error } = await supabaseServer
    .from('audition_signups')
    .select(`
      signup_id,
      user_id,
      slot_id,
      audition_slots!inner(
        start_time,
        end_time,
        location,
        auditions!inner(
          audition_id,
          shows(
            title
          )
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[Audition Signups] Query error:', error);
    return;
  }
  
  console.log(`[Audition Signups] Found ${signups?.length || 0} signups`);
  
  if (!signups || signups.length === 0) return;
  
  // Get existing mappings
  const signupIds = signups.map(s => s.signup_id);
  const { data: existingMappings } = await supabaseServer
    .from('google_event_mappings' as any)
    .select('event_id')
    .eq('user_id', userId)
    .eq('event_type', 'audition_signup')
    .in('event_id', signupIds) as any;
  
  const existingIds = new Set((existingMappings || []).map((m: any) => m.event_id));
  
  for (const signup of signups) {
    try {
      // Handle potential array types from Supabase
      const slot = Array.isArray(signup.audition_slots) ? signup.audition_slots[0] : signup.audition_slots;
      const audition = Array.isArray(slot?.auditions) ? slot.auditions[0] : slot?.auditions;
      const show = Array.isArray(audition?.shows) ? audition.shows[0] : audition?.shows;
      
      // Skip if already synced
      if (existingIds.has(signup.signup_id)) {
        console.log(`[Audition Signups] Skipping already synced: ${show?.title}`);
        continue;
      }
      
      console.log(`[Audition Signups] Creating event: ${show?.title}`);
      
      const googleEvent = await createCalendarEvent(accessToken, calendarId, {
        summary: `Audition: ${show?.title}`,
        description: `Audition for ${show?.title}`,
        location: slot?.location || undefined,
        start: slot?.start_time,
        end: slot?.end_time,
        allDay: false,
        colorId: '9' // Blue
      });
      
      // Store mapping
      if (googleEvent?.id) {
        await supabaseServer
          .from('google_event_mappings' as any)
          .insert({
            user_id: userId,
            event_type: 'audition_signup',
            event_id: signup.signup_id,
            google_calendar_id: calendarId,
            google_event_id: googleEvent.id
          });
      }
      
      console.log(`[Audition Signups] Successfully created event`);
    } catch (error) {
      console.error(`[Audition Signups] Error creating event:`, error);
    }
  }
}

/**
 * Sync callbacks
 */
async function syncCallbacks(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Callbacks] Fetching callbacks for user ${userId}`);
  
  const { data: callbacks, error } = await supabaseServer
    .from('callback_invitations')
    .select(`
      callback_invitation_id,
      audition_id,
      user_id,
      status,
      callback_slots(
        start_time,
        end_time,
        location
      ),
      auditions(
        audition_id,
        shows(
          title
        )
      )
    `)
    .eq('user_id', userId)
    .in('status', ['pending', 'accepted']);
  
  if (error) {
    console.error('[Callbacks] Query error:', error);
    return;
  }
  
  console.log(`[Callbacks] Found ${callbacks?.length || 0} callbacks`);
  
  if (!callbacks || callbacks.length === 0) return;
  
  // Get existing mappings
  const callbackIds = callbacks.map(c => c.callback_invitation_id);
  const { data: existingMappings } = await supabaseServer
    .from('google_event_mappings' as any)
    .select('event_id')
    .eq('user_id', userId)
    .eq('event_type', 'callback')
    .in('event_id', callbackIds);
  
  const existingIds = new Set(existingMappings?.map((m: any) => m.event_id) || []);
  
  for (const callback of callbacks) {
    try {
      const slot = Array.isArray(callback.callback_slots) ? callback.callback_slots[0] : callback.callback_slots;
      const audition = Array.isArray(callback.auditions) ? callback.auditions[0] : callback.auditions;
      const show = Array.isArray(audition?.shows) ? audition.shows[0] : audition?.shows;
      
      // Skip if already synced
      if (existingIds.has(callback.callback_invitation_id)) {
        console.log(`[Callbacks] Skipping already synced: ${show?.title}`);
        continue;
      }
      
      console.log(`[Callbacks] Creating event: ${show?.title}`);
      
      const googleEvent = await createCalendarEvent(accessToken, calendarId, {
        summary: `Callback: ${show?.title}`,
        description: `Callback for ${show?.title}`,
        location: slot?.location || undefined,
        start: slot?.start_time,
        end: slot?.end_time,
        allDay: false,
        colorId: '3' // Purple
      });
      
      // Store mapping
      if (googleEvent?.id) {
        await supabaseServer
          .from('google_event_mappings' as any)
          .insert({
            user_id: userId,
            event_type: 'callback',
            event_id: callback.callback_invitation_id,
            google_calendar_id: calendarId,
            google_event_id: googleEvent.id
          });
      }
      
      console.log(`[Callbacks] Successfully created event`);
    } catch (error) {
      console.error(`[Callbacks] Error creating event:`, error);
    }
  }
}

/**
 * Sync rehearsals (rehearsal dates + rehearsal events + agenda items)
 */
async function syncRehearsals(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Rehearsals] Syncing all rehearsal-related events for user ${userId}`);
  
  // Sync rehearsal dates (all-day events)
  await syncRehearsalDates(userId, calendarId, accessToken);
  
  // Sync rehearsal events (timed events with locations)
  await syncRehearsalEvents(userId, calendarId, accessToken);
  
  // Sync agenda items (specific rehearsal schedule items)
  await syncAgendaItems(userId, calendarId, accessToken);
}

/**
 * Sync rehearsal dates (all-day events)
 */
async function syncRehearsalDates(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Rehearsal Dates] Fetching rehearsal dates for user ${userId}`);
  
  // Get auditions where user is cast
  const { data: castShows, error } = await supabaseServer
    .from('cast_members')
    .select(`
      cast_member_id,
      auditions!inner(
        audition_id,
        rehearsal_dates,
        shows(
          title
        )
      )
    `)
    .eq('user_id', userId)
    .not('auditions.rehearsal_dates', 'is', null);
  
  if (error) {
    console.error('[Rehearsals] Query error:', error);
    return;
  }
  
  console.log(`[Rehearsals] Found ${castShows?.length || 0} shows with rehearsal dates`);
  
  if (!castShows || castShows.length === 0) return;
  
  for (const cast of castShows) {
    // Handle potential array types from Supabase
    const audition = Array.isArray(cast.auditions) ? cast.auditions[0] : cast.auditions;
    const show = Array.isArray(audition?.shows) ? audition.shows[0] : audition?.shows;
    
    const rehearsalDates = (audition?.rehearsal_dates || []) as any as string[];
    if (!rehearsalDates || rehearsalDates.length === 0) continue;
    
    for (const date of rehearsalDates) {
      try {
        // Skip invalid dates
        if (!date || typeof date !== 'string' || date.trim() === '') {
          console.log(`[Rehearsal Dates] Skipping invalid date for ${show?.title}`);
          continue;
        }
        
        // Create a unique ID for this date+audition combo
        const eventId = `${audition?.audition_id}_${date}`;
        
        // Check if already synced
        const { data: existing } = await supabaseServer
          .from('google_event_mappings' as any)
          .select('event_id')
          .eq('user_id', userId)
          .eq('event_type', 'rehearsal_date')
          .eq('event_id', eventId)
          .single();
        
        if (existing) {
          console.log(`[Rehearsal Dates] Skipping already synced: ${show?.title} on ${date}`);
          continue;
        }
        
        console.log(`[Rehearsal Dates] Creating event: ${show?.title} on ${date}`);
        
        const googleEvent = await createCalendarEvent(accessToken, calendarId, {
          summary: `Rehearsal: ${show?.title}`,
          description: `Rehearsal for ${show?.title}`,
          start: date,
          end: date,
          allDay: true,
          colorId: '6' // Orange
        });
        
        // Store mapping
        if (googleEvent?.id) {
          await supabaseServer
            .from('google_event_mappings' as any)
            .insert({
              user_id: userId,
              event_type: 'rehearsal_date',
              event_id: eventId,
              google_calendar_id: calendarId,
              google_event_id: googleEvent.id
            });
        }
        
        console.log(`[Rehearsal Dates] Successfully created event`);
      } catch (error) {
        console.error(`[Rehearsal Dates] Error creating event:`, error);
      }
    }
  }
}

/**
 * Sync rehearsal events (timed events with location)
 */
async function syncRehearsalEvents(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Rehearsal Events] Fetching rehearsal events for user ${userId}`);
  
  // Get rehearsal events for shows where user is cast or user owns/is on production team
  const { data: rehearsalEvents, error } = await supabaseServer
    .from('rehearsal_events')
    .select(`
      rehearsal_events_id,
      date,
      start_time,
      end_time,
      location,
      notes,
      auditions!inner(
        audition_id,
        user_id,
        shows(
          title
        )
      )
    `)
    .or(`auditions.user_id.eq.${userId},auditions.audition_id.in.(
      select audition_id from cast_members where user_id = '${userId}'
    )`)
    .order('date', { ascending: true });
  
  if (error) {
    console.error('[Rehearsal Events] Query error:', error);
    return;
  }
  
  console.log(`[Rehearsal Events] Found ${rehearsalEvents?.length || 0} rehearsal events`);
  
  if (!rehearsalEvents || rehearsalEvents.length === 0) return;
  
  // Get existing mappings
  const eventIds = rehearsalEvents.map(e => e.rehearsal_events_id);
  const { data: existingMappings } = await supabaseServer
    .from('google_event_mappings' as any)
    .select('event_id')
    .eq('user_id', userId)
    .eq('event_type', 'rehearsal_event')
    .in('event_id', eventIds);
  
  const existingIds = new Set(existingMappings?.map((m: any) => m.event_id) || []);
  
  for (const event of rehearsalEvents) {
    try {
      const audition = Array.isArray(event.auditions) ? event.auditions[0] : event.auditions;
      const show = Array.isArray(audition?.shows) ? audition.shows[0] : audition?.shows;
      
      // Skip if already synced
      if (existingIds.has(event.rehearsal_events_id)) {
        console.log(`[Rehearsal Events] Skipping already synced: ${show?.title} on ${event.date}`);
        continue;
      }
      
      console.log(`[Rehearsal Events] Creating event: ${show?.title} on ${event.date}`);
      
      // Combine date and time
      const startDateTime = `${event.date}T${event.start_time}`;
      const endDateTime = `${event.date}T${event.end_time}`;
      
      const googleEvent = await createCalendarEvent(accessToken, calendarId, {
        summary: `Rehearsal: ${show?.title}`,
        description: event.notes || `Rehearsal for ${show?.title}`,
        location: event.location || undefined,
        start: startDateTime,
        end: endDateTime,
        allDay: false,
        colorId: '5' // Yellow/Amber
      });
      
      // Store mapping
      if (googleEvent?.id) {
        await supabaseServer
          .from('google_event_mappings' as any)
          .insert({
            user_id: userId,
            event_type: 'rehearsal_event',
            event_id: event.rehearsal_events_id,
            google_calendar_id: calendarId,
            google_event_id: googleEvent.id
          });
      }
      
      console.log(`[Rehearsal Events] Successfully created event`);
    } catch (error) {
      console.error(`[Rehearsal Events] Error creating event:`, error);
    }
  }
}

/**
 * Sync agenda items (rehearsal schedule items)
 */
async function syncAgendaItems(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Agenda Items] Fetching agenda items for user ${userId}`);
  
  // Get agenda items where user is assigned
  const { data: agendaAssignments, error } = await supabaseServer
    .from('agenda_assignments')
    .select(`
      agenda_assignments_id,
      agenda_item_id,
      rehearsal_agenda_items!inner(
        title,
        description,
        start_time,
        end_time,
        rehearsal_events!inner(
          rehearsal_events_id,
          date,
          location,
          auditions!inner(
            audition_id,
            shows(
              title
            )
          )
        )
      )
    `)
    .eq('user_id', userId)
    .in('status', ['assigned', 'accepted']);
  
  if (error) {
    console.error('[Agenda Items] Query error:', error);
    return;
  }
  
  console.log(`[Agenda Items] Found ${agendaAssignments?.length || 0} assigned agenda items`);
  
  if (!agendaAssignments || agendaAssignments.length === 0) return;
  
  // Get existing mappings
  const agendaIds = agendaAssignments.map(a => a.agenda_item_id);
  const { data: existingMappings } = await supabaseServer
    .from('google_event_mappings' as any)
    .select('event_id')
    .eq('user_id', userId)
    .eq('event_type', 'agenda_item')
    .in('event_id', agendaIds);
  
  const existingIds = new Set(existingMappings?.map((m: any) => m.event_id) || []);
  
  for (const assignment of agendaAssignments) {
    try {
      const agendaItem = Array.isArray(assignment.rehearsal_agenda_items) 
        ? assignment.rehearsal_agenda_items[0] 
        : assignment.rehearsal_agenda_items;
      const rehearsalEvent = Array.isArray(agendaItem?.rehearsal_events) 
        ? agendaItem.rehearsal_events[0] 
        : agendaItem?.rehearsal_events;
      const audition = Array.isArray(rehearsalEvent?.auditions) 
        ? rehearsalEvent.auditions[0] 
        : rehearsalEvent?.auditions;
      const show = Array.isArray(audition?.shows) 
        ? audition.shows[0] 
        : audition?.shows;
      
      // Skip if already synced
      if (existingIds.has(assignment.agenda_item_id)) {
        console.log(`[Agenda Items] Skipping already synced: ${agendaItem?.title}`);
        continue;
      }
      
      console.log(`[Agenda Items] Creating event: ${agendaItem?.title} for ${show?.title}`);
      
      // Combine date and time
      const startDateTime = `${rehearsalEvent?.date}T${agendaItem?.start_time}`;
      const endDateTime = `${rehearsalEvent?.date}T${agendaItem?.end_time}`;
      
      const googleEvent = await createCalendarEvent(accessToken, calendarId, {
        summary: `${show?.title}: ${agendaItem?.title}`,
        description: agendaItem?.description || `Rehearsal agenda item for ${show?.title}`,
        location: rehearsalEvent?.location || undefined,
        start: startDateTime,
        end: endDateTime,
        allDay: false,
        colorId: '5' // Yellow/Amber (same as rehearsal events)
      });
      
      // Store mapping
      if (googleEvent?.id) {
        await supabaseServer
          .from('google_event_mappings' as any)
          .insert({
            user_id: userId,
            event_type: 'agenda_item',
            event_id: assignment.agenda_item_id,
            google_calendar_id: calendarId,
            google_event_id: googleEvent.id
          });
      }
      
      console.log(`[Agenda Items] Successfully created event`);
    } catch (error) {
      console.error(`[Agenda Items] Error creating event:`, error);
    }
  }
}

/**
 * Sync performances (performance dates from auditions where user is cast)
 */
async function syncPerformances(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Performances] Fetching performance dates for user ${userId}`);
  
  // Get auditions where user is cast
  const { data: castShows, error } = await supabaseServer
    .from('cast_members')
    .select(`
      cast_member_id,
      auditions!inner(
        audition_id,
        performance_dates,
        shows(
          title
        )
      )
    `)
    .eq('user_id', userId)
    .not('auditions.performance_dates', 'is', null);
  
  if (error) {
    console.error('[Performances] Query error:', error);
    return;
  }
  
  console.log(`[Performances] Found ${castShows?.length || 0} shows with performance dates`);
  
  if (!castShows || castShows.length === 0) return;
  
  for (const cast of castShows) {
    // Handle potential array types from Supabase
    const audition = Array.isArray(cast.auditions) ? cast.auditions[0] : cast.auditions;
    const show = Array.isArray(audition?.shows) ? audition.shows[0] : audition?.shows;
    
    const performanceDates = (audition?.performance_dates || []) as any as string[];
    if (!performanceDates || performanceDates.length === 0) continue;
    
    for (const date of performanceDates) {
      try {
        // Skip invalid dates
        if (!date || typeof date !== 'string' || date.trim() === '') {
          console.log(`[Performances] Skipping invalid date for ${show?.title}`);
          continue;
        }
        
        // Create a unique ID for this date+audition combo
        const eventId = `${audition?.audition_id}_${date}`;
        
        // Check if already synced
        const { data: existing } = await supabaseServer
          .from('google_event_mappings' as any)
          .select('event_id')
          .eq('user_id', userId)
          .eq('event_type', 'performance_date')
          .eq('event_id', eventId)
          .single();
        
        if (existing) {
          console.log(`[Performances] Skipping already synced: ${show?.title} on ${date}`);
          continue;
        }
        
        console.log(`[Performances] Creating event: ${show?.title} on ${date}`);
        
        const googleEvent = await createCalendarEvent(accessToken, calendarId, {
          summary: `Performance: ${show?.title}`,
          description: `Performance of ${show?.title}`,
          start: date,
          end: date,
          allDay: true,
          colorId: '11' // Red
        });
        
        // Store mapping
        if (googleEvent?.id) {
          await supabaseServer
            .from('google_event_mappings' as any)
            .insert({
              user_id: userId,
              event_type: 'performance_date',
              event_id: eventId,
              google_calendar_id: calendarId,
              google_event_id: googleEvent.id
            });
        }
        
        console.log(`[Performances] Successfully created event`);
      } catch (error) {
        console.error(`[Performances] Error creating event:`, error);
      }
    }
  }
}

/**
 * Sync personal events
 * Note: Personal events are imported FROM Google Calendar, not pushed TO it.
 * They should remain only in the app database to avoid creating duplicates in Google.
 */
async function syncPersonalEvents(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Personal Events] Skipping - personal events are imported from Google, not synced to Google`);
  return;
}
