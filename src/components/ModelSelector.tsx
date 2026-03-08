'use client';

import { useStore } from '@/lib/store';
import { useState, useMemo, useRef, useEffect } from 'react';
import { ModelInfo } from '@/lib/types';
import { formatTokenCost, formatNumber } from '@/lib/utils';

export default function ModelSelector({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [search, setSearch] = useState('');
  const [previewModel, setPreviewModel] = useState<ModelInfo | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filteredModels = useMemo(() => {
    if (!search) return state.allModels;
    const q = search.toLowerCase();
    return state.allModels.filter(m =>
      m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
    );
  }, [state.allModels, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, ModelInfo[]> = {};
    // Favorites first
    const favs = filteredModels.filter(m => state.favoriteModelIds.includes(m.id));
    if (favs.length > 0) groups['★ Favorites'] = favs;
    filteredModels.forEach(m => {
      const provider = m.id.split('/')[0] || 'Other';
      const displayName = provider.charAt(0).toUpperCase() + provider.slice(1);
      if (!groups[displayName]) groups[displayName] = [];
      groups[displayName].push(m);
    });
    return groups;
  }, [filteredModels, state.favoriteModelIds]);

  const getCapabilities = (m: ModelInfo): { label: string; emoji: string }[] => {
    const caps: { label: string; emoji: string }[] = [];
    if (m.context_length) caps.push({ label: `${Math.round(m.context_length / 1000)}K ctx`, emoji: '📏' });
    const inp = m.architecture?.input_modalities || [];
    const out = m.architecture?.output_modalities || [];
    if (inp.includes('text')) caps.push({ label: 'Text', emoji: '💬' });
    if (inp.includes('image')) caps.push({ label: 'Vision', emoji: '👁️' });
    if (inp.includes('audio')) caps.push({ label: 'Audio In', emoji: '🎤' });
    if (inp.includes('video')) caps.push({ label: 'Video In', emoji: '🎥' });
    if (out.includes('image')) caps.push({ label: 'Image Gen', emoji: '🎨' });
    return caps;
  };

  return (
    <div ref={panelRef} className="panel-enter" style={{
      position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
      width: 720, maxHeight: 560, borderRadius: 'var(--radius-3xl)',
      background: 'var(--glass-panel)', backdropFilter: 'blur(22px) saturate(160%)',
      border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-panel)',
      display: 'flex', overflow: 'hidden',
    }}>
      {/* Left column */}
      <div style={{ width: '60%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--glass-border)' }}>
        <div style={{ padding: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search Models..."
            style={{
              width: '100%', padding: '10px 16px', background: 'var(--glass-input)',
              border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)',
              color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
            }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
          {Object.entries(grouped).map(([provider, models]) => (
            <div key={provider}>
              <button onClick={() => setCollapsedGroups(g => ({ ...g, [provider]: !g[provider] }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
                  width: '100%', fontFamily: 'inherit',
                }}>
                <span style={{ transform: collapsedGroups[provider] ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>▾</span>
                {provider}
                <span style={{ background: 'var(--glass-button)', borderRadius: 'var(--radius-pill)', padding: '1px 6px', fontSize: 11 }}>{models.length}</span>
              </button>
              {!collapsedGroups[provider] && models.map(m => (
                <div key={m.id}
                  onClick={() => setPreviewModel(m)}
                  onDoubleClick={() => {
                    dispatch({ type: 'SET_SELECTED_MODEL', model: { id: m.id, name: m.name, provider: m.id.split('/')[0] } });
                    onClose();
                  }}
                  style={{
                    padding: '8px 12px', borderRadius: 'var(--radius-xs)', cursor: 'pointer',
                    transition: 'background var(--dur-fast) var(--ease-out)',
                    background: previewModel?.id === m.id ? 'var(--glass-hover)' : 'transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--glass-hover)'; setPreviewModel(m); }}
                  onMouseLeave={e => { if (previewModel?.id !== m.id) e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {getCapabilities(m).slice(0, 3).map(c => (
                        <span key={c.label} style={{ fontSize: 10, padding: '1px 5px', background: 'var(--glass-button)', borderRadius: 4, color: 'var(--text-secondary)' }}>{c.emoji}</span>
                      ))}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTokenCost(m.pricing?.prompt)}</span>
                      <button onClick={e => { e.stopPropagation(); dispatch({ type: 'TOGGLE_FAVORITE_MODEL', modelId: m.id }); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: state.favoriteModelIds.includes(m.id) ? '#F59E0B' : 'var(--text-muted)' }}>
                        ★
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {state.allModels.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Loading models...</div>
          )}
        </div>
      </div>

      {/* Right column */}
      <div style={{ width: '40%', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, background: 'transparent',
          border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18,
        }}>×</button>

        {previewModel ? (
          <>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>{previewModel.name}</div>
              <span style={{ background: 'var(--glass-button)', borderRadius: 'var(--radius-pill)', padding: '3px 10px', fontSize: 12, color: 'var(--text-secondary)', display: 'inline-block', marginTop: 6 }}>
                {previewModel.id.split('/')[0]}
              </span>
            </div>
            {previewModel.description && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {previewModel.description}
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: 'var(--glass-card)', borderRadius: 'var(--radius-xs)', padding: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Context</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{previewModel.context_length ? formatNumber(previewModel.context_length) : 'N/A'}</div>
              </div>
              <div style={{ background: 'var(--glass-card)', borderRadius: 'var(--radius-xs)', padding: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Max Output</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{previewModel.top_provider?.max_completion_tokens ? formatNumber(previewModel.top_provider.max_completion_tokens) : 'N/A'}</div>
              </div>
              <div style={{ background: 'var(--glass-card)', borderRadius: 'var(--radius-xs)', padding: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Input Cost</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{formatTokenCost(previewModel.pricing?.prompt)}</div>
              </div>
              <div style={{ background: 'var(--glass-card)', borderRadius: 'var(--radius-xs)', padding: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Output Cost</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{formatTokenCost(previewModel.pricing?.completion)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {getCapabilities(previewModel).map(c => (
                <span key={c.label} style={{ padding: '3px 10px', background: 'var(--accent-blue-glow)', border: '1px solid var(--accent-blue)', borderRadius: 'var(--radius-pill)', fontSize: 11, color: 'var(--accent-blue)' }}>{c.emoji} {c.label}</span>
              ))}
            </div>
            <button onClick={() => {
              dispatch({ type: 'SET_SELECTED_MODEL', model: { id: previewModel.id, name: previewModel.name, provider: previewModel.id.split('/')[0] } });
              onClose();
            }} style={{
              width: '100%', padding: '10px 0', background: 'var(--accent-blue)',
              border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Select Model
            </button>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Hover over a model to see details
          </div>
        )}
      </div>
    </div>
  );
}
