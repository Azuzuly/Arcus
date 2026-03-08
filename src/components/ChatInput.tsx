'use client';

import { useState, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';

const SUGGESTIONS = [
  { icon: '🔍', label: 'Deep Research', prompt: 'Research the latest developments in ' },
  { icon: '💻', label: 'Write Code', prompt: 'Write a function that ' },
  { icon: '📊', label: 'Analyze Data', prompt: 'Help me analyze this data: ' },
  { icon: '✍️', label: 'Draft Content', prompt: 'Write a professional ' },
  { icon: '🧠', label: 'Explain Concept', prompt: 'Explain in simple terms: ' },
  { icon: '🐛', label: 'Debug Code', prompt: 'Help me debug this code: ' },
  { icon: '💡', label: 'Brainstorm', prompt: 'Brainstorm ideas for ' },
  { icon: '📋', label: 'Summarize', prompt: 'Summarize the key points of ' },
];

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
          display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto',
          scrollbarWidth: 'none', paddingBottom: 4,
        }}>
          {SUGGESTIONS.map(s => (
            <button key={s.label} onClick={() => { handleInput(s.prompt); textareaRef.current?.focus(); }} style={{
              flexShrink: 0, padding: '7px 13px',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              borderRadius: 'var(--radius-pill)',
              fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all var(--dur-fast) var(--ease-out)', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }}>
              <span style={{ fontSize: 13 }}>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input panel */}
      <div style={{
        background: 'rgba(255,255,255,0.055)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px 12px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.3)',
        transition: 'border-color var(--dur-fast) var(--ease-out)',
      }}>
        <textarea ref={textareaRef} value={value}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Arcus anything..."
          rows={1}
          disabled={state.isStreaming}
          style={{
            width: '100%', resize: 'none', overflowY: 'auto', background: 'transparent',
            border: 'none', outline: 'none', color: 'rgba(255,255,255,0.92)', fontSize: 14,
            fontFamily: "'Geist', -apple-system, sans-serif", lineHeight: 1.6,
            opacity: state.isStreaming ? 0.6 : 1,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button title="Attach file" style={{
              width: 30, height: 30, borderRadius: 'var(--radius-xs)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--dur-fast) var(--ease-out)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M4 4l3-3 3 3M2.5 10.5h9A1 1 0 0 1 12.5 11.5v.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-.5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {value.trim() && !state.isStreaming && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{tokenEstimate} tokens</span>
            )}
            {state.isStreaming ? (
              <button onClick={() => {}} style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                cursor: 'pointer', color: 'rgba(239,68,68,0.9)', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>◼</button>
            ) : (
              <button onClick={handleSend} disabled={!value.trim()} style={{
                width: 32, height: 32, borderRadius: 10,
                background: value.trim()
                  ? 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-violet) 100%)'
                  : 'rgba(255,255,255,0.06)',
                border: 'none', cursor: value.trim() ? 'pointer' : 'not-allowed',
                color: value.trim() ? '#fff' : 'rgba(255,255,255,0.25)', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: value.trim() ? '0 4px 12px rgba(79,142,247,0.3)' : 'none',
                transition: 'all var(--dur-base) var(--ease-out)',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 11V3M3 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 8, letterSpacing: '0.01em' }}>
        Arcus can make mistakes · Press ⌘K to switch models
      </div>
    </div>
  );
}
