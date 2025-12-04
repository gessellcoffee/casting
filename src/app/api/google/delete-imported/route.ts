import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/serverClient';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' }, 
        { status: 400 }
      );
    }
    
    // Get all event mappings for this user
    const { data: mappings, error: mappingsError } = await supabaseServer
      .from('google_event_mappings')
      .select('event_id')
      .eq('user_id', userId);
    
    if (mappingsError) {
      console.error('Error fetching event mappings:', mappingsError);
      return NextResponse.json(
        { error: 'Failed to fetch event mappings' }, 
        { status: 500 }
      );
    }
    
    if (!mappings || mappings.length === 0) {
      return NextResponse.json({ 
        deletedCount: 0,
        message: 'No imported events found' 
      });
    }
    
    const eventIds = mappings.map(m => m.event_id);
    
    // Delete all the events
    const { error: deleteEventsError } = await supabaseServer
      .from('events')
      .delete()
      .in('id', eventIds);
    
    if (deleteEventsError) {
      console.error('Error deleting events:', deleteEventsError);
      return NextResponse.json(
        { error: 'Failed to delete events' }, 
        { status: 500 }
      );
    }
    
    // Delete all the mappings
    const { error: deleteMappingsError } = await supabaseServer
      .from('google_event_mappings')
      .delete()
      .eq('user_id', userId);
    
    if (deleteMappingsError) {
      console.error('Error deleting mappings:', deleteMappingsError);
      // Continue anyway - events are already deleted
    }
    
    return NextResponse.json({ 
      deletedCount: eventIds.length,
      message: `Successfully deleted ${eventIds.length} imported event${eventIds.length !== 1 ? 's' : ''}` 
    });
    
  } catch (error: any) {
    console.error('Error in delete-imported API:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}
