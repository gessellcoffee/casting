# Address Verification Setup Guide

This guide explains how to set up and use the smart address verification system in the casting application.

## Overview

The application now includes smart address verification using Google Places API. All location and address input fields have been updated to provide:

- **Autocomplete suggestions** as users type
- **Address verification** with visual feedback
- **Geocoding** for verified addresses (latitude/longitude)
- **Formatted addresses** following postal standards

## Components Updated

The following components now use the `AddressInput` component:

1. **AuditionDetailsForm** - Rehearsal and Performance locations
2. **Company Page** - Company address
3. **SlotScheduler** - Default location for audition slots

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API**
   - **Maps JavaScript API**
   - **Geocoding API** (optional, for additional features)
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key
6. **Important**: Restrict your API key:
   - Application restrictions: HTTP referrers (websites)
   - Add your domain(s): `localhost:3000`, `yourdomain.com`
   - API restrictions: Select the APIs listed above

### 2. Configure Environment Variables

Create or update your `.env.local` file in the project root:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Note**: The `NEXT_PUBLIC_` prefix is required for client-side access in Next.js.

### 3. Restart Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

## Usage

### Basic Usage

The `AddressInput` component works like a standard input but with enhanced features:

```tsx
import AddressInput from '@/components/ui/AddressInput';

function MyComponent() {
  const [location, setLocation] = useState('');

  return (
    <AddressInput
      label="Location"
      value={location}
      onChange={(value, isVerified, placeDetails) => {
        setLocation(value);
        if (isVerified && placeDetails) {
          console.log('Verified address:', placeDetails);
          // placeDetails includes: address, lat, lng, placeId, formattedAddress
        }
      }}
      placeholder="Enter address..."
      required={false}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Current input value |
| `onChange` | `(value: string, isVerified: boolean, placeDetails?: PlaceDetails) => void` | - | Callback when value changes |
| `label` | `string` | `'Location'` | Label text |
| `placeholder` | `string` | `'Enter address...'` | Placeholder text |
| `required` | `boolean` | `false` | Whether field is required |
| `className` | `string` | `''` | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disable input |

### PlaceDetails Interface

When an address is verified, the `onChange` callback receives a `PlaceDetails` object:

```typescript
interface PlaceDetails {
  address: string;           // Short name/address
  lat: number;              // Latitude
  lng: number;              // Longitude
  placeId: string;          // Google Place ID
  formattedAddress: string; // Full formatted address
}
```

## Features

### 1. Autocomplete Suggestions

- Suggestions appear as you type (debounced by 300ms)
- Shows both main text and secondary text (street, city, etc.)
- Click or tap to select a suggestion

### 2. Visual Feedback

- **Loading spinner**: Shows while fetching suggestions or verifying
- **Green checkmark**: Address has been verified
- **Red error icon**: Error occurred during verification
- **Location icon**: Always visible on the left

### 3. Address Verification

- Selected addresses are automatically verified
- Verified addresses receive geocoding data (lat/lng)
- Users can still enter custom text if needed

### 4. Responsive Design

- Works on desktop and mobile devices
- Touch-friendly suggestion list
- Proper z-index handling for overlays

## Fallback Behavior

If the Google Maps API key is not configured:

- The component gracefully degrades to a standard text input
- No errors are thrown
- A console warning is logged
- Users can still enter addresses manually

## Best Practices

### 1. API Key Security

- Never commit API keys to version control
- Use environment variables
- Restrict API key usage by domain
- Set up billing alerts in Google Cloud Console

### 2. User Experience

- Use descriptive labels and placeholders
- Don't make address verification required if not necessary
- Allow users to edit verified addresses
- Provide clear error messages

### 3. Performance

- The component uses debouncing to minimize API calls
- Suggestions are cached during the session
- Only verified addresses trigger geocoding

## Troubleshooting

### Suggestions Not Appearing

1. Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set correctly
2. Verify the API key has Places API enabled
3. Check browser console for errors
4. Ensure API key restrictions allow your domain

### "Failed to load Google Maps API" Error

1. Check your internet connection
2. Verify the API key is valid
3. Check Google Cloud Console for API quota/billing issues
4. Ensure Places API and Maps JavaScript API are enabled

### Addresses Not Verifying

1. Try selecting from the suggestion list instead of typing manually
2. Check that the address exists in Google Maps
3. Verify Geocoding API is enabled (if using geocoding features)

## Cost Considerations

Google Maps Platform has usage-based pricing:

- **Autocomplete (per session)**: ~$2.83 per 1,000 sessions
- **Place Details**: ~$17 per 1,000 requests
- **Free tier**: $200 credit per month

A "session" starts when the user begins typing and ends when they select an address.

### Cost Optimization Tips

1. Implement session tokens (already done in the component)
2. Cache verified addresses
3. Set up billing alerts
4. Monitor usage in Google Cloud Console

## Testing

### Manual Testing

1. Type a partial address (e.g., "123 Main")
2. Verify suggestions appear
3. Select a suggestion
4. Confirm green checkmark appears
5. Check that formatted address is displayed

### Without API Key

1. Remove or comment out `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. Restart dev server
3. Verify component works as standard input
4. Check console for warning message

## Future Enhancements

Potential improvements for the address verification system:

1. **Offline support**: Cache recently used addresses
2. **Custom validation**: Add business rules for address formats
3. **Map preview**: Show selected location on a map
4. **Address components**: Extract street, city, state, zip separately
5. **International support**: Better handling of non-US addresses
6. **Accessibility**: Enhanced screen reader support

## Support

For issues or questions:

1. Check this documentation
2. Review Google Maps Platform documentation
3. Check browser console for error messages
4. Verify API key configuration

## Related Files

- `/src/components/ui/AddressInput.tsx` - Main component
- `/src/lib/googleMaps.ts` - API loader utility
- `/src/components/GoogleMapsProvider.tsx` - Provider component (optional)
- `/guides/ADDRESS_VERIFICATION_SETUP.md` - This file

## Version History

- **v1.0** (2025-01-22): Initial implementation with Google Places API integration
