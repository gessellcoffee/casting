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
    
    // Get base URL from environment or construct from request
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.NEXT_PUBLIC_APP_URL || 
                    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // Handle user cancellation
    if (error === 'access_denied') {
      return NextResponse.redirect(
        new URL('/my-auditions?google_error=cancelled', baseUrl)
      );
    }

    if (!code || !state) {
      console.error('Missing code or state in callback');
      return NextResponse.redirect(
        new URL('/my-auditions?google_error=invalid', baseUrl)
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
        new URL('/my-auditions?google_error=storage', baseUrl)
      );
    }

    // Success - redirect back to calendar page
    return NextResponse.redirect(
      new URL('/my-auditions?google_connected=true', baseUrl)
    );
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    
    // Get base URL for error redirect
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.NEXT_PUBLIC_APP_URL || 
                    `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    
    return NextResponse.redirect(
      new URL('/my-auditions?google_error=unknown', baseUrl)
    );
  }
}
