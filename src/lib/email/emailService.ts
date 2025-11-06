import { Resend } from 'resend';
import type { NotificationType } from '../supabase/types';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'notifications@belongheretheater.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Email template data interface
 */
interface EmailTemplateData {
  recipientEmail: string;
  recipientName: string;
  senderName?: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

/**
 * Generate HTML email template with consistent styling
 */
function generateEmailHTML(data: EmailTemplateData): string {
  const fullActionUrl = data.actionUrl ? `${APP_URL}${data.actionUrl}` : null;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #6b8dd6 0%, #8b5cf6 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .email-body {
      padding: 40px 30px;
    }
    .notification-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .badge-company_approval {
      background-color: #fef3c7;
      color: #92400e;
    }
    .badge-user_affiliation {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .badge-casting_decision {
      background-color: #d1fae5;
      color: #065f46;
    }
    .badge-casting_offer {
      background-color: #fce7f3;
      color: #9f1239;
    }
    .badge-general {
      background-color: #e0e7ff;
      color: #3730a3;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #4b5563;
    }
    .message {
      font-size: 16px;
      line-height: 1.8;
      color: #1f2937;
      margin-bottom: 30px;
      padding: 20px;
      background-color: #f9fafb;
      border-left: 4px solid #6b8dd6;
      border-radius: 4px;
    }
    .action-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #6b8dd6 0%, #8b5cf6 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .action-button:hover {
      transform: translateY(-2px);
    }
    .footer {
      padding: 30px;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .footer-links {
      margin-top: 15px;
    }
    .footer-link {
      color: #6b8dd6;
      text-decoration: none;
      margin: 0 10px;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>🎭 Belong Here Theater</h1>
    </div>
    
    <div class="email-body">
      <span class="notification-badge badge-${data.notificationType}">
        ${data.notificationType.replace('_', ' ')}
      </span>
      
      <div class="greeting">
        Hi ${data.recipientName},
      </div>
      
      <div class="message">
        ${data.message}
      </div>
      
      ${fullActionUrl ? `
        <center>
          <a href="${fullActionUrl}" class="action-button">
            ${data.actionText || 'View Details'}
          </a>
        </center>
      ` : ''}
      
      <div class="divider"></div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        You received this email because you have an account with Belong Here Theater. 
        If you have any questions, please contact our support team.
      </p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Belong Here Theater. All rights reserved.</p>
      <div class="footer-links">
        <a href="${APP_URL}/profile" class="footer-link">My Profile</a>
        <a href="${APP_URL}/help" class="footer-link">Help Center</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the email
 */
function generateEmailText(data: EmailTemplateData): string {
  const fullActionUrl = data.actionUrl ? `${APP_URL}${data.actionUrl}` : null;
  
  return `
Belong Here Theater - ${data.title}

Hi ${data.recipientName},

${data.message}

${fullActionUrl ? `\nView Details: ${fullActionUrl}\n` : ''}

---
You received this email because you have an account with Belong Here Theater.
If you have any questions, please contact our support team.

© ${new Date().getFullYear()} Belong Here Theater. All rights reserved.
  `.trim();
}

/**
 * Get action text based on notification type
 */
function getActionText(notificationType: NotificationType): string {
  switch (notificationType) {
    case 'company_approval':
      return 'Review Request';
    case 'casting_offer':
      return 'View Offer';
    case 'casting_decision':
      return 'View Details';
    case 'user_affiliation':
      return 'View Profile';
    case 'general':
    default:
      return 'View Details';
  }
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  notificationType: NotificationType,
  title: string,
  message: string,
  actionUrl?: string,
  senderName?: string
): Promise<{ success: boolean; messageId?: string; error?: any }> {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured. Skipping email notification.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const emailData: EmailTemplateData = {
      recipientEmail,
      recipientName,
      senderName,
      notificationType,
      title,
      message,
      actionUrl,
      actionText: getActionText(notificationType),
    };

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: title,
      html: generateEmailHTML(emailData),
      text: generateEmailText(emailData),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { success: false, error };
  }
}

/**
 * Send a batch of notification emails (for bulk operations)
 */
export async function sendBatchNotificationEmails(
  emails: Array<{
    recipientEmail: string;
    recipientName: string;
    notificationType: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    senderName?: string;
  }>
): Promise<{ success: boolean; sentCount: number; errors: any[] }> {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured. Skipping batch email notifications.');
    return { success: false, sentCount: 0, errors: ['Email service not configured'] };
  }

  const results = await Promise.allSettled(
    emails.map(email => 
      sendNotificationEmail(
        email.recipientEmail,
        email.recipientName,
        email.notificationType,
        email.title,
        email.message,
        email.actionUrl,
        email.senderName
      )
    )
  );

  const sentCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const errors = results
    .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
    .map(r => r.status === 'rejected' ? r.reason : (r as any).value.error);

  return {
    success: sentCount === emails.length,
    sentCount,
    errors,
  };
}
