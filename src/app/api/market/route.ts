import { NextRequest, NextResponse } from 'next/server';

interface YahooSearchQuote {
  symbol?: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
}

interface YahooQuoteSnapshot {
  symbol?: string;
  quoteType?: string;
  longName?: string;
  shortName?: string;
  fullExchangeName?: string;
  marketCap?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
  averageDailyVolume10Day?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  financialCurrency?: string;
}

const CRYPTO_ALIASES: Record<string, { symbol: string; name: string }> = {
  bitcoin: { symbol: 'BTC-USD', name: 'Bitcoin' },
  btc: { symbol: 'BTC-USD', name: 'Bitcoin' },
  ethereum: { symbol: 'ETH-USD', name: 'Ethereum' },
  eth: { symbol: 'ETH-USD', name: 'Ethereum' },
  solana: { symbol: 'SOL-USD', name: 'Solana' },
  sol: { symbol: 'SOL-USD', name: 'Solana' },
  dogecoin: { symbol: 'DOGE-USD', name: 'Dogecoin' },
  doge: { symbol: 'DOGE-USD', name: 'Dogecoin' },
  xrp: { symbol: 'XRP-USD', name: 'XRP' },
  cardano: { symbol: 'ADA-USD', name: 'Cardano' },
  ada: { symbol: 'ADA-USD', name: 'Cardano' },
};

function normalizeQuery(query: string): string {
  return query
    .replace(/\b(?:stock|stocks|crypto|price|share price|ticker|market cap|quote|for|of|today|current|live)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPreferredType(query: string): 'CRYPTOCURRENCY' | 'EQUITY' | null {
  if (/(crypto|bitcoin|ethereum|solana|dogecoin|btc|eth|xrp|ada)/i.test(query)) return 'CRYPTOCURRENCY';
  if (/(stock|share|ticker|nasdaq|nyse|company)/i.test(query)) return 'EQUITY';
  return null;
}

function getCryptoAlias(query: string): { symbol: string; name: string } | null {
  const normalized = query.toLowerCase();
  for (const [alias, value] of Object.entries(CRYPTO_ALIASES)) {
    if (new RegExp(`(^|\\b)${alias}(\\b|$)`, 'i').test(normalized)) return value;
  }
  return null;
}

function pickQuote(quotes: YahooSearchQuote[], query: string): YahooSearchQuote | null {
  const preferredType = getPreferredType(query);
  const validQuotes = quotes.filter(quote => quote.symbol && (quote.quoteType === 'EQUITY' || quote.quoteType === 'CRYPTOCURRENCY' || quote.quoteType === 'ETF'));
  if (preferredType) {
    const typed = validQuotes.find(quote => quote.quoteType === preferredType);
    if (typed) return typed;
  }
  return validQuotes[0] || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawQuery = typeof body?.query === 'string' ? body.query.trim() : '';
    const query = normalizeQuery(rawQuery);

    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const searchUrl = new URL('https://query1.finance.yahoo.com/v1/finance/search');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('quotesCount', '8');
    searchUrl.searchParams.set('newsCount', '0');

    const searchResponse = await fetch(searchUrl, { cache: 'no-store', headers: { accept: 'application/json' } });
    if (!searchResponse.ok) {
      return NextResponse.json({ error: 'Market search failed.' }, { status: 502 });
    }

    const searchPayload = await searchResponse.json();
    const quotes = Array.isArray(searchPayload?.quotes) ? searchPayload.quotes as YahooSearchQuote[] : [];
    const selected = pickQuote(quotes, rawQuery);
    const cryptoAlias = getCryptoAlias(rawQuery);
    const fallbackSymbol = !selected?.symbol && cryptoAlias ? cryptoAlias.symbol : null;

    if (!selected?.symbol && !fallbackSymbol) {
      return NextResponse.json({ error: 'No market asset matched that query.' }, { status: 404 });
    }

    const symbol = selected?.symbol || fallbackSymbol || '';
    const chartUrl = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
    chartUrl.searchParams.set('range', '1d');
    chartUrl.searchParams.set('interval', '15m');
    chartUrl.searchParams.set('includePrePost', 'false');

    const quoteUrl = new URL('https://query1.finance.yahoo.com/v7/finance/quote');
    quoteUrl.searchParams.set('symbols', symbol);

    const [chartResponse, quoteResponse] = await Promise.all([
      fetch(chartUrl, { cache: 'no-store', headers: { accept: 'application/json' } }),
      fetch(quoteUrl, { cache: 'no-store', headers: { accept: 'application/json' } }),
    ]);

    if (!chartResponse.ok) {
      return NextResponse.json({ error: 'Market chart data failed.' }, { status: 502 });
    }

    if (!quoteResponse.ok) {
      return NextResponse.json({ error: 'Market quote data failed.' }, { status: 502 });
    }

    const [chartPayload, quotePayload] = await Promise.all([
      chartResponse.json(),
      quoteResponse.json(),
    ]);
    const result = chartPayload?.chart?.result?.[0];
    const meta = result?.meta || {};
    const quote = Array.isArray(quotePayload?.quoteResponse?.result)
      ? quotePayload.quoteResponse.result[0] as YahooQuoteSnapshot | undefined
      : undefined;
    const closes = Array.isArray(result?.indicators?.quote?.[0]?.close) ? result.indicators.quote[0].close : [];
    const timestamps = Array.isArray(result?.timestamp) ? result.timestamp : [];
    const points = closes
      .map((value: number | null, index: number) => {
        if (typeof value !== 'number' || !Number.isFinite(value)) return null;
        return {
          label: timestamps[index]
            ? new Date(timestamps[index] * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : `${index + 1}`,
          value,
        };
      })
      .filter(Boolean);

    const numericPointValues = points.map((point: { value: number }) => point.value).filter((value: number) => Number.isFinite(value));
    const intradayHigh = numericPointValues.length ? Math.max(...numericPointValues) : undefined;
    const intradayLow = numericPointValues.length ? Math.min(...numericPointValues) : undefined;
    const intradayOpen = numericPointValues[0];

    const price = Number(quote?.regularMarketPrice ?? meta?.regularMarketPrice ?? meta?.previousClose ?? points.at(-1)?.value ?? 0);
    const previousClose = Number(meta?.previousClose ?? price);
    const changeValue = Number((quote?.regularMarketChange ?? (price - previousClose)).toFixed(2));
    const changePercent = Number((quote?.regularMarketChangePercent ?? (previousClose ? (((price - previousClose) / previousClose) * 100) : 0)).toFixed(2));
    const quoteType = String(quote?.quoteType || selected?.quoteType || (fallbackSymbol ? 'CRYPTOCURRENCY' : '')).toUpperCase();

    return NextResponse.json({
      assetType: quoteType === 'CRYPTOCURRENCY' ? 'crypto' : 'stock',
      symbol,
      name: quote?.longName || quote?.shortName || selected?.longname || selected?.shortname || cryptoAlias?.name || symbol,
      price,
      currency: quote?.financialCurrency || meta?.currency || 'USD',
      changePercent,
      changeValue,
      exchange: quote?.fullExchangeName || selected?.exchange || meta?.exchangeName,
      marketState: meta?.marketState || undefined,
      openPrice: Number(quote?.regularMarketOpen ?? intradayOpen ?? 0) || undefined,
      dayHigh: Number(quote?.regularMarketDayHigh ?? intradayHigh ?? 0) || undefined,
      dayLow: Number(quote?.regularMarketDayLow ?? intradayLow ?? 0) || undefined,
      volume: Number(quote?.regularMarketVolume ?? 0) || undefined,
      averageVolume: Number(quote?.averageDailyVolume3Month ?? quote?.averageDailyVolume10Day ?? 0) || undefined,
      marketCap: Number(quote?.marketCap ?? meta?.marketCap ?? 0) || undefined,
      fiftyTwoWeekHigh: Number(quote?.fiftyTwoWeekHigh ?? 0) || undefined,
      fiftyTwoWeekLow: Number(quote?.fiftyTwoWeekLow ?? 0) || undefined,
      points,
      sourceLabel: 'Yahoo Finance',
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Market lookup failed.' }, { status: 500 });
  }
}
