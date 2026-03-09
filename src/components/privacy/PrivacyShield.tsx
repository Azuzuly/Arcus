/**
 * PrivacyShield — Real-time Privacy Status Indicator
 *
 * Rocket.new-inspired floating status badge that shows the current
 * privacy protection level. Sits in the chat header area.
 *
 * States: locked (full encryption), partial (some features active), unlocked (no protection)
 * Animated shield icon with pulse glow when fully protected.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

export type ShieldLevel = 'locked' | 'partial' | 'unlocked';

interface PrivacyShieldProps {
  level: ShieldLevel;
  encryptionActive: boolean;
  anonymizationActive: boolean;
  syncEncrypted: boolean;
  onClick?: () => void;
}

const SHIELD_CONFIG: Record<ShieldLevel, {
  label: string;
  color: string;
  glow: string;
  bg: string;
  border: string;
  icon: string;
}> = {
  locked: {
    label: 'Fully Protected',
    color: '#4ade80',
    glow: 'rgba(74, 222, 128, 0.25)',
    bg: 'rgba(74, 222, 128, 0.08)',
    border: 'rgba(74, 222, 128, 0.2)',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  },
  partial: {
    label: 'Partially Protected',
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.2)',
    bg: 'rgba(251, 191, 36, 0.06)',
    border: 'rgba(251, 191, 36, 0.15)',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  },
  unlocked: {
    label: 'Not Protected',
    color: '#f87171',
    glow: 'rgba(248, 113, 113, 0.2)',
    bg: 'rgba(248, 113, 113, 0.06)',
    border: 'rgba(248, 113, 113, 0.15)',
    icon: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 01.67-.94l7-2.8a1 1 0 01.66 0l7 2.8A1 1 0 0120 6v7z',
  },
};

export default function PrivacyShield({
  level,
  encryptionActive,
  anonymizationActive,
  syncEncrypted,
  onClick,
}: PrivacyShieldProps) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const config = SHIELD_CONFIG[level];

  // Pulse animation on level change
  useEffect(() => {
    setPulseKey(k => k + 1);
  }, [level]);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setShowTooltip(false);
  }, []);

  const features = [
    { label: 'Local Encryption', active: encryptionActive },
    { label: 'Request Anonymization', active: anonymizationActive },
    { label: 'Encrypted Sync', active: syncEncrypted },
  ];

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Main shield badge */}
      <button
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px 6px 10px',
          borderRadius: 'var(--radius-md, 12px)',
          border: `1px solid ${hovered ? config.color : config.border}`,
          background: hovered
            ? `linear-gradient(135deg, ${config.bg}, rgba(255,255,255,0.04))`
            : config.bg,
          cursor: 'pointer',
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: hovered
            ? `0 0 20px ${config.glow}, 0 0 60px ${config.glow.replace('0.25', '0.08').replace('0.2', '0.06')}`
            : `0 0 12px ${config.glow.replace('0.25', '0.1').replace('0.2', '0.06')}`,
          outline: 'none',
          fontFamily: 'inherit',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {/* Shield icon with pulse */}
        <div
          key={pulseKey}
          style={{
            position: 'relative',
            width: 18,
            height: 18,
            animation: 'shieldPulse 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke={config.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={config.icon} />
            {level === 'locked' && (
              <path d="M9 12l2 2 4-4" stroke={config.color} strokeWidth={2} />
            )}
            {level === 'partial' && (
              <path d="M12 9v4M12 17h.01" stroke={config.color} strokeWidth={2} />
            )}
            {level === 'unlocked' && (
              <path d="M9.5 14.5l5-5M9.5 9.5l5 5" stroke={config.color} strokeWidth={2} />
            )}
          </svg>
          {/* Ambient glow behind icon */}
          {level === 'locked' && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Label */}
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: config.color,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          {config.label}
        </span>
      </button>

      {/* Tooltip / Expanded detail */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 1000,
            minWidth: 240,
            padding: 16,
            borderRadius: 'var(--radius-md, 12px)',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
            background: 'var(--bg-elevated, #1e1f2a)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.1)',
            animation: 'tooltipFadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              color: 'var(--text-muted, rgba(255,255,255,0.35))',
              marginBottom: 12,
            }}
          >
            Privacy Status
          </div>

          {features.map((feat, i) => (
            <div
              key={feat.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderTop: i > 0 ? '1px solid var(--glass-border, rgba(255,255,255,0.06))' : 'none',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary, rgba(255,255,255,0.55))',
                }}
              >
                {feat.label}
              </span>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: feat.active ? '#4ade80' : 'rgba(255,255,255,0.15)',
                  boxShadow: feat.active ? '0 0 8px rgba(74,222,128,0.4)' : 'none',
                  transition: 'all 200ms ease',
                }}
              />
            </div>
          ))}

          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm, 8px)',
              background: config.bg,
              border: `1px solid ${config.border}`,
              fontSize: 11,
              color: config.color,
              lineHeight: 1.5,
            }}
          >
            {level === 'locked' && 'All privacy features active. Your data never leaves your device unencrypted.'}
            {level === 'partial' && 'Some privacy features are disabled. Enable all for maximum protection.'}
            {level === 'unlocked' && 'Privacy protection is off. Your data may be visible to service providers.'}
          </div>
        </div>
      )}

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes shieldPulse {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tooltipFadeIn {
          0% { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
