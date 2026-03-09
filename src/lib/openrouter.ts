/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModelInfo } from './types';
import { isRouterModelId, resolveModelRoute, ROUTER_MODEL_INFO } from './modelRouter';

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
    openrouter: 'OpenRouter',
    google: 'Google',
    deepseek: 'DeepSeek',
    'meta-llama': 'Meta',
    'x-ai': 'xAI',
    mistralai: 'Mistral',
    cohere: 'Cohere',
    qwen: 'Qwen',
    ai21: 'AI21',
  };

  return names[providerKey] || providerKey.charAt(0).toUpperCase() + providerKey.slice(1);
}

function toNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function toTokenPrice(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  return String(value);
}

function mergeRuntimeSets(a?: Array<'puter' | 'openrouter'>, b?: Array<'puter' | 'openrouter'>): Array<'puter' | 'openrouter'> | undefined {
  const merged = Array.from(new Set([...(a || []), ...(b || [])]));
  return merged.length ? merged : undefined;
}

function chooseRuntime(current?: 'puter' | 'openrouter', incoming?: 'puter' | 'openrouter'): 'puter' | 'openrouter' | undefined {
  if (current === 'puter' || incoming === 'puter') return 'puter';
  return current || incoming;
}

function mergeModels(existing: ModelInfo | undefined, incoming: ModelInfo): ModelInfo {
  if (!existing) return incoming;

  return {
    ...existing,
    ...incoming,
    provider: incoming.provider || existing.provider,
    runtime: chooseRuntime(existing.runtime, incoming.runtime),
    availableRuntimes: mergeRuntimeSets(existing.availableRuntimes, incoming.availableRuntimes),
    description: existing.description && existing.description.length >= (incoming.description || '').length ? existing.description : incoming.description || existing.description,
    context_length: existing.context_length || incoming.context_length,
    openness: incoming.openness || existing.openness,
    intelligenceIndex: existing.intelligenceIndex || incoming.intelligenceIndex,
    latencySeconds: existing.latencySeconds || incoming.latencySeconds,
    speedTokensPerSecond: existing.speedTokensPerSecond || incoming.speedTokensPerSecond,
    priceBlended: existing.priceBlended || incoming.priceBlended,
    pricing: {
      prompt: existing.pricing?.prompt || incoming.pricing?.prompt,
      completion: existing.pricing?.completion || incoming.pricing?.completion,
    },
    top_provider: {
      max_completion_tokens: existing.top_provider?.max_completion_tokens || incoming.top_provider?.max_completion_tokens,
    },
    architecture: {
      input_modalities: existing.architecture?.input_modalities?.length ? existing.architecture.input_modalities : incoming.architecture?.input_modalities,
      output_modalities: existing.architecture?.output_modalities?.length ? existing.architecture.output_modalities : incoming.architecture?.output_modalities,
      modality: existing.architecture?.modality || incoming.architecture?.modality,
    },
  };
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
    provider: normalizeProviderName(providerKey),
    runtime: 'puter',
    availableRuntimes: ['puter'],
    description: typeof raw?.description === 'string' ? raw.description : undefined,
    created: typeof raw?.created === 'number' ? raw.created : 0,
    context_length: toNumber(raw?.context_length || raw?.contextWindow || raw?.max_context_tokens),
    pricing: {
      prompt: toTokenPrice(raw?.pricing?.prompt || raw?.input_cost || raw?.pricing?.input),
      completion: toTokenPrice(raw?.pricing?.completion || raw?.output_cost || raw?.pricing?.output),
    },
    top_provider: {
      max_completion_tokens: toNumber(raw?.top_provider?.max_completion_tokens || raw?.max_output_tokens || raw?.max_completion_tokens),
    },
    architecture: {
      input_modalities: Array.isArray(raw?.architecture?.input_modalities) ? raw.architecture.input_modalities : Array.isArray(raw?.input_modalities) ? raw.input_modalities : ['text'],
      output_modalities: Array.isArray(raw?.architecture?.output_modalities) ? raw.architecture.output_modalities : Array.isArray(raw?.output_modalities) ? raw.output_modalities : ['text'],
      modality: raw?.architecture?.modality || raw?.modality,
    },
  } as ModelInfo;
}

function normalizeOpenRouterModel(raw: any): ModelInfo | null {
  const id = String(raw?.id || '').trim();
  if (!id) return null;

  const providerKey = id.split('/')[0]?.toLowerCase() || 'openrouter';

  return {
    id,
    name: String(raw?.name || id.split('/').pop() || id).replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
    provider: normalizeProviderName(providerKey),
    runtime: 'openrouter',
    availableRuntimes: ['openrouter'],
    description: typeof raw?.description === 'string' ? raw.description : undefined,
    created: typeof raw?.created === 'number' ? raw.created : 0,
    context_length: toNumber(raw?.context_length || raw?.contextWindow || raw?.top_provider?.context_length),
    pricing: {
      prompt: toTokenPrice(raw?.pricing?.prompt),
      completion: toTokenPrice(raw?.pricing?.completion),
    },
    top_provider: {
      max_completion_tokens: toNumber(raw?.top_provider?.max_completion_tokens),
    },
    architecture: {
      input_modalities: Array.isArray(raw?.architecture?.input_modalities) ? raw.architecture.input_modalities : ['text'],
      output_modalities: Array.isArray(raw?.architecture?.output_modalities) ? raw.architecture.output_modalities : ['text'],
      modality: raw?.architecture?.modality,
    },
    priceBlended: toNumber(raw?.pricing?.prompt) && toNumber(raw?.pricing?.completion)
      ? ((Number(raw.pricing.prompt) * 3) + Number(raw.pricing.completion)) / 4
      : undefined,
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
  // ── Anthropic ──────────────────────────────────────────────────────────
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 200000, speedTokensPerSecond: 25, latencySeconds: 1.7, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '15', completion: '75' }, top_provider: { max_completion_tokens: 32000 }, description: 'Anthropic\'s most powerful model. Exceptional at complex reasoning, analysis, and creative tasks.' },
  { id: 'anthropic/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 200000, speedTokensPerSecond: 67, latencySeconds: 7.8, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '3', completion: '15' }, top_provider: { max_completion_tokens: 64000 }, description: 'Near-flagship performance in coding and agentic tasks at a fraction of Opus cost.' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 200000, speedTokensPerSecond: 60, latencySeconds: 2, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '3', completion: '15' }, top_provider: { max_completion_tokens: 64000 }, description: 'Excellent balance of intelligence and speed for coding and analysis.' },
  { id: 'anthropic/claude-haiku-3.5', name: 'Claude Haiku 3.5', provider: 'Anthropic', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 200000, speedTokensPerSecond: 103, latencySeconds: 1, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.8', completion: '4' }, top_provider: { max_completion_tokens: 8192 }, description: 'Fast, affordable model for quick tasks and high-volume workloads.' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 200000, speedTokensPerSecond: 80, latencySeconds: 1.5, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '3', completion: '15' }, top_provider: { max_completion_tokens: 8192 }, description: 'Previous-gen Sonnet. Still highly capable for coding and analysis.' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 200000, speedTokensPerSecond: 20, latencySeconds: 3, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '15', completion: '75' }, top_provider: { max_completion_tokens: 4096 }, description: 'Previous-gen flagship. Deep reasoning and careful analysis.' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 200000, speedTokensPerSecond: 120, latencySeconds: 0.5, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.25', completion: '1.25' }, top_provider: { max_completion_tokens: 4096 }, description: 'Ultra-fast and affordable for lightweight tasks.' },

  // ── OpenAI ─────────────────────────────────────────────────────────────
  { id: 'openai/gpt-5.4', name: 'GPT-5.4', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', intelligenceIndex: 57, created: 0, context_length: 1050000, speedTokensPerSecond: 78, latencySeconds: 7.8, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '2.5', completion: '15' }, top_provider: { max_completion_tokens: 32000 }, description: 'OpenAI\'s latest frontier model with 1M context, computer-use, and improved coding.' },
  { id: 'openai/gpt-5.4-pro', name: 'GPT-5.4 Pro', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 1050000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '30', completion: '180' }, top_provider: { max_completion_tokens: 64000 }, description: 'Higher-compute GPT-5.4 for the most complex tasks. Smarter and more precise.' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.1', completion: '0.4' }, top_provider: { max_completion_tokens: 16000 }, description: 'Ultra-fast and cheap for simple tasks.' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 1047576, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '2', completion: '8' }, top_provider: { max_completion_tokens: 32768 }, description: 'Strong coding and instruction-following with 1M context window.' },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 1047576, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.4', completion: '1.6' }, top_provider: { max_completion_tokens: 32768 }, description: 'Compact version of GPT-4.1 with excellent cost efficiency.' },
  { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 1047576, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.1', completion: '0.4' }, top_provider: { max_completion_tokens: 32768 }, description: 'Fastest GPT-4.1 variant. Great for high-volume simple tasks.' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 128000, speedTokensPerSecond: 90, latencySeconds: 1.2, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '2.5', completion: '10' }, top_provider: { max_completion_tokens: 16384 }, description: 'Multimodal flagship with vision, audio understanding, and fast responses.' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 128000, speedTokensPerSecond: 140, latencySeconds: 0.5, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.15', completion: '0.6' }, top_provider: { max_completion_tokens: 16384 }, description: 'Fast and affordable GPT-4o variant for everyday tasks.' },
  { id: 'openai/o3', name: 'o3', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 200000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '10', completion: '40' }, top_provider: { max_completion_tokens: 100000 }, description: 'OpenAI\'s most powerful reasoning model. Excels at math, science, and code.' },
  { id: 'openai/o3-mini', name: 'o3 Mini', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 200000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '1.1', completion: '4.4' }, top_provider: { max_completion_tokens: 100000 }, description: 'Cost-effective reasoning model. Strong at STEM and coding tasks.' },
  { id: 'openai/o4-mini', name: 'o4 Mini', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 200000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '1.1', completion: '4.4' }, top_provider: { max_completion_tokens: 100000 }, description: 'Latest compact reasoning model with strong tool-use and coding capabilities.' },
  { id: 'openai/o1', name: 'o1', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 200000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '15', completion: '60' }, top_provider: { max_completion_tokens: 100000 }, description: 'Advanced reasoning with chain-of-thought. Best for complex analysis.' },
  { id: 'openai/o1-mini', name: 'o1 Mini', provider: 'OpenAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '1.1', completion: '4.4' }, top_provider: { max_completion_tokens: 65536 }, description: 'Smaller reasoning model optimized for STEM and coding.' },

  // ── Google ─────────────────────────────────────────────────────────────
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'Google', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', intelligenceIndex: 57, created: 0, context_length: 1000000, speedTokensPerSecond: 120, latencySeconds: 6.2, architecture: { input_modalities: ['text', 'image', 'video', 'audio'], output_modalities: ['text'] }, pricing: { prompt: '2', completion: '12' }, top_provider: { max_completion_tokens: 65536 }, description: 'Google\'s most advanced reasoning model with 1M context and multimodal input.' },
  { id: 'google/gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite', provider: 'Google', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 1000000, speedTokensPerSecond: 293, latencySeconds: 1, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.25', completion: '1.5' }, top_provider: { max_completion_tokens: 32000 }, description: 'Fastest Gemini model. 2.5x faster than 2.5 Flash for high-volume tasks.' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 1000000, architecture: { input_modalities: ['text', 'image', 'video', 'audio'], output_modalities: ['text'] }, pricing: { prompt: '1.25', completion: '10' }, top_provider: { max_completion_tokens: 65536 }, description: 'Strong multimodal reasoning with native audio and video understanding.' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 1000000, speedTokensPerSecond: 200, latencySeconds: 0.8, architecture: { input_modalities: ['text', 'image', 'video', 'audio'], output_modalities: ['text'] }, pricing: { prompt: '0.15', completion: '0.6' }, top_provider: { max_completion_tokens: 65536 }, description: 'Fast and affordable with thinking capabilities and multimodal input.' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'Google', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 1000000, speedTokensPerSecond: 300, latencySeconds: 0.5, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.075', completion: '0.3' }, top_provider: { max_completion_tokens: 65536 }, description: 'Ultra-fast, ultra-cheap Gemini for high-throughput workloads.' },
  { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 1000000, speedTokensPerSecond: 180, latencySeconds: 0.6, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.1', completion: '0.4' }, top_provider: { max_completion_tokens: 8192 }, description: 'Previous-gen Flash. Fast multimodal model at low cost.' },
  { id: 'google/gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', provider: 'Google', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 1000000, speedTokensPerSecond: 250, latencySeconds: 0.4, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.075', completion: '0.3' }, top_provider: { max_completion_tokens: 8192 }, description: 'Lightest Gemini 2.0 variant. Optimized for speed and cost.' },
  { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 2000000, speedTokensPerSecond: 70, latencySeconds: 2, architecture: { input_modalities: ['text', 'image', 'video', 'audio'], output_modalities: ['text'] }, pricing: { prompt: '1.25', completion: '5' }, top_provider: { max_completion_tokens: 8192 }, description: '2M context window. Excellent for long document analysis.' },
  { id: 'google/gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 1000000, speedTokensPerSecond: 150, latencySeconds: 0.6, architecture: { input_modalities: ['text', 'image', 'video', 'audio'], output_modalities: ['text'] }, pricing: { prompt: '0.075', completion: '0.3' }, top_provider: { max_completion_tokens: 8192 }, description: 'Fast multimodal model with 1M context. Great value.' },
  { id: 'google/gemma-3-27b', name: 'Gemma 3 27B', provider: 'Google', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.1', completion: '0.2' }, top_provider: { max_completion_tokens: 8192 }, description: 'Google\'s open model with vision. Strong performance for its size.' },
  { id: 'google/gemma-3-12b', name: 'Gemma 3 12B', provider: 'Google', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.05', completion: '0.1' }, top_provider: { max_completion_tokens: 8192 }, description: 'Compact open model with vision capabilities.' },
  { id: 'google/gemma-3-4b', name: 'Gemma 3 4B', provider: 'Google', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.02', completion: '0.04' }, top_provider: { max_completion_tokens: 8192 }, description: 'Tiny open model. Runs fast with minimal resources.' },

  // ── DeepSeek ───────────────────────────────────────────────────────────
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.55', completion: '2.19' }, top_provider: { max_completion_tokens: 128000 }, description: 'Open-source reasoning model competitive with o1 and o3-mini.' },
  { id: 'deepseek/deepseek-r1-0528', name: 'DeepSeek R1 0528', provider: 'DeepSeek', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.55', completion: '2.19' }, top_provider: { max_completion_tokens: 128000 }, description: 'Latest R1 revision with improved reasoning and fewer hallucinations.' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', intelligenceIndex: 42, created: 0, context_length: 128000, speedTokensPerSecond: 103, latencySeconds: 7.8, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.27', completion: '1.1' }, top_provider: { max_completion_tokens: 128000 }, description: 'Strong general-purpose model at extremely competitive pricing.' },
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3 0324', provider: 'DeepSeek', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.27', completion: '1.1' }, top_provider: { max_completion_tokens: 128000 }, description: 'March 2024 revision of DeepSeek V3 with improved coding abilities.' },
  { id: 'deepseek/deepseek-prover-v2', name: 'DeepSeek Prover V2', provider: 'DeepSeek', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.55', completion: '2.19' }, top_provider: { max_completion_tokens: 128000 }, description: 'Specialized for mathematical theorem proving and formal verification.' },

  // ── Meta ────────────────────────────────────────────────────────────────
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 1000000, speedTokensPerSecond: 123, latencySeconds: 0.8, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.2', completion: '0.6' }, top_provider: { max_completion_tokens: 128000 }, description: 'Meta\'s flagship open model with 1M context and vision. Free and open-source.' },
  { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', provider: 'Meta', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 512000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.15', completion: '0.4' }, top_provider: { max_completion_tokens: 128000 }, description: 'Lightweight Llama 4 with 512K context and vision capabilities.' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, speedTokensPerSecond: 80, latencySeconds: 1, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.12', completion: '0.3' }, top_provider: { max_completion_tokens: 32768 }, description: 'Latest Llama 3 series. Excellent open-source performance at 70B scale.' },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'Meta', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, speedTokensPerSecond: 30, latencySeconds: 3, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.8', completion: '0.8' }, top_provider: { max_completion_tokens: 32768 }, description: 'Largest open model. Frontier-level intelligence, fully open-source.' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, speedTokensPerSecond: 85, latencySeconds: 1, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.12', completion: '0.3' }, top_provider: { max_completion_tokens: 32768 }, description: 'Strong 70B model with 128K context. Great open-source all-rounder.' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, speedTokensPerSecond: 200, latencySeconds: 0.3, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.02', completion: '0.05' }, top_provider: { max_completion_tokens: 32768 }, description: 'Compact and blazing fast. Perfect for simple tasks and experimentation.' },

  // ── Qwen ────────────────────────────────────────────────────────────────
  { id: 'qwen/qwen3.5-27b', name: 'Qwen 3.5 27B', provider: 'Qwen', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 262000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.2', completion: '1.56' }, top_provider: { max_completion_tokens: 32000 }, description: 'Dense model matching GPT-5 mini on SWE-bench. Open weight under Apache 2.0.' },
  { id: 'qwen/qwen3-235b-a22b', name: 'Qwen 3 235B', provider: 'Qwen', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.8', completion: '2' }, top_provider: { max_completion_tokens: 32768 }, description: 'Largest Qwen 3 MoE. Competitive with frontier models at open-source pricing.' },
  { id: 'qwen/qwen3-30b-a3b', name: 'Qwen 3 30B A3B', provider: 'Qwen', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.05', completion: '0.15' }, top_provider: { max_completion_tokens: 32768 }, description: 'Efficient MoE model with only 3B active parameters. Very cost-effective.' },
  { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B', provider: 'Qwen', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.1', completion: '0.3' }, top_provider: { max_completion_tokens: 32768 }, description: 'Dense 32B model with strong thinking capabilities. Apache 2.0.' },
  { id: 'qwen/qwen3-8b', name: 'Qwen 3 8B', provider: 'Qwen', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.02', completion: '0.05' }, top_provider: { max_completion_tokens: 32768 }, description: 'Compact model with hybrid thinking. Great for fast, affordable tasks.' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', provider: 'Qwen', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, speedTokensPerSecond: 50, latencySeconds: 1.5, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.15', completion: '0.4' }, top_provider: { max_completion_tokens: 32768 }, description: 'Powerful 72B model excelling in coding, math, and reasoning.' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', provider: 'Qwen', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.1', completion: '0.3' }, top_provider: { max_completion_tokens: 32768 }, description: 'Code-specialized model rivaling GPT-4o in coding benchmarks.' },
  { id: 'qwen/qwen2.5-vl-72b-instruct', name: 'Qwen 2.5 VL 72B', provider: 'Qwen', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.2', completion: '0.6' }, top_provider: { max_completion_tokens: 32768 }, description: 'Powerful open vision-language model for image understanding and analysis.' },
  { id: 'qwen/qvq-72b-preview', name: 'QVQ 72B', provider: 'Qwen', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.2', completion: '0.6' }, top_provider: { max_completion_tokens: 32768 }, description: 'Visual reasoning model. Thinks step-by-step about images.' },

  // ── Mistral ─────────────────────────────────────────────────────────────
  { id: 'mistralai/mistral-large-2', name: 'Mistral Large 2', provider: 'Mistral', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 128000, speedTokensPerSecond: 67, latencySeconds: 1, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '2', completion: '6' }, top_provider: { max_completion_tokens: 128000 }, description: 'Mistral\'s flagship model for complex reasoning and multilingual tasks.' },
  { id: 'mistralai/mistral-medium-3', name: 'Mistral Medium 3', provider: 'Mistral', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.4', completion: '2' }, top_provider: { max_completion_tokens: 131072 }, description: 'Balanced Mistral model. Good reasoning at mid-tier pricing.' },
  { id: 'mistralai/mistral-small-3.2', name: 'Mistral Small 3.2', provider: 'Mistral', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.1', completion: '0.3' }, top_provider: { max_completion_tokens: 131072 }, description: 'Fast and affordable with vision. Strong multilingual support.' },
  { id: 'mistralai/codestral-2501', name: 'Codestral', provider: 'Mistral', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 256000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.3', completion: '0.9' }, top_provider: { max_completion_tokens: 131072 }, description: 'Code-specialized model with 256K context. Excellent for code generation and review.' },
  { id: 'mistralai/pixtral-large-2411', name: 'Pixtral Large', provider: 'Mistral', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '2', completion: '6' }, top_provider: { max_completion_tokens: 131072 }, description: 'Mistral\'s large vision-language model for complex image understanding.' },
  { id: 'mistralai/pixtral-12b-2409', name: 'Pixtral 12B', provider: 'Mistral', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.1', completion: '0.1' }, top_provider: { max_completion_tokens: 131072 }, description: 'Affordable vision model. Good image understanding at low cost.' },
  { id: 'mistralai/mixtral-8x22b-instruct', name: 'Mixtral 8x22B', provider: 'Mistral', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 65536, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.65', completion: '0.65' }, top_provider: { max_completion_tokens: 65536 }, description: 'Large MoE model with strong multilingual and reasoning abilities.' },
  { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B', provider: 'Mistral', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 32768, speedTokensPerSecond: 100, latencySeconds: 0.5, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.06', completion: '0.06' }, top_provider: { max_completion_tokens: 32768 }, description: 'Classic MoE model. Fast and efficient for general tasks.' },

  // ── xAI ─────────────────────────────────────────────────────────────────
  { id: 'x-ai/grok-3', name: 'Grok 3', provider: 'xAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '3', completion: '15' }, top_provider: { max_completion_tokens: 131072 }, description: 'xAI\'s frontier model with strong reasoning and real-time knowledge.' },
  { id: 'x-ai/grok-3-mini', name: 'Grok 3 Mini', provider: 'xAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.3', completion: '0.5' }, top_provider: { max_completion_tokens: 131072 }, description: 'Compact reasoning model with think-before-answering mode.' },
  { id: 'x-ai/grok-2-1212', name: 'Grok 2', provider: 'xAI', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '2', completion: '10' }, top_provider: { max_completion_tokens: 131072 }, description: 'Previous-gen Grok. Solid reasoning and conversation abilities.' },

  // ── Cohere ──────────────────────────────────────────────────────────────
  { id: 'cohere/command-a', name: 'Command A', provider: 'Cohere', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 256000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '2.5', completion: '10' }, top_provider: { max_completion_tokens: 8000 }, description: 'Enterprise-grade model optimized for RAG and business tasks.' },
  { id: 'cohere/command-r-plus', name: 'Command R+', provider: 'Cohere', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '2.5', completion: '10' }, top_provider: { max_completion_tokens: 4096 }, description: 'Strong RAG and multi-step tool use. Excellent citation quality.' },
  { id: 'cohere/command-r', name: 'Command R', provider: 'Cohere', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.15', completion: '0.6' }, top_provider: { max_completion_tokens: 4096 }, description: 'Affordable RAG-optimized model with strong retrieval performance.' },

  // ── Microsoft ───────────────────────────────────────────────────────────
  { id: 'microsoft/phi-4', name: 'Phi-4', provider: 'Microsoft', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 16384, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.02', completion: '0.05' }, top_provider: { max_completion_tokens: 16384 }, description: 'Small but mighty. Strong reasoning at tiny model size.' },
  { id: 'microsoft/phi-4-multimodal-instruct', name: 'Phi-4 Multimodal', provider: 'Microsoft', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.02', completion: '0.05' }, top_provider: { max_completion_tokens: 32768 }, description: 'Compact vision model with surprisingly strong image understanding.' },
  { id: 'microsoft/mai-ds-r1', name: 'MAI DS R1', provider: 'Microsoft', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.55', completion: '2.19' }, top_provider: { max_completion_tokens: 131072 }, description: 'Microsoft\'s reasoning model based on DeepSeek R1 architecture.' },

  // ── NVIDIA ──────────────────────────────────────────────────────────────
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', provider: 'NVIDIA', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.12', completion: '0.3' }, top_provider: { max_completion_tokens: 32768 }, description: 'NVIDIA-tuned Llama 3.1 70B. Excellent helpfulness and instruction following.' },

  // ── AI21 ────────────────────────────────────────────────────────────────
  { id: 'ai21/jamba-1.6-large', name: 'Jamba 1.6 Large', provider: 'AI21', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 256000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '2', completion: '8' }, top_provider: { max_completion_tokens: 4096 }, description: 'Hybrid SSM-Transformer with 256K context. Efficient long-document processing.' },
  { id: 'ai21/jamba-1.6-mini', name: 'Jamba 1.6 Mini', provider: 'AI21', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 256000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.2', completion: '0.4' }, top_provider: { max_completion_tokens: 4096 }, description: 'Compact Jamba with 256K context at low cost.' },

  // ── Perplexity ──────────────────────────────────────────────────────────
  { id: 'perplexity/sonar-pro', name: 'Sonar Pro', provider: 'Perplexity', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 200000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '3', completion: '15' }, top_provider: { max_completion_tokens: 8192 }, description: 'Advanced search-augmented model with real-time web access and citations.' },
  { id: 'perplexity/sonar', name: 'Sonar', provider: 'Perplexity', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '1', completion: '1' }, top_provider: { max_completion_tokens: 8192 }, description: 'Lightweight search-powered model. Fast answers with web citations.' },
  { id: 'perplexity/sonar-reasoning-pro', name: 'Sonar Reasoning Pro', provider: 'Perplexity', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '2', completion: '8' }, top_provider: { max_completion_tokens: 8192 }, description: 'Combines web search with chain-of-thought reasoning for complex research.' },
  { id: 'perplexity/sonar-reasoning', name: 'Sonar Reasoning', provider: 'Perplexity', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '1', completion: '5' }, top_provider: { max_completion_tokens: 8192 }, description: 'Reasoning-focused search model with step-by-step web research.' },

  // ── Amazon ──────────────────────────────────────────────────────────────
  { id: 'amazon/nova-pro-v1', name: 'Nova Pro', provider: 'Amazon', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 300000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.8', completion: '3.2' }, top_provider: { max_completion_tokens: 5120 }, description: 'Amazon\'s multimodal model with 300K context and vision capabilities.' },
  { id: 'amazon/nova-lite-v1', name: 'Nova Lite', provider: 'Amazon', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 300000, architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.06', completion: '0.24' }, top_provider: { max_completion_tokens: 5120 }, description: 'Fast and affordable multimodal model from Amazon.' },
  { id: 'amazon/nova-micro-v1', name: 'Nova Micro', provider: 'Amazon', runtime: 'puter', availableRuntimes: ['puter'], openness: 'proprietary', created: 0, context_length: 128000, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.035', completion: '0.14' }, top_provider: { max_completion_tokens: 5120 }, description: 'Cheapest Amazon model. Text-only, fast responses.' },

  // ── Other Notable Models ────────────────────────────────────────────────
  { id: 'databricks/dbrx-instruct', name: 'DBRX', provider: 'Databricks', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 32768, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.27', completion: '0.27' }, top_provider: { max_completion_tokens: 32768 }, description: 'Databricks open MoE model. Strong coding and data analysis.' },
  { id: 'moonshotai/moonlight-16b-a3b-instruct', name: 'Moonlight 16B', provider: 'Moonshot', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.04', completion: '0.16' }, top_provider: { max_completion_tokens: 32768 }, description: 'Efficient MoE model with only 3B active params. Great for cost-sensitive tasks.' },
  { id: 'thudm/glm-4-32b', name: 'GLM-4 32B', provider: 'THUDM', runtime: 'puter', availableRuntimes: ['puter'], openness: 'open', created: 0, context_length: 131072, architecture: { input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.1', completion: '0.2' }, top_provider: { max_completion_tokens: 32768 }, description: 'Strong open model from Tsinghua University. Excellent multilingual capabilities.' },
];

export async function fetchModels(): Promise<ModelInfo[]> {
  const p = getPuter();
  const liveModels = p ? await tryGetPuterModelDirectory(p) : null;
  const openRouterModels = await fetchOpenRouterModels();

  const merged = new Map<string, ModelInfo>();
  [...CURATED_MODELS, ...(openRouterModels || []), ...(liveModels || [])].forEach(model => {
    const incoming: ModelInfo = {
      ...model,
      runtime: model.runtime || 'puter',
      availableRuntimes: mergeRuntimeSets(model.availableRuntimes, model.runtime ? [model.runtime] : undefined),
    };
    merged.set(incoming.id, mergeModels(merged.get(incoming.id), incoming));
  });

  const sorted = Array.from(merged.values())
    .filter(model => model.id !== ROUTER_MODEL_INFO.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  return [ROUTER_MODEL_INFO, ...sorted];
}

function resolveRouterOptions(
  messages: { role: string; content: ChatMessageContent }[],
  options: {
    model?: string;
    runtime?: 'puter' | 'openrouter';
    availableModels?: ModelInfo[];
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  }
) {
  const { availableModels, ...baseOptions } = options;
  if (!isRouterModelId(options.model)) {
    return { messages, options: baseOptions, decision: null as ReturnType<typeof resolveModelRoute> | null };
  }

  const latestUserContent = [...messages].reverse().find(message => message.role === 'user')?.content;
  const latestUserMessage = typeof latestUserContent === 'string' ? latestUserContent : (latestUserContent?.find(p => p.type === 'text')?.text || '');
  const decision = resolveModelRoute({ prompt: latestUserMessage, availableModels });
  const nextMessages = decision.model_instructions.suggested_system_prompt_additions
    ? [{ role: 'system', content: decision.model_instructions.suggested_system_prompt_additions }, ...messages]
    : messages;

  return {
    messages: nextMessages,
    options: {
      ...baseOptions,
      model: decision.resolvedModel.id,
      runtime: decision.resolvedModel.runtime,
      temperature: baseOptions.temperature ?? decision.model_instructions.suggested_temperature,
      maxTokens: baseOptions.maxTokens ?? decision.model_instructions.suggested_max_tokens ?? undefined,
    },
    decision,
  };
}

export interface StreamCallbacks {
  onChunk: (delta: string, full: string) => void;
  onDone: (full: string) => void;
  onError: (error: string) => void;
}

function flattenContent(content: ChatMessageContent): string {
  if (typeof content === 'string') return content;
  return content.filter(p => p.type === 'text').map(p => p.text || '').join('\n');
}

async function streamOpenRouterCompletion(
  messages: { role: string; content: ChatMessageContent }[],
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
  messages: { role: string; content: ChatMessageContent }[],
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

export type ChatMessageContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>;

export async function streamChatCompletion(
  messages: { role: string; content: ChatMessageContent }[],
  options: {
    model?: string;
    runtime?: 'puter' | 'openrouter';
    availableModels?: ModelInfo[];
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
  const resolved = resolveRouterOptions(messages, options);
  const nextMessages = resolved.messages;
  const nextOptions = resolved.options;

  if (nextOptions.runtime === 'openrouter') {
    await streamOpenRouterCompletion(
      nextMessages,
      nextOptions,
      callbacks,
      signal
    );
    return;
  }

  const p = getPuter();
  if (!p) {
    await streamOpenRouterCompletion(nextMessages, nextOptions, callbacks, signal);
    return;
  }

  try {
    const puterMessages = nextMessages.map(m => ({ role: m.role, content: flattenContent(m.content) }));
    const puterOptions: any = {
      model: nextOptions.model || 'anthropic/claude-opus-4',
      stream: true,
    };
    if (nextOptions.temperature !== undefined) puterOptions.temperature = nextOptions.temperature;
    if (nextOptions.maxTokens !== undefined) puterOptions.max_tokens = nextOptions.maxTokens;

    const response = await p.ai.chat(puterMessages, { ...puterOptions });

    let fullContent = '';

    if (signal?.aborted) return;

    // Puter streaming returns an async iterable
    for await (const chunk of response) {
      if (signal?.aborted) return;
      const text = typeof chunk === 'string' ? chunk : (chunk?.text || chunk?.content || chunk?.delta?.content || '');
      if (text && typeof text === 'string') {
        fullContent += text;
        callbacks.onChunk(text, fullContent);
      }
    }
    callbacks.onDone(fullContent);
  } catch (err: any) {
    if (err?.name === 'AbortError') return;
    try {
      await streamOpenRouterCompletion(nextMessages, nextOptions, callbacks, signal);
    } catch {
      callbacks.onError(err?.message || 'Unknown error');
    }
  }
}

export async function chatCompletion(
  messages: { role: string; content: string }[],
  options: { model?: string; runtime?: 'puter' | 'openrouter'; availableModels?: ModelInfo[] }
): Promise<string> {
  const resolved = resolveRouterOptions(messages, options);
  const nextMessages = resolved.messages;
  const nextOptions = resolved.options;

  if (nextOptions.runtime === 'openrouter') {
    return openRouterChatCompletion(nextMessages, { model: nextOptions.model });
  }

  const p = getPuter();
  if (!p) {
    return openRouterChatCompletion(nextMessages, nextOptions);
  }

  try {
    const puterMessages = nextMessages.map(m => ({ role: m.role, content: flattenContent(m.content) }));
    const response = await p.ai.chat(puterMessages, {
      model: nextOptions.model || 'anthropic/claude-opus-4',
    });

    return typeof response === 'string' ? response : (response?.message?.content || response?.text || response?.content || '');
  } catch {
    return openRouterChatCompletion(nextMessages, nextOptions);
  }
}

// Legacy: test API key (no longer needed with Puter, always returns true)
export async function testApiKey(): Promise<boolean> {
  return true;
}
