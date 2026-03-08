'use client';

import { useState } from 'react';

const FEATURES = [
  { emoji: '💬', title: '500+ AI Models', desc: 'GPT-5.4, Claude Opus 4, Gemini 3.1 Pro, DeepSeek, Llama 4, and hundreds more — all in one place.' },
  { emoji: '🎨', title: 'Studio', desc: 'Generate stunning images and videos with FLUX, DALL-E, and Stable Diffusion. Multiple styles and aspect ratios.' },
  { emoji: '🤖', title: 'Agent Builder', desc: 'Build powerful AI workflows with a visual drag-and-drop node editor. Connect models, data, and logic.' },
  { emoji: '⚡', title: 'Streaming Responses', desc: 'Watch AI think in real-time with live streaming. No waiting for complete responses.' },
  { emoji: '🔒', title: 'No API Keys Required', desc: 'Start chatting instantly. No sign-ups, no API keys, no credit cards. Powered by Puter.js.' },
  { emoji: '🌙', title: 'Beautiful Dark UI', desc: 'Glassmorphism design with aurora animations. Built for long sessions without eye strain.' },
];

const MODELS_PREVIEW = [
  { name: 'Claude Opus 4', provider: 'Anthropic', color: '#D97706' },
  { name: 'GPT-5.4', provider: 'OpenAI', color: '#10B981' },
  { name: 'Gemini 3.1 Pro', provider: 'Google', color: '#3B82F6' },
  { name: 'DeepSeek R1', provider: 'DeepSeek', color: '#8B5CF6' },
  { name: 'Llama 4 Maverick', provider: 'Meta', color: '#EC4899' },
  { name: 'Grok 3', provider: 'xAI', color: '#EF4444' },
  { name: 'Qwen 3.5', provider: 'Alibaba', color: '#14B8A6' },
  { name: 'Mistral Large 2', provider: 'Mistral', color: '#F59E0B' },
];

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div style={{
      minHeight: '100vh', background: '#050505', color: '#fff',
      fontFamily: "'Geist', -apple-system, sans-serif", overflowX: 'hidden', overflowY: 'auto',
    }}>
      {/* Aurora bg */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-30%', left: '10%', width: '80%', height: '60%',
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
          filter: 'blur(80px)', animation: 'aurora 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: '-10%', width: '50%', height: '50%',
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)',
          filter: 'blur(100px)', animation: 'aurora 15s ease-in-out infinite reverse',
        }} />
      </div>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', maxWidth: 1200, margin: '0 auto',
        background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#3B82F6', fontSize: 24 }}>◆</span>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>Arcus</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="#features" style={{ color: '#A1A1AA', fontSize: 14, textDecoration: 'none' }}>Features</a>
          <a href="#models" style={{ color: '#A1A1AA', fontSize: 14, textDecoration: 'none' }}>Models</a>
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
        padding: '120px 24px 80px', maxWidth: 900, margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px',
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 20, fontSize: 13, color: '#3B82F6', marginBottom: 32,
        }}>
          <span>✦</span> Now with 500+ AI models — completely free
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 700,
          letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 24,
          background: 'linear-gradient(135deg, #fff 0%, #A1A1AA 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          One workspace for<br />every AI model
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#A1A1AA',
          maxWidth: 600, lineHeight: 1.6, marginBottom: 48,
        }}>
          Chat with Claude, GPT-5, Gemini, and hundreds more. Generate images. Build AI agents.
          No API keys, no sign-ups — just start creating.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={onEnter} style={{
            padding: '16px 40px', background: '#3B82F6', border: 'none', borderRadius: 28,
            color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 0 40px rgba(59,130,246,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
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

      {/* Model ticker */}
      <section id="models" style={{
        position: 'relative', zIndex: 1, padding: '40px 0', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', gap: 12, animation: 'ticker 30s linear infinite',
          width: 'max-content',
        }}>
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
        padding: '80px 24px', maxWidth: 1100, margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Everything you need
          </h2>
          <p style={{ color: '#A1A1AA', fontSize: 16 }}>
            A complete AI workspace in your browser.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {FEATURES.map((f, i) => (
            <div key={i}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                padding: 28, borderRadius: 20,
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

      {/* CTA */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '80px 24px 120px', textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
          Ready to start?
        </h2>
        <p style={{ color: '#A1A1AA', fontSize: 16, marginBottom: 32 }}>
          No accounts. No API keys. Just AI.
        </p>
        <button onClick={onEnter} style={{
          padding: '16px 48px', background: '#3B82F6', border: 'none', borderRadius: 28,
          color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 0 40px rgba(59,130,246,0.3)',
        }}>
          Launch Arcus →
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 40px', maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#52525B', fontSize: 13 }}>
          <span style={{ color: '#3B82F6' }}>◆</span> Arcus — Built with ♥
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="https://github.com/Azuzuly/Arcus" target="_blank" rel="noopener" style={{ color: '#52525B', fontSize: 13, textDecoration: 'none' }}>GitHub</a>
        </div>
      </footer>
    </div>
  );
}
