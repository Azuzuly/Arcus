'use client';

/**
 * TopicCards — Rich glassmorphism inline cards for structured data
 * detected in AI responses.
 *
 * Supports: Weather, Crypto, Stock Market, Sports Scores,
 * Code Snippets, Math Formulas (LaTeX via KaTeX).
 */

import { useMemo } from 'react';

/* ── Shared styles ── */

const CARD_BASE: React.CSSProperties = {
  borderRadius: 18,
  padding: '14px 16px',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
  backdropFilter: 'blur(24px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)',
  color: '#fff',
  marginTop: 8,
  marginBottom: 8,
  maxWidth: 420,
  overflow: 'hidden',
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.5)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const VALUE_STYLE: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '-0.02em',
};

/* ── Mini sparkline SVG ── */

function Sparkline({ points, color = '#3B82F6', width = 120, height = 32 }: { points: number[]; color?: string; width?: number; height?: number }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const d = points
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Individual cards ── */

function WeatherTopicCard({ temp, condition, location, forecast }: {
  temp: number; condition: string; location: string;
  forecast?: { day: string; high: number; low: number }[];
}) {
  return (
    <div style={CARD_BASE}>
      <div style={LABEL_STYLE}>Weather · {location}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
        <span style={{ fontSize: 36 }}>{condition.includes('rain') || condition.includes('Rain') ? '🌧️' : condition.includes('cloud') || condition.includes('Cloud') ? '☁️' : condition.includes('snow') || condition.includes('Snow') ? '❄️' : '☀️'}</span>
        <div>
          <div style={VALUE_STYLE}>{temp}°C</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{condition}</div>
        </div>
      </div>
      {forecast && forecast.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }}>
          {forecast.slice(0, 5).map((d, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 48, padding: '6px 4px', borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{d.day}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{d.high}°</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{d.low}°</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CryptoTopicCard({ symbol, name, price, change, sparklineData }: {
  symbol: string; name: string; price: number; change: number;
  sparklineData?: number[];
}) {
  const positive = change >= 0;
  return (
    <div style={CARD_BASE}>
      <div style={LABEL_STYLE}>Crypto · {symbol}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <div>
          <div style={VALUE_STYLE}>${price.toLocaleString(undefined, { maximumFractionDigits: price < 1 ? 6 : 2 })}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: positive ? '#10B981' : '#EF4444' }}>
            {positive ? '+' : ''}{change.toFixed(2)}%
          </div>
          {sparklineData && <Sparkline points={sparklineData} color={positive ? '#10B981' : '#EF4444'} />}
        </div>
      </div>
    </div>
  );
}

function StockTopicCard({ ticker, name, price, change, changePercent }: {
  ticker: string; name: string; price: number; change: number; changePercent: number;
}) {
  const positive = change >= 0;
  return (
    <div style={CARD_BASE}>
      <div style={LABEL_STYLE}>Stock · {ticker}</div>
      <div style={{ marginTop: 6 }}>
        <div style={VALUE_STYLE}>${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{name}</div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <span style={{
          padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
          background: positive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          color: positive ? '#10B981' : '#EF4444',
          border: `1px solid ${positive ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}>
          {positive ? '+' : ''}{change.toFixed(2)} ({positive ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}

function SportsTopicCard({ league, events }: {
  league: string;
  events: { home: string; away: string; homeScore: string; awayScore: string; status: string }[];
}) {
  return (
    <div style={CARD_BASE}>
      <div style={LABEL_STYLE}>Sports · {league}</div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {events.slice(0, 4).map((e, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.away}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>@</span>
              <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.home}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{e.awayScore}-{e.homeScore}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', padding: '2px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>{e.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeSnippetCard({ language, code }: { language: string; code: string }) {
  return (
    <div style={{ ...CARD_BASE, padding: 0 }}>
      <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...LABEL_STYLE, margin: 0 }}>Code · {language}</span>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
        >
          Copy
        </button>
      </div>
      <pre style={{ padding: '12px 14px', margin: 0, fontSize: 12, fontFamily: "'Geist Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'rgba(255,255,255,0.85)', maxHeight: 200, overflowY: 'auto' }}>
        {code}
      </pre>
    </div>
  );
}

function MathFormulaCard({ formula, label }: { formula: string; label?: string }) {
  return (
    <div style={CARD_BASE} className="math-block">
      {label && <div style={LABEL_STYLE}>{label}</div>}
      <div style={{ marginTop: 6, fontSize: 18, fontFamily: "'Geist Mono', monospace", color: '#F8FAFC' }}>
        {formula}
      </div>
    </div>
  );
}

/* ── Detection + auto-render ── */

interface DetectedCard {
  type: 'weather' | 'crypto' | 'stock' | 'sports' | 'code' | 'math';
  props: Record<string, unknown>;
}

function detectCards(text: string): DetectedCard[] {
  const cards: DetectedCard[] = [];

  // Weather pattern: "23°C" or "75°F" with condition words
  const weatherMatch = text.match(/(-?\d{1,3})°([CF]).*?(sunny|cloudy|rainy|rain|snow|clear|overcast|partly|thunder|fog|haze|mist|drizzle|storm)/i);
  if (weatherMatch) {
    cards.push({
      type: 'weather',
      props: {
        temp: parseInt(weatherMatch[1]),
        condition: weatherMatch[3],
        location: 'Detected',
      },
    });
  }

  // Crypto pattern: BTC/ETH with $ price
  const cryptoMatch = text.match(/\b(BTC|ETH|SOL|DOGE|ADA|XRP|DOT|MATIC|Bitcoin|Ethereum|Solana|Dogecoin)\b.*?\$([0-9,.]+)/i);
  if (cryptoMatch) {
    const changeMatch = text.match(/([+-]?\d+\.?\d*)%/);
    cards.push({
      type: 'crypto',
      props: {
        symbol: cryptoMatch[1].toUpperCase(),
        name: cryptoMatch[1],
        price: parseFloat(cryptoMatch[2].replace(/,/g, '')),
        change: changeMatch ? parseFloat(changeMatch[1]) : 0,
      },
    });
  }

  // Stock pattern: ticker with $ price
  const stockMatch = text.match(/\b([A-Z]{1,5})\b.*?(?:stock|share|nasdaq|nyse|market).*?\$([0-9,.]+)/i);
  if (stockMatch && !cryptoMatch) {
    const changeMatch = text.match(/([+-]?\d+\.?\d*)%/);
    cards.push({
      type: 'stock',
      props: {
        ticker: stockMatch[1].toUpperCase(),
        name: stockMatch[1],
        price: parseFloat(stockMatch[2].replace(/,/g, '')),
        change: changeMatch ? parseFloat(changeMatch[1]) : 0,
        changePercent: changeMatch ? parseFloat(changeMatch[1]) : 0,
      },
    });
  }

  return cards;
}

/**
 * Renders detected topic cards from an AI response.
 * Drop this into ChatMessage after the markdown content.
 */
export default function TopicCards({ content }: { content: string }) {
  const cards = useMemo(() => detectCards(content), [content]);

  if (cards.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {cards.map((card, i) => {
        switch (card.type) {
          case 'weather':
            return <WeatherTopicCard key={i} {...(card.props as Parameters<typeof WeatherTopicCard>[0])} />;
          case 'crypto':
            return <CryptoTopicCard key={i} {...(card.props as Parameters<typeof CryptoTopicCard>[0])} />;
          case 'stock':
            return <StockTopicCard key={i} {...(card.props as Parameters<typeof StockTopicCard>[0])} />;
          case 'sports':
            return <SportsTopicCard key={i} {...(card.props as Parameters<typeof SportsTopicCard>[0])} />;
          case 'code':
            return <CodeSnippetCard key={i} {...(card.props as Parameters<typeof CodeSnippetCard>[0])} />;
          case 'math':
            return <MathFormulaCard key={i} {...(card.props as Parameters<typeof MathFormulaCard>[0])} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export { WeatherTopicCard, CryptoTopicCard, StockTopicCard, SportsTopicCard, CodeSnippetCard, MathFormulaCard };
