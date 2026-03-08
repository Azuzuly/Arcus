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
          opacity: 0.25,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,5,5,0.3) 0%, rgba(5,5,5,0.85) 100%)' }} />
        </div>
      )}

      {/* Liquid glass aurora blobs */}
      <div style={{
        position: 'absolute', top: '-15%', left: '15%', width: '45%', height: '45%',
        background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'aurora 12s ease-in-out infinite',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', top: '10%', right: '5%', width: '35%', height: '40%',
        background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.06) 40%, transparent 70%)',
        filter: 'blur(70px)',
        animation: 'aurora 16s ease-in-out infinite reverse',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', bottom: '0%', left: '25%', width: '50%', height: '35%',
        background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.1) 0%, rgba(6,182,212,0.06) 40%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'aurora 20s ease-in-out infinite',
        borderRadius: '50%',
      }} />

      {/* Glass reflection overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 40%, rgba(255,255,255,0.01) 60%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Subtle noise texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
