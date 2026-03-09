/**
 * Runtime environment variable validation.
 * Import this in server-side code to get typed, validated env vars.
 * Throws at startup if required variables are missing.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Check your .env.local file or deployment environment settings.`
    );
  }
  return value;
}

function optionalEnv(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

/**
 * Validated server-side environment variables.
 * Only use in server components, API routes, and server actions.
 */
export function getServerEnv() {
  return {
    // Required
    OPENROUTER_API_KEY: requireEnv('OPENROUTER_API_KEY'),

    // Optional -- search falls back gracefully if not set
    TAVILY_API_KEY: optionalEnv('TAVILY_API_KEY'),
    GOOGLE_SEARCH_API_KEY: optionalEnv('GOOGLE_SEARCH_API_KEY'),
    GOOGLE_SEARCH_ENGINE_ID: optionalEnv('GOOGLE_SEARCH_ENGINE_ID'),

    // App URL for HTTP-Referer header
    NEXT_PUBLIC_APP_URL: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  };
}

/**
 * Validate that critical env vars exist at module load time (server only).
 * Call once in middleware or a startup check if you want early failure.
 */
export function validateEnv(): void {
  const missing: string[] = [];

  if (!process.env.OPENROUTER_API_KEY) missing.push('OPENROUTER_API_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Check your .env.local or deployment environment.'
    );
  }
}
