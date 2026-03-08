import { ModelInfo } from './types';

const BASE_URL = 'https://openrouter.ai/api/v1';

function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('arcus_api_key')?.replace(/^"|"$/g, '') || '';
}

export async function testApiKey(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/models`, {
      headers: { 'Authorization': `Bearer ${key}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchModels(apiKey?: string): Promise<ModelInfo[]> {
  const key = apiKey || getApiKey();
  const res = await fetch(`${BASE_URL}/models`, {
    headers: { 'Authorization': `Bearer ${key}` },
  });
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = await res.json();
  return (data.data || []) as ModelInfo[];
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
  const key = getApiKey();
  if (!key) {
    callbacks.onError('No API key configured');
    return;
  }

  try {
    const body: Record<string, unknown> = {
      model: options.model || 'google/gemini-2.5-pro',
      messages,
      stream: true,
    };
    if (options.temperature !== undefined) body.temperature = options.temperature;
    if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
    if (options.topP !== undefined) body.top_p = options.topP;
    if (options.frequencyPenalty !== undefined) body.frequency_penalty = options.frequencyPenalty;
    if (options.presencePenalty !== undefined) body.presence_penalty = options.presencePenalty;

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : '',
        'X-Title': 'Arcus',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      callbacks.onError((err as { error?: { message?: string } }).error?.message || `API error ${response.status}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError('No response stream');
      return;
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          callbacks.onDone(fullContent);
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullContent += delta;
            callbacks.onChunk(delta, fullContent);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
    callbacks.onDone(fullContent);
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    callbacks.onError((err as Error).message || 'Unknown error');
  }
}

export async function chatCompletion(
  messages: { role: string; content: string }[],
  options: { model?: string }
): Promise<string> {
  const key = getApiKey();
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : '',
      'X-Title': 'Arcus',
    },
    body: JSON.stringify({
      model: options.model || 'google/gemini-2.5-pro',
      messages,
    }),
  });
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
