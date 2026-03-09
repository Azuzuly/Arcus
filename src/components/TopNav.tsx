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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const syncViewport = () => setIsCompact(window.innerWidth <= 640);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const tabs: { label: string; value: TabType }[] = [
    { label: 'Home', value: 'home' },
    { label: 'Studio', value: 'studio' },
    { label: 'Agent', value: 'agent' },
  ];

  return (
    <div style={{
      position: 'fixed', top: 18, left: 18, right: 18, zIndex: 90,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, maxWidth: 'calc(100vw - 190px)', pointerEvents: 'auto', flexWrap: 'nowrap' }}>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          style={{
            width: 40, height: 40, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.14)', color: 'var(--text-primary)', cursor: 'pointer',
            backdropFilter: 'blur(24px) saturate(180%)', boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
          }}
          title="Toggle sidebar"
        >
          ☰
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
          padding: 5, boxShadow: '0 14px 36px rgba(0,0,0,0.2)', marginLeft: isCompact ? 2 : 8,
          overflowX: 'auto',
        }}>
          {tabs.map(t => (
            <button key={t.value} onClick={() => dispatch({ type: 'SET_TAB', tab: t.value })} style={{
              padding: isCompact ? '8px 12px' : '8px 16px', borderRadius: 16, fontSize: isCompact ? 12 : 13, fontWeight: 600,
              color: state.activeTab === t.value ? '#08111c' : 'rgba(255,255,255,0.74)',
              background: state.activeTab === t.value ? 'rgba(255,255,255,0.88)' : 'transparent',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: state.activeTab === t.value ? '0 8px 24px rgba(255,255,255,0.18)' : 'none',
              transition: 'all var(--dur-fast) var(--ease-out)',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={dropdownRef} style={{ position: 'relative', pointerEvents: 'auto' }}>
        <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', padding: isCompact ? '8px' : '8px 10px', borderRadius: 18,
          boxShadow: '0 14px 36px rgba(0,0,0,0.2)',
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
          {!isCompact && <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.user.username}</span>}
          {!isCompact && <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>▾</span>}
        </button>

        {dropdownOpen && (
          <div className="panel-enter" style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 8,
            background: 'rgba(18,22,30,0.92)', backdropFilter: 'blur(26px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18,
            boxShadow: '0 18px 44px rgba(0,0,0,0.26)', padding: 6, minWidth: 190, zIndex: 200,
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
                borderRadius: 12, color: 'var(--text-primary)', fontSize: 14,
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
    </div>
  );
}
