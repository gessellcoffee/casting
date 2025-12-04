import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/serverClient';

export async function POST(request: NextRequest) {
  try {
    const { userId, googleEventId, eventId, calendarId, action } = await request.json();
    
    if (!userId || !googleEventId) {
      return NextResponse.json(
        { error: 'userId and googleEventId are required' }, 
        { status: 400 }
      );
    }
    
    if (action === 'check') {
      // Check if mapping exists
      const { data } = await supabaseServer
        .from('google_event_mappings')
        .select('id')
        .eq('user_id', userId)
        .eq('google_event_id', googleEventId)
        .single();
      
      return NextResponse.json({ exists: !!data });
    } 
    
    if (action === 'create') {
      // Create new mapping
      if (!eventId || !calendarId) {
        return NextResponse.json(
          { error: 'eventId and calendarId are required for create action' }, 
          { status: 400 }
        );
      }
      
      const { data, error } = await supabaseServer
        .from('google_event_mappings')
        .insert({
          user_id: userId,
          google_event_id: googleEventId,
          event_id: eventId,
          google_calendar_id: calendarId,
          event_type: 'personal'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating event mapping:', error);
        return NextResponse.json(
          { error: 'Failed to create event mapping' }, 
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true, data });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Must be "check" or "create"' }, 
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('Error in event mapping API:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}
