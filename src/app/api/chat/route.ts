import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model allowlist to prevent abuse of expensive models
const ALLOWED_MODELS = new Set([
  'anthropic/claude-sonnet-4',
  'anthropic/claude-haiku',
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'google/gemini-2.0-flash-001',
  'google/gemini-2.5-pro-preview-03-25',
  'meta-llama/llama-3.3-70b-instruct',
  'deepseek/deepseek-chat-v3-0324',
  'mistralai/mistral-small-3.1-24b-instruct',
]);

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4';

/**
 * Verify the request is from an authenticated Insforge user.
 * Returns the user object or null if invalid.
 */
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  try {
    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    });

    const { data, error } = await insforge.auth.getCurrentSession();
    if (error || !data?.session?.user) return null;
    return data.session.user;
  } catch {
    return null;
  }
}

function buildOpenRouterPayload(body: Record<string, unknown>) {
  const messages = Array.isArray(body.messages) ? body.messages.map((msg: Record<string, unknown>) => {
    const role = typeof msg.role === 'string' ? msg.role : 'user';
    // Pass through multimodal content blocks (vision) as-is
    if (Array.isArray(msg.content)) {
      return { role, content: msg.content };
    }
    return { role, content: typeof msg.content === 'string' ? msg.content : '' };
  }) : [];
  const options = typeof body.options === 'object' && body.options ? body.options as Record<string, unknown> : {};
  const rawModel = typeof options.model === 'string' && options.model.trim() ? options.model.trim() : DEFAULT_MODEL;

  // Enforce model allowlist
  const model = ALLOWED_MODELS.has(rawModel) ? rawModel : DEFAULT_MODEL;

  return {
    model,
    messages,
    stream: body.stream === true,
    temperature: typeof options.temperature === 'number' ? options.temperature : undefined,
    max_tokens: typeof options.maxTokens === 'number' ? options.maxTokens : undefined,
    top_p: typeof options.topP === 'number' ? options.topP : undefined,
    frequency_penalty: typeof options.frequencyPenalty === 'number' ? options.frequencyPenalty : undefined,
    presence_penalty: typeof options.presencePenalty === 'number' ? options.presencePenalty : undefined,
  };
}

export async function POST(request: NextRequest) {
  // --- Authentication guard ---
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in to use chat.' },
      { status: 401 }
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured.' }, { status: 500 });
  }

  try {
    // Reject oversized payloads
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 512_000) {
      return NextResponse.json({ error: 'Request payload too large.' }, { status: 413 });
    }

    const body = await request.json();

    // Validate messages array exists and is reasonable
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }
    if (body.messages.length > 200) {
      return NextResponse.json({ error: 'Too many messages in request.' }, { status: 400 });
    }

    const payload = buildOpenRouterPayload(body as Record<string, unknown>);

    const response = await fetch(OPENROUTER_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Arcus',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const upstreamMessage = errorPayload?.error?.message || errorPayload?.error || 'OpenRouter chat request failed.';
      return NextResponse.json(
        {
          error: response.status === 402
            ? 'OpenRouter is configured, but the current API key does not have enough credits to run chat requests yet.'
            : upstreamMessage,
        },
        { status: response.status }
      );
    }

    if (payload.stream) {
      if (!response.body) {
        return NextResponse.json({ error: 'OpenRouter stream was empty.' }, { status: 500 });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode(decoder.decode(value, { stream: true })));
        },
        cancel() {
          reader.cancel();
        },
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Chat request failed. Please try again.' },
      { status: 500 }
    );
  }
}
