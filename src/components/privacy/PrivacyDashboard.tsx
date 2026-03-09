/**
 * PrivacyDashboard — Bento Grid Privacy Control Panel
 *
 * Rocket.new-inspired bento layout with glass cards showing privacy
 * feature status, encryption details, data stats, and quick controls.
 * Opens as a slide-over panel from the sidebar or shield badge.
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ShieldLevel } from './PrivacyShield';

interface PrivacyStats {
  encryptedConversations: number;
  totalConversations: number;
  encryptedMessages: number;
  vaultSizeBytes: number;
  lastSyncAt: number | null;
  syncEncrypted: boolean;
  anonymizedRequests: number;
  piiRedactions: number;
}

interface PrivacyDashboardProps {
  open: boolean;
  onClose: () => void;
  level: ShieldLevel;
  stats: PrivacyStats;
  encryptionActive: boolean;
  anonymizationActive: boolean;
  onToggleAnonymization: () => void;
  onTogglePiiRedaction: () => void;
  onExportVault: () => void;
  onDestroyVault: () => void;
  onChangePassphrase: () => void;
  piiRedactionActive: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatTime(ts: number | null): string {
  if (!ts) return 'Never';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function Toggle({ active, onToggle, disabled }: { active: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        padding: 2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255,255,255,0.08)',
        transition: 'background 200ms ease',
        display: 'flex',
        alignItems: 'center',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: active ? '#4ade80' : 'rgba(255,255,255,0.25)',
          boxShadow: active ? '0 0 8px rgba(74,222,128,0.4)' : 'none',
          transform: active ? 'translateX(20px)' : 'translateX(0)',
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </button>
  );
}

export default function PrivacyDashboard({
  open,
  onClose,
  level,
  stats,
  encryptionActive,
  anonymizationActive,
  onToggleAnonymization,
  onTogglePiiRedaction,
  onExportVault,
  onDestroyVault,
  onChangePassphrase,
  piiRedactionActive,
}: PrivacyDashboardProps) {
  const [confirmDestroy, setConfirmDestroy] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  useEffect(() => {
    if (open) setClosing(false);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  if (!open && !closing) return null;

  const encPercent = stats.totalConversations > 0
    ? Math.round((stats.encryptedConversations / stats.totalConversations) * 100)
    : 0;

  // ── Styles ──
  const cardBase: React.CSSProperties = {
    padding: 20,
    borderRadius: 'var(--radius-md, 12px)',
    border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
    background: 'var(--glass-panel, rgba(255,255,255,0.04))',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted, rgba(255,255,255,0.35))',
    marginBottom: 8,
  };

  const statNum: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary, #fff)',
    letterSpacing: '-0.02em',
    lineHeight: 1,
  };

  const statSub: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text-muted, rgba(255,255,255,0.35))',
    marginTop: 4,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(5,5,8,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          opacity: closing ? 0 : 1,
          transition: 'opacity 250ms ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          width: '100%',
          maxWidth: 520,
          background: 'var(--bg-base, #0f1015)',
          borderLeft: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.5)',
          overflowY: 'auto',
          transform: closing ? 'translateX(100%)' : 'translateX(0)',
          animation: closing ? 'none' : 'panelSlideIn 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          transition: closing ? 'transform 250ms cubic-bezier(0.4, 0, 1, 1)' : 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 24px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary, #fff)', margin: 0, letterSpacing: '-0.01em' }}>
              Privacy Dashboard
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted, rgba(255,255,255,0.35))', margin: '4px 0 0' }}>
              Manage your encryption and anonymization settings
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm, 8px)',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
              background: 'transparent',
              color: 'var(--text-muted, rgba(255,255,255,0.35))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--glass-hover, rgba(255,255,255,0.08))';
              e.currentTarget.style.color = 'var(--text-primary, #fff)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted, rgba(255,255,255,0.35))';
            }}
          >
            x
          </button>
        </div>

        <div style={{ padding: '0 24px 32px' }}>
          {/* ── Bento Grid: Stats ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {/* Encrypted conversations */}
            <div
              style={{
                ...cardBase,
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={labelStyle}>Encryption Coverage</div>
                <div style={statNum}>{encPercent}%</div>
                <div style={statSub}>
                  {stats.encryptedConversations} of {stats.totalConversations} conversations encrypted
                </div>
              </div>
              {/* Circular progress ring */}
              <svg width={56} height={56} viewBox="0 0 56 56">
                <circle cx={28} cy={28} r={24} fill="none" stroke="var(--glass-border, rgba(255,255,255,0.06))" strokeWidth={4} />
                <circle
                  cx={28}
                  cy={28}
                  r={24}
                  fill="none"
                  stroke={encPercent === 100 ? '#4ade80' : 'var(--accent-primary, #6366f1)'}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray={`${(encPercent / 100) * 150.8} 150.8`}
                  transform="rotate(-90 28 28)"
                  style={{
                    transition: 'stroke-dasharray 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                    filter: encPercent === 100 ? 'drop-shadow(0 0 6px rgba(74,222,128,0.4))' : 'none',
                  }}
                />
              </svg>
            </div>

            {/* Messages encrypted */}
            <div style={cardBase}>
              <div style={labelStyle}>Messages</div>
              <div style={statNum}>{stats.encryptedMessages.toLocaleString()}</div>
              <div style={statSub}>encrypted messages</div>
            </div>

            {/* Vault size */}
            <div style={cardBase}>
              <div style={labelStyle}>Vault Size</div>
              <div style={statNum}>{formatBytes(stats.vaultSizeBytes)}</div>
              <div style={statSub}>on-device storage</div>
            </div>

            {/* Anonymized requests */}
            <div style={cardBase}>
              <div style={labelStyle}>Anonymized</div>
              <div style={statNum}>{stats.anonymizedRequests.toLocaleString()}</div>
              <div style={statSub}>requests stripped</div>
            </div>

            {/* PII redactions */}
            <div style={cardBase}>
              <div style={labelStyle}>PII Blocked</div>
              <div style={{ ...statNum, color: stats.piiRedactions > 0 ? '#fbbf24' : 'var(--text-primary, #fff)' }}>
                {stats.piiRedactions.toLocaleString()}
              </div>
              <div style={statSub}>patterns redacted</div>
            </div>
          </div>

          {/* ── Feature Toggles ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ ...labelStyle, marginBottom: 16 }}>Privacy Features</div>

            {/* Encryption status (non-toggleable — use setup wizard) */}
            <div
              style={{
                ...cardBase,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm, 8px)',
                    background: encryptionActive ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.08)',
                    border: `1px solid ${encryptionActive ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.15)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={encryptionActive ? '#4ade80' : '#f87171'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
                    <path d={encryptionActive ? 'M7 11V7a5 5 0 0110 0v4' : 'M7 11V7a5 5 0 019.9-1'} />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary, #fff)' }}>
                    Local Encryption
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted, rgba(255,255,255,0.35))' }}>
                    AES-256-GCM with PBKDF2 key derivation
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: encryptionActive ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.08)',
                  color: encryptionActive ? '#4ade80' : '#f87171',
                  border: `1px solid ${encryptionActive ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.15)'}`,
                }}
              >
                {encryptionActive ? 'Active' : 'Off'}
              </div>
            </div>

            {/* Request anonymization toggle */}
            <div
              style={{
                ...cardBase,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm, 8px)',
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary, #6366f1)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="18" y1="8" x2="23" y2="13" />
                    <line x1="23" y1="8" x2="18" y2="13" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary, #fff)' }}>
                    Request Anonymization
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted, rgba(255,255,255,0.35))' }}>
                    Strip identity from AI requests
                  </div>
                </div>
              </div>
              <Toggle active={anonymizationActive} onToggle={onToggleAnonymization} />
            </div>

            {/* PII auto-redaction toggle */}
            <div
              style={{
                ...cardBase,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm, 8px)',
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary, #fff)' }}>
                    PII Auto-Redaction
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted, rgba(255,255,255,0.35))' }}>
                    Strip emails, phones, SSNs from prompts
                  </div>
                </div>
              </div>
              <Toggle active={piiRedactionActive} onToggle={onTogglePiiRedaction} />
            </div>

            {/* Sync status */}
            <div
              style={{
                ...cardBase,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm, 8px)',
                    background: 'rgba(56,189,248,0.08)',
                    border: '1px solid rgba(56,189,248,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal, #38bdf8)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary, #fff)' }}>
                    E2E Encrypted Sync
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted, rgba(255,255,255,0.35))' }}>
                    Last synced: {formatTime(stats.lastSyncAt)}
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: stats.syncEncrypted ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.04)',
                  color: stats.syncEncrypted ? '#38bdf8' : 'var(--text-muted, rgba(255,255,255,0.35))',
                  border: `1px solid ${stats.syncEncrypted ? 'rgba(56,189,248,0.2)' : 'var(--glass-border, rgba(255,255,255,0.06))'}`,
                }}
              >
                {stats.syncEncrypted ? 'Encrypted' : 'Plaintext'}
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ActionButton
                label="Export Encrypted Backup"
                sublabel="Download your vault as an encrypted file"
                icon="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                color="var(--accent-primary, #6366f1)"
                onClick={onExportVault}
              />
              <ActionButton
                label="Change Passphrase"
                sublabel="Derive a new key and re-encrypt all data"
                icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                color="var(--accent-secondary, #818cf8)"
                onClick={onChangePassphrase}
                disabled={!encryptionActive}
              />
            </div>
          </div>

          {/* ── Danger zone ── */}
          <div>
            <div style={{ ...labelStyle, color: '#f87171', marginBottom: 12 }}>Danger Zone</div>
            <div
              style={{
                ...cardBase,
                border: '1px solid rgba(248,113,113,0.15)',
                background: 'rgba(248,113,113,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#f87171' }}>Destroy Vault</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted, rgba(255,255,255,0.35))', marginTop: 2 }}>
                    Permanently delete all encrypted data and keys
                  </div>
                </div>
                {!confirmDestroy ? (
                  <button
                    onClick={() => setConfirmDestroy(true)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm, 8px)',
                      border: '1px solid rgba(248,113,113,0.3)',
                      background: 'transparent',
                      color: '#f87171',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(248,113,113,0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Destroy
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { onDestroyVault(); setConfirmDestroy(false); }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-sm, 8px)',
                        border: 'none',
                        background: '#f87171',
                        color: '#0a0a0f',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDestroy(false)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-sm, 8px)',
                        border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
                        background: 'transparent',
                        color: 'var(--text-muted, rgba(255,255,255,0.35))',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes panelSlideIn {
          0% { transform: translateX(100%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ── Sub-component: Action Button ──
function ActionButton({
  label,
  sublabel,
  icon,
  color,
  onClick,
  disabled,
}: {
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '14px 16px',
        borderRadius: 'var(--radius-sm, 8px)',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
        background: 'var(--glass-panel, rgba(255,255,255,0.04))',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        fontFamily: 'inherit',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--glass-border-hover, rgba(255,255,255,0.16))';
          e.currentTarget.style.background = 'var(--glass-hover, rgba(255,255,255,0.08))';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--glass-border, rgba(255,255,255,0.06))';
        e.currentTarget.style.background = 'var(--glass-panel, rgba(255,255,255,0.04))';
      }}
    >
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary, #fff)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted, rgba(255,255,255,0.35))', marginTop: 2 }}>{sublabel}</div>
      </div>
    </button>
  );
}
