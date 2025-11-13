import { NextRequest, NextResponse } from 'next/server';
import { sendCastingInvitationEmail } from '@/lib/email/invitationService';

/**
 * API Route to send casting invitation emails to non-users
 * This is called when inviting someone by email who doesn't have an account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      recipientEmail,
      showTitle,
      roleName,
      isUnderstudy,
      isEnsemble,
      senderName,
      message,
      invitationType,
      callbackDate,
      callbackTime,
      callbackLocation,
    } = body;

    // Validate required fields
    if (!recipientEmail || !showTitle || !senderName || !invitationType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate invitation type
    if (!['casting_offer', 'callback'].includes(invitationType)) {
      return NextResponse.json(
        { error: 'Invalid invitation type' },
        { status: 400 }
      );
    }

    // Send the invitation email
    const result = await sendCastingInvitationEmail({
      recipientEmail,
      showTitle,
      roleName,
      isUnderstudy: isUnderstudy || false,
      isEnsemble: isEnsemble || false,
      senderName,
      message,
      invitationType,
      callbackDate,
      callbackTime,
      callbackLocation,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send invitation email', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error in send-invitation-email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
