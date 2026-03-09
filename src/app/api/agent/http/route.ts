import { NextRequest, NextResponse } from 'next/server';

function extractHtmlTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, ' ').trim() || undefined;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    const method = typeof body?.method === 'string' ? body.method.toUpperCase() : 'GET';
    const extract = body?.extract === 'text' ? 'text' : 'raw';

    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: 'A valid http(s) URL is required.' }, { status: 400 });
    }

    const requestHeaders: Record<string, string> = {};
    if (body?.headers && typeof body.headers === 'object' && !Array.isArray(body.headers)) {
      for (const [key, value] of Object.entries(body.headers as Record<string, unknown>)) {
        if (value !== undefined && value !== null) {
          requestHeaders[key] = String(value);
        }
      }
    }

    let requestBody: BodyInit | undefined;
    const rawBody = body?.body;
    if (rawBody !== undefined && rawBody !== null && method !== 'GET' && method !== 'HEAD') {
      if (typeof rawBody === 'string') {
        requestBody = rawBody;
      } else {
        requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
        requestBody = JSON.stringify(rawBody);
      }
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      cache: 'no-store',
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    let parsedBody: unknown = text;
    if (/application\/json/i.test(contentType)) {
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = text;
      }
    }

    const payload = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      contentType,
      headers: Object.fromEntries(response.headers.entries()),
      body: parsedBody,
      text: extract === 'text' ? stripHtml(text).slice(0, 12000) : undefined,
      title: extract === 'text' ? extractHtmlTitle(text) : undefined,
    };

    return NextResponse.json(payload, { status: response.ok ? 200 : response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Agent HTTP request failed.' },
      { status: 500 }
    );
  }
}
