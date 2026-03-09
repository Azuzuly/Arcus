'use client';

import { useStore } from '@/lib/store';
import { relativeTime, truncate } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const { state, dispatch, createNewChat, showToast } = useStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth <= 960);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const sortedConvos = [...state.conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  const pinnedConvos = sortedConvos.filter(conv => conv.pinned);
  const regularConvos = sortedConvos.filter(conv => !conv.pinned);

  // Free tier: no plan field or plan === 'free'
  const isFree = !state.user?.plan || state.user?.plan === 'free';

  const togglePin = (chatId: string, isPinned: boolean) => {
    if (!isPinned && pinnedConvos.length >= 5) {
      showToast('You can pin up to 5 chats for now.', 'warning');
      return;
    }
    dispatch({ type: 'TOGGLE_PIN_CONVERSATION', id: chatId });
  };

  const renderConversation = (conv: typeof sortedConvos[number]) => {
    const isActive = state.activeChatId === conv.id;
    return (
      <div
        key={conv.id}
        onClick={() => {
          dispatch({ type: 'SET_ACTIVE_CHAT', id: conv.id });
          if (isMobile) dispatch({ type: 'SET_UI', ui: { sidebarCollapsed: true } });
        }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          position: 'relative',
          transition: 'background 150ms ease, border-left-color 150ms ease, box-shadow 150ms ease',
          background: isActive
            ? 'rgba(91,138,240,0.12)'
            : conv.pinned ? 'rgba(255,255,255,0.04)' : 'transparent',
          borderLeft: isActive
            ? '2px solid rgba(91,138,240,0.6)'
            : '2px solid transparent',
          border: isActive ? 'none' : conv.pinned ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
          boxShadow: isActive
            ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(91,138,240,0.08)'
            : conv.pinned ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'none',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderLeft = '2px solid transparent';
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.background = conv.pinned ? 'rgba(255,255,255,0.04)' : 'transparent';
            e.currentTarget.style.borderLeft = '2px solid transparent';
          }
        }}
      >
        {isActive && (
          <div style={{
            position: 'absolute', left: 0, top: '20%', bottom: '20%',
            width: 2, borderRadius: 2,
            background: 'linear-gradient(180deg, var(--accent-blue), var(--accent-violet))',
          }} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: isActive ? 600 : 400,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.4,
          }}>
            {truncate(conv.title || 'New conversation', 32)}
          </div>
          <div style={{
            fontSize: 11, color: 'var(--text-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginTop: 1,
          }}>
            {relativeTime(conv.updatedAt)}
          </div>
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Pin button */}
          <button
            aria-label={conv.pinned ? 'Unpin' : 'Pin'}
            onClick={() => togglePin(conv.id, conv.pinned)}
            style={{
              width: 22, height: 22, borderRadius: 'var(--radius-xs)',
              background: conv.pinned ? 'rgba(91,138,240,0.15)' : 'transparent',
              border: '1px solid transparent',
              color: conv.pinned ? 'var(--accent-blue)' : 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, transition: 'all 120ms ease', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(91,138,240,0.12)'; e.currentTarget.style.borderColor = 'rgba(91,138,240,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = conv.pinned ? 'rgba(91,138,240,0.15)' : 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            📌
          </button>

          {/* Delete button */}
          <button
            aria-label="Delete conversation"
            onClick={() => dispatch({ type: 'DELETE_CONVERSATION', id: conv.id })}
            style={{
              width: 22, height: 22, borderRadius: 'var(--radius-xs)',
              background: 'transparent', border: '1px solid transparent',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, lineHeight: 1, transition: 'all 120ms ease', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.10)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.20)'; e.currentTarget.style.color = '#F87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            &#xd7;
          </button>
        </div>
      </div>
    );
  };

  if (state.ui.sidebarCollapsed) return null;

  return (
    <>
      <style>{`
        @keyframes upgradePillGlow {
          0%, 100% {
            box-shadow: 0 0 8px rgba(91,138,240,0.12), inset 0 1px 0 rgba(255,255,255,0.06);
            border-color: rgba(91,138,240,0.25);
          }
          50% {
            box-shadow: 0 0 12px rgba(91,138,240,0.22), inset 0 1px 0 rgba(255,255,255,0.08);
            border-color: rgba(91,138,240,0.45);
          }
        }
        .arcus-upgrade-pill {
          animation: upgradePillGlow 3s ease-in-out infinite;
        }
        .arcus-upgrade-pill:hover {
          animation: none !important;
          background: rgba(91,138,240,0.18) !important;
          border-color: rgba(91,138,240,0.5) !important;
          box-shadow: 0 0 18px rgba(91,138,240,0.28), inset 0 1px 0 rgba(255,255,255,0.10) !important;
          transform: translateY(-1px);
        }
        .arcus-upgrade-pill:active {
          transform: translateY(0px) scale(0.98) !important;
        }
      `}</style>

      <aside style={{
        width: state.ui.sidebarCollapsed ? 0 : 260, flexShrink: 0, height: '100%',
        background: 'rgba(15,17,24,0.86)', borderRight: '1px solid var(--glass-border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 240ms var(--ease-out)',
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 12px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          <button
            onClick={createNewChat}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(91,138,240,0.09)',
              border: '1px solid rgba(91,138,240,0.16)',
              color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 160ms var(--ease-out)', textAlign: 'left',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(91,138,240,0.16), rgba(155,109,255,0.10))';
              e.currentTarget.style.borderColor = 'rgba(91,138,240,0.30)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(91,138,240,0.18)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(91,138,240,0.09)';
              e.currentTarget.style.borderColor = 'rgba(91,138,240,0.16)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-blue)', flexShrink: 0 }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            New conversation
          </button>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 4px' }}>

          {/* Pinned */}
          {pinnedConvos.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{
                padding: '8px 12px 4px',
                fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
              }}>Pinned</div>
              {pinnedConvos.map(renderConversation)}
            </div>
          )}

          {/* All chats */}
          {regularConvos.length > 0 && (
            <div>
              {pinnedConvos.length > 0 && (
                <div style={{
                  padding: '8px 12px 4px',
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--text-muted)',
                }}>Recent</div>
              )}
              {regularConvos.map(renderConversation)}
            </div>
          )}

          {sortedConvos.length === 0 && (
            <div style={{
              padding: '32px 16px', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: 12,
            }}>
              No conversations yet
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 12px 14px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          {/* Usage bar */}
          {state.usage?.today && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Usage today</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {state.usage.today.requests}/{state.usage.today.limit} requests
                </span>
              </div>
              <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: state.usage.today.requests / state.usage.today.limit > 0.8 ? 'var(--accent-red)' : 'var(--accent-blue)',
                  width: `${Math.min(100, (state.usage.today.requests / state.usage.today.limit) * 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          )}

          {/* Upgrade pill — free tier only */}
          {isFree && (
            <button
              className="arcus-upgrade-pill"
              onClick={() => dispatch({ type: 'SHOW_MODAL', modal: 'pricing' })}
              style={{
                marginBottom: 10,
                width: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                padding: '12px 16px',
                background: 'rgba(91,138,240,0.10)',
                border: '1px solid rgba(91,138,240,0.25)',
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                transition: 'background 200ms ease, border-color 200ms ease, box-shadow 200ms ease, transform 150ms ease',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{
                background: 'linear-gradient(90deg, #6B9AF5 0%, #9B7CF6 50%, #6B9AF5 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                ✦ Upgrade to Pro
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, WebkitTextFillColor: 'var(--text-muted)' }}>
                Unlock unlimited models
              </span>
            </button>
          )}

          {/* Settings button */}
          <button
            onClick={() => dispatch({ type: 'OPEN_SETTINGS' })}
            aria-label="Open settings"
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid transparent',
              color: 'var(--text-muted)', fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 140ms ease', textAlign: 'left',
            }}
            onMouseEnter={e => {
              const b = e.currentTarget;
              b.style.background = 'rgba(255,255,255,0.05)';
              b.style.borderColor = 'rgba(255,255,255,0.07)';
              b.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={e => {
              const b = e.currentTarget;
              b.style.background = 'transparent';
              b.style.borderColor = 'transparent';
              b.style.color = 'var(--text-muted)';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
            </svg>
            Settings
          </button>
        </div>
      </aside>
    </>
  );
}
