'use client';

import { useStore } from '@/lib/store';

const STYLES = [
  '@keyframes orb-drift-a {',
  '  0%   { transform: translate(0px,   0px)   scale(1.00); opacity: 0.90; }',
  '  25%  { transform: translate(28px, -18px)  scale(1.06); opacity: 1.00; }',
  '  50%  { transform: translate(14px,  22px)  scale(0.96); opacity: 0.85; }',
  '  75%  { transform: translate(-20px, 10px)  scale(1.04); opacity: 0.95; }',
  '  100% { transform: translate(0px,   0px)   scale(1.00); opacity: 0.90; }',
  '}',
  '@keyframes orb-drift-b {',
  '  0%   { transform: translate(0px,   0px)   scale(1.00); opacity: 0.85; }',
  '  30%  { transform: translate(-24px, 14px)  scale(1.08); opacity: 1.00; }',
  '  60%  { transform: translate(18px,  28px)  scale(0.94); opacity: 0.80; }',
  '  100% { transform: translate(0px,   0px)   scale(1.00); opacity: 0.85; }',
  '}',
  '@keyframes orb-drift-c {',
  '  0%   { transform: translate(0px,  0px)  scale(1.00); opacity: 0.80; }',
  '  20%  { transform: translate(16px, 24px) scale(1.05); opacity: 0.95; }',
  '  55%  { transform: translate(-18px,12px) scale(0.97); opacity: 0.85; }',
  '  80%  { transform: translate(8px, -16px) scale(1.03); opacity: 0.90; }',
  '  100% { transform: translate(0px,  0px)  scale(1.00); opacity: 0.80; }',
  '}',
  '@keyframes orb-drift-d {',
  '  0%   { transform: translate(0px,   0px)   scale(1.00); opacity: 0.75; }',
  '  35%  { transform: translate(-14px,-20px)  scale(1.07); opacity: 0.92; }',
  '  70%  { transform: translate(22px,  16px)  scale(0.95); opacity: 0.82; }',
  '  100% { transform: translate(0px,   0px)   scale(1.00); opacity: 0.75; }',
  '}',
  '@keyframes orb-drift-e {',
  '  0%   { transform: translate(0px, 0px)   scale(1.00); opacity: 0.70; }',
  '  40%  { transform: translate(20px, 18px) scale(1.09); opacity: 0.90; }',
  '  100% { transform: translate(0px, 0px)   scale(1.00); opacity: 0.70; }',
  '}',
  '@keyframes aurora-shimmer {',
  '  0%, 100% { opacity: 0.55; }',
  '  50%       { opacity: 0.85; }',
  '}',
  '@keyframes star-twinkle {',
  '  0%, 100% { opacity: 0.22; }',
  '  50%       { opacity: 0.38; }',
  '}',
  '@keyframes star-twinkle-slow {',
  '  0%, 100% { opacity: 0.14; }',
  '  50%       { opacity: 0.26; }',
  '}',
  '@keyframes diamond-pulse {',
  '  0%, 100% { opacity: 0.45; box-shadow: 0 0 12px rgba(120,168,255,0.12); }',
  '  50%       { opacity: 0.70; box-shadow: 0 0 28px rgba(120,168,255,0.28); }',
  '}',
].join('\n');

export default function AuroraBackground() {
  const { state } = useStore();
  const bgImage = state.settings?.backgroundImage || '';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {bgImage && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(' + bgImage + ')',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.15,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,5,8,0.45) 0%, rgba(5,5,8,0.92) 100%)' }} />
        </div>
      )}

      {/* Deep void base */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, #080b18 0%, #060810 40%, #050508 75%, #050407 100%)',
      }} />

      {/* SVG fractal noise texture */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="aurora-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#aurora-noise)" />
      </svg>

      {/* Orb A: top-left electric blue-indigo, 22s */}
      <div style={{
        position: 'absolute',
        top: '-18%', left: '-6%',
        width: '60%', height: '62%',
        background: 'radial-gradient(ellipse at 40% 40%, rgba(55,92,210,0.15) 0%, rgba(38,66,165,0.08) 40%, transparent 70%)',
        filter: 'blur(60px)',
        borderRadius: '50%',
        animation: 'orb-drift-a 22s ease-in-out infinite',
        willChange: 'transform, opacity',
      }} />

      {/* Orb B: top-right soft violet, 28s */}
      <div style={{
        position: 'absolute',
        top: '-10%', right: '-5%',
        width: '52%', height: '56%',
        background: 'radial-gradient(ellipse at 60% 35%, rgba(96,58,200,0.13) 0%, rgba(68,38,148,0.06) 45%, transparent 72%)',
        filter: 'blur(76px)',
        borderRadius: '50%',
        animation: 'orb-drift-b 28s ease-in-out infinite',
        willChange: 'transform, opacity',
      }} />

      {/* Orb C: bottom-center teal-emerald, 32s */}
      <div style={{
        position: 'absolute',
        bottom: '-8%', left: '18%',
        width: '58%', height: '48%',
        background: 'radial-gradient(ellipse at 50% 60%, rgba(38,118,148,0.11) 0%, rgba(22,72,90,0.05) 45%, transparent 72%)',
        filter: 'blur(68px)',
        borderRadius: '50%',
        animation: 'orb-drift-c 32s ease-in-out infinite',
        willChange: 'transform, opacity',
      }} />

      {/* Orb D: mid-right deep indigo, 25s */}
      <div style={{
        position: 'absolute',
        top: '28%', right: '-8%',
        width: '42%', height: '46%',
        background: 'radial-gradient(ellipse at 55% 45%, rgba(62,42,172,0.10) 0%, rgba(42,28,110,0.04) 50%, transparent 70%)',
        filter: 'blur(88px)',
        borderRadius: '50%',
        animation: 'orb-drift-d 25s ease-in-out infinite 3s',
        willChange: 'transform, opacity',
      }} />

      {/* Orb E: lower-left violet-blue, 36s */}
      <div style={{
        position: 'absolute',
        bottom: '12%', left: '-4%',
        width: '36%', height: '38%',
        background: 'radial-gradient(ellipse at 45% 55%, rgba(72,55,185,0.09) 0%, transparent 65%)',
        filter: 'blur(72px)',
        borderRadius: '50%',
        animation: 'orb-drift-e 36s ease-in-out infinite 6s',
        willChange: 'transform, opacity',
      }} />

      {/* Orb F: center emerald breath, 40s shimmer */}
      <div style={{
        position: 'absolute',
        top: '35%', left: '30%',
        width: '40%', height: '36%',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(32,105,88,0.08) 0%, transparent 62%)',
        filter: 'blur(96px)',
        borderRadius: '50%',
        animation: 'aurora-shimmer 40s ease-in-out infinite 10s',
        willChange: 'opacity',
      }} />

      {/* Horizon glow band */}
      <div style={{
        position: 'absolute',
        left: '-6%', right: '-6%', bottom: 72,
        height: 180,
        background: 'radial-gradient(ellipse 85% 100% at 50% 100%, rgba(64,92,220,0.09) 0%, transparent 70%)',
        filter: 'blur(28px)',
        animation: 'aurora-shimmer 18s ease-in-out infinite',
      }} />

      {/* Star field layer 1 */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.88) 1px, transparent 1px)',
        backgroundSize: '340px 340px',
        animation: 'star-twinkle 8s ease-in-out infinite',
      }} />
      {/* Star field layer 2 */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.68) 1px, transparent 1px)',
        backgroundSize: '190px 190px',
        backgroundPosition: '95px 76px',
        animation: 'star-twinkle 12s ease-in-out infinite 3s',
      }} />
      {/* Star field layer 3 */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.42) 1px, transparent 1px)',
        backgroundSize: '95px 95px',
        backgroundPosition: '44px 38px',
        animation: 'star-twinkle-slow 16s ease-in-out infinite 6s',
      }} />

      {/* Top constellation */}
      <div style={{
        position: 'absolute', top: 30, left: '50%',
        transform: 'translateX(-50%)',
        width: 3, height: 3, borderRadius: '50%',
        background: 'rgba(255,255,255,0.94)',
        boxShadow: [
          '-342px 44px 0 1px rgba(255,255,255,0.52)',
          '-270px 18px 0 0px rgba(255,255,255,0.36)',
          '-182px 78px 0 1px rgba(255,255,255,0.50)',
          '-86px  32px 0 0px rgba(255,255,255,0.72)',
          '98px   58px 0 1px rgba(255,255,255,0.56)',
          '186px  20px 0 0px rgba(255,255,255,0.40)',
          '298px  70px 0 1px rgba(255,255,255,0.48)',
          '362px  28px 0 0px rgba(255,255,255,0.38)',
        ].join(', '),
        opacity: 0.88,
        animation: 'star-twinkle 10s ease-in-out infinite 2s',
      }} />

      {/* Diamond accent */}
      <div style={{
        position: 'absolute', top: 108, left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        width: 11, height: 11,
        border: '1px solid rgba(186,215,255,0.82)',
        animation: 'diamond-pulse 6s ease-in-out infinite',
      }} />

      {/* Perspective grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        maskImage: 'radial-gradient(ellipse 92% 78% at 50% 0%, black 20%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 92% 78% at 50% 0%, black 20%, transparent 100%)',
        pointerEvents: 'none',
        opacity: 0.65,
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 38%, rgba(5,5,8,0.55) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Bottom content fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%',
        background: 'linear-gradient(to top, rgba(5,5,8,0.94) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
