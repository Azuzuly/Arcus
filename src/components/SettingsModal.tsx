'use client';

import { useStore } from '@/lib/store';
import { useState, useEffect, useRef } from 'react';
import { setStorageImmediate } from '@/lib/storage';
import { getAvatarInitials, getAvatarColor } from '@/lib/utils';
import { SettingsSection } from '@/lib/types';

const SECTIONS: { id: SettingsSection; icon: string; label: string }[] = [
  { id: 'account', icon: '👤', label: 'Account' },
  { id: 'appearance', icon: '🎨', label: 'Appearance' },
  { id: 'system-prompt', icon: '📝', label: 'System Prompt' },
  { id: 'memory', icon: '🧠', label: 'Memory' },
  { id: 'usage', icon: '📊', label: 'Usage' },
  { id: 'about', icon: 'ℹ️', label: 'About' },
];

export default function SettingsModal() {
  const { state, dispatch, showToast } = useStore();
  const [section, setSection] = useState<SettingsSection>('account');
  const [editName, setEditName] = useState(state.user.username);
  const [editKey, setEditKey] = useState(state.user.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [globalPrompt, setGlobalPrompt] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (section === 'usage' && canvasRef.current) drawUsageChart();
  }, [section, state.usage]);

  const drawUsageChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const cw = w / 2, ch = h / 2;
    ctx.clearRect(0, 0, cw, ch);
    const hist = state.usage.history.slice(-30);
    if (hist.length === 0) return;
    const max = Math.max(...hist.map(d => d.requests), 1);
    const barW = (cw - 40) / Math.max(hist.length, 1);
    hist.forEach((d, i) => {
      const barH = (d.requests / max) * (ch - 40);
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(20 + i * barW + 2, ch - 20 - barH, barW - 4, barH);
    });
  };

  const handleSaveName = () => {
    setStorageImmediate('username', editName);
    dispatch({
      type: 'SET_USER',
      user: { ...state.user, username: editName, avatar: getAvatarInitials(editName), avatarColor: getAvatarColor(editName) },
    });
    showToast('Name updated', 'success');
  };

  const handleSaveKey = () => {
    setStorageImmediate('api_key', editKey);
    dispatch({ type: 'SET_USER', user: { ...state.user, apiKey: editKey } });
    showToast('API key updated', 'success');
  };

  return (
    <div onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="modal-enter" onClick={e => e.stopPropagation()} style={{
        maxWidth: 900, width: '90%', maxHeight: 700, borderRadius: 'var(--radius-3xl)',
        background: 'var(--glass-panel)', backdropFilter: 'blur(22px) saturate(160%)',
        border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-modal)',
        display: 'flex', overflow: 'hidden',
      }}>
        {/* Left nav */}
        <div style={{ width: 220, borderRight: '1px solid var(--glass-border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: state.user.avatarColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#fff',
            }}>{state.user.avatar}</div>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{state.user.username}</span>
          </div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 10, background: section === s.id ? 'var(--glass-hover)' : 'transparent',
              borderLeft: section === s.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
              border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14,
              fontFamily: 'inherit', width: '100%', textAlign: 'left',
              transition: 'background var(--dur-fast) var(--ease-out)',
            }}>
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, padding: 28, overflowY: 'auto', position: 'relative' }}>
          <button onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
            position: 'absolute', top: 16, right: 16, background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20,
          }}>×</button>

          {section === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Account</h3>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Display Name</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)} style={{
                    flex: 1, padding: '10px 14px', background: 'var(--glass-input)', border: '1px solid var(--glass-border)',
                    borderRadius: 25, color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                  }} />
                  <button onClick={handleSaveName} style={{
                    padding: '10px 20px', background: 'var(--accent-blue)', border: 'none',
                    borderRadius: 12, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                  }}>Save</button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>OpenRouter API Key</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input type={showKey ? 'text' : 'password'} value={editKey} onChange={e => setEditKey(e.target.value)} style={{
                      width: '100%', padding: '10px 40px 10px 14px', background: 'var(--glass-input)', border: '1px solid var(--glass-border)',
                      borderRadius: 25, color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: "'Geist Mono', monospace",
                    }} />
                    <button onClick={() => setShowKey(!showKey)} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    }}>{showKey ? '🙈' : '👁'}</button>
                  </div>
                  <button onClick={handleSaveKey} style={{
                    padding: '10px 20px', background: 'var(--accent-blue)', border: 'none',
                    borderRadius: 12, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                  }}>Save Key</button>
                </div>
              </div>
              <button onClick={() => { dispatch({ type: 'SIGN_OUT' }); window.location.reload(); }} style={{
                padding: '10px 20px', background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red-border)',
                borderRadius: 12, color: 'var(--accent-red)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', width: 'fit-content',
              }}>Sign Out</button>
            </div>
          )}

          {section === 'memory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Memory</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ fontSize: 14 }}>Enable Memory</label>
                <button onClick={() => dispatch({ type: 'SET_MEMORY', memory: { enabled: !state.memory.enabled } })} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: state.memory.enabled ? 'var(--accent-blue)' : 'var(--glass-button)',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, left: state.memory.enabled ? 23 : 3, transition: 'left 0.2s',
                  }} />
                </button>
              </div>
              {state.memory.items.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No memory items yet.</p>}
              {state.memory.items.map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--glass-card)', borderRadius: 12, padding: '10px 14px',
                }}>
                  <span style={{ fontSize: 13, flex: 1 }}>{item.text}</span>
                  <button onClick={() => dispatch({ type: 'REMOVE_MEMORY_ITEM', id: item.id })} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14,
                  }}>×</button>
                </div>
              ))}
              {state.memory.items.length > 0 && (
                <button onClick={() => dispatch({ type: 'SET_MEMORY', memory: { items: [] } })} style={{
                  padding: '8px 16px', background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red-border)',
                  borderRadius: 12, color: 'var(--accent-red)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', width: 'fit-content',
                }}>Clear All Memory</button>
              )}
            </div>
          )}

          {section === 'usage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Usage</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14 }}>{state.usage.today.requests} requests today / {state.usage.today.limit - state.usage.today.requests} remaining</span>
                <span style={{
                  padding: '3px 10px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 600,
                  background: state.user.tier === 'pro' ? 'var(--accent-lime)' : 'rgba(193,255,114,0.15)',
                  color: state.user.tier === 'pro' ? '#0A0A0A' : 'var(--accent-lime)',
                }}>{state.user.tier === 'pro' ? 'Pro' : 'Free'}</span>
              </div>
              <canvas ref={canvasRef} style={{ width: '100%', height: 160, borderRadius: 'var(--radius-xs)' }} />
              {Object.entries(state.usage.modelBreakdown).length > 0 && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Model Breakdown</h4>
                  {Object.entries(state.usage.modelBreakdown).sort((a, b) => b[1].count - a[1].count).map(([id, data]) => (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--glass-border)', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{id}</span>
                      <span>{data.count} reqs · ~{data.tokens} tokens</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === 'system-prompt' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Global System Prompt</h3>
              <textarea value={globalPrompt} onChange={e => setGlobalPrompt(e.target.value)}
                placeholder="Instructions that guide the AI's behavior across all chats..."
                style={{
                  width: '100%', minHeight: 160, padding: 12, background: 'var(--glass-input)',
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)', fontSize: 13, fontFamily: "'Geist Mono', monospace",
                  outline: 'none', resize: 'vertical',
                }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setStorageImmediate('settings', JSON.stringify({ globalSystemPrompt: globalPrompt })); showToast('Saved', 'success'); }} style={{
                  padding: '10px 20px', background: 'var(--accent-blue)', border: 'none',
                  borderRadius: 12, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                }}>Save</button>
                <button onClick={() => setGlobalPrompt('')} style={{
                  padding: '10px 20px', background: 'var(--glass-button)', border: '1px solid var(--glass-border)',
                  borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                }}>Reset to Default</button>
              </div>
            </div>
          )}

          {section === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Appearance</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Theme and display settings coming soon.</p>
            </div>
          )}

          {section === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--accent-blue)', fontSize: 32 }}>◆</span>
                <span style={{ fontSize: 28, fontWeight: 600 }}>Arcus</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Version 1.0.0</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Powered by OpenRouter</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <a href="https://openrouter.ai" target="_blank" rel="noopener" style={{ color: 'var(--accent-blue)', fontSize: 14 }}>OpenRouter</a>
                <a href="#" style={{ color: 'var(--accent-blue)', fontSize: 14 }}>Docs</a>
                <a href="#" style={{ color: 'var(--accent-blue)', fontSize: 14 }}>Privacy</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
