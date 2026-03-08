/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { mapInsforgeUserToStateUser, normalizeUsernameBase } from '@/lib/auth';
import { insforge } from '@/lib/insforge';
import { brandLogoUrl } from '@/lib/providerLogos';

type AuthMode = 'signup' | 'signin' | 'verify';
type AuthMethod = 'password' | 'google' | 'github';

const LAST_AUTH_METHOD_KEY = 'arcus_last_auth_method';

const featurePoints = [
  'Create a unique Arcus identity with synced conversations and preferences.',
  'Jump between research, chat, studio, and agents without losing context.',
  'Use one polished workspace with branded models, uploads, and deep research controls.',
];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3.1l3.1 2.4c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.4-.2-2H12Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.1-2.4c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1l-3.2 2.5A9.99 9.99 0 0 0 12 22Z" />
      <path fill="#4A90E2" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.2 7.5A10 10 0 0 0 2 12c0 1.6.4 3.1 1.2 4.5L6.4 14Z" />
      <path fill="#FBBC05" d="M12 5.9c1.5 0 2.9.5 4 1.6l3-3C16.9 2.5 14.7 2 12 2a10 10 0 0 0-8.8 5.5L6.4 10C7.2 7.7 9.4 5.9 12 5.9Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 .5C5.7.5.8 5.4.8 11.7c0 5 3.2 9.2 7.7 10.7.6.1.8-.3.8-.6v-2.1c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.8 1.2 1.8 1.2 1 .1 2 .8 2.5 1.7.9.7 2 .6 2.5.4.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.3-5.1-5.7 0-1.3.5-2.5 1.2-3.3-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.4 1.3 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.6 3.4-1.3 3.4-1.3.7 1.6.3 2.8.1 3.1.8.8 1.2 2 1.2 3.3 0 4.4-2.7 5.3-5.2 5.6.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6 4.4-1.5 7.7-5.7 7.7-10.7C23.2 5.4 18.3.5 12 .5Z" />
    </svg>
  );
}

export default function OnboardingFlow() {
  const { dispatch, showToast } = useStore();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<AuthMode>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastAuthMethod, setLastAuthMethod] = useState<AuthMethod | null>(() => {
    if (typeof window === 'undefined') return null;
    return (window.localStorage.getItem(LAST_AUTH_METHOD_KEY) as AuthMethod | null) || null;
  });
  const [isWide, setIsWide] = useState(typeof window === 'undefined' ? true : window.innerWidth >= 920);

  const usernamePreview = useMemo(() => normalizeUsernameBase(username), [username]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncViewport = () => setIsWide(window.innerWidth >= 920);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const rememberAuthMethod = (method: AuthMethod) => {
    setLastAuthMethod(method);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_AUTH_METHOD_KEY, method);
    }
  };

  const sendVerificationCode = async (targetEmail: string) => {
    const { error: resendError } = await insforge.auth.resendVerificationEmail({ email: targetEmail.trim() });
    if (resendError) {
      throw resendError;
    }
  };

  const completeAuth = async (
    userLike: Parameters<typeof mapInsforgeUserToStateUser>[0],
    preferredName?: string,
    method: AuthMethod = 'password'
  ) => {
    const normalized = normalizeUsernameBase(preferredName || username || String(userLike.profile?.name || 'arcus'));
    await insforge.auth.setProfile({
      name: normalized,
      username: normalized,
      preferred_name: normalized,
    });
    dispatch({ type: 'SET_USER', user: mapInsforgeUserToStateUser({ ...userLike, profile: { ...(userLike.profile || {}), username: normalized, name: normalized } }) });
    rememberAuthMethod(method);
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
      try {
        await sendVerificationCode(email);
      } catch (verificationError) {
        setLoading(false);
        setMode('verify');
        setError(verificationError instanceof Error ? verificationError.message : 'Account created, but Arcus could not send the verification code automatically.');
        return;
      }
      setMode('verify');
      showToast('Account created. Check your email for the 6-digit verification code.', 'info');
      setLoading(false);
      return;
    }
    if (data?.user) {
      await completeAuth(data.user, base, 'password');
    }
    setLoading(false);
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
      if (signInError?.statusCode === 403 && /verify your email/i.test(signInError.nextActions || signInError.message || '')) {
        setMode('verify');
        try {
          await sendVerificationCode(email);
          showToast('Verify your email to finish signing in. We sent a fresh 6-digit code.', 'info');
        } catch (verificationError) {
          setError(verificationError instanceof Error ? verificationError.message : 'Please verify your email before signing in.');
          return;
        }
        return;
      }
      setError(signInError?.message || 'Could not sign in');
      return;
    }
    dispatch({ type: 'SET_USER', user: mapInsforgeUserToStateUser(data.user) });
    rememberAuthMethod('password');
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
    await completeAuth(data.user, username, 'password');
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError('Enter your email first so Arcus knows where to send the code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await sendVerificationCode(email);
      showToast('Fresh verification code sent.', 'success');
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'Could not resend the verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError('');
    const { error: oauthError } = await insforge.auth.signInWithOAuth({
      provider,
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    });
    setLoading(false);
    if (oauthError) {
      setError(oauthError.message || `Could not sign in with ${provider}`);
      return;
    }
    rememberAuthMethod(provider);
  };

  const renderLastUsed = (method: AuthMethod) => lastAuthMethod === method ? (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 999,
      background: 'rgba(56,189,248,0.14)', border: '1px solid rgba(56,189,248,0.24)', color: '#bae6fd',
      fontSize: 11, fontWeight: 700,
    }}>
      Last used
    </span>
  ) : null;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(6,8,14,0.96)',
      backdropFilter: 'blur(36px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 18,
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-18%', left: '-8%', width: '40vw', height: '40vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(64,101,175,0.18), transparent 68%)', filter: 'blur(32px)',
        }} />
        <div style={{
          position: 'absolute', right: '-10%', bottom: '-14%', width: '36vw', height: '36vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(39,69,121,0.18), transparent 70%)', filter: 'blur(36px)',
        }} />
      </div>
      <div className="modal-enter" style={{
        maxWidth: 960, width: 'min(960px, 100%)', borderRadius: 'var(--radius-3xl)',
        background: 'rgba(12,16,24,0.94)', backdropFilter: 'blur(20px) saturate(145%)',
        border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isWide ? 'minmax(320px, 0.92fr) minmax(360px, 1fr)' : '1fr',
          position: 'relative',
        }}>
          <div style={{
            padding: isWide ? '42px 34px 38px 40px' : '28px 24px 10px',
            borderRight: isWide ? '1px solid rgba(255,255,255,0.08)' : 'none',
            borderBottom: isWide ? 'none' : '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 999, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)', color: '#bfdbfe', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Account-gated access
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24 }}>
              <img src={brandLogoUrl} alt="Arcus" style={{ width: 56, height: 56, objectFit: 'contain' }} />
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 30, letterSpacing: '-0.04em' }}>Arcus</div>
                <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 14 }}>One elegant workspace for chat, research, studio, and agents.</div>
              </div>
            </div>

            <div style={{ marginTop: 30 }}>
              <div style={{ fontSize: 'clamp(30px, 4vw, 42px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.05em' }}>
                Sign in once.<br />Stay in flow everywhere.
              </div>
              <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 1.7, marginTop: 16, maxWidth: 420 }}>
                Your account unlocks synced identity, personalized research settings, pinned chats, studio history, and the cleaner Arcus experience you asked for.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
              {featurePoints.map(point => (
                <div key={point} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 18,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(59,130,246,0.16)', color: '#dbeafe', fontSize: 14, flexShrink: 0,
                  }}>✦</div>
                  <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 1.6 }}>{point}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: isWide ? 40 : '24px 24px 30px', textAlign: 'center' }}>
            {step === 1 && (
              <div style={{ maxWidth: 420, margin: '0 auto' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: 600, marginBottom: 18 }}>
                  Beautifully secure by default
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.03em' }}>Welcome to Arcus</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
                  Create an account to unlock chat, research, image generation, and your synced Arcus identity across devices.
                </p>
                <button onClick={() => setStep(2)} style={{
                  width: '100%', padding: '14px 0', background: '#3B82F6',
                  border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
                  fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 10px 28px rgba(59,130,246,0.24)',
                }}>
                  Get Started →
                </button>
              </div>
            )}

            {step === 2 && (
              <div style={{ maxWidth: 420, margin: '0 auto' }}>
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
                <button onClick={() => void handleResendVerification()} disabled={loading}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                    opacity: loading ? 0.65 : 1,
                  }}>
                  {loading ? 'Sending code…' : 'Resend verification code'}
                </button>
              </div>
            )}
            {mode === 'signup' && usernamePreview && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Your Arcus username will be <strong>{usernamePreview || 'arcus'}</strong>
              </div>
            )}
            <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
              <button onClick={() => handleOAuth('google')} disabled={loading} style={{
                width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600 }}><GoogleIcon /> Continue with Google</span>
                {renderLastUsed('google')}
              </button>
              <button onClick={() => handleOAuth('github')} disabled={loading} style={{
                width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600 }}><GitHubIcon /> Continue with GitHub</span>
                {renderLastUsed('github')}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or with email</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>
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
                {loading ? 'Working…' : mode === 'signup' ? 'Create Account →' : mode === 'signin' ? 'Sign In →' : 'Verify & Enter →'}{lastAuthMethod === 'password' && mode !== 'verify' ? ' · Last used' : ''}
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
      </div>
    </div>
  );
}
