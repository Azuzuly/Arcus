'use client';

import { useStore } from '@/lib/store';

export default function DeleteModal() {
  const { state, dispatch } = useStore();
  const chatId = state.modalData.chatId as string;
  const chatTitle = state.modalData.chatTitle as string;

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
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Delete chat?</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
          This will delete <strong>&quot;{chatTitle}&quot;</strong>.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
            padding: '8px 20px', background: 'var(--glass-button)', border: '1px solid var(--glass-border)',
            borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={() => { dispatch({ type: 'REMOVE_CONVERSATION', id: chatId }); dispatch({ type: 'HIDE_MODAL' }); }} style={{
            padding: '8px 20px', background: 'var(--accent-red)', border: 'none',
            borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}
