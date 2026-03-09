/* eslint-disable @next/next/no-img-element */
'use client';

import { CSSProperties, useState, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { ChatAttachment } from '@/lib/types';
import { generateUUID } from '@/lib/utils';

const INPUT_STYLES = [
  '@keyframes glass-focus-in {',
  '  from { box-shadow: 0 0 0 0 rgba(91,138,240,0); }',
  '  to   { box-shadow: 0 0 0 1px rgba(91,138,240,0.18), 0 0 28px rgba(91,138,240,0.12), 0 8px 40px rgba(0,0,0,0.45); }',
  '}',
  '@keyframes send-pop {',
  '  0%   { transform: scale(1); }',
  '  40%  { transform: scale(0.88); }',
  '  70%  { transform: scale(1.10); }',
  '  100% { transform: scale(1); }',
  '}',
  '@keyframes attachment-in {',
  '  from { opacity: 0; transform: translateY(4px) scale(0.96); }',
  '  to   { opacity: 1; transform: translateY(0)  scale(1.00); }',
  '}',
  '.arcus-chat-wrap {',
  '  position: relative;',
  '  border-radius: 18px;',
  '  background: rgba(14, 16, 26, 0.72);',
  '  backdrop-filter: blur(24px) saturate(160%);',
  '  -webkit-backdrop-filter: blur(24px) saturate(160%);',
  '  border: 1px solid rgba(255,255,255,0.08);',
  '  transition: border-color 200ms ease, box-shadow 200ms ease;',
  '  overflow: hidden;',
  '}',
  '.arcus-chat-wrap::before {',
  "  content: '';",
  '  position: absolute;',
  '  inset: 0;',
  '  border-radius: inherit;',
  '  background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%);',
  '  pointer-events: none;',
  '  z-index: 0;',
  '}',
  '.arcus-chat-wrap.focused {',
  '  border-color: rgba(91,138,240,0.32);',
  '  box-shadow: 0 0 0 1px rgba(91,138,240,0.14), 0 0 32px rgba(91,138,240,0.10), 0 8px 40px rgba(0,0,0,0.45);',
  '}',
  '.arcus-chat-wrap.dragging {',
  '  border-color: rgba(91,138,240,0.55);',
  '  box-shadow: 0 0 0 2px rgba(91,138,240,0.22), 0 8px 48px rgba(0,0,0,0.50);',
  '}',
  '.arcus-textarea {',
  '  width: 100%;',
  '  background: transparent;',
  '  border: none;',
  '  outline: none;',
  '  resize: none;',
  '  color: var(--text-primary, #E8EAF0);',
  '  font-size: 14px;',
  '  line-height: 22px;',
  '  font-family: inherit;',
  '  overflow-y: hidden;',
  '  transition: height 120ms ease;',
  '  position: relative;',
  '  z-index: 1;',
  '}',
  '.arcus-textarea::placeholder { color: rgba(180,186,210,0.38); }',
  '.arcus-icon-btn {',
  '  width: 34px; height: 34px;',
  '  border-radius: 10px;',
  '  background: transparent;',
  '  border: 1px solid transparent;',
  '  color: rgba(180,186,210,0.50);',
  '  cursor: pointer;',
  '  display: flex; align-items: center; justify-content: center;',
  '  transition: background 140ms ease, border-color 140ms ease, color 140ms ease, transform 120ms ease;',
  '  flex-shrink: 0;',
  '  position: relative; z-index: 1;',
  '}',
  '.arcus-icon-btn:hover {',
  '  background: rgba(255,255,255,0.07);',
  '  border-color: rgba(255,255,255,0.10);',
  '  color: rgba(220,224,240,0.85);',
  '  transform: scale(1.05);',
  '}',
  '.arcus-icon-btn:active { transform: scale(0.94); }',
  '.arcus-send-btn {',
  '  width: 36px; height: 36px;',
  '  border-radius: 11px;',
  '  border: none;',
  '  display: flex; align-items: center; justify-content: center;',
  '  flex-shrink: 0;',
  '  cursor: pointer;',
  '  transition: background 160ms ease, box-shadow 160ms ease, transform 120ms ease, opacity 160ms ease;',
  '  position: relative; z-index: 1;',
  '  overflow: hidden;',
  '}',
  '.arcus-send-btn::before {',
  "  content: '';",
  '  position: absolute; inset: 0;',
  '  background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%);',
  '  opacity: 0;',
  '  transition: opacity 160ms ease;',
  '}',
  '.arcus-send-btn.active { cursor: pointer; }',
  '.arcus-send-btn.active:hover::before { opacity: 1; }',
  '.arcus-send-btn.active:hover { transform: scale(1.07); }',
  '.arcus-send-btn.active:active { transform: scale(0.92); animation: send-pop 280ms ease; }',
  '.arcus-attachment-chip {',
  '  display: flex; align-items: center; gap: 6px;',
  '  padding: 5px 10px;',
  '  background: rgba(91,138,240,0.10);',
  '  border: 1px solid rgba(91,138,240,0.22);',
  '  border-radius: 20px;',
  '  font-size: 12px;',
  '  color: var(--text-primary, #E8EAF0);',
  '  max-width: 180px;',
  '  animation: attachment-in 180ms ease forwards;',
  '}',
  '.arcus-remove-btn {',
  '  background: none; border: none; cursor: pointer;',
  '  color: rgba(180,186,210,0.50); font-size: 14px; padding: 0;',
  '  line-height: 1; flex-shrink: 0;',
  '  transition: color 120ms ease, transform 120ms ease;',
  '}',
  '.arcus-remove-btn:hover { color: #F87171; transform: scale(1.15); }',
  'kbd.arcus-kbd {',
  '  font-family: inherit;',
  '  background: rgba(255,255,255,0.06);',
  '  border: 1px solid rgba(255,255,255,0.09);',
  '  border-radius: 4px;',
  '  padding: 1px 5px;',
  '  font-size: 10px;',
  '}',
].join('\n');

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
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInput = useCallback((val: string) => {
    setValue(val);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 14 * 1.5 * 22) + 'px';
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
    } catch (err) {
      showToast?.('Failed to attach file', 'error');
    }
  }, [showToast]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  const isStreaming = state.isStreaming;
  const isEmpty = value.trim().length === 0 && attachments.length === 0;
  const canSend = !isEmpty && !isStreaming;

  const sendBtnStyle: CSSProperties = {
    background: canSend
      ? 'linear-gradient(135deg, #6B9AF5 0%, #4A72E8 50%, #3558C8 100%)'
      : 'rgba(255,255,255,0.06)',
    color: canSend ? '#fff' : 'rgba(180,186,210,0.35)',
    boxShadow: canSend
      ? '0 2px 14px rgba(91,138,240,0.45), inset 0 1px 0 rgba(255,255,255,0.18)'
      : 'none',
    opacity: isStreaming ? 0.6 : 1,
  };

  return (
    <div
      style={{ padding: '0 16px 16px', flexShrink: 0 }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
          Promise.all(files.map(async (file) => ({
            id: generateUUID(),
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            kind: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
            previewUrl: file.type.startsWith('image/') ? await readFileAsDataUrl(file) : undefined,
          }))).then(next => setAttachments(prev => [...prev, ...next]));
        }
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: INPUT_STYLES }} />

      <div className={'arcus-chat-wrap' + (focused ? ' focused' : '') + (dragging ? ' dragging' : '')}>

        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px 0', position: 'relative', zIndex: 1 }}>
            {attachments.map((att) => (
              <div key={att.id} className="arcus-attachment-chip">
                {att.kind === 'image' && att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <span style={{ opacity: 0.65, flexShrink: 0, fontSize: 13 }}>
                    {att.type.includes('pdf') ? '\uD83D\uDCC4' : '\uD83D\uDCCE'}
                  </span>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                  {att.name}
                </span>
                <span style={{ opacity: 0.45, fontSize: 11, flexShrink: 0 }}>
                  {formatAttachmentSize(att.size)}
                </span>
                <button
                  className="arcus-remove-btn"
                  onClick={() => removeAttachment(att.id)}
                  aria-label={'Remove ' + att.name}
                >
                  &#xd7;
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '12px 16px 0', position: 'relative', zIndex: 1 }}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask anything\u2026"
            rows={1}
            aria-label="Message input"
            className="arcus-textarea"
          />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px 10px',
          gap: 8,
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md,.csv,.json"
              onChange={handleFilesSelected}
              style={{ display: 'none' }}
              aria-label="Attach files"
            />
            <button
              className="arcus-icon-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach files"
              aria-label="Attach files"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            <button
              className="arcus-icon-btn"
              onClick={() => setDeepResearch(v => !v)}
              title={deepResearch ? 'Deep Research on' : 'Deep Research off'}
              aria-label="Toggle Deep Research"
              aria-pressed={deepResearch}
              style={deepResearch ? {
                background: 'rgba(91,138,240,0.14)',
                borderColor: 'rgba(91,138,240,0.30)',
                color: '#7AAAFF',
                boxShadow: '0 0 10px rgba(91,138,240,0.18)',
              } : {}}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {state.settings?.model && (
              <span style={{
                fontSize: 11,
                color: 'rgba(180,186,210,0.40)',
                letterSpacing: '0.02em',
                userSelect: 'none',
              }}>
                {state.settings.model.split('/').pop()}
              </span>
            )}

            <button
              className={'arcus-send-btn' + (canSend ? ' active' : '')}
              onClick={handleSend}
              disabled={isEmpty && !isStreaming}
              aria-label={isStreaming ? 'Stop generation' : 'Send message'}
              style={sendBtnStyle}
            >
              {isStreaming ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="3" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        fontSize: 11,
        color: 'rgba(180,186,210,0.28)',
        marginTop: 8,
        letterSpacing: '0.01em',
      }}>
        Press <kbd className="arcus-kbd">Enter</kbd> to send &bull; <kbd className="arcus-kbd">Shift+Enter</kbd> for new line
      </div>
    </div>
  );
}
