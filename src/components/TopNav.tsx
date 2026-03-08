'use client';

import { useStore } from '@/lib/store';
import { useState, useRef, useEffect } from 'react';
import { TabType } from '@/lib/types';
import { insforge } from '@/lib/insforge';
import { brandLogoUrl } from '@/lib/providerLogos';

export default function TopNav() {
  const { state, dispatch } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
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

  const tabs: { label: string; value: TabType }[] = [
    { label: 'Home', value: 'home' },
    { label: 'Studio', value: 'studio' },
  ];

  return (
    <nav style={{
      flexShrink: 0, height: 64, width: '100%', position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isCompact ? '0 14px' : '0 24px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? 8 : 10, minWidth: 0 }}>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          style={{
            width: 34, height: 34, borderRadius: 12, border: '1px solid var(--glass-border)',
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
          }}
          title="Toggle sidebar"
        >
          ☰
        </button>
        <img src={brandLogoUrl} alt="Arcus" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        {!isCompact && <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>Arcus</span>}
      </div>

      {/* Tab Control */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center',
        background: 'var(--glass-panel)', backdropFilter: 'blur(22px)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)',
        padding: 4, gap: 2, maxWidth: isCompact ? '42vw' : undefined,
      }}>
        {tabs.map(t => (
          <button key={t.value} onClick={() => dispatch({ type: 'SET_TAB', tab: t.value })} style={{
            padding: isCompact ? '6px 12px' : '6px 20px', borderRadius: 'var(--radius-xs)', fontSize: isCompact ? 12 : 14, fontWeight: 500,
            color: state.activeTab === t.value ? '#0A0A0A' : 'var(--text-secondary)',
            background: state.activeTab === t.value ? '#FFFFFF' : 'transparent',
            border: 'none', cursor: 'pointer',
            boxShadow: state.activeTab === t.value ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
            transition: 'all var(--dur-fast) var(--ease-out)',
            fontFamily: 'inherit',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* User Button */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'transparent',
          border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-xs)',
        }}>
          {state.settings?.profileImage ? (
            <img src={state.settings.profileImage} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: state.user.avatarColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: '#fff',
            }}>
              {state.user.avatar}
            </div>
          )}
          {!isCompact && <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.user.username}</span>}
          {!isCompact && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>▾</span>}
        </button>

        {dropdownOpen && (
          <div className="panel-enter" style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 8,
            background: 'var(--glass-panel)', backdropFilter: 'blur(22px) saturate(160%)',
            border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-card)', padding: 4, minWidth: 180, zIndex: 200,
          }}>
            {[
              { icon: '⚙', label: 'Settings', action: () => { dispatch({ type: 'SHOW_MODAL', modal: 'settings' }); setDropdownOpen(false); } },
              { icon: '⬆', label: 'Upgrade', action: () => { dispatch({ type: 'SHOW_MODAL', modal: 'pricing' }); setDropdownOpen(false); } },
              { icon: '✉', label: 'Feedback', action: () => { window.open('mailto:feedback@arcus.ai'); setDropdownOpen(false); } },
              { icon: '⏻', label: 'Sign Out', action: async () => { await insforge.auth.signOut(); dispatch({ type: 'SIGN_OUT' }); window.location.reload(); } },
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderRadius: 'var(--radius-xs)', color: 'var(--text-primary)', fontSize: 14,
                fontFamily: 'inherit', transition: 'background var(--dur-fast) var(--ease-out)',
              }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-hover)')}
                 onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
