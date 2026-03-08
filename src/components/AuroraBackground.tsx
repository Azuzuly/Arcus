'use client';

import { useStore } from '@/lib/store';

export default function AuroraBackground() {
  const { state } = useStore();
  const bgImage = state.settings?.backgroundImage || '';

  if (bgImage) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.3,
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,5,5,0.3) 0%, rgba(5,5,5,0.8) 100%)' }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '-20%', left: '20%', width: '60%', height: '50%',
        background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'aurora 20s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '10%', width: '40%', height: '40%',
        background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.05) 0%, transparent 70%)',
        filter: 'blur(100px)',
        animation: 'aurora 25s ease-in-out infinite reverse',
      }} />
    </div>
  );
}
