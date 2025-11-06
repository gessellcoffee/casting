# Production Deployment Guide

This guide walks you through deploying your casting application to production with working email notifications.

## Pre-Deployment Checklist

### 1. Verify Your Domain in Resend ✅

**This is CRITICAL for production emails to work!**

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `belongheretheater.org`
4. Add the DNS records Resend provides to your domain registrar:
   - **SPF Record** (TXT)
   - **DKIM Records** (TXT - usually 3 records)
   - **DMARC Record** (TXT, optional but recommended)

5. Wait for verification (usually 5-10 minutes, can take up to 24 hours)
6. Verify status shows "Verified" in Resend dashboard

**Why this matters:** Emails sent from `notifications@belongheretheater.org` will fail if the domain isn't verified.

### 2. Know Your Production URL

Determine where your app will be hosted. Common options:
- `https://belongheretheater.org`
- `https://app.belongheretheater.org`
- `https://casting.belongheretheater.org`

This will be your `NEXT_PUBLIC_APP_URL` in production.

### 3. Prepare OAuth Redirect URI

If using a custom domain, update Google OAuth settings:
1. Go to https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://yourdomain.com/auth/callback/google`

## Deployment Instructions

### Option A: Deploy to Vercel (Recommended)

1. **Push your code to GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Production ready with email notifications"
   git push
   ```

2. **Import project to Vercel**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   
   In Vercel dashboard → Settings → Environment Variables, add:

   ```bash
   # Application URL
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   # (or your custom domain once configured)

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://gugvtcitwqwgjyqjyrgy.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Google Maps
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCIAEt6_U6TPVg4CieQP3Cya2GB1UWENN4

   # Google OAuth
   GOOGLE_CLIENT_ID=844850802159-dsuqsp1dcauarqkifh9lmu5i2847enq8.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/auth/callback/google

   # Resend Email (MUST use verified domain!)
   RESEND_API_KEY=re_9sqDN6zp_JS9R6Azy6ZeXizcT1qQPtXdk
   RESEND_FROM_EMAIL=notifications@belongheretheater.org
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

5. **Custom Domain (Optional)**
   - Go to Settings → Domains
   - Add your custom domain
   - Update `NEXT_PUBLIC_APP_URL` and `GOOGLE_REDIRECT_URI` to match

### Option B: Deploy to Netlify

1. **Connect repository**
   - Go to https://netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

2. **Build settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Environment variables**
   - Go to Site settings → Environment variables
   - Add all variables from `.env.production.example`
   - Update URLs to match your Netlify URL

4. **Deploy**

### Option C: Self-Hosted

If deploying to your own server:

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Set environment variables on server**
   - Create `.env.production` file (DO NOT commit!)
   - Or set via system environment variables
   - Use values from `.env.production.example`

3. **Start the app**
   ```bash
   npm start
   ```

## Post-Deployment Verification

### 1. Test Email Sending

From your production server, run:

```bash
# SSH into server or use Vercel CLI
npx ts-node scripts/test-email.ts your-email@example.com
```

**Expected result:** Receive email from `notifications@belongheretheater.org`

### 2. Check Email Links

1. Create a test notification in the app
2. Receive email
3. Click "View Details" button
4. **Verify:** Should go to `https://yourdomain.com/...` (NOT localhost)

### 3. Test Full Flow

1. Send yourself a callback invitation
2. Check email arrives
3. Click action button in email
4. Verify it opens the correct page on your production site

## Troubleshooting Production Emails

### Emails not sending

**Check Resend Dashboard:** https://resend.com/emails
- View recent email attempts
- Check delivery status
- Look for error messages

**Common Issues:**
1. ✗ Domain not verified → Verify at https://resend.com/domains
2. ✗ Wrong from email → Must match verified domain
3. ✗ Environment variable not set → Check deployment platform
4. ✗ API key invalid → Regenerate in Resend

### Links go to localhost

**Problem:** `NEXT_PUBLIC_APP_URL` is not set in production

**Solution:** 
1. Go to deployment platform settings
2. Set `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
3. Redeploy

### Domain Verification Tips

**DNS Propagation:**
- Can take 5 minutes to 24 hours
- Use https://dnschecker.org to check propagation

**Common DNS Issues:**
- Wrong record type (must be TXT)
- Missing trailing dot in some DNS providers
- Incorrect value (copy exactly from Resend)

## Environment Variables Reference

### Required for Email Functionality

| Variable | Local (Dev) | Production |
|----------|-------------|------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://yourdomain.com` |
| `RESEND_API_KEY` | Your key | Same or separate key |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | `notifications@belongheretheater.org` |

### All Environment Variables

See `.env.production.example` for complete list.

## Security Notes

### ⚠️ NEVER Commit to Git

Files that should NEVER be committed:
- `.env.local` (development secrets)
- `.env.production` (production secrets)
- Any file with actual API keys

### ✅ Safe to Commit

Files that are safe to commit:
- `.env.production.example` (template only, no real values)
- `.env.example` (if you create one)

### Best Practices

1. Use different API keys for dev and production
2. Rotate keys regularly
3. Use deployment platform's secret management
4. Enable IP restrictions on API keys when possible
5. Monitor usage in Resend dashboard

## Monitoring Production Emails

### Resend Dashboard

Monitor at https://resend.com/emails:
- Delivery rate
- Bounces
- Opens and clicks
- Error logs

### Application Logs

Check your deployment platform logs for:
- `Email notification sent successfully` ✅
- `Failed to send email notification` ❌

### Set Up Alerts

Consider setting up alerts for:
- Email delivery failures
- API rate limits
- Domain verification issues

## Rollback Plan

If emails break after deployment:

1. **Check Vercel/Netlify logs** for errors
2. **Verify environment variables** are set correctly
3. **Test Resend API** using test script
4. **Temporarily revert** to `onboarding@resend.dev` if needed
5. **Check Resend status:** https://status.resend.com

## Getting Help

### Resend Support
- Email: support@resend.com
- Include: Account email, API key ID, error messages

### Application Issues
- Check server logs
- Review `guides/EMAIL_TROUBLESHOOTING.md`
- Test with `scripts/test-email.ts`

## Summary Checklist

Before going live:

- [ ] Domain verified in Resend
- [ ] All environment variables set in deployment platform
- [ ] `NEXT_PUBLIC_APP_URL` points to production domain
- [ ] `RESEND_FROM_EMAIL` uses verified domain
- [ ] Google OAuth redirect URI updated
- [ ] Test email sent successfully
- [ ] Email action buttons link to production (not localhost)
- [ ] Deployed and accessible at production URL
- [ ] Full notification flow tested

Once all checked, you're ready to go live! 🚀
