/**
 * Google Maps API Loader
 * Loads the Google Maps JavaScript API with Places library
 */

let isLoading = false;
let isLoaded = false;

export function loadGoogleMapsAPI(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (isLoaded && (window as any).google?.maps?.places) {
      resolve();
      return;
    }

    // Currently loading
    if (isLoading) {
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          clearInterval(checkInterval);
          isLoaded = true;
          resolve();
        }
      }, 100);
      return;
    }

    // Start loading
    isLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoading = false;
      isLoaded = true;
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });
}

export function isGoogleMapsLoaded(): boolean {
  return isLoaded && !!(window as any).google?.maps?.places;
}
