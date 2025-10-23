'use client';

import { useEffect, useState } from 'react';
import { loadGoogleMapsAPI } from '@/lib/googleMaps';

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('Google Maps API key not found. Address verification will be disabled.');
      setIsLoaded(true); // Allow app to continue without Maps
      return;
    }

    loadGoogleMapsAPI(apiKey)
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load Google Maps API:', err);
        setError('Failed to load address verification service');
        setIsLoaded(true); // Allow app to continue
      });
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2332] to-[#0f1419]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5a8ff5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neu-text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
