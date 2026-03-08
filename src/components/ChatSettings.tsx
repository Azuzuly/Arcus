'use client';

import { useStore, DEFAULT_CHAT_SETTINGS } from '@/lib/store';
import { useState, useEffect, useRef } from 'react';
import { ChatSettings as ChatSettingsType } from '@/lib/types';
import { debounce } from '@/lib/utils';

const PARAM_SLIDERS: { key: keyof ChatSettingsType; label: string; desc: string; min: number; max: number; step: number }[] = [
  { key: 'temperature', label: 'Temperature', desc: 'Higher values make output more random, lower values more focused', min: 0, max: 2, step: 0.1 },
  { key: 'maxTokens', label: 'Max Tokens', desc: 'Maximum length of the generated response', min: 1, max: 128000, step: 1 },
  { key: 'topP', label: 'Top P', desc: 'Controls diversity via nucleus sampling', min: 0, max: 1, step: 0.01 },
  { key: 'topK', label: 'Top K', desc: 'Limits vocabulary to top K tokens (0 = disabled)', min: 0, max: 200, step: 1 },
  { key: 'frequencyPenalty', label: 'Frequency Penalty', desc: 'Reduces repetition of frequent words', min: -2, max: 2, step: 0.1 },
  { key: 'presencePenalty', label: 'Presence Penalty', desc: 'Encourages exploring new topics', min: -2, max: 2, step: 0.1 },
];

export default function ChatSettingsPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [settings, setSettings] = useState<ChatSettingsType>(state.chatSettings);
  const settingsPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSettings(state.chatSettings);
  }, [state.chatSettings]);

  const debouncedSave = debounce((key: keyof ChatSettingsType, value: number | string) => {
    dispatch({ type: 'SET_CHAT_SETTINGS', settings: { [key]: value } });
  }, 300);

  const handleInputChange = (key: keyof ChatSettingsType, value: string | number) => {
    const numValue = parseFloat(value as string);
    setSettings(prev => ({ ...prev, [key]: isNaN(numValue) ? value : numValue }));
    debouncedSave(key, value);
  };

  const handleSliderChange = (key: keyof ChatSettingsType, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    debouncedSave(key, value);
  };

  const handleSystemPromptChange = (value: string) => {
    setSettings(prev => ({ ...prev, systemPrompt: value }));
    debouncedSave('systemPrompt', value);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsPanelRef.current && !settingsPanelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div style={{
      position: 'absolute', bottom: 130, left: '50%', transform: 'translate(-50%, 0)',
      width: 'calc(100% - 48px)', maxWidth: 700, zIndex: 10,
      background: 'var(--glass-panel)', backdropFilter: 'blur(22px) saturate(160%)',
      border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
      padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div ref={settingsPanelRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Chat Settings</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => {
              setSettings({ ...DEFAULT_CHAT_SETTINGS });
              dispatch({ type: 'SET_CHAT_SETTINGS', settings: { ...DEFAULT_CHAT_SETTINGS } });
            }} style={{
              padding: '6px 12px', background: 'var(--glass-button)', border: '1px solid var(--glass-border)',
              borderRadius: 12, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}>Reset to Default</button>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20,
            }}>×</button>
          </div>
        </div>

        {/* System Prompt */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>System Prompt</label>
          <textarea value={settings.systemPrompt}
            onChange={e => handleSystemPromptChange(e.target.value)}
            placeholder="Instructions that guide the AI's behavior"
            style={{
              width: '100%', minHeight: 100, padding: 12, background: 'var(--glass-input)',
              border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)', fontSize: 13, fontFamily: "'Geist Mono', monospace",
              outline: 'none', resize: 'vertical',
            }} />
        </div>

        {/* Parameter Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {PARAM_SLIDERS.map(param => (
            <div key={param.key} style={{
              background: 'var(--glass-input)', borderRadius: 25, padding: 16,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{param.label}</label>
                <input type="number"
                  value={settings[param.key]}
                  onChange={e => handleInputChange(param.key, e.target.value)}
                  min={param.min} max={param.max} step={param.step}
                  style={{
                    width: 80, padding: '4px 8px', background: 'var(--glass-input-alt)',
                    border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)',
                    fontSize: 13, outline: 'none', fontFamily: 'inherit', textAlign: 'center',
                  }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{param.desc}</div>
              <input type="range"
                value={settings[param.key]}
                onChange={e => handleSliderChange(param.key, parseFloat(e.target.value))}
                min={param.min} max={param.max} step={param.step} 
                style={{ accentColor: 'var(--accent-blue)', width: '100%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
