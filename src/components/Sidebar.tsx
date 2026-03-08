'use client';

import { useStore } from '@/lib/store';
import { relativeTime, truncate } from '@/lib/utils';

export default function Sidebar() {
  const { state, dispatch, createNewChat } = useStore();

  const sortedConvos = [...state.conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <aside style={{
      width: state.ui.sidebarCollapsed ? 0 : 260, flexShrink: 0, height: '100%',
      background: 'rgba(25,25,25,0.95)', borderRight: '1px solid var(--glass-border)',
      display: 'flex', flexDirection: 'column', padding: state.ui.sidebarCollapsed ? 0 : '16px 12px',
      gap: 8, transition: 'width var(--dur-slow) var(--ease-out), opacity var(--dur-base) var(--ease-out)',
      overflow: 'hidden', opacity: state.ui.sidebarCollapsed ? 0 : 1,
    }}>
      {/* New Chat Button */}
      <button onClick={() => createNewChat()} style={{
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
        {sortedConvos.map(conv => (
          <div key={conv.id} onClick={() => dispatch({ type: 'SET_ACTIVE_CHAT', id: conv.id })}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', borderRadius: 'var(--radius-xs)', cursor: 'pointer',
              position: 'relative', transition: 'background var(--dur-fast) var(--ease-out)',
              background: state.activeChatId === conv.id ? 'var(--glass-hover)' : 'transparent',
              borderLeft: state.activeChatId === conv.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
            }}
            onMouseEnter={e => { if (state.activeChatId !== conv.id) e.currentTarget.style.background = 'var(--glass-hover)'; }}
            onMouseLeave={e => { if (state.activeChatId !== conv.id) e.currentTarget.style.background = 'transparent'; }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {truncate(conv.title, 28)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{relativeTime(conv.updatedAt)}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={e => { e.stopPropagation(); dispatch({ type: 'SHOW_MODAL', modal: 'rename', data: { chatId: conv.id, currentTitle: conv.title } }); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: 2, opacity: 0.5 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>✎</button>
              <button onClick={e => { e.stopPropagation(); dispatch({ type: 'SHOW_MODAL', modal: 'delete', data: { chatId: conv.id, chatTitle: conv.title } }); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: 2, opacity: 0.5 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>⋯</button>
            </div>
          </div>
        ))}
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
