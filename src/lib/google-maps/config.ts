/**
 * Google Maps API Configuration
 * 
 * To use Google Maps features:
 * 1. Get an API key from Google Cloud Console
 * 2. Enable the following APIs:
 *    - Maps JavaScript API
 *    - Places API
 *    - Geocoding API
 * 3. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
 */

export const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  libraries: ['places'] as const,
  version: 'weekly',
};

export const GOOGLE_MAPS_OPTIONS = {
  // Autocomplete options
  autocompleteOptions: {
    types: ['(cities)'], // Restrict to cities only
    fields: ['address_components', 'geometry', 'formatted_address', 'name'],
  },
  
  // Geocoding options
  geocodingOptions: {
    language: 'en',
    region: 'US', // Bias results to US, but allow worldwide
  },
  
  // Distance calculation options
  distanceOptions: {
    unit: 'miles' as const, // or 'kilometers'
    maxDistance: 100, // Maximum distance for "nearby" searches
  },
};

/**
 * Check if Google Maps API key is configured
 */
export function isGoogleMapsConfigured(): boolean {
  return !!GOOGLE_MAPS_CONFIG.apiKey && GOOGLE_MAPS_CONFIG.apiKey.length > 0;
}

/**
 * Load Google Maps script dynamically
 */
export function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'));
      return;
    }

    // Check if already loaded
    if (window.google?.maps) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => 
        reject(new Error('Failed to load Google Maps script'))
      );
      return;
    }

    if (!GOOGLE_MAPS_CONFIG.apiKey) {
      reject(new Error('Google Maps API key is not configured'));
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=${GOOGLE_MAPS_CONFIG.libraries.join(',')}&v=${GOOGLE_MAPS_CONFIG.version}`;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => 
      reject(new Error('Failed to load Google Maps script'))
    );

    document.head.appendChild(script);
  });
}

// Type definitions are in types.ts
