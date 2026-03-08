'use client';

import { renderMarkdown } from '@/lib/markdown';
import { Message } from '@/lib/types';

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className="msg-enter" style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: isUser ? '70%' : '85%' }}>
      {!isUser && message.model && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            background: 'var(--glass-button)', borderRadius: 'var(--radius-pill)',
            padding: '2px 8px', fontSize: 11, color: 'var(--text-secondary)',
          }}>
            {message.model.name}
          </span>
        </div>
      )}
      <div style={{
        background: isUser ? 'rgba(59, 130, 246, 0.15)' : 'var(--glass-card)',
        border: isUser ? '1px solid rgba(59, 130, 246, 0.20)' : '1px solid var(--glass-border)',
        borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
        padding: '12px 16px', color: 'var(--text-primary)', fontSize: 14,
      }}>
        {isUser ? (
          <div>{message.content}</div>
        ) : (
          <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content || '') }} />
        )}
        {message.isStreaming && !message.content && (
          <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: 'inline-block', width: 6, height: 6, background: 'var(--text-secondary)',
                borderRadius: '50%', animation: `dot-pulse 1.4s infinite ease-in-out`,
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
        )}
      </div>
      {/* Message actions */}
      {!message.isStreaming && message.content && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4, opacity: 0.4, transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}>
          <button onClick={() => navigator.clipboard.writeText(message.content)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 12, fontFamily: 'inherit',
          }}>📋 Copy</button>
        </div>
      )}
    </div>
  );
}
