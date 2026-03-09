'use client';

import { useState, useEffect, useRef } from 'react';
import { brandLogoUrl, getProviderLogo } from '@/lib/providerLogos';

/* ──────────────────────────────────────────
   DATA
   ────────────────────────────────────────── */

const MODELS = [
  'GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 2.0 Flash', 'Llama 3.3 70B',
  'DeepSeek R1', 'Mistral Large', 'Qwen 2.5 72B', 'Command R+',
  'GPT-4o Mini', 'Claude 3 Haiku', 'Gemini 1.5 Pro', 'Phi-3 Medium',
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Lightning Fast',
    desc: 'Stream responses in real-time from the fastest models available. No waiting, no buffering.',
  },
  {
    icon: '🔄',
    title: 'Any Model, One Place',
    desc: 'Switch between GPT-4o, Claude, Gemini, Llama, and 200+ models without switching tabs.',
  },
  {
    icon: '🎨',
    title: 'AI Image Studio',
    desc: 'Generate stunning images with DALL-E, Stable Diffusion, and Flux right inside the app.',
  },
  {
    icon: '🤖',
    title: 'Custom Agents',
    desc: 'Build specialized AI agents with custom system prompts and model preferences for any task.',
  },
  {
    icon: '🌐',
    title: 'Web Search Built-in',
    desc: 'AI answers grounded in real-time web results. No more outdated knowledge cutoffs.',
  },
  {
    icon: '🔒',
    title: 'Private & Secure',
    desc: 'Your conversations stay on your device. No tracking, no data collection, no compromises.',
  },
];

const STATS = [
  { value: '200+', label: 'AI Models' },
  { value: '0ms', label: 'Data Collection' },
  { value: '100%', label: 'Free & Open' },
  { value: '∞', label: 'Conversations' },
];

/* ──────────────────────────────────────────
   DECORATIVE SHAPES COMPONENT
   ────────────────────────────────────────── */

function BackgroundShapes() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Large gradient orb top-right */}
      <div
        style={{
          position: 'absolute',
          top: '-5%',
          right: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)',
          animation: 'float-slow 20s ease-in-out infinite',
        }}
      />
      {/* Violet orb left */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '-8%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155,109,247,0.06) 0%, transparent 70%)',
          animation: 'float-slow 25s ease-in-out infinite reverse',
        }}
      />
      {/* Teal orb mid-right */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          right: '5%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)',
          animation: 'float-slow 18s ease-in-out infinite',
          animationDelay: '-5s',
        }}
      />

      {/* Geometric shapes */}
      {/* Diamond 1 */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '15%',
          width: 60,
          height: 60,
          transform: 'rotate(45deg)',
          border: '1px solid rgba(79,142,247,0.1)',
          borderRadius: 4,
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      {/* Diamond 2 */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          right: '12%',
          width: 40,
          height: 40,
          transform: 'rotate(45deg)',
          border: '1px solid rgba(155,109,247,0.08)',
          borderRadius: 3,
          animation: 'float 10s ease-in-out infinite reverse',
        }}
      />

      {/* Circle outlines */}
      <div
        style={{
          position: 'absolute',
          top: '60%',
          left: '8%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: '1px solid rgba(56,189,248,0.07)',
          animation: 'float 12s ease-in-out infinite',
          animationDelay: '-3s',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '80%',
          right: '18%',
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: '1px solid rgba(79,142,247,0.06)',
          animation: 'float 9s ease-in-out infinite',
          animationDelay: '-7s',
        }}
      />

      {/* Hexagon */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '75%',
          width: 70,
          height: 70,
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          background: 'rgba(155,109,247,0.04)',
          border: 'none',
          animation: 'rotate-slow 40s linear infinite',
        }}
      />

      {/* Small dots scattered */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${10 + (i * 7.5) % 80}%`,
            left: `${5 + ((i * 13 + 20) % 90)}%`,
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: `rgba(${i % 3 === 0 ? '79,142,247' : i % 3 === 1 ? '155,109,247' : '56,189,248'}, ${0.08 + (i % 4) * 0.03})`,
            animation: `pulse-glow ${3 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* Subtle grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 30%, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 30%, black 20%, transparent 70%)',
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────
   MODEL TICKER
   ────────────────────────────────────────── */

function ModelTicker() {
  const doubled = [...MODELS, ...MODELS, ...MODELS];
  return (
    <div className="ticker-wrapper" style={{ width: '100%', padding: '20px 0' }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          animation: 'ticker 40s linear infinite',
          width: 'max-content',
        }}
      >
        {doubled.map((model, i) => (
          <div
            key={i}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius-pill)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ opacity: 0.6, fontSize: 11 }}>●</span>
            {model}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   MAIN LANDING PAGE
   ────────────────────────────────────────── */

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      className="landing-page"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #080a12 0%, #0c0e1a 40%, #10121f 70%, #080a12 100%)',
      }}
    >
      <BackgroundShapes />

      {/* ── Navigation ── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          background: 'rgba(8,10,18,0.7)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={brandLogoUrl}
            alt="Arcus"
            style={{ width: 28, height: 28, borderRadius: 6 }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Arcus
          </span>
        </div>
        <button
          onClick={onEnter}
          style={{
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s var(--ease-out)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          Open App →
        </button>
      </nav>

      {/* ── Content Container ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 24px',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        {/* ── HERO ── */}
        <section
          className="landing-section"
          style={{
            textAlign: 'center',
            paddingTop: 80,
            paddingBottom: 48,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(79,142,247,0.08)',
              border: '1px solid rgba(79,142,247,0.15)',
              fontSize: 12,
              color: 'var(--accent-blue)',
              fontWeight: 500,
              marginBottom: 24,
              letterSpacing: '0.02em',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 8px var(--accent-blue)' }} />
            Free & Open Source — No Account Required
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: 20,
              color: 'var(--text-primary)',
            }}
          >
            Every AI Model.
            <br />
            <span className="gradient-text">One Beautiful Interface.</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(16px, 2.5vw, 19px)',
              color: 'var(--text-secondary)',
              maxWidth: 580,
              margin: '0 auto 36px',
              lineHeight: 1.6,
            }}
          >
            Chat with GPT-4o, Claude, Gemini, Llama, and 200+ models through a single,
            beautifully crafted interface. No signups, no API keys, completely free.
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 14,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button className="cta-button" onClick={onEnter}>
              Start Chatting
            </button>
            <a
              href="https://github.com/Azuzuly/Arcus"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '14px 28px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: 16,
                fontWeight: 500,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s var(--ease-out)',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </section>

        {/* ── MODEL TICKER ── */}
        <section className="landing-section" style={{ paddingBottom: 48 }}>
          <ModelTicker />
        </section>

        {/* ── STATS ── */}
        <section
          className="landing-section"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
            paddingBottom: 80,
          }}
        >
          {STATS.map((s) => (
            <div className="stat-card" key={s.label}>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--accent-blue)',
                  marginBottom: 4,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </section>

        {/* ── FEATURES ── */}
        <section className="landing-section" style={{ paddingBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: 12,
              }}
            >
              Built Different
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 16,
                maxWidth: 480,
                margin: '0 auto',
              }}
            >
              Every detail is crafted for the best AI experience.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div
                  style={{
                    fontSize: 28,
                    marginBottom: 14,
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(79,142,247,0.08)',
                    border: '1px solid rgba(79,142,247,0.1)',
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: 'var(--text-primary)',
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="landing-section" style={{ paddingBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: 12,
              }}
            >
              Get Started in Seconds
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
              No downloads, no signups, no API keys.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 24,
            }}
          >
            {[
              { step: '01', title: 'Open Arcus', desc: 'Visit the app in your browser. Works on desktop, tablet, and mobile.' },
              { step: '02', title: 'Pick a Model', desc: 'Choose from 200+ AI models from OpenAI, Anthropic, Google, Meta, and more.' },
              { step: '03', title: 'Start Creating', desc: 'Chat, generate images, build agents, and search the web — all in one place.' },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  padding: 28,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--glass-card)',
                  border: '1px solid var(--glass-border)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: 'rgba(79,142,247,0.1)',
                    lineHeight: 1,
                    marginBottom: 12,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {item.step}
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section
          className="landing-section"
          style={{
            textAlign: 'center',
            paddingTop: 40,
            paddingBottom: 80,
          }}
        >
          <div
            style={{
              padding: '56px 32px',
              borderRadius: 'var(--radius-2xl)',
              background: 'linear-gradient(135deg, rgba(79,142,247,0.08), rgba(155,109,247,0.06), rgba(56,189,248,0.04))',
              border: '1px solid rgba(79,142,247,0.12)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Accent glow behind CTA */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(79,142,247,0.1), transparent 60%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />
            <h2
              style={{
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: 12,
                position: 'relative',
              }}
            >
              Ready to experience AI differently?
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 16,
                marginBottom: 28,
                position: 'relative',
              }}
            >
              Join thousands who use Arcus as their daily AI companion.
            </p>
            <button
              className="cta-button"
              onClick={onEnter}
              style={{ position: 'relative' }}
            >
              Launch Arcus →
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer
          style={{
            textAlign: 'center',
            padding: '32px 0',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src={brandLogoUrl}
              alt="Arcus"
              style={{ width: 20, height: 20, borderRadius: 4, opacity: 0.6 }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Arcus — Open Source AI Interface
            </span>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a
              href="https://github.com/Azuzuly/Arcus"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              GitHub
            </a>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Powered by Puter</span>
          </div>
        </footer>
      </div>
    </div>
  );
}