import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/serverClient';
import { getCalendarEvents, convertGoogleEventToLocal } from '@/lib/google/calendar';
import { refreshAccessToken } from '@/lib/google/auth';

export async function POST(request: NextRequest) {
  try {
    const { userId, calendarId, timeMin, timeMax } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Get stored access token
    const { data: tokenData } = await supabaseServer
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', userId)
      .single();
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Not connected to Google Calendar' }, 
        { status: 401 }
      );
    }
    
    let accessToken = tokenData.access_token;
    
    // Check if token is expired and refresh if needed
    if (tokenData.expiry_date && tokenData.refresh_token) {
      const now = Date.now();
      if (now >= tokenData.expiry_date) {
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
      }
    }
    
    const events = await getCalendarEvents(
      accessToken,
      calendarId || 'primary',
      timeMin ? new Date(timeMin) : undefined,
      timeMax ? new Date(timeMax) : undefined
    );
    
    // Convert to local format
    const convertedEvents = events.map(convertGoogleEventToLocal);
    
    return NextResponse.json({ events: convertedEvents });
  } catch (error: any) {
    console.error('Error fetching Google Calendar events:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch events' }, 
      { status: 500 }
    );
  }
}
