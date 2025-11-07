import { NextRequest, NextResponse } from 'next/server';
import { sendNotificationEmail } from '@/lib/email/emailService';
import type { NotificationType } from '@/lib/supabase/notificationTypes';

/**
 * API Route to send notification emails
 * This is called internally when notifications are created
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      recipientEmail,
      recipientName,
      notificationType,
      title,
      message,
      actionUrl,
      senderName,
    } = body;

    // Validate required fields
    if (!recipientEmail || !recipientName || !notificationType || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes: NotificationType[] = [
      'company_approval',
      'user_affiliation',
      'casting_decision',
      'casting_offer',
      'general',
    ];

    if (!validTypes.includes(notificationType)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Send the email
    const result = await sendNotificationEmail(
      recipientEmail,
      recipientName,
      notificationType as NotificationType,
      title,
      message,
      actionUrl,
      senderName
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error in send-notification-email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
