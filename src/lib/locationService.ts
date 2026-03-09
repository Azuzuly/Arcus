/**
 * Location Service — browser geolocation + reverse geocode for Arcus.
 *
 * Exposes helpers that:
 *  1. Request geolocation permission from the browser.
 *  2. Reverse-geocode coordinates to a city name.
 *  3. Detect whether a user prompt is location-dependent.
 */

'use client';

/** Request current device GPS coordinates (prompts user for permission). */
export async function requestLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof window === 'undefined' || !window.isSecureContext || !('geolocation' in navigator)) return null;

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 },
    );
  });
}

/** Reverse-geocode coordinates to a human-readable city / region string. */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=10&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address;
    if (!addr) return null;
    const city = addr.city || addr.town || addr.village || addr.county || '';
    const state = addr.state || '';
    const country = addr.country || '';
    return [city, state, country].filter(Boolean).join(', ');
  } catch {
    return null;
  }
}

/** Returns true if the prompt appears to need the user's location. */
export function promptNeedsLocation(prompt: string): boolean {
  return /(weather|forecast|temperature|near me|nearby|close to me|in my area|local|around here|directions to|navigate|restaurants near|stores near|what time is it$)/i.test(prompt);
}

/** Build a system-prompt snippet injecting the user's location context. */
export function locationContextSnippet(cityName: string, coords: { latitude: number; longitude: number }): string {
  return `The user's current location is ${cityName} (lat ${coords.latitude.toFixed(4)}, lon ${coords.longitude.toFixed(4)}). Use this for any location-dependent answers.`;
}
