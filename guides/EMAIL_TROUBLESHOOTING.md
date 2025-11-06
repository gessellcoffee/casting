# Email Notification Troubleshooting Guide

This guide helps diagnose and fix issues with email notifications not being sent.

## Quick Diagnosis Checklist

### 1. Environment Variables ✓

Check that all required environment variables are set in `.env.local`:

```bash
# Required for email system
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Or your production URL
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=notifications@yourdomain.com
```

**Common Issues:**
- ❌ `NEXT_PUBLIC_APP_URL` is missing (CRITICAL - just added)
- ❌ `RESEND_API_KEY` is missing or invalid
- ❌ `RESEND_FROM_EMAIL` domain doesn't match verified domain in Resend

### 2. Resend Account Setup ✓

Visit https://resend.com/domains and verify:

- [ ] Domain is added and verified (DNS records configured)
- [ ] From email address matches your verified domain
- [ ] API key has not been revoked
- [ ] Account has not hit sending limits (100 emails/day on free tier)

**Note:** If using `notifications@belongheretheater.org`, make sure `belongheretheater.org` is verified in Resend.

### 3. Development Server ✓

After adding environment variables, you MUST restart your development server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

Environment variables are only loaded when the server starts!

### 4. Test Email Sending ✓

Run the test script to verify Resend configuration:

```bash
# Install dotenv if not already installed
npm install dotenv

# Run test (replace with your email)
npx ts-node -r dotenv/config scripts/test-email.ts your-email@example.com
```

If the test succeeds but app notifications don't send emails, the issue is in the integration.

### 5. Check Browser Console & Server Logs ✓

**Browser Console** (F12 → Console tab):
Look for errors when triggering notifications:
- API route errors (500, 400 status codes)
- Network failures
- CORS issues

**Server Console** (Terminal running `npm run dev`):
Look for:
- `Email notification sent successfully to: <email>` ✅ Success
- `Failed to send email notification:` ❌ API errors
- `RESEND_API_KEY not configured` ❌ Missing config
- `Recipient profile not found` ❌ Database issue

## Common Error Messages & Solutions

### Error: "RESEND_API_KEY not configured"

**Cause:** Environment variable is missing or not loaded.

**Solution:**
1. Add `RESEND_API_KEY` to `.env.local`
2. Restart dev server
3. Verify with: `console.log(process.env.RESEND_API_KEY)` in your API route

### Error: "Failed to send email"

**Cause:** Multiple possibilities - API key invalid, domain not verified, rate limiting.

**Solution:**
1. Check Resend dashboard: https://resend.com/emails
2. Look at recent email attempts and their status
3. Verify domain is properly configured
4. Check API key is valid and not revoked

### Error: "Recipient profile not found or missing email"

**Cause:** User profile doesn't have an email address.

**Solution:**
1. Check the user's profile in database (profiles table)
2. Ensure `email` field is populated
3. User might have signed up without email (OAuth issue)

### No Error, But Emails Not Received

**Possible causes:**
1. **Emails going to spam** - Check spam/junk folder
2. **Email provider blocking** - Some providers block automated emails
3. **Domain reputation** - New domain might be flagged
4. **Silently failing** - Check server logs carefully

**Solutions:**
1. Try sending to different email address (Gmail, Outlook, etc.)
2. Check Resend dashboard for delivery status
3. Add SPF/DKIM records to improve deliverability
4. Enable verbose logging temporarily

## Testing Email Flow End-to-End

### Step 1: Test Resend Directly

```bash
npx ts-node -r dotenv/config scripts/test-email.ts your-email@example.com
```

**Expected:** Receive test email within 1-2 minutes.

### Step 2: Test via API Route

Create a temporary test file or use curl:

```bash
curl -X POST http://localhost:3000/api/send-notification-email \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "your-email@example.com",
    "recipientName": "Test User",
    "notificationType": "general",
    "title": "Test Notification",
    "message": "This is a test message",
    "actionUrl": "/profile"
  }'
```

**Expected:** Receive email and see 200 response.

### Step 3: Test via Application

1. Start dev server: `npm run dev`
2. Create a test notification (e.g., send yourself a callback invitation)
3. Check browser console for errors
4. Check server logs for email sending confirmation
5. Check email inbox (and spam folder)

## Debugging Mode

To enable verbose logging, temporarily add console.logs:

### In `src/lib/supabase/notifications.ts`:

```typescript
async function sendEmailNotification(...) {
  console.log('=== EMAIL NOTIFICATION DEBUG ===');
  console.log('Recipient ID:', recipientId);
  console.log('Notification Type:', notificationType);
  console.log('Title:', title);
  console.log('Message:', message);
  console.log('Action URL:', actionUrl);
  
  try {
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', recipientId)
      .single();

    console.log('Recipient Profile:', recipientProfile);
    
    const response = await fetch(...);
    console.log('API Response Status:', response.status);
    
    const responseData = await response.json();
    console.log('API Response Data:', responseData);
    // ... rest of function
  }
}
```

## Resend Dashboard Checks

1. **Go to:** https://resend.com/emails
2. **Check recent emails:**
   - Status: delivered, bounced, complained
   - Opens and clicks
   - Error messages

3. **Check API Keys:** https://resend.com/api-keys
   - Ensure key is active
   - Check permissions

4. **Check Domains:** https://resend.com/domains
   - Verify DNS records are properly configured
   - Check domain status (verified/pending)

## Production Deployment Checklist

If emails work locally but not in production:

- [ ] Update `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Verify all environment variables are set in production
- [ ] Check production logs for errors
- [ ] Ensure production API key is different from dev
- [ ] Verify production domain is verified in Resend
- [ ] Check if production server can make outbound HTTPS requests
- [ ] Verify firewall/security groups allow outbound to Resend API

## Still Not Working?

### Contact Resend Support
- Email: support@resend.com
- Include: Account email, API key ID (not full key), error messages

### Check Resend Status
- https://status.resend.com

### Review Resend Docs
- https://resend.com/docs/send-with-nodejs

## Quick Reference: Email Flow

```
1. User Action (e.g., send casting offer)
   ↓
2. createNotification() called
   ↓
3. Notification inserted to database
   ↓
4. sendEmailNotification() called (async)
   ↓
5. Fetch recipient profile from database
   ↓
6. POST to /api/send-notification-email
   ↓
7. API route calls sendNotificationEmail()
   ↓
8. Resend API called
   ↓
9. Email sent
```

Any break in this chain will prevent emails from being sent. Use the debugging steps above to identify where the chain breaks.

## Emergency Workaround

If emails must work immediately and troubleshooting is taking too long, you can temporarily bypass the integration and call Resend directly:

```typescript
// In castingOffers.ts or wherever you need immediate emails
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// After creating notification
await resend.emails.send({
  from: 'notifications@belongheretheater.org',
  to: userEmail,
  subject: 'Your notification',
  text: 'Your message here',
});
```

This is NOT recommended long-term, but can be used as a temporary fix while debugging the proper integration.
