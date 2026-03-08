'use client';

import { useState, useRef, useCallback } from 'react';

interface Generation {
  id: string;
  prompt: string;
  negPrompt?: string;
  model: string;
  style: string;
  aspect: string;
  lighting: string;
  mood: string;
  timestamp: number;
  status: 'generating' | 'done' | 'error';
  imageUrl?: string;
  seed?: string;
  steps?: number;
  cfg?: number;
  camera?: string;
  colorPalette?: string;
}

const MODELS = [
  { id: 'flux-1.1-pro', name: 'FLUX 1.1 Pro', provider: 'Black Forest Labs', emoji: '⚡', desc: 'Highest quality', badge: 'Best' },
  { id: 'flux-schnell', name: 'FLUX Schnell', provider: 'Black Forest Labs', emoji: '💨', desc: 'Ultra fast', badge: 'Fast' },
  { id: 'dall-e-3', name: 'DALL-E 3', provider: 'OpenAI', emoji: '🎯', desc: 'Precise prompts', badge: null },
  { id: 'stable-diffusion-xl', name: 'SDXL', provider: 'Stability AI', emoji: '🎨', desc: 'Most customizable', badge: null },
  { id: 'flux-pro-ultra', name: 'FLUX Pro Ultra', provider: 'Black Forest Labs', emoji: '🌟', desc: 'Max resolution', badge: 'Pro' },
  { id: 'ideogram-v2', name: 'Ideogram V2', provider: 'Ideogram AI', emoji: '🔤', desc: 'Great with text', badge: null },
];

const STYLES = [
  { id: 'none', label: 'None', emoji: '✨', desc: 'No style' },
  { id: 'photorealistic', label: 'Photo', emoji: '📷', desc: 'Hyperrealistic' },
  { id: 'cinematic', label: 'Cinematic', emoji: '🎬', desc: 'Movie quality' },
  { id: 'anime', label: 'Anime', emoji: '🌸', desc: 'Japanese animation' },
  { id: 'oil-painting', label: 'Oil Paint', emoji: '🖼️', desc: 'Classical art' },
  { id: 'watercolor', label: 'Watercolor', emoji: '💧', desc: 'Soft & fluid' },
  { id: 'digital-art', label: 'Digital', emoji: '🖥️', desc: 'CG artwork' },
  { id: '3d-render', label: '3D Render', emoji: '🎲', desc: 'CGI realistic' },
  { id: 'sketch', label: 'Sketch', emoji: '✏️', desc: 'Hand drawn' },
  { id: 'pixel-art', label: 'Pixel Art', emoji: '👾', desc: 'Retro gaming' },
  { id: 'comic', label: 'Comic', emoji: '💥', desc: 'Comic book' },
  { id: 'neon', label: 'Neon', emoji: '💜', desc: 'Glowing lights' },
  { id: 'impressionist', label: 'Impressionist', emoji: '🌅', desc: 'Painterly strokes' },
  { id: 'concept-art', label: 'Concept Art', emoji: '🛸', desc: 'Sci-fi / fantasy' },
  { id: 'product', label: 'Product', emoji: '📦', desc: 'Clean product shot' },
  { id: 'portrait', label: 'Portrait', emoji: '🧑', desc: 'Face focused' },
];

const ASPECTS = [
  { id: '1:1', label: '1:1', w: 40, h: 40, desc: 'Square' },
  { id: '16:9', label: '16:9', w: 48, h: 27, desc: 'Landscape' },
  { id: '9:16', label: '9:16', w: 27, h: 48, desc: 'Portrait' },
  { id: '4:3', label: '4:3', w: 44, h: 33, desc: 'Classic' },
  { id: '3:2', label: '3:2', w: 45, h: 30, desc: 'Photo' },
  { id: '21:9', label: '21:9', w: 56, h: 24, desc: 'Ultrawide' },
  { id: '2:3', label: '2:3', w: 30, h: 45, desc: 'Tall' },
];

const LIGHTINGS = [
  { id: 'none', label: 'Natural', emoji: '☀️' },
  { id: 'golden-hour', label: 'Golden Hour', emoji: '🌅' },
  { id: 'blue-hour', label: 'Blue Hour', emoji: '🌆' },
  { id: 'studio', label: 'Studio', emoji: '💡' },
  { id: 'dramatic', label: 'Dramatic', emoji: '🎭' },
  { id: 'neon-light', label: 'Neon', emoji: '🟣' },
  { id: 'backlit', label: 'Backlit', emoji: '✨' },
  { id: 'low-key', label: 'Low Key', emoji: '🌑' },
];

const MOODS = [
  { id: 'none', label: 'Neutral' },
  { id: 'serene', label: 'Serene' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'mysterious', label: 'Mysterious' },
  { id: 'joyful', label: 'Joyful' },
  { id: 'dark', label: 'Dark' },
  { id: 'futuristic', label: 'Futuristic' },
  { id: 'nostalgic', label: 'Nostalgic' },
  { id: 'ethereal', label: 'Ethereal' },
];

const CAMERAS = [
  { id: 'none', label: 'Default' },
  { id: '35mm', label: '35mm Film' },
  { id: '85mm', label: '85mm Portrait' },
  { id: 'wide-angle', label: 'Wide Angle' },
  { id: 'macro', label: 'Macro' },
  { id: 'drone', label: 'Drone / Aerial' },
  { id: 'fisheye', label: 'Fisheye' },
];

const COLOR_PALETTES = [
  { id: 'none', label: 'Auto', colors: [] },
  { id: 'warm', label: 'Warm', colors: ['#FF6B35', '#F7B731', '#EE5A24'] },
  { id: 'cool', label: 'Cool', colors: ['#4FACFE', '#00F2FE', '#43E97B'] },
  { id: 'monochrome', label: 'Mono', colors: ['#fff', '#888', '#111'] },
  { id: 'pastel', label: 'Pastel', colors: ['#FFB3C6', '#C3ABF5', '#A8D8EA'] },
  { id: 'earthy', label: 'Earthy', colors: ['#8B4513', '#D2691E', '#228B22'] },
  { id: 'sunset', label: 'Sunset', colors: ['#FF6B6B', '#FFE66D', '#A8E6CF'] },
];

const PROMPT_SUGGESTIONS = [
  'A cyberpunk city at night with neon reflections on rain-soaked streets',
  'Portrait of a mystical sorceress with glowing eyes in enchanted forest',
  'A cozy cabin in the mountains during snowfall, warm light inside',
  'Abstract art with flowing liquid metal and bioluminescent particles',
  'Space station overlooking Earth with aurora borealis visible below',
  'Ancient Japanese temple at cherry blossom season, misty morning',
  'Hyper-detailed close up of a mechanical watch movement, macro photography',
  'Futuristic city with flying vehicles and holographic advertisements',
];

const ARTIST_STYLES = [
  { id: 'none', label: 'None' },
  { id: 'greg-rutkowski', label: 'Greg Rutkowski' },
  { id: 'artgerm', label: 'Artgerm' },
  { id: 'alphonse-mucha', label: 'A. Mucha' },
  { id: 'wlop', label: 'WLOP' },
  { id: 'james-jean', label: 'James Jean' },
  { id: 'stanley-kubrick', label: 'Kubrick' },
  { id: 'hayao-miyazaki', label: 'Miyazaki' },
];

const ASPECT_DIMS: Record<string, string> = {
  '9:16': '512/912', '16:9': '912/512', '21:9': '1024/440', '2:3': '512/768',
};
function getAspectDim(aspect: string): string {
  return ASPECT_DIMS[aspect] ?? '512/512';
}

function getImageTags(gen: { model: string; style: string; aspect: string; lighting: string; mood: string }): string[] {
  return [
    gen.model,
    gen.style !== 'none' ? gen.style : null,
    gen.aspect,
    gen.lighting !== 'none' ? gen.lighting : null,
    gen.mood !== 'none' ? gen.mood : null,
  ].filter((t): t is string => Boolean(t));
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 7,
  display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700,
};

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
        background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 6px 0',
        fontFamily: 'inherit',
      }}>
        <span style={sectionLabelStyle as React.CSSProperties}>{title}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.15s', opacity: 0.35, flexShrink: 0 }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function Toggle({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 8 }}>
      <div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>{desc}</div>}
      </div>
      <div onClick={() => onChange(!value)} style={{
        width: 34, height: 19, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
        background: value ? 'rgba(79,142,247,0.85)' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.2s',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 16 : 2,
          width: 13, height: 13, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </label>
  );
}

export default function StudioView() {
  const [prompt, setPrompt] = useState('');
  const [negPrompt, setNegPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedStyle, setSelectedStyle] = useState('none');
  const [aspect, setAspect] = useState('1:1');
  const [lighting, setLighting] = useState('none');
  const [mood, setMood] = useState('none');
  const [camera, setCamera] = useState('none');
  const [colorPalette, setColorPalette] = useState('none');
  const [artistStyle, setArtistStyle] = useState('none');
  const [steps, setSteps] = useState(30);
  const [cfg, setCfg] = useState(7);
  const [seed, setSeed] = useState('');
  const [count, setCount] = useState(1);
  const [history, setHistory] = useState<Generation[]>([]);
  const [selected, setSelected] = useState<Generation | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'upscale' | 'describe'>('generate');
  const [showNeg, setShowNeg] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'done' | 'error'>('all');
  const [promptEnhance, setPromptEnhance] = useState(false);
  const [hdMode, setHdMode] = useState(false);
  const [upscaleFactor, setUpscaleFactor] = useState(2);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    const genSeed = seed || String(Math.floor(Math.random() * 999999));
    for (let i = 0; i < count; i++) {
      const gen: Generation = {
        id: crypto.randomUUID(),
        prompt: prompt.trim(),
        negPrompt: negPrompt.trim() || undefined,
        model: selectedModel.name,
        style: selectedStyle,
        lighting,
        mood,
        camera,
        colorPalette,
        aspect,
        seed: genSeed,
        steps,
        cfg,
        timestamp: Date.now(),
        status: 'generating',
      };
      setHistory(prev => [gen, ...prev]);
      if (i === 0) setSelected(gen);

      const delay = 1800 + i * 600;
      setTimeout(() => {
        const dim = getAspectDim(aspect);
        const imgUrl = `https://picsum.photos/seed/${gen.id.slice(0, 8)}/${dim}`;
        setHistory(prev => prev.map(g => g.id === gen.id ? { ...g, status: 'done', imageUrl: imgUrl } : g));
        setSelected(prev => prev?.id === gen.id ? { ...prev, status: 'done' as const, imageUrl: imgUrl } : prev);
      }, delay);
    }
  }, [prompt, negPrompt, selectedModel, selectedStyle, lighting, mood, camera, colorPalette, aspect, seed, steps, cfg, count]);

  const handleDownload = useCallback((gen: Generation) => {
    if (!gen.imageUrl) return;
    const a = document.createElement('a');
    a.href = gen.imageUrl;
    a.download = `arcus-studio-${gen.id.slice(0, 8)}.jpg`;
    a.target = '_blank';
    a.click();
  }, []);

  const filteredHistory = history.filter(g => historyFilter === 'all' ? true : g.status === historyFilter);

  const SUB_TABS = [
    { id: 'generate' as const, label: 'Generate', icon: '✦' },
    { id: 'edit' as const, label: 'Edit', icon: '✎' },
    { id: 'upscale' as const, label: 'Upscale', icon: '⬆' },
    { id: 'describe' as const, label: 'Describe', icon: '👁' },
  ];

  const spinnerStyle: React.CSSProperties = {
    width: 20, height: 20, borderRadius: '50%',
    border: '2px solid rgba(79,142,247,0.2)', borderTopColor: '#4F8EF7',
    animation: 'spin 0.7s linear infinite',
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-void)' }}>
      {/* Sub-nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 20px', flexShrink: 0,
        background: 'rgba(8,8,12,0.7)', backdropFilter: 'blur(30px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-pill)',
          padding: 3, border: '1px solid rgba(255,255,255,0.07)',
        }}>
          {SUB_TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '5px 16px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 500,
              color: activeTab === t.id ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.45)',
              background: activeTab === t.id ? 'rgba(255,255,255,0.92)' : 'transparent',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: activeTab === t.id ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            }}>
              <span style={{ fontSize: 11 }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            {(['single', 'grid'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: '5px 10px', background: viewMode === v ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer', color: viewMode === v ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', fontSize: 14,
              }}>{v === 'single' ? '⊡' : '⊞'}</button>
            ))}
          </div>
          {history.length > 0 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{history.length} generated</span>}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel */}
        <div style={{
          width: 'clamp(270px, 22vw, 305px)', flexShrink: 0, overflowY: 'auto',
          background: 'rgba(8,8,12,0.6)', backdropFilter: 'blur(30px)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '14px 13px 24px', display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {activeTab === 'generate' && (
            <>
              <Section title="Model">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {MODELS.map(m => (
                    <button key={m.id} onClick={() => setSelectedModel(m)} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px',
                      borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      background: selectedModel.id === m.id ? 'rgba(79,142,247,0.1)' : 'rgba(255,255,255,0.02)',
                      border: selectedModel.id === m.id ? '1px solid rgba(79,142,247,0.25)' : '1px solid transparent',
                      transition: 'all 0.15s', width: '100%',
                    }}
                    onMouseEnter={e => { if (selectedModel.id !== m.id) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; } }}
                    onMouseLeave={e => { if (selectedModel.id !== m.id) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; } }}>
                      <span style={{ fontSize: 16 }}>{m.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>{m.name}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{m.desc}</div>
                      </div>
                      {m.badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                          background: m.badge === 'Pro' ? 'rgba(155,114,246,0.2)' : m.badge === 'Fast' ? 'rgba(45,212,191,0.2)' : 'rgba(79,142,247,0.2)',
                          color: m.badge === 'Pro' ? 'rgba(155,114,246,0.9)' : m.badge === 'Fast' ? 'rgba(45,212,191,0.9)' : 'rgba(79,142,247,0.9)',
                          border: `1px solid ${m.badge === 'Pro' ? 'rgba(155,114,246,0.3)' : m.badge === 'Fast' ? 'rgba(45,212,191,0.3)' : 'rgba(79,142,247,0.3)'}`,
                          letterSpacing: '0.05em',
                        }}>{m.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Prompt">
                <textarea ref={textareaRef} value={prompt} onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe your image in detail..." rows={4}
                  style={{
                    width: '100%', padding: 10, marginBottom: 4,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                    color: 'rgba(255,255,255,0.9)', fontSize: 12.5, outline: 'none',
                    fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(79,142,247,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{prompt.length}/2000</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => setPrompt(PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)])} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 10,
                      color: 'rgba(79,142,247,0.7)', fontFamily: 'inherit',
                    }}>🎲 Random</button>
                    <button onClick={() => setPromptEnhance(v => !v)} style={{
                      background: promptEnhance ? 'rgba(79,142,247,0.15)' : 'rgba(255,255,255,0.04)',
                      border: promptEnhance ? '1px solid rgba(79,142,247,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 5, cursor: 'pointer', fontSize: 10,
                      color: promptEnhance ? 'rgba(79,142,247,0.9)' : 'rgba(255,255,255,0.3)',
                      fontFamily: 'inherit', padding: '2px 6px', transition: 'all 0.15s',
                    }}>✦ Enhance</button>
                  </div>
                </div>
                <button onClick={() => setShowNeg(v => !v)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, background: 'transparent',
                  border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'inherit', padding: 0,
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: showNeg ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  Negative prompt
                </button>
                {showNeg && (
                  <textarea value={negPrompt} onChange={e => setNegPrompt(e.target.value)}
                    placeholder="What to avoid (blurry, distorted, bad anatomy)..." rows={2}
                    style={{
                      width: '100%', padding: 9, marginTop: 6,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
                      color: 'rgba(255,255,255,0.75)', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                    }} />
                )}
              </Section>

              <Section title="Art Style">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {STYLES.map(s => (
                    <button key={s.id} onClick={() => setSelectedStyle(s.id)} title={s.desc} style={{
                      padding: '7px 2px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                      background: selectedStyle === s.id ? 'rgba(79,142,247,0.12)' : 'rgba(255,255,255,0.03)',
                      border: selectedStyle === s.id ? '1px solid rgba(79,142,247,0.3)' : '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 15 }}>{s.emoji}</span>
                      <span style={{ fontSize: 9, color: selectedStyle === s.id ? 'rgba(79,142,247,0.9)' : 'rgba(255,255,255,0.35)' }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Aspect Ratio">
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {ASPECTS.map(a => (
                    <button key={a.id} onClick={() => setAspect(a.id)} title={a.desc} style={{
                      flex: '1 1 0', minWidth: 0, padding: '6px 3px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                      background: aspect === a.id ? 'rgba(79,142,247,0.12)' : 'rgba(255,255,255,0.03)',
                      border: aspect === a.id ? '1px solid rgba(79,142,247,0.3)' : '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s',
                    }}>
                      <div style={{
                        width: a.w * 0.32, height: a.h * 0.32,
                        border: `1.5px solid ${aspect === a.id ? 'rgba(79,142,247,0.7)' : 'rgba(255,255,255,0.18)'}`,
                        borderRadius: 2,
                      }} />
                      <span style={{ fontSize: 9, color: aspect === a.id ? 'rgba(79,142,247,0.9)' : 'rgba(255,255,255,0.35)' }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Lighting" defaultOpen={false}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {LIGHTINGS.map(l => (
                    <button key={l.id} onClick={() => setLighting(l.id)} style={{
                      padding: '6px 2px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                      background: lighting === l.id ? 'rgba(247,179,49,0.12)' : 'rgba(255,255,255,0.03)',
                      border: lighting === l.id ? '1px solid rgba(247,179,49,0.3)' : '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 14 }}>{l.emoji}</span>
                      <span style={{ fontSize: 8.5, color: lighting === l.id ? 'rgba(247,179,49,0.9)' : 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.2 }}>{l.label}</span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Mood & Atmosphere" defaultOpen={false}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {MOODS.map(m => (
                    <button key={m.id} onClick={() => setMood(m.id)} style={{
                      padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                      background: mood === m.id ? 'rgba(155,114,246,0.12)' : 'rgba(255,255,255,0.03)',
                      border: mood === m.id ? '1px solid rgba(155,114,246,0.3)' : '1px solid rgba(255,255,255,0.05)',
                      color: mood === m.id ? 'rgba(155,114,246,0.9)' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s',
                    }}>{m.label}</button>
                  ))}
                </div>
              </Section>

              <Section title="Camera & Lens" defaultOpen={false}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {CAMERAS.map(c => (
                    <button key={c.id} onClick={() => setCamera(c.id)} style={{
                      padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                      background: camera === c.id ? 'rgba(45,212,191,0.12)' : 'rgba(255,255,255,0.03)',
                      border: camera === c.id ? '1px solid rgba(45,212,191,0.3)' : '1px solid rgba(255,255,255,0.05)',
                      color: camera === c.id ? 'rgba(45,212,191,0.9)' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s',
                    }}>{c.label}</button>
                  ))}
                </div>
              </Section>

              <Section title="Color Palette" defaultOpen={false}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {COLOR_PALETTES.map(p => (
                    <button key={p.id} onClick={() => setColorPalette(p.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 8,
                      cursor: 'pointer', fontFamily: 'inherit',
                      background: colorPalette === p.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                      border: colorPalette === p.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.15s',
                    }}>
                      {p.colors.length > 0 && (
                        <div style={{ display: 'flex', gap: 1.5 }}>
                          {p.colors.map((c, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: 2, background: c }} />)}
                        </div>
                      )}
                      <span style={{ fontSize: 10, color: colorPalette === p.id ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.38)' }}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Artist Inspiration" defaultOpen={false}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {ARTIST_STYLES.map(a => (
                    <button key={a.id} onClick={() => setArtistStyle(a.id)} style={{
                      padding: '4px 9px', borderRadius: 'var(--radius-pill)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                      background: artistStyle === a.id ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.03)',
                      border: artistStyle === a.id ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(255,255,255,0.05)',
                      color: artistStyle === a.id ? 'rgba(249,115,22,0.9)' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s',
                    }}>{a.label}</button>
                  ))}
                </div>
              </Section>

              <Section title="Count">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Images per run</span>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{count}</span>
                  </div>
                  <input type="range" min={1} max={4} value={count} onChange={e => setCount(+e.target.value)} style={{ width: '100%' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    {[1,2,3,4].map(n => <span key={n} style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{n}</span>)}
                  </div>
                </div>
              </Section>

              <Section title="Quality Options" defaultOpen={false}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Toggle value={hdMode} onChange={setHdMode} label="HD Mode" desc="2x resolution output" />
                  <Toggle value={promptEnhance} onChange={setPromptEnhance} label="Prompt Enhancement" desc="AI refines your prompt" />
                </div>
              </Section>

              <Section title="Advanced" defaultOpen={false}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Steps', value: steps, set: setSteps, min: 10, max: 50 },
                    { label: 'CFG Scale', value: cfg, set: setCfg, min: 1, max: 20 },
                  ].map(({ label, value, set, min, max }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{value}</span>
                      </div>
                      <input type="range" min={min} max={max} value={value} onChange={e => set(+e.target.value)} style={{ width: '100%' }} />
                    </div>
                  ))}
                  <div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Seed</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input value={seed} onChange={e => setSeed(e.target.value)} placeholder="Random (leave blank)"
                        style={{
                          flex: 1, padding: '6px 9px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 8, color: 'rgba(255,255,255,0.8)', fontSize: 12, outline: 'none', fontFamily: 'inherit',
                        }} />
                      <button onClick={() => setSeed(String(Math.floor(Math.random() * 999999)))} style={{
                        padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 13,
                      }}>🎲</button>
                    </div>
                  </div>
                </div>
              </Section>

              <button disabled={!prompt.trim()} onClick={handleGenerate} style={{
                width: '100%', padding: '13px 0', borderRadius: 14, fontSize: 13, fontWeight: 700,
                background: prompt.trim() ? 'linear-gradient(135deg, #4F8EF7 0%, #9B72F6 100%)' : 'rgba(255,255,255,0.05)',
                border: 'none', color: prompt.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                cursor: prompt.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                boxShadow: prompt.trim() ? '0 4px 20px rgba(79,142,247,0.35)' : 'none',
                transition: 'all 0.2s', marginTop: 4,
              }}>
                {prompt.trim() ? `✦ Generate${count > 1 ? ` (${count})` : ''}` : 'Enter a prompt to start'}
              </button>
            </>
          )}

          {activeTab === 'edit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 36 }}>✎</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Image Editing</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>Upload an image and describe the changes using text-guided inpainting.</div>
              <button onClick={() => uploadRef.current?.click()} style={{
                padding: '9px 18px', borderRadius: 10,
                background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)',
                color: 'rgba(79,142,247,0.9)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              }}>Upload Image</button>
              <input ref={uploadRef} type="file" accept="image/*" style={{ display: 'none' }} />
            </div>
          )}

          {activeTab === 'upscale' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Section title="Upscale Settings">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Upscale Factor</span>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{upscaleFactor}x</span>
                  </div>
                  <input type="range" min={2} max={4} step={1} value={upscaleFactor} onChange={e => setUpscaleFactor(+e.target.value)} style={{ width: '100%' }} />
                </div>
              </Section>
              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10, lineHeight: 1.5 }}>Select an image from history or upload a new one to upscale</div>
                <button onClick={() => uploadRef.current?.click()} style={{
                  padding: '7px 14px', borderRadius: 8,
                  background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)',
                  color: 'rgba(79,142,247,0.9)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
                }}>Upload Image</button>
              </div>
            </div>
          )}

          {activeTab === 'describe' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 36 }}>👁</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Image to Prompt</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>Upload any image and get a detailed prompt to recreate or build upon it.</div>
              <button onClick={() => uploadRef.current?.click()} style={{
                padding: '9px 18px', borderRadius: 10,
                background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)',
                color: 'rgba(45,212,191,0.9)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              }}>Analyze Image</button>
            </div>
          )}
        </div>

        {/* Center Canvas */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'rgba(5,5,7,0.5)' }}>
          {history.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40, textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 'var(--radius-lg)',
                background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
              }}>🎨</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6, color: 'rgba(255,255,255,0.6)' }}>Your canvas is empty</div>
                <div style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.6, color: 'rgba(255,255,255,0.28)' }}>
                  Write a prompt and click Generate. Use the panel on the left to customize your creation.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%', maxWidth: 480 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginBottom: 2, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Try these prompts</div>
                {PROMPT_SUGGESTIONS.slice(0, 4).map(s => (
                  <button key={s} onClick={() => { setPrompt(s); textareaRef.current?.focus(); }} style={{
                    padding: '9px 14px', borderRadius: 10, fontSize: 12, textAlign: 'left',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s', lineHeight: 1.4,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(79,142,247,0.07)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(79,142,247,0.18)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : viewMode === 'single' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 12, minHeight: 0 }}>
              {selected && (
                <>
                  <div style={{
                    position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    aspectRatio: selected.aspect.replace(':', '/'),
                    maxHeight: 'calc(100vh - 300px)', margin: '0 auto', width: '100%', maxWidth: 600,
                  }}>
                    {selected.status === 'generating' ? (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'rgba(8,8,12,0.85)' }}>
                        <div style={{ position: 'relative', width: 48, height: 48 }}>
                          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(79,142,247,0.15)', borderTopColor: '#4F8EF7', animation: 'spin 0.7s linear infinite' }} />
                          <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '2px solid rgba(155,114,246,0.15)', borderTopColor: '#9B72F6', animation: 'spin 1.1s linear infinite reverse' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>Creating your image…</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 4 }}>{selected.model}</div>
                        </div>
                      </div>
                    ) : selected.imageUrl ? (
                      <img src={selected.imageUrl} alt={selected.prompt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                  </div>

                  {selected.status === 'done' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, flexWrap: 'wrap' }}>
                      {[
                        { label: '⬇ Download', action: () => handleDownload(selected) },
                        { label: '🔄 Regenerate', action: () => { setPrompt(selected.prompt); setTimeout(handleGenerate, 0); } },
                        { label: '↕ Upscale', action: () => setActiveTab('upscale') },
                        { label: '✎ Edit', action: () => setActiveTab('edit') },
                        { label: '📋 Copy Prompt', action: () => navigator.clipboard.writeText(selected.prompt) },
                      ].map(a => (
                        <button key={a.label} onClick={a.action} style={{
                          padding: '6px 13px', borderRadius: 8, fontSize: 12,
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                          color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; }}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{
                    background: 'rgba(255,255,255,0.025)', borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px',
                  }}>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, margin: '0 0 6px 0' }}>{selected.prompt}</p>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {getImageTags(selected).map(tag => (
                        <span key={tag} style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 4,
                          background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {history.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>History</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {(['all', 'done', 'error'] as const).map(f => (
                        <button key={f} onClick={() => setHistoryFilter(f)} style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
                          background: historyFilter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                          border: historyFilter === f ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                          color: historyFilter === f ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                          textTransform: 'capitalize',
                        }}>{f}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6 }}>
                    {filteredHistory.map(g => (
                      <button key={g.id} onClick={() => setSelected(g)} style={{
                        aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.03)', padding: 0, position: 'relative',
                        border: selected?.id === g.id ? '2px solid rgba(79,142,247,0.6)' : '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.15s',
                      }}>
                        {g.status === 'generating' ? (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,8,12,0.7)' }}>
                            <div style={spinnerStyle} />
                          </div>
                        ) : g.imageUrl ? (
                          <img src={g.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(240,82,82,0.6)', fontSize: 16 }}>✕</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {filteredHistory.map(g => (
                <div key={g.id} onClick={() => { setSelected(g); setViewMode('single'); }} style={{
                  aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                  position: 'relative', transition: 'all 0.15s',
                }}>
                  {g.status === 'generating' ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,8,12,0.8)' }}>
                      <div style={spinnerStyle} />
                    </div>
                  ) : g.imageUrl ? (
                    <img src={g.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel — Details */}
        {selected && selected.status === 'done' && viewMode === 'single' && (
          <div style={{
            width: 210, flexShrink: 0, overflowY: 'auto',
            background: 'rgba(8,8,12,0.6)', backdropFilter: 'blur(30px)',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            padding: 13, display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Image Info</div>
            {[
              { label: 'Model', value: selected.model },
              { label: 'Style', value: selected.style !== 'none' ? selected.style : 'None' },
              { label: 'Aspect', value: selected.aspect },
              { label: 'Lighting', value: selected.lighting !== 'none' ? selected.lighting : 'Natural' },
              { label: 'Mood', value: selected.mood !== 'none' ? selected.mood : 'Neutral' },
              { label: 'Camera', value: selected.camera !== 'none' ? selected.camera : 'Default' },
              { label: 'Steps', value: String(selected.steps ?? 30) },
              { label: 'CFG Scale', value: String(selected.cfg ?? 7) },
              { label: 'Seed', value: selected.seed ?? '—' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginBottom: 1 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}
            <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginBottom: 8 }}>Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { label: '⬇ Download', action: () => handleDownload(selected) },
                  { label: '📋 Copy Prompt', action: () => navigator.clipboard.writeText(selected.prompt) },
                  { label: '↕ Upscale', action: () => setActiveTab('upscale') },
                  { label: '✎ Edit Image', action: () => setActiveTab('edit') },
                ].map(a => (
                  <button key={a.label} onClick={a.action} style={{
                    padding: '7px 10px', borderRadius: 8, fontSize: 11, textAlign: 'left', width: '100%',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
              {new Date(selected.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
