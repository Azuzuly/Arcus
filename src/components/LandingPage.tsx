/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useRef, useState } from 'react';
import { brandLogoUrl, getProviderLogo } from '@/lib/providerLogos';

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '🧠',
    title: '500+ AI Models',
    desc: 'Access GPT-5.4, Claude Opus 4, Gemini 3.1 Pro, DeepSeek R1, Llama 4, Grok 3, and hundreds more — all from one unified interface. Switch between models mid-conversation.',
    accent: '#5B8AF0',
    glow: 'rgba(91,138,240,0.20)',
  },
  {
    icon: '🎨',
    title: 'AI Studio',
    desc: 'Generate stunning images with FLUX, DALL-E, and Stable Diffusion. Create videos, upscale photos, and experiment with multiple art styles and aspect ratios.',
    accent: '#9B6DFF',
    glow: 'rgba(155,109,255,0.18)',
  },
  {
    icon: '🤖',
    title: 'Agent Builder',
    desc: 'Design complex AI workflows visually. Drag and drop nodes, connect triggers to actions, chain multiple models together, and automate repetitive tasks.',
    accent: '#4DD9E8',
    glow: 'rgba(77,217,232,0.18)',
  },
  {
    icon: '⚡',
    title: 'Real-time Streaming',
    desc: 'Watch AI responses appear word by word in real-time. No waiting for complete responses — start reading and reacting immediately.',
    accent: '#C1FF72',
    glow: 'rgba(193,255,114,0.15)',
  },
  {
    icon: '🔒',
    title: 'Account-Gated Security',
    desc: 'Create an account once, keep your identity consistent, and unlock the full Arcus workspace with synced preferences and conversation history.',
    accent: '#E7A65A',
    glow: 'rgba(231,166,90,0.18)',
  },
  {
    icon: '🌙',
    title: 'Liquid Glass UI',
    desc: 'A beautiful dark interface with glassmorphism effects, aurora animations, and smooth transitions. Designed for focus and long creative sessions.',
    accent: '#5B8AF0',
    glow: 'rgba(91,138,240,0.18)',
  },
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

const STATS = [
  { value: '500+', label: 'AI Models' },
  { value: '0', label: 'Cost to Start' },
  { value: '<1s', label: 'Response Time' },
  { value: '∞', label: 'Conversations' },
];

const TESTIMONIALS = [
  {
    quote: "Arcus replaced four different AI subscriptions for me. Having every model in one place with this level of polish is unreal.",
    name: "Alex Chen",
    role: "Senior Engineer @ Stripe",
    avatar: "AC",
    accent: "#5B8AF0",
  },
  {
    quote: "The deep research mode is insane. I gave it a topic and it came back with a 20-page report in under two minutes.",
    name: "Sarah Kim",
    role: "Research Lead @ Anthropic",
    avatar: "SK",
    accent: "#9B6DFF",
  },
  {
    quote: "I use the Agent Builder to automate my entire content pipeline. What took 3 hours now takes 5 minutes.",
    name: "Marcus Rivera",
    role: "Founder, ContentFlow",
    avatar: "MR",
    accent: "#4DD9E8",
  },
  {
    quote: "The UI is stunning. I actually look forward to opening Arcus every morning. It feels like a premium product.",
    name: "Priya Patel",
    role: "Product Designer @ Figma",
    avatar: "PP",
    accent: "#C1FF72",
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create your account',
    desc: 'Sign up in seconds with Google, GitHub, or email. Your workspace syncs across all your devices instantly.',
    icon: '✦',
  },
  {
    step: '02',
    title: 'Choose your model',
    desc: 'Browse 500+ models or let Arcus recommend the best one for your task. Switch any time mid-conversation.',
    icon: '◈',
  },
  {
    step: '03',
    title: 'Start creating',
    desc: 'Chat, research, generate images, build agents — your entire AI workflow in one beautiful interface.',
    icon: '◉',
  },
];

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function HeroBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {/* Deep void base */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, #050710 0%, #070916 40%, #060810 100%)',
      }} />

      {/* Ambient top-left nebula */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '70%', height: '70%',
        background: 'radial-gradient(ellipse at center, rgba(60,90,200,0.14) 0%, rgba(40,60,160,0.06) 45%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'aurora 18s ease-in-out infinite',
        borderRadius: '50%',
      }} />

      {/* Ambient top-right nebula */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: '55%', height: '60%',
        background: 'radial-gradient(ellipse at center, rgba(100,60,200,0.11) 0%, rgba(80,40,160,0.05) 42%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'aurora 22s ease-in-out infinite reverse',
        borderRadius: '50%',
      }} />

      {/* Bottom glow */}
      <div style={{
        position: 'absolute', bottom: 0, left: '20%',
        width: '60%', height: '40%',
        background: 'radial-gradient(ellipse at center, rgba(50,80,180,0.09) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'aurora 26s ease-in-out infinite',
        borderRadius: '50%',
      }} />

      {/* Subtle star field */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.90) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.60) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.40) 1px, transparent 1px)
        `,
        backgroundSize: '280px 280px, 180px 180px, 120px 120px',
        backgroundPosition: '0 0, 90px 90px, 40px 140px',
        opacity: 0.25,
      }} />

      {/* Horizon gradient fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
        background: 'linear-gradient(to top, rgba(5,7,16,0.95) 0%, transparent 100%)',
      }} />
    </div>
  );
}

function GradientText({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      background: 'linear-gradient(135deg, #A0BFFF 0%, #C4A0FF 50%, #80DCFF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      ...style,
    }}>
      {children}
    </span>
  );
}

function StatCard({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <div
      className="reveal glass-card"
      style={{
        transitionDelay: `${delay}ms`,
        padding: '28px 24px',
        textAlign: 'center',
        borderRadius: 'var(--radius-lg)',
        flex: 1,
        minWidth: 120,
      }}
    >
      <div style={{
        fontSize: 36,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        marginBottom: 8,
        background: 'linear-gradient(135deg, #A0BFFF 0%, #C4A0FF 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="reveal gradient-border"
      style={{
        transitionDelay: `${(index % 3) * 80}ms`,
        padding: '28px 24px',
        borderRadius: 'var(--radius-lg)',
        background: hovered
          ? `rgba(255,255,255,0.07)`
          : 'var(--glass-card)',
        backdropFilter: 'var(--blur-md)',
        WebkitBackdropFilter: 'var(--blur-md)',
        border: '1px solid',
        borderColor: hovered ? feature.accent + '44' : 'var(--glass-border)',
        boxShadow: hovered
          ? `0 8px 40px rgba(0,0,0,0.50), 0 0 40px ${feature.glow}`
          : 'var(--shadow-card)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 220ms var(--ease-out)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Shimmer top edge */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${feature.accent}66, transparent)`,
        }} />
      )}
      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 'var(--radius-md)',
        background: hovered ? `${feature.accent}18` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${hovered ? feature.accent + '33' : 'rgba(255,255,255,0.07)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, marginBottom: 16,
        transition: 'all 220ms var(--ease-out)',
        boxShadow: hovered ? `0 0 20px ${feature.glow}` : 'none',
      }}>
        {feature.icon}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
        {feature.title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {feature.desc}
      </div>
    </div>
  );
}

function TestimonialCard({ t, delay }: { t: typeof TESTIMONIALS[0]; delay: number }) {
  return (
    <div
      className="reveal glass-card"
      style={{
        transitionDelay: `${delay}ms`,
        padding: '28px',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Quote mark */}
      <div style={{
        fontSize: 48, lineHeight: 1, color: t.accent,
        opacity: 0.40, fontFamily: 'Georgia, serif',
        marginBottom: 4,
      }}>&ldquo;</div>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: 20 }}>
        {t.quote}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `${t.accent}22`,
          border: `1px solid ${t.accent}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: t.accent,
          flexShrink: 0,
        }}>
          {t.avatar}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}

function ModelPill({ model }: { model: typeof MODELS_PREVIEW[0] }) {
  const [hovered, setHovered] = useState(false);
  const logoUrl = getProviderLogo(model.provider);
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        borderRadius: 'var(--radius-pill)',
        background: hovered ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${hovered ? model.color + '44' : 'rgba(255,255,255,0.08)'}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'all 180ms var(--ease-out)',
        cursor: 'default',
        boxShadow: hovered ? `0 4px 20px ${model.color}22` : 'none',
        flexShrink: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={model.provider} width={16} height={16} style={{ borderRadius: 4, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 16, height: 16, borderRadius: 4, background: model.color + '44', flexShrink: 0 }} />
      )}
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
        {model.name}
      </span>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: model.color,
        boxShadow: `0 0 6px ${model.color}`,
        flexShrink: 0,
      }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  useScrollReveal();
  const [navScrolled, setNavScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setNavScrolled(el.scrollTop > 30);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  return (
    <div
      ref={scrollRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollBehavior: 'smooth',
      }}
    >
      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: 60,
        background: navScrolled
          ? 'rgba(8,10,16,0.85)'
          : 'rgba(8,10,16,0.40)',
        backdropFilter: navScrolled ? 'blur(24px) saturate(180%)' : 'blur(12px)',
        WebkitBackdropFilter: navScrolled ? 'blur(24px) saturate(180%)' : 'blur(12px)',
        borderBottom: navScrolled
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid transparent',
        boxShadow: navScrolled ? '0 4px 32px rgba(0,0,0,0.30)' : 'none',
        transition: 'all 320ms var(--ease-out)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30,
            borderRadius: 9,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 0 16px rgba(91,138,240,0.25)',
            flexShrink: 0,
          }}>
            <img src={brandLogoUrl} alt="Arcus" width={30} height={30} style={{ display: 'block' }} />
          </div>
          <span style={{
            fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
          }}>Arcus</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {['Features', 'Models', 'Pricing'].map((item) => (
            <button
              key={item}
              style={{
                padding: '6px 14px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                borderRadius: 'var(--radius-sm)',
                transition: 'color 150ms ease, background 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onGetStarted}
          style={{
            padding: '8px 20px',
            background: 'linear-gradient(135deg, #5B8AF0, #3B6EE0)',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 2px 12px rgba(91,138,240,0.35)',
            transition: 'all 150ms var(--ease-out)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(91,138,240,0.50)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(91,138,240,0.35)';
          }}
        >
          Get Started
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        <HeroBackground />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 780, width: '100%' }}>
          {/* Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div
              className="pill pill-blue fade-in"
              style={{ animationDelay: '0ms' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5B8AF0', boxShadow: '0 0 8px #5B8AF0', display: 'inline-block' }} />
              500+ AI Models &bull; One Interface
            </div>
          </div>

          {/* Headline */}
          <h1
            className="fade-in"
            style={{
              fontSize: 'clamp(40px, 7vw, 80px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.08,
              marginBottom: 24,
              color: 'var(--text-primary)',
              animationDelay: '80ms',
            }}
          >
            The AI workspace<br />
            <GradientText>built for depth</GradientText>
          </h1>

          {/* Subheadline */}
          <p
            className="fade-in"
            style={{
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              maxWidth: 560,
              margin: '0 auto 40px',
              animationDelay: '160ms',
            }}
          >
            Chat, research, create, and automate with the world&apos;s most advanced AI models — all in one liquid-glass interface designed for serious work.
          </p>

          {/* CTAs */}
          <div
            className="fade-in"
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
              animationDelay: '240ms',
            }}
          >
            <button
              onClick={onGetStarted}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #5B8AF0 0%, #9B6DFF 100%)',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 24px rgba(91,138,240,0.45), 0 0 60px rgba(91,138,240,0.15), inset 0 1px 0 rgba(255,255,255,0.20)',
                transition: 'all 180ms var(--ease-out)',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = 'translateY(-2px) scale(1.02)';
                b.style.boxShadow = '0 8px 40px rgba(91,138,240,0.55), 0 0 80px rgba(91,138,240,0.20), inset 0 1px 0 rgba(255,255,255,0.25)';
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = 'translateY(0) scale(1)';
                b.style.boxShadow = '0 4px 24px rgba(91,138,240,0.45), 0 0 60px rgba(91,138,240,0.15), inset 0 1px 0 rgba(255,255,255,0.20)';
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(0.98)';
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.02)';
              }}
            >
              Start for free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px',
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-primary)',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 180ms var(--ease-out)',
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.background = 'rgba(255,255,255,0.12)';
                b.style.borderColor = 'rgba(255,255,255,0.22)';
                b.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.background = 'rgba(255,255,255,0.07)';
                b.style.borderColor = 'rgba(255,255,255,0.12)';
                b.style.transform = 'translateY(0)';
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
              </svg>
              Watch demo
            </button>
          </div>

          {/* Social proof micro-line */}
          <div
            className="fade-in"
            style={{
              marginTop: 32,
              fontSize: 12,
              color: 'var(--text-muted)',
              animationDelay: '320ms',
            }}
          >
            Trusted by engineers, researchers, and creators worldwide &bull; No credit card required
          </div>
        </div>

        {/* Model pills row */}
        <div
          className="fade-in"
          style={{
            position: 'relative', zIndex: 1,
            marginTop: 64,
            width: '100%',
            maxWidth: 900,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 8,
            animationDelay: '400ms',
          }}
        >
          {MODELS_PREVIEW.map((m) => (
            <ModelPill key={m.name} model={m} />
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{
        padding: '64px 24px',
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          {STATS.map((s, i) => (
            <StatCard key={s.label} value={s.value} label={s.label} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Section header */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <span className="pill pill-violet">Capabilities</span>
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4.5vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            marginBottom: 16,
          }}>
            Everything in one <GradientText>glass interface</GradientText>
          </h2>
          <p style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            maxWidth: 480,
            margin: '0 auto',
            lineHeight: 1.65,
          }}>
            Arcus combines every AI capability you need into a single, intentionally designed workspace.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <span className="pill pill-blue">Getting Started</span>
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4.5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
          }}>
            Up and running in <GradientText>60 seconds</GradientText>
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20,
          position: 'relative',
        }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div
              key={step.step}
              className="reveal glass-card"
              style={{
                transitionDelay: `${i * 100}ms`,
                padding: '32px 28px',
                borderRadius: 'var(--radius-lg)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Step number — large background watermark */}
              <div style={{
                position: 'absolute', top: 12, right: 20,
                fontSize: 72, fontWeight: 900,
                color: 'rgba(255,255,255,0.03)',
                lineHeight: 1,
                userSelect: 'none',
                letterSpacing: '-0.05em',
              }}>
                {step.step}
              </div>
              <div style={{
                fontSize: 28, marginBottom: 16,
                width: 48, height: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(91,138,240,0.10)',
                border: '1px solid rgba(91,138,240,0.18)',
                color: 'var(--accent-blue)',
              }}>
                {step.icon}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                {step.title}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <span className="pill">Testimonials</span>
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4.5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
          }}>
            Loved by <GradientText>power users</GradientText>
          </h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} t={t} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ padding: '80px 24px 120px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div
          className="reveal"
          style={{
            padding: '64px 48px',
            borderRadius: 'var(--radius-3xl)',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.50), 0 0 0 1px rgba(91,138,240,0.06), inset 0 1px 0 rgba(255,255,255,0.07)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* CTA background glow */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: 'radial-gradient(ellipse 80% 60% at 50% 120%, rgba(91,138,240,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <span className="pill pill-blue">Free to start</span>
            </div>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.12,
              color: 'var(--text-primary)',
              marginBottom: 16,
            }}>
              Ready to work with the <GradientText>best AI</GradientText>?
            </h2>
            <p style={{
              fontSize: 16, color: 'var(--text-secondary)',
              lineHeight: 1.65, maxWidth: 440, margin: '0 auto 36px',
            }}>
              Join thousands of creators, engineers, and researchers who use Arcus as their primary AI workspace.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={onGetStarted}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 36px',
                  background: 'linear-gradient(135deg, #5B8AF0 0%, #9B6DFF 100%)',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 24px rgba(91,138,240,0.45), inset 0 1px 0 rgba(255,255,255,0.20)',
                  transition: 'all 180ms var(--ease-out)',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.transform = 'translateY(-2px) scale(1.02)';
                  b.style.boxShadow = '0 8px 40px rgba(91,138,240,0.55), inset 0 1px 0 rgba(255,255,255,0.25)';
                }}
                onMouseLeave={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.transform = 'translateY(0) scale(1)';
                  b.style.boxShadow = '0 4px 24px rgba(91,138,240,0.45), inset 0 1px 0 rgba(255,255,255,0.20)';
                }}
              >
                Create free account
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
              No credit card required &bull; Start in 30 seconds
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '40px 32px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,6,8,0.60)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.10)',
            }}>
              <img src={brandLogoUrl} alt="Arcus" width={24} height={24} style={{ display: 'block' }} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>Arcus</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {['Privacy', 'Terms', 'Status', 'Docs', 'GitHub'].map((item) => (
              <a
                key={item}
                href="#"
                style={{
                  fontSize: 13, color: 'var(--text-muted)',
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {item}
              </a>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} Arcus. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
