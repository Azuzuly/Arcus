'use client';

import { useStore } from '@/lib/store';

export default function PricingModal() {
  const { dispatch } = useStore();

  return (
    <div onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="modal-enter" onClick={e => e.stopPropagation()} style={{
        maxWidth: 640, width: '90%', borderRadius: 24,
        background: 'rgba(18,18,20,0.95)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        padding: 32, position: 'relative',
      }}>
        <button onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
          position: 'absolute', top: 16, right: 16, background: 'transparent',
          border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 20,
        }}>×</button>

        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>Choose your plan</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 32, textAlign: 'center' }}>Scale your AI workflow</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Free */}
          <div style={{
            padding: 28, borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#3B82F6', marginBottom: 8 }}>Free</div>
            <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 20 }}>$0</div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['150 requests/day', 'All models', 'Web Search', 'Studio access'].map(f => (
                <li key={f} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span> {f}
                </li>
              ))}
            </ul>
            <button style={{
              marginTop: 24, width: '100%', padding: '10px 0',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500,
              cursor: 'default', fontFamily: 'inherit',
            }}>Current plan</button>
          </div>

          {/* Pro */}
          <div style={{
            padding: 28, borderRadius: 16,
            background: 'rgba(59,130,246,0.05)',
            border: '1px solid rgba(59,130,246,0.2)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -10, right: 16,
              padding: '3px 10px', background: '#3B82F6', borderRadius: 6,
              fontSize: 11, fontWeight: 600, color: '#fff',
            }}>Popular</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#3B82F6', marginBottom: 8 }}>Pro</div>
            <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>$19<span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>/mo</span></div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Everything in Free, plus:</div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['2,000 requests/day', 'Priority access', 'Full Studio & Agent', 'Priority Support', 'Early access to features'].map(f => (
                <li key={f} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#3B82F6' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button style={{
              marginTop: 24, width: '100%', padding: '10px 0',
              background: '#3B82F6', border: 'none',
              borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Upgrade to Pro</button>
          </div>
        </div>
      </div>
    </div>
  );
}
