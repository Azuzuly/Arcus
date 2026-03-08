'use client';

import { useStore } from '@/lib/store';

export default function PricingModal() {
  const { dispatch } = useStore();

  return (
    <div onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="modal-enter" onClick={e => e.stopPropagation()} style={{
        maxWidth: 520, width: '90%', borderRadius: 'var(--radius-3xl)',
        background: 'var(--glass-panel)', backdropFilter: 'blur(22px) saturate(160%)',
        border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-modal)',
        padding: 32, position: 'relative',
      }}>
        <button onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
          position: 'absolute', top: 16, right: 16, background: 'transparent',
          border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20,
        }}>×</button>

        <div style={{ display: 'flex', gap: 16 }}>
          {/* Free */}
          <div style={{
            flex: 1, background: 'var(--glass-card)', borderRadius: 'var(--radius-3xl)',
            padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <h3 style={{ fontSize: 28, fontWeight: 600, color: 'var(--accent-lime-soft)' }}>Free</h3>
            <div style={{ fontSize: 36, fontWeight: 700 }}>$0</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['150 requests/day', 'Basic chat models', 'Web Search', 'Limited Studio Access'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', flexShrink: 0 }} /> {f}
                </li>
              ))}
            </ul>
            <button disabled style={{
              width: '100%', padding: '12px 0', background: 'rgba(108,108,108,0.5)',
              border: 'none', borderRadius: 28, color: 'var(--text-muted)',
              fontSize: 14, fontWeight: 600, cursor: 'not-allowed', fontFamily: 'inherit',
            }}>Current</button>
          </div>

          {/* Pro */}
          <div style={{
            flex: 1, background: 'var(--glass-card)', borderRadius: 'var(--radius-3xl)',
            padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
            borderTop: '3px solid var(--accent-lime)',
          }}>
            <h3 style={{ fontSize: 28, fontWeight: 600, color: 'var(--accent-lime)', fontStyle: 'italic' }}>Pro</h3>
            <div><span style={{ fontSize: 36, fontWeight: 700 }}>$19</span><span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>/month</span></div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['2,000 requests/day', 'All frontier models', 'Web Search', 'Full Studio & Agent', 'Priority Support', 'Early access'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-lime)', flexShrink: 0 }} /> {f}
                </li>
              ))}
            </ul>
            <button style={{
              width: '100%', padding: '12px 0', background: '#FFFFFF',
              border: 'none', borderRadius: 20, color: '#0A0A0A',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Go Pro</button>
          </div>
        </div>
      </div>
    </div>
  );
}
