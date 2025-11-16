import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/serverClient';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Delete stored tokens
    const { error: tokenError } = await supabaseServer
      .from('google_calendar_tokens')
      .delete()
      .eq('user_id', userId);
    
    if (tokenError) {
      throw tokenError;
    }
    
    // Also delete sync calendar mappings
    const { error: syncError } = await supabaseServer
      .from('google_calendar_sync' as any)
      .delete()
      .eq('user_id', userId);
    
    if (syncError) {
      console.error('Error deleting sync calendars:', syncError);
      // Don't throw - token deletion is more important
    }
    
    // Delete event mappings
    const { error: mappingError } = await supabaseServer
      .from('google_event_mappings' as any)
      .delete()
      .eq('user_id', userId);
    
    if (mappingError) {
      console.error('Error deleting event mappings:', mappingError);
      // Don't throw - token deletion is more important
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to disconnect' }, 
      { status: 500 }
    );
  }
}
