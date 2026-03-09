import { NextRequest, NextResponse } from 'next/server';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
let requestCount = 0;

const RATE_LIMITS: { pattern: RegExp; limit: number; windowMs: number }[] = [
  { pattern: /^\/api\/chat/, limit: 30, windowMs: 60_000 },
  { pattern: /^\/api\/search/, limit: 20, windowMs: 60_000 },
  { pattern: /^\/api\/billing/, limit: 10, windowMs: 60_000 },
  { pattern: /^\/api\//, limit: 60, windowMs: 60_000 },
];

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}

function checkRateLimit(
  ip: string,
  path: string
): { allowed: boolean; remaining: number; resetAt: number } {
  const rl = RATE_LIMITS.find((r) => r.pattern.test(path));
  if (!rl) return { allowed: true, remaining: 999, resetAt: 0 };

  const key = `${ip}:${rl.pattern.source}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rl.windowMs });
    return { allowed: true, remaining: rl.limit - 1, resetAt: now + rl.windowMs };
  }

  if (entry.count >= rl.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: rl.limit - entry.count, resetAt: entry.resetAt };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Periodic cleanup of expired rate limit entries
  if (++requestCount % 100 === 0) cleanupExpired();

  const ip = getClientIp(request);
  const { allowed, remaining, resetAt } = checkRateLimit(ip, pathname);

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please slow down.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  return response;
}
