/**
 * EncryptionSetup — First-Run Encryption Wizard
 *
 * Rocket.new-inspired stepped setup flow for creating the user's
 * encryption passphrase. Glass card surfaces with progressive disclosure.
 *
 * Steps: 1) Explain  2) Create passphrase  3) Confirm  4) Derive key + migrate
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

type SetupStep = 'intro' | 'create' | 'confirm' | 'deriving' | 'complete';

interface EncryptionSetupProps {
  onComplete: (passphrase: string) => Promise<void>;
  onSkip?: () => void;
  existingData?: boolean; // true if localStorage has conversations to migrate
}

interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  glow: string;
}

function evaluateStrength(pass: string): StrengthResult {
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 14) score++;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
  if (/\d/.test(pass) && /[^a-zA-Z0-9]/.test(pass)) score++;

  const configs: StrengthResult[] = [
    { score: 0, label: 'Too weak', color: '#f87171', glow: 'rgba(248,113,113,0.3)' },
    { score: 1, label: 'Weak', color: '#fb923c', glow: 'rgba(251,146,60,0.3)' },
    { score: 2, label: 'Fair', color: '#fbbf24', glow: 'rgba(251,191,36,0.3)' },
    { score: 3, label: 'Strong', color: '#4ade80', glow: 'rgba(74,222,128,0.3)' },
    { score: 4, label: 'Excellent', color: '#22d3ee', glow: 'rgba(34,211,238,0.3)' },
  ];

  return configs[Math.min(score, 4)] as StrengthResult;
}

export default function EncryptionSetup({
  onComplete,
  onSkip,
  existingData = false,
}: EncryptionSetupProps) {
  const [step, setStep] = useState<SetupStep>('intro');
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [deriveProgress, setDeriveProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const strength = evaluateStrength(passphrase);
  const passMatch = passphrase === confirm && confirm.length > 0;

  useEffect(() => {
    if (step === 'create' || step === 'confirm') {
      inputRef.current?.focus();
    }
  }, [step]);

  const handleDerive = useCallback(async () => {
    if (!passMatch || strength.score < 2) return;
    setStep('deriving');
    setError('');

    // Simulate progress for PBKDF2 derivation (actual derivation in crypto.ts)
    const interval = setInterval(() => {
      setDeriveProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + Math.random() * 15;
      });
    }, 100);

    try {
      await onComplete(passphrase);
      clearInterval(interval);
      setDeriveProgress(100);
      setTimeout(() => setStep('complete'), 400);
    } catch (err) {
      clearInterval(interval);
      setDeriveProgress(0);
      setError(err instanceof Error ? err.message : 'Key derivation failed');
      setStep('create');
    }
  }, [passphrase, passMatch, strength.score, onComplete]);

  // ── Shared styles ──
  const cardStyle: React.CSSProperties = {
    maxWidth: 480,
    width: '100%',
    padding: 32,
    borderRadius: 'var(--radius-lg, 16px)',
    border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
    background: 'var(--bg-surface, #16171f)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
    animation: 'setupFadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--text-primary, #fff)',
    marginBottom: 8,
    letterSpacing: '-0.01em',
  };

  const subStyle: React.CSSProperties = {
    fontSize: 14,
    color: 'var(--text-secondary, rgba(255,255,255,0.55))',
    lineHeight: 1.6,
    marginBottom: 24,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm, 8px)',
    border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
    background: 'var(--glass-input, #1e1f2a)',
    color: 'var(--text-primary, #fff)',
    fontSize: 15,
    fontFamily: 'var(--font-mono)',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  };

  const btnPrimary: React.CSSProperties = {
    width: '100%',
    padding: '12px 24px',
    borderRadius: 'var(--radius-sm, 8px)',
    border: 'none',
    background: 'var(--accent-primary, #6366f1)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
    fontFamily: 'inherit',
  };

  const btnGhost: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm, 8px)',
    border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
    background: 'transparent',
    color: 'var(--text-muted, rgba(255,255,255,0.35))',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    fontFamily: 'inherit',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(5,5,8,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* ── Step: Intro ── */}
      {step === 'intro' && (
        <div style={cardStyle}>
          {/* Shield icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-md, 12px)',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary, #6366f1)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>

          <h2 style={headingStyle}>Encrypt Your Data</h2>
          <p style={subStyle}>
            Arcus can encrypt all your conversations, settings, and AI memories
            with a passphrase only you know. Your data never leaves your device
            unencrypted — not even Arcus servers can read it.
          </p>

          {existingData && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'rgba(251, 191, 36, 0.06)',
                border: '1px solid rgba(251, 191, 36, 0.15)',
                fontSize: 13,
                color: '#fbbf24',
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              You have existing conversations that will be migrated to encrypted storage.
              This is a one-time process.
            </div>
          )}

          {/* Feature grid — Rocket.new bento style */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
            {[
              { icon: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4', label: 'AES-256-GCM' },
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Zero-Knowledge' },
              { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', label: 'E2E Sync' },
              { icon: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21', label: 'PII Redaction' },
            ].map(feat => (
              <div
                key={feat.label}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
                  background: 'var(--glass-panel, rgba(255,255,255,0.04))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary, #818cf8)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d={feat.icon} />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary, rgba(255,255,255,0.55))' }}>
                  {feat.label}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('create')}
            style={btnPrimary}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 24px rgba(99,102,241,0.3), 0 8px 32px rgba(99,102,241,0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Set Up Encryption
          </button>

          {onSkip && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={onSkip} style={btnGhost}>
                Skip for now
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step: Create passphrase ── */}
      {step === 'create' && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>Create Your Passphrase</h2>
          <p style={subStyle}>
            Choose a strong passphrase. This is the only key to your data — if lost,
            encrypted conversations cannot be recovered.
          </p>

          <div style={{ position: 'relative', marginBottom: 8 }}>
            <input
              ref={inputRef}
              type={showPass ? 'text' : 'password'}
              value={passphrase}
              onChange={e => { setPassphrase(e.target.value); setError(''); }}
              placeholder="Enter passphrase..."
              style={{
                ...inputStyle,
                paddingRight: 48,
                borderColor: error ? '#f87171' : passphrase ? strength.color : 'var(--glass-border, rgba(255,255,255,0.06))',
                boxShadow: passphrase ? `0 0 12px ${strength.glow}` : 'none',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'var(--accent-primary, #6366f1)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = passphrase ? strength.color : 'var(--glass-border, rgba(255,255,255,0.06))';
                e.currentTarget.style.boxShadow = passphrase ? `0 0 12px ${strength.glow}` : 'none';
              }}
            />
            <button
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, rgba(255,255,255,0.35))',
                cursor: 'pointer',
                padding: 4,
                fontSize: 13,
              }}
            >
              {showPass ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Strength meter — Rocket.new inspired segmented bar */}
          {passphrase.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      background: i < strength.score
                        ? strength.color
                        : 'var(--glass-border, rgba(255,255,255,0.06))',
                      transition: 'background 200ms ease',
                      boxShadow: i < strength.score ? `0 0 8px ${strength.glow}` : 'none',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: strength.color, fontWeight: 500 }}>
                  {strength.label}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-faint, rgba(255,255,255,0.2))' }}>
                  {passphrase.length} characters
                </span>
              </div>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12 }}>{error}</div>
          )}

          <button
            onClick={() => {
              if (strength.score < 2) {
                setError('Passphrase is too weak. Use at least 8 characters with mixed case and symbols.');
                return;
              }
              setStep('confirm');
            }}
            disabled={passphrase.length < 6}
            style={{
              ...btnPrimary,
              opacity: passphrase.length < 6 ? 0.4 : 1,
              cursor: passphrase.length < 6 ? 'not-allowed' : 'pointer',
            }}
          >
            Continue
          </button>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button onClick={() => setStep('intro')} style={btnGhost}>Back</button>
          </div>
        </div>
      )}

      {/* ── Step: Confirm passphrase ── */}
      {step === 'confirm' && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>Confirm Passphrase</h2>
          <p style={subStyle}>
            Re-enter your passphrase to confirm. This ensures you remember it —
            there is no recovery mechanism.
          </p>

          <input
            ref={inputRef}
            type="password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(''); }}
            placeholder="Re-enter passphrase..."
            style={{
              ...inputStyle,
              marginBottom: 16,
              borderColor: confirm.length > 0
                ? (passMatch ? '#4ade80' : '#f87171')
                : 'var(--glass-border, rgba(255,255,255,0.06))',
              boxShadow: confirm.length > 0
                ? (passMatch ? '0 0 12px rgba(74,222,128,0.2)' : '0 0 12px rgba(248,113,113,0.2)')
                : 'none',
            }}
            onKeyDown={e => e.key === 'Enter' && passMatch && handleDerive()}
          />

          {confirm.length > 0 && !passMatch && (
            <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12 }}>Passphrases do not match</div>
          )}

          {error && (
            <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12 }}>{error}</div>
          )}

          <button
            onClick={handleDerive}
            disabled={!passMatch}
            style={{
              ...btnPrimary,
              opacity: passMatch ? 1 : 0.4,
              cursor: passMatch ? 'pointer' : 'not-allowed',
              background: passMatch ? '#4ade80' : 'var(--accent-primary, #6366f1)',
              color: passMatch ? '#0a0a0f' : '#fff',
            }}
          >
            {existingData ? 'Encrypt & Migrate Data' : 'Enable Encryption'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button onClick={() => { setConfirm(''); setStep('create'); }} style={btnGhost}>Back</button>
          </div>
        </div>
      )}

      {/* ── Step: Deriving key ── */}
      {step === 'deriving' && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          {/* Spinning lock animation */}
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 24px',
              borderRadius: '50%',
              border: '2px solid var(--glass-border, rgba(255,255,255,0.06))',
              borderTopColor: 'var(--accent-primary, #6366f1)',
              animation: 'deriveSpin 1s linear infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary, #6366f1)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>

          <h2 style={{ ...headingStyle, marginBottom: 12 }}>Deriving Encryption Key</h2>
          <p style={{ ...subStyle, marginBottom: 24 }}>
            Running 100,000 rounds of PBKDF2 to create your encryption key.
            This may take a moment...
          </p>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: 4,
              borderRadius: 2,
              background: 'var(--glass-border, rgba(255,255,255,0.06))',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(deriveProgress, 100)}%`,
                height: '100%',
                borderRadius: 2,
                background: 'linear-gradient(90deg, var(--accent-primary, #6366f1), var(--accent-violet, #8b5cf6))',
                boxShadow: '0 0 12px rgba(99,102,241,0.4)',
                transition: 'width 150ms ease',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Step: Complete ── */}
      {step === 'complete' && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'setupFadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 0 32px rgba(74,222,128,0.15)',
            }}
          >
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h2 style={headingStyle}>Encryption Active</h2>
          <p style={subStyle}>
            Your data is now encrypted with AES-256-GCM. All conversations,
            settings, and memories are protected.
            {existingData && ' Existing data has been migrated to encrypted storage.'}
          </p>

          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm, 8px)',
              background: 'rgba(251, 191, 36, 0.06)',
              border: '1px solid rgba(251, 191, 36, 0.15)',
              fontSize: 13,
              color: '#fbbf24',
              lineHeight: 1.5,
              marginBottom: 24,
              textAlign: 'left',
            }}
          >
            Remember your passphrase! Without it, your encrypted data cannot be recovered.
            There is no "forgot password" option.
          </div>

          <button
            onClick={() => window.location.reload()}
            style={btnPrimary}
          >
            Start Using Arcus
          </button>
        </div>
      )}

      <style>{`
        @keyframes setupFadeIn {
          0% { opacity: 0; transform: translateY(12px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes deriveSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
