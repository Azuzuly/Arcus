import { NextRequest, NextResponse } from 'next/server';

interface GeocodeItem {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

const weatherCodeMap: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear', icon: '☀️' },
  1: { label: 'Mostly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Cloudy', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy drizzle', icon: '🌧️' },
  61: { label: 'Light rain', icon: '🌦️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '🌨️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  80: { label: 'Rain showers', icon: '🌦️' },
  81: { label: 'Showers', icon: '🌧️' },
  82: { label: 'Heavy showers', icon: '⛈️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm hail', icon: '⛈️' },
  99: { label: 'Severe thunderstorm', icon: '⛈️' },
};

function cToF(value: number): number {
  return Math.round((value * 9) / 5 + 32);
}

function describeWeather(code: number) {
  return weatherCodeMap[code] || { label: 'Unknown', icon: '🌡️' };
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

async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeItem | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
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
    const latitude = typeof body?.latitude === 'number' ? body.latitude : Number(body?.latitude);
    const longitude = typeof body?.longitude === 'number' ? body.longitude : Number(body?.longitude);
    const query = typeof body?.query === 'string' ? body.query.trim() : '';

    let place: GeocodeItem | null = null;

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      place = await reverseGeocode(latitude, longitude);
      if (!place) {
        place = {
          name: 'Your area',
          latitude,
          longitude,
        };
      }
    } else if (query) {
      place = await geocodeLocation(query);
    }

    if (!place) {
      return NextResponse.json({ error: 'Could not resolve a weather location.' }, { status: 404 });
    }

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.searchParams.set('latitude', String(place.latitude));
    forecastUrl.searchParams.set('longitude', String(place.longitude));
    forecastUrl.searchParams.set('timezone', 'auto');
    forecastUrl.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code');
    forecastUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min');
    forecastUrl.searchParams.set('forecast_days', '5');

    const response = await fetch(forecastUrl, { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: 'Could not load forecast data.' }, { status: 502 });
    }

    const forecast = await response.json();
    const currentCode = Number(forecast?.current?.weather_code || 0);
    const currentTempC = Math.round(Number(forecast?.current?.temperature_2m || 0));
    const apparentTempC = Math.round(Number(forecast?.current?.apparent_temperature || currentTempC));

    const daily = Array.isArray(forecast?.daily?.time)
      ? forecast.daily.time.map((date: string, index: number) => {
          const descriptor = describeWeather(Number(forecast.daily.weather_code?.[index] || 0));
          const dateObj = new Date(date);
          const label = index === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const maxC = Math.round(Number(forecast.daily.temperature_2m_max?.[index] || 0));
          const minC = Math.round(Number(forecast.daily.temperature_2m_min?.[index] || 0));
          return {
            label,
            condition: descriptor.label,
            icon: descriptor.icon,
            maxC,
            minC,
            maxF: cToF(maxC),
            minF: cToF(minC),
          };
        })
      : [];

    const location = place.name === 'Your area'
      ? 'Your area'
      : [place.name, place.admin1, place.country].filter(Boolean).join(', ');
    const descriptor = describeWeather(currentCode);
    const timezone = typeof forecast?.timezone === 'string' ? forecast.timezone : place.timezone;
    const localTime = timezone
      ? new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        weekday: 'short',
      }).format(new Date())
      : undefined;

    return NextResponse.json({
      location,
      condition: descriptor.label,
      icon: descriptor.icon,
      temperatureC: currentTempC,
      temperatureF: cToF(currentTempC),
      apparentTemperatureC: apparentTempC,
      localTime,
      locationSource: Number.isFinite(latitude) && Number.isFinite(longitude) ? 'device' : 'query',
      apparentTemperatureF: cToF(apparentTempC),
      daily,
      sourceLabel: 'Open-Meteo',
    });
  } catch {
    return NextResponse.json({ error: 'Weather lookup failed.' }, { status: 500 });
  }
}