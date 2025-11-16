import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/serverClient';
import { refreshAccessToken } from '@/lib/google/auth';

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
      .from('google_calendar_sync')
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
      .from('google_calendar_sync')
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
  
  // This is a placeholder - we'll implement the actual sync logic
  // based on event type in the next step
  console.log(`Syncing ${eventType} for user ${userId} to calendar ${googleCalendarId}`);
  
  return { synced, errors };
}
