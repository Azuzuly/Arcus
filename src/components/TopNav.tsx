'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';

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
  const [scrolled, setScrolled] = useState(false);

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

  // Scroll-aware nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        background: scrolled ? 'rgba(6,7,14,0.92)' : 'rgba(8,10,16,0.78)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.25)',
        flexShrink: 0,
        transition: 'background 200ms ease, border-color 200ms ease',
      }}
    >
      {/* ── LEFT: Logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
        <div style={{
          width: 28, height: 28,
          borderRadius: 9,
          background: 'linear-gradient(135deg,rgba(91,138,240,0.22),rgba(155,109,255,0.18))',
          border: '1px solid rgba(91,138,240,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(91,138,240,0.2)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, lineHeight: 1, color: '#fff', fontWeight: 700 }}>◆</span>
        </div>
        <span style={{
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: '-0.01em',
          background: 'linear-gradient(90deg, var(--text-primary) 0%, var(--accent-blue) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
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
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => dispatch({ type: 'SET_TAB', tab: tab.id })}
            style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: activeTab === tab.id
                ? 'rgba(91,138,240,0.18)'
                : 'transparent',
              color: activeTab === tab.id
                ? 'var(--text-primary)'
                : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === tab.id
                ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 6px rgba(91,138,240,0.15)'
                : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── RIGHT: User menu ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120, justifyContent: 'flex-end' }} ref={menuRef}>
        <button
          aria-label="Open user menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 8px',
            background: menuOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: '1px solid',
            borderColor: menuOpen ? 'rgba(255,255,255,0.12)' : 'transparent',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            if (!menuOpen) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
            }
          }}
          onMouseLeave={e => {
            if (!menuOpen) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 26, height: 26,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(91,138,240,0.4), rgba(155,109,255,0.3))',
            border: '1px solid rgba(91,138,240,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--text-primary)',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="" width={26} height={26} style={{ display: 'block' }} />
            ) : (
              <span>{user?.email?.[0]?.toUpperCase() ?? user?.name?.[0]?.toUpperCase() ?? '?'}</span>
            )}
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name ?? user?.email ?? 'Account'}
          </span>
          {/* Chevron */}
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--text-muted)', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease', flexShrink: 0 }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 16,
            minWidth: 200,
            background: 'rgba(14,16,26,0.94)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            padding: '6px',
            zIndex: 100,
            animation: 'fadeIn 140ms ease',
          }}>
            {/* User info header */}
            <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name ?? 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>

            {[{ label: 'Settings', action: 'OPEN_SETTINGS' }, { label: 'Billing', action: 'OPEN_BILLING' }].map(item => (
              <button
                key={item.label}
                onClick={() => { dispatch({ type: item.action as never }); setMenuOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 'var(--radius-xs)',
                  background: 'transparent', border: 'none',
                  color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 120ms ease', textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                {item.label}
              </button>
            ))}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4, paddingTop: 4 }}>
              <button
                onClick={() => { dispatch({ type: 'SIGN_OUT' }); setMenuOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 'var(--radius-xs)',
                  background: 'transparent', border: 'none',
                  color: 'var(--accent-red, #F87171)', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 120ms ease', textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
