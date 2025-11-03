'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { loadGoogleMapsScript, isGoogleMapsConfigured, GOOGLE_MAPS_OPTIONS } from '@/lib/google-maps/config';
import type { LocationData, PlaceResult } from '@/lib/google-maps/types';

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: string, locationData?: LocationData) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Enter city or location...',
  disabled = false,
  className = '',
  label,
  error,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState<string | null>(null);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);

  useEffect(() => {
    // Check if Google Maps is configured
    if (!isGoogleMapsConfigured()) {
      setGoogleMapsError('Google Maps API key not configured. Using manual input.');
      return;
    }

    // Load Google Maps script
    const initializeAutocomplete = async () => {
      setLoading(true);
      try {
        await loadGoogleMapsScript();
        setIsGoogleMapsReady(true);
        setGoogleMapsError(null);
      } catch (err) {
        console.error('Failed to load Google Maps:', err);
        setGoogleMapsError('Failed to load location services. Using manual input.');
      } finally {
        setLoading(false);
      }
    };

    initializeAutocomplete();
  }, []);

  useEffect(() => {
    if (!isGoogleMapsReady || !inputRef.current || autocompleteRef.current) {
      return;
    }

    try {
      // Initialize autocomplete
      const autocomplete = new window.google!.maps.places.Autocomplete(
        inputRef.current,
        GOOGLE_MAPS_OPTIONS.autocompleteOptions
      );

      autocompleteRef.current = autocomplete;

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        const place: PlaceResult = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          // User entered a place that was not suggested
          onChange(inputRef.current?.value || '');
          return;
        }

        // Extract location data
        const locationData = extractLocationData(place);
        onChange(locationData.formatted_address, locationData);
      });
    } catch (err) {
      console.error('Error initializing autocomplete:', err);
      setGoogleMapsError('Error initializing location services.');
    }

    // Cleanup
    return () => {
      autocompleteRef.current = null;
    };
  }, [isGoogleMapsReady, onChange]);

  const extractLocationData = (place: PlaceResult): LocationData => {
    const components = place.address_components || [];
    
    let city = '';
    let state = '';
    let country = '';

    components.forEach((component) => {
      const types = component.types;
      
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      } else if (types.includes('country')) {
        country = component.short_name;
      }
    });

    const coordinates = {
      lat: place.geometry?.location.lat() || 0,
      lng: place.geometry?.location.lng() || 0,
    };

    // Format address as "City, State" or use formatted_address
    let formatted_address = place.formatted_address || '';
    if (city && state) {
      formatted_address = `${city}, ${state}`;
    } else if (city) {
      formatted_address = city;
    }

    return {
      formatted_address,
      city,
      state,
      country,
      coordinates,
    };
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neu-text-primary/70">
          <MapPin className="inline w-4 h-4 mr-1" />
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleManualChange}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={`w-full px-4 py-2 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border ${
            error ? 'border-red-500' : 'border-neu-border'
          } text-neu-text-primary placeholder-neu-text-primary/50 focus:outline-none focus:ring-2 focus:ring-neu-accent-primary/50 disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-neu-text-primary/50" />
          </div>
        )}
      </div>

      {googleMapsError && (
        <div className="flex items-start gap-2 text-xs text-yellow-500/80">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{googleMapsError}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isGoogleMapsReady && !googleMapsError && (
        <p className="text-xs text-neu-text-primary/50">
          Start typing to see location suggestions
        </p>
      )}
    </div>
  );
}
