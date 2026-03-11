/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { renderMarkdown } from '@/lib/markdown';
import { Message } from '@/lib/types';
import RichMessageExtras from './RichMessageExtras';
import TopicCards from './TopicCards';

interface ChatMessageProps {
  message: Message;
  showTimestamp?: boolean;
  onRetry?: () => void;
}

function detectLanguage(text: string): string {
  const langPatterns: [RegExp, string][] = [
    [/[\u3040-\u309F\u30A0-\u30FF]/, 'ja'],
    [/[\u4E00-\u9FFF]/, 'zh'],
    [/[\uAC00-\uD7AF]/, 'ko'],
    [/[\u0600-\u06FF]/, 'ar'],
    [/[\u0400-\u04FF]/, 'ru'],
    [/[\u0900-\u097F]/, 'hi'],
    [/[\u0E00-\u0E7F]/, 'th'],
    [/[àâäéèêëïîôùûüÿçœæ]/i, 'fr'],
    [/[äöüßẞ]/i, 'de'],
    [/[ñ¿¡áéíóú]/i, 'es'],
    [/[ãõçáéíóú]/i, 'pt'],
    [/[àèìòùé]/i, 'it'],
  ];
  for (const [pattern, lang] of langPatterns) {
    if (pattern.test(text)) return lang;
  }
  return 'en';
}

function pickNaturalVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  // Strict match first (e.g. 'en-US'), then prefix match (e.g. 'en')
  const exactMatch = voices.filter(v => v.lang.toLowerCase().replace('_', '-').startsWith(lang.toLowerCase()));
  // For English, prefer en-US or en-GB voices to avoid accented English
  const preferred = lang === 'en'
    ? exactMatch.filter(v => /en[-_](US|GB|AU)/i.test(v.lang))
    : exactMatch;
  const pool = preferred.length > 0 ? preferred : exactMatch;
  // Prefer natural/neural voices, then non-remote, then first available
  const natural = pool.find(v => /natural|neural|premium|enhanced|online/i.test(v.name));
  if (natural) return natural;
  const local = pool.find(v => v.localService);
  return local || pool[0] || null;
}

export default function ChatMessage({ message, showTimestamp = false, onRetry }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const hasSources = Boolean(message.research?.sources?.length);
  const hasWideExtras = !isUser && Boolean(message.customCard || message.toolUsage?.length || message.research?.sources?.length);
  const [hovered, setHovered] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.getVoices().length > 0;
  });

  useEffect(() => {
    if (voicesLoaded || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => setVoicesLoaded(true);
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [voicesLoaded]);

  const handleSpeak = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !message.content) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    const lang = detectLanguage(message.content);
    utterance.lang = lang;
    if (voicesLoaded) {
      const voice = pickNaturalVoice(lang);
      if (voice) utterance.voice = voice;
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [message.content, voicesLoaded]);

  const actionButtonClass = 'liquid-icon-btn';

  return (
    <>
      <div
        className="msg-enter"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          width: isUser ? 'auto' : hasWideExtras ? 'min(100%, 1180px)' : 'min(92%, 920px)',
          maxWidth: isUser ? 'min(72%, 760px)' : hasWideExtras ? 'min(100%, 1180px)' : 'min(92%, 920px)',
        }}
      >
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
        <div className={isUser ? 'liquid-bubble-user' : hasWideExtras ? 'liquid-bubble-assistant-wide' : 'liquid-bubble-assistant'} style={{
          padding: hasWideExtras ? '14px 16px' : '12px 16px', color: 'var(--text-primary)', fontSize: 14,
        }}>
          {!isUser && <RichMessageExtras message={message} />}
          {message.attachments && message.attachments.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: message.content ? 10 : 0 }}>
              {message.attachments.map(attachment => (
                <div key={attachment.id} style={{
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  overflow: 'hidden',
                  cursor: attachment.kind === 'image' ? 'pointer' : 'default',
                  flexShrink: 0,
                  width: 56, height: 56,
                }}
                onClick={() => { if (attachment.kind === 'image' && attachment.previewUrl) setLightboxUrl(attachment.previewUrl); }}
                title={attachment.kind === 'image' ? 'Click to preview' : attachment.name}
                >
                  {attachment.kind === 'image' && attachment.previewUrl ? (
                    <img src={attachment.previewUrl} alt={attachment.name} style={{ width: 56, height: 56, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📎</div>
                  )}
                </div>
              ))}
            </div>
          )}
          {isUser ? (
            message.content ? <div>{message.content}</div> : null
          ) : (
            <>
              <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content || '') }} />
              {message.content && !message.isStreaming && <TopicCards content={message.content} />}
            </>
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
        {/* Action buttons below bubble */}
        {!message.isStreaming && (message.content || message.attachments?.length) && (
          <div style={{
            display: 'flex', gap: 6, marginTop: 4, paddingLeft: 4,
            opacity: hovered ? 1 : 0, transition: 'opacity 140ms ease',
          }}>
            {!isUser && onRetry && (
              <button type="button" title="Retry response" onClick={onRetry} className={actionButtonClass} style={{ width: 28, height: 28, fontSize: 12 }}>↻</button>
            )}
            <button type="button" title="Copy message" onClick={() => navigator.clipboard.writeText(message.content || message.attachments?.map(item => item.name).join(', ') || '')} className={actionButtonClass} style={{ width: 28, height: 28, fontSize: 12 }}>⧉</button>
            {!isUser && message.content && (
              <button type="button" title="Read aloud" onClick={handleSpeak} className={actionButtonClass} style={{ width: 28, height: 28, fontSize: 12 }}>🔊</button>
            )}
            {!isUser && hasSources && (
              <button type="button" title="Open sources" onClick={() => window.open(message.research?.sources?.[0]?.url || '#', '_blank', 'noopener,noreferrer')} className={actionButtonClass} style={{ width: 28, height: 28, fontSize: 12 }}>↗</button>
            )}
          </div>
        )}
        {showTimestamp && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <img src={lightboxUrl} alt="Preview" style={{
            maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain',
            borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }} />
          <button aria-label="Close preview" onClick={() => setLightboxUrl(null)} style={{
            position: 'absolute', top: 20, right: 20,
            width: 40, height: 40, borderRadius: 999,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
      )}
    </>
  );
}
