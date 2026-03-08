export interface ProviderMeta {
  id: string;
  name: string;
  short: string;
  bg: string;
  fg: string;
  ring: string;
}

const PROVIDER_META: Record<string, ProviderMeta> = {
  anthropic: { id: 'anthropic', name: 'Anthropic', short: 'AI', bg: '#5D2B1E', fg: '#F8C6A0', ring: 'rgba(248,198,160,0.35)' },
  openai: { id: 'openai', name: 'OpenAI', short: 'OA', bg: '#103E31', fg: '#7DE2BF', ring: 'rgba(125,226,191,0.35)' },
  google: { id: 'google', name: 'Google', short: 'G', bg: 'linear-gradient(135deg, #4285F4 0%, #34A853 35%, #FBBC05 68%, #EA4335 100%)', fg: '#FFFFFF', ring: 'rgba(66,133,244,0.35)' },
  deepseek: { id: 'deepseek', name: 'DeepSeek', short: 'DS', bg: '#1F275A', fg: '#C5D2FF', ring: 'rgba(121,142,255,0.35)' },
  'meta-llama': { id: 'meta-llama', name: 'Meta', short: '∞', bg: '#112453', fg: '#A8C2FF', ring: 'rgba(115,158,255,0.35)' },
  'x-ai': { id: 'x-ai', name: 'xAI', short: 'x', bg: '#151515', fg: '#F5F5F5', ring: 'rgba(255,255,255,0.25)' },
  mistralai: { id: 'mistralai', name: 'Mistral', short: 'M', bg: '#512300', fg: '#FFCB92', ring: 'rgba(255,163,72,0.35)' },
  cohere: { id: 'cohere', name: 'Cohere', short: 'C', bg: '#36184F', fg: '#D9B5FF', ring: 'rgba(189,131,255,0.35)' },
  qwen: { id: 'qwen', name: 'Qwen', short: 'Q', bg: '#163F3C', fg: '#9EF3EA', ring: 'rgba(97,241,226,0.35)' },
  liquid: { id: 'liquid', name: 'Liquid AI', short: 'L', bg: '#17344A', fg: '#A9D9FF', ring: 'rgba(108,192,255,0.35)' },
  'bytedance-seed': { id: 'bytedance-seed', name: 'ByteDance', short: 'BD', bg: '#2B1C49', fg: '#D5C2FF', ring: 'rgba(160,124,255,0.35)' },
  inception: { id: 'inception', name: 'Inception', short: 'I', bg: '#413000', fg: '#FFE6A1', ring: 'rgba(255,214,94,0.35)' },
  fallback: { id: 'fallback', name: 'Provider', short: 'AI', bg: '#1F2937', fg: '#E5E7EB', ring: 'rgba(229,231,235,0.25)' },
};

export function getProviderId(modelIdOrProvider: string): string {
  return modelIdOrProvider.includes('/') ? modelIdOrProvider.split('/')[0] : modelIdOrProvider.toLowerCase();
}

export function getProviderMeta(modelIdOrProvider: string): ProviderMeta {
  const providerId = getProviderId(modelIdOrProvider);
  return PROVIDER_META[providerId] || {
    ...PROVIDER_META.fallback,
    id: providerId,
    name: providerId.charAt(0).toUpperCase() + providerId.slice(1),
  };
}
