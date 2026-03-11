/* eslint-disable @next/next/no-img-element */
'use client';

import { useStore } from '@/lib/store';
import { useState, useMemo, useRef, useEffect } from 'react';
import { ModelInfo } from '@/lib/types';
import { formatTokenCost, formatNumber } from '@/lib/utils';
import { brandLogoUrl, getProviderLogo } from '@/lib/providerLogos';
import { ROUTER_MODEL_ID } from '@/lib/modelRouter';

type ModelFilter = 'speed' | 'intelligence' | 'price' | 'vision' | 'multimodal';

const PROVIDER_LOGOS: Record<string, string> = {
  arcus: '🧠',
  anthropic: '🟠', openai: '🟢', google: '🔵', deepseek: '🟣',
  'meta-llama': '🔷', 'x-ai': '⚫', mistralai: '🟡', cohere: '🔴',
  qwen: '🟤', liquid: '💧', 'bytedance-seed': '🌱', inception: '⚡',
};

function getProviderEmoji(id: string): string {
  const provider = id.split('/')[0];
  return PROVIDER_LOGOS[provider] || '◆';
}

function getProviderName(id: string): string {
  const p = id.split('/')[0];
  const names: Record<string, string> = {
    arcus: 'Arcus',
    anthropic: 'Anthropic', openai: 'OpenAI', google: 'Google',
    deepseek: 'DeepSeek', 'meta-llama': 'Meta', 'x-ai': 'xAI',
    mistralai: 'Mistral', cohere: 'Cohere', qwen: 'Qwen',
    liquid: 'Liquid AI', 'bytedance-seed': 'ByteDance', inception: 'Inception',
  };
  return names[p] || p.charAt(0).toUpperCase() + p.slice(1);
}

function getProviderLabel(model: ModelInfo): string {
  return model.provider || getProviderName(model.id);
}

function getModalities(m: ModelInfo): { emoji: string; label: string }[] {
  const result: { emoji: string; label: string }[] = [];
  const inp = m.architecture?.input_modalities || [];
  const out = m.architecture?.output_modalities || [];
  if (inp.includes('text')) result.push({ emoji: '💬', label: 'Text' });
  const knownVision = /claude|gpt-4|gpt-5|gemini|llama-4|qwen.*vl|pixtral|grok/i.test(m.id);
  if (inp.includes('image') || knownVision) result.push({ emoji: '👁️', label: 'Vision' });
  if (inp.includes('audio')) result.push({ emoji: '🎤', label: 'Audio' });
  if (inp.includes('video')) result.push({ emoji: '🎥', label: 'Video' });
  if (out.includes('image')) result.push({ emoji: '🎨', label: 'Image Gen' });
  return result;
}

function getRuntimeLabel(runtime?: 'puter' | 'openrouter'): string {
  return runtime === 'openrouter' ? 'OpenRouter' : 'Puter';
}

function getRuntimeBadges(model: ModelInfo): Array<'puter' | 'openrouter'> {
  return model.availableRuntimes?.length ? model.availableRuntimes : model.runtime ? [model.runtime] : [];
}

function formatSpecValue(value?: number | string, formatter?: (value: string | number) => string): string {
  if (value === undefined || value === null || value === '') return 'Unavailable';
  return formatter ? formatter(value) : String(value);
}

function parseNumericCost(value?: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isFastModel(model: ModelInfo): boolean {
  return typeof model.speedTokensPerSecond === 'number' && model.speedTokensPerSecond >= 40;
}

function isIntelligentModel(model: ModelInfo): boolean {
  return typeof model.intelligenceIndex === 'number' && model.intelligenceIndex >= 40;
}

function isBudgetModel(): boolean {
  // Price filter now sorts by cost rather than filtering, so all models pass
  return true;
}

function hasVision(model: ModelInfo): boolean {
  if (model.architecture?.input_modalities?.includes('image')) return true;
  // Known vision models that may lack modality metadata
  const visionIds = /claude|gpt-4|gpt-5|gemini|llama-4|qwen.*vl|pixtral|grok/i;
  return visionIds.test(model.id);
}

function isMultimodal(model: ModelInfo): boolean {
  const modalities = new Set([...(model.architecture?.input_modalities || []), ...(model.architecture?.output_modalities || [])]);
  return modalities.size >= 2;
}

function matchesFilter(model: ModelInfo, filter: ModelFilter): boolean {
  switch (filter) {
    case 'speed': return isFastModel(model);
    case 'intelligence': return isIntelligentModel(model);
    case 'price': return isBudgetModel();
    case 'vision': return hasVision(model);
    case 'multimodal': return isMultimodal(model);
    default: return true;
  }
}

function getOpennessLabel(model: ModelInfo): string {
  if (model.openness === 'open') return 'Open';
  if (model.openness === 'proprietary') return 'Proprietary';
  return 'Unknown';
}

export default function ModelSelector({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState<ModelInfo | null>(null);
  const [activeFilters, setActiveFilters] = useState<ModelFilter[]>([]);
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window === 'undefined' ? 1200 : window.innerWidth);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [onClose]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const routerModel = useMemo(
    () => state.allModels.find(model => model.id === ROUTER_MODEL_ID) || null,
    [state.allModels]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const matches = state.allModels.filter(model => {
      if (model.id === ROUTER_MODEL_ID) return false;
      const matchesSearch = !q || model.id.toLowerCase().includes(q) || model.name.toLowerCase().includes(q) || getProviderLabel(model).toLowerCase().includes(q);
      const matchesActiveFilters = activeFilters.every(filter => matchesFilter(model, filter));
      return matchesSearch && matchesActiveFilters;
    });

    return routerModel ? [routerModel, ...matches] : matches;
  }, [activeFilters, routerModel, state.allModels, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, ModelInfo[]> = {};
    const favoriteSet = new Set(state.favoriteModelIds);
    const priceActive = activeFilters.includes('price');
    const routerModel = filtered.find(model => model.id === ROUTER_MODEL_ID);
    const nonRouterModels = filtered.filter(model => model.id !== ROUTER_MODEL_ID);

    if (routerModel) {
      groups['Pinned · Cortex Auto Router'] = [routerModel];
    }

    if (priceActive) {
      // Sort all models by price cheapest→most expensive
      const sorted = [...nonRouterModels].sort((a, b) => {
        const costA = parseNumericCost(a.pricing?.prompt) ?? Infinity;
        const costB = parseNumericCost(b.pricing?.prompt) ?? Infinity;
        return costA - costB;
      });
      const favs = sorted.filter(m => favoriteSet.has(m.id));
      if (favs.length > 0) groups['★ Favorites'] = favs;
      const rest = sorted.filter(m => !favoriteSet.has(m.id));
      if (rest.length > 0) groups['All Models (cheapest first)'] = rest;
    } else {
      const favs = nonRouterModels.filter(m => favoriteSet.has(m.id));
      if (favs.length > 0) groups['★ Favorites'] = favs;
      nonRouterModels.filter(m => !favoriteSet.has(m.id)).forEach(m => {
        const provider = getProviderLabel(m);
        if (!groups[provider]) groups[provider] = [];
        groups[provider].push(m);
      });
    }
    return Object.fromEntries(
      Object.entries(groups).map(([provider, models]) => [provider, priceActive ? models : models.sort((a, b) => a.name.localeCompare(b.name))])
    );
  }, [filtered, state.favoriteModelIds, activeFilters]);

  const selectModel = (m: ModelInfo) => {
    dispatch({ type: 'SET_SELECTED_MODEL', model: { id: m.id, name: m.name, provider: getProviderLabel(m), runtime: m.runtime } });
    onClose();
  };

  const preview = hovered || state.allModels.find(m => m.id === state.selectedModel.id) || routerModel || null;
  const compact = viewportWidth < 900;
  const toggleFilter = (filter: ModelFilter) => {
    setActiveFilters(current => current.includes(filter) ? current.filter(item => item !== filter) : [...current, filter]);
  };
  const visibleSpecs = preview ? [
    { label: 'Provider', value: getProviderLabel(preview) },
    { label: 'Access', value: getOpennessLabel(preview) },
    { label: 'Context', value: formatSpecValue(preview.context_length, value => `${formatNumber(Number(value))} tokens`) },
    { label: 'Max output', value: formatSpecValue(preview.top_provider?.max_completion_tokens, value => `${formatNumber(Number(value))} tokens`) },
    { label: 'Input price', value: preview.pricing?.prompt ? formatTokenCost(preview.pricing.prompt) : undefined },
    { label: 'Output price', value: preview.pricing?.completion ? formatTokenCost(preview.pricing.completion) : undefined },
    { label: 'Output speed', value: formatSpecValue(preview.speedTokensPerSecond, value => `${value} tok/s`) },
    { label: 'Latency', value: formatSpecValue(preview.latencySeconds, value => `${value}s`) },
    { label: 'AA intelligence', value: formatSpecValue(preview.intelligenceIndex) },
    { label: 'Blended price', value: formatSpecValue(preview.priceBlended, value => `$${value}/1M`) },
  ].filter(spec => spec.value && spec.value !== 'Unavailable') : [];

  return (
    <div ref={panelRef} className="panel-enter" style={{
      position: 'fixed', top: 'clamp(126px, 18vh, 158px)', left: '50%', transform: 'translateX(-50%)', zIndex: 120,
      width: compact ? 'min(92vw, 460px)' : 'min(760px, calc(100vw - 64px))',
      maxHeight: compact ? 'min(70vh, 560px)' : 'min(620px, calc(100vh - 160px))', borderRadius: 24,
      background: 'rgba(10,14,22,0.88)', backdropFilter: 'blur(40px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: '0 30px 90px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.04)',
      display: 'flex', overflow: 'hidden', overflowX: 'hidden',
    }}>
      {/* Left — model list */}
      <div style={{ width: !compact && preview ? '52%' : '100%', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', minWidth: 0 }}>
        <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em' }}>Choose a model</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.46)', marginTop: 4 }}>
                Filter by capability, then compare the details on the right.
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 34, height: 34, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)', color: '#fff', cursor: 'pointer', fontSize: 16,
            }}>×</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search models or providers..."
            autoFocus
            style={{
              width: '100%', padding: '11px 13px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
              color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
            }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {routerModel && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 11px', borderRadius: 999,
                background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(59,130,246,0.24)',
                color: '#DBEAFE', fontSize: 11, fontWeight: 700,
              }}>
                Pinned first: {routerModel.name}
              </span>
            )}
            {([
              { id: 'speed', label: 'Speed' },
              { id: 'intelligence', label: 'Intelligence' },
              { id: 'price', label: 'Price' },
              { id: 'vision', label: 'Vision' },
              { id: 'multimodal', label: 'Multimodal' },
            ] as Array<{ id: ModelFilter; label: string }>).map(filter => {
              const active = activeFilters.includes(filter.id);
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  style={{
                    padding: '7px 11px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                    background: active ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${active ? 'rgba(59,130,246,0.28)' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? '#DBEAFE' : 'rgba(255,255,255,0.64)', fontSize: 11, fontWeight: 700,
                  }}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 8px 12px' }}>
          {Object.entries(grouped).map(([provider, models]) => (
            <div key={provider} style={{ marginBottom: 10 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {getProviderLogo(models[0]?.provider || models[0]?.id || '') ? (
                  <img src={getProviderLogo(models[0]?.provider || models[0]?.id || '') || ''} alt="" style={{ width: 14, height: 14, objectFit: 'contain', borderRadius: 3 }} />
                ) : (
                  <span>{PROVIDER_LOGOS[provider.toLowerCase()] || getProviderEmoji(models[0]?.id || '')}</span>
                )}
                {provider}
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>({models.length})</span>
              </div>
              {models.map(m => (
                <div key={m.id}
                  onMouseEnter={() => setHovered(m)}
                  style={{
                    display: 'flex', alignItems: 'stretch', gap: 8, padding: '0 6px 6px',
                  }}>
                  <button
                    onClick={() => selectModel(m)}
                    style={{
                      flex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 12px', borderRadius: 16,
                      background: state.selectedModel.id === m.id ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.02)',
                      border: state.selectedModel.id === m.id ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.16s ease',
                    }}
                    onFocus={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    onBlur={e => { if (state.selectedModel.id !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  >
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.44)' }}>{getProviderLabel(m)}</span>
                        {m.id === ROUTER_MODEL_ID && (
                          <>
                            <span style={{ fontSize: 10, color: '#DBEAFE', fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.28)' }}>PINNED</span>
                            <span className="cortex-badge" style={{ fontSize: 10, padding: '3px 8px' }}>CORTEX AUTO</span>
                          </>
                        )}
                        {m.context_length ? (
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.34)' }}>{formatNumber(m.context_length)} ctx</span>
                        ) : null}
                        {getRuntimeBadges(m).map(runtime => (
                          <span key={`${m.id}-${runtime}`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
                            borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                            fontSize: 10, color: 'rgba(255,255,255,0.78)',
                          }}>
                            {runtime === 'openrouter' ? <img src="/logos/providers/OpenRouter.svg" alt="" style={{ width: 12, height: 12, borderRadius: 999 }} /> : <img src={brandLogoUrl} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />}
                            {getRuntimeLabel(runtime)}
                          </span>
                        ))}
                        {activeFilters.includes('price') && m.pricing?.prompt && (
                          <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>{formatTokenCost(m.pricing.prompt)}</span>
                        )}
                      </span>
                    </span>
                  </button>

                  <button
                    onClick={e => { e.stopPropagation(); dispatch({ type: 'TOGGLE_FAVORITE_MODEL', modelId: m.id }); }}
                    title={state.favoriteModelIds.includes(m.id) ? 'Remove favorite' : 'Favorite model'}
                    style={{
                      width: 40, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer', fontSize: 14, color: state.favoriteModelIds.includes(m.id) ? '#F59E0B' : 'rgba(255,255,255,0.22)',
                    }}
                  >
                    ★
                  </button>
                </div>
              ))}
            </div>
          ))}
          {state.allModels.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading models...</div>
          )}
        </div>
      </div>

      {/* Right — spec panel */}
      {!compact && preview && (
        <div style={{
          width: '48%', padding: 16, borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden',
        }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#fff', marginBottom: 4, letterSpacing: '-0.02em' }}>{preview.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {getProviderLogo(preview.provider || preview.id) ? (
                <img src={getProviderLogo(preview.provider || preview.id) || ''} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} />
              ) : (
                <span>{getProviderEmoji(preview.id)}</span>
              )}
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{getProviderLabel(preview)}</span>
              {getRuntimeBadges(preview).map(runtime => (
                <span key={`preview-${runtime}`} style={{ fontSize: 10, color: 'rgba(255,255,255,0.72)', padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {runtime === 'openrouter' ? <img src="/logos/providers/OpenRouter.svg" alt="" style={{ width: 12, height: 12, borderRadius: 999 }} /> : <img src={brandLogoUrl} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />}
                  {getRuntimeLabel(runtime)}
                </span>
              ))}
            </div>
          </div>

          {preview.description && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.54)', lineHeight: 1.6, margin: 0 }}>
              {preview.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Model details</div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)' }}>Specs use OpenRouter data when available</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {visibleSpecs.map(spec => (
              <div key={spec.label} style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.07)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{spec.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{spec.value}</div>
              </div>
            ))}
          </div>

          {visibleSpecs.length === 0 && (
            <div style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              This model does not expose detailed metadata yet, but you can still use it normally.
            </div>
          )}

          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supports</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {getModalities(preview).map(mod => (
                <span key={mod.label} style={{
                  padding: '5px 10px', background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)', borderRadius: 999,
                  fontSize: 11, color: 'rgba(59,130,246,0.9)',
                }}>{mod.emoji} {mod.label}</span>
              ))}
              {getModalities(preview).length === 0 && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>No modality data available for this model yet.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
