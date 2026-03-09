import { NextRequest, NextResponse } from 'next/server';

function normalizeQuery(query: string): string {
  return query
    .replace(/^(who is|who's|tell me about|give me info on)\s+/i, '')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawQuery = typeof body?.query === 'string' ? body.query.trim() : '';
    const query = normalizeQuery(rawQuery);

    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
    searchUrl.searchParams.set('action', 'query');
    searchUrl.searchParams.set('list', 'search');
    searchUrl.searchParams.set('srsearch', query);
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('utf8', '1');

    const searchResponse = await fetch(searchUrl, { cache: 'no-store' });
    if (!searchResponse.ok) {
      return NextResponse.json({ error: 'Could not search for a profile.' }, { status: 502 });
    }

    const searchPayload = await searchResponse.json();
    const first = Array.isArray(searchPayload?.query?.search) ? searchPayload.query.search[0] : null;
    const title = first?.title || query;

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(String(title).replace(/\s+/g, '_'))}`;
    const summaryResponse = await fetch(summaryUrl, { cache: 'no-store', headers: { accept: 'application/json' } });

    if (!summaryResponse.ok) {
      return NextResponse.json({ error: 'Could not load profile summary.' }, { status: 404 });
    }

    const summary = await summaryResponse.json();

    return NextResponse.json({
      name: summary?.title || title,
      subtitle: summary?.description || '',
      summary: summary?.extract || '',
      imageUrl: summary?.thumbnail?.source || undefined,
      sourceUrl: summary?.content_urls?.desktop?.page || summary?.content_urls?.mobile?.page || undefined,
      sourceLabel: 'Wikipedia',
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Profile lookup failed.' }, { status: 500 });
  }
}