'use client';

import { useStore, DEFAULT_CHAT_SETTINGS } from '@/lib/store';
import { useMemo, useState } from 'react';
import { getAvatarInitials, getAvatarColor } from '@/lib/utils';
import { buildUniqueUsername, normalizeUsernameBase } from '@/lib/auth';
import { insforge } from '@/lib/insforge';
import type { SettingsSection } from '@/lib/types';

const ACCENT_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#84CC16', '#fff'];

const PARAM_SLIDERS = [
  { key: 'temperature', label: 'Temperature', min: 0, max: 2, step: 0.1 },
  { key: 'maxTokens', label: 'Max Tokens', min: 1, max: 128000, step: 1 },
  { key: 'topP', label: 'Top P', min: 0, max: 1, step: 0.01 },
  { key: 'topK', label: 'Top K', min: 0, max: 200, step: 1 },
  { key: 'frequencyPenalty', label: 'Frequency Penalty', min: -2, max: 2, step: 0.1 },
  { key: 'presencePenalty', label: 'Presence Penalty', min: -2, max: 2, step: 0.1 },
] as const;

export default function SettingsModal() {
  const { state, dispatch, showToast } = useStore();
  const [section, setSection] = useState<SettingsSection>(state.ui.activeSettingsSection || 'account');
  const [username, setUsername] = useState(state.user.username);
  const [bgUrl, setBgUrl] = useState(state.settings.backgroundImage);
  const [pfpUrl, setPfpUrl] = useState(state.settings.profileImage);
  const [accent, setAccent] = useState(state.settings.accentColor);
  const [memoryDraft, setMemoryDraft] = useState('');

  const SECTIONS: Array<{ id: SettingsSection; label: string }> = [
    { id: 'account', label: '👤 Account' },
    { id: 'appearance', label: '🎨 Appearance' },
    { id: 'system-prompt', label: '🧠 System Prompt' },
    { id: 'memory', label: '📝 Memory' },
    { id: 'usage', label: '📊 Usage' },
    { id: 'about', label: 'ℹ️ About' },
  ];

  const usageRows = useMemo(
    () => Object.entries(state.usage.modelBreakdown).sort((a, b) => b[1].count - a[1].count).slice(0, 8),
    [state.usage.modelBreakdown]
  );

  const saveSection = (nextSection: SettingsSection) => {
    setSection(nextSection);
    dispatch({ type: 'SET_UI', ui: { activeSettingsSection: nextSection } });
  };

  const saveUsername = async () => {
    if (!username.trim() || !state.user.id) return;
    const normalizedUsername = normalizeUsernameBase(username.trim());
    const { error } = await insforge.auth.setProfile({
      name: normalizedUsername,
      username: normalizedUsername,
      preferred_name: normalizedUsername,
    });
    if (error) {
      showToast(error.message || 'Could not update username', 'error');
      return;
    }
    dispatch({
      type: 'SET_USER',
      user: {
        ...state.user,
        username: normalizedUsername,
        avatar: getAvatarInitials(normalizedUsername),
        avatarColor: getAvatarColor(normalizedUsername),
      },
    });
    setUsername(normalizedUsername);
    showToast('Username updated', 'success');
  };

  const saveBg = () => {
    dispatch({ type: 'SET_SETTINGS', settings: { backgroundImage: bgUrl } });
    showToast('Background updated', 'success');
  };

  const savePfp = () => {
    dispatch({ type: 'SET_SETTINGS', settings: { profileImage: pfpUrl } });
    showToast('Profile image updated', 'success');
  };

  const setAccentColor = (c: string) => {
    setAccent(c);
    dispatch({ type: 'SET_SETTINGS', settings: { accentColor: c } });
  };

  const clearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const addMemory = () => {
    const value = memoryDraft.trim();
    if (!value) return;
    dispatch({ type: 'ADD_MEMORY_ITEM', item: { id: crypto.randomUUID(), text: value, date: Date.now() } });
    setMemoryDraft('');
  };

  const usagePercent = Math.min(100, (state.usage.today.requests / Math.max(1, state.usage.today.limit)) * 100);

  return (
    <div onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="modal-enter" onClick={e => e.stopPropagation()} style={{
        maxWidth: 940, width: 'min(940px, 96%)', maxHeight: '86vh', borderRadius: 28,
        background: 'rgba(12,15,22,0.96)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        display: 'flex', overflow: 'hidden',
      }}>
        {/* Sidebar */}
        <div style={{
          width: 220, borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 8px', display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 10 }}>
            {state.settings?.profileImage ? (
              <img src={state.settings.profileImage} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: state.user.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{state.user.avatar}</div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{state.user.username || 'Arcus user'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Settings</div>
            </div>
          </div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => saveSection(s.id)} style={{
              display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left',
              background: section === s.id ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              color: section === s.id ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 13,
            }}>{s.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <button onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
            position: 'absolute', top: 16, right: 16, background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 18,
          }}>×</button>

          {section === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Account</h3>

              {/* Profile picture */}
              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>Profile Picture</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {pfpUrl ? (
                    <img src={pfpUrl} alt="pfp" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', background: state.user.avatarColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 600, color: '#fff',
                    }}>{state.user.avatar}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <input value={pfpUrl} onChange={e => setPfpUrl(e.target.value)} placeholder="Image URL..."
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <button onClick={savePfp} style={{ padding: '8px 14px', background: '#3B82F6', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                </div>
              </div>

              {/* Username */}
              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>Username</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={username} onChange={e => setUsername(e.target.value.slice(0, 30))}
                    style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  <button onClick={saveUsername} style={{ padding: '8px 14px', background: '#3B82F6', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                </div>
                {state.user.id && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                    Your public Arcus username will be <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 6 }}>{buildUniqueUsername(username || 'arcus', state.user.id)}</code>
                  </div>
                )}
              </div>

              {/* Danger zone */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#EF4444', marginBottom: 8 }}>Danger Zone</div>
                <button onClick={clearData} style={{
                  padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8, color: '#EF4444', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}>Clear all data & reset</button>
              </div>
            </div>
          )}

          {section === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Appearance</h3>

              {/* Background image */}
              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>Background Image URL</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={bgUrl} onChange={e => setBgUrl(e.target.value)} placeholder="https://..."
                    style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  <button onClick={saveBg} style={{ padding: '8px 14px', background: '#3B82F6', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Apply</button>
                  {bgUrl && <button onClick={() => { setBgUrl(''); dispatch({ type: 'SET_SETTINGS', settings: { backgroundImage: '' } }); }} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>}
                </div>
                {bgUrl && (
                  <div style={{ marginTop: 8, width: '100%', height: 120, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <img src={bgUrl} alt="bg preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              {/* Accent color */}
              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>Accent Color</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {ACCENT_COLORS.map(c => (
                    <button key={c} onClick={() => setAccentColor(c)} style={{
                      width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: accent === c ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: accent === c ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none',
                    }} />
                  ))}
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.44)' }}>
                Leave the background image empty to use the default Arcus night-sky background with shapes.
              </div>
            </div>
          )}

          {section === 'system-prompt' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>System Prompt</h3>
              <textarea
                value={state.chatSettings.systemPrompt}
                onChange={e => dispatch({ type: 'SET_CHAT_SETTINGS', settings: { systemPrompt: e.target.value } })}
                placeholder="Instructions that guide Arcus across the whole conversation"
                style={{ width: '100%', minHeight: 120, padding: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#fff', fontSize: 13, outline: 'none', fontFamily: "'Geist Mono', monospace", resize: 'vertical' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {PARAM_SLIDERS.map(param => (
                  <div key={param.key} style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>{param.label}</label>
                      <input
                        type="number"
                        value={state.chatSettings[param.key]}
                        onChange={e => dispatch({ type: 'SET_CHAT_SETTINGS', settings: { [param.key]: Number(e.target.value) } })}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        style={{ width: 92, padding: '4px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12 }}
                      />
                    </div>
                    <input
                      type="range"
                      value={state.chatSettings[param.key]}
                      onChange={e => dispatch({ type: 'SET_CHAT_SETTINGS', settings: { [param.key]: Number(e.target.value) } })}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
              </div>

              <button onClick={() => dispatch({ type: 'SET_CHAT_SETTINGS', settings: { ...DEFAULT_CHAT_SETTINGS } })} style={{ alignSelf: 'flex-start', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Reset chat defaults</button>
            </div>
          )}

          {section === 'memory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Memory</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Saved memory</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.46)', marginTop: 4 }}>Keep useful facts across chats so Arcus can stay in context.</div>
                </div>
                <button onClick={() => dispatch({ type: 'SET_MEMORY', memory: { enabled: !state.memory.enabled } })} style={{ minWidth: 88, padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: state.memory.enabled ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>{state.memory.enabled ? 'Enabled' : 'Disabled'}</button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input value={memoryDraft} onChange={e => setMemoryDraft(e.target.value)} placeholder="Add a persistent note" style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                <button onClick={addMemory} style={{ padding: '10px 14px', background: '#3B82F6', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
                <button onClick={() => dispatch({ type: 'SET_MEMORY', memory: { items: [] } })} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Clear all</button>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {state.memory.items.length === 0 ? (
                  <div style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.46)' }}>No memory saved yet.</div>
                ) : state.memory.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ fontSize: 13 }}>{item.text}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', marginTop: 4 }}>{new Date(item.date).toLocaleString()}</div>
                    </div>
                    <button onClick={() => dispatch({ type: 'REMOVE_MEMORY_ITEM', id: item.id })} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 18 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'usage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Usage</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Today</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{state.usage.today.requests}</div>
                </div>
                <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Daily limit</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{state.usage.today.limit}</div>
                </div>
                <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Saved chats</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{state.conversations.length}</div>
                </div>
              </div>

              <div style={{ padding: 18, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.56)' }}>Daily usage progress</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{Math.round(usagePercent)}%</span>
                </div>
                <div style={{ width: '100%', height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${usagePercent}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #6FB178)', borderRadius: 999 }} />
                </div>
              </div>

              <div style={{ padding: 18, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Top models</div>
                {usageRows.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.46)' }}>No tracked requests yet.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {usageRows.map(([modelId, usage]) => (
                      <div key={modelId} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 80px 90px', gap: 12, fontSize: 13 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{modelId}</div>
                        <div style={{ color: 'rgba(255,255,255,0.65)' }}>{usage.count} req</div>
                        <div style={{ color: 'rgba(255,255,255,0.65)' }}>{usage.tokens} tok</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {section === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>About Arcus</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#3B82F6', fontSize: 24 }}>◆</span>
                <span style={{ fontSize: 20, fontWeight: 700 }}>Arcus</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>v1.0.0</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>
                An intelligent AI workspace that lets you chat with 500+ models, generate images, and build AI agent workflows — all in one place.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>
                Powered by Puter.js, InsForge auth, and live search integrations.
              </p>
              <a href="https://github.com/Azuzuly/Arcus" target="_blank" rel="noopener" style={{ color: '#3B82F6', fontSize: 14 }}>GitHub Repository ↗</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
