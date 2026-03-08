'use client';

import { useState, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';

const SUGGESTIONS = ['Deep Research', 'Write code', 'Analyze data', 'Summarize a doc', 'Explain a concept', 'Debug my code', 'Generate an image prompt', 'Compare options'];

export default function ChatInput({ onSend }: { onSend: (content: string) => void }) {
  const { state } = useStore();
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // unused, we check isEmpty below instead

  const handleInput = useCallback((val: string) => {
    setValue(val);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 14 * 1.5 * 6) + 'px';
    }
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || state.isStreaming) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, state.isStreaming, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const tokenEstimate = Math.ceil(value.length / 4);
  const activeConv = state.conversations.find(c => c.id === state.activeChatId);
  const isEmpty = !activeConv || activeConv.messages.length === 0;

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 24px 20px', zIndex: 10 }}>
      {/* Suggestion pills */}
      {isEmpty && (
        <div style={{
          display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto',
          scrollbarWidth: 'none', paddingBottom: 4,
        }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => { handleInput(s); textareaRef.current?.focus(); }} style={{
              flexShrink: 0, padding: '7px 14px',
              background: 'var(--glass-pill)', borderRadius: 10,
              fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
              whiteSpace: 'nowrap', border: '1px solid transparent',
              transition: 'all var(--dur-fast) var(--ease-out)', fontFamily: 'inherit',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--glass-hover)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass-pill)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input panel */}
      <div style={{
        background: 'var(--glass-panel)', backdropFilter: 'blur(22px)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
        padding: '14px 16px 12px',
      }}>
        <textarea ref={textareaRef} value={value}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Arcus"
          rows={1}
          style={{
            width: '100%', resize: 'none', overflowY: 'auto', background: 'transparent',
            border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14,
            fontFamily: "'Geist', -apple-system, sans-serif", lineHeight: 1.5,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              width: 32, height: 32, borderRadius: 'var(--radius-xs)', background: 'var(--glass-button)',
              border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>+</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tokenEstimate} tokens</span>
            {value.trim() && (
              <button onClick={handleSend} style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--accent-blue)', border: 'none', cursor: 'pointer',
                color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>↑</button>
            )}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
        Arcus can make mistakes
      </div>
    </div>
  );
}
