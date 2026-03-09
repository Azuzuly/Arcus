/* eslint-disable @next/next/no-img-element */
'use client';

import { useMemo, useState } from 'react';
import JSZip from 'jszip';
import { CustomCard, Message } from '@/lib/types';
import { extractArtifactFiles } from '@/lib/artifacts';

const CARD_SHELL = {
  marginBottom: 12,
  borderRadius: 22,
  padding: 18,
  background: 'rgba(12,16,24,0.88)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 18px 44px rgba(0,0,0,0.22)',
} as const;

const CARD_SHELL_SOFT = {
  ...CARD_SHELL,
  background: 'rgba(14,19,28,0.82)',
} as const;

function formatSigned(value?: number, digits = 2): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
}

function formatMoney(value?: number, currency = 'USD', digits?: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  const resolvedDigits = typeof digits === 'number'
    ? digits
    : Math.abs(value) >= 100
      ? 2
      : Math.abs(value) >= 1
        ? 2
        : Math.abs(value) >= 0.01
          ? 4
          : 6;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: resolvedDigits,
      minimumFractionDigits: resolvedDigits,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(resolvedDigits)}`;
  }
}

function formatCompactNumber(value?: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1_000_000_000 ? 2 : 1,
  }).format(value);
}

function formatMarketStateLabel(value?: string): string {
  if (!value) return 'Live';
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function samplePoints<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const step = (items.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, index) => items[Math.round(index * step)]);
}

function Sparkline({ values, tone, gradientId }: { values: number[]; tone: 'up' | 'down'; gradientId: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 100;
    const y = max === min ? 50 : 100 - ((value - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(' ');
  const rising = tone === 'up';

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 160 }}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={rising ? '#34D399' : '#FB7185'} stopOpacity="0.35" />
          <stop offset="100%" stopColor={rising ? '#34D399' : '#FB7185'} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d="M0 25 H100 M0 50 H100 M0 75 H100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" fill="none" />
      <polyline fill="none" stroke={rising ? '#34D399' : '#FB7185'} strokeWidth="2.8" points={points} />
      <polyline fill={`url(#${gradientId})`} stroke="none" points={`0,100 ${points} 100,100`} />
    </svg>
  );
}

function WeatherCard({ card }: { card: Extract<CustomCard, { type: 'weather' }>['data'] }) {
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const currentTemp = unit === 'C' ? `${card.temperatureC}°` : `${card.temperatureF}°`;
  const apparent = unit === 'C' ? card.apparentTemperatureC : card.apparentTemperatureF;

  return (
    <div style={{ ...CARD_SHELL, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Personalized weather</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontSize: 56, lineHeight: 0.95, fontWeight: 800 }}>{currentTemp}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{card.condition}</div>
              <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{card.location}</div>
            </div>
          </div>
          {typeof apparent === 'number' && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>Feels like {apparent}°{unit}</div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {card.locationSource === 'device' ? (
              <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.22)', color: '#D1FAE5', fontSize: 11, fontWeight: 700 }}>Near you</span>
            ) : null}
            {card.localTime ? (
              <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: 600 }}>{card.localTime}</span>
            ) : null}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 56 }}>{card.daily[0]?.icon || '🌤️'}</div>
          <div style={{ display: 'inline-flex', gap: 6, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['C', 'F'] as const).map(nextUnit => (
              <button key={nextUnit} onClick={() => setUnit(nextUnit)} style={{
                padding: '6px 10px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: unit === nextUnit ? '#fff' : 'transparent', color: unit === nextUnit ? '#111827' : '#fff', fontWeight: 700,
              }}>{`°${nextUnit}`}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 10 }}>Source: {card.sourceLabel}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {card.daily.map(day => (
          <div key={day.label} style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 24 }}>{day.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{day.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{unit === 'C' ? `${day.maxC}°` : `${day.maxF}°`}</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.56)', minWidth: 84, textAlign: 'right' }}>{day.condition}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileCard({ card }: { card: Extract<CustomCard, { type: 'profile' }>['data'] }) {
  return (
    <div style={CARD_SHELL_SOFT}>
      <div style={{ display: 'grid', gridTemplateColumns: card.imageUrl ? 'minmax(120px, 180px) 1fr' : '1fr', gap: 18, alignItems: 'start' }}>
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} style={{ width: '100%', maxWidth: 180, aspectRatio: '4 / 5', objectFit: 'cover', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)' }} />
        ) : null}
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>Fact-checked summary</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em' }}>{card.name}</div>
          {card.subtitle ? <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.62)', marginTop: 4 }}>{card.subtitle}</div> : null}
          <div style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.86)', marginTop: 14 }}>{card.summary}</div>

          {card.quickFacts?.length ? (
            <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
              {card.quickFacts.map(fact => (
                <div key={fact} style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  {fact}
                </div>
              ))}
            </div>
          ) : null}

          {card.sourceUrl ? (
            <a href={card.sourceUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', marginTop: 14, color: '#93C5FD', textDecoration: 'none', fontSize: 13 }}>
              Open source ({card.sourceLabel}) ↗
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MarketCard({ card }: { card: Extract<CustomCard, { type: 'market' }>['data'] }) {
  const chartPoints = samplePoints(card.points, 18).map(point => point.value);
  const isPositive = (card.changePercent || 0) >= 0;
  const sparkTone = isPositive ? 'up' : 'down';
  const gradientId = `arcusSpark-${card.symbol.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'market'}`;
  const intradayHigh = typeof card.dayHigh === 'number' ? card.dayHigh : (chartPoints.length ? Math.max(...chartPoints) : undefined);
  const intradayLow = typeof card.dayLow === 'number' ? card.dayLow : (chartPoints.length ? Math.min(...chartPoints) : undefined);
  const intradaySpread = typeof intradayHigh === 'number' && typeof intradayLow === 'number' ? intradayHigh - intradayLow : undefined;
  const sessionProgress = typeof intradayHigh === 'number' && typeof intradayLow === 'number' && intradayHigh > intradayLow
    ? Math.min(100, Math.max(0, ((card.price - intradayLow) / (intradayHigh - intradayLow)) * 100))
    : 50;
  const primaryStats = [
    { label: card.assetType === 'crypto' ? '24h volume' : 'Volume', value: formatCompactNumber(card.volume) },
    { label: 'Market cap', value: formatCompactNumber(card.marketCap) },
    { label: 'Open', value: formatMoney(card.openPrice, card.currency) },
    { label: 'Avg volume', value: formatCompactNumber(card.averageVolume) },
  ].filter(item => item.value !== '—');
  const secondaryStats = [
    { label: card.assetType === 'crypto' ? '24h high' : 'Day high', value: formatMoney(intradayHigh, card.currency) },
    { label: card.assetType === 'crypto' ? '24h low' : 'Day low', value: formatMoney(intradayLow, card.currency) },
    { label: '52w high', value: formatMoney(card.fiftyTwoWeekHigh, card.currency) },
    { label: '52w low', value: formatMoney(card.fiftyTwoWeekLow, card.currency) },
  ].filter(item => item.value !== '—');

  return (
    <div style={{
      ...CARD_SHELL,
      padding: 20,
      background: 'rgba(11,15,23,0.96)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: isPositive ? '#34D399' : '#FB7185', boxShadow: `0 0 14px ${isPositive ? 'rgba(52,211,153,0.5)' : 'rgba(251,113,133,0.5)'}` }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>
              {card.assetType === 'crypto' ? 'Crypto market' : 'Market snapshot'}
            </span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 12, letterSpacing: '-0.04em' }}>{card.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.66)', fontWeight: 700 }}>{card.symbol}</span>
            {card.exchange ? <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>• {card.exchange}</span> : null}
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>• {formatMarketStateLabel(card.marketState)}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 220 }}>
          <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.05em' }}>{formatMoney(card.price, card.currency)}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 8, padding: '9px 12px', borderRadius: 999, background: isPositive ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)', border: isPositive ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(251,113,133,0.2)' }}>
            <span style={{ fontSize: 15, color: isPositive ? '#6EE7B7' : '#FDA4AF', fontWeight: 800 }}>{formatSigned(card.changePercent)}%</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{formatSigned(card.changeValue)}</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', marginTop: 10 }}>Intraday feed · {card.sourceLabel}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(260px, 0.9fr)', gap: 14, marginTop: 16 }}>
        <div style={{ borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Sparkline values={chartPoints} tone={sparkTone} gradientId={gradientId} />
        </div>

        <div style={{ padding: 16, borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {card.assetType === 'crypto' ? '24h range' : 'Day range'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 10, fontSize: 13, fontWeight: 700 }}>
            <span>{formatMoney(intradayLow, card.currency)}</span>
            <span style={{ color: 'rgba(255,255,255,0.48)' }}>{formatMoney(intradayHigh, card.currency)}</span>
          </div>
          <div style={{ position: 'relative', marginTop: 10, height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ width: `${sessionProgress}%`, height: '100%', borderRadius: 999, background: isPositive ? '#34D399' : '#FB7185' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.36)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Range spread</div>
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6 }}>{formatMoney(intradaySpread, card.currency)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.36)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price position</div>
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6 }}>{Math.round(sessionProgress)}%</div>
            </div>
          </div>
        </div>
      </div>

      {primaryStats.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 14 }}>
          {primaryStats.map(item => (
            <div key={item.label} style={{ padding: '12px 13px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6 }}>{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {secondaryStats.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 10 }}>
          {secondaryStats.map(item => (
            <div key={item.label} style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.34)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 5 }}>{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SportsCard({ card }: { card: Extract<CustomCard, { type: 'sports' }>['data'] }) {
  return (
    <div style={CARD_SHELL_SOFT}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.48)' }}>Live scoreboard</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{card.league}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.58)', marginTop: 4 }}>{card.queryLabel}</div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)' }}>{card.updatedAt || card.sourceLabel}</div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {card.events.map(event => (
          <div key={event.id} style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    { team: event.awayTeam, score: event.awayScore },
                    { team: event.homeTeam, score: event.homeScore },
                  ].map(row => (
                    <div key={row.team} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{row.team}</span>
                      <span style={{ fontSize: 24, fontWeight: 800 }}>{row.score}</span>
                    </div>
                  ))}
                </div>
                {(event.summary || event.venue || event.startTime) ? (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>
                    {[event.summary, event.venue, event.startTime].filter(Boolean).join(' · ')}
                  </div>
                ) : null}
              </div>
              <div style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)', fontSize: 11, color: '#DBEAFE', fontWeight: 700 }}>
                {event.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConversionCard({ card }: { card: Extract<CustomCard, { type: 'conversion' }>['data'] }) {
  return (
    <div style={{
      ...CARD_SHELL,
      border: '1px solid rgba(96,165,250,0.24)',
      boxShadow: '0 18px 44px rgba(0,0,0,0.22)',
    }}>
      <div style={{ fontSize: 12, color: '#BFDBFE' }}>{card.category} conversion</div>
      <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.66)', marginTop: 10 }}>{card.inputLabel}</div>
      <div style={{ fontSize: 34, fontWeight: 800, marginTop: 6, color: '#EFF6FF' }}>{card.primaryResult}</div>
      {card.formula ? <div style={{ fontSize: 12, color: 'rgba(191,219,254,0.82)', marginTop: 8 }}>{card.formula}</div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 14 }}>
        {card.quickResults.map(result => (
          <div key={result.label} style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.44)' }}>{result.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{result.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TravelCard({ card }: { card: Extract<CustomCard, { type: 'travel' }>['data'] }) {
  return (
    <div style={CARD_SHELL}>
      <div style={{ display: 'grid', gridTemplateColumns: card.mapImageUrl ? '1.2fr 0.9fr' : '1fr', gap: 16, alignItems: 'stretch' }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.48)' }}>Timezone & travel card</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{card.location}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{[card.region, card.country].filter(Boolean).join(', ')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
            {[
              { label: 'Local time', value: card.localTime },
              { label: 'Timezone', value: card.timezone },
              { label: 'Coordinates', value: card.coordinates },
              { label: 'Source', value: card.sourceLabel },
            ].map(item => (
              <div key={item.label} style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.36)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 5 }}>{item.value}</div>
              </div>
            ))}
          </div>
          {card.summary ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.68)', marginTop: 12, lineHeight: 1.65 }}>{card.summary}</div> : null}
        </div>
        {card.mapImageUrl ? <img src={card.mapImageUrl} alt={card.location} style={{ width: '100%', height: '100%', minHeight: 220, objectFit: 'cover', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)' }} /> : null}
      </div>
    </div>
  );
}

function MathCard({ card }: { card: Extract<CustomCard, { type: 'math' }>['data'] }) {
  return (
    <div style={{
      ...CARD_SHELL,
      background: 'rgba(15,18,26,0.92)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(196,181,253,0.8)' }}>Math workspace</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{card.topic}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.66)', marginTop: 8, lineHeight: 1.6 }}>{card.prompt}</div>
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.22)', color: '#E9D5FF', fontSize: 12, fontWeight: 700 }}>
          {card.badge}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 14 }}>
        {card.hints.map(item => (
          <div key={item} style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolUsageStack({ message }: { message: Message }) {
  const [expanded, setExpanded] = useState(false);
  const items = message.toolUsage || [];
  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: 10, display: 'grid', gap: 6 }}>
      {items.map((item, index) => {
        const isComplete = item.status === 'complete';
        const isRunning = item.status === 'running';
        return (
          <button key={item.id} onClick={() => setExpanded(value => !value)} style={{
            width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 12,
            background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ color: isRunning ? '#93C5FD' : isComplete ? '#D1FAE5' : 'rgba(255,255,255,0.6)' }}>
                  {item.kind === 'search' ? '⌕' : item.kind === 'results' ? '▣' : item.kind === 'weather' ? '☁' : item.kind === 'facts' ? '◎' : item.kind === 'market' ? '↗' : item.kind === 'sports' ? '🏟' : item.kind === 'conversion' ? '⇄' : item.kind === 'travel' ? '🗺' : '📁'}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{item.label}</div>
                  {(expanded || (index === 0 && items.length === 1)) && item.detail ? <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.48)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.detail}</div> : null}
                </div>
              </div>
              <span style={{ fontSize: 10, color: isRunning ? '#93C5FD' : isComplete ? 'rgba(255,255,255,0.46)' : '#FCA5A5' }}>
                {isRunning ? 'Running…' : isComplete ? 'Done' : item.status}
              </span>
            </div>

            {expanded && item.kind === 'results' && message.research?.sources?.length ? (
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                {message.research.sources.slice(0, 3).map(source => (
                  <div key={source.url} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{source.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(147,197,253,0.9)', marginTop: 3 }}>{source.url}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function ArtifactBundleCard({ markdown }: { markdown: string }) {
  const files = useMemo(() => extractArtifactFiles(markdown), [markdown]);
  const [downloading, setDownloading] = useState(false);

  if (files.length < 2) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const zip = new JSZip();
      const folder = zip.folder('arcus-bundle');
      files.forEach(file => folder?.file(file.path, file.content));
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'arcus-bundle.zip';
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ marginTop: 12, padding: 14, borderRadius: 18, background: 'rgba(19,28,42,0.82)', border: '1px solid rgba(96,165,250,0.24)', boxShadow: '0 18px 44px rgba(0,0,0,0.18)' }}>
      <button onClick={handleDownload} disabled={downloading} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#DBEAFE' }}>Project folder bundle</div>
          <div style={{ fontSize: 12, color: 'rgba(219,234,254,0.82)', marginTop: 4 }}>{files.length} files grouped into one downloadable folder.</div>
        </div>
        <span style={{
          padding: '10px 14px', borderRadius: 999, border: '1px solid rgba(191,219,254,0.45)', background: 'rgba(255,255,255,0.14)',
          color: '#EFF6FF', fontWeight: 800, boxShadow: '0 0 20px rgba(59,130,246,0.22)', display: 'inline-flex',
        }}>{downloading ? 'Preparing zip…' : 'Download folder.zip'}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {files.slice(0, 6).map(file => (
          <span key={file.path} style={{ padding: '5px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 11, color: '#E0F2FE' }}>{file.path}</span>
        ))}
        {files.length > 6 ? <span style={{ fontSize: 11, color: '#DBEAFE' }}>+{files.length - 6} more</span> : null}
      </div>
      </button>
    </div>
  );
}

export default function RichMessageExtras({ message }: { message: Message }) {
  return (
    <>
      <ToolUsageStack message={message} />
      {message.customCard?.type === 'weather' ? <WeatherCard card={message.customCard.data} /> : null}
      {message.customCard?.type === 'profile' ? <ProfileCard card={message.customCard.data} /> : null}
      {message.customCard?.type === 'market' ? <MarketCard card={message.customCard.data} /> : null}
      {message.customCard?.type === 'sports' ? <SportsCard card={message.customCard.data} /> : null}
      {message.customCard?.type === 'conversion' ? <ConversionCard card={message.customCard.data} /> : null}
      {message.customCard?.type === 'travel' ? <TravelCard card={message.customCard.data} /> : null}
      {message.customCard?.type === 'math' ? <MathCard card={message.customCard.data} /> : null}
      <ArtifactBundleCard markdown={message.content} />
    </>
  );
}