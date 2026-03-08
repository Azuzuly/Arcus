const DEFAULT_POLLINATIONS_BASE_URL = 'https://image.pollinations.ai';

export interface PollinationsImageOptions {
  prompt: string;
  model?: string;
  width: number;
  height: number;
  seed?: string | number;
  negativePrompt?: string;
}

export function getPollinationsBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_POLLINATIONS_BASE_URL || DEFAULT_POLLINATIONS_BASE_URL).replace(/\/$/, '');
}

export function buildPollinationsImageUrl(options: PollinationsImageOptions): string {
  const searchParams = new URLSearchParams({
    width: String(options.width),
    height: String(options.height),
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

export function preloadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(url);
    image.onerror = () => reject(new Error('Pollinations could not generate this image right now.'));
    image.src = url;
  });
}
