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

  const togglePin = (chatId: string, isPinned: boolean) => {
    if (!isPinned && pinnedConvos.length >= 5) {
      showToast('You can pin up to 5 chats for now.', 'warning');
      return;
    }
    dispatch({ type: 'TOGGLE_PIN_CONVERSATION', id: chatId });
  };

  const renderConversation = (conv: typeof sortedConvos[number]) => (
    <div key={conv.id} onClick={() => { dispatch({ type: 'SET_ACTIVE_CHAT', id: conv.id }); if (isMobile) dispatch({ type: 'SET_UI', ui: { sidebarCollapsed: true } }); }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
        position: 'relative', transition: 'all var(--dur-fast) var(--ease-out)',
        background: state.activeChatId === conv.id ? 'rgba(116,126,255,0.13)' : conv.pinned ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: `1px solid ${state.activeChatId === conv.id ? 'rgba(116,126,255,0.18)' : conv.pinned ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
        boxShadow: conv.pinned ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'none',
      }}
      onMouseEnter={e => { if (state.activeChatId !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={e => { if (state.activeChatId !== conv.id) e.currentTarget.style.background = conv.pinned ? 'rgba(255,255,255,0.04)' : 'transparent'; }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {conv.pinned && (
            <span style={{
              padding: '3px 7px',
              background: 'rgba(111,177,120,0.12)',
              border: '1px solid rgba(111,177,120,0.18)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--accent-mint)',
              fontSize: 10,
              fontWeight: 700,
            }}>
              PINNED
            </span>
          )}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {truncate(conv.title, 28)}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{relativeTime(conv.updatedAt)}</div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={e => { e.stopPropagation(); togglePin(conv.id, conv.pinned); }}
          title={conv.pinned ? 'Unpin chat' : 'Pin chat'}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: conv.pinned ? 'var(--accent-mint)' : 'var(--text-secondary)', fontSize: 13, padding: 4, opacity: 0.82 }}>
          📌
        </button>
        <button onClick={e => { e.stopPropagation(); dispatch({ type: 'SHOW_MODAL', modal: 'rename', data: { chatId: conv.id, currentTitle: conv.title } }); }}
          title="Rename chat"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, padding: 4, opacity: 0.82 }}>
          ✏️
        </button>
        <button onClick={e => { e.stopPropagation(); dispatch({ type: 'SHOW_MODAL', modal: 'delete', data: { chatId: conv.id, chatTitle: conv.title } }); }}
          title="Delete chat"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, padding: 4, opacity: 0.82 }}>
          🗑️
        </button>
      </div>
    </div>
  );

  return (
    <aside style={{
      width: state.ui.sidebarCollapsed ? 0 : 260, flexShrink: 0, height: '100%',
      background: 'linear-gradient(180deg, rgba(42,42,46,0.94), rgba(21,21,24,0.98))', borderRight: '1px solid var(--glass-border)',
      display: 'flex', flexDirection: 'column', padding: state.ui.sidebarCollapsed ? 0 : '16px 12px',
      gap: 8, transition: 'width var(--dur-slow) var(--ease-out), opacity var(--dur-base) var(--ease-out)',
      overflow: 'hidden', opacity: state.ui.sidebarCollapsed ? 0 : 1,
      boxShadow: isMobile && !state.ui.sidebarCollapsed ? '0 18px 80px rgba(0,0,0,0.42)' : 'none',
    }}>
      {/* New Chat Button */}
      <button onClick={() => { createNewChat(); if (isMobile) dispatch({ type: 'SET_UI', ui: { sidebarCollapsed: true } }); }} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', background: 'var(--glass-button)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)',
        color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
        transition: 'all var(--dur-fast) var(--ease-out)', fontFamily: 'inherit',
      }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--glass-hover)'; e.currentTarget.style.borderColor = 'var(--glass-border-hover)'; }}
         onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass-button)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#fff', lineHeight: 1,
        }}>+</div>
        New Chat
      </button>

      {/* Chat History Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 4px 4px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>
        💬 Chat History
      </div>

      {/* Chat List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sortedConvos.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 8px', textAlign: 'center' }}>
            No conversations yet
          </div>
        )}
        {pinnedConvos.length > 0 && (
          <>
            <div style={{ padding: '8px 6px 4px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>PINNED</div>
            {pinnedConvos.map(renderConversation)}
            <div style={{ height: 10 }} />
          </>
        )}
        {regularConvos.length > 0 && (
          <>
            <div style={{ padding: '8px 6px 4px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>RECENT</div>
            {regularConvos.map(renderConversation)}
          </>
        )}
      </div>

      {/* Footer: Usage */}
      <div style={{ padding: '12px 8px 4px', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
          {state.usage.today.requests}/{state.usage.today.limit} requests
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
    </aside>
  );
}
