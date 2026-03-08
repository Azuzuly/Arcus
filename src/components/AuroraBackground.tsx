'use client';

export default function AuroraBackground() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 0, background: '#0A0A14',
      overflow: 'hidden', pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', width: '150%', height: '150%', top: '-25%', left: '-25%',
        borderRadius: '50%', mixBlendMode: 'screen', willChange: 'transform',
        filter: 'blur(80px)', opacity: 0.6,
        background: 'radial-gradient(ellipse, rgba(0, 200, 150, 0.5) 0%, transparent 70%)',
        animation: 'aurora-move-1 25s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', width: '150%', height: '150%', top: '-25%', left: '-25%',
        borderRadius: '50%', mixBlendMode: 'screen', willChange: 'transform',
        filter: 'blur(80px)', opacity: 0.6,
        background: 'radial-gradient(ellipse, rgba(100, 50, 200, 0.4) 0%, transparent 70%)',
        animation: 'aurora-move-2 30s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', width: '150%', height: '150%', top: '-25%', left: '-25%',
        borderRadius: '50%', mixBlendMode: 'screen', willChange: 'transform',
        filter: 'blur(80px)', opacity: 0.6,
        background: 'radial-gradient(ellipse, rgba(0, 150, 255, 0.3) 0%, transparent 70%)',
        animation: 'aurora-move-3 20s ease-in-out infinite alternate',
      }} />
      {/* Pine tree silhouettes */}
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '200px' }} viewBox="0 0 1200 200" preserveAspectRatio="none">
        <polygon points="50,200 100,80 150,200" fill="#060810"/>
        <polygon points="180,200 240,50 300,200" fill="#060810"/>
        <polygon points="350,200 390,100 430,200" fill="#060810"/>
        <polygon points="500,200 560,30 620,200" fill="#060810"/>
        <polygon points="680,200 720,90 760,200" fill="#060810"/>
        <polygon points="820,200 880,60 940,200" fill="#060810"/>
        <polygon points="1000,200 1050,110 1100,200" fill="#060810"/>
      </svg>
    </div>
  );
}
