'use client';

import { useStore } from '@/lib/store';
import { useMemo, useState } from 'react';

export default function PersonalizationPanel() {
  const { state, dispatch } = useStore();
  const [trustedDomainInput, setTrustedDomainInput] = useState(state.preferences.trustedDomains.join(', '));

  const trustedDomainCount = useMemo(
    () => trustedDomainInput.split(',').map(item => item.trim()).filter(Boolean).length,
    [trustedDomainInput]
  );

  const setResponseStyle = (responseStyle: 'balanced' | 'concise' | 'detailed') => {
    dispatch({ type: 'SET_PREFERENCES', preferences: { responseStyle } });
  };

  const saveTrustedDomains = () => {
    const trustedDomains = trustedDomainInput
      .split(',')
      .map(item => item.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''))
      .filter(Boolean);

    dispatch({ type: 'SET_PREFERENCES', preferences: { trustedDomains } });
  };

  return (
    <div onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
      position: 'fixed', inset: 0, background: 'rgba(5,6,8,0.58)', backdropFilter: 'blur(10px)',
      zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="modal-enter" onClick={e => e.stopPropagation()} style={{
        width: 'min(460px, 100%)', borderRadius: 28, padding: 24,
        background: 'linear-gradient(180deg, rgba(50,51,56,0.98), rgba(21,22,26,0.98))',
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'var(--shadow-modal)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Personalization</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Tune how Arcus searches and responds.</p>
          </div>
          <button onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
            width: 34, height: 34, borderRadius: 12, background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)', cursor: 'pointer',
          }}>✕</button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{
            padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Web search</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Fresh info is on by default and powers newsy or time-sensitive questions.</div>
              </div>
              <button onClick={() => dispatch({ type: 'SET_PREFERENCES', preferences: { webSearchEnabled: !state.preferences.webSearchEnabled } })} style={{
                minWidth: 76, padding: '8px 12px', borderRadius: 'var(--radius-pill)',
                border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                background: state.preferences.webSearchEnabled ? 'rgba(111,177,120,0.16)' : 'rgba(255,255,255,0.06)',
                color: state.preferences.webSearchEnabled ? 'var(--accent-mint)' : 'var(--text-secondary)',
                fontWeight: 700,
              }}>{state.preferences.webSearchEnabled ? 'Enabled' : 'Disabled'}</button>
            </div>
          </div>

          <div style={{
            padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Auto-select web search</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Arcus decides when a request needs fresh sources.</div>
              </div>
              <button onClick={() => dispatch({ type: 'SET_PREFERENCES', preferences: { autoWebSearch: !state.preferences.autoWebSearch } })} style={{
                minWidth: 76, padding: '8px 12px', borderRadius: 'var(--radius-pill)',
                border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                background: state.preferences.autoWebSearch ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.06)',
                color: state.preferences.autoWebSearch ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontWeight: 700,
              }}>{state.preferences.autoWebSearch ? 'Auto' : 'Manual'}</button>
            </div>
          </div>

          <div style={{
            padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Response style</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['balanced', 'concise', 'detailed'] as const).map(option => (
                <button key={option} onClick={() => setResponseStyle(option)} style={{
                  padding: '10px 14px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1px solid ${state.preferences.responseStyle === option ? 'rgba(116,126,255,0.32)' : 'rgba(255,255,255,0.08)'}`,
                  background: state.preferences.responseStyle === option ? 'rgba(116,126,255,0.16)' : 'rgba(255,255,255,0.04)',
                  color: state.preferences.responseStyle === option ? '#fff' : 'var(--text-secondary)',
                  textTransform: 'capitalize',
                  fontWeight: 600,
                }}>{option}</button>
              ))}
            </div>
          </div>

          <div style={{
            padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Deep research depth</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {([
                { value: 'standard', label: 'Standard', desc: 'Fast scan of the web' },
                { value: 'deep', label: 'Deep', desc: 'Multiple sub-searches and synthesis' },
                { value: 'exhaustive', label: 'Exhaustive', desc: 'Broader sweep with stricter evidence' },
              ] as const).map(option => (
                <button key={option.value} onClick={() => dispatch({ type: 'SET_PREFERENCES', preferences: { researchDepth: option.value } })} style={{
                  flex: '1 1 120px',
                  minWidth: 110,
                  padding: '12px 14px', borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1px solid ${state.preferences.researchDepth === option.value ? 'rgba(111,177,120,0.28)' : 'rgba(255,255,255,0.08)'}`,
                  background: state.preferences.researchDepth === option.value ? 'rgba(111,177,120,0.12)' : 'rgba(255,255,255,0.04)',
                  color: state.preferences.researchDepth === option.value ? '#fff' : 'var(--text-secondary)',
                  textAlign: 'left',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{option.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{
            padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Trusted domains</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Optional. Prioritize or narrow research to sources you trust most.</div>
              </div>
              <span style={{
                padding: '5px 8px', borderRadius: 'var(--radius-pill)',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 11, color: 'var(--text-secondary)',
              }}>{trustedDomainCount} saved</span>
            </div>
            <textarea
              value={trustedDomainInput}
              onChange={e => setTrustedDomainInput(e.target.value)}
              onBlur={saveTrustedDomains}
              rows={3}
              placeholder="example.com, docs.anthropic.com, nature.com"
              style={{
                width: '100%', padding: 12, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
                color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
