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
      // Skip if already synced
      if (existingIds.has(slot.slot_id)) {
        console.log(`[Audition Slots] Skipping already synced: ${slot.auditions.shows.title}`);
        continue;
      }
      
      console.log(`[Audition Slots] Creating event: ${slot.auditions.shows.title} at ${slot.start_time}`);
      
      const googleEvent = await createCalendarEvent(accessToken, calendarId, {
        summary: `Audition Slot: ${slot.auditions.shows.title}`,
        description: `Audition slot for ${slot.auditions.shows.title}`,
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
      // Skip if already synced
      if (existingIds.has(signup.signup_id)) {
        console.log(`[Audition Signups] Skipping already synced: ${signup.audition_slots.auditions.shows.title}`);
        continue;
      }
      
      console.log(`[Audition Signups] Creating event: ${signup.audition_slots.auditions.shows.title}`);
      
      const googleEvent = await createCalendarEvent(accessToken, calendarId, {
        summary: `Audition: ${signup.audition_slots.auditions.shows.title}`,
        description: `Audition for ${signup.audition_slots.auditions.shows.title}`,
        location: signup.audition_slots.location || undefined,
        start: signup.audition_slots.start_time,
        end: signup.audition_slots.end_time,
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
  console.log(`[Callbacks] Skipping for now - will implement after basic sync works`);
  return;
}

/**
 * Sync rehearsals (rehearsal dates from auditions where user is cast)
 */
async function syncRehearsals(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Rehearsals] Fetching rehearsal dates for user ${userId}`);
  
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
    const rehearsalDates = (cast.auditions.rehearsal_dates || []) as any as string[];
    if (!rehearsalDates || rehearsalDates.length === 0) continue;
    
    for (const date of rehearsalDates) {
      try {
        // Create a unique ID for this date+audition combo
        const eventId = `${cast.auditions.audition_id}_${date}`;
        
        // Check if already synced
        const { data: existing } = await supabaseServer
          .from('google_event_mappings' as any)
          .select('event_id')
          .eq('user_id', userId)
          .eq('event_type', 'rehearsal_date')
          .eq('event_id', eventId)
          .single();
        
        if (existing) {
          console.log(`[Rehearsals] Skipping already synced: ${cast.auditions.shows.title} on ${date}`);
          continue;
        }
        
        console.log(`[Rehearsals] Creating event: ${cast.auditions.shows.title} on ${date}`);
        
        const googleEvent = await createCalendarEvent(accessToken, calendarId, {
          summary: `Rehearsal: ${cast.auditions.shows.title}`,
          description: `Rehearsal for ${cast.auditions.shows.title}`,
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
        
        console.log(`[Rehearsals] Successfully created event`);
      } catch (error) {
        console.error(`[Rehearsals] Error creating event:`, error);
      }
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
    const performanceDates = (cast.auditions.performance_dates || []) as any as string[];
    if (!performanceDates || performanceDates.length === 0) continue;
    
    for (const date of performanceDates) {
      try {
        // Create a unique ID for this date+audition combo
        const eventId = `${cast.auditions.audition_id}_${date}`;
        
        // Check if already synced
        const { data: existing } = await supabaseServer
          .from('google_event_mappings' as any)
          .select('event_id')
          .eq('user_id', userId)
          .eq('event_type', 'performance_date')
          .eq('event_id', eventId)
          .single();
        
        if (existing) {
          console.log(`[Performances] Skipping already synced: ${cast.auditions.shows.title} on ${date}`);
          continue;
        }
        
        console.log(`[Performances] Creating event: ${cast.auditions.shows.title} on ${date}`);
        
        const googleEvent = await createCalendarEvent(accessToken, calendarId, {
          summary: `Performance: ${cast.auditions.shows.title}`,
          description: `Performance of ${cast.auditions.shows.title}`,
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
 */
async function syncPersonalEvents(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Personal Events] Skipping for now - will implement after basic sync works`);
  return;
}
