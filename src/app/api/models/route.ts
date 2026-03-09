import { NextResponse } from 'next/server';

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { models: [], error: 'OPENROUTER_API_KEY is not configured.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Arcus',
      },
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { models: [], error: payload?.error?.message || payload?.error || 'Could not load OpenRouter models.' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { models: Array.isArray(payload?.data) ? payload.data : [] },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { models: [], error: 'Could not load OpenRouter models.' },
      { status: 500 }
    );
  }
}
