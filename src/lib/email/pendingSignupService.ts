import { Resend } from 'resend';
import type { PendingSignupRequestType, CastingOfferRequestData, CompanyMemberRequestData, CallbackInvitationRequestData } from '@/types/pendingSignup';

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

interface PendingSignupEmailData {
  recipientEmail: string;
  requestType: PendingSignupRequestType;
  requestData: any;
  inviterUsername: string;
  inviterFullName?: string | null;
}

/**
 * Generate HTML email template for pending signup invitation
 */
function generatePendingSignupHTML(data: PendingSignupEmailData): string {
  const signupUrl = `${APP_URL}/signup?email=${encodeURIComponent(data.recipientEmail)}`;
  const inviterName = data.inviterFullName || data.inviterUsername;
  
  let title = '';
  let message = '';
  let details = '';

  switch (data.requestType) {
    case 'casting_offer':
      const castingData = data.requestData as CastingOfferRequestData;
      title = `You've Been Cast in "${castingData.show_title}"!`;
      message = `${inviterName} has cast you as ${castingData.role_name}${castingData.is_understudy ? ' (Understudy)' : ''} in their production of "${castingData.show_title}".`;
      if (castingData.offer_message) {
        details = `<p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 16px 0;">${castingData.offer_message}</p>`;
      }
      break;

    case 'company_member':
      const companyData = data.requestData as CompanyMemberRequestData;
      title = `You've Been Added to ${companyData.company_name}`;
      message = `${inviterName} has added you to their company "${companyData.company_name}" as a ${companyData.role}.`;
      break;

    case 'callback_invitation':
      const callbackData = data.requestData as CallbackInvitationRequestData;
      title = `Callback Invitation for "${callbackData.show_title}"`;
      message = `${inviterName} has invited you to a callback for their production of "${callbackData.show_title}".`;
      details = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 12px; margin: 16px 0;">
          <p style="color: white; margin: 0; font-size: 14px;"><strong>Date:</strong> ${callbackData.callback_date}</p>
          <p style="color: white; margin: 8px 0 0 0; font-size: 14px;"><strong>Time:</strong> ${callbackData.callback_time}</p>
          ${callbackData.location ? `<p style="color: white; margin: 8px 0 0 0; font-size: 14px;"><strong>Location:</strong> ${callbackData.location}</p>` : ''}
        </div>
      `;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${title}
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    ${message}
                  </p>

                  ${details}

                  <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; border-left: 4px solid #667eea; margin: 24px 0;">
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                      <strong>To accept this invitation and manage your profile, you'll need to create an account on Belong Here Theater.</strong>
                    </p>
                  </div>

                  <!-- CTA Button -->
                  <table role="presentation" style="width: 100%; margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                          Create Your Account
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${signupUrl}" style="color: #667eea; word-break: break-all;">${signupUrl}</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                    This invitation was sent by ${inviterName} (@${data.inviterUsername})<br>
                    via Belong Here Theater Casting Platform
                  </p>
                  <p style="margin: 16px 0 0 0; color: #cbd5e1; font-size: 11px;">
                    © ${new Date().getFullYear()} Belong Here Theater. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Generate plain text version of pending signup invitation
 */
function generatePendingSignupText(data: PendingSignupEmailData): string {
  const signupUrl = `${APP_URL}/signup?email=${encodeURIComponent(data.recipientEmail)}`;
  const inviterName = data.inviterFullName || data.inviterUsername;
  
  let message = '';

  switch (data.requestType) {
    case 'casting_offer':
      const castingData = data.requestData as CastingOfferRequestData;
      message = `${inviterName} has cast you as ${castingData.role_name}${castingData.is_understudy ? ' (Understudy)' : ''} in their production of "${castingData.show_title}".`;
      if (castingData.offer_message) {
        message += `\n\n${castingData.offer_message}`;
      }
      break;

    case 'company_member':
      const companyData = data.requestData as CompanyMemberRequestData;
      message = `${inviterName} has added you to their company "${companyData.company_name}" as a ${companyData.role}.`;
      break;

    case 'callback_invitation':
      const callbackData = data.requestData as CallbackInvitationRequestData;
      message = `${inviterName} has invited you to a callback for their production of "${callbackData.show_title}".\n\nDate: ${callbackData.callback_date}\nTime: ${callbackData.callback_time}`;
      if (callbackData.location) {
        message += `\nLocation: ${callbackData.location}`;
      }
      break;
  }

  return `
${message}

To accept this invitation and manage your profile, you'll need to create an account on Belong Here Theater.

Create Your Account:
${signupUrl}

---
This invitation was sent by ${inviterName} (@${data.inviterUsername})
via Belong Here Theater Casting Platform

© ${new Date().getFullYear()} Belong Here Theater. All rights reserved.
  `.trim();
}

/**
 * Send pending signup invitation email
 */
export async function sendPendingSignupEmail(data: PendingSignupEmailData): Promise<{ success: boolean; error?: any }> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Skipping email send.');
      return { success: false, error: new Error('Email service not configured') };
    }

    const resend = getResendClient();

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: getEmailSubject(data.requestType, data.requestData),
      html: generatePendingSignupHTML(data),
      text: generatePendingSignupText(data)
    });

    if (result.error) {
      console.error('Error sending pending signup email:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in sendPendingSignupEmail:', error);
    return { success: false, error };
  }
}

/**
 * Get email subject based on request type
 */
function getEmailSubject(requestType: PendingSignupRequestType, requestData: any): string {
  switch (requestType) {
    case 'casting_offer':
      return `You've Been Cast in "${requestData.show_title}"!`;
    case 'company_member':
      return `You've Been Added to ${requestData.company_name}`;
    case 'callback_invitation':
      return `Callback Invitation for "${requestData.show_title}"`;
    default:
      return 'Invitation to Join Belong Here Theater';
  }
}

/**
 * Generate HTML for cancellation email
 */
function generateCancellationHTML(data: PendingSignupEmailData): string {
  const inviterName = data.inviterFullName || data.inviterUsername;
  
  let title = '';
  let message = '';

  switch (data.requestType) {
    case 'casting_offer':
      const castingData = data.requestData as CastingOfferRequestData;
      title = `Casting Offer Cancelled`;
      message = `${inviterName} has cancelled their casting offer for ${castingData.role_name} in "${castingData.show_title}".`;
      break;

    case 'company_member':
      const companyData = data.requestData as CompanyMemberRequestData;
      title = `Company Invitation Cancelled`;
      message = `${inviterName} has cancelled their invitation to join "${companyData.company_name}".`;
      break;

    case 'callback_invitation':
      const callbackData = data.requestData as CallbackInvitationRequestData;
      title = `Callback Invitation Cancelled`;
      message = `${inviterName} has cancelled the callback invitation for "${callbackData.show_title}".`;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #64748b 0%, #475569 100%); min-height: 100vh;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${title}
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    ${message}
                  </p>

                  <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b; margin: 24px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      <strong>This invitation is no longer active.</strong> If you believe this was sent in error, please contact ${inviterName} directly.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                    This notification was sent by ${inviterName} (@${data.inviterUsername})<br>
                    via Belong Here Theater Casting Platform
                  </p>
                  <p style="margin: 16px 0 0 0; color: #cbd5e1; font-size: 11px;">
                    © ${new Date().getFullYear()} Belong Here Theater. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Generate plain text for cancellation email
 */
function generateCancellationText(data: PendingSignupEmailData): string {
  const inviterName = data.inviterFullName || data.inviterUsername;
  
  let message = '';

  switch (data.requestType) {
    case 'casting_offer':
      const castingData = data.requestData as CastingOfferRequestData;
      message = `${inviterName} has cancelled their casting offer for ${castingData.role_name} in "${castingData.show_title}".`;
      break;

    case 'company_member':
      const companyData = data.requestData as CompanyMemberRequestData;
      message = `${inviterName} has cancelled their invitation to join "${companyData.company_name}".`;
      break;

    case 'callback_invitation':
      const callbackData = data.requestData as CallbackInvitationRequestData;
      message = `${inviterName} has cancelled the callback invitation for "${callbackData.show_title}".`;
      break;
  }

  return `
${message}

This invitation is no longer active. If you believe this was sent in error, please contact ${inviterName} directly.

---
This notification was sent by ${inviterName} (@${data.inviterUsername})
via Belong Here Theater Casting Platform

© ${new Date().getFullYear()} Belong Here Theater. All rights reserved.
  `.trim();
}

/**
 * Send cancellation email for a pending signup
 */
export async function sendCancellationEmail(data: PendingSignupEmailData): Promise<{ success: boolean; error?: any }> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Skipping email send.');
      return { success: false, error: new Error('Email service not configured') };
    }

    const resend = getResendClient();

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: getCancellationSubject(data.requestType),
      html: generateCancellationHTML(data),
      text: generateCancellationText(data)
    });

    if (result.error) {
      console.error('Error sending cancellation email:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in sendCancellationEmail:', error);
    return { success: false, error };
  }
}

/**
 * Get cancellation email subject
 */
function getCancellationSubject(requestType: PendingSignupRequestType): string {
  switch (requestType) {
    case 'casting_offer':
      return 'Casting Offer Cancelled';
    case 'company_member':
      return 'Company Invitation Cancelled';
    case 'callback_invitation':
      return 'Callback Invitation Cancelled';
    default:
      return 'Invitation Cancelled';
  }
}
