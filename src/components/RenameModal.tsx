'use client';

import { useStore } from '@/lib/store';
import { useState } from 'react';

export default function RenameModal() {
  const { state, dispatch } = useStore();
  const chatId = state.modalData.chatId as string;
  const [title, setTitle] = useState((state.modalData.currentTitle as string) || '');

  const handleUpdate = () => {
    if (title.trim()) {
      dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { title: title.trim() } });
    }
    dispatch({ type: 'HIDE_MODAL' });
  };

  return (
    <div onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="modal-enter" onClick={e => e.stopPropagation()} style={{
        maxWidth: 400, width: '90%', borderRadius: 39, padding: 32,
        background: 'var(--glass-panel)', backdropFilter: 'blur(22px) saturate(160%)',
        border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-modal)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Rename chat</h3>
        <input value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); }}
          style={{
            width: '100%', padding: '10px 14px', background: 'var(--glass-input)',
            border: '1px solid var(--glass-border)', borderRadius: 25,
            color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit', marginBottom: 20,
          }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
            padding: '8px 20px', background: 'var(--glass-button)', border: '1px solid var(--glass-border)',
            borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={handleUpdate} style={{
            padding: '8px 20px', background: 'var(--accent-blue)', border: 'none',
            borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Update</button>
        </div>
      </div>
    </div>
  );
}
