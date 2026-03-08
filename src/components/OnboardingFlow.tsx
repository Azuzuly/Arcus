'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { getAvatarInitials, getAvatarColor } from '@/lib/utils';
import { setStorageImmediate } from '@/lib/storage';

export default function OnboardingFlow() {
  const { dispatch } = useStore();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');

  const finish = () => {
    const name = username.trim() || 'User';
    setStorageImmediate('username', name);
    setStorageImmediate('tier', 'free');
    dispatch({
      type: 'INIT',
      state: {
        user: {
          username: name, apiKey: '', tier: 'free',
          avatar: getAvatarInitials(name), avatarColor: getAvatarColor(name),
        },
      },
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.95)',
      backdropFilter: 'blur(40px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="modal-enter" style={{
        maxWidth: 480, width: '90%', borderRadius: 'var(--radius-3xl)',
        background: 'var(--glass-panel)', backdropFilter: 'blur(22px) saturate(160%)',
        border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-modal)',
        padding: 40,
      }}>
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              <span style={{ color: 'var(--accent-blue)', fontSize: 48 }}>◆</span>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 28 }}>Arcus</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 8 }}>Your intelligent AI workspace</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
              Chat with 500+ AI models, generate images, and build agent workflows — all in one place. No API keys needed.
            </p>
            <button onClick={() => setStep(2)} style={{
              width: '100%', padding: '14px 0', background: 'var(--accent-blue)',
              border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
              fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Get Started →
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>What should we call you?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              Pick a name to personalize your experience.
            </p>
            <input value={username} onChange={e => setUsername(e.target.value.slice(0, 30))}
              onKeyDown={e => { if (e.key === 'Enter' && username.trim()) finish(); }}
              placeholder="Your name" autoFocus
              style={{
                width: '100%', padding: '12px 16px', background: 'var(--glass-input)',
                border: '1px solid var(--glass-border)', borderRadius: 25,
                color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                textAlign: 'center', marginBottom: 20,
              }} />
            {username && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: getAvatarColor(username),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 600, color: '#fff',
                }}>
                  {getAvatarInitials(username)}
                </div>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{username}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '12px 0', background: 'var(--glass-button)',
                border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}>Back</button>
              <button onClick={finish} disabled={!username.trim()} style={{
                flex: 2, padding: '12px 0', background: 'var(--accent-blue)',
                border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: username.trim() ? 'pointer' : 'not-allowed',
                opacity: username.trim() ? 1 : 0.5, fontFamily: 'inherit',
              }}>
                Start Using Arcus →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
