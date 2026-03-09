/* eslint-disable @next/next/no-img-element */
'use client';

import { useStore, DEFAULT_CHAT_SETTINGS } from '@/lib/store';
import { useMemo, useRef, useState } from 'react';
import { getAvatarInitials, getAvatarColor } from '@/lib/utils';
import { normalizeUsernameBase } from '@/lib/auth';
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
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const SECTIONS: Array<{ id: SettingsSection; label: string }> = [
    { id: 'account', label: '👤 Account' },
    { id: 'appearance', label: '🎨 Appearance' },
    { id: 'personalization', label: '✨ Personalization' },
    { id: 'chat', label: '🧠 Chat & Models' },
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

  const uploadPfp = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Profile photos must be under 5 MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        showToast('Could not read that image.', 'error');
        return;
      }
      setPfpUrl(result);
      dispatch({ type: 'SET_SETTINGS', settings: { profileImage: result } });
      showToast('Profile photo uploaded', 'success');
    };
    reader.onerror = () => showToast('Could not upload that image.', 'error');
    reader.readAsDataURL(file);
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

  const sectionCardStyle = {
    padding: 18,
    borderRadius: 20,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(16px)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  } as const;

  return (
    <div onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="modal-enter" onClick={e => e.stopPropagation()} style={{
        maxWidth: 1120, width: 'min(1120px, 96%)', height: 'min(780px, 88vh)', borderRadius: 30,
        background: 'rgba(12,15,22,0.97)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        display: 'flex', overflow: 'hidden',
      }}>
        {/* Sidebar */}
        <div style={{
          width: 260, borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '22px 10px', display: 'flex', flexDirection: 'column', gap: 6,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 10 }}>
            {state.settings?.profileImage ? (
              <img src={state.settings.profileImage} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: state.user.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{state.user.avatar}</div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{state.user.username || 'Arcus user'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Workspace preferences</div>
            </div>
          </div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => saveSection(s.id)} style={{
              display: 'block', width: '100%', padding: '11px 14px', textAlign: 'left',
              background: section === s.id ? 'rgba(59,130,246,0.14)' : 'transparent',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              color: section === s.id ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: section === s.id ? 700 : 500,
            }}>{s.label}</button>
          ))}

          <div style={{ marginTop: 'auto', padding: '14px 12px 8px' }}>
            <div style={{ ...sectionCardStyle, padding: 14 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Daily usage</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>
                {state.user.tier === 'owner' ? '∞' : `${state.usage.today.requests}/${state.usage.today.limit}`}
              </div>
              <div style={{ width: '100%', height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: `${usagePercent}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)', borderRadius: 999 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 26, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
            position: 'absolute', top: 16, right: 16, background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 18,
          }}>×</button>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.05em' }}>Settings</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Tune your account, interface, model behavior, and research controls from one stable workspace.</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>

          {section === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, 0.9fr)', gap: 18 }}>
                <div style={sectionCardStyle}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Profile</h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                    {pfpUrl ? (
                      <img src={pfpUrl} alt="pfp" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: 72, height: 72, borderRadius: '50%', background: state.user.avatarColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 700, color: '#fff',
                      }}>{state.user.avatar}</div>
                    )}
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{state.user.username || 'Arcus user'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.48)', marginTop: 4 }}>{state.user.email || 'Signed in securely with Arcus auth'}</div>
                    </div>
                  </div>

                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>Profile photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => profileFileInputRef.current?.click()} style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.16)', border: '1px solid rgba(59,130,246,0.28)', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Upload photo</button>
                    <div style={{ flex: 1 }}>
                      <input value={pfpUrl} onChange={e => setPfpUrl(e.target.value)} placeholder="Paste image URL or upload a photo"
                        style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <button onClick={savePfp} style={{ padding: '10px 14px', background: '#3B82F6', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                  </div>
                  <input ref={profileFileInputRef} type="file" accept="image/*" onChange={uploadPfp} style={{ display: 'none' }} />
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', marginTop: 8 }}>Uploads are stored locally so your photo appears instantly across the workspace.</div>

                  <div style={{ marginTop: 18 }}>
                    <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>Username</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input value={username} onChange={e => setUsername(e.target.value.slice(0, 30))}
                        style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                      <button onClick={saveUsername} style={{ padding: '10px 14px', background: '#3B82F6', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                    Arcus keeps your username clean and consistent across devices.
                  </div>
                </div>

                <div style={{ ...sectionCardStyle, display: 'grid', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Account health</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.46)', marginTop: 4 }}>A quick snapshot of your current Arcus identity.</div>
                  </div>

                  {[
                    { label: 'Email status', value: state.user.emailVerified ? 'Verified' : 'Needs verification' },
                    { label: 'Plan', value: state.user.tier === 'owner' ? 'Owner' : state.user.tier === 'pro' ? 'Pro' : 'Free' },
                    { label: 'Saved chats', value: String(state.conversations.length) },
                    { label: 'Favorite models', value: String(state.favoriteModelIds.length) },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.56)' }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.label === 'Plan' && state.user.tier === 'owner' && (
                          <span style={{
                            background: 'linear-gradient(135deg, #F59E0B, #EF4444)', padding: '2px 8px',
                            borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
                            color: '#fff', textTransform: 'uppercase',
                          }}>👑 OWNER</span>
                        )}
                        {item.value}
                      </span>
                    </div>
                  ))}

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>Danger zone</div>
                    <button onClick={clearData} style={{
                      padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 12, color: '#EF4444', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                    }}>Clear all local data</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ ...sectionCardStyle, display: 'grid', gap: 18 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>Appearance</h3>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.48)', marginTop: 4 }}>Dial in the surface, accent, and backdrop without changing the panel size or layout.</div>
                </div>

                <div>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>Background Image URL</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                  <input value={bgUrl} onChange={e => setBgUrl(e.target.value)} placeholder="https://..."
                    style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={saveBg} style={{ padding: '10px 14px', background: '#3B82F6', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Apply</button>
                    {bgUrl && <button onClick={() => { setBgUrl(''); dispatch({ type: 'SET_SETTINGS', settings: { backgroundImage: '' } }); }} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>}
                  </div>
                  {bgUrl && (
                    <div style={{ marginTop: 10, width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img src={bgUrl} alt="bg preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>Accent Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ACCENT_COLORS.map(c => (
                    <button key={c} onClick={() => setAccentColor(c)} style={{
                      width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: accent === c ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: accent === c ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none',
                    }} />
                  ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  <div style={{ ...sectionCardStyle, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Animation preset</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.46)', marginTop: 4 }}>Use the quick toggle below to reduce motion when you want a calmer workspace.</div>
                    <button onClick={() => dispatch({ type: 'SET_PREFERENCES', preferences: { animationsEnabled: !state.preferences.animationsEnabled } })} style={{
                      marginTop: 12, padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)',
                      background: state.preferences.animationsEnabled ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontWeight: 700,
                    }}>{state.preferences.animationsEnabled ? 'Animations on' : 'Reduced motion'}</button>
                  </div>
                  <div style={{ ...sectionCardStyle, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Current accent</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: accent, display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.56)' }}>{accent}</span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.44)' }}>
                  Leave the background image empty to use the default Arcus night-sky background with shapes.
                </div>
              </div>
            </div>
          )}

          {section === 'personalization' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                {[
                  {
                    title: 'Web search',
                    detail: 'Allow Arcus to use fresh live sources.',
                    active: state.preferences.webSearchEnabled,
                    onClick: () => dispatch({ type: 'SET_PREFERENCES', preferences: { webSearchEnabled: !state.preferences.webSearchEnabled } }),
                  },
                  {
                    title: 'Auto-select web search',
                    detail: 'Let Arcus decide when freshness matters.',
                    active: state.preferences.autoWebSearch,
                    onClick: () => dispatch({ type: 'SET_PREFERENCES', preferences: { autoWebSearch: !state.preferences.autoWebSearch } }),
                  },
                  {
                    title: 'Auto-follow streamed replies',
                    detail: 'Keep snapping to the latest chunk while the model writes.',
                    active: state.preferences.autoScrollOnStream,
                    onClick: () => dispatch({ type: 'SET_PREFERENCES', preferences: { autoScrollOnStream: !state.preferences.autoScrollOnStream } }),
                  },
                  {
                    title: 'Show timestamps',
                    detail: 'Display message times below each reply.',
                    active: state.preferences.showTimestamps,
                    onClick: () => dispatch({ type: 'SET_PREFERENCES', preferences: { showTimestamps: !state.preferences.showTimestamps } }),
                  },
                ].map(card => (
                  <div key={card.title} style={{ ...sectionCardStyle }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{card.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.46)', marginTop: 4, lineHeight: 1.5 }}>{card.detail}</div>
                    <button onClick={card.onClick} style={{ marginTop: 14, padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: card.active ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>{card.active ? 'Enabled' : 'Disabled'}</button>
                  </div>
                ))}
              </div>

              <div style={{ ...sectionCardStyle }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Response style</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(['balanced', 'concise', 'detailed'] as const).map(option => (
                    <button key={option} onClick={() => dispatch({ type: 'SET_PREFERENCES', preferences: { responseStyle: option } })} style={{
                      padding: '10px 14px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                      border: `1px solid ${state.preferences.responseStyle === option ? 'rgba(116,126,255,0.32)' : 'rgba(255,255,255,0.08)'}`,
                      background: state.preferences.responseStyle === option ? 'rgba(116,126,255,0.16)' : 'rgba(255,255,255,0.04)',
                      color: state.preferences.responseStyle === option ? '#fff' : 'var(--text-secondary)',
                      textTransform: 'capitalize', fontWeight: 700,
                    }}>{option}</button>
                  ))}
                </div>
              </div>

              <div style={{ ...sectionCardStyle }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Research depth</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(['standard', 'deep', 'exhaustive'] as const).map(option => (
                    <button key={option} onClick={() => dispatch({ type: 'SET_PREFERENCES', preferences: { researchDepth: option } })} style={{
                      padding: '10px 14px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                      border: `1px solid ${state.preferences.researchDepth === option ? 'rgba(111,177,120,0.28)' : 'rgba(255,255,255,0.08)'}`,
                      background: state.preferences.researchDepth === option ? 'rgba(111,177,120,0.12)' : 'rgba(255,255,255,0.04)',
                      color: state.preferences.researchDepth === option ? '#fff' : 'var(--text-secondary)',
                      textTransform: 'capitalize', fontWeight: 700,
                    }}>{option}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ ...sectionCardStyle }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>System prompt</h3>
                <textarea
                  value={state.chatSettings.systemPrompt}
                  onChange={e => dispatch({ type: 'SET_CHAT_SETTINGS', settings: { systemPrompt: e.target.value } })}
                  placeholder="Instructions that guide Arcus across the whole conversation"
                  style={{ width: '100%', minHeight: 140, padding: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#fff', fontSize: 13, outline: 'none', fontFamily: "'Geist Mono', monospace", resize: 'vertical' }}
                />
              </div>

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

              <button onClick={() => dispatch({ type: 'SET_CHAT_SETTINGS', settings: { ...DEFAULT_CHAT_SETTINGS } })} style={{ alignSelf: 'flex-start', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Reset chat defaults</button>
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
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{state.user.tier === 'owner' ? '∞' : state.usage.today.limit}</div>
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
              <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13 }}>Arcus keeps the focus on your workspace, not external repo links.</div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
