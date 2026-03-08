'use client';

import { useStore } from '@/lib/store';
import { useEffect, useMemo, useState } from 'react';

interface BillingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  badge?: string;
}

interface BillingConfigPayload {
  plans: BillingPlan[];
  currencies: string[];
}

export default function PricingModal() {
  const { state, dispatch, showToast } = useStore();
  const [config, setConfig] = useState<BillingConfigPayload | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('pro-annual');
  const [payCurrency, setPayCurrency] = useState('btc');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const response = await fetch('/api/billing/config', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Could not load billing config.');
        if (cancelled) return;
        setConfig(payload);
        setPayCurrency(payload.currencies?.[0] || 'btc');
      } catch (error) {
        if (!cancelled) showToast(error instanceof Error ? error.message : 'Could not load billing config.', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadConfig();
    return () => { cancelled = true; };
  }, [showToast]);

  const selectedPlan = useMemo(
    () => config?.plans.find(plan => plan.id === selectedPlanId) || null,
    [config, selectedPlanId]
  );

  const launchCheckout = async () => {
    if (!selectedPlan) return;
    setCheckoutLoading(true);

    try {
      const response = await fetch('/api/billing/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          payCurrency,
          userId: state.user.id,
          email: state.user.email,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Could not create checkout.');

      const url = payload?.invoice?.invoice_url;
      if (!url) throw new Error('NOWPayments did not return an invoice URL.');
      setInvoiceUrl(url);
      window.open(url, '_blank', 'noopener,noreferrer');
      showToast('Crypto checkout launched in a new tab.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not launch checkout.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const planFeatures: Record<string, string[]> = {
    free: ['150 requests per day', 'Core chat workspace', 'Live web search', 'Studio image generation', 'Prompt attachments'],
    'pro-monthly': ['2,000 requests per day', 'Deep research with multi-pass synthesis', 'Priority queueing', 'Premium Studio generations', 'Agent workflow execution feed', 'Cross-device cloud sync'],
    'pro-annual': ['Everything in Pro Monthly', 'Founding member pricing', 'Priority roadmap access', 'Feature drops before public launch', 'Research-first onboarding packs', 'Better value for power users'],
  };

  const growthFeatures = [
    'Deep Research reports with visible sources',
    'Crypto billing via NOWPayments',
    'Cross-device chat sync',
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

  return (
    <div onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }}>
      <div className="modal-enter" onClick={e => e.stopPropagation()} style={{
        maxWidth: 1100, width: 'min(1100px, 100%)', maxHeight: '88vh', overflowY: 'auto', borderRadius: 30,
        background: 'rgba(18,18,20,0.95)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        padding: 32, position: 'relative',
      }}>
        <button onClick={() => dispatch({ type: 'HIDE_MODAL' })} style={{
          position: 'absolute', top: 16, right: 16, background: 'transparent',
          border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 20,
        }}>×</button>

        <div style={{ display: 'grid', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', gap: 8, padding: '6px 10px', borderRadius: 999, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)', color: '#93c5fd', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Arcus Billing · NOWPayments Ready</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginTop: 18, letterSpacing: '-0.04em' }}>Turn Arcus into your always-on AI operating system.</h2>
            <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 15, marginTop: 12, maxWidth: 720, marginInline: 'auto', lineHeight: 1.7 }}>Pay with crypto, unlock faster research, bigger limits, and the premium features that make people stick around: deeper reports, better builders, cleaner workflows, and early access to what ships next.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.9fr)', gap: 22, alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={{
                  padding: 24, borderRadius: 20,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Free</div>
                  <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>$0</div>
                  <ul style={{ listStyle: 'none', display: 'grid', gap: 9 }}>
                    {planFeatures.free.map(feature => (
                      <li key={feature} style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13 }}>• {feature}</li>
                    ))}
                  </ul>
                  <button style={{
                    marginTop: 22, width: '100%', padding: '11px 0',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: 'rgba(255,255,255,0.56)', fontSize: 14, fontWeight: 600,
                    cursor: 'default', fontFamily: 'inherit',
                  }}>{state.user.tier === 'free' ? 'Current plan' : 'Always available'}</button>
                </div>

                {(config?.plans || []).map(plan => (
                  <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)} style={{
                    padding: 24, borderRadius: 22, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                    background: selectedPlanId === plan.id ? 'linear-gradient(180deg, rgba(59,130,246,0.14), rgba(88,28,135,0.18))' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedPlanId === plan.id ? 'rgba(59,130,246,0.28)' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: selectedPlanId === plan.id ? '0 18px 50px rgba(59,130,246,0.16)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{plan.name}</div>
                      {plan.badge && <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 11, color: '#fff', fontWeight: 700 }}>{plan.badge}</span>}
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800 }}>${plan.price}<span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>/{plan.interval === 'year' ? 'yr' : 'mo'}</span></div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>{plan.interval === 'year' ? 'Built for daily operators and teams-in-waiting.' : 'Great for heavy solo use and faster experiments.'}</div>
                    <ul style={{ listStyle: 'none', display: 'grid', gap: 9, marginTop: 18 }}>
                      {(planFeatures[plan.id] || []).map(feature => (
                        <li key={feature} style={{ color: 'rgba(255,255,255,0.66)', fontSize: 13 }}>✓ {feature}</li>
                      ))}
                    </ul>
                  </button>
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
              background: 'linear-gradient(180deg, rgba(31,41,55,0.84), rgba(17,24,39,0.92))',
              border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 28px 70px rgba(0,0,0,0.32)',
              position: 'sticky', top: 12,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Crypto checkout</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 10 }}>{selectedPlan?.name || 'Loading plan...'}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.56)', marginTop: 8, lineHeight: 1.6 }}>Secure hosted checkout powered by NOWPayments. Pay in crypto, complete checkout in a new tab, and come right back to Arcus.</div>

              <div style={{ marginTop: 20, display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.46)', marginBottom: 8 }}>Plan</label>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(config?.plans || []).map(plan => (
                      <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)} style={{
                        padding: '12px 14px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                        border: `1px solid ${selectedPlanId === plan.id ? 'rgba(59,130,246,0.34)' : 'rgba(255,255,255,0.08)'}`,
                        background: selectedPlanId === plan.id ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.04)',
                        color: '#fff', textAlign: 'left',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <span style={{ fontWeight: 700 }}>{plan.name}</span>
                          <span style={{ color: 'rgba(255,255,255,0.62)' }}>${plan.price}/{plan.interval === 'year' ? 'yr' : 'mo'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.46)', marginBottom: 8 }}>Pay with</label>
                  <select value={payCurrency} onChange={e => setPayCurrency(e.target.value)} disabled={loading} style={{
                    width: '100%', padding: '12px 14px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff', fontFamily: 'inherit', outline: 'none',
                  }}>
                    {(config?.currencies || ['btc', 'eth']).map(currency => (
                      <option key={currency} value={currency}>{currency.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
                    <span style={{ color: 'rgba(255,255,255,0.56)' }}>Charge</span>
                    <span style={{ fontWeight: 700 }}>{selectedPlan ? `$${selectedPlan.price} ${selectedPlan.currency.toUpperCase()}` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, marginTop: 8 }}>
                    <span style={{ color: 'rgba(255,255,255,0.56)' }}>Checkout currency</span>
                    <span style={{ fontWeight: 700 }}>{payCurrency.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, marginTop: 8 }}>
                    <span style={{ color: 'rgba(255,255,255,0.56)' }}>Delivery</span>
                    <span style={{ fontWeight: 700 }}>Hosted invoice</span>
                  </div>
                </div>

                <button onClick={launchCheckout} disabled={!selectedPlan || checkoutLoading || loading} style={{
                  width: '100%', padding: '14px 0', borderRadius: 16,
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', border: 'none',
                  color: '#fff', fontSize: 15, fontWeight: 800, cursor: checkoutLoading ? 'wait' : 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 18px 40px rgba(59,130,246,0.24)',
                }}>{checkoutLoading ? 'Creating secure checkout…' : 'Pay with NOWPayments'}</button>

                {invoiceUrl && (
                  <div style={{ padding: 14, borderRadius: 16, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
                    <div style={{ fontSize: 12, color: '#a7f3d0', fontWeight: 700 }}>Checkout ready</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.66)', marginTop: 6, wordBreak: 'break-all' }}>{invoiceUrl}</div>
                  </div>
                )}

                <div style={{ display: 'grid', gap: 8, color: 'rgba(255,255,255,0.52)', fontSize: 12 }}>
                  <div>• Hosted payment page opens in a new tab.</div>
                  <div>• Webhook verification is ready on `/api/billing/webhook`.</div>
                  <div>• Add your NOWPayments API key and IPN secret to go fully live.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
