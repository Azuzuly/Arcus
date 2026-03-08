export interface SearchResultItem {
  title: string;
  url: string;
  content: string;
  score?: number;
  favicon?: string;
}

export interface SearchResponsePayload {
  provider: 'tavily' | 'google' | 'duckduckgo';
  answer?: string;
  results: SearchResultItem[];
}

function normalizeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

async function searchWithTavily(query: string, mode: 'standard' | 'deep'): Promise<SearchResponsePayload> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('Tavily API key is missing');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: mode === 'deep' ? 'advanced' : 'basic',
      topic: /(news|latest|breaking|today|week)/i.test(query) ? 'news' : 'general',
      include_answer: mode === 'deep' ? 'advanced' : 'basic',
      include_favicon: true,
      max_results: mode === 'deep' ? 8 : 5,
      include_raw_content: false,
      auto_parameters: true,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed (${response.status})`);
  }

  const payload = await response.json();
  return {
    provider: 'tavily',
    answer: normalizeText(payload.answer),
    results: Array.isArray(payload.results)
      ? payload.results.map((result: Record<string, unknown>) => ({
          title: normalizeText(result.title, 'Untitled result'),
          url: normalizeText(result.url),
          content: normalizeText(result.content),
          score: typeof result.score === 'number' ? result.score : undefined,
          favicon: normalizeText(result.favicon),
        }))
      : [],
  };
}

async function searchWithGoogle(query: string): Promise<SearchResponsePayload> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !engineId) {
    throw new Error('Google search is not configured');
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', engineId);
  url.searchParams.set('q', query);
  url.searchParams.set('num', '5');

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Google search failed (${response.status})`);
  }

  const payload = await response.json();
  return {
    provider: 'google',
    results: Array.isArray(payload.items)
      ? payload.items.map((item: Record<string, unknown>) => ({
          title: normalizeText(item.title, 'Untitled result'),
          url: normalizeText(item.link),
          content: normalizeText(item.snippet),
        }))
      : [],
  };
}

async function searchWithDuckDuckGo(query: string): Promise<SearchResponsePayload> {
  const url = new URL('https://api.duckduckgo.com/');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('no_html', '1');
  url.searchParams.set('skip_disambig', '1');

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed (${response.status})`);
  }

  const payload = await response.json();
  const related = Array.isArray(payload.RelatedTopics) ? payload.RelatedTopics : [];
  const results = related.flatMap((topic: Record<string, unknown>) => {
    if (topic.FirstURL && topic.Text) {
      return [{
        title: normalizeText(topic.Text).split(' - ')[0],
        url: normalizeText(topic.FirstURL),
        content: normalizeText(topic.Text),
      }];
    }
    if (Array.isArray(topic.Topics)) {
      return topic.Topics.map((nested: Record<string, unknown>) => ({
        title: normalizeText(nested.Text).split(' - ')[0],
        url: normalizeText(nested.FirstURL),
        content: normalizeText(nested.Text),
      }));
    }
    return [];
  }).slice(0, 5);

  return {
    provider: 'duckduckgo',
    answer: normalizeText(payload.AbstractText),
    results,
  };
}

export async function performWebSearch(query: string, mode: 'standard' | 'deep' = 'standard'): Promise<SearchResponsePayload> {
  try {
    return await searchWithTavily(query, mode);
  } catch {
    try {
      return await searchWithGoogle(query);
    } catch {
      return searchWithDuckDuckGo(query);
    }
  }
}
