export const brandLogoUrl = '/logos/brand/Arcus.PNG';

export const providerLogos: Record<string, string> = {
  anthropic: '/logos/providers/Anthropic.png',
  openai: '/logos/providers/Chatgpt.jpg',
  google: '/logos/providers/Gemini.webp',
  deepseek: '/logos/providers/Deepseek.png',
  'meta-llama': '/logos/providers/Meta.webp',
  meta: '/logos/providers/Meta.webp',
  'x-ai': '/logos/providers/Grok.png',
  xai: '/logos/providers/Grok.png',
  mistralai: '/logos/providers/Mistral.webp',
  mistral: '/logos/providers/Mistral.webp',
  cohere: '/logos/providers/Cohere.png',
  qwen: '/logos/providers/Qwen.png',
  alibaba: '/logos/providers/Qwen.png',
};

export function getProviderLogo(id: string): string | null {
  return providerLogos[id.split('/')[0].toLowerCase()] || null;
}