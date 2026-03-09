/**
 * Server-side input validation and sanitisation utilities.
 * Use these in all API route handlers before processing user-supplied data.
 */

// Maximum payload sizes
export const MAX_QUERY_LENGTH = 500;
export const MAX_MESSAGE_LENGTH = 32_000;   // ~8k tokens
export const MAX_MESSAGES_COUNT = 200;
export const MAX_MODEL_ID_LENGTH = 128;
export const ALLOWED_CURRENCIES = new Set([
  'btc', 'eth', 'usdt', 'usdc', 'bnb', 'sol', 'xrp', 'ada', 'doge', 'matic',
  'ltc', 'dot', 'avax', 'link', 'xlm', 'algo', 'atom', 'near', 'icp', 'fil',
]);

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly statusCode = 400
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Strip characters that are meaningless in a plain text search query.
 * Does NOT strip HTML — that's handled at render time by escapeHtml.
 */
export function sanitizeSearchQuery(raw: unknown): string {
  if (typeof raw !== 'string') throw new ValidationError('query must be a string', 'query');
  const trimmed = raw.trim();
  if (trimmed.length === 0) throw new ValidationError('query is required', 'query');
  if (trimmed.length > MAX_QUERY_LENGTH)
    throw new ValidationError(
      `query exceeds maximum length of ${MAX_QUERY_LENGTH}`,
      'query'
    );
  // Remove ASCII control characters
  return trimmed.replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Validate a chat messages array.
 * Each message must have role in {system,user,assistant} and a string content.
 */
export function validateMessages(raw: unknown): { role: string; content: string }[] {
  if (!Array.isArray(raw)) throw new ValidationError('messages must be an array', 'messages');
  if (raw.length === 0) throw new ValidationError('messages array is empty', 'messages');
  if (raw.length > MAX_MESSAGES_COUNT)
    throw new ValidationError(
      `messages array exceeds max count of ${MAX_MESSAGES_COUNT}`,
      'messages'
    );

  const VALID_ROLES = new Set(['system', 'user', 'assistant']);

  return raw.map((msg, i) => {
    if (typeof msg !== 'object' || msg === null)
      throw new ValidationError(`messages[${i}] must be an object`, 'messages');
    const m = msg as Record<string, unknown>;
    if (!VALID_ROLES.has(m.role as string))
      throw new ValidationError(
        `messages[${i}].role must be one of: system, user, assistant`,
        'messages'
      );
    if (typeof m.content !== 'string')
      throw new ValidationError(`messages[${i}].content must be a string`, 'messages');
    if (m.content.length > MAX_MESSAGE_LENGTH)
      throw new ValidationError(
        `messages[${i}].content exceeds max length of ${MAX_MESSAGE_LENGTH}`,
        'messages'
      );
    return { role: m.role as string, content: m.content };
  });
}

/**
 * Validate a model ID string (e.g. "anthropic/claude-sonnet-4.5").
 */
export function validateModelId(raw: unknown): string {
  if (typeof raw !== 'string') throw new ValidationError('model must be a string', 'model');
  const trimmed = raw.trim();
  if (trimmed.length > MAX_MODEL_ID_LENGTH)
    throw new ValidationError('model ID too long', 'model');
  // Only allow alphanumeric, hyphens, underscores, dots, slashes
  if (!/^[a-zA-Z0-9/_:.-]+$/.test(trimmed))
    throw new ValidationError('model ID contains invalid characters', 'model');
  return trimmed;
}

/**
 * Validate a payment currency token.
 */
export function validatePayCurrency(raw: unknown): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'string') throw new ValidationError('payCurrency must be a string', 'payCurrency');
  const lower = raw.toLowerCase().trim();
  if (!ALLOWED_CURRENCIES.has(lower))
    throw new ValidationError(`payCurrency '${lower}' is not supported`, 'payCurrency');
  return lower;
}

/**
 * Validate an email address (basic RFC-5322 surface check).
 */
export function validateEmail(raw: unknown): string {
  if (typeof raw !== 'string') throw new ValidationError('email must be a string', 'email');
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length > 254) throw new ValidationError('email is too long', 'email');
  if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
    throw new ValidationError('email address is invalid', 'email');
  return trimmed;
}
