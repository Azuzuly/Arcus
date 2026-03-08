'use client';

import { useStore } from '@/lib/store';
import { useState, useRef, useEffect } from 'react';
import { TabType } from '@/lib/types';

export default function TopNav() {
  const { state, dispatch } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const tabs: { label: string; value: TabType }[] = [
    { label: 'Home', value: 'home' },
    { label: 'Studio', value: 'studio' },
  ];

  return (
    <nav style={{
      flexShrink: 0, height: 64, width: '100%', position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(8,8,10,0.75)', backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 32px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(59,130,246,0.4)',
          fontSize: 14, fontWeight: 700, color: '#fff',
        }}>◆</div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: '-0.03em' }}>Arcus</span>
      </div>

      {/* Tab Control — liquid glass pill */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(30px) saturate(160%)',
        WebkitBackdropFilter: 'blur(30px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--radius-pill)',
        padding: 4, gap: 2,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.3)',
      }}>
        {tabs.map(t => (
          <button key={t.value} onClick={() => dispatch({ type: 'SET_TAB', tab: t.value })} style={{
            padding: '6px 22px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 500,
            color: state.activeTab === t.value ? '#0A0A0A' : 'rgba(255,255,255,0.55)',
            background: state.activeTab === t.value
              ? 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(240,240,240,0.97) 100%)'
              : 'transparent',
            border: 'none', cursor: 'pointer',
            boxShadow: state.activeTab === t.value
              ? '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.9)'
              : 'none',
            transition: 'all var(--dur-base) var(--ease-out)',
            fontFamily: 'inherit', letterSpacing: '-0.01em',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* User Button */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 'var(--radius-pill)',
          cursor: 'pointer', padding: '4px 12px 4px 6px',
          transition: 'all var(--dur-fast) var(--ease-out)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}>
          {state.settings?.profileImage ? (
            <img src={state.settings.profileImage} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: state.user.avatarColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}>
              {state.user.avatar}
            </div>
          )}
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>{state.user.username}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
            <path d="M2 3.5L5 6.5L8 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {dropdownOpen && (
          <div className="panel-enter" style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: 'rgba(18,18,22,0.85)', backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            padding: 6, minWidth: 190, zIndex: 200,
          }}>
            {/* User header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px 10px', marginBottom: 2,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {state.settings?.profileImage ? (
                <img src={state.settings.profileImage} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', background: state.user.avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                }}>{state.user.avatar}</div>
              )}
              <div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{state.user.username}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{state.user.tier === 'pro' ? '✦ Pro' : 'Free plan'}</div>
              </div>
            </div>
            <div style={{ paddingTop: 4 }}>
              {[
                { icon: '⚙', label: 'Settings', action: () => { dispatch({ type: 'SHOW_MODAL', modal: 'settings' }); setDropdownOpen(false); } },
                { icon: '⬆', label: 'Upgrade to Pro', action: () => { dispatch({ type: 'SHOW_MODAL', modal: 'pricing' }); setDropdownOpen(false); } },
                { icon: '✉', label: 'Send Feedback', action: () => { window.open('mailto:feedback@arcus.ai'); setDropdownOpen(false); } },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderRadius: 'var(--radius-xs)', color: 'rgba(255,255,255,0.8)', fontSize: 13,
                  fontFamily: 'inherit', transition: 'background var(--dur-fast) var(--ease-out)',
                }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                   onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ opacity: 0.6, fontSize: 15 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4, paddingTop: 4 }}>
                <button onClick={() => { dispatch({ type: 'SIGN_OUT' }); window.location.reload(); }} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderRadius: 'var(--radius-xs)', color: 'rgba(239,68,68,0.8)', fontSize: 13,
                  fontFamily: 'inherit', transition: 'background var(--dur-fast) var(--ease-out)',
                }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                   onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ opacity: 0.7, fontSize: 15 }}>⏻</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
