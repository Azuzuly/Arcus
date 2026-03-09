/**
 * Location Service — Geolocation API wrapper
 * Requests permission and provides location data for weather/local queries.
 * The AI waits for location permission before responding to location-dependent queries.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  region?: string;
  country?: string;
  displayName?: string;
}

export interface LocationState {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
}

/* ------------------------------------------------------------------ */
/*  LOCATION KEYWORDS — detect when a query needs location             */
/* ------------------------------------------------------------------ */

const LOCATION_PATTERNS = [
  /\b(weather|forecast|temperature|rain|snow|wind|humidity|sunrise|sunset)\b/i,
  /\b(near me|nearby|around me|close to me|in my area|my location|local|closest|nearest)\b/i,
  /\b(restaurants?|cafes?|stores?|shops?|hospitals?|pharmacies?|gas stations?|parking)\s*(near|around|close|by)\b/i,
  /\b(directions?|navigate|route|how (to|do I) get to|distance to|travel time)\b/i,
  /\b(time zone|local time|what time is it)\b/i,
  /\b(air quality|pollution|pollen|uv index|aqi)\b/i,
  /\b(traffic|commute|road conditions)\b/i,
];

/**
 * Check if a prompt likely needs location data.
 */
export function promptNeedsLocation(prompt: string): boolean {
  return LOCATION_PATTERNS.some(pattern => pattern.test(prompt));
}

/**
 * Request location permission explicitly.
 */
export async function requestLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    if (navigator.permissions) {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state as 'granted' | 'denied' | 'prompt';
    }
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

/**
 * Get current position as a promise.
 */
export function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000, // Cache for 5 minutes
      ...options,
    });
  });
}

/**
 * Reverse geocode coordinates to a human-readable location name.
 * Uses the free OpenStreetMap Nominatim API.
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ city?: string; region?: string; country?: string; displayName?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        headers: { 'User-Agent': 'Arcus-AI-Assistant' },
      }
    );

    if (!response.ok) return {};

    const data = await response.json();
    const address = data.address || {};

    return {
      city: address.city || address.town || address.village || address.hamlet,
      region: address.state || address.county,
      country: address.country,
      displayName: [
        address.city || address.town || address.village,
        address.state,
        address.country,
      ]
        .filter(Boolean)
        .join(', '),
    };
  } catch {
    return {};
  }
}

/**
 * React hook for location services.
 */
export function useLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: false,
    error: null,
    permissionState: 'unknown',
  });

  const cachedLocationRef = useRef<LocationData | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Check permission state on mount
  useEffect(() => {
    requestLocationPermission().then(permission => {
      setState(prev => ({ ...prev, permissionState: permission }));
    });
  }, []);

  /**
   * Request location. Will trigger browser permission prompt if needed.
   * Returns the location data or null on failure.
   */
  const requestLocation = useCallback(async (): Promise<LocationData | null> => {
    // Return cached if recent (within 5 minutes)
    const now = Date.now();
    if (cachedLocationRef.current && now - lastFetchRef.current < 300000) {
      return cachedLocationRef.current;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude, accuracy } = position.coords;

      // Reverse geocode to get city name
      const geo = await reverseGeocode(latitude, longitude);

      const locationData: LocationData = {
        latitude,
        longitude,
        accuracy,
        ...geo,
      };

      cachedLocationRef.current = locationData;
      lastFetchRef.current = Date.now();

      setState({
        location: locationData,
        isLoading: false,
        error: null,
        permissionState: 'granted',
      });

      return locationData;
    } catch (err: any) {
      const errorMessages: Record<number, string> = {
        1: 'Location permission denied. Please allow location access in your browser settings.',
        2: 'Location unavailable. Check your device settings.',
        3: 'Location request timed out. Try again.',
      };

      const errMsg = errorMessages[err?.code] || 'Failed to get location.';
      const permState = err?.code === 1 ? 'denied' : state.permissionState;

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errMsg,
        permissionState: permState as any,
      }));

      return null;
    }
  }, [state.permissionState]);

  /**
   * Build a location context string to inject into the AI prompt.
   */
  const getLocationContext = useCallback((): string => {
    const loc = cachedLocationRef.current || state.location;
    if (!loc) return '';

    const parts = [
      `User's location: ${loc.displayName || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`}`,
    ];
    if (loc.city) parts.push(`City: ${loc.city}`);
    if (loc.region) parts.push(`Region: ${loc.region}`);
    if (loc.country) parts.push(`Country: ${loc.country}`);
    parts.push(`Coordinates: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);

    return parts.join('\n');
  }, [state.location]);

  return {
    ...state,
    requestLocation,
    getLocationContext,
    hasLocation: !!state.location || !!cachedLocationRef.current,
  };
}

/**
 * Inject location context into the system prompt for location-aware queries.
 */
export function buildLocationSystemPrompt(location: LocationData): string {
  return `[LOCATION CONTEXT]
The user has shared their location. Use this for accurate, location-specific answers.
- Location: ${location.displayName || 'Unknown'}
- City: ${location.city || 'Unknown'}
- Region: ${location.region || 'Unknown'}
- Country: ${location.country || 'Unknown'}
- Coordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}

Provide location-specific information when relevant (weather, local businesses, time zones, etc.).
Always mention the detected location in your response so the user knows you're using their location data.`;
}
