'use client';

import { useStore } from '@/lib/store';
import { useState } from 'react';
import { getAvatarInitials, getAvatarColor } from '@/lib/utils';
import { setStorageImmediate } from '@/lib/storage';

export default function SettingsModal() {
  const { state, dispatch, showToast } = useStore();
  const [section, setSection] = useState<string>('account');
  const [username, setUsername] = useState(state.user.username);
  const [bgUrl, setBgUrl] = useState(state.settings.backgroundImage);
  const [pfpUrl, setPfpUrl] = useState(state.settings.profileImage);
  const [accent, setAccent] = useState(state.settings.accentColor);

  const SECTIONS = [
    { id: 'account', label: '👤 Account' },
    { id: 'appearance', label: '🎨 Appearance' },
    { id: 'about', label: 'ℹ️ About' },
  ];

  const ACCENT_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#84CC16', '#fff'];

  const saveUsername = () => {
    if (username.trim()) {
      setStorageImmediate('username', username.trim());
      dispatch({
        type: 'SET_USER',
        user: {
          ...state.user,
          username: username.trim(),
          avatar: getAvatarInitials(username.trim()),
          avatarColor: getAvatarColor(username.trim()),
        },
      });
      showToast('Username updated', 'success');
    }
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

  return (
    <div onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="modal-enter" onClick={e => e.stopPropagation()} style={{
        maxWidth: 640, width: '90%', maxHeight: '80vh', borderRadius: 20,
        background: 'rgba(18,18,20,0.95)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        display: 'flex', overflow: 'hidden',
      }}>
        {/* Sidebar */}
        <div style={{
          width: 180, borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 8px', display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, padding: '8px 12px', marginBottom: 8 }}>Settings</div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{
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
                Powered by <a href="https://puter.com" target="_blank" rel="noopener" style={{ color: '#3B82F6' }}>Puter.js</a> — no API keys required.
              </p>
              <a href="https://github.com/Azuzuly/Arcus" target="_blank" rel="noopener" style={{ color: '#3B82F6', fontSize: 14 }}>GitHub Repository ↗</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
