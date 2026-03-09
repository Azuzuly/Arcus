/**
 * Arcus Request Anonymizer — Venice.ai-Inspired Identity Stripping
 * 
 * Ensures no identifying information reaches AI inference providers.
 * Works on both client-side (PII scrubbing) and server-side (header stripping).
 * 
 * Client: strips PII patterns from prompts, generates ephemeral request IDs
 * Server: strips IP/identity headers, rotates referers, hashes rate-limit keys
 */

// ─── PII Detection Patterns ───────────────────────────────

/**
 * Regex patterns for common PII. These run client-side before
 * any prompt leaves the browser. Users can toggle this on/off.
 */
const PII_PATTERNS: { name: string; pattern: RegExp; replacement: string }[] = [
  {
    name: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[EMAIL]',
  },
  {
    name: 'phone_us',
    pattern: /(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g,
    replacement: '[PHONE]',
  },
  {
    name: 'phone_intl',
    pattern: /\+\d{1,3}[-.]?\d{4,14}/g,
    replacement: '[PHONE]',
  },
  {
    name: 'ssn',
    pattern: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
    replacement: '[SSN]',
  },
  {
    name: 'credit_card',
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    replacement: '[CARD]',
  },
  {
    name: 'ip_v4',
    pattern: /\b(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    replacement: '[IP]',
  },
  {
    name: 'street_address',
    pattern: /\b\d{1,5}\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Rd|Road|Ct|Court|Pl|Place|Way|Cir|Circle)\.?\b/g,
    replacement: '[ADDRESS]',
  },
  {
    name: 'date_of_birth',
    pattern: /\b(?:0[1-9]|1[0-2])[/\-](?:0[1-9]|[12]\d|3[01])[/\-](?:19|20)\d{2}\b/g,
    replacement: '[DOB]',
  },
];

// ─── Types ─────────────────────────────────────────────────

export interface AnonymizationConfig {
  stripPII: boolean;           // Auto-redact PII patterns from prompts
  stripIdentityHeaders: boolean; // Remove IP, referer, user-agent from upstream
  rotateReferer: boolean;      // Use generic rotating referers
  ephemeralRequestIds: boolean; // Generate uncorrelated request IDs
  hashRateLimitKeys: boolean;  // Hash IPs for rate limiting instead of storing raw
}

export interface AnonymizationResult {
  originalLength: number;
  anonymizedLength: number;
  redactionsApplied: { pattern: string; count: number }[];
  requestId: string;
}

export interface AnonymizedRequest {
  body: Record<string, unknown>;
  headers: Record<string, string>;
  meta: AnonymizationResult;
}

const DEFAULT_CONFIG: AnonymizationConfig = {
  stripPII: true,
  stripIdentityHeaders: true,
  rotateReferer: true,
  ephemeralRequestIds: true,
  hashRateLimitKeys: true,
};

// ─── Client-Side: PII Stripping ────────────────────────────

/**
 * Strip PII patterns from a text string.
 * Returns the sanitized text and a report of what was redacted.
 */
export function stripPII(text: string): { cleaned: string; redactions: AnonymizationResult['redactionsApplied'] } {
  let cleaned = text;
  const redactions: AnonymizationResult['redactionsApplied'] = [];

  for (const { name, pattern, replacement } of PII_PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    const matches = cleaned.match(pattern);
    if (matches && matches.length > 0) {
      redactions.push({ pattern: name, count: matches.length });
      cleaned = cleaned.replace(pattern, replacement);
    }
  }

  return { cleaned, redactions };
}

/**
 * Strip PII from all messages in a chat request body.
 * Only processes user and system messages (not assistant responses).
 */
export function anonymizeMessages(
  messages: Array<{ role: string; content: string }>,
  config: AnonymizationConfig = DEFAULT_CONFIG
): { messages: Array<{ role: string; content: string }>; redactions: AnonymizationResult['redactionsApplied'] } {
  if (!config.stripPII) {
    return { messages, redactions: [] };
  }

  const allRedactions: AnonymizationResult['redactionsApplied'] = [];

  const anonymized = messages.map(msg => {
    // Only strip PII from user and system messages
    if (msg.role === 'user' || msg.role === 'system') {
      const { cleaned, redactions } = stripPII(msg.content);
      allRedactions.push(...redactions);
      return { ...msg, content: cleaned };
    }
    return msg;
  });

  return { messages: anonymized, redactions: allRedactions };
}

// ─── Client-Side: Ephemeral Request IDs ────────────────────

/**
 * Generate a cryptographically random request ID with zero user correlation.
 * Uses UUID v4 format — no timestamp, no machine ID, no sequence.
 */
export function generateEphemeralId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ─── Client-Side: Full Request Anonymization ───────────────

/**
 * Anonymize a complete chat request before sending to the server.
 * This is called client-side in the ChatView before POST /api/chat.
 */
export function anonymizeClientRequest(
  body: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    stream?: boolean;
    [key: string]: unknown;
  },
  config: AnonymizationConfig = DEFAULT_CONFIG
): AnonymizedRequest {
  const requestId = config.ephemeralRequestIds
    ? generateEphemeralId()
    : 'static';

  const { messages: anonMessages, redactions } = anonymizeMessages(
    body.messages,
    config
  );

  const originalLength = JSON.stringify(body.messages).length;
  const anonymizedBody = {
    ...body,
    messages: anonMessages,
    // Add ephemeral request ID — server can use for streaming correlation
    // but it has zero correlation to user identity
    _requestId: requestId,
  };
  const anonymizedLength = JSON.stringify(anonymizedBody.messages).length;

  return {
    body: anonymizedBody,
    headers: {
      'Content-Type': 'application/json',
      // No cookies, no auth tokens, no user identifiers
      // The server API key handles auth with OpenRouter
    },
    meta: {
      originalLength,
      anonymizedLength,
      redactionsApplied: redactions,
      requestId,
    },
  };
}

// ─── Server-Side: Header Stripping ─────────────────────────
// These functions are used in the API route (src/app/api/chat/route.ts)
// and proxy (src/proxy.ts) on the server side.

/**
 * Pool of generic referers to rotate through.
 * Prevents AI providers from fingerprinting based on a fixed referer.
 */
const REFERER_POOL = [
  'https://app.example.com',
  'https://chat.example.com',
  'https://ai.example.com',
  'https://assistant.example.com',
  'https://workspace.example.com',
];

const TITLE_POOL = [
  'AI Chat',
  'Chat App',
  'AI Assistant',
  'Workspace',
  'AI Workspace',
];

/**
 * Get a random referer from the pool.
 */
export function getRotatingReferer(): string {
  return REFERER_POOL[Math.floor(Math.random() * REFERER_POOL.length)];
}

/**
 * Get a random X-Title value from the pool.
 */
export function getRotatingTitle(): string {
  return TITLE_POOL[Math.floor(Math.random() * TITLE_POOL.length)];
}

/**
 * Strip identifying headers from an incoming request before forwarding upstream.
 * Returns clean headers safe to send to AI providers.
 */
export function sanitizeUpstreamHeaders(
  apiKey: string,
  config: AnonymizationConfig = DEFAULT_CONFIG
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  if (config.rotateReferer) {
    headers['HTTP-Referer'] = getRotatingReferer();
    headers['X-Title'] = getRotatingTitle();
  } else {
    headers['HTTP-Referer'] = 'https://arcus.ai';
    headers['X-Title'] = 'Arcus';
  }

  // Explicitly DO NOT forward:
  // - x-forwarded-for (client IP)
  // - x-real-ip (client IP)
  // - user-agent (browser fingerprint)
  // - cookie (session data)
  // - authorization (user tokens)
  // - referer (original page URL)

  return headers;
}

/**
 * List of headers to strip from incoming requests in the proxy layer.
 * These are removed before any logging or forwarding.
 */
export const STRIP_HEADERS = [
  'x-forwarded-for',
  'x-real-ip',
  'x-client-ip',
  'cf-connecting-ip',
  'true-client-ip',
  'x-cluster-client-ip',
  'forwarded',
  'via',
] as const;

// ─── Server-Side: IP Hashing for Rate Limiting ─────────────

/**
 * Hash an IP address for rate limiting.
 * We need to rate limit, but we don't need to store raw IPs.
 * Uses SHA-256 with a server-side pepper for irreversibility.
 */
export async function hashIPForRateLimit(
  ip: string,
  pepper: string = 'arcus-rate-limit-pepper'
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${pepper}:${ip}`);

  // Use SubtleCrypto if available (Node 18+ / Edge Runtime)
  if (typeof globalThis.crypto?.subtle !== 'undefined') {
    const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback: simple FNV-1a hash (not cryptographic, but sufficient for rate limiting)
  let h = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    h ^= data[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// ─── Server-Side: No-Log Middleware ────────────────────────

/**
 * Metadata that IS safe to log for operational monitoring.
 * This follows Venice.ai's approach: log events, never content.
 */
export interface SafeLogEntry {
  timestamp: number;
  requestId: string;          // ephemeral, no user correlation
  model: string;              // which model was requested
  streamMode: boolean;        // whether streaming was used
  responseTimeMs: number;     // latency metric
  statusCode: number;         // HTTP status
  rateLimitHash: string;      // hashed IP for rate tracking
  // NEVER logged: prompt content, response content, user ID,
  // IP address, user-agent, cookies, or any identifying info
}

/**
 * Create a safe log entry from a request. No sensitive data included.
 */
export function createSafeLogEntry(
  requestId: string,
  model: string,
  stream: boolean,
  statusCode: number,
  startTime: number,
  rateLimitHash: string
): SafeLogEntry {
  return {
    timestamp: Date.now(),
    requestId,
    model,
    streamMode: stream,
    responseTimeMs: Date.now() - startTime,
    statusCode,
    rateLimitHash,
  };
}

// ─── Configuration Helper ──────────────────────────────────

/**
 * Get the current anonymization config, merging user preferences.
 * Call this in both client (ChatView) and server (API route) contexts.
 */
export function getAnonymizationConfig(
  userOverrides?: Partial<AnonymizationConfig>
): AnonymizationConfig {
  return { ...DEFAULT_CONFIG, ...userOverrides };
}

/**
 * Check if anonymization is fully enabled.
 */
export function isFullyAnonymized(config: AnonymizationConfig): boolean {
  return (
    config.stripPII &&
    config.stripIdentityHeaders &&
    config.rotateReferer &&
    config.ephemeralRequestIds &&
    config.hashRateLimitKeys
  );
}
