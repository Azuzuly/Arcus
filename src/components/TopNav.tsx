'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { brandLogoUrl } from '@/lib/providerLogos';

const TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'research', label: 'Research' },
  { id: 'studio', label: 'Studio' },
  { id: 'agents', label: 'Agents' },
] as const;

type Tab = typeof TABS[number]['id'];

export default function TopNav() {
  const { state, dispatch } = useStore();
  const activeTab = (state.activeTab as Tab) || 'chat';
  const user = state.user;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'relative',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        padding: '0 16px',
        background: 'rgba(8,10,16,0.78)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.25)',
        flexShrink: 0,
      }}
    >
      {/* ── LEFT: Logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
        <div style={{
          width: 28, height: 28,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 0 12px rgba(91,138,240,0.20)',
          flexShrink: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandLogoUrl} alt="Arcus" width={28} height={28} style={{ display: 'block' }} />
        </div>
        <span style={{
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: '-0.01em',
          color: 'var(--text-primary)',
        }}>Arcus</span>
      </div>

      {/* ── CENTRE: Tab switcher ── */}
      <div
        role="tablist"
        aria-label="App sections"
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(14,16,24,0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 'var(--radius-sm)',
          padding: '3px',
          gap: 2,
          boxShadow: '0 2px 12px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id })}
              style={{
                padding: '5px 18px',
                borderRadius: 'calc(var(--radius-sm) - 3px)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#0a0a0f' : 'var(--text-secondary)',
                background: isActive ? 'rgba(255,255,255,0.94)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 160ms var(--ease-out)',
                boxShadow: isActive ? '0 1px 6px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.60)' : 'none',
                fontFamily: 'inherit',
                letterSpacing: isActive ? '-0.01em' : '0',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── RIGHT: User menu ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 120, justifyContent: 'flex-end' }}>
        {user ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              aria-label="User menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 10px 5px 5px',
                background: menuOpen ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${menuOpen ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                transition: 'all 160ms var(--ease-out)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (!menuOpen) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
                }
              }}
              onMouseLeave={(e) => {
                if (!menuOpen) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
                }
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'linear-gradient(135deg, #5B8AF0, #9B6DFF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
                boxShadow: '0 0 10px rgba(91,138,240,0.30)',
                flexShrink: 0,
              }}>
                {(user.username || user.email || 'U').slice(0, 1).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username || user.email?.split('@')[0] || 'User'}
              </span>
              {/* Chevron */}
              <svg
                width="12" height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms var(--ease-out)', flexShrink: 0 }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 200,
                  background: 'rgba(12,14,22,0.95)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.60), 0 4px 12px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.05)',
                  overflow: 'hidden',
                  animation: 'panelIn 160ms var(--ease-out) forwards',
                  zIndex: 100,
                }}
              >
                {/* User info header */}
                <div style={{
                  padding: '14px 16px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {user.username || 'User'}
                  </div>
                  {user.email && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  )}
                </div>

                {/* Menu items */}
                {[
                  { label: 'Settings', icon: '⚙', action: 'OPEN_SETTINGS' },
                  { label: 'Keyboard shortcuts', icon: '⌨', action: 'OPEN_SHORTCUTS' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      dispatch({ type: item.action as Parameters<typeof dispatch>[0]['type'] });
                      setMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      transition: 'background 120ms ease, color 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                    }}
                  >
                    <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                {/* Sign out */}
                <button
                  onClick={() => {
                    dispatch({ type: 'SIGN_OUT' });
                    setMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    transition: 'background 120ms ease, color 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.09)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#F87171';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  }}
                >
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>&#x2192;</span>
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => dispatch({ type: 'SHOW_ONBOARDING' })}
            style={{
              padding: '7px 18px',
              background: 'linear-gradient(135deg, #5B8AF0, #3B6EE0)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 2px 12px rgba(91,138,240,0.35)',
              transition: 'all 150ms var(--ease-out)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(91,138,240,0.50)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(91,138,240,0.35)';
            }}
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
