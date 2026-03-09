/**
 * VaultLock — Passphrase Unlock Screen
 *
 * Full-screen overlay shown when the app boots with an encrypted vault.
 * The user must enter their passphrase to derive the decryption key
 * before any data is accessible.
 *
 * Rocket.new-inspired: centered glass card, ambient glow, smooth transitions,
 * terminal-style mono font for the passphrase field.
 */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface VaultLockProps {
  onUnlock: (passphrase: string) => Promise<void>;
  onReset?: () => void; // Optional: factory reset / destroy vault
  attempts?: number;    // Number of failed attempts so far
  maxAttempts?: number; // Lock out after N failures (default: 10)
}

export default function VaultLock({
  onUnlock,
  onReset,
  attempts = 0,
  maxAttempts = 10,
}: VaultLockProps) {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [shake, setShake] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const locked = attempts >= maxAttempts;

  useEffect(() => {
    if (!unlocking && !locked) {
      inputRef.current?.focus();
    }
  }, [unlocking, locked]);

  const handleUnlock = useCallback(async () => {
    if (!passphrase.trim() || unlocking || locked) return;
    setUnlocking(true);
    setError('');

    try {
      await onUnlock(passphrase);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect passphrase');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPassphrase('');
      setUnlocking(false);
      inputRef.current?.focus();
    }
  }, [passphrase, unlocking, locked, onUnlock]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleUnlock();
  }, [handleUnlock]);

  const remainingAttempts = maxAttempts - attempts;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--bg-void, #0a0a0f)',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glow — matches Arcus body::before */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '140%',
          height: '60%',
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(60px)',
        }}
      />

      {/* Secondary glow — bottom accent */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '30%',
          width: '40%',
          height: '30%',
          background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(80px)',
        }}
      />

      {/* Main card */}
      <div
        style={{
          position: 'relative',
          maxWidth: 420,
          width: '100%',
          padding: 40,
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
          background: 'var(--bg-surface, #16171f)',
          boxShadow: '0 32px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
          animation: shake ? 'vaultShake 500ms ease' : 'vaultFadeIn 500ms cubic-bezier(0.16, 1, 0.3, 1)',
          textAlign: 'center',
        }}
      >
        {/* Lock icon */}
        <div
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 28px',
            borderRadius: '50%',
            background: locked
              ? 'rgba(248,113,113,0.08)'
              : 'rgba(99,102,241,0.08)',
            border: `1px solid ${locked ? 'rgba(248,113,113,0.2)' : 'rgba(99,102,241,0.15)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: locked
              ? '0 0 40px rgba(248,113,113,0.1)'
              : '0 0 40px rgba(99,102,241,0.1)',
            transition: 'all 300ms ease',
          }}
        >
          <svg
            width={32}
            height={32}
            viewBox="0 0 24 24"
            fill="none"
            stroke={locked ? '#f87171' : 'var(--accent-primary, #6366f1)'}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
            <path d="M7 11V7a5 5 0 0110 0v4" />
            {locked && <path d="M12 16v2" stroke="#f87171" strokeWidth={2} />}
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--text-primary, #fff)',
            margin: '0 0 8px',
            letterSpacing: '-0.01em',
          }}
        >
          {locked ? 'Vault Locked' : 'Unlock Vault'}
        </h1>

        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary, rgba(255,255,255,0.55))',
            lineHeight: 1.6,
            margin: '0 0 32px',
          }}
        >
          {locked
            ? 'Too many failed attempts. Reset the vault or try again later.'
            : 'Enter your passphrase to decrypt your data and access Arcus.'}
        </p>

        {!locked && (
          <>
            {/* Passphrase input */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input
                ref={inputRef}
                type={showPass ? 'text' : 'password'}
                value={passphrase}
                onChange={e => { setPassphrase(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Enter passphrase..."
                disabled={unlocking}
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '14px 52px 14px 18px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  border: `1px solid ${error ? 'rgba(248,113,113,0.4)' : 'var(--glass-border, rgba(255,255,255,0.06))'}`,
                  background: 'var(--glass-input, #1e1f2a)',
                  color: 'var(--text-primary, #fff)',
                  fontSize: 16,
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                  boxShadow: error ? '0 0 16px rgba(248,113,113,0.15)' : 'none',
                  opacity: unlocking ? 0.6 : 1,
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  if (!error) {
                    e.currentTarget.style.borderColor = 'var(--accent-primary, #6366f1)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                  }
                }}
                onBlur={e => {
                  if (!error) {
                    e.currentTarget.style.borderColor = 'var(--glass-border, rgba(255,255,255,0.06))';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, rgba(255,255,255,0.35))',
                  cursor: 'pointer',
                  padding: 4,
                  fontSize: 12,
                  fontFamily: 'inherit',
                }}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  fontSize: 13,
                  color: '#f87171',
                  marginBottom: 12,
                  animation: 'vaultFadeIn 200ms ease',
                }}
              >
                {error}
                {attempts > 2 && (
                  <span style={{ color: 'var(--text-muted, rgba(255,255,255,0.35))', marginLeft: 6 }}>
                    ({remainingAttempts} attempts remaining)
                  </span>
                )}
              </div>
            )}

            {/* Unlock button */}
            <button
              onClick={handleUnlock}
              disabled={!passphrase.trim() || unlocking}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 'var(--radius-sm, 8px)',
                border: 'none',
                background: unlocking
                  ? 'var(--glass-hover, rgba(255,255,255,0.08))'
                  : 'var(--accent-primary, #6366f1)',
                color: unlocking ? 'var(--text-secondary, rgba(255,255,255,0.55))' : '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: !passphrase.trim() || unlocking ? 'not-allowed' : 'pointer',
                opacity: !passphrase.trim() ? 0.4 : 1,
                transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                fontFamily: 'inherit',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (passphrase.trim() && !unlocking) {
                  e.currentTarget.style.boxShadow = '0 0 24px rgba(99,102,241,0.3), 0 8px 32px rgba(99,102,241,0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {unlocking ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderTopColor: '#fff',
                      animation: 'vaultSpin 0.6s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                  Decrypting...
                </span>
              ) : (
                'Unlock'
              )}
            </button>
          </>
        )}

        {/* Forgot / Reset section */}
        <div style={{ marginTop: 24 }}>
          {!showReset && !locked && (
            <button
              onClick={() => setShowReset(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, rgba(255,255,255,0.35))',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: 4,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary, rgba(255,255,255,0.55))'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted, rgba(255,255,255,0.35))'; }}
            >
              Forgot passphrase?
            </button>
          )}

          {(showReset || locked) && onReset && (
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'rgba(248,113,113,0.04)',
                border: '1px solid rgba(248,113,113,0.12)',
                animation: 'vaultFadeIn 200ms ease',
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary, rgba(255,255,255,0.55))',
                  lineHeight: 1.6,
                  margin: '0 0 12px',
                }}
              >
                Without your passphrase, encrypted data cannot be recovered.
                You can reset the vault to start fresh, but all encrypted
                conversations will be permanently lost.
              </p>

              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-sm, 8px)',
                    border: '1px solid rgba(248,113,113,0.3)',
                    background: 'transparent',
                    color: '#f87171',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Reset Vault
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button
                    onClick={() => { onReset(); setConfirmReset(false); }}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 'var(--radius-sm, 8px)',
                      border: 'none',
                      background: '#f87171',
                      color: '#0a0a0f',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Confirm Destroy
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 'var(--radius-sm, 8px)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
                      background: 'transparent',
                      color: 'var(--text-muted, rgba(255,255,255,0.35))',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {!locked && (
                <button
                  onClick={() => { setShowReset(false); setConfirmReset(false); }}
                  style={{
                    display: 'block',
                    margin: '12px auto 0',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted, rgba(255,255,255,0.35))',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Go back
                </button>
              )}
            </div>
          )}
        </div>

        {/* Arcus branding */}
        <div
          style={{
            marginTop: 32,
            fontSize: 12,
            color: 'var(--text-faint, rgba(255,255,255,0.2))',
            letterSpacing: '0.04em',
          }}
        >
          Arcus Encrypted Vault
        </div>
      </div>

      <style>{`
        @keyframes vaultFadeIn {
          0% { opacity: 0; transform: translateY(16px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes vaultShake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        @keyframes vaultSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
