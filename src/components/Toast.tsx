'use client';

import { useStore } from '@/lib/store';

export default function Toast() {
  const { state } = useStore();

  const colors: Record<string, string> = {
    success: '#22C55E', error: 'var(--accent-red)', warning: '#F59E0B', info: 'var(--accent-blue)',
  };

  if (state.toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 500,
      display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
    }}>
      {state.toasts.map(toast => (
        <div key={toast.id} className="panel-enter" style={{
          background: 'var(--glass-panel)', backdropFilter: 'blur(22px)',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)',
          borderLeft: `3px solid ${colors[toast.type]}`,
          padding: '12px 16px', width: 320, boxShadow: 'var(--shadow-card)',
          position: 'relative', overflow: 'hidden',
        }}>
          <span style={{ fontSize: 14 }}>{toast.message}</span>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, height: 2,
            background: colors[toast.type],
            animation: 'toast-progress 4s linear forwards',
          }} />
        </div>
      ))}
    </div>
  );
}
