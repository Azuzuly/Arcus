'use client';

import { useState, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { PromptModes } from '@/lib/types';

const DEFAULT_MODES: PromptModes = {
  deepResearch: false,
  webSearch: false,
  personalization: false,
};
const BOTTOM_MODE_KEYS: Array<keyof PromptModes> = ['webSearch', 'personalization'];

// Deep research always depends on live search context, so enabling it also enables web search.
// If the user turns off web search while deep research is active, both modes are disabled together.
function getNextModes(previous: PromptModes, mode: keyof PromptModes): PromptModes {
  if (mode === 'deepResearch') {
    const deepResearch = !previous.deepResearch;
    return { ...previous, deepResearch, webSearch: deepResearch || previous.webSearch };
  }

  if (mode === 'webSearch' && previous.deepResearch) {
    return { ...previous, deepResearch: false, webSearch: false };
  }

  return { ...previous, [mode]: !previous[mode] };
}

const MODE_CHIPS: Array<{ key: keyof PromptModes; label: string; icon: string; hint: string }> = [
  { key: 'deepResearch', label: 'Deep Research', icon: '✦', hint: 'Search more broadly and answer with structure' },
  { key: 'webSearch', label: 'Web Search', icon: '⌕', hint: 'Bring live web context into the answer' },
  { key: 'personalization', label: 'Personalization', icon: '◌', hint: 'Use your profile and saved memory' },
];

export default function ChatInput({ onSend }: { onSend: (content: string, modes: PromptModes) => void }) {
  const { state } = useStore();
  const [value, setValue] = useState('');
  const [modes, setModes] = useState<PromptModes>(DEFAULT_MODES);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInput = useCallback((val: string) => {
    setValue(val);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 14 * 1.5 * 7) + 'px';
    }
  }, []);

  const toggleMode = useCallback((mode: keyof PromptModes) => {
    setModes(prev => getNextModes(prev, mode));
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(event.target.files || []).map(file => file.name);
    setAttachedFiles(names);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || state.isStreaming) return;

    const attachmentPrefix = attachedFiles.length > 0
      ? `Attached files: ${attachedFiles.join(', ')}\n\n`
      : '';

    onSend(`${attachmentPrefix}${trimmed}`, modes);
    setValue('');
    setAttachedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [attachedFiles, modes, onSend, state.isStreaming, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const tokenEstimate = Math.ceil(value.length / 4);

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 24px 20px', zIndex: 10 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
        {MODE_CHIPS.map(mode => {
          const active = modes[mode.key];
          return (
            <button
              key={mode.key}
              onClick={() => toggleMode(mode.key)}
              title={mode.hint}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                border: active ? '1px solid color-mix(in srgb, var(--accent-blue) 55%, white 18%)' : '1px solid rgba(255,255,255,0.08)',
                background: active ? 'color-mix(in srgb, var(--accent-blue) 20%, rgba(12,15,24,0.82))' : 'rgba(10,12,20,0.72)',
                color: active ? '#FFFFFF' : 'var(--text-secondary)',
                boxShadow: active ? '0 0 0 1px rgba(255,255,255,0.04), 0 10px 30px color-mix(in srgb, var(--accent-blue) 22%, transparent)' : 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'inherit',
                transition: 'all var(--dur-fast) var(--ease-out)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{
                width: 20,
                height: 20,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
                fontSize: 11,
              }}>
                {mode.icon}
              </span>
              {mode.label}
            </button>
          );
        })}
      </div>

      <div style={{
        background: 'rgba(8,10,16,0.72)',
        backdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '16px 16px 12px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
      }}>
        {attachedFiles.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {attachedFiles.map(file => (
              <span key={file} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)',
                fontSize: 12,
              }}>
                📎 {file}
              </span>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Arcus anything"
          rows={1}
          style={{
            width: '100%',
            resize: 'none',
            overflowY: 'auto',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 15,
            fontFamily: "'Geist', -apple-system, sans-serif",
            lineHeight: 1.55,
          }}
        />

        <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Upload files"
            >
              +
            </button>
            {BOTTOM_MODE_KEYS.map(mode => {
              const active = modes[mode];
              const label = mode === 'webSearch' ? 'Web Search' : 'Personalization';
              const icon = mode === 'webSearch' ? '⌕' : '◌';
              return (
                <button
                  key={mode}
                  onClick={() => toggleMode(mode)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 999,
                    background: active ? 'color-mix(in srgb, var(--accent-blue) 18%, rgba(255,255,255,0.06))' : 'rgba(255,255,255,0.04)',
                    border: active ? '1px solid color-mix(in srgb, var(--accent-blue) 50%, white 12%)' : '1px solid rgba(255,255,255,0.08)',
                    color: active ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'inherit',
                    boxShadow: active ? '0 10px 24px color-mix(in srgb, var(--accent-blue) 20%, transparent)' : 'none',
                  }}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tokenEstimate} tokens</span>
            <button
              onClick={handleSend}
              disabled={!value.trim() || state.isStreaming}
              style={{
                minWidth: 38,
                height: 38,
                padding: value.trim() ? '0 14px' : 0,
                borderRadius: 14,
                background: value.trim() ? 'var(--accent-blue)' : 'rgba(255,255,255,0.06)',
                border: 'none',
                cursor: value.trim() ? 'pointer' : 'not-allowed',
                color: '#fff',
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: value.trim() ? '0 12px 30px color-mix(in srgb, var(--accent-blue) 35%, transparent)' : 'none',
                transition: 'all var(--dur-fast) var(--ease-out)',
                fontFamily: 'inherit',
              }}
            >
              {state.isStreaming ? '…' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
