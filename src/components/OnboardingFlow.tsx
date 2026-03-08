'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { buildUniqueUsername, mapInsforgeUserToStateUser, normalizeUsernameBase } from '@/lib/auth';
import { insforge } from '@/lib/insforge';
import { brandLogoUrl } from '@/lib/providerLogos';

export default function OnboardingFlow() {
  const { dispatch, showToast } = useStore();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'signup' | 'signin' | 'verify'>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const usernamePreview = useMemo(() => normalizeUsernameBase(username), [username]);

  const completeAuth = async (userLike: Parameters<typeof mapInsforgeUserToStateUser>[0], preferredName?: string) => {
    const normalized = normalizeUsernameBase(preferredName || username || String(userLike.profile?.name || 'arcus'));
    const uniqueUsername = buildUniqueUsername(normalized, userLike.id);
    await insforge.auth.setProfile({
      name: uniqueUsername,
      username: uniqueUsername,
      preferred_name: normalized,
    });
    dispatch({ type: 'SET_USER', user: mapInsforgeUserToStateUser({ ...userLike, profile: { ...(userLike.profile || {}), username: uniqueUsername, name: uniqueUsername } }) });
    showToast('Welcome to Arcus', 'success');
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    const base = normalizeUsernameBase(username);
    const { data, error: signUpError } = await insforge.auth.signUp({
      email: email.trim(),
      password,
      name: base,
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message || 'Could not create account');
      return;
    }
    if (data?.requireEmailVerification) {
      setMode('verify');
      showToast('Check your email for the 6-digit verification code.', 'info');
      return;
    }
    if (data?.user) {
      await completeAuth(data.user, base);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    const { data, error: signInError } = await insforge.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError || !data?.user) {
      setError(signInError?.message || 'Could not sign in');
      return;
    }
    dispatch({ type: 'SET_USER', user: mapInsforgeUserToStateUser(data.user) });
    showToast('Signed in', 'success');
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    const { data, error: verifyError } = await insforge.auth.verifyEmail({ email: email.trim(), otp: otp.trim() });
    setLoading(false);
    if (verifyError || !data?.user) {
      setError(verifyError?.message || 'Could not verify your email');
      return;
    }
    await completeAuth(data.user, username);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    const { error: oauthError } = await insforge.auth.signInWithOAuth({
      provider,
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    });
    setLoading(false);
    if (oauthError) {
      setError(oauthError.message || `Could not sign in with ${provider}`);
    }
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              <img src={brandLogoUrl} alt="Arcus" style={{ width: 54, height: 54, objectFit: 'contain' }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 28 }}>Arcus</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 8 }}>Your intelligent AI workspace</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
              Create an account to unlock chat, research, image generation, and synced identity across your Arcus workspace.
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
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>{mode === 'signin' ? 'Welcome back' : mode === 'verify' ? 'Verify your email' : 'Create your account'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              {mode === 'signin' ? 'Sign in to continue using Arcus.' : mode === 'verify' ? 'Enter the 6-digit code from your inbox.' : 'Every user gets a unique Arcus handle.'}
            </p>
            {mode !== 'verify' && (
              <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
                {mode === 'signup' && (
                  <input value={username} onChange={e => setUsername(e.target.value.slice(0, 30))}
                    placeholder="Choose a username" autoFocus
                    style={{
                      width: '100%', padding: '12px 16px', background: 'var(--glass-input)',
                      border: '1px solid var(--glass-border)', borderRadius: 25,
                      color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                      textAlign: 'center',
                    }} />
                )}
                <input value={email} onChange={e => setEmail(e.target.value.trim())}
                  placeholder="Email address"
                  style={{
                    width: '100%', padding: '12px 16px', background: 'var(--glass-input)',
                    border: '1px solid var(--glass-border)', borderRadius: 25,
                    color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                    textAlign: 'center',
                  }} />
                <input value={password} type="password" onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Create a password' : 'Password'}
                  style={{
                    width: '100%', padding: '12px 16px', background: 'var(--glass-input)',
                    border: '1px solid var(--glass-border)', borderRadius: 25,
                    color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                    textAlign: 'center',
                  }} />
              </div>
            )}
            {mode === 'verify' && (
              <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
                <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit verification code" autoFocus
                  style={{
                    width: '100%', padding: '12px 16px', background: 'var(--glass-input)',
                    border: '1px solid var(--glass-border)', borderRadius: 25,
                    color: 'var(--text-primary)', fontSize: 16, outline: 'none', fontFamily: 'inherit',
                    textAlign: 'center', letterSpacing: '0.28em',
                  }} />
              </div>
            )}
            {mode === 'signup' && usernamePreview && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Your unique Arcus handle will look like <strong>{usernamePreview || 'arcus'}-xxxxxx</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button onClick={() => handleOAuth('google')} disabled={loading} style={{
                flex: 1, padding: '10px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              }}>Google</button>
              <button onClick={() => handleOAuth('github')} disabled={loading} style={{
                flex: 1, padding: '10px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              }}>GitHub</button>
            </div>
            {error && <div style={{ fontSize: 12, color: 'var(--accent-red)', marginBottom: 16 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '12px 0', background: 'var(--glass-button)',
                border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}>Back</button>
              <button onClick={() => { if (mode === 'signup') void handleSignUp(); else if (mode === 'signin') void handleSignIn(); else void handleVerify(); }} disabled={loading || (mode === 'signup' ? (!username.trim() || !email.trim() || password.length < 6) : mode === 'signin' ? (!email.trim() || !password) : otp.length !== 6)} style={{
                flex: 2, padding: '12px 0', background: 'var(--accent-blue)',
                border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: loading || (mode === 'signup' ? (!username.trim() || !email.trim() || password.length < 6) : mode === 'signin' ? (!email.trim() || !password) : otp.length !== 6) ? 0.5 : 1, fontFamily: 'inherit',
              }}>
                {loading ? 'Working…' : mode === 'signup' ? 'Create Account →' : mode === 'signin' ? 'Sign In →' : 'Verify & Enter →'}
              </button>
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
              {mode === 'signup' ? (
                <button onClick={() => { setMode('signin'); setError(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontFamily: 'inherit' }}>Already have an account? Sign in</button>
              ) : mode === 'signin' ? (
                <button onClick={() => { setMode('signup'); setError(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontFamily: 'inherit' }}>Need an account? Create one</button>
              ) : (
                <button onClick={() => { setMode('signin'); setError(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontFamily: 'inherit' }}>I verified already — take me to sign in</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
