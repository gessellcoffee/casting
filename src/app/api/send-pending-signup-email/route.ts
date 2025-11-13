import { NextRequest, NextResponse } from 'next/server';
import { sendPendingSignupEmail } from '@/lib/email/pendingSignupService';
import type { PendingSignupRequestType } from '@/types/pendingSignup';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      requestType, 
      requestData, 
      inviterUsername, 
      inviterFullName 
    } = body;

    // Validate required fields
    if (!email || !requestType || !requestData || !inviterUsername) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send the email
    const result = await sendPendingSignupEmail({
      recipientEmail: email,
      requestType: requestType as PendingSignupRequestType,
      requestData,
      inviterUsername,
      inviterFullName
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in send-pending-signup-email route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
