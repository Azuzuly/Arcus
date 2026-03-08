'use client';

import { useStore } from '@/lib/store';
import { useState, useMemo, useRef, useEffect } from 'react';
import { ModelInfo } from '@/lib/types';
import { formatTokenCost, formatNumber } from '@/lib/utils';

const PROVIDER_LOGOS: Record<string, string> = {
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
    anthropic: 'Anthropic', openai: 'OpenAI', google: 'Google',
    deepseek: 'DeepSeek', 'meta-llama': 'Meta', 'x-ai': 'xAI',
    mistralai: 'Mistral', cohere: 'Cohere', qwen: 'Qwen',
    liquid: 'Liquid AI', 'bytedance-seed': 'ByteDance', inception: 'Inception',
  };
  return names[p] || p.charAt(0).toUpperCase() + p.slice(1);
}

function getModalities(m: ModelInfo): { emoji: string; label: string }[] {
  const result: { emoji: string; label: string }[] = [];
  const inp = m.architecture?.input_modalities || [];
  const out = m.architecture?.output_modalities || [];
  if (inp.includes('text')) result.push({ emoji: '💬', label: 'Text' });
  if (inp.includes('image')) result.push({ emoji: '👁️', label: 'Vision' });
  if (inp.includes('audio')) result.push({ emoji: '🎤', label: 'Audio' });
  if (inp.includes('video')) result.push({ emoji: '🎥', label: 'Video' });
  if (out.includes('image')) result.push({ emoji: '🎨', label: 'Image Gen' });
  return result;
}

export default function ModelSelector({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState<ModelInfo | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!search) return state.allModels;
    const q = search.toLowerCase();
    return state.allModels.filter(m =>
      m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  }, [state.allModels, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, ModelInfo[]> = {};
    const favs = filtered.filter(m => state.favoriteModelIds.includes(m.id));
    if (favs.length > 0) groups['★ Favorites'] = favs;
    filtered.forEach(m => {
      const provider = getProviderName(m.id);
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(m);
    });
    return groups;
  }, [filtered, state.favoriteModelIds]);

  const selectModel = (m: ModelInfo) => {
    dispatch({ type: 'SET_SELECTED_MODEL', model: { id: m.id, name: m.name, provider: getProviderName(m.id) } });
    onClose();
  };

  const preview = hovered || state.allModels.find(m => m.id === state.selectedModel.id) || null;

  return (
    <div ref={panelRef} className="panel-enter" style={{
      position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
      width: 'min(560px, 90vw)', maxHeight: 'min(420px, 60vh)', borderRadius: 20,
      background: 'rgba(12,12,14,0.85)', backdropFilter: 'blur(40px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      display: 'flex', overflow: 'hidden',
    }}>
      {/* Left — model list */}
      <div style={{ width: preview ? '55%' : '100%', display: 'flex', flexDirection: 'column', transition: 'width 0.2s' }}>
        <div style={{ padding: '12px 12px 8px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search models..."
            autoFocus
            style={{
              width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
              color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
            }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px 8px' }}>
          {Object.entries(grouped).map(([provider, models]) => (
            <div key={provider} style={{ marginBottom: 4 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                <span>{PROVIDER_LOGOS[provider.toLowerCase()] || getProviderEmoji(models[0]?.id || '')}</span>
                {provider}
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>({models.length})</span>
              </div>
              {models.map(m => (
                <button key={m.id}
                  onClick={() => selectModel(m)}
                  onMouseEnter={() => setHovered(m)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '7px 10px', borderRadius: 8,
                    background: state.selectedModel.id === m.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                    border: state.selectedModel.id === m.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onFocus={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onBlur={e => { if (state.selectedModel.id !== m.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{m.name}</span>
                  <button onClick={e => { e.stopPropagation(); dispatch({ type: 'TOGGLE_FAVORITE_MODEL', modelId: m.id }); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: state.favoriteModelIds.includes(m.id) ? '#F59E0B' : 'rgba(255,255,255,0.15)', padding: '0 2px' }}>
                    ★
                  </button>
                </button>
              ))}
            </div>
          ))}
          {state.allModels.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading models...</div>
          )}
        </div>
      </div>

      {/* Right — spec panel */}
      {preview && (
        <div style={{
          width: '45%', padding: 16, borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{preview.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{getProviderEmoji(preview.id)}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{getProviderName(preview.id)}</span>
            </div>
          </div>

          {preview.description && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>
              {preview.description}
            </p>
          )}

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Context</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{preview.context_length ? formatNumber(preview.context_length) : '—'}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Max Output</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{preview.top_provider?.max_completion_tokens ? formatNumber(preview.top_provider.max_completion_tokens) : '—'}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Input</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{formatTokenCost(preview.pricing?.prompt)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Output</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{formatTokenCost(preview.pricing?.completion)}</div>
            </div>
          </div>

          {/* Modalities */}
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Supports</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {getModalities(preview).map(mod => (
                <span key={mod.label} style={{
                  padding: '3px 8px', background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6,
                  fontSize: 11, color: 'rgba(59,130,246,0.9)',
                }}>{mod.emoji} {mod.label}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
