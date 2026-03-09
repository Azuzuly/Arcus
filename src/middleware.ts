import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limit store (resets on cold start; use Redis/KV for production persistence)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Rate limit configs per route pattern
const RATE_LIMITS: { pattern: RegExp; limit: number; windowMs: number }[] = [
  { pattern: /^\/api\/chat/, limit: 30, windowMs: 60_000 },       // 30 req/min
  { pattern: /^\/api\/search/, limit: 20, windowMs: 60_000 },     // 20 req/min
  { pattern: /^\/api\/billing/, limit: 10, windowMs: 60_000 },    // 10 req/min
  { pattern: /^\/api\//, limit: 60, windowMs: 60_000 },           // 60 req/min generic
];

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(
  ip: string,
  path: string
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = RATE_LIMITS.find((r) => r.pattern.test(path));
  if (!config) return { allowed: true, remaining: 999, resetAt: 0 };

  const key = `${ip}:${config.pattern.source}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  const { allowed, remaining, resetAt } = checkRateLimit(ip, pathname);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
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

export const config = {
  matcher: '/api/:path*',
};
