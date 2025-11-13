import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google/auth';

/**
 * POST /api/google/auth
 * Generates Google OAuth URL for Google Calendar integration
 * This is NOT for Supabase authentication - that's handled by /auth/callback
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Use user ID as state for security
    const authUrl = getAuthUrl(userId);
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' }, 
      { status: 500 }
    );
  }
} 