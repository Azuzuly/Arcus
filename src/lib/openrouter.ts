/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModelInfo } from './types';

function getPuter(): any {
  if (typeof window !== 'undefined' && (window as any).puter) {
    return (window as any).puter;
  }
  return null;
}

function normalizeProviderName(providerKey: string): string {
  const names: Record<string, string> = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
    deepseek: 'DeepSeek',
    'meta-llama': 'Meta',
    'x-ai': 'xAI',
    mistralai: 'Mistral',
    cohere: 'Cohere',
    qwen: 'Qwen',
  };

  return names[providerKey] || providerKey.charAt(0).toUpperCase() + providerKey.slice(1);
}

function toModelInfo(raw: any): ModelInfo | null {
  const id = String(raw?.id || raw?.name || raw?.model || '').trim();
  if (!id) return null;

  const providerKey = String(raw?.provider || raw?.owned_by || raw?.organization || id.split('/')[0] || 'puter').toLowerCase();
  const name = String(raw?.display_name || raw?.name || id.split('/').pop() || id)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());

  return {
    id,
    name,
    runtime: 'puter',
    description: typeof raw?.description === 'string' ? raw.description : undefined,
    created: typeof raw?.created === 'number' ? raw.created : 0,
    context_length: Number(raw?.context_length || raw?.contextWindow || raw?.max_context_tokens || 0) || undefined,
    pricing: {
      prompt: raw?.pricing?.prompt?.toString?.() || raw?.input_cost?.toString?.() || raw?.pricing?.input?.toString?.(),
      completion: raw?.pricing?.completion?.toString?.() || raw?.output_cost?.toString?.() || raw?.pricing?.output?.toString?.(),
    },
    top_provider: {
      max_completion_tokens: Number(raw?.top_provider?.max_completion_tokens || raw?.max_output_tokens || raw?.max_completion_tokens || 0) || undefined,
    },
    architecture: {
      input_modalities: Array.isArray(raw?.architecture?.input_modalities) ? raw.architecture.input_modalities : Array.isArray(raw?.input_modalities) ? raw.input_modalities : ['text'],
      output_modalities: Array.isArray(raw?.architecture?.output_modalities) ? raw.architecture.output_modalities : Array.isArray(raw?.output_modalities) ? raw.output_modalities : ['text'],
      modality: raw?.architecture?.modality || raw?.modality,
    },
    provider: normalizeProviderName(providerKey),
  } as ModelInfo;
}

function normalizeOpenRouterModel(raw: any): ModelInfo | null {
  const id = String(raw?.id || '').trim();
  if (!id) return null;

  const providerKey = id.split('/')[0]?.toLowerCase() || 'openrouter';

  return {
    id,
    name: String(raw?.name || id.split('/').pop() || id).replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
    runtime: 'openrouter',
    description: typeof raw?.description === 'string' ? raw.description : undefined,
    created: typeof raw?.created === 'number' ? raw.created : 0,
    context_length: Number(raw?.context_length || raw?.contextWindow || raw?.top_provider?.context_length || 0) || undefined,
    pricing: {
      prompt: raw?.pricing?.prompt?.toString?.(),
      completion: raw?.pricing?.completion?.toString?.(),
    },
    top_provider: {
      max_completion_tokens: Number(raw?.top_provider?.max_completion_tokens || 0) || undefined,
    },
    architecture: {
      input_modalities: Array.isArray(raw?.architecture?.input_modalities) ? raw.architecture.input_modalities : ['text'],
      output_modalities: Array.isArray(raw?.architecture?.output_modalities) ? raw.architecture.output_modalities : ['text'],
      modality: raw?.architecture?.modality,
    },
    provider: normalizeProviderName(providerKey),
  } as ModelInfo;
}

async function fetchOpenRouterModels(): Promise<ModelInfo[]> {
  try {
    const response = await fetch('/api/models', { cache: 'no-store' });
    if (!response.ok) return [];
    const payload = await response.json();
    const models = Array.isArray(payload?.models) ? payload.models : [];
    return models.map(normalizeOpenRouterModel).filter((model: ModelInfo | null): model is ModelInfo => Boolean(model));
  } catch {
    return [];
  }
}

async function tryGetPuterModelDirectory(p: any): Promise<ModelInfo[] | null> {
  const candidates = [
    async () => p?.ai?.models?.list?.(),
    async () => p?.ai?.listModels?.(),
    async () => p?.ai?.getModels?.(),
    async () => p?.models?.list?.(),
    async () => p?.ai?.models,
  ];

  for (const candidate of candidates) {
    try {
      const result = await candidate();
      const maybeArray = Array.isArray(result)
        ? result
        : Array.isArray(result?.models)
          ? result.models
          : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.items)
              ? result.items
              : null;

      if (!maybeArray) continue;

      const normalized = maybeArray.map(toModelInfo).filter((model: ModelInfo | null): model is ModelInfo => Boolean(model));
      if (normalized.length > 0) {
        return normalized;
      }
    } catch {
      // try next puter surface
    }
  }

  return null;
}

// ── Model list (fetched from Puter/OpenRouter directory) ──
const CURATED_MODELS: ModelInfo[] = [
  // Anthropic
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', created: 0, context_length: 200000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '15', completion: '75' }, top_provider: { max_completion_tokens: 32000 }, description: 'Anthropic\'s most powerful model. Exceptional at complex reasoning, analysis, and creative tasks.' },
  { id: 'anthropic/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', created: 0, context_length: 200000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '3', completion: '15' }, top_provider: { max_completion_tokens: 64000 }, description: 'Near-flagship performance in coding and agentic tasks at a fraction of Opus cost.' },
  { id: 'anthropic/claude-haiku-3.5', name: 'Claude Haiku 3.5', created: 0, context_length: 200000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.8', completion: '4' }, top_provider: { max_completion_tokens: 8192 }, description: 'Fast, affordable model for quick tasks and high-volume workloads.' },
  // OpenAI
  { id: 'openai/gpt-5.4', name: 'GPT-5.4', created: 0, context_length: 1050000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '2.5', completion: '15' }, top_provider: { max_completion_tokens: 32000 }, description: 'OpenAI\'s latest frontier model with 1M context, computer-use, and improved coding.' },
  { id: 'openai/gpt-5.4-pro', name: 'GPT-5.4 Pro', created: 0, context_length: 1050000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '30', completion: '180' }, top_provider: { max_completion_tokens: 64000 }, description: 'Higher-compute GPT-5.4 for the most complex tasks. Smarter and more precise.' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.1', completion: '0.4' }, top_provider: { max_completion_tokens: 16000 }, description: 'Ultra-fast and cheap for simple tasks.' },
  // Google
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', created: 0, context_length: 1000000, architecture: { input_modalities: ['text', 'image', 'video', 'audio'], output_modalities: ['text'] }, pricing: { prompt: '2', completion: '12' }, top_provider: { max_completion_tokens: 65536 }, description: 'Google\'s most advanced reasoning model with 1M context and multimodal input.' },
  { id: 'google/gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite', created: 0, context_length: 1000000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.25', completion: '1.5' }, top_provider: { max_completion_tokens: 32000 }, description: 'Fastest Gemini model. 2.5x faster than 2.5 Flash for high-volume tasks.' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', created: 0, context_length: 1000000, architecture: { input_modalities: ['text', 'image', 'video', 'audio'], output_modalities: ['text'] }, pricing: { prompt: '1.25', completion: '10' }, top_provider: { max_completion_tokens: 65536 }, description: 'Strong multimodal reasoning with native audio and video understanding.' },
  // DeepSeek
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.55', completion: '2.19' }, top_provider: { max_completion_tokens: 128000 }, description: 'Open-source reasoning model competitive with o1 and o3-mini.' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.27', completion: '1.1' }, top_provider: { max_completion_tokens: 128000 }, description: 'Strong general-purpose model at extremely competitive pricing.' },
  // Meta
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', created: 0, context_length: 1000000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.2', completion: '0.6' }, top_provider: { max_completion_tokens: 128000 }, description: 'Meta\'s flagship open model with 1M context and vision. Free and open-source.' },
  { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', created: 0, context_length: 512000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.15', completion: '0.4' }, top_provider: { max_completion_tokens: 128000 }, description: 'Lightweight Llama 4 with 512K context and vision capabilities.' },
  // Qwen
  { id: 'qwen/qwen3.5-27b', name: 'Qwen 3.5 27B', created: 0, context_length: 262000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.2', completion: '1.56' }, top_provider: { max_completion_tokens: 32000 }, description: 'Dense model matching GPT-5 mini on SWE-bench. Open weight under Apache 2.0.' },
  // Mistral
  { id: 'mistralai/mistral-large-2', name: 'Mistral Large 2', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '2', completion: '6' }, top_provider: { max_completion_tokens: 128000 }, description: 'Mistral\'s flagship model for complex reasoning and multilingual tasks.' },
  // xAI
  { id: 'x-ai/grok-3', name: 'Grok 3', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '3', completion: '15' }, top_provider: { max_completion_tokens: 131072 }, description: 'xAI\'s frontier model with strong reasoning and real-time knowledge.' },
  // Cohere
  { id: 'cohere/command-a', name: 'Command A', created: 0, context_length: 256000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '2.5', completion: '10' }, top_provider: { max_completion_tokens: 8000 }, description: 'Enterprise-grade model optimized for RAG and business tasks.' },
];

export async function fetchModels(): Promise<ModelInfo[]> {
  const p = getPuter();
  const liveModels = p ? await tryGetPuterModelDirectory(p) : null;
  const openRouterModels = await fetchOpenRouterModels();

  return [...(liveModels || []), ...openRouterModels, ...CURATED_MODELS.map(model => ({ ...model, runtime: model.runtime || 'puter' as const }))]
    .reduce<ModelInfo[]>((acc, model) => {
      if (acc.some(existing => existing.id === model.id)) return acc;
      acc.push(model);
      return acc;
    }, [])
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface StreamCallbacks {
  onChunk: (delta: string, full: string) => void;
  onDone: (full: string) => void;
  onError: (error: string) => void;
}

async function streamOpenRouterCompletion(
  messages: { role: string; content: string }[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  },
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, options, stream: true }),
    signal,
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({}));
    callbacks.onError(payload?.error || 'OpenRouter request failed');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (!text) continue;
    fullContent += text;
    callbacks.onChunk(text, fullContent);
  }

  callbacks.onDone(fullContent);
}

async function openRouterChatCompletion(
  messages: { role: string; content: string }[],
  options: { model?: string }
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, options, stream: false }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || 'OpenRouter request failed');
  }

  const payload = await response.json();
  return String(payload?.content || '');
}

export async function streamChatCompletion(
  messages: { role: string; content: string }[],
  options: {
    model?: string;
    runtime?: 'puter' | 'openrouter';
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  },
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  if (options.runtime === 'openrouter') {
    await streamOpenRouterCompletion(
      messages,
      options,
      callbacks,
      signal
    );
    return;
  }

  const p = getPuter();
  if (!p) {
    await streamOpenRouterCompletion(messages, options, callbacks, signal);
    return;
  }

  try {
    const puterMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const puterOptions: any = {
      model: options.model || 'anthropic/claude-opus-4',
      stream: true,
    };
    if (options.temperature !== undefined) puterOptions.temperature = options.temperature;
    if (options.maxTokens !== undefined) puterOptions.max_tokens = options.maxTokens;

    const response = await p.ai.chat(puterMessages, { ...puterOptions });

    let fullContent = '';

    if (signal?.aborted) return;

    // Puter streaming returns an async iterable
    for await (const chunk of response) {
      if (signal?.aborted) return;
      const text = chunk?.text || chunk?.toString?.() || '';
      if (text) {
        fullContent += text;
        callbacks.onChunk(text, fullContent);
      }
    }
    callbacks.onDone(fullContent);
  } catch (err: any) {
    if (err?.name === 'AbortError') return;
    try {
      await streamOpenRouterCompletion(messages, options, callbacks, signal);
    } catch {
      callbacks.onError(err?.message || 'Unknown error');
    }
  }
}

export async function chatCompletion(
  messages: { role: string; content: string }[],
  options: { model?: string; runtime?: 'puter' | 'openrouter' }
): Promise<string> {
  if (options.runtime === 'openrouter') {
    return openRouterChatCompletion(messages, { model: options.model });
  }

  const p = getPuter();
  if (!p) {
    return openRouterChatCompletion(messages, options);
  }

  try {
    const puterMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const response = await p.ai.chat(puterMessages, {
      model: options.model || 'anthropic/claude-opus-4',
    });

    return response?.message?.content || response?.toString?.() || '';
  } catch {
    return openRouterChatCompletion(messages, options);
  }
}

// Legacy: test API key (no longer needed with Puter, always returns true)
export async function testApiKey(): Promise<boolean> {
  return true;
}
