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

const CURRENT_YEAR = new Date().getFullYear();
const PREVIOUS_YEAR = CURRENT_YEAR - 1;

function isFreshnessSensitiveQuery(query: string): boolean {
  return /(latest|current|today|recent|breaking|update|updates|news|release|released|roadmap|announced|happening|202\d)/i.test(query);
}

function buildSearchQuery(query: string): string {
  if (!isFreshnessSensitiveQuery(query)) return query;

  const yearHint = `${CURRENT_YEAR}`;
  const queryHasYear = new RegExp(`${CURRENT_YEAR}|${PREVIOUS_YEAR}`).test(query);
  const freshnessHint = /(news|update|updates|latest|current)/i.test(query) ? '' : ' latest updates news';
  return `${query}${queryHasYear ? '' : ` ${yearHint}`}${freshnessHint}`.trim();
}

function dedupeResults(results: SearchResultItem[]): SearchResultItem[] {
  return Array.from(new Map(results.filter(result => result.url).map(result => [result.url, result])).values());
}

function scoreRecency(result: SearchResultItem): number {
  const text = `${result.title} ${result.url} ${result.content}`;
  if (new RegExp(`${CURRENT_YEAR}`).test(text)) return 24;
  if (new RegExp(`${PREVIOUS_YEAR}`).test(text)) return 12;
  return 0;
}

function rerankResults(query: string, results: SearchResultItem[]): SearchResultItem[] {
  const freshnessSensitive = isFreshnessSensitiveQuery(query);
  const terms = query.toLowerCase().split(/\W+/).filter(term => term.length > 2);

  return dedupeResults(results).sort((left, right) => {
    const leftText = `${left.title} ${left.content} ${left.url}`.toLowerCase();
    const rightText = `${right.title} ${right.content} ${right.url}`.toLowerCase();
    const leftMatches = terms.reduce((score, term) => score + (leftText.includes(term) ? 4 : 0), 0);
    const rightMatches = terms.reduce((score, term) => score + (rightText.includes(term) ? 4 : 0), 0);
    const leftScore = (left.score || 0) + leftMatches + (freshnessSensitive ? scoreRecency(left) : 0);
    const rightScore = (right.score || 0) + rightMatches + (freshnessSensitive ? scoreRecency(right) : 0);
    return rightScore - leftScore;
  });
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
      topic: /(news|latest|breaking|today|week|update|updates|release|announced)/i.test(query) ? 'news' : 'general',
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
    results: rerankResults(query, Array.isArray(payload.results)
      ? payload.results.map((result: Record<string, unknown>) => ({
          title: normalizeText(result.title, 'Untitled result'),
          url: normalizeText(result.url),
          content: normalizeText(result.content),
          score: typeof result.score === 'number' ? result.score : undefined,
          favicon: normalizeText(result.favicon),
        }))
      : []),
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
  if (isFreshnessSensitiveQuery(query)) {
    url.searchParams.set('dateRestrict', 'm6');
  }

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Google search failed (${response.status})`);
  }

  const payload = await response.json();
  return {
    provider: 'google',
    results: rerankResults(query, Array.isArray(payload.items)
      ? payload.items.map((item: Record<string, unknown>) => ({
          title: normalizeText(item.title, 'Untitled result'),
          url: normalizeText(item.link),
          content: normalizeText(item.snippet),
        }))
      : []),
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
    results: rerankResults(query, results),
  };
}

export async function performWebSearch(query: string, mode: 'standard' | 'deep' = 'standard'): Promise<SearchResponsePayload> {
  const effectiveQuery = buildSearchQuery(query);

  try {
    return await searchWithTavily(effectiveQuery, mode);
  } catch {
    try {
      return await searchWithGoogle(effectiveQuery);
    } catch {
      return searchWithDuckDuckGo(effectiveQuery);
    }
  }
}
