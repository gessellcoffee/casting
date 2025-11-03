import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Delete stored tokens
    const { error } = await supabase
      .from('google_calendar_tokens')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      throw error;
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
