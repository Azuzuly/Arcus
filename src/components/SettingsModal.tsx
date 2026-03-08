'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { getAvatarInitials, getAvatarColor } from '@/lib/utils';
import { clearAllStorage, setStorageImmediate } from '@/lib/storage';

const ACCENT_COLORS = ['#7C8CFF', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#FFFFFF'];
const RESPONSE_STYLES = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'concise', label: 'Concise' },
  { id: 'detailed', label: 'Detailed' },
  { id: 'friendly', label: 'Friendly' },
] as const;

export default function SettingsModal() {
  const { state, dispatch, showToast } = useStore();
  const [section, setSection] = useState<string>('account');
  const [username, setUsername] = useState(state.user.username);
  const [bgUrl, setBgUrl] = useState(state.settings.backgroundImage);
  const [pfpUrl, setPfpUrl] = useState(state.settings.profileImage);
  const [accent, setAccent] = useState(state.settings.accentColor);
  const [bio, setBio] = useState(state.settings.bio);
  const [location, setLocation] = useState(state.settings.location);
  const [occupation, setOccupation] = useState(state.settings.occupation);
  const [responseStyle, setResponseStyle] = useState(state.settings.responseStyle);
  const [memoryDraft, setMemoryDraft] = useState('');

  const sections = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'system-prompt', label: 'System Prompt', icon: '🧠' },
    { id: 'memory', label: 'Memory', icon: '🗂' },
    { id: 'usage', label: 'Usage', icon: '📊' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ];

  const usageRows = useMemo(() => Object.entries(state.usage.modelBreakdown)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6), [state.usage.modelBreakdown]);

  const saveUsername = () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    setStorageImmediate('username', trimmed);
    dispatch({
      type: 'SET_USER',
      user: {
        ...state.user,
        username: trimmed,
        avatar: getAvatarInitials(trimmed),
        avatarColor: getAvatarColor(trimmed),
      },
    });
    showToast('Username updated', 'success');
  };

  const saveProfile = () => {
    dispatch({
      type: 'SET_SETTINGS',
      settings: {
        profileImage: pfpUrl,
        bio: bio.trim(),
        location: location.trim(),
        occupation: occupation.trim(),
        responseStyle,
      },
    });
    showToast('Profile updated', 'success');
  };

  const saveAppearance = () => {
    dispatch({
      type: 'SET_SETTINGS',
      settings: { backgroundImage: bgUrl || '/night-sky.svg', accentColor: accent },
    });
    showToast('Appearance updated', 'success');
  };

  const updateChatSetting = (key: 'temperature' | 'maxTokens' | 'topP' | 'topK' | 'frequencyPenalty' | 'presencePenalty', value: number) => {
    dispatch({ type: 'SET_CHAT_SETTINGS', settings: { [key]: value } });
  };

  const addMemory = () => {
    const trimmed = memoryDraft.trim();
    if (!trimmed) return;
    dispatch({ type: 'ADD_MEMORY_ITEM', item: { id: crypto.randomUUID(), text: trimmed, date: Date.now() } });
    setMemoryDraft('');
    showToast('Memory added', 'success');
  };

  const clearData = () => {
    clearAllStorage();
    window.location.reload();
  };

  return (
    <div onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(14px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div className="modal-enter" onClick={event => event.stopPropagation()} style={{
        maxWidth: 1080, width: 'min(1080px, 96vw)', maxHeight: '86vh', borderRadius: 28,
        background: 'rgba(10,12,18,0.94)', backdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 90px rgba(0,0,0,0.55)',
        display: 'flex', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          width: 280, borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '22px 14px', display: 'flex', flexDirection: 'column', gap: 10,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 10px 14px' }}>
            {state.settings.profileImage ? (
              <img src={state.settings.profileImage} alt="Profile" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: state.user.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>{state.user.avatar}</div>
            )}
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{state.user.username || 'Arcus User'}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{occupation || 'Personal workspace'}</div>
            </div>
          </div>

          {sections.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 14px', textAlign: 'left',
              background: section === item.id ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: section === item.id ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
              borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
              color: section === item.id ? '#fff' : 'rgba(255,255,255,0.62)', fontSize: 13,
            }}>
              <span style={{ width: 22, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          <button onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{ position: 'absolute', top: 18, right: 18, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>×</button>

          {section === 'account' && (
            <div style={{ display: 'grid', gap: 22 }}>
              <div>
                <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Account</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Personalize your identity and how Arcus should respond when personalization is enabled.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
                <div style={{ padding: 18, borderRadius: 22, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Username</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={username} onChange={event => setUsername(event.target.value.slice(0, 30))} style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                      <button onClick={saveUsername} style={{ padding: '10px 14px', background: 'var(--accent-blue)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Profile photo URL</label>
                    <input value={pfpUrl} onChange={event => setPfpUrl(event.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Occupation</label>
                      <input value={occupation} onChange={event => setOccupation(event.target.value.slice(0, 60))} placeholder="Designer, founder, student..." style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Location</label>
                      <input value={location} onChange={event => setLocation(event.target.value.slice(0, 60))} placeholder="City, country" style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Bio</label>
                    <textarea value={bio} onChange={event => setBio(event.target.value.slice(0, 240))} rows={4} placeholder="Short background, interests, or goals for personalization." style={{ width: '100%', padding: '12px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Preferred response style</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {RESPONSE_STYLES.map(item => (
                        <button key={item.id} onClick={() => setResponseStyle(item.id)} style={{ padding: '8px 12px', borderRadius: 999, background: responseStyle === item.id ? 'rgba(124,140,255,0.18)' : 'rgba(255,255,255,0.04)', border: responseStyle === item.id ? '1px solid rgba(124,140,255,0.3)' : '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{item.label}</button>
                      ))}
                    </div>
                  </div>

                  <button onClick={saveProfile} style={{ width: 'fit-content', padding: '10px 16px', background: 'var(--accent-blue)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save profile</button>
                </div>

                <div style={{ padding: 18, borderRadius: 22, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: 14, alignContent: 'start' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preview</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {pfpUrl ? (
                      <img src={pfpUrl} alt="Preview" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: state.user.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 20 }}>{getAvatarInitials(username || state.user.username || 'A')}</div>
                    )}
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{username || 'Arcus User'}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{occupation || 'Personal workspace'}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{bio || 'Add a short bio so personalization has real context to work with.'}</div>
                  <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 10 }}>Danger zone</div>
                    <button onClick={clearData} style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, color: '#FCA5A5', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Clear Arcus data and reset</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'appearance' && (
            <div style={{ display: 'grid', gap: 22 }}>
              <div>
                <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Appearance</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Tune the night wallpaper, accent, and motion so the app feels less generic and more like yours.</p>
              </div>

              <div style={{ padding: 18, borderRadius: 22, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Background image URL</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={bgUrl} onChange={event => setBgUrl(event.target.value)} placeholder="/night-sky.svg or https://..." style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={() => setBgUrl('/night-sky.svg')} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Default</button>
                  </div>
                  <div style={{ marginTop: 10, width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <img src={bgUrl || '/night-sky.svg'} alt="Wallpaper preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Accent color</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {ACCENT_COLORS.map(color => (
                      <button key={color} onClick={() => { setAccent(color); dispatch({ type: 'SET_SETTINGS', settings: { accentColor: color } }); }} style={{ width: 34, height: 34, borderRadius: '50%', background: color, cursor: 'pointer', border: accent === color ? '2px solid #fff' : '2px solid transparent', boxShadow: accent === color ? '0 0 0 3px rgba(255,255,255,0.12)' : 'none' }} />
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Wallpaper intensity</label>
                    <span style={{ fontSize: 12, color: '#fff' }}>{Math.round(state.settings.wallpaperOpacity * 100)}%</span>
                  </div>
                  <input type="range" min={20} max={95} value={Math.round(state.settings.wallpaperOpacity * 100)} onChange={event => dispatch({ type: 'SET_SETTINGS', settings: { wallpaperOpacity: Number(event.target.value) / 100 } })} />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Ambient motion</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>Toggle subtle background animation.</div>
                  </div>
                  <input type="checkbox" checked={state.settings.showAnimations} onChange={event => dispatch({ type: 'SET_SETTINGS', settings: { showAnimations: event.target.checked } })} />
                </label>

                <button onClick={saveAppearance} style={{ width: 'fit-content', padding: '10px 16px', background: 'var(--accent-blue)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save appearance</button>
              </div>
            </div>
          )}

          {section === 'system-prompt' && (
            <div style={{ display: 'grid', gap: 22 }}>
              <div>
                <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>System Prompt</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Shape the assistant behavior and the generation controls that are applied to new responses.</p>
              </div>
              <div style={{ padding: 18, borderRadius: 22, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>System prompt</label>
                  <textarea value={state.chatSettings.systemPrompt} onChange={event => dispatch({ type: 'SET_CHAT_SETTINGS', settings: { systemPrompt: event.target.value } })} rows={5} placeholder="Instructions that guide the AI's behavior" style={{ width: '100%', padding: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                  {[
                    { key: 'temperature', label: 'Temperature', min: 0, max: 2, step: 0.1, value: state.chatSettings.temperature },
                    { key: 'maxTokens', label: 'Max tokens', min: 256, max: 8192, step: 256, value: state.chatSettings.maxTokens },
                    { key: 'topP', label: 'Top P', min: 0, max: 1, step: 0.05, value: state.chatSettings.topP },
                    { key: 'topK', label: 'Top K', min: 0, max: 100, step: 1, value: state.chatSettings.topK },
                    { key: 'frequencyPenalty', label: 'Frequency penalty', min: -2, max: 2, step: 0.1, value: state.chatSettings.frequencyPenalty },
                    { key: 'presencePenalty', label: 'Presence penalty', min: -2, max: 2, step: 0.1, value: state.chatSettings.presencePenalty },
                  ].map(item => (
                    <div key={item.key} style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
                        <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>{item.value}</span>
                      </div>
                      <input type="range" min={item.min} max={item.max} step={item.step} value={item.value} onChange={event => updateChatSetting(item.key as 'temperature' | 'maxTokens' | 'topP' | 'topK' | 'frequencyPenalty' | 'presencePenalty', Number(event.target.value))} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'memory' && (
            <div style={{ display: 'grid', gap: 22 }}>
              <div>
                <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Memory</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Keep reusable facts about the user and control whether Arcus can use them.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Enable memory</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>When enabled, Arcus can inject saved facts into responses.</div>
                </div>
                <input type="checkbox" checked={state.memory.enabled} onChange={event => dispatch({ type: 'SET_MEMORY', memory: { enabled: event.target.checked } })} />
              </label>

              <div style={{ padding: 18, borderRadius: 22, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: 14 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={memoryDraft} onChange={event => setMemoryDraft(event.target.value)} placeholder="Add a fact to remember..." style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  <button onClick={addMemory} style={{ padding: '10px 14px', background: 'var(--accent-blue)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  {state.memory.items.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No saved memory yet.</div>
                  ) : state.memory.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#fff' }}>{item.text}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(item.date).toLocaleString()}</div>
                      </div>
                      <button onClick={() => dispatch({ type: 'REMOVE_MEMORY_ITEM', id: item.id })} style={{ padding: '7px 10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, color: '#FCA5A5', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'usage' && (
            <div style={{ display: 'grid', gap: 22 }}>
              <div>
                <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Usage</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>See how often you use Arcus and which models you lean on the most.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
                {[
                  { label: 'Requests today', value: `${state.usage.today.requests}/${state.usage.today.limit}` },
                  { label: 'Saved chats', value: String(state.conversations.length) },
                  { label: 'Favorite models', value: String(state.favoriteModelIds.length) },
                ].map(item => (
                  <div key={item.label} style={{ padding: 18, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 18, borderRadius: 22, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top models</div>
                {usageRows.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Usage data will appear after you send a few requests.</div>
                ) : usageRows.map(([modelId, details]) => (
                  <div key={modelId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 13, color: '#fff' }}>{modelId}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{details.count} requests · {details.tokens} tokens</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'about' && (
            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>About Arcus</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>A cleaner AI workspace for chat, image generation, and model exploration.</p>
              </div>
              <div style={{ padding: 18, borderRadius: 22, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--accent-blue)', fontSize: 24 }}>◆</span>
                  <span style={{ fontSize: 22, fontWeight: 700 }}>Arcus</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 999 }}>v1.0.0</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7 }}>
                  Arcus now supports live prompt-mode controls in chat, a richer model selector, a Pollinations-backed studio flow, and a more complete settings experience for personalizing the workspace.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7 }}>
                  Powered by <a href="https://puter.com" target="_blank" rel="noopener" style={{ color: 'var(--accent-blue)' }}>Puter.js</a> for chat and <a href="https://pollinations.ai" target="_blank" rel="noopener" style={{ color: 'var(--accent-blue)' }}>Pollinations</a> for image generation.
                </p>
                <a href="https://github.com/Azuzuly/Arcus" target="_blank" rel="noopener" style={{ color: 'var(--accent-blue)', fontSize: 14, width: 'fit-content' }}>GitHub Repository ↗</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
