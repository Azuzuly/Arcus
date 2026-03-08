import { NextRequest, NextResponse } from 'next/server';
import { performWebSearch } from '@/lib/webSearch';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const mode = body?.mode === 'deep' ? 'deep' : 'standard';

    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const payload = await performWebSearch(query, mode);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search request failed.' },
      { status: 500 }
    );
  }
}
