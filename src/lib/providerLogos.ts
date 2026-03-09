export const brandLogoUrl = '/logos/brand/arcus-logo.svg';

export const providerLogos: Record<string, string> = {
  anthropic: '/logos/providers/Anthropic.png',
  openai: '/logos/providers/Chatgpt.jpg',
  openrouter: '/logos/providers/OpenRouter.svg',
  chatgpt: '/logos/providers/Chatgpt.jpg',
  gpt: '/logos/providers/Chatgpt.jpg',
  google: '/logos/providers/Gemini.webp',
  gemini: '/logos/providers/Gemini.webp',
  deepseek: '/logos/providers/Deepseek.png',
  claude: '/logos/providers/Anthropic.png',
  'meta-llama': '/logos/providers/Meta.webp',
  meta: '/logos/providers/Meta.webp',
  llama: '/logos/providers/Meta.webp',
  'x-ai': '/logos/providers/Grok.png',
  xai: '/logos/providers/Grok.png',
  grok: '/logos/providers/Grok.png',
  mistralai: '/logos/providers/Mistral.webp',
  mistral: '/logos/providers/Mistral.webp',
  cohere: '/logos/providers/Cohere.png',
  qwen: '/logos/providers/Qwen.png',
  alibaba: '/logos/providers/Qwen.png',
  ai21: '/logos/providers/OpenRouter.svg',
};

function normalizeProviderKey(id: string): string {
  const raw = id.split('/')[0].toLowerCase().trim();

  if (providerLogos[raw]) return raw;

  const aliasEntries: Array<[string, string]> = [
    ['claude', 'anthropic'],
    ['chatgpt', 'openai'],
    ['gpt', 'openai'],
    ['gemini', 'google'],
    ['llama', 'meta'],
    ['meta', 'meta'],
    ['grok', 'xai'],
    ['deepseek', 'deepseek'],
    ['mistral', 'mistral'],
    ['qwen', 'qwen'],
    ['ai21', 'ai21'],
    ['openrouter', 'openrouter'],
  ];

  for (const [needle, mapped] of aliasEntries) {
    if (raw.includes(needle)) return mapped;
  }

  return raw;
}

export function getProviderLogo(id: string): string | null {
  return providerLogos[normalizeProviderKey(id)] || null;
}