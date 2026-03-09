/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { brandLogoUrl, getProviderLogo } from '@/lib/providerLogos';

const FEATURES = [
  { emoji: '💬', title: '500+ AI Models', desc: 'Access GPT-5.4, Claude Opus 4, Gemini 3.1 Pro, DeepSeek R1, Llama 4, Grok 3, and hundreds more — all from one unified interface. Switch between models mid-conversation.' },
  { emoji: '🎨', title: 'AI Studio', desc: 'Generate stunning images with FLUX, DALL-E, and Stable Diffusion. Create videos, upscale photos, and experiment with multiple art styles and aspect ratios.' },
  { emoji: '🤖', title: 'Agent Builder', desc: 'Design complex AI workflows visually. Drag and drop nodes, connect triggers to actions, chain multiple models together, and automate repetitive tasks.' },
  { emoji: '⚡', title: 'Real-time Streaming', desc: 'Watch AI responses appear word by word in real-time. No waiting for complete responses — start reading and reacting immediately.' },
  { emoji: '🔒', title: 'Privacy-First Design', desc: 'Your conversations stay yours. No training on your data, no logging beyond your session, no third-party trackers. Encrypted in transit and at rest.' },
  { emoji: '🌙', title: 'Liquid Glass UI', desc: 'A beautiful dark interface with glassmorphism effects, aurora animations, and smooth transitions. Designed for focus and long creative sessions.' },
];

const MODELS_PREVIEW = [
  { name: 'Claude Opus 4', provider: 'Anthropic', color: '#D97706' },
  { name: 'GPT-5.4', provider: 'OpenAI', color: '#10B981' },
  { name: 'Gemini 3.1 Pro', provider: 'Google', color: '#3B82F6' },
  { name: 'DeepSeek R1', provider: 'DeepSeek', color: '#8B5CF6' },
  { name: 'Llama 4 Maverick', provider: 'Meta', color: '#EC4899' },
  { name: 'Grok 3', provider: 'xAI', color: '#EF4444' },
  { name: 'Qwen 3.5', provider: 'Alibaba', color: '#14B8A6' },
  { name: 'Mistral Large', provider: 'Mistral', color: '#F59E0B' },
];

const USE_CASES = [
  { icon: '✍️', title: 'Writing & Content', desc: 'Draft launches, essays, docs, newsletters, and polished copy without losing your voice.' },
  { icon: '💻', title: 'Code & Debug', desc: 'Jump from idea to working code, multi-file bundles, and tool-assisted fixes in one surface.' },
  { icon: '📊', title: 'Analysis & Research', desc: 'Ask once, get live search, visual cards, sources, and compact tool traces when they actually matter.' },
  { icon: '🎓', title: 'Learning & Tutoring', desc: 'Beautiful math, clearer explanations, and richer examples for concepts that deserve more than plain text.' },
  { icon: '🧭', title: 'Plan & Navigate', desc: 'Weather, travel, maps, timezones, sports, markets, and conversions rendered as purpose-built answers.' },
  { icon: '🎨', title: 'Create & Iterate', desc: 'Images, style exploration, prompt refinement, and workspace personalization that feels premium.' },
];

const STATS = [
  { value: '500+', label: 'AI Models' },
  { value: '0', label: 'Data Sold' },
  { value: 'Live', label: 'Streaming Answers' },
  { value: '∞', label: 'Build Energy' },
];

const NAV_ITEMS = [
  { id: 'features', label: 'Features' },
  { id: 'models', label: 'Models' },
  { id: 'use-cases', label: 'Workflows' },
];

const FRAMEWORK_ICONS = ['react/x', 'nextjs/x', 'google/gemini', 'openai/gpt-4', 'anthropic/claude-3-opus', 'meta-llama/llama-3', 'mistralai/mistral-large'];

const HERO_PROMPTS = [
  'Build a premium client dashboard with auth, analytics cards, and billing settings.',
  'Plan a Tokyo trip with weather, timezone, and a 3-day itinerary.',
  'Explain the quadratic formula with clean math and a graph-ready example.',
];

const HERO_HEADLINES = [
  'Think deeper|Ship faster|Stay in flow',
  'Ask better|See richer answers|Move quicker',
  'Research live|Build visually|Keep momentum',
  'Write code|Solve math|Launch ideas',
];

export default function LandingPage({ onEnter }: { onEnter: (mode?: 'signup' | 'signin') => void }) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const headlineLines = useMemo(() => HERO_HEADLINES[headlineIndex].split('|'), [headlineIndex]);

  useEffect(() => {
    const headlineTimer = window.setInterval(() => {
      setHeadlineIndex(current => (current + 1) % HERO_HEADLINES.length);
    }, 3600);

    const promptTimer = window.setInterval(() => {
      setPromptIndex(current => (current + 1) % HERO_PROMPTS.length);
    }, 5200);

    const syncViewport = () => setIsMobile(window.innerWidth <= 820);
    syncViewport();
    window.addEventListener('resize', syncViewport);

    return () => {
      window.clearInterval(headlineTimer);
      window.clearInterval(promptTimer);
      window.removeEventListener('resize', syncViewport);
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const cyclePrompt = () => setPromptIndex(current => (current + 1) % HERO_PROMPTS.length);

  return (
    <div style={{
      height: '100vh', background: 'transparent', color: '#fff',
      fontFamily: "'Geist', -apple-system, sans-serif", overflowX: 'hidden', overflowY: 'auto',
    }}>
      {/* Night background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0e18 0%, #090c14 42%, #07090f 100%)' }} />
        <div style={{
          position: 'absolute', top: '-18%', left: '8%', width: '72%', height: '52%',
          background: 'radial-gradient(ellipse at center, rgba(61,100,171,0.12) 0%, rgba(32,57,103,0.05) 42%, transparent 72%)',
          filter: 'blur(74px)', animation: 'aurora 14s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '18%', right: '-8%', width: '48%', height: '48%',
          background: 'radial-gradient(ellipse at center, rgba(91,127,192,0.08) 0%, rgba(59,130,246,0.03) 40%, transparent 70%)',
          filter: 'blur(86px)', animation: 'aurora 17s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '26%', width: '58%', height: '44%',
          background: 'radial-gradient(ellipse at center, rgba(34,107,133,0.06) 0%, transparent 60%)',
          filter: 'blur(84px)', animation: 'aurora 18s ease-in-out infinite',
        }} />
        <div style={{ position: 'absolute', inset: 'auto 0 0 0', height: 180, background: 'linear-gradient(180deg, rgba(5,8,14,0) 0%, rgba(5,8,14,0.82) 38%, #04070c 100%)' }} />
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 170, opacity: 0.95 }}>
          <path d="M0 220 L0 136 L70 150 L118 98 L166 154 L224 92 L284 162 L332 116 L392 168 L456 102 L528 172 L612 92 L684 164 L762 108 L846 176 L930 94 L1006 166 L1088 112 L1170 178 L1248 118 L1332 170 L1440 140 L1440 220 Z" fill="#04060a" />
        </svg>
      </div>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between',
        gap: isMobile ? 12 : 18,
        padding: '16px clamp(16px, 4vw, 40px)', maxWidth: 1200, margin: '0 auto',
        background: 'rgba(8,10,16,0.66)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: isMobile ? 'stretch' : 'auto', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <img src={brandLogoUrl} alt="Arcus" style={{ width: 34, height: 34, objectFit: 'contain', display: 'block' }} />
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>Arcus</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
          width: isMobile ? '100%' : 'auto',
          padding: '6px', borderRadius: 999,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(3,7,18,0.28)',
        }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => scrollTo(item.id)} style={{
              padding: isMobile ? '9px 14px' : '10px 16px', background: 'transparent', border: 'none', color: '#C9D3F2', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 999,
            }}>{item.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          <button onClick={() => onEnter('signin')} style={{
            padding: '10px 18px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Sign in</button>
          <button onClick={() => onEnter('signup')} style={{
            padding: '10px 18px', background: '#F8FAFC', border: 'none', borderRadius: 999,
            color: '#0B1220', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Start free</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: 'clamp(58px, 8vw, 110px) 24px 42px', maxWidth: 1080, margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px',
          background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.22)',
          borderRadius: 999, fontSize: 13, color: '#D8B4FE', marginBottom: 26,
        }}>
          <span>✦</span> Synced chats, rich answers, better auth, calmer tool traces
        </div>
        <div className="privacy-shimmer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.12))',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 999, fontSize: 13, color: '#6EE7B7', marginBottom: 16, marginLeft: 10,
        }}>
          <span className="privacy-shield">🛡️</span> Privacy-first · No data training · Encrypted
        </div>
        <h1 style={{
          fontSize: 'clamp(44px, 7vw, 82px)', fontWeight: 800,
          letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 24,
          background: 'linear-gradient(180deg, #FFFFFF 0%, #D7E4FF 58%, #B6C8FF 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {headlineLines.map((line, index) => (
            <span key={line}>
              {line}
              {index < headlineLines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p style={{
          fontSize: 'clamp(15px, 2.5vw, 20px)', color: '#A1A1AA',
          maxWidth: 760, lineHeight: 1.7, marginBottom: 30,
        }}>
          Arcus is your polished AI cockpit for chat, research, math, images, live cards, and multi-file coding.
          Privacy-first by design — your data stays yours. Tuned for actual daily use instead of landing-page theater.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => onEnter('signup')} style={{
            padding: '16px 40px', background: '#3B82F6', border: 'none', borderRadius: 28,
            color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 0 40px rgba(59,130,246,0.3)', transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(59,130,246,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(59,130,246,0.3)'; }}>
            Start building →
          </button>
          <button onClick={() => onEnter('signin')} style={{
            padding: '16px 28px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 28, color: '#fff', fontSize: 17, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
            I already have an account
          </button>
        </div>

        <div style={{
          width: 'min(860px, 100%)', marginTop: 42, padding: '18px', borderRadius: 34,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 40px 120px rgba(3, 9, 23, 0.45)',
          backdropFilter: 'blur(24px)', textAlign: 'left',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
            padding: '4px 8px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FB7185' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FBBF24' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34D399' }} />
              <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.58)', fontSize: 13 }}>Arcus Workspace</span>
            </div>
            <div style={{ display: 'inline-flex', gap: 10, color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
              <span>Live search</span>
              <span>·</span>
              <span>Math</span>
              <span>·</span>
              <span>Artifact bundles</span>
            </div>
          </div>

          <div style={{
            borderRadius: 28, background: 'rgba(247,249,252,0.97)', minHeight: 180, padding: '24px 24px 18px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
          }}>
            <div style={{ color: '#94A3B8', fontSize: 15, marginBottom: 26 }}>Ask Arcus anything...</div>
            <div style={{ fontSize: 20, color: '#0F172A', fontWeight: 600, lineHeight: 1.6, maxWidth: 680 }}>
              {HERO_PROMPTS[promptIndex]}
            </div>
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Deep research', 'Weather cards', 'KaTeX math'].map(chip => (
                  <span key={chip} style={{
                    padding: '8px 12px', borderRadius: 999, background: 'rgba(15,23,42,0.05)', color: '#475569', fontSize: 13, fontWeight: 600,
                  }}>{chip}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={cyclePrompt} style={{
                  width: 42, height: 42, borderRadius: 999, border: '1px solid rgba(15,23,42,0.08)', background: '#fff', color: '#0F172A', cursor: 'pointer', fontSize: 18,
                }}>↻</button>
                <button onClick={() => onEnter('signup')} style={{
                  width: 42, height: 42, borderRadius: 999, border: 'none', background: '#94A3B8', color: '#fff',
                  cursor: 'pointer', fontSize: 18,
                }}>↑</button>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 14, borderRadius: 22, padding: '16px 18px', background: 'rgba(48,66,120,0.42)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', textAlign: 'center' }}>
              <div style={{ width: '100%' }}>
                <div style={{ color: '#BFD4FF', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Models & integrations</div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                  {FRAMEWORK_ICONS.map(modelId => {
                    const logo = getProviderLogo(modelId);
                    return logo ? <img key={modelId} src={logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain', opacity: 0.92 }} /> : null;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{
        position: 'relative', zIndex: 1,
        display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 4vw, 60px)',
        padding: '40px 24px', flexWrap: 'wrap',
      }}>
        {STATS.map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#fff' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#52525B', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Model ticker */}
      <section id="models" style={{ position: 'relative', zIndex: 1, padding: '60px 0 40px', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Powered by the best models</h2>
          <p style={{ color: '#A1A1AA', fontSize: 'clamp(14px, 1.5vw, 16px)' }}>Anthropic, OpenAI, Google, Meta, DeepSeek, Mistral, xAI, and more — all under one glass roof.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, animation: 'ticker 30s linear infinite', width: 'max-content' }}>
          {[...MODELS_PREVIEW, ...MODELS_PREVIEW, ...MODELS_PREVIEW].map((m, i) => (
            <div key={i} style={{
              padding: '10px 20px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            }}>
              {getProviderLogo(`${m.provider.toLowerCase()}/x`) ? (
                <img src={getProviderLogo(`${m.provider.toLowerCase()}/x`) || ''} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} />
              ) : (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
              )}
              <span style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</span>
              <span style={{ fontSize: 12, color: '#52525B' }}>{m.provider}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{
        position: 'relative', zIndex: 1,
        padding: 'clamp(40px, 6vw, 80px) 24px', maxWidth: 1100, margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Everything you need
          </h2>
          <p style={{ color: '#A1A1AA', fontSize: 'clamp(14px, 1.5vw, 16px)', maxWidth: 500, margin: '0 auto' }}>
            A calmer, smarter interface for asking, researching, building, and actually finishing things.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                padding: 'clamp(20px, 3vw, 28px)', borderRadius: 20,
                background: hoveredFeature === i ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${hoveredFeature === i ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.3s ease',
              }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.emoji}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#A1A1AA', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" style={{
        position: 'relative', zIndex: 1,
        padding: 'clamp(40px, 6vw, 80px) 24px', maxWidth: 1100, margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Built for every workflow
          </h2>
          <p style={{ color: '#A1A1AA', fontSize: 'clamp(14px, 1.5vw, 16px)' }}>
            Designed for the kinds of questions that deserve more than a plain paragraph.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 12 }}>
          {USE_CASES.map((u, i) => (
            <div key={i} style={{
              padding: '20px 24px', borderRadius: 16,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', gap: 16, alignItems: 'flex-start',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{u.icon}</span>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{u.title}</h4>
                <p style={{ color: '#A1A1AA', fontSize: 13, lineHeight: 1.5 }}>{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: 'clamp(40px, 6vw, 80px) 24px', maxWidth: 800, margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Three steps to start
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { step: '01', title: 'Create your account once', desc: 'Arcus now holds onto your session reliably, so reopening the site does not feel like a loyalty test.' },
            { step: '02', title: 'Ask with context', desc: 'Use live search, deep research, custom cards, math rendering, and smarter follow-up controls.' },
            { step: '03', title: 'Ship from one workspace', desc: 'Download file bundles, compare models, personalize the UI, and keep your conversations synced.' },
          ].map(s => (
            <div key={s.step} style={{
              display: 'flex', gap: 20, alignItems: 'flex-start',
              padding: '24px 28px', borderRadius: 16,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{
                fontSize: 32, fontWeight: 800, color: 'rgba(59,130,246,0.3)',
                fontFamily: 'monospace', flexShrink: 0, lineHeight: 1,
              }}>{s.step}</span>
              <div>
                <h4 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{s.title}</h4>
                <p style={{ color: '#A1A1AA', fontSize: 14, lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy commitment */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: 'clamp(40px, 6vw, 60px) 24px', maxWidth: 800, margin: '0 auto',
      }}>
        <div className="encrypt-sweep" style={{
          padding: 'clamp(28px, 4vw, 40px)', borderRadius: 24,
          background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 42, marginBottom: 16 }}>
            <span className="privacy-shield">🛡️</span>
          </div>
          <h3 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Your privacy is not a feature — it&apos;s the foundation
          </h3>
          <p style={{ color: '#A1A1AA', fontSize: 'clamp(13px, 1.5vw, 16px)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 20px' }}>
            Arcus never trains on your conversations. Your data is encrypted in transit, never sold to third parties,
            and your session is yours alone. We believe AI should serve you without surveilling you.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['No data training', 'Encrypted transit', 'No third-party trackers', 'Session isolation'].map(item => (
              <span key={item} className="privacy-badge">{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: 'clamp(60px, 8vw, 100px) 24px 80px', textAlign: 'center',
      }}>
        <div style={{
          maxWidth: 600, margin: '0 auto', padding: 'clamp(40px, 5vw, 60px)',
          borderRadius: 28, background: 'rgba(59,130,246,0.05)',
          border: '1px solid rgba(59,130,246,0.15)',
        }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Ready to start?
          </h2>
          <p style={{ color: '#A1A1AA', fontSize: 'clamp(14px, 1.5vw, 16px)', marginBottom: 32, lineHeight: 1.6 }}>
            Jump into a workspace that feels premium, stays signed in, and answers with more than just walls of text.
          </p>
          <button onClick={() => onEnter('signup')} style={{
            padding: '16px 48px', background: '#3B82F6', border: 'none', borderRadius: 28,
            color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 0 40px rgba(59,130,246,0.3)',
          }}>
            Launch Arcus →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px clamp(16px, 4vw, 40px)', maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#52525B', fontSize: 13 }}>
          <span style={{ color: '#3B82F6' }}>◆</span> Arcus — Intelligent AI Workspace · Privacy-first
        </div>
      </footer>
    </div>
  );
}
