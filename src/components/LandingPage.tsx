'use client';

import { useState } from 'react';

const FEATURES = [
  { emoji: '💬', title: '500+ AI Models', desc: 'Access GPT-5.4, Claude Opus 4, Gemini 3.1 Pro, DeepSeek R1, Llama 4, Grok 3, and hundreds more — all from one unified interface. Switch between models mid-conversation.' },
  { emoji: '🎨', title: 'AI Studio', desc: 'Generate stunning images with FLUX, DALL-E, and Stable Diffusion. Create videos, upscale photos, and experiment with multiple art styles and aspect ratios.' },
  { emoji: '🤖', title: 'Agent Builder', desc: 'Design complex AI workflows visually. Drag and drop nodes, connect triggers to actions, chain multiple models together, and automate repetitive tasks.' },
  { emoji: '⚡', title: 'Real-time Streaming', desc: 'Watch AI responses appear word by word in real-time. No waiting for complete responses — start reading and reacting immediately.' },
  { emoji: '🔒', title: 'Zero Configuration', desc: 'No API keys, no accounts, no credit cards. Open the app and start chatting instantly. Your conversations stay in your browser.' },
  { emoji: '🌙', title: 'Focused Night Workspace', desc: 'A refined dark interface designed for long sessions, quick scanning, and less visual noise.' },
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
  { icon: '✍️', title: 'Writing & Content', desc: 'Draft emails, blog posts, essays, stories, and marketing copy with AI assistance.' },
  { icon: '💻', title: 'Code & Debug', desc: 'Write, review, and debug code in any language. Get explanations and optimizations.' },
  { icon: '📊', title: 'Analysis & Research', desc: 'Summarize documents, analyze data, extract insights, and conduct deep research.' },
  { icon: '🎓', title: 'Learning & Tutoring', desc: 'Get personalized explanations, practice problems, and study materials on any topic.' },
  { icon: '💡', title: 'Brainstorming', desc: 'Generate ideas, explore concepts, plan projects, and get creative inspiration.' },
  { icon: '🌐', title: 'Translation', desc: 'Translate between 100+ languages with context-aware, natural-sounding results.' },
];

const STATS = [
  { value: '500+', label: 'AI Models' },
  { value: '0', label: 'Cost to Start' },
  { value: '<1s', label: 'Response Time' },
  { value: '∞', label: 'Possibilities' },
];

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{
      height: '100vh', background: '#050505', color: '#fff',
      fontFamily: "'Geist', -apple-system, sans-serif", overflowX: 'hidden', overflowY: 'auto',
    }}>
      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-30%', left: '10%', width: '80%', height: '60%',
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.03) 42%, transparent 72%)',
          filter: 'blur(80px)', animation: 'aurora 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: '-10%', width: '50%', height: '50%',
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.05) 0%, rgba(59,130,246,0.02) 40%, transparent 70%)',
          filter: 'blur(100px)', animation: 'aurora 15s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '30%', width: '60%', height: '50%',
          background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.06) 0%, transparent 60%)',
          filter: 'blur(90px)', animation: 'aurora 18s ease-in-out infinite',
        }} />
      </div>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px clamp(16px, 4vw, 40px)', maxWidth: 1200, margin: '0 auto',
        background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#3B82F6', fontSize: 24 }}>◆</span>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>Arcus</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 24px)' }}>
          <button onClick={() => scrollTo('features')} style={{ background: 'none', border: 'none', color: '#A1A1AA', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Features</button>
          <button onClick={() => scrollTo('models')} style={{ background: 'none', border: 'none', color: '#A1A1AA', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Models</button>
          <button onClick={() => scrollTo('use-cases')} style={{ background: 'none', border: 'none', color: '#A1A1AA', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Use Cases</button>
          <button onClick={onEnter} style={{
            padding: '8px 24px', background: '#3B82F6', border: 'none', borderRadius: 20,
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Launch App</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: 'clamp(60px, 10vw, 120px) 24px 60px', maxWidth: 900, margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px',
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 20, fontSize: 13, color: '#3B82F6', marginBottom: 32,
        }}>
          <span>✦</span> 500+ AI models — completely free
        </div>
        <h1 style={{
          fontSize: 'clamp(36px, 7vw, 72px)', fontWeight: 700,
          letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 24,
          color: '#F5F7FB',
        }}>
          One workspace for<br />every AI model
        </h1>
        <p style={{
          fontSize: 'clamp(15px, 2.5vw, 20px)', color: '#A1A1AA',
          maxWidth: 600, lineHeight: 1.6, marginBottom: 48,
        }}>
          Chat with Claude, GPT-5, Gemini, and hundreds more. Generate images. Build AI agents.
          No API keys, no sign-ups — just start creating.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={onEnter} style={{
            padding: '16px 40px', background: '#3B82F6', border: 'none', borderRadius: 28,
            color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 0 40px rgba(59,130,246,0.3)', transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(59,130,246,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(59,130,246,0.3)'; }}>
            Start Chatting — It&apos;s Free
          </button>
          <a href="https://github.com/Azuzuly/Arcus" target="_blank" rel="noopener" style={{
            padding: '16px 32px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 28, color: '#fff', fontSize: 17, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
            GitHub ↗
          </a>
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
          <p style={{ color: '#A1A1AA', fontSize: 'clamp(14px, 1.5vw, 16px)' }}>From every major AI provider, updated continuously.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, animation: 'ticker 30s linear infinite', width: 'max-content' }}>
          {[...MODELS_PREVIEW, ...MODELS_PREVIEW, ...MODELS_PREVIEW].map((m, i) => (
            <div key={i} style={{
              padding: '10px 20px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
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
            A complete AI workspace — chat, create, and automate, all from your browser.
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
            Whatever you&apos;re working on, Arcus has you covered.
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
            { step: '01', title: 'Open Arcus', desc: 'No sign-ups, no downloads. Just open the app in your browser and you\'re ready.' },
            { step: '02', title: 'Choose your model', desc: 'Pick from 500+ AI models across all major providers. Switch freely anytime.' },
            { step: '03', title: 'Start creating', desc: 'Chat, generate images, build agents — the entire AI ecosystem at your fingertips.' },
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
            No accounts. No API keys. No costs.<br />Just open and create.
          </p>
          <button onClick={onEnter} style={{
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
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#52525B', fontSize: 13 }}>
          <span style={{ color: '#3B82F6' }}>◆</span> Arcus — Open Source AI Workspace
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="https://github.com/Azuzuly/Arcus" target="_blank" rel="noopener" style={{ color: '#52525B', fontSize: 13, textDecoration: 'none' }}>GitHub</a>
        </div>
      </footer>
    </div>
  );
}
