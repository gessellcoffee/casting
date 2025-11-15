import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/serverClient';
import { createCalendar, listCalendars } from '@/lib/google/calendar';
import { refreshAccessToken } from '@/lib/google/auth';

/**
 * POST /api/google/sync/setup
 * Creates dedicated Google Calendars for each event type
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
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
    
    // Check if calendars already exist
    const existingCalendars = await listCalendars(accessToken);
    
    // Define calendar types to create
    const calendarTypes = [
      { type: 'audition_slots', name: 'Belong Here Theater: Audition Slots', description: 'Audition time slots you are managing' },
      { type: 'auditions', name: 'Belong Here Theater: Auditions', description: 'Auditions you have signed up for' },
      { type: 'callbacks', name: 'Belong Here Theater: Callbacks', description: 'Callback invitations' },
      { type: 'rehearsals', name: 'Belong Here Theater: Rehearsals', description: 'Rehearsal events and agenda items' },
      { type: 'performances', name: 'Belong Here Theater: Performances', description: 'Performance dates' },
      { type: 'personal', name: 'Belong Here Theater: Personal Events', description: 'Your personal theater-related events' },
    ];
    
    const createdCalendars = [];
    
    for (const calType of calendarTypes) {
      // Check if calendar already exists
      const existing = existingCalendars.find(cal => cal.summary === calType.name);
      
      let calendarId: string;
      
      if (existing) {
        calendarId = existing.id;
        console.log(`Calendar already exists: ${calType.name}`);
      } else {
        // Create new calendar
        const newCalendar = await createCalendar(
          accessToken,
          calType.name,
          calType.description
        );
        calendarId = newCalendar.id;
        console.log(`Created calendar: ${calType.name}`);
      }
      
      // Store in database
      await supabaseServer
        .from('google_calendar_sync')
        .upsert({
          user_id: userId,
          event_type: calType.type,
          google_calendar_id: calendarId,
          calendar_name: calType.name,
          sync_enabled: true,
          updated_at: new Date().toISOString(),
        });
      
      createdCalendars.push({
        type: calType.type,
        name: calType.name,
        calendarId,
      });
    }
    
    return NextResponse.json({ 
      success: true,
      calendars: createdCalendars 
    });
  } catch (error: any) {
    console.error('Error setting up sync calendars:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to setup sync' }, 
      { status: 500 }
    );
  }
}
