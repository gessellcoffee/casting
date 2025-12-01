import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google/auth';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // User ID
  const error = searchParams.get('error');
  
  if (error) {
    return NextResponse.redirect(
      new URL('/my-calendar?error=access_denied', request.url)
    );
  }
  
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/my-calendar?error=invalid_request', request.url)
    );
  }
  
  try {
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }
    
    // Store tokens securely in database
    const { error: dbError } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expiry_date: tokens.expiry_date || null,
        updated_at: new Date().toISOString(),
      });
    
    if (dbError) {
      console.error('Database error storing tokens:', dbError);
      throw dbError;
    }
    
    return NextResponse.redirect(
      new URL('/my-calendar?google_connected=true', request.url)
    );
  } catch (error) {
    console.error('Error exchanging code:', error);
    return NextResponse.redirect(
      new URL('/my-calendar?error=auth_failed', request.url)
    );
  }
}
