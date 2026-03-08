'use client';

import { useStore } from '@/lib/store';
import { useRef, useEffect, useCallback, useState } from 'react';
import { streamChatCompletion, chatCompletion } from '@/lib/openrouter';
import { generateUUID } from '@/lib/utils';
import { Message } from '@/lib/types';
import AuroraBackground from './AuroraBackground';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';

export default function ChatView() {
  const { state, dispatch, showToast } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);

  const activeConv = state.conversations.find(c => c.id === state.activeChatId);
  const isEmpty = !activeConv || activeConv.messages.length === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages?.length, activeConv?.messages?.[activeConv?.messages?.length - 1]?.content]);

  const sendMessage = useCallback(async (content: string) => {
    if (!state.activeChatId) return;

    const userMsg: Message = {
      id: generateUUID(), role: 'user', content, timestamp: Date.now(),
    };
    const assistantMsg: Message = {
      id: generateUUID(), role: 'assistant', content: '', timestamp: Date.now(),
      model: state.selectedModel, isStreaming: true,
    };

    const conv = state.conversations.find(c => c.id === state.activeChatId);
    if (!conv) return;
    const updatedMessages = [...conv.messages, userMsg, assistantMsg];

    dispatch({ type: 'UPDATE_CONVERSATION', id: state.activeChatId, updates: { messages: updatedMessages } });
    dispatch({ type: 'SET_STREAMING', streaming: true });

    const apiMessages = updatedMessages
      .filter(m => m.role !== 'system' && !m.isStreaming)
      .map(m => ({ role: m.role, content: m.content }));

    if (state.chatSettings.systemPrompt) {
      apiMessages.unshift({ role: 'system', content: state.chatSettings.systemPrompt });
    }
    if (state.memory.enabled && state.memory.items.length > 0) {
      const memoryPrompt = 'The user has shared these facts about themselves: ' + state.memory.items.map(i => i.text).join('; ');
      apiMessages.unshift({ role: 'system', content: memoryPrompt });
    }

    const chatId = state.activeChatId;
    const assistantId = assistantMsg.id;

    await streamChatCompletion(
      apiMessages,
      {
        model: state.selectedModel.id,
        temperature: state.chatSettings.temperature,
        maxTokens: state.chatSettings.maxTokens,
        topP: state.chatSettings.topP,
        frequencyPenalty: state.chatSettings.frequencyPenalty,
        presencePenalty: state.chatSettings.presencePenalty,
      },
      {
        onChunk: (_delta, full) => {
          dispatch({
            type: 'UPDATE_CONVERSATION', id: chatId,
            updates: {
              messages: updatedMessages.map(m => m.id === assistantId ? { ...m, content: full } : m),
            },
          });
        },
        onDone: (full) => {
          const finalMessages = updatedMessages.map(m =>
            m.id === assistantId ? { ...m, content: full, isStreaming: false } : m
          );
          dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { messages: finalMessages } });
          dispatch({ type: 'SET_STREAMING', streaming: false });
          dispatch({ type: 'TRACK_REQUEST', modelId: state.selectedModel.id, tokens: Math.ceil(full.length / 4) });

          // Auto-title after first response
          const convNow = state.conversations.find(c => c.id === chatId);
          if (convNow && convNow.title === 'New Chat') {
            chatCompletion(
              [{ role: 'user', content: `Summarize in 5 words or less: ${content}` }],
              { model: state.selectedModel.id }
            ).then(title => {
              if (title) dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { title: title.trim().replace(/^"|"$/g, '') } });
            }).catch(() => {});
          }
        },
        onError: (error) => {
          const finalMessages = updatedMessages.map(m =>
            m.id === assistantId ? { ...m, content: `Error: ${error}`, isStreaming: false } : m
          );
          dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { messages: finalMessages } });
          dispatch({ type: 'SET_STREAMING', streaming: false });
          showToast(error, 'error');
        },
      }
    );
  }, [state, dispatch, showToast]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Aurora */}
      {isEmpty && <AuroraBackground />}

      {/* Model selector button */}
      <button onClick={() => setShowModelSelector(!showModelSelector)} style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 16px 7px 12px',
        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-pill)',
        cursor: 'pointer', transition: 'all var(--dur-base) var(--ease-out)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.3)',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: 6,
          background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-violet) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#fff', flexShrink: 0,
        }}>◆</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.92)', fontSize: 13, lineHeight: 1.2 }}>{state.selectedModel.name}</span>
          <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10, lineHeight: 1.2 }}>{state.selectedModel.provider}</span>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.45, marginLeft: 2 }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {showModelSelector && <ModelSelector onClose={() => setShowModelSelector(false)} />}

      {/* Greeting */}
      {isEmpty && (
        <div style={{
          position: 'absolute', bottom: 200, left: 0, right: 0,
          textAlign: 'center', zIndex: 1,
          animation: 'msgIn 600ms var(--ease-out) forwards', animationDelay: '200ms',
          opacity: 0, padding: '0 24px',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14,
            background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)',
            borderRadius: 'var(--radius-pill)', padding: '5px 14px',
          }}>
            <span style={{ fontSize: 11, color: 'rgba(79,142,247,0.9)', letterSpacing: '0.04em', fontWeight: 600 }}>ARCUS AI</span>
          </div>
          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.1, marginBottom: 10,
          }}>
            Hello, {state.user.username}!
          </h1>
          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 400,
            color: 'rgba(255,255,255,0.45)', lineHeight: 1.5,
          }}>
            What can I help you with today?
          </p>
        </div>
      )}

      {/* Messages */}
      {!isEmpty && (
        <div style={{
          position: 'absolute', top: 70, bottom: 130, left: 0, right: 0,
          overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
          scrollBehavior: 'smooth',
        }}>
          {activeConv?.messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
