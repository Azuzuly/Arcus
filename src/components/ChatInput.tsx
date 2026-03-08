'use client';

import { CSSProperties, useState, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { ChatAttachment } from '@/lib/types';
import { generateUUID } from '@/lib/utils';

function formatAttachmentSize(size: number): string {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error(`Could not preview ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export default function ChatInput({ onSend }: { onSend: (content: string, meta?: { deepResearch?: boolean; attachments?: ChatAttachment[] }) => void }) {
  const { state, dispatch, showToast } = useStore();
  const [value, setValue] = useState('');
  const [deepResearch, setDeepResearch] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if ((!trimmed && attachments.length === 0) || state.isStreaming) return;
    onSend(trimmed, { deepResearch, attachments });
    setValue('');
    setDeepResearch(false);
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [value, state.isStreaming, onSend, deepResearch, attachments]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleFilesSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      const nextAttachments = await Promise.all(files.map(async (file) => ({
        id: generateUUID(),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        kind: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
        previewUrl: file.type.startsWith('image/') ? await readFileAsDataUrl(file) : undefined,
      })));
      setAttachments(prev => [...prev, ...nextAttachments]);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not load the selected files.', 'error');
    }
  }, [showToast]);

  const tokenEstimate = Math.ceil((value.length + attachments.reduce((total, item) => total + item.name.length, 0)) / 4);
  const activeConv = state.conversations.find(c => c.id === state.activeChatId);
  const isEmpty = !activeConv || activeConv.messages.length === 0;
  const iconButtonStyle: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.055)',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--dur-fast) var(--ease-out)',
  };

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 18px', zIndex: 10 }}>
      <div style={{ display: 'flex', justifyContent: isEmpty ? 'center' : 'flex-start', marginBottom: 12 }}>
        <button
          onClick={() => setDeepResearch(v => !v)}
          title="Deep Research"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 14px',
            borderRadius: 14,
            border: `1px solid ${deepResearch ? 'rgba(127,194,255,0.42)' : 'rgba(255,255,255,0.08)'}`,
            background: deepResearch ? 'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(143,92,246,0.18))' : 'rgba(255,255,255,0.045)',
            color: deepResearch ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer',
            boxShadow: deepResearch ? '0 14px 36px rgba(59,130,246,0.18)' : 'none',
            transition: 'all var(--dur-base) var(--ease-out)',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span>🔬</span>
          <span>Deep Research</span>
          <span style={{ fontSize: 11, color: deepResearch ? 'rgba(255,255,255,0.74)' : 'var(--text-muted)' }}>
            {deepResearch ? 'On' : 'Off'}
          </span>
        </button>
      </div>

      {attachments.length > 0 && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 2px 10px' }}>
          {attachments.map(attachment => (
            <div key={attachment.id} style={{
              minWidth: attachment.kind === 'image' ? 126 : 170,
              maxWidth: 220,
              borderRadius: 16,
              background: 'linear-gradient(180deg, rgba(43,43,48,0.92), rgba(18,18,21,0.96))',
              border: '1px solid rgba(255,255,255,0.09)',
              padding: 10,
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              gap: 10,
              alignItems: attachment.kind === 'image' ? 'stretch' : 'center',
            }}>
              {attachment.kind === 'image' && attachment.previewUrl ? (
                <img src={attachment.previewUrl} alt={attachment.name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--text-secondary)',
                  fontSize: 18,
                }}>
                  📎
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{attachment.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{attachment.kind === 'image' ? 'Image preview' : 'File attached'} · {formatAttachmentSize(attachment.size)}</div>
              </div>
              <button
                type="button"
                onClick={() => setAttachments(prev => prev.filter(item => item.id !== attachment.id))}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="Remove attachment"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input panel */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(49,49,53,0.82), rgba(21,21,24,0.94))', backdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px',
        padding: '14px 14px 12px',
        boxShadow: 'var(--shadow-panel)',
      }}>
        <textarea ref={textareaRef} value={value}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={deepResearch ? 'Ask Arcus to research deeply…' : 'Ask Arcus'}
          rows={1}
          style={{
            width: '100%', resize: 'none', overflowY: 'auto', background: 'transparent',
            border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14,
            fontFamily: "'Geist', -apple-system, sans-serif", lineHeight: 1.5,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              title="Upload"
              onClick={() => fileInputRef.current?.click()}
              style={iconButtonStyle}
            >
              ⤴
            </button>
            <button
              type="button"
              title="Personalization"
              onClick={() => dispatch({ type: 'SHOW_MODAL', modal: 'personalization' })}
              style={iconButtonStyle}
            >
              ✦
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontSize: 11,
              color: state.preferences.webSearchEnabled ? 'var(--accent-mint)' : 'var(--text-muted)',
              padding: '5px 9px',
              borderRadius: 'var(--radius-pill)',
              background: state.preferences.webSearchEnabled ? 'rgba(111,177,120,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${state.preferences.webSearchEnabled ? 'rgba(111,177,120,0.18)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              {state.preferences.webSearchEnabled ? 'Web on' : 'Web off'} · {tokenEstimate} tokens
            </span>
            {(value.trim() || attachments.length > 0) && (
              <button onClick={handleSend} style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))', border: 'none', cursor: 'pointer',
                color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(80,130,246,0.26)',
              }}>↑</button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.md,.csv,.json,.doc,.docx"
        onChange={handleFilesSelected}
        style={{ display: 'none' }}
      />
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
        Arcus can make mistakes
      </div>
    </div>
  );
}
