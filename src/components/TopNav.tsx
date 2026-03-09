/* eslint-disable @next/next/no-img-element */
'use client';

import { useStore } from '@/lib/store';
import { useState, useRef, useEffect } from 'react';
import { TabType } from '@/lib/types';
import { insforge } from '@/lib/insforge';

export default function TopNav() {
  const { state, dispatch } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const syncViewport = () => setIsCompact(window.innerWidth <= 860);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    const el = document.querySelector('[data-main-scroll]');
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const tabs: { label: string; value: TabType }[] = [
    { label: 'Home', value: 'home' },
    { label: 'Studio', value: 'studio' },
    { label: 'Agent', value: 'agent' },
  ];

  return (
    <nav style={{
      flexShrink: 0,
      height: 64,
      width: '100%',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: scrolled ? 'rgba(6,7,14,0.92)' : 'rgba(6,7,14,0.72)',
      backdropFilter: 'blur(32px) saturate(180%)',
      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isCompact ? '0 14px' : '0 24px',
      transition: 'background 300ms ease, border-color 300ms ease',
      boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)' : 'none',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? 8 : 10, minWidth: 0 }}>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            transition: 'all 120ms cubic-bezier(0.16,1,0.3,1)',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          title="Toggle sidebar"
        >
          ☰
        </button>

        {/* Diamond logo glyph */}
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          background: 'linear-gradient(135deg, rgba(91,138,240,0.22) 0%, rgba(155,109,255,0.18) 100%)',
          border: '1px solid rgba(91,138,240,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 12px rgba(91,138,240,0.2)',
        }}>
          <span style={{ fontSize: 14, lineHeight: 1, color: '#fff', fontWeight: 700 }}>◆</span>
        </div>

        {!isCompact && (
          <span style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #fff 0%, rgba(180,200,255,0.9) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Arcus
          </span>
        )}
      </div>

      {/* Tab Control */}
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(14,16,24,0.82)',
        backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 4,
        gap: 2,
        maxWidth: isCompact ? '42vw' : undefined,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}>
        {tabs.map(t => (
          <button
            key={t.value}
            onClick={() => dispatch({ type: 'SET_TAB', tab: t.value })}
            style={{
              padding: isCompact ? '6px 12px' : '6px 20px',
              borderRadius: 8,
              fontSize: isCompact ? 12 : 14,
              fontWeight: 500,
              color: state.activeTab === t.value ? '#0A0A0A' : 'var(--text-secondary)',
              background: state.activeTab === t.value ? '#FFFFFF' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              boxShadow: state.activeTab === t.value ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 150ms cubic-bezier(0.16,1,0.3,1)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (state.activeTab !== t.value) e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { if (state.activeTab !== t.value) e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* User Button */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 10,
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {state.settings?.profileImage ? (
            <img src={state.settings.profileImage} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: state.user.avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              {state.user.avatar}
            </div>
          )}
          {!isCompact && (
            <span style={{
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 500,
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {state.user.username}
            </span>
          )}
          {!isCompact && (
            <span style={{ color: 'var(--text-muted)', fontSize: 11, transition: 'transform 200ms ease', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
          )}
        </button>

        {dropdownOpen && (
          <div
            className="panel-enter"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              background: 'rgba(10,12,20,0.92)',
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
              padding: 6,
              minWidth: 190,
              zIndex: 200,
            }}
          >
            {[
              { icon: '⚙', label: 'Settings', action: () => { dispatch({ type: 'SHOW_MODAL', modal: 'settings' }); setDropdownOpen(false); } },
              { icon: '⬆', label: 'Upgrade', action: () => { dispatch({ type: 'SHOW_MODAL', modal: 'pricing' }); setDropdownOpen(false); } },
              { icon: '✉', label: 'Feedback', action: () => { window.open('mailto:feedback@arcus.ai'); setDropdownOpen(false); } },
              { icon: '⏻', label: 'Sign Out', action: async () => { await insforge.auth.signOut(); dispatch({ type: 'SIGN_OUT' }); window.location.reload(); } },
            ].map((item, idx) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 9,
                  color: item.label === 'Sign Out' ? '#FCA5A5' : 'var(--text-primary)',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  transition: 'background 120ms ease',
                  marginTop: idx === 3 ? 2 : 0,
                  borderTop: idx === 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  paddingTop: idx === 3 ? 11 : 9,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
