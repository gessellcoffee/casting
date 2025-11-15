import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google/auth';
import { supabaseServer } from '@/lib/supabase/serverClient';

/**
 * GET /api/google/callback
 * Handles OAuth callback from Google Calendar authorization
 * Exchanges authorization code for access/refresh tokens and stores them
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the userId we passed
    const error = searchParams.get('error');

    // Handle user cancellation
    if (error === 'access_denied') {
      return NextResponse.redirect(
        new URL('/my-auditions?google_error=cancelled', request.url)
      );
    }

    if (!code || !state) {
      console.error('Missing code or state in callback');
      return NextResponse.redirect(
        new URL('/my-auditions?google_error=invalid', request.url)
      );
    }

    const userId = state;

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Store tokens in database
    const { error: dbError } = await supabaseServer
      .from('google_calendar_tokens')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('Error storing tokens:', dbError);
      return NextResponse.redirect(
        new URL('/my-auditions?google_error=storage', request.url)
      );
    }

    // Success - redirect back to calendar page
    return NextResponse.redirect(
      new URL('/my-auditions?google_connected=true', request.url)
    );
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    return NextResponse.redirect(
      new URL('/my-auditions?google_error=unknown', request.url)
    );
  }
}
