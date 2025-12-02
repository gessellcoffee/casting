import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/serverClient';

/**
 * POST /api/google/sync/status
 * Checks if sync calendars have been set up for the user
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Check if user has any sync calendars configured
    const { data: syncCalendars, error } = await supabaseServer
      .from('google_calendar_sync' as any)
      .select('event_type, google_calendar_id, calendar_name, sync_enabled')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error checking sync status:', error);
      return NextResponse.json({ calendarsSetup: false });
    }
    
    // Check if we have all 6 required calendar types
    const requiredTypes = ['audition_slots', 'auditions', 'callbacks', 'rehearsals', 'performances', 'personal'];
    const existingTypes = (syncCalendars || []).map(cal => cal.event_type);
    const allCalendarsExist = requiredTypes.every(type => existingTypes.includes(type));
    const missingTypes = requiredTypes.filter(type => !existingTypes.includes(type));
    
    console.log(`[SyncStatus] User ${userId}: ${existingTypes.length}/6 calendars found`, { 
      allCalendarsExist, 
      existing: existingTypes,
      missing: missingTypes 
    });
    
    return NextResponse.json({ 
      calendarsSetup: allCalendarsExist,
      calendars: syncCalendars || [],
      missingTypes
    });
  } catch (error: any) {
    console.error('Error checking sync status:', error);
    return NextResponse.json({ calendarsSetup: false }, { status: 500 });
  }
}
