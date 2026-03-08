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
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        padding: '8px 20px 8px 16px',
        background: 'var(--glass-panel)', backdropFilter: 'blur(22px)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-pill)',
        cursor: 'pointer', transition: 'all var(--dur-fast) var(--ease-out)',
      }}>
        <span style={{ fontWeight: 500, color: '#fff', fontSize: 14 }}>{state.selectedModel.name}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{state.selectedModel.provider} ▾</span>
      </button>

      {showModelSelector && <ModelSelector onClose={() => setShowModelSelector(false)} />}

      {/* Greeting */}
      {isEmpty && (
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center', zIndex: 1,
          animation: 'msgIn 600ms var(--ease-out) forwards', animationDelay: '200ms',
          opacity: 0,
        }}>
          <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', color: '#fff' }}>Hello there!</h1>
          <p style={{ fontSize: 28, fontWeight: 400, color: 'var(--text-secondary)', marginTop: 8 }}>How can I help you today?</p>
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
