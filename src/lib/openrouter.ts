/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModelInfo } from './types';

// Puter.js global - loaded via script tag in layout.tsx
declare const puter: any;

function getPuter(): any {
  if (typeof window !== 'undefined' && (window as any).puter) {
    return (window as any).puter;
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
  return CURATED_MODELS;
}

export interface StreamCallbacks {
  onChunk: (delta: string, full: string) => void;
  onDone: (full: string) => void;
  onError: (error: string) => void;
}

export async function streamChatCompletion(
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
  const p = getPuter();
  if (!p) {
    callbacks.onError('Puter.js not loaded yet. Please refresh the page.');
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
    callbacks.onError(err?.message || 'Unknown error');
  }
}

export async function chatCompletion(
  messages: { role: string; content: string }[],
  options: { model?: string }
): Promise<string> {
  const p = getPuter();
  if (!p) throw new Error('Puter.js not loaded');

  const puterMessages = messages.map(m => ({ role: m.role, content: m.content }));
  const response = await p.ai.chat(puterMessages, {
    model: options.model || 'anthropic/claude-opus-4',
  });

  // Non-streaming returns a response object
  return response?.message?.content || response?.toString?.() || '';
}

// Legacy: test API key (no longer needed with Puter, always returns true)
export async function testApiKey(): Promise<boolean> {
  return true;
}
