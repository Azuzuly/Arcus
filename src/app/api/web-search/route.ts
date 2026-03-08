import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function sanitizePlainText(value: string | undefined): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isTopicItem(value: unknown): value is {
  Text?: string;
  FirstURL?: string;
  Result?: string;
  Name?: string;
  Topics?: unknown[];
} {
  return Boolean(value) && typeof value === 'object';
}

function collectTopics(items: unknown[], results: SearchResult[] = []): SearchResult[] {
  for (const item of items) {
    if (!isTopicItem(item)) continue;
    const topic = item;

    if (Array.isArray(topic.Topics)) {
      collectTopics(topic.Topics, results);
      continue;
    }

    const title = sanitizePlainText(topic.Text?.split(' - ')[0] || topic.Name || 'Result');
    const snippet = sanitizePlainText(topic.Text || topic.Result || '');
    const url = topic.FirstURL || '';
    if (snippet && url) {
      results.push({ title, url, snippet });
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const deepResearch = Boolean(body?.deepResearch);

    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const searchUrl = new URL('https://api.duckduckgo.com/');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('no_html', '1');
    searchUrl.searchParams.set('skip_disambig', '0');
    searchUrl.searchParams.set('no_redirect', '1');

    const response = await fetch(searchUrl.toString(), {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Search provider unavailable.' }, { status: 502 });
    }

    const data = await response.json() as {
      Heading?: string;
      AbstractText?: string;
      AbstractURL?: string;
      RelatedTopics?: unknown[];
      Results?: Array<{ Text?: string; FirstURL?: string }>;
    };

    const results: SearchResult[] = [];

    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: sanitizePlainText(data.Heading || query),
        url: data.AbstractURL,
        snippet: sanitizePlainText(data.AbstractText),
      });
    }

    if (Array.isArray(data.Results)) {
      for (const item of data.Results) {
        if (item.Text && item.FirstURL) {
          results.push({
            title: sanitizePlainText(item.Text.split(' - ')[0]),
            url: item.FirstURL,
            snippet: sanitizePlainText(item.Text),
          });
        }
      }
    }

    if (Array.isArray(data.RelatedTopics)) {
      collectTopics(data.RelatedTopics, results);
    }

    const seenUrls = new Set<string>();
    const uniqueResults = results.filter(item => {
      if (!item.snippet || seenUrls.has(item.url)) return false;
      seenUrls.add(item.url);
      return true;
    });

    return NextResponse.json({
      query,
      results: uniqueResults.slice(0, deepResearch ? 8 : 4),
    });
  } catch {
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
