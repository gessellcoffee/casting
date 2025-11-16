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
  
  for (const slot of slots) {
    try {
      // start_time and end_time are already full timestamps
      console.log(`[Audition Slots] Creating event: ${slot.auditions.shows.title} at ${slot.start_time}`);
      
      await createCalendarEvent(accessToken, calendarId, {
        summary: `Audition Slot: ${slot.auditions.shows.title}`,
        description: `Audition slot for ${slot.auditions.shows.title}`,
        location: slot.location || undefined,
        start: slot.start_time,
        end: slot.end_time,
        allDay: false,
        colorId: '7' // Teal
      });
      
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
  
  for (const signup of signups) {
    try {
      console.log(`[Audition Signups] Creating event: ${signup.audition_slots.auditions.shows.title}`);
      
      await createCalendarEvent(accessToken, calendarId, {
        summary: `Audition: ${signup.audition_slots.auditions.shows.title}`,
        description: `Audition for ${signup.audition_slots.auditions.shows.title}`,
        location: signup.audition_slots.location || undefined,
        start: signup.audition_slots.start_time,
        end: signup.audition_slots.end_time,
        allDay: false,
        colorId: '9' // Blue
      });
      
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
 * Sync rehearsals (rehearsal events and agenda items)
 */
async function syncRehearsals(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Rehearsals] Fetching rehearsals and agenda items for user ${userId}`);
  
  // For now, skip rehearsals - they require complex cast member queries
  // We'll implement this after the basic sync is working
  console.log(`[Rehearsals] Skipping for now - will implement after basic sync works`);
  return;
}

/**
 * Sync performances
 */
async function syncPerformances(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Performances] Skipping for now - will implement after basic sync works`);
  return;
}

/**
 * Sync personal events
 */
async function syncPersonalEvents(userId: string, calendarId: string, accessToken: string) {
  console.log(`[Personal Events] Skipping for now - will implement after basic sync works`);
  return;
}
