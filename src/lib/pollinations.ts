const DEFAULT_POLLINATIONS_BASE_URL = 'https://image.pollinations.ai';

export interface PollinationsImageOptions {
  prompt: string;
  model?: string;
  width: number;
  height: number;
  seed?: string | number;
  negativePrompt?: string;
}

const STABLE_MODEL_ORDER = ['flux', 'turbo', 'flux-anime', 'gptimage'] as const;

export function getPollinationsBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_POLLINATIONS_BASE_URL || DEFAULT_POLLINATIONS_BASE_URL).replace(/\/$/, '');
}

export function normalizePollinationsDimensions(width: number, height: number) {
  return {
    width: Math.max(256, Math.min(2048, Math.round(width || 1024))),
    height: Math.max(256, Math.min(2048, Math.round(height || 1024))),
  };
}

export function getPollinationsModelFallbacks(primary?: string): string[] {
  const normalized = primary?.trim() || STABLE_MODEL_ORDER[0];
  return [normalized, ...STABLE_MODEL_ORDER.filter(model => model !== normalized)];
}

export function buildPollinationsImageUrl(options: PollinationsImageOptions): string {
  const { width, height } = normalizePollinationsDimensions(options.width, options.height);
  const searchParams = new URLSearchParams({
    width: String(width),
    height: String(height),
    nologo: 'true',
    enhance: 'true',
    safe: 'false',
  });

  if (options.model) {
    searchParams.set('model', options.model);
  }

  if (options.seed !== undefined && options.seed !== '') {
    searchParams.set('seed', String(options.seed));
  }

  if (options.negativePrompt) {
    searchParams.set('negative', options.negativePrompt);
  }

  return `${getPollinationsBaseUrl()}/prompt/${encodeURIComponent(options.prompt)}?${searchParams.toString()}`;
}

export function getStudioRenderUrl(options: PollinationsImageOptions): string {
  const { width, height } = normalizePollinationsDimensions(options.width, options.height);
  const searchParams = new URLSearchParams({
    prompt: options.prompt,
    width: String(width),
    height: String(height),
  });

  if (options.model) {
    searchParams.set('model', options.model);
  }

  if (options.seed !== undefined && options.seed !== '') {
    searchParams.set('seed', String(options.seed));
  }

  if (options.negativePrompt) {
    searchParams.set('negativePrompt', options.negativePrompt);
  }

  return `/api/studio/render?${searchParams.toString()}`;
}

export function preloadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.src = '';
      reject(new Error('Arcus Studio timed out while waiting for the image provider.'));
    }, 45000);

    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(url);
    };

    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('Arcus Studio could not render this image right now.'));
    };

    image.decoding = 'async';
    image.loading = 'eager';
    image.src = url;
  });
}
