'use client';

import { useState } from 'react';

const MODELS = [
  { id: 'black-forest-labs/flux-1.1-pro', name: 'FLUX 1.1 Pro' },
  { id: 'black-forest-labs/flux-schnell', name: 'FLUX Schnell' },
  { id: 'openai/dall-e-3', name: 'DALL-E 3' },
];

const STYLES = ['Photorealistic', 'Cinematic', 'Anime', 'Oil Painting', 'Watercolor', 'Digital Art', '3D Render', 'Sketch', 'Minimalist'];
const ASPECTS = ['1:1', '16:9', '9:16', '4:3', '3:2', '21:9'];

export default function StudioView() {
  const [prompt, setPrompt] = useState('');
  const [negPrompt, setNegPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [aspect, setAspect] = useState('1:1');
  const [showNeg, setShowNeg] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [subTab, setSubTab] = useState('image');

  const toggleStyle = (s: string) => {
    setSelectedStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden' }}>
      {/* Sub-nav */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 48, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
        background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        {['image', 'video', 'edit', 'upscale', 'describe'].map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{
            padding: '6px 16px', borderRadius: 'var(--radius-xs)', fontSize: 13, fontWeight: 500,
            color: subTab === t ? '#0A0A0A' : 'var(--text-secondary)',
            background: subTab === t ? '#fff' : 'transparent',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* Left Panel */}
      <div style={{
        width: 300, flexShrink: 0, marginTop: 48, overflowY: 'auto',
        background: 'var(--glass-panel)', backdropFilter: 'blur(22px) saturate(160%)',
        border: '1px solid var(--glass-border)', borderRadius: '0 0 0 0',
        padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Model picker */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Model</label>
          <select value={selectedModel.id} onChange={e => setSelectedModel(MODELS.find(m => m.id === e.target.value) || MODELS[0])} style={{
            width: '100%', padding: '8px 12px', background: 'var(--glass-input)',
            border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-pill)',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
          }}>
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        {/* Prompt */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Prompt</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="Describe what you want to create..."
            rows={5} style={{
              width: '100%', padding: 12, background: 'var(--glass-input)',
              border: '1px solid var(--glass-border)', borderRadius: 25,
              color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
              resize: 'vertical',
            }} />
          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>{prompt.length}/2000</div>
        </div>

        {/* Negative prompt */}
        <button onClick={() => setShowNeg(!showNeg)} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
          border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'inherit',
        }}>
          <span style={{ transform: showNeg ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>▾</span>
          Negative Prompt
        </button>
        {showNeg && (
          <textarea value={negPrompt} onChange={e => setNegPrompt(e.target.value)}
            placeholder="What to avoid..." rows={3} style={{
              width: '100%', padding: 12, background: 'var(--glass-input)',
              border: '1px solid var(--glass-border)', borderRadius: 25,
              color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
            }} />
        )}

        {/* Aspect */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Aspect Ratio</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ASPECTS.map(a => (
              <button key={a} onClick={() => setAspect(a)} style={{
                padding: '6px 12px', borderRadius: 'var(--radius-xs)', fontSize: 12,
                background: aspect === a ? 'var(--accent-blue-glow)' : 'var(--glass-button)',
                border: aspect === a ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                color: aspect === a ? 'var(--accent-blue)' : 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{a}</button>
            ))}
          </div>
        </div>

        {/* Styles */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Style Presets</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STYLES.map(s => (
              <button key={s} onClick={() => toggleStyle(s)} style={{
                padding: '5px 10px', borderRadius: 'var(--radius-xs)', fontSize: 12,
                background: selectedStyles.includes(s) ? 'var(--accent-blue-glow)' : 'var(--glass-button)',
                border: selectedStyles.includes(s) ? '1px solid var(--accent-blue)' : '1px solid transparent',
                color: selectedStyles.includes(s) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Generate */}
        <button disabled={!prompt.trim() || generating} onClick={() => setGenerating(true)} style={{
          width: '100%', height: 48, background: 'var(--accent-blue)',
          border: 'none', borderRadius: 'var(--radius-xl)', color: '#fff',
          fontSize: 14, fontWeight: 600, cursor: prompt.trim() && !generating ? 'pointer' : 'not-allowed',
          opacity: prompt.trim() && !generating ? 1 : 0.5, fontFamily: 'inherit',
        }}>
          {generating ? 'Generating...' : '✦ Generate'}
        </button>
      </div>

      {/* Center Canvas */}
      <div style={{ flex: 1, marginTop: 48, padding: 24, overflowY: 'auto' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: 'var(--text-muted)', textAlign: 'center',
          border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Your creations will appear here</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Generate something to get started</div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        width: 320, flexShrink: 0, marginTop: 48, overflowY: 'auto',
        background: 'var(--glass-panel)', backdropFilter: 'blur(22px) saturate(160%)',
        border: '1px solid var(--glass-border)', padding: 20,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>History</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No generations yet.</p>
      </div>
    </div>
  );
}
