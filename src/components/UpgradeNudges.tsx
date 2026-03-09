'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';

type UpgradeNudge = {
  id: string;
  badge: string;
  title: string;
  body: string;
  cta: string;
};

const DISMISSED_KEY = 'arcus_dismissed_upgrade_nudges';
const LAST_SHOWN_KEY = 'arcus_last_upgrade_nudge_at';

const NUDGES: UpgradeNudge[] = [
  {
    id: 'pro-research',
    badge: 'Arcus Pro',
    title: 'Unlock deeper research runs',
    body: 'Longer web sweeps, richer cards, and faster path-to-answer for the really gnarly prompts.',
    cta: 'See Pro plans',
  },
  {
    id: 'pro-models',
    badge: 'Upgrade',
    title: 'Keep your best models on standby',
    body: 'Save favorites, bounce between premium models faster, and keep the workspace tuned for power sessions.',
    cta: 'Compare tiers',
  },
  {
    id: 'pro-workflows',
    badge: 'New',
    title: 'Go bigger with workflow-grade Arcus',
    body: 'Ideal if you live in research, coding bundles, image generation, and lots of parallel model experiments.',
    cta: 'Open pricing',
  },
];

export default function UpgradeNudges() {
  const { dispatch, state } = useStore();
  const [dismissed, setDismissed] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];

    try {
      const saved = window.localStorage.getItem(DISMISSED_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeNudge = useMemo(() => NUDGES.find(item => item.id === activeId) || null, [activeId]);

  useEffect(() => {
    if (!state.initialized || !state.user.id || state.user.tier === 'pro') return;
    if (activeId) return;

    const available = NUDGES.filter(item => !dismissed.includes(item.id));
    if (available.length === 0) return;

    if (typeof window !== 'undefined') {
      const lastShownRaw = window.localStorage.getItem(LAST_SHOWN_KEY);
      const lastShown = lastShownRaw ? Number(lastShownRaw) : 0;
      const minimumDelay = 30 * 60 * 1000;
      if (lastShown && Number.isFinite(lastShown) && Date.now() - lastShown < minimumDelay) {
        return;
      }
    }

    const timeout = window.setTimeout(() => {
      const selected = available[Math.floor(Math.random() * available.length)];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
      }
      setActiveId(selected.id);
    }, 30 * 60 * 1000 + Math.round(Math.random() * 20 * 60 * 1000));

    return () => window.clearTimeout(timeout);
  }, [activeId, dismissed, state.initialized, state.user.id, state.user.tier]);

  if (!activeNudge) return null;

  const dismiss = () => {
    const next = [...dismissed, activeNudge.id];
    setDismissed(next);
    setActiveId(null);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    }
  };

  return (
    <div className="panel-enter" style={{
      position: 'fixed', right: 18, bottom: 18, zIndex: 90,
      width: 'min(280px, calc(100vw - 24px))', borderRadius: 20,
      background: 'rgba(8,12,24,0.88)', border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 20px 48px rgba(2,6,23,0.42)', overflow: 'hidden', backdropFilter: 'blur(18px)',
    }}>
      <div style={{ padding: 14, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999,
              background: 'rgba(148,163,184,0.14)', color: '#dbeafe', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>{activeNudge.badge}</div>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.35, marginTop: 10 }}>{activeNudge.title}</div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss upgrade offer"
            style={{
              width: 28, height: 28, borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', cursor: 'pointer', fontSize: 14,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <p style={{ color: 'rgba(226,232,240,0.76)', fontSize: 13, lineHeight: 1.55, margin: 0 }}>
          {activeNudge.body}
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              dispatch({ type: 'SHOW_MODAL', modal: 'pricing' });
              setActiveId(null);
            }}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
              background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 700, fontFamily: 'inherit', fontSize: 13,
            }}
          >
            {activeNudge.cta}
          </button>
          <button
            onClick={dismiss}
            style={{
              padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: '#cbd5e1', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
            }}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}