'use client';

import { useStore } from '@/lib/store';

export default function AuroraBackground() {
  const { state } = useStore();
  const bgImage = state.settings?.backgroundImage || '';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {/* Custom bg image */}
      {bgImage && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.18,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,6,10,0.40) 0%, rgba(5,6,10,0.90) 100%)' }} />
        </div>
      )}

      {/* Deep void base */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, #080a14 0%, #060810 45%, #050709 100%)',
      }} />

      {/* === AURORA LAYERS === */}

      {/* Primary: top-left blue-indigo nebula */}
      <div style={{
        position: 'absolute',
        top: '-22%', left: '-8%',
        width: '58%', height: '60%',
        background: 'radial-gradient(ellipse at center, rgba(55,85,195,0.18) 0%, rgba(38,62,148,0.09) 42%, transparent 70%)',
        filter: 'blur(56px)',
        animation: 'aurora 18s ease-in-out infinite',
        borderRadius: '50%',
        willChange: 'transform',
      }} />

      {/* Secondary: top-right violet */}
      <div style={{
        position: 'absolute',
        top: '-8%', right: '-4%',
        width: '48%', height: '52%',
        background: 'radial-gradient(ellipse at center, rgba(88,55,185,0.14) 0%, rgba(60,35,130,0.07) 44%, transparent 72%)',
        filter: 'blur(72px)',
        animation: 'aurora 22s ease-in-out infinite reverse',
        borderRadius: '50%',
        willChange: 'transform',
      }} />

      {/* Tertiary: bottom centre teal */}
      <div style={{
        position: 'absolute',
        bottom: '-5%', left: '22%',
        width: '55%', height: '45%',
        background: 'radial-gradient(ellipse at center, rgba(48,110,160,0.11) 0%, rgba(18,48,64,0.06) 44%, transparent 72%)',
        filter: 'blur(64px)',
        animation: 'aurora 26s ease-in-out infinite',
        borderRadius: '50%',
        willChange: 'transform',
      }} />

      {/* Quaternary: mid-right ambient */}
      <div style={{
        position: 'absolute',
        top: '30%', right: '-6%',
        width: '38%', height: '42%',
        background: 'radial-gradient(ellipse at center, rgba(70,45,160,0.09) 0%, transparent 68%)',
        filter: 'blur(80px)',
        animation: 'aurora 20s ease-in-out infinite 4s',
        borderRadius: '50%',
        willChange: 'transform',
      }} />

      {/* === HORIZON GLOW BAND === */}
      <div style={{
        position: 'absolute',
        left: '-8%', right: '-8%', bottom: 80,
        height: 160,
        background: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(72,98,210,0.10) 0%, transparent 70%)',
        filter: 'blur(24px)',
      }} />

      {/* === STAR FIELD === */}
      {/* Layer 1: sparse large stars */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.85) 1px, transparent 1px)',
        backgroundSize: '320px 320px',
        backgroundPosition: '0 0',
        opacity: 0.22,
      }} />
      {/* Layer 2: mid stars */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.65) 1px, transparent 1px)',
        backgroundSize: '180px 180px',
        backgroundPosition: '90px 72px',
        opacity: 0.18,
      }} />
      {/* Layer 3: dense micro stars */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px)',
        backgroundSize: '90px 90px',
        backgroundPosition: '42px 36px',
        opacity: 0.12,
      }} />

      {/* === TOP DECORATIVE CONSTELLATION === */}
      {/* Centre star */}
      <div style={{
        position: 'absolute', top: 28, left: '50%',
        transform: 'translateX(-50%)',
        width: 3, height: 3, borderRadius: '50%',
        background: 'rgba(255,255,255,0.92)',
        boxShadow: [
          '-340px 42px 0 1px rgba(255,255,255,0.50)',
          '-268px 16px 0 0 rgba(255,255,255,0.34)',
          '-180px 76px 0 1px rgba(255,255,255,0.48)',
          '-84px 30px 0 0 rgba(255,255,255,0.70)',
          '95px 56px 0 1px rgba(255,255,255,0.54)',
          '184px 18px 0 0 rgba(255,255,255,0.38)',
          '296px 68px 0 1px rgba(255,255,255,0.46)',
          '360px 26px 0 0 rgba(255,255,255,0.36)',
        ].join(', '),
        opacity: 0.86,
      }} />

      {/* Diamond accent */}
      <div style={{
        position: 'absolute', top: 104, left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        width: 11, height: 11,
        border: '1px solid rgba(186,215,255,0.80)',
        boxShadow: '0 0 20px rgba(120,168,255,0.18)',
        opacity: 0.55,
      }} />

      {/* === VIGNETTE === */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(5,6,10,0.50) 100%)',
        pointerEvents: 'none',
      }} />

      {/* === BOTTOM FADE === */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%',
        background: 'linear-gradient(to top, rgba(6,8,12,0.92) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* === SUBTLE GRID OVERLAY === */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        opacity: 0.6,
        maskImage: 'radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
