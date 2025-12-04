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
    
    // Delete all personal events for this user
    const { data: deletedEvents, error: deleteError } = await supabaseServer
      .from('events')
      .delete()
      .eq('user_id', userId)
      .select('id');
    
    if (deleteError) {
      console.error('Error deleting personal events:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete personal events' }, 
        { status: 500 }
      );
    }
    
    const deletedCount = deletedEvents?.length || 0;
    
    // Also clean up any Google event mappings for deleted events
    if (deletedCount > 0) {
      await supabaseServer
        .from('google_event_mappings')
        .delete()
        .eq('user_id', userId);
    }
    
    return NextResponse.json({ 
      deletedCount,
      message: `Successfully deleted ${deletedCount} personal event${deletedCount !== 1 ? 's' : ''}` 
    });
    
  } catch (error: any) {
    console.error('Error in delete-all-personal API:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}
