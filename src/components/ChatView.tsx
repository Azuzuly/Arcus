'use client';

import { useStore } from '@/lib/store';
import { useRef, useEffect, useCallback, useState } from 'react';
import { streamChatCompletion, chatCompletion } from '@/lib/openrouter';
import { generateUUID } from '@/lib/utils';
import { ChatAttachment, CustomCard, Message, ReasoningStep, ResearchPacket, ResearchSource, ToolUsageItem } from '@/lib/types';
import { isRouterModelId, resolveModelRoute, ROUTER_MODEL_INFO } from '@/lib/modelRouter';
import { getCompanionHints } from '@/lib/cortex';
import AuroraBackground from './AuroraBackground';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';

interface SearchPayload {
  answer?: string;
  provider: string;
  results: Array<{ title: string; url: string; content: string; score?: number; favicon?: string }>;
}

interface ResearchRunResult {
  packet: ResearchPacket;
  liveContext: string;
  reasoning: ReasoningStep[];
}

function shouldAutoSearch(query: string): boolean {
  return /(latest|today|current|news|this week|recent|breaking|update|what'?s happening|price of|weather|score|stocks?)/i.test(query);
}

function isWeatherQuery(query: string): boolean {
  return /(weather|forecast|temperature|rain|snow|wind|humid)/i.test(query);
}

function isLocalWeatherQuery(query: string): boolean {
  return /(what'?s|what is|current|right now|today|now|outside|my area|here|where i live).*(weather|forecast|temperature)|\b(weather|forecast)\b.*(here|now|today|outside|current)/i.test(query);
}

function isGenericWeatherQuery(query: string): boolean {
  const normalized = query.trim();
  return /^(?:weather|forecast|temperature|rain|snow|wind|humidity|humid)(?:\s+(?:today|now|outside|please))?[?.!]*$/i.test(normalized)
    || /^(?:what(?:'s| is)?\s+the\s+weather)(?:\s+like)?(?:\s+(?:today|now|outside|here))?[?.!]*$/i.test(normalized);
}

function isProfileQuery(query: string): boolean {
  return /^(who is|who's|tell me about|give me info on)\b/i.test(query.trim());
}

function isMathQuery(query: string): boolean {
  return /(solve|simplify|equation|integral|derivative|fraction|probability|algebra|geometry|calculus|\d\s*[+\-*/=^]\s*\d)/i.test(query);
}

function isMarketQuery(query: string): boolean {
  return /(stock|stocks|share price|ticker|market cap|crypto|bitcoin|ethereum|solana|dogecoin|btc|eth|price of [A-Z]{2,6}\b|nasdaq|nyse)/i.test(query);
}

function isSportsQuery(query: string): boolean {
  return /(score|scores|game|match|fixture|standing|standings|nba|nfl|mlb|nhl|premier league|champions league|soccer|football|basketball|baseball|hockey)/i.test(query);
}

function isTravelQuery(query: string): boolean {
  return /(timezone|time in|local time in|what time is it in|map of|travel to|where is|visit)/i.test(query);
}

function isConversionQuery(query: string): boolean {
  return /\b\d+(?:\.\d+)?\s*[a-zA-Z°]+\s*(?:to|in|into)\s*[a-zA-Z°]+\b/i.test(query);
}

function extractLocationHint(query: string): string | undefined {
  const byPrep = query.match(/\b(?:in|for|at)\s+([a-zA-Z][a-zA-Z\s,'-]{1,60})(?:[?.!]|$)/i)?.[1]?.trim();
  if (byPrep) return byPrep;
  const bySuffix = query.match(/^([a-zA-Z][a-zA-Z\s,'-]{1,60})\s+(?:weather|forecast)\b/i)?.[1]?.trim();
  if (bySuffix && !/(my|here|current|today|now)/i.test(bySuffix)) return bySuffix;
  return undefined;
}

function buildInitialToolUsage(options: { query: string; searchTriggered: boolean; weather: boolean; profile: boolean; market: boolean; sports: boolean; conversion: boolean; travel: boolean }): ToolUsageItem[] {
  const items: ToolUsageItem[] = [];

  if (options.weather) {
    items.push({ id: generateUUID(), kind: 'weather', label: 'Weather lookup', detail: `Searching for ${options.query}`, status: 'running' });
  }

  if (options.profile) {
    items.push({ id: generateUUID(), kind: 'facts', label: 'Profile lookup', detail: `Fact-checking ${options.query}`, status: 'running' });
  }

  if (options.market) {
    items.push({ id: generateUUID(), kind: 'market', label: 'Market snapshot', detail: `Loading live market data for ${options.query}`, status: 'running' });
  }

  if (options.sports) {
    items.push({ id: generateUUID(), kind: 'sports', label: 'Live scores', detail: `Checking sports data for ${options.query}`, status: 'running' });
  }

  if (options.conversion) {
    items.push({ id: generateUUID(), kind: 'conversion', label: 'Conversion', detail: `Calculating ${options.query}`, status: 'running' });
  }

  if (options.travel) {
    items.push({ id: generateUUID(), kind: 'travel', label: 'Timezone & map', detail: `Resolving ${options.query}`, status: 'running' });
  }

  if (options.searchTriggered) {
    items.push({ id: generateUUID(), kind: 'search', label: 'Web Search', detail: `Searching for ${options.query}`, status: 'running' });
    items.push({ id: generateUUID(), kind: 'results', label: 'Search Results', detail: 'Collecting and ranking sources', status: 'pending' });
  }

  return items;
}

function updateToolUsage(items: ToolUsageItem[], kind: ToolUsageItem['kind'], status: ToolUsageItem['status'], detail?: string): ToolUsageItem[] {
  return items.map(item => item.kind === kind ? { ...item, status, detail: detail || item.detail } : item);
}

async function requestCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof window === 'undefined' || !window.isSecureContext || !('geolocation' in navigator)) return null;
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

async function buildWeatherCard(query: string, deviceLocation?: { latitude: number; longitude: number } | null): Promise<CustomCard | undefined> {
  const locationHint = extractLocationHint(query);
  const prefersDeviceLocation = !locationHint && (isLocalWeatherQuery(query) || isGenericWeatherQuery(query));
  const coords = deviceLocation ?? (prefersDeviceLocation ? await requestCurrentLocation() : null);

  if (!locationHint && prefersDeviceLocation && !coords) {
    return undefined;
  }

  if (!locationHint && !coords) {
    return undefined;
  }

  const response = await fetch('/api/weather', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coords ? coords : { query: locationHint || query }),
  });

  if (!response.ok) return undefined;
  const payload = await response.json();
  if (!payload?.location) return undefined;
  return { type: 'weather', data: payload };
}

async function buildMarketCard(query: string): Promise<CustomCard | undefined> {
  const response = await fetch('/api/market', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) return undefined;
  const payload = await response.json();
  if (!payload?.symbol || typeof payload?.price !== 'number') return undefined;
  return { type: 'market', data: payload };
}

async function buildSportsCard(query: string): Promise<CustomCard | undefined> {
  const response = await fetch('/api/sports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) return undefined;
  const payload = await response.json();
  if (!Array.isArray(payload?.events) || payload.events.length === 0) return undefined;
  return { type: 'sports', data: payload };
}

async function buildConversionCard(query: string): Promise<CustomCard | undefined> {
  const response = await fetch('/api/conversion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) return undefined;
  const payload = await response.json();
  if (!payload?.primaryResult) return undefined;
  return { type: 'conversion', data: payload };
}

async function buildTravelCard(query: string): Promise<CustomCard | undefined> {
  const response = await fetch('/api/travel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) return undefined;
  const payload = await response.json();
  if (!payload?.location || !payload?.timezone) return undefined;
  return { type: 'travel', data: payload };
}

function buildMathCard(query: string): CustomCard {
  const topic = /integral|derivative|calculus/i.test(query)
    ? 'Calculus'
    : /geometry|triangle|circle|angle/i.test(query)
      ? 'Geometry'
      : /probability|statistics|distribution/i.test(query)
        ? 'Probability'
        : /algebra|equation|solve|simplify/i.test(query)
          ? 'Algebra'
          : 'Math';

  const hints = getCompanionHints(query);

  return {
    type: 'math',
    data: {
      topic,
      prompt: query,
      badge: 'LaTeX rendering on',
      hints: hints.map(h => `${h.icon} ${h.label}`),
    },
  };
}

async function buildProfileCard(query: string): Promise<CustomCard | undefined> {
  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) return undefined;
  const payload = await response.json();
  if (!payload?.name || !payload?.summary) return undefined;
  return { type: 'profile', data: payload };
}

function buildReasoning(deepResearch: boolean, searchTriggered: boolean, provider?: string, resultCount?: number): ReasoningStep[] {
  if (!searchTriggered) return [];
  return [
    {
      id: generateUUID(),
      label: deepResearch ? 'Breaking your request into a research plan' : 'Checking the live web',
      detail: deepResearch ? 'Arcus is expanding your question into a broader research pass.' : 'Arcus detected this question benefits from fresh information.',
      status: 'complete',
    },
    {
      id: generateUUID(),
      label: `Searching with ${provider || 'Tavily'}`,
      detail: resultCount ? `${resultCount} relevant sources collected.` : 'Gathering live sources and summaries.',
      status: 'complete',
    },
    {
      id: generateUUID(),
      label: 'Synthesizing the response',
      detail: deepResearch ? 'Combining the freshest sources with a more detailed answer.' : 'Merging live context into the final answer.',
      status: 'running',
    },
  ];
}

async function fetchSearchContext(query: string, mode: 'standard' | 'deep'): Promise<SearchPayload> {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, mode }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || 'Search failed');
  }

  return response.json();
}

function normalizeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function heuristicResearchQueries(query: string, depth: 'standard' | 'deep' | 'exhaustive'): string[] {
  const variations = depth === 'exhaustive'
    ? ['latest developments', 'expert analysis', 'benchmarks or evidence', 'risks limitations', 'case studies examples']
    : depth === 'deep'
      ? ['latest developments', 'expert analysis', 'examples evidence']
      : ['latest developments'];

  return [query, ...variations.map(item => `${query} ${item}`)];
}

async function planResearchQueries(query: string, depth: 'standard' | 'deep' | 'exhaustive', modelId: string): Promise<string[]> {
  if (depth === 'standard') {
    return heuristicResearchQueries(query, depth).slice(0, 2);
  }

  try {
    const plan = await chatCompletion(
      [{
        role: 'user',
        content: `Create ${depth === 'exhaustive' ? 5 : 4} highly targeted web research sub-queries for this request. Return ONLY a valid JSON array of strings. Optimize for breadth, evidence, risks, and examples. Request: ${query}`,
      }],
      { model: modelId }
    );

    const parsed = JSON.parse(plan);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map(item => item.trim());
      if (cleaned.length > 0) return cleaned;
    }
  } catch {
    // fall back to heuristics
  }

  return heuristicResearchQueries(query, depth);
}

async function runDeepResearch(
  query: string,
  options: { modelId: string; depth: 'standard' | 'deep' | 'exhaustive'; trustedDomains: string[] }
): Promise<ResearchRunResult> {
  const queries = await planResearchQueries(query, options.depth, options.modelId);
  const limitedQueries = queries.slice(0, options.depth === 'exhaustive' ? 5 : options.depth === 'deep' ? 4 : 2);
  const gatheredSources: ResearchSource[] = [];

  for (const plannedQuery of limitedQueries) {
    const payload = await fetchSearchContext(plannedQuery, 'deep');
    payload.results.forEach(result => {
      gatheredSources.push({
        ...result,
        provider: payload.provider,
        query: plannedQuery,
      });
    });
  }

  const trustedDomains = options.trustedDomains.map(item => item.toLowerCase());
  const dedupedSources = Array.from(new Map(gatheredSources.map(source => [source.url, source])).values());
  const rankedSources = dedupedSources
    .sort((a, b) => {
      const aTrusted = trustedDomains.includes(normalizeDomain(a.url));
      const bTrusted = trustedDomains.includes(normalizeDomain(b.url));
      if (aTrusted !== bTrusted) return Number(bTrusted) - Number(aTrusted);
      return (b.score || 0) - (a.score || 0);
    })
    .slice(0, options.depth === 'exhaustive' ? 12 : 8);

  const groupedFindings = limitedQueries.map((plannedQuery, index) => {
    const matches = rankedSources.filter(source => source.query === plannedQuery).slice(0, 3);
    return `${index + 1}. ${plannedQuery}\n${matches.map((source, sourceIndex) => `  ${sourceIndex + 1}) ${source.title} — ${source.content}`).join('\n')}`;
  }).join('\n\n');

  const packet: ResearchPacket = {
    mode: 'deep',
    queries: limitedQueries,
    sources: rankedSources,
    trustedDomains: options.trustedDomains,
    brief: `Cross-checked ${rankedSources.length} sources across ${limitedQueries.length} research passes.`,
  };

  const reasoning: ReasoningStep[] = [
    { id: generateUUID(), label: 'Planning a research approach', detail: `${limitedQueries.length} sub-questions generated.`, status: 'complete' },
    { id: generateUUID(), label: 'Scanning the live web', detail: `${rankedSources.length} sources were collected and deduplicated.`, status: 'complete' },
    { id: generateUUID(), label: 'Cross-checking evidence', detail: options.trustedDomains.length ? `Prioritizing trusted domains: ${options.trustedDomains.join(', ')}` : 'Comparing overlapping sources and gaps.', status: 'complete' },
    { id: generateUUID(), label: 'Drafting a research report', detail: 'Turning the research into a structured answer with citations.', status: 'running' },
  ];

  const sourceContext = rankedSources.map((source, index) => `${index + 1}. [${source.provider}] ${source.title}\n${source.url}\n${source.content}`).join('\n\n');

  return {
    packet,
    reasoning,
    liveContext: `Research plan:\n${limitedQueries.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n\nKey findings by query:\n${groupedFindings}\n\nCurated sources:\n${sourceContext}`,
  };
}

function formatAttachmentContext(attachments: ChatAttachment[]): string {
  if (attachments.length === 0) return '';
  return attachments.map((attachment, index) => {
    const isNumericName = /^[\da-f]{16,}|^\d+$/i.test(attachment.name.replace(/\.[^.]+$/, ''));
    const sizeLabel = attachment.size >= 1024 * 1024 ? `${(attachment.size / (1024 * 1024)).toFixed(1)} MB` : attachment.size >= 1024 ? `${Math.round(attachment.size / 1024)} KB` : `${attachment.size} B`;
    const ext = attachment.name.split('.').pop()?.toUpperCase() || '';
    if (attachment.kind === 'image') {
      const label = isNumericName ? `User-uploaded photo (${ext || attachment.type}, ${sizeLabel})` : `${attachment.name} (image, ${sizeLabel})`;
      return `${index + 1}. [Image ${index + 1}] ${label}`;
    }
    return `${index + 1}. ${attachment.name} (${attachment.type || 'file'}, ${sizeLabel})`;
  }).join('\n');
}

function hasVisionImages(attachments: ChatAttachment[]): boolean {
  return attachments.some(a => a.kind === 'image' && a.previewUrl);
}

function buildVisionContent(text: string, attachments: ChatAttachment[]): string | Array<{ type: string; text?: string; image_url?: { url: string } }> {
  const imageAttachments = attachments.filter(a => a.kind === 'image' && a.previewUrl);
  if (imageAttachments.length === 0) return text;

  const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
  if (text) {
    parts.push({ type: 'text', text });
  }
  for (const att of imageAttachments) {
    if (att.previewUrl) {
      parts.push({ type: 'image_url', image_url: { url: att.previewUrl } });
    }
  }
  return parts;
}

export default function ChatView() {
  const { state, dispatch, showToast, createNewChat } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageScrollerRef = useRef<HTMLDivElement>(null);
  const shouldFollowRef = useRef(true);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [quickPromptSeed, setQuickPromptSeed] = useState(0);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const activeConv = state.conversations.find(c => c.id === state.activeChatId);
  const isEmpty = !activeConv || activeConv.messages.length === 0;
  const hasCustomBackground = Boolean(state.settings.backgroundImage?.trim());
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const sync = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);
  const isMobileChat = viewportWidth <= 640;
  const emptyHeroPaddingTop = isMobileChat ? 100 : 138;

  const syncJumpButton = useCallback(() => {
    const container = messageScrollerRef.current;
    if (!container) return true;

    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 72;
    shouldFollowRef.current = nearBottom;
    setShowJumpToBottom(!nearBottom);
    return nearBottom;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    shouldFollowRef.current = true;
    setShowJumpToBottom(false);
  }, []);

  useEffect(() => {
    if (!activeConv?.messages) return;
    if (!state.preferences.autoScrollOnStream && !shouldFollowRef.current) return;
    if (shouldFollowRef.current || state.preferences.autoScrollOnStream) {
      messagesEndRef.current?.scrollIntoView({ behavior: activeConv.messages.some(message => message.isStreaming) ? 'auto' : 'smooth' });
    }
  }, [activeConv?.messages, state.preferences.autoScrollOnStream]);

  const quickPrompts = [
    'Compare the top options and cite trade-offs',
    'Turn this into a decision memo',
    'Research the newest updates and risks',
    'Create a table with sources and recommendations',
  ].sort((a, b) => a.localeCompare(b)).slice(quickPromptSeed % 2, (quickPromptSeed % 2) + 3);
  const modelButtonTop = isMobileChat ? 76 : 24;
  const modelButtonRight = isMobileChat ? 18 : 190;

  const sendMessage = useCallback(async (content: string, meta?: { deepResearch?: boolean; attachments?: ChatAttachment[]; deviceLocation?: { latitude: number; longitude: number } | null }) => {
    const deepResearch = Boolean(meta?.deepResearch);
    const attachments = meta?.attachments || [];
    const routerDecision = isRouterModelId(state.selectedModel.id)
      ? resolveModelRoute({
          prompt: content,
          attachments,
          availableModels: state.allModels,
          deepResearch,
        })
      : null;
    const executionModel = routerDecision?.resolvedModel || state.selectedModel;
    const chatId = state.activeChatId ?? createNewChat();
    const existingConversation = state.conversations.find(c => c.id === chatId);
    const baseMessages = existingConversation?.messages || [];
    const weatherRequested = isWeatherQuery(content);
    const localWeatherRequested = weatherRequested && (isLocalWeatherQuery(content) || isGenericWeatherQuery(content));
    const profileRequested = isProfileQuery(content);
    const marketRequested = isMarketQuery(content);
    const sportsRequested = !marketRequested && isSportsQuery(content);
    const conversionRequested = !marketRequested && !sportsRequested && isConversionQuery(content);
    const travelRequested = !weatherRequested && !conversionRequested && isTravelQuery(content);
    const mathRequested = !weatherRequested && !marketRequested && !sportsRequested && !conversionRequested && !travelRequested && isMathQuery(content);
    const structuredToolRequested = weatherRequested || profileRequested || marketRequested || sportsRequested || conversionRequested || travelRequested || mathRequested;
    const routerSearchRequested = routerDecision?.routing_decision.selected_tools.includes('web-search') || false;
    const searchTriggered = state.preferences.webSearchEnabled && (deepResearch || (!weatherRequested && !structuredToolRequested && (routerDecision ? routerSearchRequested : (state.preferences.autoWebSearch && shouldAutoSearch(content)))));
    let liveContext = '';
    const routingReasoning: ReasoningStep[] = routerDecision ? [{
      id: generateUUID(),
      label: `${ROUTER_MODEL_INFO.name} → ${executionModel.name}`,
      detail: routerDecision.reasoning.why_selected,
      status: 'complete',
    }] : [];
    let reasoning: ReasoningStep[] = [...routingReasoning];
    let research: ResearchPacket | undefined;
    let customCard: CustomCard | undefined;
    let toolUsage = buildInitialToolUsage({ query: content, searchTriggered, weather: weatherRequested, profile: profileRequested, market: marketRequested, sports: sportsRequested, conversion: conversionRequested, travel: travelRequested });

    const userMsg: Message = {
      id: generateUUID(), role: 'user', content, timestamp: Date.now(), attachments,
    };
    const assistantMsg: Message = {
      id: generateUUID(), role: 'assistant', content: '', timestamp: Date.now(),
      model: executionModel, isStreaming: true,
      toolUsage,
      reasoning: searchTriggered ? [...routingReasoning, {
        id: generateUUID(),
        label: deepResearch ? 'Preparing deep research' : 'Preparing response',
        detail: deepResearch ? 'Planning sources before the answer starts streaming.' : 'Starting the model and collecting context.',
        status: 'running',
      }] : routingReasoning,
      research,
      customCard,
    };

    const optimisticMessages = [...baseMessages, userMsg, assistantMsg];
    dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { messages: optimisticMessages } });
    dispatch({ type: 'SET_ACTIVE_CHAT', id: chatId });
    dispatch({ type: 'SET_STREAMING', streaming: true });
    scrollToBottom('auto');

    if (weatherRequested) {
      const nextCard = await buildWeatherCard(content, meta?.deviceLocation).catch(() => undefined);
      if (nextCard?.type === 'weather') {
        customCard = nextCard;
        toolUsage = updateToolUsage(toolUsage, 'weather', 'complete', `Forecast loaded for ${nextCard.data.location}`);
        liveContext += `\n\nWeather data for ${nextCard.data.location}: ${nextCard.data.condition}, ${nextCard.data.temperatureC}°C (${nextCard.data.temperatureF}°F).`;
      } else {
        toolUsage = updateToolUsage(toolUsage, 'weather', 'error', 'Location permission or forecast lookup was unavailable.');
        liveContext += localWeatherRequested
          ? '\n\nWeather lookup note: Device location is unavailable. Do not guess the user\'s location or current weather. Ask the user to enable location access or provide a city name.'
          : '\n\nWeather lookup note: Forecast lookup was unavailable. Do not invent weather data. Briefly explain that the lookup failed and ask the user to retry with a city if needed.';
        if (localWeatherRequested) {
          showToast('Allow location access to get weather for your area, or mention a city directly.', 'warning');
        }
      }
    }

    if (!customCard && profileRequested) {
      const nextCard = await buildProfileCard(content).catch(() => undefined);
      if (nextCard?.type === 'profile') {
        customCard = nextCard;
        toolUsage = updateToolUsage(toolUsage, 'facts', 'complete', `Verified summary loaded for ${nextCard.data.name}`);
        liveContext += `\n\nProfile summary for ${nextCard.data.name}: ${nextCard.data.summary}`;
      } else {
        toolUsage = updateToolUsage(toolUsage, 'facts', 'error', 'Profile lookup could not be completed.');
      }
    }

    if (!customCard && marketRequested) {
      const nextCard = await buildMarketCard(content).catch(() => undefined);
      if (nextCard?.type === 'market') {
        customCard = nextCard;
        toolUsage = updateToolUsage(toolUsage, 'market', 'complete', `${nextCard.data.symbol} loaded at ${nextCard.data.price.toLocaleString()} ${nextCard.data.currency}`);
        liveContext += `\n\nMarket snapshot for ${nextCard.data.name} (${nextCard.data.symbol}): ${nextCard.data.price} ${nextCard.data.currency}, change ${nextCard.data.changePercent ?? 0}%.`;
      } else {
        toolUsage = updateToolUsage(toolUsage, 'market', 'error', 'Market data could not be loaded.');
      }
    }

    if (!customCard && sportsRequested) {
      const nextCard = await buildSportsCard(content).catch(() => undefined);
      if (nextCard?.type === 'sports') {
        customCard = nextCard;
        toolUsage = updateToolUsage(toolUsage, 'sports', 'complete', `${nextCard.data.events.length} live events loaded`);
        liveContext += `\n\nSports update for ${nextCard.data.league}: ${nextCard.data.events.map(event => `${event.awayTeam} ${event.awayScore} - ${event.homeScore} ${event.homeTeam}`).join('; ')}.`;
      } else {
        toolUsage = updateToolUsage(toolUsage, 'sports', 'error', 'Live sports data was unavailable.');
      }
    }

    if (!customCard && conversionRequested) {
      const nextCard = await buildConversionCard(content).catch(() => undefined);
      if (nextCard?.type === 'conversion') {
        customCard = nextCard;
        toolUsage = updateToolUsage(toolUsage, 'conversion', 'complete', nextCard.data.primaryResult);
        liveContext += `\n\nConversion result: ${nextCard.data.primaryResult}.`;
      } else {
        toolUsage = updateToolUsage(toolUsage, 'conversion', 'error', 'The conversion could not be parsed.');
      }
    }

    if (!customCard && travelRequested) {
      const nextCard = await buildTravelCard(content).catch(() => undefined);
      if (nextCard?.type === 'travel') {
        customCard = nextCard;
        toolUsage = updateToolUsage(toolUsage, 'travel', 'complete', `${nextCard.data.location} · ${nextCard.data.localTime}`);
        liveContext += `\n\nTravel snapshot for ${nextCard.data.location}: timezone ${nextCard.data.timezone}, local time ${nextCard.data.localTime}, coordinates ${nextCard.data.coordinates}.`;
      } else {
        toolUsage = updateToolUsage(toolUsage, 'travel', 'error', 'Could not resolve that place.');
      }
    }

    if (!customCard && mathRequested) {
      customCard = buildMathCard(content);
    }

    if (searchTriggered) {
      try {
        if (deepResearch) {
          const researchRun = await runDeepResearch(content, {
            modelId: executionModel.id,
            depth: state.preferences.researchDepth,
            trustedDomains: state.preferences.trustedDomains,
          });
          liveContext = researchRun.liveContext;
          reasoning = [...routingReasoning, ...researchRun.reasoning];
          research = { ...researchRun.packet, query: content, factChecked: researchRun.packet.sources.length > 0 };
          toolUsage = updateToolUsage(toolUsage, 'search', 'complete', `Ran ${researchRun.packet.queries.length} search passes`);
          toolUsage = updateToolUsage(toolUsage, 'results', 'complete', `${researchRun.packet.sources.length} sources ranked and fact-checked`);
        } else {
          const searchPayload = await fetchSearchContext(content, 'standard');
          const sources = searchPayload.results
            .slice(0, 4)
            .map((result, index) => `${index + 1}. ${result.title}\n${result.url}\n${result.content}`)
            .join('\n\n');
          liveContext = `Live web context from ${searchPayload.provider}:\n${searchPayload.answer ? `${searchPayload.answer}\n\n` : ''}${sources}`;
          reasoning = [...routingReasoning, ...buildReasoning(false, true, searchPayload.provider, searchPayload.results.length)];
          research = {
            mode: 'standard',
            query: content,
            queries: [content],
            sources: searchPayload.results.slice(0, 5).map(result => ({ ...result, provider: searchPayload.provider, query: content })),
            brief: `Quick web scan via ${searchPayload.provider}.`,
            trustedDomains: state.preferences.trustedDomains,
            factChecked: searchPayload.results.length > 0,
          };
          toolUsage = updateToolUsage(toolUsage, 'search', 'complete', `Searched via ${searchPayload.provider}`);
          toolUsage = updateToolUsage(toolUsage, 'results', 'complete', `${searchPayload.results.length} sources collected`);
        }
      } catch (error) {
        reasoning = [
          ...routingReasoning,
          {
            id: generateUUID(),
            label: 'Live search unavailable',
            detail: error instanceof Error ? error.message : 'Arcus could not fetch the live web context.',
            status: 'error',
          },
        ];
        toolUsage = updateToolUsage(toolUsage, 'search', 'error', error instanceof Error ? error.message : 'Search unavailable');
        toolUsage = updateToolUsage(toolUsage, 'results', 'error', 'No search results available');
      }
    }

    const preparedMessages = [...baseMessages, userMsg, { ...assistantMsg, reasoning, research, customCard, toolUsage }];
    dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { messages: preparedMessages } });

    const apiMessages = preparedMessages
      .filter(m => m.role !== 'system' && !m.isStreaming)
      .map(m => {
        if (m.attachments?.length && hasVisionImages(m.attachments)) {
          return {
            role: m.role,
            content: buildVisionContent(
              m.content || '(no text provided)',
              m.attachments
            ),
          };
        }
        return {
          role: m.role,
          content: m.attachments?.length
            ? `${m.content || '(no text provided)'}\n\nAttached files:\n${formatAttachmentContext(m.attachments)}`
            : m.content,
        };
      });

    if (state.chatSettings.systemPrompt) {
      apiMessages.unshift({ role: 'system', content: state.chatSettings.systemPrompt });
    }
    if (routerDecision?.model_instructions.suggested_system_prompt_additions) {
      apiMessages.unshift({ role: 'system', content: routerDecision.model_instructions.suggested_system_prompt_additions });
    }
    if (customCard) {
      apiMessages.unshift({ role: 'system', content: 'A structured Arcus companion card is shown with this answer. Keep the response concise and natural unless the user asked for depth. Do not dump raw JSON, API payloads, or boilerplate like “according to the live web context”. Do not list a wall of links unless the user explicitly asks.' });
    }
    if (customCard?.type === 'weather') {
      apiMessages.unshift({ role: 'system', content: 'A weather card is already visible. Reply with only the weather summary in 1-3 short sentences. Do not mention websites, sources, live web context, or suggest other sites unless the user explicitly asks.' });
    }
    apiMessages.unshift({ role: 'system', content: `Response style: ${state.preferences.responseStyle}.` });
    if (isMathQuery(content)) {
      apiMessages.unshift({ role: 'system', content: 'When answering math, format equations with LaTeX using inline $...$ and display $$...$$ blocks. Render fractions with \\frac{a}{b}, use symbols like \\leq, \\geq, \\times, and \\approx where appropriate, and prefer aligned step-by-step transformations over plain ASCII math.' });
    }
    if (deepResearch) {
      apiMessages.unshift({ role: 'system', content: 'Produce a genuine research report with these sections when helpful: Executive summary, Key findings, Recommendations, Risks or caveats, and Sources referenced. Ground claims in the provided research context and cite source titles naturally in the prose.' });
    }
    if (state.memory.enabled && state.memory.items.length > 0) {
      const memoryPrompt = 'The user has shared these facts about themselves: ' + state.memory.items.map(i => i.text).join('; ');
      apiMessages.unshift({ role: 'system', content: memoryPrompt });
    }
    if (liveContext) {
      apiMessages.unshift({ role: 'system', content: `Use this fresh web context when relevant. Cite sources naturally and do not invent details.\n\n${liveContext}` });
    }

    const assistantId = assistantMsg.id;

    await streamChatCompletion(
      apiMessages,
      {
        model: executionModel.id,
        runtime: executionModel.runtime,
        availableModels: state.allModels,
        temperature: routerDecision?.model_instructions.suggested_temperature ?? state.chatSettings.temperature,
        maxTokens: routerDecision?.model_instructions.suggested_max_tokens ?? state.chatSettings.maxTokens,
        topP: state.chatSettings.topP,
        frequencyPenalty: state.chatSettings.frequencyPenalty,
        presencePenalty: state.chatSettings.presencePenalty,
      },
      {
        onChunk: (_delta, full) => {
          const runningReasoning: ReasoningStep[] = reasoning.map((step, index) => index === reasoning.length - 1 ? { ...step, status: 'running' as const } : step);
          dispatch({
            type: 'UPDATE_CONVERSATION', id: chatId,
            updates: {
              messages: preparedMessages.map(m => m.id === assistantId ? {
                ...m,
                content: full,
                reasoning: runningReasoning,
                research,
                customCard,
                toolUsage,
              } : m),
            },
          });
        },
        onDone: (full) => {
          const completeReasoning: ReasoningStep[] = reasoning.map((step, index) => index === reasoning.length - 1 ? { ...step, status: 'complete' as const } : step);
          const finalMessages = preparedMessages.map(m =>
            m.id === assistantId ? {
              ...m,
              content: full,
              isStreaming: false,
              reasoning: completeReasoning,
              research,
              customCard,
              toolUsage,
            } : m
          );
          dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { messages: finalMessages } });
          dispatch({ type: 'SET_STREAMING', streaming: false });
          dispatch({ type: 'TRACK_REQUEST', modelId: executionModel.id, tokens: Math.ceil(full.length / 4) });

          // Auto-title after first response
          const convNow = state.conversations.find(c => c.id === chatId);
          if (convNow && convNow.title === 'New Chat') {
            chatCompletion(
              [{ role: 'user', content: `Summarize in 5 words or less: ${content}` }],
              { model: executionModel.id, runtime: executionModel.runtime, availableModels: state.allModels }
            ).then(title => {
              if (title) dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { title: title.trim().replace(/^"|"$/g, '') } });
            }).catch(() => {});
          }
        },
        onError: (error) => {
          const finalMessages = preparedMessages.map(m =>
            m.id === assistantId ? { ...m, content: `Error: ${error}`, isStreaming: false, research } : m
          );
          dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { messages: finalMessages } });
          dispatch({ type: 'SET_STREAMING', streaming: false });
          showToast(error, 'error');
        },
      }
    );
    setQuickPromptSeed(seed => seed + 1);
  }, [state, dispatch, showToast, createNewChat, scrollToBottom]);

  const retryAssistantMessage = useCallback((assistantId: string) => {
    if (!activeConv) return;
    const assistantIndex = activeConv.messages.findIndex(message => message.id === assistantId);
    if (assistantIndex <= 0) return;

    for (let index = assistantIndex - 1; index >= 0; index -= 1) {
      const previousMessage = activeConv.messages[index];
      if (previousMessage.role === 'user') {
        void sendMessage(previousMessage.content, {
          deepResearch: activeConv.messages[assistantIndex].research?.mode === 'deep',
          attachments: previousMessage.attachments,
        });
        break;
      }
    }
  }, [activeConv, sendMessage]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div className="chat-scene">
        {hasCustomBackground ? <div className="chat-scene__image" style={{ backgroundImage: `url(${state.settings.backgroundImage})` }} /> : null}
        <div className="chat-scene__mesh" />
        <div className="chat-scene__shapes">
          <span className="chat-scene__shape chat-scene__shape--one" />
          <span className="chat-scene__shape chat-scene__shape--two" />
          <span className="chat-scene__shape chat-scene__shape--three" />
          <span className="chat-scene__shape chat-scene__shape--four" />
        </div>
      </div>

      {/* Aurora */}
      {isEmpty && <AuroraBackground />}

      {/* Model selector button */}
      <button onMouseDown={event => event.stopPropagation()} onClick={() => setShowModelSelector(value => !value)} style={{
        position: 'fixed', top: modelButtonTop, right: modelButtonRight, zIndex: 70,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1,
        padding: isMobileChat ? '8px 12px' : '8px 14px',
        minWidth: isMobileChat ? 146 : 152,
        maxWidth: isMobileChat ? 'min(280px, calc(100vw - 36px))' : 'min(240px, calc(100vw - 280px))',
        background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(28px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
        cursor: 'pointer', transition: 'all var(--dur-fast) var(--ease-out)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
        fontFamily: 'inherit',
      }}>
        <span style={{ fontWeight: 500, color: '#fff', fontSize: 13 }}>{state.selectedModel.name}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{state.selectedModel.provider} ▾</span>
      </button>

      {showModelSelector && <ModelSelector onClose={() => setShowModelSelector(false)} />}

      {/* Greeting */}
      {isEmpty && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          paddingTop: emptyHeroPaddingTop, paddingBottom: 210, paddingInline: 20,
          textAlign: 'center', zIndex: 1,
          animation: 'msgIn 600ms var(--ease-out) forwards', animationDelay: '200ms',
          opacity: 0,
        }}>
          <div style={{ maxWidth: 860, width: '100%' }}>
            {/* Diamond accent */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 48, height: 48, borderRadius: 16, marginBottom: 20,
              background: 'linear-gradient(135deg, rgba(91,138,240,0.18), rgba(155,109,255,0.14))',
              border: '1px solid rgba(91,138,240,0.25)',
              boxShadow: '0 4px 24px rgba(91,138,240,0.18)',
              fontSize: 22,
            }}>◆</div>
            <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1.15, margin: 0 }}>
              {(() => {
                const h = new Date().getHours();
                const name = state.user?.username?.split(' ')[0];
                const time = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
                return name ? `${time}, ${name}.` : `${time}.`;
              })()}
            </h1>
            <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 400, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6, maxWidth: 520, margin: '10px auto 0' }}>
              What would you like to explore today?
            </p>
          </div>
        </div>
      )}

      {isEmpty && (
        <div style={{
          position: 'absolute', top: emptyHeroPaddingTop + 106, left: '50%', transform: 'translateX(-50%)', zIndex: 2,
          display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 'min(860px, calc(100vw - 40px))',
        }}>
          {quickPrompts.map(prompt => (
            <button key={prompt} onClick={() => sendMessage(prompt, { deepResearch: /research|table|compare|memo/i.test(prompt) })} style={{
              padding: '10px 14px', borderRadius: 18,
              background: 'rgba(18,24,34,0.7)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
              boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
            }}>
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {!isEmpty && (
        <div ref={messageScrollerRef} onScroll={syncJumpButton} style={{
          position: 'absolute', top: isMobileChat ? 124 : 88, bottom: isMobileChat ? 120 : 144, left: 0, right: 0,
          overflowY: 'auto', padding: state.preferences.compactChatSpacing ? 'clamp(12px, 2vw, 18px) clamp(12px, 4vw, 42px) 36px' : 'clamp(14px, 3vw, 28px) clamp(14px, 5vw, 56px) 48px', display: 'flex', flexDirection: 'column', gap: state.preferences.compactChatSpacing ? 10 : 16,
          scrollBehavior: 'smooth',
        }}>
          {activeConv?.messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} showTimestamp={state.preferences.showTimestamps} onRetry={msg.role === 'assistant' ? () => retryAssistantMessage(msg.id) : undefined} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {!isEmpty && showJumpToBottom && (
        <button onClick={() => scrollToBottom('smooth')} style={{
          position: 'absolute', left: '50%', bottom: isMobileChat ? 105 : 126, transform: 'translateX(-50%)', zIndex: 12,
          width: 44, height: 44, borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(18,22,30,0.92)', color: '#fff', cursor: 'pointer',
          boxShadow: '0 16px 42px rgba(0,0,0,0.28)', fontSize: 18,
        }}>↓</button>
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
