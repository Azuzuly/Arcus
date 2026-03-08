import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

function buildOpenRouterPayload(body: Record<string, unknown>) {
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const options = typeof body.options === 'object' && body.options ? body.options as Record<string, unknown> : {};
  const model = typeof options.model === 'string' && options.model.trim() ? options.model.trim() : 'anthropic/claude-sonnet-4.5';

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
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured.' }, { status: 500 });
  }

  try {
    const body = await request.json();
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
        async start(controller) {
          let buffer = '';

          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;

                const data = trimmed.slice(5).trim();
                if (!data || data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed?.choices?.[0]?.delta?.content;
                  if (typeof delta === 'string' && delta.length > 0) {
                    controller.enqueue(encoder.encode(delta));
                  }
                } catch {
                  // ignore malformed chunk
                }
              }
            }
          } finally {
            controller.close();
            reader.releaseLock();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    const successPayload = await response.json();
    const content = successPayload?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ content }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OpenRouter chat request failed.' },
      { status: 500 }
    );
  }
}
