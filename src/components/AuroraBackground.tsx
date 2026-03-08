'use client';

import { useStore } from '@/lib/store';

export default function AuroraBackground() {
  const { state } = useStore();
  const bgImage = state.settings?.backgroundImage || '/night-sky.svg';
  const opacity = Math.max(0.2, Math.min(0.95, state.settings?.wallpaperOpacity || 0.72));
  const showAnimations = state.settings?.showAnimations !== false;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity,
        transform: 'scale(1.03)',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(4,6,10,0.35) 0%, rgba(5,7,13,0.58) 45%, rgba(4,5,9,0.88) 100%)',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at top left, rgba(124,140,255,0.12), transparent 34%), radial-gradient(circle at top right, rgba(88,132,255,0.08), transparent 32%)',
        opacity: showAnimations ? 1 : 0.45,
      }} />

      {showAnimations && (
        <>
          <div style={{
            position: 'absolute', top: '-12%', left: '8%', width: '36%', height: '36%',
            background: 'radial-gradient(circle at center, rgba(124,140,255,0.12) 0%, rgba(124,140,255,0.02) 55%, transparent 72%)',
            filter: 'blur(60px)',
            animation: 'aurora 16s ease-in-out infinite',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', top: '8%', right: '6%', width: '28%', height: '32%',
            background: 'radial-gradient(circle at center, rgba(86,127,255,0.1) 0%, rgba(86,127,255,0.02) 55%, transparent 72%)',
            filter: 'blur(65px)',
            animation: 'aurora 20s ease-in-out infinite reverse',
            borderRadius: '50%',
          }} />
        </>
      )}

      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }} />
    </div>
  );
}
