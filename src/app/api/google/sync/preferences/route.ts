import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/serverClient';

/**
 * POST /api/google/sync/preferences
 * Get user's sync preferences
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Get all sync calendar preferences
    const { data: preferences, error } = await supabaseServer
      .from('google_calendar_sync' as any)
      .select('event_type, sync_enabled, calendar_name, google_calendar_id')
      .eq('user_id', userId)
      .order('event_type', { ascending: true });
    
    if (error) {
      console.error('Error fetching sync preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }
    
    return NextResponse.json({ preferences: preferences || [] });
  } catch (error: any) {
    console.error('Error in sync preferences POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/google/sync/preferences
 * Update user's sync preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId, preferences } = await request.json();
    
    if (!userId || !preferences) {
      return NextResponse.json({ error: 'User ID and preferences required' }, { status: 400 });
    }
    
    // Update each preference
    const updates = preferences.map(async (pref: any) => {
      const { error } = await supabaseServer
        .from('google_calendar_sync' as any)
        .update({ 
          sync_enabled: pref.sync_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('event_type', pref.event_type);
      
      if (error) {
        console.error(`Error updating ${pref.event_type}:`, error);
        throw error;
      }
    });
    
    await Promise.all(updates);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in sync preferences PUT:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
