/* eslint-disable @next/next/no-img-element */
'use client';

import { renderMarkdown } from '@/lib/markdown';
import { Message } from '@/lib/types';

function formatAttachmentSize(size: number): string {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

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
        {!isUser && message.research && (
          <div style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 16,
            background: 'rgba(111,177,120,0.08)',
            border: '1px solid rgba(111,177,120,0.14)',
            display: 'grid',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{message.research.mode === 'deep' ? 'Deep Research Report' : 'Live Web Snapshot'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{message.research.brief}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'var(--text-secondary)' }}>{message.research.sources.length} sources</span>
                <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'var(--text-secondary)' }}>{message.research.queries.length} passes</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {message.research.queries.map(query => (
                <span key={query} style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'var(--text-secondary)' }}>{query}</span>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {message.research.sources.slice(0, 4).map(source => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer" style={{
                  display: 'block',
                  textDecoration: 'none',
                  borderRadius: 14,
                  padding: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{source.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginTop: 3 }}>{source.provider} · {source.url}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{source.content}</div>
                </a>
              ))}
            </div>
          </div>
        )}
        {message.attachments && message.attachments.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: message.content ? 12 : 0 }}>
            {message.attachments.map(attachment => (
              <div key={attachment.id} style={{
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                overflow: 'hidden',
              }}>
                {attachment.kind === 'image' && attachment.previewUrl ? (
                  <img src={attachment.previewUrl} alt={attachment.name} style={{ width: '100%', height: 112, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ height: 112, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>📎</div>
                )}
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{attachment.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{attachment.kind === 'image' ? 'Image' : 'File'} · {formatAttachmentSize(attachment.size)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {isUser ? (
          message.content ? <div>{message.content}</div> : null
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
      {!message.isStreaming && (message.content || message.attachments?.length) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4, opacity: 0.4, transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}>
          <button onClick={() => navigator.clipboard.writeText(message.content || message.attachments?.map(item => item.name).join(', ') || '')} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 12, fontFamily: 'inherit',
          }}>📋 Copy</button>
        </div>
      )}
    </div>
  );
}
