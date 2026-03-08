'use client';

import { useStore } from '@/lib/store';
import { useState, useMemo, useRef, useEffect } from 'react';
import { ModelInfo } from '@/lib/types';
import { formatTokenCost, formatNumber } from '@/lib/utils';
import { getProviderMeta } from '@/lib/providers';

function ProviderLogo({ modelId, size = 20 }: { modelId: string; size?: number }) {
  const provider = getProviderMeta(modelId);

  return (
    <span style={{
      width: size,
      height: size,
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: provider.bg,
      color: provider.fg,
      fontSize: provider.short.length > 1 ? Math.max(8, size * 0.4) : Math.max(10, size * 0.55),
      fontWeight: 700,
      boxShadow: `0 0 0 1px ${provider.ring}`,
      flexShrink: 0,
    }}>
      {provider.short}
    </span>
  );
}

function getProviderName(id: string): string {
  return getProviderMeta(id).name;
}

function getModalities(model: ModelInfo): { label: string; tint: string }[] {
  const result: { label: string; tint: string }[] = [];
  const input = model.architecture?.input_modalities || [];
  const output = model.architecture?.output_modalities || [];

  if (input.includes('text')) result.push({ label: 'Text', tint: 'rgba(124,140,255,0.18)' });
  if (input.includes('image')) result.push({ label: 'Vision', tint: 'rgba(98,196,255,0.18)' });
  if (input.includes('audio')) result.push({ label: 'Audio', tint: 'rgba(120,231,169,0.18)' });
  if (input.includes('video')) result.push({ label: 'Video', tint: 'rgba(255,170,120,0.18)' });
  if (output.includes('image')) result.push({ label: 'Image', tint: 'rgba(255,123,176,0.18)' });

  return result;
}

export default function ModelSelector({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState<ModelInfo | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose();
    };
    const timer = window.setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!search) return state.allModels;
    const query = search.toLowerCase();
    return state.allModels.filter(model =>
      model.id.toLowerCase().includes(query) ||
      model.name.toLowerCase().includes(query) ||
      getProviderName(model.id).toLowerCase().includes(query) ||
      model.bestFor?.some(item => item.toLowerCase().includes(query))
    );
  }, [search, state.allModels]);

  const grouped = useMemo(() => {
    const groups: Record<string, ModelInfo[]> = {};
    const favorites = filtered.filter(model => state.favoriteModelIds.includes(model.id));
    if (favorites.length > 0) groups['Favorites'] = favorites;

    filtered.forEach(model => {
      const provider = getProviderName(model.id);
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(model);
    });

    return groups;
  }, [filtered, state.favoriteModelIds]);

  const preview = hovered || state.allModels.find(model => model.id === state.selectedModel.id) || null;

  const selectModel = (model: ModelInfo) => {
    dispatch({ type: 'SET_SELECTED_MODEL', model: { id: model.id, name: model.name, provider: getProviderName(model.id) } });
    onClose();
  };

  return (
    <div ref={panelRef} className="panel-enter" style={{
      position: 'absolute', top: 76, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
      width: 'min(860px, 94vw)', maxHeight: 'min(540px, 72vh)', borderRadius: 28,
      background: 'rgba(244,246,255,0.08)', backdropFilter: 'blur(34px) saturate(155%)',
      border: '1px solid rgba(255,255,255,0.14)',
      boxShadow: '0 30px 90px rgba(0,0,0,0.38)', display: 'flex', overflow: 'hidden',
    }}>
      <div style={{ width: preview ? '56%' : '100%', display: 'flex', flexDirection: 'column', transition: 'width 0.2s' }}>
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Browse models
          </div>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search model, provider, or use case..."
            autoFocus
            style={{
              width: '100%',
              padding: '11px 14px',
              background: 'rgba(5,8,14,0.46)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              color: '#fff',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px 12px' }}>
          {Object.entries(grouped).map(([provider, models]) => (
            <div key={provider} style={{ marginBottom: 10 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.42)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {provider === 'Favorites' ? (
                  <span style={{ width: 18, textAlign: 'center', color: '#FFD166' }}>★</span>
                ) : (
                  <ProviderLogo modelId={models[0]?.id || provider} size={18} />
                )}
                {provider}
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>({models.length})</span>
              </div>

              {models.map(model => {
                const selected = state.selectedModel.id === model.id;
                const favorite = state.favoriteModelIds.includes(model.id);

                return (
                  <button
                    key={model.id}
                    onClick={() => selectModel(model)}
                    onMouseEnter={() => setHovered(model)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      width: '100%', padding: '10px 12px', borderRadius: 14,
                      background: selected ? 'rgba(124,140,255,0.16)' : 'transparent',
                      border: selected ? '1px solid rgba(124,140,255,0.28)' : '1px solid transparent',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.14s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <ProviderLogo modelId={model.id} size={22} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{model.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {model.bestFor?.slice(0, 2).join(' · ') || model.description || getProviderName(model.id)}
                        </div>
                      </div>
                    </div>

                    <span
                      onClick={event => {
                        event.stopPropagation();
                        dispatch({ type: 'TOGGLE_FAVORITE_MODEL', modelId: model.id });
                      }}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          dispatch({ type: 'TOGGLE_FAVORITE_MODEL', modelId: model.id });
                        }
                      }}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13,
                        color: favorite ? '#FFD166' : 'rgba(255,255,255,0.22)', padding: '0 4px',
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={favorite ? 'Remove favorite' : 'Add favorite'}
                    >
                      ★
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          {state.allModels.length === 0 && (
            <div style={{ textAlign: 'center', padding: 28, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading models...</div>
          )}
        </div>
      </div>

      {preview && (
        <div style={{
          width: '44%', padding: 18, borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <ProviderLogo modelId={preview.id} size={30} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{preview.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{getProviderName(preview.id)}</div>
            </div>
          </div>

          {preview.description && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.68)', lineHeight: 1.6, margin: 0 }}>
              {preview.description}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Reasoning', value: preview.reasoning || '—' },
              { label: 'Speed', value: preview.speed || '—' },
              { label: 'Intelligence', value: preview.intelligence || '—' },
              { label: 'Knowledge', value: preview.knowledge || '—' },
              { label: 'Context', value: preview.context_length ? formatNumber(preview.context_length) : '—' },
              { label: 'Max output', value: preview.top_provider?.max_completion_tokens ? formatNumber(preview.top_provider.max_completion_tokens) : '—' },
              { label: 'Input / 1M', value: formatTokenCost(preview.pricing?.prompt) },
              { label: 'Output / 1M', value: formatTokenCost(preview.pricing?.completion) },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(5,8,14,0.36)', borderRadius: 14, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.35 }}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best for</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(preview.bestFor?.length ? preview.bestFor : ['General chat']).map(tag => (
                <span key={tag} style={{
                  padding: '5px 10px', borderRadius: 999,
                  background: 'rgba(124,140,255,0.16)', border: '1px solid rgba(124,140,255,0.22)',
                  color: '#DDE4FF', fontSize: 11,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capabilities</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {getModalities(preview).map(modality => (
                <span key={modality.label} style={{
                  padding: '5px 10px',
                  background: modality.tint,
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 999,
                  fontSize: 11,
                  color: '#fff',
                }}>
                  {modality.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
