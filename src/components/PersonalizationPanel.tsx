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
        width: 'min(448px, 100%)', maxHeight: 'min(560px, 72vh)', overflowY: 'auto', minHeight: 0, borderRadius: 22, padding: 16,
        background: 'linear-gradient(180deg, rgba(30,34,43,0.98), rgba(16,18,24,0.98))',
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'var(--shadow-modal)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>Personalization</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>Quick controls for how Arcus behaves.</p>
          </div>
          <button onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
            width: 34, height: 34, borderRadius: 12, background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)', cursor: 'pointer',
          }}>✕</button>
        </div>

        <div style={{ display: 'grid', gap: 9 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 9 }}>
            {[
              {
                title: 'Web search',
                desc: 'Use live sources for fresh answers.',
                active: state.preferences.webSearchEnabled,
                onClick: () => dispatch({ type: 'SET_PREFERENCES', preferences: { webSearchEnabled: !state.preferences.webSearchEnabled } }),
                activeLabel: 'Enabled',
                inactiveLabel: 'Disabled',
                activeColor: 'var(--accent-mint)',
                activeBackground: 'rgba(111,177,120,0.16)',
              },
              {
                title: 'Auto-follow',
                desc: 'Stay pinned to the newest streaming text.',
                active: state.preferences.autoScrollOnStream,
                onClick: () => dispatch({ type: 'SET_PREFERENCES', preferences: { autoScrollOnStream: !state.preferences.autoScrollOnStream } }),
                activeLabel: 'Following',
                inactiveLabel: 'Manual',
                activeColor: 'var(--accent-blue)',
                activeBackground: 'rgba(59,130,246,0.16)',
              },
              {
                title: 'Animations',
                desc: 'Keep motion and micro-interactions on.',
                active: state.preferences.animationsEnabled,
                onClick: () => dispatch({ type: 'SET_PREFERENCES', preferences: { animationsEnabled: !state.preferences.animationsEnabled } }),
                activeLabel: 'On',
                inactiveLabel: 'Reduced',
                activeColor: '#C4B5FD',
                activeBackground: 'rgba(139,92,246,0.16)',
              },
              {
                title: 'Timestamps',
                desc: 'Show send times beneath message actions.',
                active: state.preferences.showTimestamps,
                onClick: () => dispatch({ type: 'SET_PREFERENCES', preferences: { showTimestamps: !state.preferences.showTimestamps } }),
                activeLabel: 'Visible',
                inactiveLabel: 'Hidden',
                activeColor: '#FCD34D',
                activeBackground: 'rgba(234,179,8,0.16)',
              },
            ].map(card => (
              <div key={card.title} style={{
                padding: 12, borderRadius: 15, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{card.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>{card.desc}</div>
                <button onClick={card.onClick} style={{
                  marginTop: 9, minWidth: 82, padding: '6px 10px', borderRadius: 'var(--radius-pill)',
                  border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                  background: card.active ? card.activeBackground : 'rgba(255,255,255,0.06)',
                  color: card.active ? card.activeColor : 'var(--text-secondary)', fontWeight: 700,
                }}>{card.active ? card.activeLabel : card.inactiveLabel}</button>
              </div>
            ))}
          </div>

          <div style={{
            padding: 12, borderRadius: 15, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Response style</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['balanced', 'concise', 'detailed'] as const).map(option => (
                <button key={option} onClick={() => setResponseStyle(option)} style={{
                  padding: '8px 12px', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit',
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
            padding: 12, borderRadius: 15, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Chat spacing</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { value: false, label: 'Cozy', desc: 'Airy bubbles and roomy spacing' },
                { value: true, label: 'Compact', desc: 'Fits more conversation on screen' },
              ].map(option => (
                <button key={option.label} onClick={() => dispatch({ type: 'SET_PREFERENCES', preferences: { compactChatSpacing: option.value } })} style={{
                  flex: '1 1 160px',
                  padding: '10px 12px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  border: `1px solid ${state.preferences.compactChatSpacing === option.value ? 'rgba(59,130,246,0.28)' : 'rgba(255,255,255,0.08)'}`,
                  background: state.preferences.compactChatSpacing === option.value ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                  color: state.preferences.compactChatSpacing === option.value ? '#fff' : 'var(--text-secondary)',
                }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{option.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{
            padding: 12, borderRadius: 15, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Deep research depth</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {([
                { value: 'standard', label: 'Standard', desc: 'Fast scan of the web' },
                { value: 'deep', label: 'Deep', desc: 'Multiple sub-searches and synthesis' },
                { value: 'exhaustive', label: 'Exhaustive', desc: 'Broader sweep with stricter evidence' },
              ] as const).map(option => (
                <button key={option.value} onClick={() => dispatch({ type: 'SET_PREFERENCES', preferences: { researchDepth: option.value } })} style={{
                  flex: '1 1 120px',
                  minWidth: 110,
                  padding: '10px 12px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1px solid ${state.preferences.researchDepth === option.value ? 'rgba(111,177,120,0.28)' : 'rgba(255,255,255,0.08)'}`,
                  background: state.preferences.researchDepth === option.value ? 'rgba(111,177,120,0.12)' : 'rgba(255,255,255,0.04)',
                  color: state.preferences.researchDepth === option.value ? '#fff' : 'var(--text-secondary)',
                  textAlign: 'left',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{option.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{
            padding: 12, borderRadius: 15, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Trusted domains</div>
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
                width: '100%', padding: 11, background: 'rgba(255,255,255,0.04)',
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
