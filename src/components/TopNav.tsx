'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';

const TABS = [
  { id: 'home', label: 'Home', icon: '⌂', description: 'Fast chat workspace' },
  { id: 'research', label: 'Research', icon: '⌕', description: 'Cited deep-dive answers' },
  { id: 'studio', label: 'Studio', icon: '✦', description: 'Image generation and remix' },
  { id: 'agents', label: 'Agents', icon: '◎', description: 'Automation workflows' },
] as const;

type Tab = typeof TABS[number]['id'];

export default function TopNav() {
  const { state, dispatch } = useStore();
  const activeTab = state.activeTab === 'chat'
    ? 'home'
    : state.activeTab === 'agent'
      ? 'agents'
      : (state.activeTab as Tab) || 'home';
  const user = state.user;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const chatWorkspaceActive = activeTab === 'home' || activeTab === 'research';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className={`liquid-nav ${scrolled ? 'liquid-nav--scrolled' : ''}`}
      style={{
        position: 'relative',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        padding: '0 16px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 176 }}>
        {chatWorkspaceActive && (
          <button
            type="button"
            aria-label={state.ui.sidebarCollapsed ? 'Open saved chats' : 'Hide saved chats'}
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              flexShrink: 0,
            }}
            title={state.ui.sidebarCollapsed ? 'Open saved chats' : 'Hide saved chats'}
          >
            ☰
          </button>
        )}

        <div style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          background: 'linear-gradient(135deg,rgba(91,138,240,0.22),rgba(155,109,255,0.18))',
          border: '1px solid rgba(91,138,240,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(91,138,240,0.2)',
          flexShrink: 0,
          position: 'relative',
        }}>
          <span style={{ fontSize: 14, lineHeight: 1, color: '#fff', fontWeight: 700 }}>◆</span>
          <span className="alive-dot" style={{ position: 'absolute', bottom: -2, right: -2, width: 5, height: 5 }} />
        </div>

        <div>
          <span style={{
            display: 'block',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '-0.01em',
            background: 'linear-gradient(90deg, var(--text-primary) 0%, var(--accent-blue) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Arcus</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {activeTab === 'research'
              ? 'Cited deep-dive answers'
              : activeTab === 'home'
                ? 'Fast chat workspace'
                : TABS.find(tab => tab.id === activeTab)?.description}
          </span>
        </div>
      </div>

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
            onClick={() => {
              dispatch({ type: 'SET_TAB', tab: tab.id });
            }}
            title={tab.description}
            className={`liquid-tab ${activeTab === tab.id ? 'liquid-tab--active' : ''}`}
          >
            <span style={{ fontSize: 12, opacity: activeTab === tab.id ? 1 : 0.74 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

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
            {user?.avatar ? (
              <img src={user.avatar} alt="" width={26} height={26} style={{ display: 'block' }} />
            ) : (
              <span>{user?.email?.[0]?.toUpperCase() ?? user?.username?.[0]?.toUpperCase() ?? '?'}</span>
            )}
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.username ?? user?.email ?? 'Account'}
          </span>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--text-muted)', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease', flexShrink: 0 }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {menuOpen && (
          <div className="liquid-glass-elevated" style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 16,
            minWidth: 200,
            borderRadius: 'var(--radius-md)',
            padding: '6px',
            zIndex: 100,
            animation: 'fadeIn 140ms ease',
          }}>
            <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.username ?? 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>

            {[{ label: 'Settings', modal: 'settings' as const }, { label: 'Billing', modal: 'pricing' as const }].map(item => (
              <button
                key={item.label}
                onClick={() => { dispatch({ type: 'SHOW_MODAL', modal: item.modal }); setMenuOpen(false); }}
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
