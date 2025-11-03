/**
 * Google Maps TypeScript type definitions
 * These are simplified types for the features we use
 */

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  formatted_address: string;
  city: string;
  state: string;
  country: string;
  coordinates: LocationCoordinates;
}

export interface PlaceResult {
  formatted_address?: string;
  name?: string;
  geometry?: {
    location: {
      lat(): number;
      lng(): number;
    };
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface AutocompleteOptions {
  types?: string[];
  fields?: string[];
  componentRestrictions?: {
    country?: string | string[];
  };
}

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: AutocompleteOptions
          ) => GoogleAutocomplete;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            INVALID_REQUEST: string;
            OVER_QUERY_LIMIT: string;
            REQUEST_DENIED: string;
            UNKNOWN_ERROR: string;
          };
        };
        Geocoder: new () => GoogleGeocoder;
        GeocoderStatus: {
          OK: string;
          ZERO_RESULTS: string;
          OVER_QUERY_LIMIT: string;
          REQUEST_DENIED: string;
          INVALID_REQUEST: string;
          UNKNOWN_ERROR: string;
        };
        LatLng: new (lat: number, lng: number) => GoogleLatLng;
      };
    };
  }
}

export interface GoogleAutocomplete {
  addListener(event: string, handler: () => void): void;
  getPlace(): PlaceResult;
  setBounds(bounds: any): void;
  setComponentRestrictions(restrictions: { country: string | string[] }): void;
  setTypes(types: string[]): void;
}

export interface GoogleGeocoder {
  geocode(
    request: { address?: string; location?: LocationCoordinates },
    callback: (
      results: PlaceResult[] | null,
      status: string
    ) => void
  ): void;
}

export interface GoogleLatLng {
  lat(): number;
  lng(): number;
}
