'use client';

import { useStore } from '@/lib/store';
import { useState, useEffect, useCallback, useMemo } from 'react';

export default function CommandPalette() {
  const { state, dispatch, createNewChat } = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
        setQuery('');
        setSelected(0);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const actions = useMemo(() => [
    { label: 'New Chat', section: 'Actions', action: () => { createNewChat(); dispatch({ type: 'SET_TAB', tab: 'home' }); } },
    { label: 'Open Settings', section: 'Actions', action: () => dispatch({ type: 'SHOW_MODAL', modal: 'settings' }) },
    { label: 'Switch to Home', section: 'Actions', action: () => dispatch({ type: 'SET_TAB', tab: 'home' }) },
    { label: 'Switch to Studio', section: 'Actions', action: () => dispatch({ type: 'SET_TAB', tab: 'studio' }) },
    { label: 'Switch to Agent', section: 'Actions', action: () => dispatch({ type: 'SET_TAB', tab: 'agent' }) },
    ...state.conversations.map(c => ({ label: c.title, section: 'Conversations', action: () => { dispatch({ type: 'SET_ACTIVE_CHAT', id: c.id }); dispatch({ type: 'SET_TAB', tab: 'home' }); } })),
  ], [state.conversations, dispatch, createNewChat]);

  const filtered = useMemo(() => {
    if (!query) return actions;
    const q = query.toLowerCase();
    return actions.filter(a => a.label.toLowerCase().includes(q));
  }, [query, actions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) { filtered[selected].action(); setOpen(false); }
    if (e.key === 'Escape') setOpen(false);
  }, [filtered, selected]);

  if (!open) return null;

  return (
    <div onClick={() => setOpen(false)} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      zIndex: 900, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '20vh',
    }}>
      <div className="modal-enter" onClick={e => e.stopPropagation()} style={{
        background: 'var(--glass-panel)', backdropFilter: 'blur(24px)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-3xl)',
        width: 600, maxHeight: 480, overflow: 'hidden', boxShadow: 'var(--shadow-modal)',
      }}>
        <input value={query} onChange={e => { setQuery(e.target.value); setSelected(0); }}
          onKeyDown={handleKeyDown} autoFocus
          placeholder="Search commands, chats..."
          style={{
            width: '100%', padding: 20, background: 'transparent', border: 'none',
            outline: 'none', color: 'var(--text-primary)', fontSize: 18, fontFamily: 'inherit',
            borderBottom: '1px solid var(--glass-border)',
          }} />
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '8px 0' }}>
          {filtered.map((item, i) => (
            <button key={item.label + i} onClick={() => { item.action(); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 20px',
                background: i === selected ? 'var(--glass-hover)' : 'transparent',
                border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14,
                fontFamily: 'inherit', textAlign: 'left',
              }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 90 }}>{item.section}</span>
              <span>{item.label}</span>
            </button>
          ))}
          {filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No results</div>}
        </div>
      </div>
    </div>
  );
}
