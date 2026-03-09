'use client';

import { useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

export interface TopicCardData {
  type: 'weather' | 'crypto' | 'stock' | 'sports' | 'code' | 'math' | 'link' | 'definition';
  title: string;
  data: Record<string, any>;
}

interface TopicCardsProps {
  content: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  DATA EXTRACTION — Parse structured data from AI responses          */
/* ------------------------------------------------------------------ */

function extractTopicCards(content: string): TopicCardData[] {
  const cards: TopicCardData[] = [];

  // Weather detection
  const weatherMatch = content.match(
    /(?:weather|temperature|forecast)[^.]*?(?:(\d+)[°]?\s*[°]?([FC]))[^.]*?(?:humidity[:\s]*(\d+)%)?/i
  );
  if (weatherMatch) {
    const tempMatch = content.match(/(\d+)[°]?\s*°?([FC])/i);
    const humidityMatch = content.match(/humidity[:\s]*(\d+)%/i);
    const conditionMatch = content.match(/(?:condition|currently|weather)[:\s]*([\w\s]+?)(?:\.|,|\n)/i);
    const windMatch = content.match(/wind[:\s]*(\d+)\s*(?:mph|km\/h|m\/s)/i);

    if (tempMatch) {
      cards.push({
        type: 'weather',
        title: 'Weather',
        data: {
          temperature: parseInt(tempMatch[1]),
          unit: tempMatch[2]?.toUpperCase() || 'F',
          humidity: humidityMatch ? parseInt(humidityMatch[1]) : null,
          condition: conditionMatch?.[1]?.trim() || 'Clear',
          wind: windMatch ? parseInt(windMatch[1]) : null,
        },
      });
    }
  }

  // Crypto detection
  const cryptoPattern = /(?:bitcoin|btc|ethereum|eth|solana|sol)[^.]*?\$([\d,]+\.?\d*)[^.]*?([+-]?\d+\.?\d*)%/gi;
  let cryptoMatch;
  while ((cryptoMatch = cryptoPattern.exec(content)) !== null) {
    const nameMatch = cryptoMatch[0].match(/(?:bitcoin|btc|ethereum|eth|solana|sol)/i);
    cards.push({
      type: 'crypto',
      title: nameMatch?.[0] || 'Crypto',
      data: {
        price: parseFloat(cryptoMatch[1].replace(/,/g, '')),
        change24h: parseFloat(cryptoMatch[2]),
        symbol: nameMatch?.[0]?.toUpperCase().replace(/BITCOIN/, 'BTC').replace(/ETHEREUM/, 'ETH').replace(/SOLANA/, 'SOL') || '???',
      },
    });
  }

  // Stock detection
  const stockPattern = /(?:(?:shares?|stock|ticker)[^.]*?)?\b([A-Z]{1,5})\b[^.]*?\$([\d,]+\.?\d*)[^.]*?([+-]?\d+\.?\d*)%/g;
  let stockMatch;
  while ((stockMatch = stockPattern.exec(content)) !== null) {
    const ticker = stockMatch[1];
    // Filter out false positives
    if (['THE', 'AND', 'FOR', 'NOT', 'BUT', 'ARE', 'WAS', 'HAS', 'USD', 'BTC', 'ETH', 'SOL'].includes(ticker)) continue;
    cards.push({
      type: 'stock',
      title: ticker,
      data: {
        ticker,
        price: parseFloat(stockMatch[2].replace(/,/g, '')),
        change: parseFloat(stockMatch[3]),
      },
    });
  }

  // Code block detection (for syntax highlighted cards)
  const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
  let codeMatch;
  while ((codeMatch = codeBlockPattern.exec(content)) !== null) {
    if (codeMatch[2].trim().length > 10) {
      cards.push({
        type: 'code',
        title: codeMatch[1] || 'Code',
        data: {
          language: codeMatch[1] || 'text',
          code: codeMatch[2].trim(),
          lines: codeMatch[2].trim().split('\n').length,
        },
      });
    }
  }

  // Math formula detection (LaTeX)
  const mathPattern = /\$\$([^$]+)\$\$|\\\[([^\]]+)\\\]/g;
  let mathMatch;
  while ((mathMatch = mathPattern.exec(content)) !== null) {
    cards.push({
      type: 'math',
      title: 'Formula',
      data: {
        formula: (mathMatch[1] || mathMatch[2]).trim(),
        isBlock: true,
      },
    });
  }

  return cards;
}

/* ------------------------------------------------------------------ */
/*  INDIVIDUAL CARD COMPONENTS                                         */
/* ------------------------------------------------------------------ */

function WeatherCard({ data }: { data: Record<string, any> }) {
  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('sun') || c.includes('clear')) return '☀️';
    if (c.includes('cloud') || c.includes('overcast')) return '☁️';
    if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
    if (c.includes('snow') || c.includes('sleet')) return '❄️';
    if (c.includes('thunder') || c.includes('storm')) return '⛈️';
    if (c.includes('fog') || c.includes('mist')) return '🌫️';
    if (c.includes('wind')) return '💨';
    return '🌤️';
  };

  const tempColor = data.temperature > 85 ? 'text-orange-400' :
    data.temperature > 70 ? 'text-yellow-400' :
    data.temperature > 50 ? 'text-green-400' :
    data.temperature > 32 ? 'text-blue-400' : 'text-cyan-400';

  return (
    <div className="topic-card weather-card">
      <div className="topic-card-header">
        <span className="topic-card-icon">{getWeatherIcon(data.condition)}</span>
        <span className="topic-card-label">Weather</span>
      </div>
      <div className="topic-card-body">
        <div className={`topic-card-value ${tempColor}`}>
          {data.temperature}°{data.unit}
        </div>
        <div className="topic-card-subtitle">{data.condition}</div>
        <div className="topic-card-meta">
          {data.humidity !== null && <span>💧 {data.humidity}%</span>}
          {data.wind !== null && <span>💨 {data.wind} mph</span>}
        </div>
      </div>
      <div className="topic-card-sparkline weather-gradient" />
    </div>
  );
}

function CryptoCard({ data, title }: { data: Record<string, any>; title: string }) {
  const isPositive = data.change24h >= 0;
  const changeColor = isPositive ? 'text-emerald-400' : 'text-red-400';
  const changeBg = isPositive ? 'bg-emerald-400/10' : 'bg-red-400/10';

  return (
    <div className="topic-card crypto-card">
      <div className="topic-card-header">
        <span className="topic-card-icon">₿</span>
        <span className="topic-card-label">{data.symbol || title}</span>
        <span className={`topic-card-badge ${changeBg} ${changeColor}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(data.change24h)}%
        </span>
      </div>
      <div className="topic-card-body">
        <div className="topic-card-value">
          ${data.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="topic-card-subtitle">24h Change</div>
      </div>
      <div className={`topic-card-sparkline ${isPositive ? 'sparkline-up' : 'sparkline-down'}`} />
    </div>
  );
}

function StockCard({ data }: { data: Record<string, any> }) {
  const isPositive = data.change >= 0;
  const changeColor = isPositive ? 'text-emerald-400' : 'text-red-400';
  const changeBg = isPositive ? 'bg-emerald-400/10' : 'bg-red-400/10';

  return (
    <div className="topic-card stock-card">
      <div className="topic-card-header">
        <span className="topic-card-icon">📈</span>
        <span className="topic-card-label">{data.ticker}</span>
        <span className={`topic-card-badge ${changeBg} ${changeColor}`}>
          {isPositive ? '+' : ''}{data.change}%
        </span>
      </div>
      <div className="topic-card-body">
        <div className="topic-card-value">
          ${data.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      <div className={`topic-card-sparkline ${isPositive ? 'sparkline-up' : 'sparkline-down'}`} />
    </div>
  );
}

function MathCard({ data }: { data: Record<string, any> }) {
  return (
    <div className="topic-card math-card">
      <div className="topic-card-header">
        <span className="topic-card-icon">∑</span>
        <span className="topic-card-label">Formula</span>
      </div>
      <div className="topic-card-body">
        <div className="topic-card-formula">
          {data.formula}
        </div>
      </div>
    </div>
  );
}

function CodeCard({ data, title }: { data: Record<string, any>; title: string }) {
  return (
    <div className="topic-card code-card">
      <div className="topic-card-header">
        <span className="topic-card-icon">{'</>'}</span>
        <span className="topic-card-label">{data.language || title}</span>
        <span className="topic-card-badge bg-white/5 text-white/50">
          {data.lines} lines
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function TopicCards({ content, className = '' }: TopicCardsProps) {
  const cards = useMemo(() => extractTopicCards(content), [content]);

  if (cards.length === 0) return null;

  // Don't render code cards (those are already handled by markdown renderer)
  const visibleCards = cards.filter(c => c.type !== 'code');
  if (visibleCards.length === 0) return null;

  return (
    <div className={`topic-cards-container ${className}`}>
      {visibleCards.map((card, i) => {
        switch (card.type) {
          case 'weather':
            return <WeatherCard key={`weather-${i}`} data={card.data} />;
          case 'crypto':
            return <CryptoCard key={`crypto-${i}`} data={card.data} title={card.title} />;
          case 'stock':
            return <StockCard key={`stock-${i}`} data={card.data} />;
          case 'math':
            return <MathCard key={`math-${i}`} data={card.data} />;
          case 'code':
            return <CodeCard key={`code-${i}`} data={card.data} title={card.title} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export { extractTopicCards };
