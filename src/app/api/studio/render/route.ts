import { NextRequest, NextResponse } from 'next/server';
import { buildPollinationsImageUrl, getPollinationsModelFallbacks, normalizePollinationsDimensions } from '@/lib/pollinations';

const REQUEST_TIMEOUT_MS = 30000;

async function tryModel(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'image/*' },
      cache: 'no-store',
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.startsWith('image/')) {
      return null;
    }

    return response;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const prompt = request.nextUrl.searchParams.get('prompt')?.trim() || '';
  const model = request.nextUrl.searchParams.get('model')?.trim() || 'flux';
  const seed = request.nextUrl.searchParams.get('seed')?.trim() || '';
  const negativePrompt = request.nextUrl.searchParams.get('negativePrompt')?.trim() || '';
  const width = Number(request.nextUrl.searchParams.get('width') || 1024);
  const height = Number(request.nextUrl.searchParams.get('height') || 1024);

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  const normalizedPrompt = prompt.slice(0, 2000);
  const dimensions = normalizePollinationsDimensions(width, height);
  const models = getPollinationsModelFallbacks(model);

  for (const candidate of models) {
    const upstreamUrl = buildPollinationsImageUrl({
      prompt: normalizedPrompt,
      model: candidate,
      width: dimensions.width,
      height: dimensions.height,
      seed,
      negativePrompt: negativePrompt || undefined,
    });

    const response = await tryModel(upstreamUrl);
    if (!response) continue;

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Arcus-Image-Model': candidate,
      },
    });
  }

  return NextResponse.json(
    { error: 'All Arcus Studio render attempts failed. Please retry in a moment.' },
    { status: 502 },
  );
}
