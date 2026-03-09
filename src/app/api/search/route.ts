import { NextRequest, NextResponse } from 'next/server';
import { performWebSearch } from '@/lib/webSearch';
import { sanitizeSearchQuery, ValidationError } from '@/lib/inputValidation';

export async function POST(request: NextRequest) {
  // Enforce request body size limit (64 KB)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 65_536) {
    return NextResponse.json(
      { error: 'Request body too large.' },
      { status: 413 }
    );
  }

  try {
    const body = await request.json();
    const query = sanitizeSearchQuery(body?.query);
    const mode = body?.mode === 'deep' ? 'deep' : 'standard';

    const payload = await performWebSearch(query, mode);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Search request failed.',
      },
      { status: 500 }
    );
  }
}
