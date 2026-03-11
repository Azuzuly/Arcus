/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { ChatAttachment } from '@/lib/types';
import { generateUUID } from '@/lib/utils';

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

function isLikelyLocalWeatherPrompt(query: string): boolean {
  return /^(?:weather|forecast|temperature|rain|snow|wind|humidity|humid)(?:\s+(?:today|now|outside|please))?[?.!]*$/i.test(query.trim())
    || /(what'?s|what is|current|today|now|outside|here|my area|where i live).*(weather|forecast|temperature)|\b(weather|forecast)\b.*(here|now|today|outside|current)/i.test(query);
}

function requestBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof window === 'undefined' || !window.isSecureContext || !('geolocation' in navigator)) return Promise.resolve(null);
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

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

export default function ChatInput({
  onSend,
  workspace = 'home',
  defaultDeepResearch = false,
  placeholder,
}: {
  onSend: (content: string, meta?: { deepResearch?: boolean; attachments?: ChatAttachment[]; deviceLocation?: { latitude: number; longitude: number } | null }) => void;
  workspace?: 'home' | 'research';
  defaultDeepResearch?: boolean;
  placeholder?: string;
}) {
  const { state, dispatch, showToast } = useStore();
  const [value, setValue] = useState('');
  const [deepResearch, setDeepResearch] = useState(defaultDeepResearch);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const dictationBaseRef = useRef('');
  const finalTranscriptRef = useRef('');
  // unused, we check isEmpty below instead

  const handleInput = useCallback((val: string) => {
    setValue(val);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 14 * 1.5 * 6) + 'px';
    }
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || state.isStreaming) return;
    const deviceLocation = trimmed && isLikelyLocalWeatherPrompt(trimmed) ? await requestBrowserLocation() : null;
    onSend(trimmed, { deepResearch, attachments, deviceLocation });
    setValue('');
    setDeepResearch(defaultDeepResearch);
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [value, state.isStreaming, onSend, deepResearch, attachments, defaultDeepResearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
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

  useEffect(() => () => {
    recognitionRef.current?.stop();
  }, []);

  const stopDictation = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const handleLocationClick = useCallback(async () => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      showToast('Location access requires HTTPS or localhost.', 'warning');
      return;
    }

    const location = await requestBrowserLocation();
    if (location) {
      showToast('Location permission is enabled for local weather.', 'success');
    } else {
      showToast('Location permission was not granted. Check your browser site permissions if no prompt appeared.', 'warning');
    }
  }, [showToast]);

  const handleMicClick = useCallback(async () => {
    if (isListening) {
      stopDictation();
      return;
    }

    if (typeof window === 'undefined') return;
    if (!window.isSecureContext) {
      showToast('Microphone access requires HTTPS or localhost.', 'warning');
      return;
    }

    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      showToast('Live dictation is not supported in this browser.', 'warning');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('Microphone access is unavailable in this browser context.', 'warning');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch {
      showToast('Microphone permission is required for live dictation. Check your browser site permissions if no prompt appeared.', 'warning');
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    dictationBaseRef.current = value ? `${value.trimEnd()}${value.trim() ? ' ' : ''}` : '';
    finalTranscriptRef.current = '';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript || '';
        if (result?.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      finalTranscriptRef.current = finalTranscript;
      handleInput(`${dictationBaseRef.current}${finalTranscript}${interimTranscript}`.trimStart());
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error && event.error !== 'no-speech' && event.error !== 'aborted') {
        showToast('Microphone dictation hit an error. Please try again.', 'error');
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [handleInput, isListening, showToast, stopDictation, value]);

  const tokenEstimate = Math.ceil((value.length + attachments.reduce((total, item) => total + item.name.length, 0)) / 4);

  return (
    <div className="chat-input-wrapper" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 clamp(10px, 3vw, 18px) clamp(10px, 3vw, 18px)', zIndex: 10 }}>
      {attachments.length > 0 && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 2px 10px' }}>
          {attachments.map(attachment => (
            <div key={attachment.id} style={{
              minWidth: attachment.kind === 'image' ? 100 : 140,
              maxWidth: 200,
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
                aria-label={`Remove ${attachment.name}`}
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
      <div className="gradient-border-wrap liquid-input-container" style={{
        padding: '12px 14px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setDeepResearch(v => !v)}
              title="Deep Research"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                borderRadius: 999,
                border: `1px solid ${deepResearch ? 'rgba(127,194,255,0.42)' : 'rgba(255,255,255,0.08)'}`,
                background: deepResearch ? 'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(143,92,246,0.18))' : 'rgba(255,255,255,0.045)',
                color: deepResearch ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                boxShadow: deepResearch ? '0 12px 28px rgba(59,130,246,0.16)' : 'none',
                transition: 'all var(--dur-base) var(--ease-out)',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <span>🔬</span>
              <span>{workspace === 'research' ? 'Research mode' : 'Deep research'}</span>
              <span style={{ fontSize: 10, color: deepResearch ? 'rgba(255,255,255,0.74)' : 'var(--text-muted)' }}>
                {deepResearch ? 'On' : 'Off'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => dispatch({ type: 'SHOW_MODAL', modal: 'personalization' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 999,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              }}
            >
              ✦ Personalize
            </button>
          </div>

          <span style={{
            fontSize: 11,
            color: state.preferences.webSearchEnabled ? 'var(--accent-mint)' : 'var(--text-muted)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-pill)',
            background: state.preferences.webSearchEnabled ? 'rgba(111,177,120,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${state.preferences.webSearchEnabled ? 'rgba(111,177,120,0.18)' : 'rgba(255,255,255,0.08)'}`,
          }}>
            {workspace === 'research' ? 'Citations ready' : state.preferences.webSearchEnabled ? 'Web on' : 'Web off'} · {tokenEstimate} tokens
          </span>
        </div>

        <textarea ref={textareaRef} value={value}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || (deepResearch ? 'Ask Arcus to research deeply…' : 'Ask Arcus')}
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
              className="liquid-icon-btn"
            >
              +
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              title={isListening ? 'Stop dictation' : 'Start dictation'}
              onClick={handleMicClick}
              className={`liquid-icon-btn ${isListening ? 'mic-active' : ''}`}
              style={isListening ? {
                color: '#fff',
                background: 'rgba(239,68,68,0.18)',
                borderColor: 'rgba(239,68,68,0.32)',
              } : undefined}
            >
              🎤
            </button>
            {isListening && (
              <div className="voice-wave">
                <span /><span /><span /><span /><span />
              </div>
            )}
            <button
              type="button"
              title="Enable location"
              onClick={handleLocationClick}
              className="liquid-icon-btn"
            >
              📍
            </button>
            {(value.trim() || attachments.length > 0) && (
              <button type="button" onClick={() => { void handleSend(); }} title="Send message" className="liquid-send-btn">↑</button>
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
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span className="privacy-badge" style={{ fontSize: 10, padding: '3px 8px' }}>🔒 Private</span>
        Arcus can make mistakes
      </div>
    </div>
  );
}
