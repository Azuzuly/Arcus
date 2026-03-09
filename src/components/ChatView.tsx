'use client';

import { useStore } from '@/lib/store';
import { useRef, useEffect, useCallback, useState } from 'react';
import { streamChatCompletion, chatCompletion } from '@/lib/openrouter';
import { generateUUID } from '@/lib/utils';
import { ChatAttachment, Message, ReasoningStep, ResearchPacket, ResearchSource } from '@/lib/types';
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
  return attachments.map((attachment, index) => `${index + 1}. ${attachment.name} (${attachment.kind}, ${attachment.type || 'unknown'}, ${attachment.size} bytes)`).join('\n');
}

export default function ChatView() {
  const { state, dispatch, showToast } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [quickPromptSeed, setQuickPromptSeed] = useState(0);

  const activeConv = state.conversations.find(c => c.id === state.activeChatId);
  const isEmpty = !activeConv || activeConv.messages.length === 0;
  const emptyHeroPaddingTop = 138;
  const lastMessageContent = activeConv?.messages?.[activeConv?.messages.length - 1]?.content;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages?.length, lastMessageContent]);

  const quickPrompts = [
    'Compare the top options and cite trade-offs',
    'Turn this into a decision memo',
    'Research the newest updates and risks',
    'Create a table with sources and recommendations',
  ].sort((a, b) => a.localeCompare(b)).slice(quickPromptSeed % 2, (quickPromptSeed % 2) + 3);

  const sendMessage = useCallback(async (content: string, meta?: { deepResearch?: boolean; attachments?: ChatAttachment[] }) => {
    if (!state.activeChatId) return;

    const deepResearch = Boolean(meta?.deepResearch);
    const attachments = meta?.attachments || [];
    const searchTriggered = state.preferences.webSearchEnabled && (deepResearch || (state.preferences.autoWebSearch && shouldAutoSearch(content)));
    let liveContext = '';
    let reasoning: ReasoningStep[] = [];
    let research: ResearchPacket | undefined;

    if (searchTriggered) {
      try {
        if (deepResearch) {
          const researchRun = await runDeepResearch(content, {
            modelId: state.selectedModel.id,
            depth: state.preferences.researchDepth,
            trustedDomains: state.preferences.trustedDomains,
          });
          liveContext = researchRun.liveContext;
          reasoning = researchRun.reasoning;
          research = researchRun.packet;
        } else {
          const searchPayload = await fetchSearchContext(content, 'standard');
          const sources = searchPayload.results
            .slice(0, 4)
            .map((result, index) => `${index + 1}. ${result.title}\n${result.url}\n${result.content}`)
            .join('\n\n');
          liveContext = `Live web context from ${searchPayload.provider}:\n${searchPayload.answer ? `${searchPayload.answer}\n\n` : ''}${sources}`;
          reasoning = buildReasoning(false, true, searchPayload.provider, searchPayload.results.length);
          research = {
            mode: 'standard',
            queries: [content],
            sources: searchPayload.results.slice(0, 5).map(result => ({ ...result, provider: searchPayload.provider, query: content })),
            brief: `Quick web scan via ${searchPayload.provider}.`,
            trustedDomains: state.preferences.trustedDomains,
          };
        }
      } catch (error) {
        reasoning = [
          {
            id: generateUUID(),
            label: 'Live search unavailable',
            detail: error instanceof Error ? error.message : 'Arcus could not fetch the live web context.',
            status: 'error',
          },
        ];
      }
    }

    const userMsg: Message = {
      id: generateUUID(), role: 'user', content, timestamp: Date.now(), attachments,
    };
    const assistantMsg: Message = {
      id: generateUUID(), role: 'assistant', content: '', timestamp: Date.now(),
      model: state.selectedModel, isStreaming: true,
      reasoning,
      research,
    };

    const conv = state.conversations.find(c => c.id === state.activeChatId);
    if (!conv) return;
    const updatedMessages = [...conv.messages, userMsg, assistantMsg];

    dispatch({ type: 'UPDATE_CONVERSATION', id: state.activeChatId, updates: { messages: updatedMessages } });
    dispatch({ type: 'SET_STREAMING', streaming: true });

    const apiMessages = updatedMessages
      .filter(m => m.role !== 'system' && !m.isStreaming)
      .map(m => ({
        role: m.role,
        content: m.attachments?.length
          ? `${m.content || '(no text provided)'}\n\nAttached files:\n${formatAttachmentContext(m.attachments)}`
          : m.content,
      }));

    if (state.chatSettings.systemPrompt) {
      apiMessages.unshift({ role: 'system', content: state.chatSettings.systemPrompt });
    }
    apiMessages.unshift({ role: 'system', content: `Response style: ${state.preferences.responseStyle}.` });
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

    const chatId = state.activeChatId;
    const assistantId = assistantMsg.id;

    await streamChatCompletion(
      apiMessages,
      {
        model: state.selectedModel.id,
        runtime: state.selectedModel.runtime,
        temperature: state.chatSettings.temperature,
        maxTokens: state.chatSettings.maxTokens,
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
              messages: updatedMessages.map(m => m.id === assistantId ? {
                ...m,
                content: full,
                reasoning: runningReasoning,
                research,
              } : m),
            },
          });
        },
        onDone: (full) => {
          const completeReasoning: ReasoningStep[] = reasoning.map((step, index) => index === reasoning.length - 1 ? { ...step, status: 'complete' as const } : step);
          const finalMessages = updatedMessages.map(m =>
            m.id === assistantId ? {
              ...m,
              content: full,
              isStreaming: false,
              reasoning: completeReasoning,
              research,
            } : m
          );
          dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { messages: finalMessages } });
          dispatch({ type: 'SET_STREAMING', streaming: false });
          dispatch({ type: 'TRACK_REQUEST', modelId: state.selectedModel.id, tokens: Math.ceil(full.length / 4) });

          // Auto-title after first response
          const convNow = state.conversations.find(c => c.id === chatId);
          if (convNow && convNow.title === 'New Chat') {
            chatCompletion(
              [{ role: 'user', content: `Summarize in 5 words or less: ${content}` }],
              { model: state.selectedModel.id, runtime: state.selectedModel.runtime }
            ).then(title => {
              if (title) dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { title: title.trim().replace(/^"|"$/g, '') } });
            }).catch(() => {});
          }
        },
        onError: (error) => {
          const finalMessages = updatedMessages.map(m =>
            m.id === assistantId ? { ...m, content: `Error: ${error}`, isStreaming: false, research } : m
          );
          dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { messages: finalMessages } });
          dispatch({ type: 'SET_STREAMING', streaming: false });
          showToast(error, 'error');
        },
      }
    );
    setQuickPromptSeed(seed => seed + 1);
  }, [state, dispatch, showToast]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Aurora */}
      {isEmpty && <AuroraBackground />}

      {/* Model selector button */}
      <button onClick={() => setShowModelSelector(!showModelSelector)} style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        padding: '8px 18px 8px 15px',
        minWidth: 180,
        background: 'rgba(20,24,34,0.78)', backdropFilter: 'blur(26px) saturate(140%)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-pill)',
        cursor: 'pointer', transition: 'all var(--dur-fast) var(--ease-out)',
        boxShadow: '0 10px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)',
        fontFamily: 'inherit',
      }}>
        <span style={{ fontWeight: 500, color: '#fff', fontSize: 14 }}>{state.selectedModel.name}</span>
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
                const name = state.user?.name?.split(' ')[0];
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
        <div style={{
          position: 'absolute', top: 70, bottom: 130, left: 0, right: 0,
          overflowY: 'auto', padding: 'clamp(14px, 2vw, 24px)', display: 'flex', flexDirection: 'column', gap: 16,
          scrollBehavior: 'smooth',
        }}>
          {activeConv?.messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
