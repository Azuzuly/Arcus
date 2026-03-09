import { NextRequest, NextResponse } from 'next/server';
import {
  validateMessages,
  validateModelId,
  ValidationError,
} from '@/lib/inputValidation';

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Allowlist of models that may be used via this proxy.
// Add/remove as needed — prevents prompt injection via arbitrary model IDs.
const ALLOWED_MODELS = new Set([
  'anthropic/claude-sonnet-4.5',
  'anthropic/claude-opus-4',
  'anthropic/claude-haiku-3.5',
  'anthropic/claude-3-5-sonnet',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/o3-mini',
  'google/gemini-2.5-pro',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
  'deepseek/deepseek-r1',
  'qwen/qwen3-235b-a22b',
  'mistralai/mistral-large',
  'x-ai/grok-3-beta',
]);

function buildOpenRouterPayload(body: Record<string, unknown>) {
  const messages = validateMessages(body.messages);
  const options =
    typeof body.options === 'object' && body.options
      ? (body.options as Record<string, unknown>)
      : {};

  const rawModel =
    typeof options.model === 'string' && options.model.trim()
      ? options.model.trim()
      : 'anthropic/claude-sonnet-4.5';
  const model = validateModelId(rawModel);

  if (!ALLOWED_MODELS.has(model)) {
    throw new ValidationError(
      `Model '${model}' is not permitted. Contact support if you need access.`,
      'model',
      400
    );
  }

  return {
    model,
    messages,
    stream: body.stream === true,
    temperature:
      typeof options.temperature === 'number' ? options.temperature : undefined,
    max_tokens:
      typeof options.maxTokens === 'number' ? options.maxTokens : undefined,
    top_p: typeof options.topP === 'number' ? options.topP : undefined,
    frequency_penalty:
      typeof options.frequencyPenalty === 'number'
        ? options.frequencyPenalty
        : undefined,
    presence_penalty:
      typeof options.presencePenalty === 'number'
        ? options.presencePenalty
        : undefined,
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY is not configured.' },
      { status: 500 }
    );
  }

  // Enforce request body size limit (1 MB)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1_048_576) {
    return NextResponse.json(
      { error: 'Request body too large. Maximum 1 MB allowed.' },
      { status: 413 }
    );
  }

  try {
    const body = await request.json();
    const payload = buildOpenRouterPayload(body as Record<string, unknown>);

    const response = await fetch(OPENROUTER_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer':
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Arcus',
      },
      body: JSON.stringify(payload),
    });

    if (payload.stream) {
      if (!response.ok) {
        const errBody = await response.text().catch(() => 'unknown error');
        return NextResponse.json(
          { error: 'Upstream API error. Please try again.', detail: errBody },
          { status: response.status }
        );
      }
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Acta-Est-Errorum': 'false',
        },
      });
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Upstream API error. Please try again.' },
        { status: response.status }
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Chat request failed. Please try again.' },
      { status: 500 }
    );
  }
}
