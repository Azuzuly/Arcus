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

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #0b1020 0%, #090c16 38%, #07090f 100%)',
      }} />

      <div style={{
        position: 'absolute', top: 34, left: '50%', transform: 'translateX(-50%)',
        width: 2, height: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.95)',
        boxShadow: '-340px 42px 0 1px rgba(255,255,255,0.52), -268px 16px 0 0 rgba(255,255,255,0.36), -180px 76px 0 1px rgba(255,255,255,0.5), -84px 30px 0 0 rgba(255,255,255,0.72), 95px 56px 0 1px rgba(255,255,255,0.58), 184px 18px 0 0 rgba(255,255,255,0.40), 296px 68px 0 1px rgba(255,255,255,0.48), 360px 26px 0 0 rgba(255,255,255,0.38)',
        opacity: 0.88,
      }} />

      <div style={{
        position: 'absolute', top: 110, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
        width: 12, height: 12, border: '1px solid rgba(186, 215, 255, 0.85)',
        boxShadow: '0 0 24px rgba(123, 170, 255, 0.2)', opacity: 0.6,
      }} />

      <div style={{
        position: 'absolute', top: '-15%', left: '15%', width: '45%', height: '45%',
        background: 'radial-gradient(ellipse at center, rgba(63,95,172,0.18) 0%, rgba(40,82,136,0.08) 44%, transparent 72%)',
        filter: 'blur(56px)',
        animation: 'aurora 16s ease-in-out infinite',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', top: '10%', right: '5%', width: '35%', height: '40%',
        background: 'radial-gradient(ellipse at center, rgba(87,110,180,0.14) 0%, rgba(35,52,96,0.08) 42%, transparent 72%)',
        filter: 'blur(64px)',
        animation: 'aurora 18s ease-in-out infinite reverse',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', bottom: '0%', left: '25%', width: '50%', height: '35%',
        background: 'radial-gradient(ellipse at center, rgba(61,133,167,0.11) 0%, rgba(17,44,58,0.06) 42%, transparent 72%)',
        filter: 'blur(72px)',
        animation: 'aurora 20s ease-in-out infinite',
        borderRadius: '50%',
      }} />

      <div style={{
        position: 'absolute', left: '-6%', right: '-6%', bottom: 110, height: 170,
        background: 'radial-gradient(ellipse at 50% 100%, rgba(19,34,54,0.84) 0%, rgba(10,15,25,0.98) 70%)',
        borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%',
      }} />
      <div style={{
        position: 'absolute', left: '-8%', right: '-8%', bottom: 48, height: 160,
        background: 'radial-gradient(ellipse at 50% 100%, rgba(10,18,30,0.96) 0%, rgba(7,10,16,1) 72%)',
        borderTopLeftRadius: '45% 100%', borderTopRightRadius: '45% 100%',
      }} />

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 160,
        background: 'linear-gradient(180deg, rgba(4,7,12,0) 0%, rgba(4,7,12,0.92) 28%, #05070c 100%)',
      }} />

      <svg viewBox="0 0 1440 220" preserveAspectRatio="none" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 160, opacity: 0.92,
      }}>
        <path d="M0 220 L0 132 L60 144 L96 104 L136 142 L178 82 L224 150 L280 98 L330 148 L378 88 L430 150 L500 94 L556 138 L622 84 L694 146 L760 92 L826 156 L902 98 L974 144 L1032 96 L1094 150 L1162 86 L1224 150 L1298 112 L1360 156 L1440 132 L1440 220 Z" fill="#04060a" />
      </svg>

      {/* Glass reflection overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 28%, transparent 78%, rgba(255,255,255,0.015) 100%)',
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
