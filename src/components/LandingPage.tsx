/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '💬',
    title: 'Chat with Any Model',
    desc: 'Access GPT, Claude, Gemini, DeepSeek, Llama, Grok, and 500+ more — all from one unified interface. Switch mid-conversation.',
    accent: '#5B8AF0',
    glow: 'rgba(91,138,240,0.22)',
  },
  {
    icon: '🎨',
    title: 'Image Generation',
    desc: 'Generate stunning images with FLUX, DALL-E, and Stable Diffusion. Create, upscale, and experiment with any art style.',
    accent: '#9B6DFF',
    glow: 'rgba(155,109,255,0.20)',
  },
  {
    icon: '🧠',
    title: 'Multi-Model Routing',
    desc: 'Automatically pick the best model for each task — or manually compare outputs side by side. Let AI choose AI.',
    accent: '#4DD9E8',
    glow: 'rgba(77,217,232,0.20)',
  },
  {
    icon: '</>',
    title: 'Code Intelligence',
    desc: 'Write, review, debug, and refactor code with models trained specifically for software engineering tasks.',
    accent: '#C1FF72',
    glow: 'rgba(193,255,114,0.18)',
  },
  {
    icon: '🔍',
    title: 'Live Web Search',
    desc: 'Ground every response in real-time data. Arcus searches the web on your behalf and cites its sources automatically.',
    accent: '#E7A65A',
    glow: 'rgba(231,166,90,0.20)',
  },
  {
    icon: '⚡',
    title: 'Workflow Builder',
    desc: 'Design complex AI pipelines visually. Drag nodes, chain models, connect triggers to actions, and automate anything.',
    accent: '#FF6B9D',
    glow: 'rgba(255,107,157,0.20)',
  },
];

const STATS = [
  { value: '500+', label: 'AI Models' },
  { value: '10M+', label: 'Chats Run' },
  { value: '$0', label: 'To Start' },
];

const TICKER_ITEMS = [
  'OpenAI', 'Anthropic', 'Google DeepMind', 'Meta AI', 'Mistral',
  'DeepSeek', 'xAI Grok', 'Cohere', 'Perplexity', 'Together AI',
  'Fireworks AI', 'Groq', 'Replicate', 'HuggingFace', 'AWS Bedrock',
  'Azure OpenAI', 'Vertex AI', 'OpenRouter', 'Ollama', 'LM Studio',
];

const TESTIMONIALS = [
  {
    quote: 'Arcus replaced four different AI subscriptions for me. Having every model in one place is a game-changer.',
    name: 'Sarah Chen',
    role: 'Product Lead @ Vercel',
    avatar: 'SC',
    color: '#5B8AF0',
  },
  {
    quote: 'The workflow builder alone is worth it. I automated my entire content pipeline in an afternoon.',
    name: 'Marcus Rivera',
    role: 'Founder, Buildspace',
    avatar: 'MR',
    color: '#9B6DFF',
  },
  {
    quote: 'Switching between Claude and GPT mid-conversation to compare responses is something I never knew I needed.',
    name: 'Priya Nair',
    role: 'AI Engineer @ Stripe',
    avatar: 'PN',
    color: '#4DD9E8',
  },
];

// ─── Scroll Reveal Hook ────────────────────────────────────────────────────────

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.sr-hidden');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove('sr-hidden');
            e.target.classList.add('sr-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ─── Inline Aurora ────────────────────────────────────────────────────────────

function AuroraBackground({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg-void, #050508)' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none', zIndex: 0 }} aria-hidden>
        <filter id="lp-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#lp-grain)" />
      </svg>
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '65vw', height: '65vw', maxWidth: 900, maxHeight: 900, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(91,138,240,0.28) 0%, rgba(60,80,180,0.14) 45%, transparent 70%)', animation: 'lpOrb1 22s ease-in-out infinite', willChange: 'transform', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: '55vw', height: '55vw', maxWidth: 800, maxHeight: 800, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(155,109,255,0.22) 0%, rgba(100,60,200,0.10) 45%, transparent 70%)', animation: 'lpOrb2 28s ease-in-out infinite', willChange: 'transform', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '5%', left: '25%', width: '50vw', height: '50vw', maxWidth: 700, maxHeight: 700, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(77,217,232,0.16) 0%, rgba(30,150,160,0.08) 45%, transparent 70%)', animation: 'lpOrb3 32s ease-in-out infinite', animationDelay: '-8s', willChange: 'transform', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '30%', right: '5%', width: '40vw', height: '40vw', maxWidth: 600, maxHeight: 600, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(60,50,160,0.20) 0%, transparent 65%)', animation: 'lpOrb1 25s ease-in-out infinite', animationDelay: '-12s', willChange: 'transform', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to top, rgba(91,138,240,0.06) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(5,5,8,0.70) 100%)', pointerEvents: 'none', zIndex: 0 }} />
      {children && (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── LandingPage ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { dispatch } = useStore();
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goToChat = () => dispatch({ type: 'SET_TAB', tab: 'chat' });
  const goToStudio = () => dispatch({ type: 'SET_TAB', tab: 'studio' });

  return (
    <>
      <style>{`
        @keyframes lpOrb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(40px,-60px) scale(1.08); }
          66% { transform: translate(-30px,40px) scale(0.94); }
        }
        @keyframes lpOrb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40% { transform: translate(-50px,70px) scale(1.10); }
          70% { transform: translate(30px,-40px) scale(0.92); }
        }
        @keyframes lpOrb3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(60px,-80px) scale(1.12); }
        }
        @keyframes lpBadgePop {
          0% { opacity:0; transform:scale(0.85) translateY(8px); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes lpHeroIn {
          0% { opacity:0; transform:translateY(24px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes lpFloat {
          0%,100% { transform:translateY(0px); }
          50% { transform:translateY(-8px); }
        }
        @keyframes lpTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes lpGlow {
          0%,100% { box-shadow: 0 0 6px rgba(91,138,240,0.8); }
          50% { box-shadow: 0 0 14px rgba(91,138,240,1); }
        }
        @keyframes lpBorderPulse {
          0%,100% { border-color: rgba(91,138,240,0.22); }
          50% { border-color: rgba(91,138,240,0.52); }
        }

        .lp * { box-sizing: border-box; }

        .lp-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 999px;
          background: rgba(91,138,240,0.10);
          border: 1px solid rgba(91,138,240,0.28);
          color: #8AAEF8; font-size: 13px; font-weight: 500; letter-spacing: 0.02em;
          animation: lpBadgePop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both;
          backdrop-filter: blur(12px);
        }
        .lp-badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #5B8AF0; flex-shrink:0;
          animation: lpGlow 2s ease-in-out infinite;
        }

        .lp-h1 {
          margin: 0;
          font-size: clamp(36px, 6vw, 80px);
          font-weight: 800; line-height: 1.08; letter-spacing: -0.03em;
          background: linear-gradient(135deg, #E8EAF0 0%, #B8C8F8 40%, #9B6DFF 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: lpHeroIn 0.8s ease 0.4s both;
        }
        .lp-sub {
          margin: 20px 0 0; font-size: clamp(16px, 2vw, 20px);
          color: var(--text-secondary, #9DA3B8); line-height: 1.6; max-width: 540px;
          animation: lpHeroIn 0.8s ease 0.6s both;
        }
        .lp-ctas {
          display: flex; flex-wrap: wrap; gap: 12px; margin-top: 36px;
          animation: lpHeroIn 0.8s ease 0.8s both;
          justify-content: center;
        }
        .lp-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 12px; border: none; cursor: pointer;
          font-size: 15px; font-weight: 600; letter-spacing: 0.01em;
          background: linear-gradient(135deg, #6B9AF5 0%, #4A72E8 50%, #3558C8 100%);
          color: #fff;
          box-shadow: 0 4px 20px rgba(91,138,240,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          position: relative; overflow: hidden;
        }
        .lp-btn-primary::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .lp-btn-primary:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 30px rgba(91,138,240,0.45), inset 0 1px 0 rgba(255,255,255,0.12); }
        .lp-btn-primary:active { transform: scale(0.97); }

        .lp-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 12px; cursor: pointer;
          font-size: 15px; font-weight: 500;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10);
          color: var(--text-secondary, #9DA3B8); backdrop-filter: blur(12px);
          transition: all 0.2s ease;
        }
        .lp-btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); color: var(--text-primary, #E8EAF0); }
        .lp-btn-ghost:active { transform: scale(0.97); }

        .lp-stats {
          display: flex; gap: 12px; margin-top: 48px; flex-wrap: wrap;
          animation: lpHeroIn 0.8s ease 1.0s both; justify-content: center;
        }
        .lp-stat {
          display: flex; flex-direction: column; align-items: center;
          padding: 14px 22px; border-radius: 16px; min-width: 100px;
          background: rgba(14,16,26,0.72); border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(24px) saturate(160%);
          box-shadow: 0 4px 24px rgba(0,0,0,0.30);
          animation: lpFloat 4s ease-in-out infinite;
        }
        .lp-stat:nth-child(2) { animation-delay: 0.8s; }
        .lp-stat:nth-child(3) { animation-delay: 1.6s; }
        .lp-stat-val {
          font-size: 22px; font-weight: 800; letter-spacing: -0.02em;
          background: linear-gradient(135deg, #E8EAF0, #8AAEF8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .lp-stat-lbl { font-size: 11px; color: var(--text-muted,#5A6080); margin-top: 2px; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; }

        .lp-eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #5B8AF0; margin: 0 0 12px; }
        .lp-section-title {
          font-size: clamp(28px, 4vw, 48px); font-weight: 800;
          letter-spacing: -0.02em; line-height: 1.15;
          color: var(--text-primary, #E8EAF0); margin: 0 0 16px;
        }
        .lp-section-sub {
          font-size: clamp(15px, 1.8vw, 18px);
          color: var(--text-secondary, #9DA3B8); line-height: 1.65; max-width: 520px; margin: 0 auto;
        }

        .lp-fcard {
          position: relative; border-radius: 20px; padding: 28px;
          background: rgba(14,16,26,0.72); border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(24px) saturate(160%);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          overflow: hidden; cursor: default;
        }
        .lp-fcard::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
        }
        .lp-fcard:hover { transform: translateY(-4px); }
        .lp-ficon {
          width: 48px; height: 48px; border-radius: 14px; margin-bottom: 16px;
          display: flex; align-items: center; justify-content: center; font-size: 22px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
        }
        .lp-ftitle { font-size: 16px; font-weight: 700; color: var(--text-primary,#E8EAF0); margin: 0 0 8px; }
        .lp-fdesc { font-size: 14px; color: var(--text-secondary,#9DA3B8); line-height: 1.65; margin: 0; }

        .lp-ticker-wrap {
          overflow: hidden; position: relative;
          mask-image: linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%);
        }
        .lp-ticker-track { display: flex; width: max-content; animation: lpTicker 32s linear infinite; }
        .lp-ticker-item {
          display: inline-flex; align-items: center; gap: 8px; padding: 10px 28px;
          white-space: nowrap; font-size: 14px; font-weight: 600; letter-spacing: 0.03em;
          color: var(--text-muted,#5A6080); border-right: 1px solid rgba(255,255,255,0.06);
        }
        .lp-ticker-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(91,138,240,0.5); flex-shrink: 0; }

        .lp-tcard {
          border-radius: 20px; padding: 28px;
          background: rgba(14,16,26,0.72); border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(24px) saturate(160%); position: relative; overflow: hidden;
        }
        .lp-tcard::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
        }
        .lp-tquote { font-size: 15px; line-height: 1.7; color: var(--text-secondary,#9DA3B8); margin: 0 0 20px; font-style: italic; }
        .lp-tquote::before { content: '"'; color: #5B8AF0; font-size: 28px; line-height: 0; vertical-align: -10px; margin-right: 4px; font-style: normal; }
        .lp-tauthor { display: flex; align-items: center; gap: 12px; }
        .lp-tavatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
        .lp-tname { font-size: 14px; font-weight: 600; color: var(--text-primary,#E8EAF0); }
        .lp-trole { font-size: 12px; color: var(--text-muted,#5A6080); margin-top: 2px; }

        .lp-cta-card {
          border-radius: 24px; padding: clamp(48px,7vw,88px) clamp(24px,5vw,80px);
          background: rgba(14,16,26,0.82); border: 1px solid rgba(91,138,240,0.22);
          backdrop-filter: blur(32px) saturate(160%);
          position: relative; overflow: hidden; text-align: center;
          animation: lpBorderPulse 4s ease-in-out infinite;
        }
        .lp-cta-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(91,138,240,0.65) 30%, rgba(155,109,255,0.65) 70%, transparent 100%);
        }
        .lp-cta-card::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at 50% 0%, rgba(91,138,240,0.09) 0%, transparent 60%);
        }

        .lp-footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 48px clamp(20px,5vw,80px) 32px;
          display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: start;
        }
        .lp-footer-logo { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; display:flex; align-items:center; gap:6px; }
        .lp-footer-glyph { color: #5B8AF0; }
        .lp-footer-tagline { font-size: 13px; color: var(--text-muted,#5A6080); margin-top: 8px; max-width: 220px; line-height: 1.5; }
        .lp-footer-links { display: flex; gap: 48px; flex-wrap: wrap; }
        .lp-fcol h4 { font-size: 11px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase; color: var(--text-secondary,#9DA3B8); margin: 0 0 14px; }
        .lp-fcol ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .lp-fcol a { font-size: 13px; color: var(--text-muted,#5A6080); text-decoration: none; transition: color 0.2s; }
        .lp-fcol a:hover { color: var(--text-primary,#E8EAF0); }
        .lp-footer-bottom {
          grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,0.04);
          padding-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
        }
        .lp-copy { font-size: 12px; color: var(--text-muted,#5A6080); }

        @media (max-width: 900px) { .lp-footer { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .lp-grid-3 { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 520px) {
          .lp-grid-3 { grid-template-columns: 1fr !important; }
          .lp-tgrid { grid-template-columns: 1fr !important; }
          .lp-ctas { flex-direction: column; align-items: center; }
          .lp-stats { flex-direction: column; align-items: center; }
          .lp-footer-links { gap: 28px; }
        }
      `}</style>

      <div className="lp" style={{ minHeight: '100vh', background: 'var(--bg-void,#050508)', color: 'var(--text-primary,#E8EAF0)', fontFamily: 'var(--font-geist,system-ui,sans-serif)', overflowX: 'hidden' }}>

        {/* ── HERO ── */}
        <section ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AuroraBackground>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(80px,10vh,140px) clamp(20px,5vw,80px) clamp(60px,8vh,120px)', textAlign: 'center', position: 'relative' }}>
              <div style={{ transform: `translateY(${Math.min(scrollY * 0.18, 40)}px)`, transition: 'transform 0.05s linear', willChange: 'transform', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 760 }}>

                <div className="lp-badge sr-hidden" style={{ marginBottom: 28 }}>
                  <span className="lp-badge-dot" />
                  <span>&#10022; Now with 500+ AI Models</span>
                </div>

                <h1 className="lp-h1 sr-hidden sr-delay-1">
                  The AI workspace<br />that thinks with you
                </h1>

                <p className="lp-sub sr-hidden sr-delay-2">
                  Chat with any model. Generate images. Build workflows. All in one place.
                </p>

                <div className="lp-ctas sr-hidden sr-delay-3">
                  <button className="lp-btn-primary" onClick={goToChat}>
                    Get started free
                    <span style={{ fontSize: 16 }}>&#8594;</span>
                  </button>
                  <button className="lp-btn-ghost" onClick={goToStudio}>
                    See how it works
                    <span style={{ fontSize: 13, opacity: 0.7 }}>&#9654;</span>
                  </button>
                </div>

                <div className="lp-stats sr-hidden sr-delay-4">
                  {STATS.map((s) => (
                    <div key={s.label} className="lp-stat">
                      <span className="lp-stat-val">{s.value}</span>
                      <span className="lp-stat-lbl">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: Math.max(0, 1 - scrollY / 120), transition: 'opacity 0.2s', pointerEvents: 'none' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted,#5A6080)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>Scroll</span>
                <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, rgba(91,138,240,0.7), transparent)', animation: 'lpFloat 2s ease-in-out infinite' }} />
              </div>
            </div>
          </AuroraBackground>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding: 'clamp(80px,10vw,120px) clamp(20px,5vw,80px)', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p className="lp-eyebrow sr-hidden">Capabilities</p>
            <h2 className="lp-section-title sr-hidden sr-delay-1">Everything you need<br />to build with AI</h2>
            <p className="lp-section-sub sr-hidden sr-delay-2">One workspace. Every model. Infinite possibilities.</p>
          </div>

          <div className="lp-grid-3 sr-hidden sr-delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`lp-fcard sr-hidden sr-delay-${i + 1}`}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = f.accent + '44';
                  el.style.boxShadow = `0 8px 40px ${f.glow}, 0 0 0 1px ${f.accent}22`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(255,255,255,0.08)';
                  el.style.boxShadow = 'none';
                }}
              >
                <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(ellipse at 70% 30%, ${f.glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
                <div className="lp-ficon">
                  <span style={{ fontSize: f.icon === '</>' ? 13 : 22, fontWeight: 700, color: f.accent, fontFamily: 'monospace' }}>{f.icon}</span>
                </div>
                <h3 className="lp-ftitle">{f.title}</h3>
                <p className="lp-fdesc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TICKER ── */}
        <section style={{ padding: 'clamp(40px,6vw,72px) 0', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(10,12,20,0.45)' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted,#5A6080)', marginBottom: 28, marginTop: 0 }} className="sr-hidden">
            Trusted by builders worldwide
          </p>
          <div className="lp-ticker-wrap">
            <div className="lp-ticker-track">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
                <div key={idx} className="lp-ticker-item">
                  <span className="lp-ticker-dot" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section style={{ padding: 'clamp(80px,10vw,120px) clamp(20px,5vw,80px)', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="lp-eyebrow sr-hidden">What builders say</p>
            <h2 className="lp-section-title sr-hidden sr-delay-1">Loved by makers<br />and engineers</h2>
          </div>
          <div className="lp-tgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className={`lp-tcard sr-hidden sr-delay-${i + 1}`}>
                <p className="lp-tquote">{t.quote}</p>
                <div className="lp-tauthor">
                  <div className="lp-tavatar" style={{ background: t.color + '22', border: `1px solid ${t.color}44`, color: t.color }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="lp-tname">{t.name}</div>
                    <div className="lp-trole">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding: 'clamp(40px,6vw,80px) clamp(20px,5vw,80px)', maxWidth: 1100, margin: '0 auto' }}>
          <div className="lp-cta-card sr-hidden">
            <div style={{ position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '200%', background: 'radial-gradient(ellipse at center, rgba(91,138,240,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div className="lp-badge">
                <span className="lp-badge-dot" />
                <span>Free forever on the base tier</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1, background: 'linear-gradient(135deg, #E8EAF0 0%, #B8C8F8 50%, #9B6DFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Start building for free
              </h2>
              <p style={{ margin: 0, fontSize: 'clamp(15px,2vw,18px)', color: 'var(--text-secondary,#9DA3B8)', lineHeight: 1.6 }}>
                No credit card. No setup. Just AI.
              </p>
              <button className="lp-btn-primary" onClick={goToChat} style={{ fontSize: 16, padding: '16px 36px', marginTop: 8 }}>
                Get started &#8212; it&#39;s free
                <span style={{ fontSize: 18 }}>&#8594;</span>
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-muted,#5A6080)', margin: 0 }}>
                No account required &#183; Upgrade anytime
              </p>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="lp-footer">
            <div>
              <div className="lp-footer-logo">
                <span className="lp-footer-glyph">&#9670;</span>
                <span style={{ background: 'linear-gradient(135deg, #E8EAF0, #9DA3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Arcus</span>
              </div>
              <p className="lp-footer-tagline">The AI workspace that thinks with you.</p>
            </div>
            <div className="lp-footer-links">
              <div className="lp-fcol">
                <h4>Product</h4>
                <ul>
                  <li><a href="#">Chat</a></li>
                  <li><a href="#">Studio</a></li>
                  <li><a href="#">Agents</a></li>
                  <li><a href="#">Pricing</a></li>
                </ul>
              </div>
              <div className="lp-fcol">
                <h4>Company</h4>
                <ul>
                  <li><a href="#">About</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>
              <div className="lp-fcol">
                <h4>Legal</h4>
                <ul>
                  <li><a href="#">Privacy</a></li>
                  <li><a href="#">Terms</a></li>
                  <li><a href="#">Security</a></li>
                  <li><a href="#">Cookies</a></li>
                </ul>
              </div>
            </div>
            <div className="lp-footer-bottom">
              <span className="lp-copy">&#169; 2026 Arcus. All rights reserved.</span>
              <span className="lp-copy" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#5B8AF0' }}>&#9670;</span> Built with AI, for AI builders
              </span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
