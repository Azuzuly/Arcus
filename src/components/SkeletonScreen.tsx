'use client';

import { CSSProperties } from 'react';

const SHIMMER_STYLE = `
@keyframes skeletonShimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
.arcus-skeleton {
  background: rgba(255,255,255,0.04);
  background-image: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 0px,
    rgba(255,255,255,0.09) 80px,
    rgba(255,255,255,0.04) 160px
  );
  background-size: 800px 100%;
  animation: skeletonShimmer 1.6s ease-in-out infinite;
  border-radius: 6px;
}
`;

let styleInjected = false;
function injectStyle() {
  if (typeof document === 'undefined' || styleInjected) return;
  styleInjected = true;
  const el = document.createElement('style');
  el.textContent = SHIMMER_STYLE;
  document.head.appendChild(el);
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonProps) {
  injectStyle();
  return (
    <div
      className="arcus-skeleton"
      style={{ width, height, borderRadius, flexShrink: 0, ...style }}
    />
  );
}

export function ChatMessageSkeleton() {
  injectStyle();
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0' }}>
      <Skeleton width={34} height={34} borderRadius="50%" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
        <Skeleton width="72%" height={14} />
        <Skeleton width="88%" height={14} />
        <Skeleton width="54%" height={14} />
      </div>
    </div>
  );
}

export function ConversationListSkeleton() {
  injectStyle();
  const widths = ['68%', '82%', '55%', '74%', '63%'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {widths.map((w, i) => (
        <div
          key={i}
          style={{
            display: 'flex', flexDirection: 'column', gap: 6,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <Skeleton width={w} height={13} />
          <Skeleton width="38%" height={10} />
        </div>
      ))}
    </div>
  );
}

export function FeatureCardSkeleton() {
  injectStyle();
  return (
    <div style={{
      padding: '28px 24px',
      borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <Skeleton width={40} height={40} borderRadius={10} />
      <Skeleton width="60%" height={18} />
      <Skeleton width="90%" height={13} />
      <Skeleton width="76%" height={13} />
      <Skeleton width="50%" height={13} />
    </div>
  );
}

export function ModelRowSkeleton() {
  injectStyle();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px',
      borderRadius: 8,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.04)',
    }}>
      <Skeleton width={32} height={32} borderRadius="50%" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton width="45%" height={13} />
        <Skeleton width="28%" height={10} />
      </div>
      <Skeleton width={60} height={24} borderRadius={20} />
    </div>
  );
}

export function AppShellSkeleton() {
  injectStyle();
  return (
    <div style={{
      display: 'flex', width: '100vw', height: '100vh',
      background: '#050508', overflow: 'hidden',
    }}>
      <div style={{
        width: 260, flexShrink: 0, height: '100%',
        background: 'rgba(15,17,24,0.86)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 12px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <Skeleton width="100%" height={42} borderRadius={8} />
        <div style={{ height: 8 }} />
        <ConversationListSkeleton />
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          height: 56, borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
        }}>
          <Skeleton width={120} height={20} borderRadius={20} style={{ margin: '0 auto' }} />
        </div>

        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ChatMessageSkeleton />
          <ChatMessageSkeleton />
          <ChatMessageSkeleton />
        </div>

        <div style={{
          padding: '12px 20px 20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <Skeleton width="100%" height={52} borderRadius={14} />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
