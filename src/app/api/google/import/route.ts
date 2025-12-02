import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/serverClient';
import { getCalendarEvents, convertGoogleEventToLocal } from '@/lib/google/calendar';
import { refreshAccessToken } from '@/lib/google/auth';

export async function POST(request: NextRequest) {
  console.log('[Import] Starting Google Calendar import...');
  try {
    const { userId, calendarId, timeMin, timeMax } = await request.json();
    console.log('[Import] Request params:', { userId, calendarId, timeMin, timeMax });
    
    if (!userId) {
      console.error('[Import] Missing user ID');
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Get stored access token
    console.log('[Import] Fetching Google Calendar tokens...');
    const { data: tokenData, error: tokenError } = await supabaseServer
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', userId)
      .single();
    
    if (tokenError) {
      console.error('[Import] Token fetch error:', tokenError);
      return NextResponse.json(
        { error: `Token error: ${tokenError.message}` }, 
        { status: 401 }
      );
    }
    
    if (!tokenData) {
      console.error('[Import] No tokens found for user');
      return NextResponse.json(
        { error: 'Not connected to Google Calendar' }, 
        { status: 401 }
      );
    }
    
    console.log('[Import] Tokens found, checking expiry...');
    
    let accessToken = tokenData.access_token;
    
    // Check if token is expired and refresh if needed
    if (tokenData.expiry_date && tokenData.refresh_token) {
      const now = Date.now();
      console.log('[Import] Token expiry check:', { now, expiry: tokenData.expiry_date, expired: now >= tokenData.expiry_date });
      if (now >= tokenData.expiry_date) {
        console.log('[Import] Token expired, refreshing...');
        const newTokens = await refreshAccessToken(tokenData.refresh_token);
        accessToken = newTokens.access_token!;
        
        // Update stored tokens
        await supabaseServer
          .from('google_calendar_tokens')
          .update({
            access_token: accessToken,
            expiry_date: newTokens.expiry_date,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        console.log('[Import] Token refreshed successfully');
      }
    }
    
    // Fetch events from Google Calendar
    console.log('[Import] Fetching events from Google Calendar...');
    const events = await getCalendarEvents(
      accessToken,
      calendarId || 'primary',
      timeMin ? new Date(timeMin) : new Date(), // Default to now
      timeMax ? new Date(timeMax) : undefined
    );
    
    console.log(`[Import] Found ${events.length} events from Google Calendar`);
    
    if (events.length === 0) {
      console.log('[Import] No events found in the selected calendar');
      return NextResponse.json({ 
        imported: 0,
        errors: 0,
        total: 0,
        message: 'No events found in the selected calendar for the specified time range'
      });
    }
    
    // Convert and insert events as personal events
    let imported = 0;
    let errors = 0;
    const errorDetails: any[] = [];
    
    for (const googleEvent of events) {
      try {
        const localEvent = convertGoogleEventToLocal(googleEvent);
        console.log(`[Import] Processing event: ${localEvent.title}`);
        
        // Insert into events table
        const { error: insertError } = await supabaseServer
          .from('events')
          .insert({
            user_id: userId,
            title: localEvent.title,
            description: localEvent.description,
            start_time: localEvent.start,
            end_time: localEvent.end,
            all_day: localEvent.allDay,
            location: localEvent.location,
            color: localEvent.color,
          });
        
        if (insertError) {
          console.error(`[Import] Error inserting event "${localEvent.title}":`, insertError);
          errorDetails.push({ title: localEvent.title, error: insertError.message });
          errors++;
        } else {
          console.log(`[Import] Successfully imported: ${localEvent.title}`);
          imported++;
        }
      } catch (error: any) {
        console.error('[Import] Error processing event:', error);
        errorDetails.push({ title: googleEvent.summary || 'Unknown', error: error.message });
        errors++;
      }
    }
    
    console.log(`[Import] Import complete: ${imported} imported, ${errors} errors out of ${events.length} total`);
    if (errorDetails.length > 0) {
      console.error('[Import] Error details:', errorDetails);
    }
    
    return NextResponse.json({ 
      imported,
      errors,
      total: events.length,
      errorDetails: errorDetails.slice(0, 5) // Return first 5 errors for debugging
    });
  } catch (error: any) {
    console.error('[Import] Fatal error importing Google Calendar events:', error);
    console.error('[Import] Error stack:', error.stack);
    return NextResponse.json(
      { error: error?.message || 'Failed to import events', details: error.stack }, 
      { status: 500 }
    );
  }
}
