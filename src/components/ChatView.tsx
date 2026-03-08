'use client';

import { useStore } from '@/lib/store';
import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { streamChatCompletion, chatCompletion } from '@/lib/openrouter';
import { generateUUID } from '@/lib/utils';
import { Message, PromptModes } from '@/lib/types';
import { getProviderMeta } from '@/lib/providers';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';

function ProviderLogo({ modelId }: { modelId: string }) {
  const provider = getProviderMeta(modelId);

  return (
    <span style={{
      width: 22,
      height: 22,
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: provider.bg,
      color: provider.fg,
      fontSize: provider.short.length > 1 ? 9 : 12,
      fontWeight: 700,
      boxShadow: `0 0 0 1px ${provider.ring}`,
      flexShrink: 0,
    }}>
      {provider.short}
    </span>
  );
}

export default function ChatView() {
  const { state, dispatch, showToast, createNewChat } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);

  const activeConv = state.conversations.find(c => c.id === state.activeChatId);
  const isEmpty = !activeConv || activeConv.messages.length === 0;
  const lastMessageContent = activeConv?.messages[activeConv.messages.length - 1]?.content;
  const modelSubtitle = useMemo(() => {
    const currentModel = state.allModels.find(model => model.id === state.selectedModel.id);
    return currentModel?.bestFor?.slice(0, 2).join(' · ') || state.selectedModel.provider;
  }, [state.allModels, state.selectedModel.id, state.selectedModel.provider]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages.length, lastMessageContent]);

  const sendMessage = useCallback(async (content: string, modes: PromptModes) => {
    const chatId = state.activeChatId || createNewChat();

    const userMsg: Message = {
      id: generateUUID(), role: 'user', content, timestamp: Date.now(),
    };
    const assistantMsg: Message = {
      id: generateUUID(), role: 'assistant', content: '', timestamp: Date.now(),
      model: state.selectedModel, isStreaming: true,
    };

    const conv = state.conversations.find(c => c.id === chatId);
    const updatedMessages = [...(conv?.messages || []), userMsg, assistantMsg];

    dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { messages: updatedMessages, model: state.selectedModel } });
    dispatch({ type: 'SET_ACTIVE_CHAT', id: chatId });
    dispatch({ type: 'SET_STREAMING', streaming: true });

    const apiMessages = updatedMessages
      .filter(m => m.role !== 'system' && !m.isStreaming)
      .map(m => ({ role: m.role, content: m.content }));

    const systemMessages: Array<{ role: 'system'; content: string }> = [];

    if (state.chatSettings.systemPrompt) {
      systemMessages.push({ role: 'system', content: state.chatSettings.systemPrompt });
    }

    if (state.memory.enabled && state.memory.items.length > 0) {
      const memoryPrompt = 'Known user facts: ' + state.memory.items.map(item => item.text).join('; ');
      systemMessages.push({ role: 'system', content: memoryPrompt });
    }

    if (modes.personalization) {
      const details = [
        `Name: ${state.user.username || 'User'}`,
        state.settings.occupation ? `Occupation: ${state.settings.occupation}` : '',
        state.settings.location ? `Location: ${state.settings.location}` : '',
        state.settings.bio ? `Bio: ${state.settings.bio}` : '',
        `Preferred response style: ${state.settings.responseStyle}`,
      ].filter(Boolean).join('; ');

      systemMessages.push({
        role: 'system',
        content: `Personalization is active. Adapt tone and examples to the user profile when it is genuinely helpful. ${details}`,
      });
    }

    if (modes.webSearch || modes.deepResearch) {
      try {
        const response = await fetch('/api/web-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: content, deepResearch: modes.deepResearch }),
        });

        if (response.ok) {
          const data = await response.json() as { results?: Array<{ title: string; url: string; snippet: string }> };
          if (data.results && data.results.length > 0) {
            const searchContext = data.results
              .map((result, index) => `${index + 1}. ${result.title}\n${result.snippet}\nSource: ${result.url}`)
              .join('\n\n');

            systemMessages.push({
              role: 'system',
              content: `${modes.deepResearch ? 'Deep research' : 'Web search'} mode is active. Use the verified search context below, cite the linked sources inline when relevant, and mention uncertainty when the search results are incomplete.\n\n${searchContext}`,
            });
          }
        } else {
          showToast('Web search was unavailable, so Arcus answered without live context.', 'warning');
        }
      } catch {
        showToast('Web search failed, so Arcus answered without live context.', 'warning');
      }
    }

    if (modes.deepResearch) {
      systemMessages.push({
        role: 'system',
        content: 'Deep research mode is active. Think step by step, compare evidence, and answer in a structured format with a concise conclusion at the end.',
      });
    }

    apiMessages.unshift(...systemMessages);

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
              messages: updatedMessages.map(message => message.id === assistantId ? { ...message, content: full } : message),
            },
          });
        },
        onDone: (full) => {
          const finalMessages = updatedMessages.map(message =>
            message.id === assistantId ? { ...message, content: full, isStreaming: false } : message
          );
          dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { messages: finalMessages } });
          dispatch({ type: 'SET_STREAMING', streaming: false });
          dispatch({ type: 'TRACK_REQUEST', modelId: state.selectedModel.id, tokens: Math.ceil(full.length / 4) });

          if ((conv?.title || 'New Chat') === 'New Chat') {
            chatCompletion(
              [{ role: 'user', content: `Summarize in 5 words or less: ${content}` }],
              { model: state.selectedModel.id }
            ).then(title => {
              if (title) {
                dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { title: title.trim().replace(/^"|"$/g, '') } });
              }
            }).catch(() => {});
          }
        },
        onError: (error) => {
          const finalMessages = updatedMessages.map(message =>
            message.id === assistantId ? { ...message, content: `Error: ${error}`, isStreaming: false } : message
          );
          dispatch({ type: 'UPDATE_CONVERSATION', id: chatId, updates: { messages: finalMessages } });
          dispatch({ type: 'SET_STREAMING', streaming: false });
          showToast(error, 'error');
        },
      }
    );
  }, [createNewChat, dispatch, showToast, state]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <button onClick={() => setShowModelSelector(!showModelSelector)} style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px',
        background: 'rgba(245,247,255,0.08)', backdropFilter: 'blur(26px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-pill)',
        cursor: 'pointer', transition: 'all var(--dur-fast) var(--ease-out)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.24)',
        fontFamily: 'inherit', minWidth: 280,
      }}>
        <ProviderLogo modelId={state.selectedModel.id} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
          <span style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{state.selectedModel.name}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{modelSubtitle}</span>
        </div>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 12 }}>▾</span>
      </button>

      {showModelSelector && <ModelSelector onClose={() => setShowModelSelector(false)} />}

      {isEmpty && (
        <div style={{
          position: 'absolute', bottom: 220, left: 0, right: 0,
          textAlign: 'center', zIndex: 1,
          animation: 'msgIn 600ms var(--ease-out) forwards', animationDelay: '200ms',
          opacity: 0,
        }}>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 30px)', fontWeight: 600, letterSpacing: '-0.02em', color: '#fff' }}>Ready when you are.</h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', fontWeight: 400, color: 'var(--text-secondary)', marginTop: 8 }}>
            Ask a question, turn on research, or personalize the reply.
          </p>
        </div>
      )}

      {!isEmpty && (
        <div style={{
          position: 'absolute', top: 78, bottom: 130, left: 0, right: 0,
          overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
          scrollBehavior: 'smooth',
        }}>
          {activeConv?.messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      <ChatInput onSend={sendMessage} />
    </div>
  );
}
