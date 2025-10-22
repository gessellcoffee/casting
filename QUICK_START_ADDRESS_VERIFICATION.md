# Quick Start: Address Verification

## Why Nothing Shows Up When You Type

The AddressInput component requires Google Maps API to be configured. Here's how to fix it:

## Step 1: Get Google Maps API Key (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Click **"Enable APIs and Services"**
4. Search for and enable:
   - **Places API**
   - **Maps JavaScript API**
5. Go to **Credentials** → **Create Credentials** → **API Key**
6. Copy your API key

### Restrict Your API Key (Important!)

1. Click on your API key to edit it
2. Under **Application restrictions**:
   - Select "HTTP referrers (websites)"
   - Add: `localhost:3000/*` and `127.0.0.1:3000/*`
3. Under **API restrictions**:
   - Select "Restrict key"
   - Choose: Places API, Maps JavaScript API
4. Click **Save**

## Step 2: Add API Key to Your Project

Create a file named `.env.local` in the project root:

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your_key_here
```

**Important**: Replace `AIza...your_key_here` with your actual API key from Step 1.

## Step 3: Restart Your Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 4: Test It

1. Go to any page with an address input (e.g., Company page)
2. Click on an address field
3. Start typing an address (e.g., "123 Main")
4. You should see suggestions appear!

## Troubleshooting

### Still Not Working?

Open your browser's Developer Console (F12) and check for errors:

#### Error: "Google Maps API not loaded"
- Make sure `.env.local` exists in the project root
- Verify the API key is correct
- Restart the dev server

#### Error: "This API key is not authorized"
- Check API key restrictions in Google Cloud Console
- Make sure `localhost:3000` is allowed
- Verify Places API is enabled

#### Error: "You have exceeded your request quota"
- Check your Google Cloud Console billing
- You get $200 free credit per month
- Set up billing alerts

#### No errors, but still no suggestions
- Check that you're typing at least 3 characters
- Wait 300ms after typing (debounce delay)
- Try a common address like "123 Main Street"
- Check browser console for any warnings

### Check API Key is Loaded

Open browser console and type:
```javascript
console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
```

If it shows `undefined`, your `.env.local` file is not being read.

## Without API Key (Fallback)

If you don't want to set up Google Maps API right now:
- The address inputs will work as normal text fields
- You won't get autocomplete suggestions
- You can still type and save addresses manually
- No functionality is broken, just no smart suggestions

## Cost Information

Google Maps Platform pricing:
- **Free tier**: $200 credit per month
- **Autocomplete**: ~$2.83 per 1,000 sessions
- **Typical usage**: Most small apps stay within free tier

A "session" = one user typing and selecting an address.

## Need Help?

1. Check the browser console (F12) for errors
2. Verify `.env.local` exists and has the correct format
3. Make sure you restarted the dev server
4. Check Google Cloud Console for API status
5. See `/guides/ADDRESS_VERIFICATION_SETUP.md` for detailed docs

## Quick Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Places API
- [ ] Enabled Maps JavaScript API
- [ ] Created API key
- [ ] Restricted API key to localhost
- [ ] Created `.env.local` file
- [ ] Added `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...`
- [ ] Restarted dev server (`npm run dev`)
- [ ] Tested typing in address field
- [ ] Saw suggestions appear

If all boxes are checked and it's still not working, check the browser console for specific error messages.
