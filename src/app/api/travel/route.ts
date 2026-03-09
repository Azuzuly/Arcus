import { NextRequest, NextResponse } from 'next/server';

interface GeocodeItem {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

function normalizeQuery(query: string): string {
  return query
    .replace(/^(what time is it in|time in|local time in|timezone in|travel to|map of|where is)\s+/i, '')
    .replace(/[?.!]+$/g, '')
    .trim();
}

async function geocodeLocation(query: string): Promise<GeocodeItem | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) return null;
  const payload = await response.json();
  return Array.isArray(payload?.results) ? payload.results[0] || null : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawQuery = typeof body?.query === 'string' ? body.query.trim() : '';
    const query = normalizeQuery(rawQuery);
    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const place = await geocodeLocation(query);
    if (!place) {
      return NextResponse.json({ error: 'Could not resolve that location.' }, { status: 404 });
    }

    const timezone = place.timezone || 'UTC';
    const localTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    }).format(new Date());

    return NextResponse.json({
      location: place.name,
      region: place.admin1,
      country: place.country,
      timezone,
      localTime,
      coordinates: `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`,
      mapImageUrl: `https://staticmap.openstreetmap.de/staticmap.php?center=${place.latitude},${place.longitude}&zoom=9&size=700x420&markers=${place.latitude},${place.longitude},red-pushpin`,
      summary: `${place.name}${place.admin1 ? `, ${place.admin1}` : ''}${place.country ? `, ${place.country}` : ''} is currently in ${timezone}.`,
      sourceLabel: 'Open-Meteo + OpenStreetMap',
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Travel lookup failed.' }, { status: 500 });
  }
}
