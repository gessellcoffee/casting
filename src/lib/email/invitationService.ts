import { Resend } from 'resend';

// Email configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'notifications@belongheretheater.org';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Lazy initialize Resend client only when needed (server-side only)
let resendClient: Resend | null = null;
function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

interface CastingInvitationData {
  recipientEmail: string;
  showTitle: string;
  roleName?: string;
  isUnderstudy?: boolean;
  isEnsemble?: boolean;
  senderName: string;
  message?: string;
  invitationType: 'casting_offer' | 'callback';
  callbackDate?: string;
  callbackTime?: string;
  callbackLocation?: string;
}

/**
 * Generate HTML email template for casting invitation to non-users
 */
function generateInvitationHTML(data: CastingInvitationData): string {
  const signupUrl = `${APP_URL}/signup?email=${encodeURIComponent(data.recipientEmail)}`;
  
  let roleDescription = '';
  if (data.isEnsemble) {
    roleDescription = 'an ensemble role';
  } else if (data.roleName) {
    roleDescription = data.isUnderstudy 
      ? `the understudy role for ${data.roleName}`
      : `the role of ${data.roleName}`;
  }

  const invitationTitle = data.invitationType === 'casting_offer' 
    ? `You've Been Cast in "${data.showTitle}"!`
    : `Callback Invitation for "${data.showTitle}"`;

  const invitationMessage = data.invitationType === 'casting_offer'
    ? `${data.senderName} has cast you in ${roleDescription} for their production of "${data.showTitle}".`
    : `${data.senderName} has invited you to a callback for ${roleDescription ? roleDescription + ' in' : ''} "${data.showTitle}".`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${invitationTitle}</title>
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
      padding: 40px 30px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 600;
    }
    .email-header .subtitle {
      font-size: 18px;
      opacity: 0.95;
      margin: 0;
    }
    .email-body {
      padding: 40px 30px;
    }
    .celebration-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      background: linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%);
      color: #9f1239;
      margin-bottom: 20px;
    }
    .greeting {
      font-size: 18px;
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
    .custom-message {
      font-size: 15px;
      line-height: 1.7;
      color: #374151;
      margin: 20px 0;
      padding: 15px;
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
    }
    .callback-details {
      background-color: #e0e7ff;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .callback-details h3 {
      margin: 0 0 15px 0;
      color: #3730a3;
      font-size: 16px;
    }
    .callback-details p {
      margin: 8px 0;
      color: #4338ca;
    }
    .info-box {
      background-color: #dbeafe;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
      border-left: 4px solid #3b82f6;
    }
    .info-box h3 {
      margin: 0 0 10px 0;
      color: #1e40af;
      font-size: 16px;
    }
    .info-box p {
      margin: 5px 0;
      color: #1e3a8a;
      font-size: 14px;
    }
    .action-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #6b8dd6 0%, #8b5cf6 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 18px;
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
      <h1>🎭 ${invitationTitle}</h1>
      <p class="subtitle">Belong Here Theater</p>
    </div>
    
    <div class="email-body">
      <span class="celebration-badge">
        ${data.invitationType === 'casting_offer' ? '🎉 CASTING OFFER' : '📋 CALLBACK INVITATION'}
      </span>
      
      <div class="greeting">
        Hello!
      </div>
      
      <div class="message">
        <strong>${invitationMessage}</strong>
      </div>
      
      ${data.message ? `
        <div class="custom-message">
          <strong>Personal Message:</strong><br>
          ${data.message}
        </div>
      ` : ''}
      
      ${data.invitationType === 'callback' && (data.callbackDate || data.callbackTime || data.callbackLocation) ? `
        <div class="callback-details">
          <h3>📅 Callback Details</h3>
          ${data.callbackDate ? `<p><strong>Date:</strong> ${data.callbackDate}</p>` : ''}
          ${data.callbackTime ? `<p><strong>Time:</strong> ${data.callbackTime}</p>` : ''}
          ${data.callbackLocation ? `<p><strong>Location:</strong> ${data.callbackLocation}</p>` : ''}
        </div>
      ` : ''}
      
      <div class="info-box">
        <h3>🎭 Join Belong Here Theater</h3>
        <p>To accept this ${data.invitationType === 'casting_offer' ? 'offer' : 'invitation'} and connect with the production team, you'll need to create a free account on Belong Here Theater.</p>
        <p>Belong Here Theater is a comprehensive casting management platform designed specifically for theater professionals.</p>
      </div>
      
      <center>
        <a href="${signupUrl}" class="action-button">
          Create Your Free Account
        </a>
      </center>
      
      <div class="divider"></div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Once you've created your account, you'll be able to view all the details about this production, 
        communicate with the team, and manage your participation.
      </p>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
        If you have any questions, please reach out to ${data.senderName} or contact our support team.
      </p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Belong Here Theater. All rights reserved.</p>
      <div class="footer-links">
        <a href="${APP_URL}" class="footer-link">Visit Website</a>
        <a href="${APP_URL}/help" class="footer-link">Help Center</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the invitation email
 */
function generateInvitationText(data: CastingInvitationData): string {
  const signupUrl = `${APP_URL}/signup?email=${encodeURIComponent(data.recipientEmail)}`;
  
  let roleDescription = '';
  if (data.isEnsemble) {
    roleDescription = 'an ensemble role';
  } else if (data.roleName) {
    roleDescription = data.isUnderstudy 
      ? `the understudy role for ${data.roleName}`
      : `the role of ${data.roleName}`;
  }

  const invitationTitle = data.invitationType === 'casting_offer' 
    ? `You've Been Cast in "${data.showTitle}"!`
    : `Callback Invitation for "${data.showTitle}"`;

  const invitationMessage = data.invitationType === 'casting_offer'
    ? `${data.senderName} has cast you in ${roleDescription} for their production of "${data.showTitle}".`
    : `${data.senderName} has invited you to a callback for ${roleDescription ? roleDescription + ' in' : ''} "${data.showTitle}".`;

  let text = `
${invitationTitle}
Belong Here Theater

Hello!

${invitationMessage}
`;

  if (data.message) {
    text += `\nPersonal Message:\n${data.message}\n`;
  }

  if (data.invitationType === 'callback' && (data.callbackDate || data.callbackTime || data.callbackLocation)) {
    text += '\nCallback Details:\n';
    if (data.callbackDate) text += `Date: ${data.callbackDate}\n`;
    if (data.callbackTime) text += `Time: ${data.callbackTime}\n`;
    if (data.callbackLocation) text += `Location: ${data.callbackLocation}\n`;
  }

  text += `
Join Belong Here Theater

To accept this ${data.invitationType === 'casting_offer' ? 'offer' : 'invitation'} and connect with the production team, you'll need to create a free account on Belong Here Theater.

Create Your Account: ${signupUrl}

Once you've created your account, you'll be able to view all the details about this production, communicate with the team, and manage your participation.

If you have any questions, please reach out to ${data.senderName} or contact our support team.

---
© ${new Date().getFullYear()} Belong Here Theater. All rights reserved.
  `.trim();

  return text;
}

/**
 * Send a casting invitation email to a non-user
 */
export async function sendCastingInvitationEmail(
  data: CastingInvitationData
): Promise<{ success: boolean; messageId?: string; error?: any }> {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured. Skipping invitation email.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const subject = data.invitationType === 'casting_offer'
      ? `🎭 You've Been Cast in "${data.showTitle}"!`
      : `📋 Callback Invitation for "${data.showTitle}"`;

    const resend = getResendClient();
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject,
      html: generateInvitationHTML(data),
      text: generateInvitationText(data),
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      return { success: false, error };
    }

    console.log('Invitation email sent successfully:', emailData?.id);
    return { success: true, messageId: emailData?.id };
  } catch (error) {
    console.error('Error sending casting invitation email:', error);
    return { success: false, error };
  }
}
