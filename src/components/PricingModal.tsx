'use client';

import { useStore } from '@/lib/store';
import { useMemo, useState } from 'react';

interface BillingPlan {
  id: string;
  name: string;
  priceLabel: string;
  intervalLabel: string;
  badge?: string;
  description: string;
  checkoutReady?: boolean;
  features: string[];
}

const plans: BillingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    intervalLabel: 'forever',
    description: 'Perfect for getting started with chat, studio, and daily workflows — including cross-device sync.',
    features: ['150 requests per day', 'Core chat workspace', 'Live web search', 'Studio image generation', 'Prompt attachments', 'Cross-device chat sync'],
  },
  {
    id: 'pro-monthly',
    name: 'Arcus Pro',
    priceLabel: '$29',
    intervalLabel: 'per month',
    badge: 'Checkout live',
    description: 'The currently active NOWPayments widget. Best for people who want deeper research and higher limits right now.',
    checkoutReady: true,
    features: ['2,000 requests per day', 'Deep research with multi-pass synthesis', 'Priority queueing', 'Premium Studio generations', 'Agent workflow execution feed'],
  },
];

const growthFeatures = [
  'Deep Research reports with visible sources',
  'Embedded crypto billing via NOWPayments',
  'Cross-device chat sync in Free',
  'Agent workflow builder',
  'Pollinations-powered Studio',
  'Upload previews in chat',
  'Trusted-domain research controls',
  'Pinned and organized conversations',
  'Mobile-ready AI workspace',
  'Command palette navigation',
  'Personalized response modes',
  'Fast model switching with provider branding',
];

export default function PricingModal() {
  const { state, dispatch, showToast } = useStore();
  const [selectedPlanId, setSelectedPlanId] = useState('pro-monthly');

  const selectedPlan = useMemo(
    () => plans.find(plan => plan.id === selectedPlanId) || plans[1],
    [selectedPlanId]
  );

  return (
    <div onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
      position: 'fixed', inset: 0, background: 'rgba(4,6,12,0.74)', backdropFilter: 'blur(14px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }}>
      <div className="modal-enter" onClick={e => e.stopPropagation()} style={{
        maxWidth: 1100, width: 'min(1100px, 100%)', maxHeight: '88vh', overflowY: 'auto', borderRadius: 30,
        background: 'rgba(12,15,22,0.98)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        padding: 32, position: 'relative',
      }}>
        <button onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
          position: 'absolute', top: 16, right: 16, background: 'transparent',
          border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 20,
        }}>×</button>

        <div style={{ display: 'grid', gap: 24, position: 'relative' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', gap: 8, padding: '6px 10px', borderRadius: 999, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)', color: '#93c5fd', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Arcus Billing · Monthly only</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginTop: 18, letterSpacing: '-0.04em' }}>Turn Arcus into your always-on AI operating system.</h2>
            <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 15, marginTop: 12, maxWidth: 720, marginInline: 'auto', lineHeight: 1.7 }}>Pay with crypto, unlock faster research, bigger limits, and the premium features that make people stick around: deeper reports, better builders, cleaner workflows, and early access to what ships next.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.9fr)', gap: 22, alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPlanId(plan.id)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedPlanId(plan.id);
                      }
                    }}
                    style={{
                    padding: 24, borderRadius: 22, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                    background: selectedPlanId === plan.id ? 'rgba(59,130,246,0.14)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedPlanId === plan.id ? 'rgba(59,130,246,0.28)' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: selectedPlanId === plan.id ? '0 18px 50px rgba(59,130,246,0.16)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{plan.name}</div>
                      {plan.badge && <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 11, color: '#fff', fontWeight: 700 }}>{plan.badge}</span>}
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800 }}>{plan.priceLabel}<span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>/{plan.intervalLabel}</span></div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>{plan.description}</div>
                    <ul style={{ listStyle: 'none', display: 'grid', gap: 9, marginTop: 18 }}>
                      {plan.features.map(feature => (
                        <li key={feature} style={{ color: 'rgba(255,255,255,0.66)', fontSize: 13 }}>✓ {feature}</li>
                      ))}
                    </ul>
                    {plan.id === 'free' && (
                      <div style={{
                        marginTop: 18, width: '100%', padding: '11px 0',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12, color: 'rgba(255,255,255,0.62)', fontSize: 14, fontWeight: 600,
                        cursor: 'default', fontFamily: 'inherit', textAlign: 'center',
                      }}>{state.user.tier === 'free' ? 'Current plan' : 'Always available'}</div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{
                padding: 20, borderRadius: 20,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Why this can pull in more users</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  {growthFeatures.map(feature => (
                    <div key={feature} style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.72)', fontSize: 12 }}>{feature}</div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{
              padding: 24, borderRadius: 24,
              background: 'rgba(17,24,39,0.92)',
              border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 28px 70px rgba(0,0,0,0.32)',
              position: 'sticky', top: 12,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Crypto checkout</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 10 }}>{selectedPlan.name}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.56)', marginTop: 8, lineHeight: 1.6 }}>
                {selectedPlan.checkoutReady
                  ? 'Secure embedded checkout powered by NOWPayments. Pay in crypto without leaving the billing surface.'
                  : 'You already have access to the free plan — no payment required. Upgrade whenever you want deeper research and higher limits.'}
              </div>

              <div style={{ marginTop: 20, display: 'grid', gap: 16 }}>
                <div style={{ padding: 14, borderRadius: 16, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
                  <div style={{ fontSize: 12, color: '#bfdbfe', fontWeight: 700 }}>Signed in as {state.user.username}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.68)', marginTop: 6 }}>Checkout is scoped to your active Arcus account so plan upgrades stay tied to the right workspace identity.</div>
                </div>

                {selectedPlan.checkoutReady ? (
                  <div style={{
                    padding: 12, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}>
                    <iframe
                      src="https://nowpayments.io/embeds/payment-widget?iid=4716148703"
                      title="NOWPayments checkout"
                      style={{ width: '100%', minHeight: 540, border: 'none', borderRadius: 14, background: '#0b0d12' }}
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                ) : (
                  <div style={{ padding: 18, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Stay on Free</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)', marginTop: 8, lineHeight: 1.6 }}>
                      Keep exploring Arcus at no cost, then upgrade to the live Pro monthly checkout whenever you want more power.
                    </div>
                  </div>
                )}

                <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
                    <span style={{ color: 'rgba(255,255,255,0.56)' }}>Selected plan</span>
                    <span style={{ fontWeight: 700 }}>{selectedPlan.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, marginTop: 8 }}>
                    <span style={{ color: 'rgba(255,255,255,0.56)' }}>Displayed price</span>
                    <span style={{ fontWeight: 700 }}>{selectedPlan.priceLabel}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, marginTop: 8 }}>
                    <span style={{ color: 'rgba(255,255,255,0.56)' }}>Delivery</span>
                    <span style={{ fontWeight: 700 }}>{selectedPlan.checkoutReady ? 'Embedded widget' : 'Comparison only'}</span>
                  </div>
                </div>

                <button onClick={() => {
                  if (selectedPlan.id === 'free') {
                    dispatch({ type: 'HIDE_MODAL' });
                    showToast('You are already on the free Arcus plan.', 'info');
                    return;
                  }

                  setSelectedPlanId('pro-monthly');
                  showToast('The live embedded checkout is ready below.', 'success');
                }} style={{
                  width: '100%', padding: '14px 0', borderRadius: 16,
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', border: 'none',
                  color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 18px 40px rgba(59,130,246,0.24)',
                }}>{selectedPlan.id === 'free' ? 'Keep exploring for free' : selectedPlan.checkoutReady ? 'Checkout widget loaded' : 'Use the live Pro checkout'}</button>

                <div style={{ display: 'grid', gap: 8, color: 'rgba(255,255,255,0.52)', fontSize: 12 }}>
                  <div>• The monthly Arcus Pro widget is embedded directly in this modal.</div>
                  <div>• Free includes cross-device sync.</div>
                  <div>• The embedded billing experience now works without forcing a separate tab flow.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
