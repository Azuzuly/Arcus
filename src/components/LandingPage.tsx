'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { brandLogoUrl } from '@/lib/providerLogos';

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const CYCLE_WORDS = ['any AI model', 'image generation', 'web search', 'custom agents', 'your creativity'];

const MODELS = [
  { name: 'GPT-4o', provider: 'OpenAI' },
  { name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { name: 'Gemini 2.0 Flash', provider: 'Google' },
  { name: 'Llama 3.3 70B', provider: 'Meta' },
  { name: 'DeepSeek R1', provider: 'DeepSeek' },
  { name: 'Mistral Large', provider: 'Mistral' },
  { name: 'Qwen 2.5 72B', provider: 'Alibaba' },
  { name: 'Command R+', provider: 'Cohere' },
  { name: 'Grok-2', provider: 'xAI' },
  { name: 'Phi-3 Medium', provider: 'Microsoft' },
];

const FEATURES = [
  {
    title: 'One prompt, any model',
    desc: 'Access GPT-4o, Claude, Gemini, Llama, and 200+ models from a single beautiful interface. Switch instantly.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: 'AI image studio',
    desc: 'Generate stunning visuals with DALL-E, Stable Diffusion, and Flux. Built right into the app.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
      </svg>
    ),
  },
  {
    title: 'Custom agents',
    desc: 'Build specialized AI assistants with custom system prompts, model preferences, and personalities.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    title: 'Web search built-in',
    desc: 'AI answers grounded in real-time web results. No outdated knowledge cutoffs.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9 9 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    title: 'Zero data collection',
    desc: 'Conversations stay on your device. No tracking, no telemetry, no data harvesting. Ever.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: '100% free & open',
    desc: 'No subscriptions, no paywalls. Bring your own API key and use any model without limits.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Open Arcus', desc: 'No signup required. Your data stays in your browser from the start.' },
  { step: '02', title: 'Pick a model', desc: 'Choose from 200+ AI models or let Arcus auto-route to the best one.' },
  { step: '03', title: 'Start creating', desc: 'Chat, generate images, search the web, or build custom agents. All in one place.' },
];

/* ------------------------------------------------------------------ */
/*  TYPEWRITER HOOK                                                    */
/* ------------------------------------------------------------------ */

function useTypewriter(words: string[], typingMs = 80, pauseMs = 2000, deletingMs = 40) {
  const [display, setDisplay] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && charIdx < word.length) {
      timeout = setTimeout(() => {
        setDisplay(word.slice(0, charIdx + 1));
        setCharIdx(charIdx + 1);
      }, typingMs);
    } else if (!isDeleting && charIdx === word.length) {
      timeout = setTimeout(() => setIsDeleting(true), pauseMs);
    } else if (isDeleting && charIdx > 0) {
      timeout = setTimeout(() => {
        setDisplay(word.slice(0, charIdx - 1));
        setCharIdx(charIdx - 1);
      }, deletingMs);
    } else {
      setIsDeleting(false);
      setWordIdx((wordIdx + 1) % words.length);
    }

    return () => clearTimeout(timeout);
  }, [charIdx, isDeleting, wordIdx, words, typingMs, pauseMs, deletingMs]);

  return display;
}

/* ------------------------------------------------------------------ */
/*  INTERSECTION OBSERVER HOOK                                         */
/* ------------------------------------------------------------------ */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const typed = useTypewriter(CYCLE_WORDS);
  const heroRef = useInView(0.1);
  const featuresRef = useInView(0.1);
  const howRef = useInView(0.1);
  const ctaRef = useInView(0.1);
  const [navSolid, setNavSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleEnter = useCallback(() => {
    onEnter();
    try { localStorage.setItem('arcus_seen_landing', '1'); } catch {}
  }, [onEnter]);

  return (
    <div style={{ background: '#0a0a0f', color: '#fff', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, system-ui, -apple-system, sans-serif)', overflowX: 'hidden' }}>

      {/* ============================================================ */}
      {/*  NAVBAR                                                      */}
      {/* ============================================================ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 24px',
        transition: 'all 0.4s ease-out',
        ...(navSolid ? {
          background: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(80px)',
          WebkitBackdropFilter: 'blur(80px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        } : {}),
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={brandLogoUrl} alt="Arcus" style={{ height: 28, width: 28, borderRadius: 6 }} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Arcus</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <a href="https://github.com/Azuzuly/Arcus" target="_blank" rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >GitHub</a>
            <button onClick={handleEnter} style={{
              background: '#fff', color: '#0a0a0f', border: 'none', borderRadius: 10,
              padding: '8px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >Open App</button>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section
        ref={heroRef.ref}
        style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center', position: 'relative',
          padding: '120px 24px 80px',
        }}
      >
        {/* Cosmic background glow */}
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
            width: '140%', height: '80%',
            background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)',
            filter: 'blur(60px)',
          }} />
          <div style={{
            position: 'absolute', top: '10%', left: '10%', width: 500, height: 500,
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            borderRadius: '50%', animation: 'float-slow 25s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', top: '20%', right: '5%', width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)',
            borderRadius: '50%', animation: 'float-slow 20s ease-in-out infinite reverse',
          }} />
          {/* Grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.03,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div style={{
          position: 'relative', zIndex: 1, maxWidth: 800,
          opacity: heroRef.visible ? 1 : 0,
          transform: heroRef.visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 100, padding: '6px 16px 6px 8px', marginBottom: 32, fontSize: 13,
          }}>
            <span style={{
              background: 'rgba(139,92,246,0.3)', borderRadius: 100,
              padding: '2px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>New</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>200+ models now available</span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 700, lineHeight: 1.1,
            letterSpacing: '-0.03em', margin: '0 0 24px',
          }}>
            One interface for<br />
            <span style={{
              background: 'linear-gradient(135deg, #818cf8, #6366f1, #a78bfa, #38bdf8)',
              backgroundSize: '200% 200%', animation: 'gradient-shift 6s ease infinite',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>{typed}<span style={{
              display: 'inline-block', width: 2, height: '0.9em', background: '#818cf8',
              marginLeft: 2, verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
            }} /></span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(16px, 2.2vw, 20px)', color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6, margin: '0 0 40px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto',
          }}>
            Chat with any AI model, generate images, search the web, and build custom agents.
            Free, private, and beautiful.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleEnter} style={{
              background: '#fff', color: '#0a0a0f', border: 'none', borderRadius: 12,
              padding: '14px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', boxShadow: '0 0 30px rgba(255,255,255,0.1)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.1)'; }}
            >Start chatting</button>
            <a href="https://github.com/Azuzuly/Arcus" target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
              padding: '14px 28px', fontSize: 16, fontWeight: 500, textDecoration: 'none',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              View on GitHub
            </a>
          </div>
        </div>

        {/* Model ticker */}
        <div style={{
          position: 'relative', zIndex: 1, marginTop: 64, width: '100%', overflow: 'hidden',
          maskImage: 'linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)',
          opacity: heroRef.visible ? 1 : 0,
          transition: 'opacity 1s ease 0.4s',
        }}>
          <div style={{
            display: 'flex', gap: 32, animation: 'scroll-ticker 30s linear infinite',
            width: 'max-content',
          }}>
            {[...MODELS, ...MODELS].map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                whiteSpace: 'nowrap', fontSize: 13, color: 'rgba(255,255,255,0.4)',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{m.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>{m.provider}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STATS BAR                                                   */}
      {/* ============================================================ */}
      <section style={{
        maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1,
      }}>
        {[
          { val: '200+', label: 'AI Models' },
          { val: '0', label: 'Data Collected' },
          { val: '100%', label: 'Free & Open' },
          { val: 'Unlimited', label: 'Conversations' },
        ].map((s, i) => (
          <div key={i} style={{
            textAlign: 'center', padding: '28px 16px',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>{s.val}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ============================================================ */}
      {/*  FEATURES                                                    */}
      {/* ============================================================ */}
      <section
        ref={featuresRef.ref}
        style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 100px' }}
      >
        <div style={{
          textAlign: 'center', marginBottom: 64,
          opacity: featuresRef.visible ? 1 : 0,
          transform: featuresRef.visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
            Everything you need
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto' }}>
            One beautiful app that replaces a dozen AI subscriptions.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16,
        }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '32px 28px',
                transition: 'all 0.3s ease',
                opacity: featuresRef.visible ? 1 : 0,
                transform: featuresRef.visible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: `${i * 0.08}s`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 40px rgba(99,102,241,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#818cf8', marginBottom: 20,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 10px', letterSpacing: '-0.01em' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS                                                */}
      {/* ============================================================ */}
      <section
        ref={howRef.ref}
        style={{
          position: 'relative', padding: '100px 24px', overflow: 'hidden',
        }}
      >
        {/* Background accent */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 60%)',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            textAlign: 'center', marginBottom: 64,
            opacity: howRef.visible ? 1 : 0,
            transform: howRef.visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
              Three steps. That's it.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)' }}>
              No accounts, no API keys to start. Just open and go.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 24, alignItems: 'flex-start',
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '32px',
                  opacity: howRef.visible ? 1 : 0,
                  transform: howRef.visible ? 'translateX(0)' : 'translateX(-20px)',
                  transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: `${i * 0.12}s`,
                }}
              >
                <div style={{
                  fontSize: 48, fontWeight: 800, lineHeight: 1,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.05))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  minWidth: 70,
                }}>{item.step}</div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FINAL CTA                                                   */}
      {/* ============================================================ */}
      <section
        ref={ctaRef.ref}
        style={{
          position: 'relative', padding: '120px 24px', textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Glow behind */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 60%)',
          filter: 'blur(80px)', pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          opacity: ctaRef.visible ? 1 : 0,
          transform: ctaRef.visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
            Start building, now.
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', margin: '0 0 40px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Every AI model at your fingertips. No signup required.
          </p>
          <button onClick={handleEnter} style={{
            background: '#fff', color: '#0a0a0f', border: 'none', borderRadius: 12,
            padding: '16px 40px', fontSize: 17, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s', boxShadow: '0 0 40px rgba(255,255,255,0.1)',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(255,255,255,0.1)'; }}
          >Launch Arcus</button>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                      */}
      {/* ============================================================ */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 24px', maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={brandLogoUrl} alt="Arcus" style={{ height: 20, width: 20, borderRadius: 4, opacity: 0.6 }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Arcus  --  Open Source AI Interface</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="https://github.com/Azuzuly/Arcus" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >GitHub</a>
        </div>
      </footer>
    </div>
  );
}
