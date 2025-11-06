/**
 * Test script to verify Resend email configuration
 * 
 * Run with: npx ts-node scripts/test-email.ts <your-email@example.com>
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail(recipientEmail: string) {
  console.log('🧪 Testing Resend Email Configuration...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('  RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '✗ Missing');
  console.log('  NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '✗ Missing');
  console.log('');

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set. Please add it to .env.local');
    process.exit(1);
  }

  if (!recipientEmail) {
    console.error('❌ Please provide a recipient email address as an argument.');
    console.error('   Usage: npx tsx scripts/test-email.ts your-email@example.com');
    process.exit(1);
  }

  console.log(`Sending test email to: ${recipientEmail}\n`);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@belongheretheater.org',
      to: recipientEmail,
      subject: 'Test Email - Belong Here Theater',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #6b8dd6 0%, #8b5cf6 100%); color: #ffffff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🎭 Belong Here Theater</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin-top: 0;">Email Test Successful! ✅</h2>
      
      <p style="font-size: 16px; line-height: 1.8; color: #1f2937;">
        This is a test email from your Belong Here Theater casting application.
      </p>
      
      <div style="padding: 20px; background-color: #f9fafb; border-left: 4px solid #6b8dd6; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          <strong>Configuration Status:</strong><br>
          ✓ Resend API Key: Configured<br>
          ✓ From Email: ${process.env.RESEND_FROM_EMAIL || 'notifications@belongheretheater.org'}<br>
          ✓ App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
        </p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.8; color: #1f2937;">
        If you received this email, your email notification system is working correctly! 🎉
      </p>
      
      <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 14px; color: #6b7280; margin: 0;">
          <strong>Next Steps:</strong>
        </p>
        <ul style="font-size: 14px; color: #6b7280; line-height: 1.8;">
          <li>Make sure your development server is running</li>
          <li>Create a test notification to verify end-to-end functionality</li>
          <li>Check browser console and server logs for any errors</li>
        </ul>
      </div>
    </div>
    
    <div style="padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        © ${new Date().getFullYear()} Belong Here Theater. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
      `,
      text: `
Belong Here Theater - Email Test Successful!

This is a test email from your Belong Here Theater casting application.

Configuration Status:
✓ Resend API Key: Configured
✓ From Email: ${process.env.RESEND_FROM_EMAIL || 'notifications@belongheretheater.org'}
✓ App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}

If you received this email, your email notification system is working correctly! 🎉

Next Steps:
- Make sure your development server is running
- Create a test notification to verify end-to-end functionality
- Check browser console and server logs for any errors

© ${new Date().getFullYear()} Belong Here Theater. All rights reserved.
      `.trim(),
    });

    if (error) {
      console.error('❌ Failed to send email:', error);
      console.error('\nPossible issues:');
      console.error('  1. Invalid Resend API key');
      console.error('  2. From email domain not verified in Resend');
      console.error('  3. Recipient email is invalid');
      console.error('  4. Resend account has reached sending limits');
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', data?.id);
    console.log('\n📬 Check your inbox (and spam folder) for the test email.');
    console.log('\nIf you don\'t receive the email within a few minutes:');
    console.log('  1. Verify your domain is set up in Resend: https://resend.com/domains');
    console.log('  2. Check your Resend dashboard for delivery status: https://resend.com/emails');
    console.log('  3. Ensure the from email domain matches your verified domain');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get recipient email from command line argument
const recipientEmail = process.argv[2];
testEmail(recipientEmail);
