/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildPollinationsImageUrl, getPollinationsBaseUrl, preloadImage } from '@/lib/pollinations';
import { useStore } from '@/lib/store';

interface Generation {
  id: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  style: string;
  aspect: string;
  timestamp: number;
  status: 'generating' | 'complete' | 'error';
  imageUrl?: string;
  error?: string;
  dimensions: { width: number; height: number };
}

const MODELS = [
  { id: 'flux', name: 'Flux', provider: 'Pollinations', emoji: '⚡', desc: 'Balanced quality for most prompts' },
  { id: 'turbo', name: 'Turbo', provider: 'Pollinations', emoji: '💨', desc: 'Faster drafts and rapid iterations' },
  { id: 'gptimage', name: 'GPT Image', provider: 'Pollinations', emoji: '🧠', desc: 'Strong prompt following for polished scenes' },
  { id: 'flux-anime', name: 'Flux Anime', provider: 'Pollinations', emoji: '🌸', desc: 'Stylized generations with anime energy' },
];

const STYLES = [
  { id: 'none', label: 'None', emoji: '✨' },
  { id: 'photorealistic', label: 'Photo', emoji: '📷' },
  { id: 'cinematic', label: 'Cinematic', emoji: '🎬' },
  { id: 'anime', label: 'Anime', emoji: '🌸' },
  { id: 'oil-painting', label: 'Oil Paint', emoji: '🖼️' },
  { id: 'watercolor', label: 'Watercolor', emoji: '💧' },
  { id: 'digital-art', label: 'Digital', emoji: '🖥️' },
  { id: '3d-render', label: '3D Render', emoji: '🎲' },
  { id: 'sketch', label: 'Sketch', emoji: '✏️' },
  { id: 'pixel-art', label: 'Pixel Art', emoji: '👾' },
  { id: 'comic', label: 'Comic', emoji: '💥' },
  { id: 'neon', label: 'Neon', emoji: '💜' },
];

const ASPECTS = [
  { id: '1:1', label: '1:1', w: 40, h: 40 },
  { id: '16:9', label: '16:9', w: 48, h: 27 },
  { id: '9:16', label: '9:16', w: 27, h: 48 },
  { id: '4:3', label: '4:3', w: 44, h: 33 },
  { id: '3:2', label: '3:2', w: 45, h: 30 },
];

const PROMPT_SUGGESTIONS = [
  'A cyberpunk city at sunset with flying cars',
  'Portrait of an astronaut in a field of flowers',
  'A cozy cabin in the mountains during snowfall',
  'Abstract art with flowing liquid metal and neon lights',
  'A mystical forest with bioluminescent plants',
];

const STYLE_PROMPT_MAP: Record<string, string> = {
  photorealistic: 'photorealistic, realistic lighting, natural textures, sharp focus',
  cinematic: 'cinematic composition, dramatic lighting, premium color grading, film still aesthetic',
  anime: 'anime illustration, expressive linework, stylized shading, vibrant palette',
  'oil-painting': 'oil painting, visible brushwork, painterly texture, gallery-quality finish',
  watercolor: 'watercolor illustration, soft pigment bleeding, delicate paper texture',
  'digital-art': 'digital concept art, polished rendering, rich detail, trending artstation aesthetic',
  '3d-render': '3d render, studio lighting, physically based materials, ultra clean surfaces',
  sketch: 'sketch illustration, hand-drawn lines, rough graphite texture',
  'pixel-art': 'pixel art, crisp sprite detail, limited palette, retro game aesthetic',
  comic: 'comic-book illustration, inked outlines, dynamic panels, bold contrast',
  neon: 'neon-lit scene, glowing accents, moody contrast, futuristic atmosphere',
};

const ASPECT_DIRECTION_MAP: Record<string, string> = {
  '1:1': 'balanced square framing',
  '16:9': 'wide cinematic framing',
  '9:16': 'vertical hero framing',
  '4:3': 'editorial composition',
  '3:2': 'photography composition',
};

const PROMPT_BOOSTERS = [
  { label: 'Portrait', text: 'close-up portrait, expressive face, shallow depth of field' },
  { label: 'Product', text: 'premium product shot, clean background, high-end commercial lighting' },
  { label: 'Motion', text: 'dynamic motion blur, energetic pose, cinematic action framing' },
  { label: 'Luxury', text: 'luxury aesthetic, refined materials, polished details, premium look' },
  { label: 'Editorial', text: 'editorial fashion direction, tasteful styling, magazine-grade composition' },
  { label: 'Lighting', text: 'dramatic rim lighting, soft volumetric glow, carefully sculpted shadows' },
];

function buildEnhancedPrompt(basePrompt: string, styleId: string, aspectId: string, modelId: string): string {
  const parts = [basePrompt.trim()];
  const styleDirection = STYLE_PROMPT_MAP[styleId];
  const aspectDirection = ASPECT_DIRECTION_MAP[aspectId];

  if (styleDirection) parts.push(styleDirection);
  if (aspectDirection) parts.push(aspectDirection);

  if (modelId === 'gptimage') {
    parts.push('high prompt fidelity, coherent scene geometry, polished details');
  } else if (modelId === 'turbo') {
    parts.push('clean composition, readable subject, efficient draft quality');
  } else if (modelId === 'flux') {
    parts.push('high detail, refined composition, crisp textures');
  }

  return parts.filter(Boolean).join(', ');
}

function getGenerationDimensions(generation: Generation | null, fallback: { width: number; height: number }) {
  if (generation?.dimensions?.width && generation.dimensions.height) {
    return generation.dimensions;
  }

  return fallback;
}

function formatAspectRatio(dimensions: { width: number; height: number }) {
  return `${dimensions.width} / ${dimensions.height}`;
}

export default function StudioView() {
  const { state, dispatch } = useStore();
  const [prompt, setPrompt] = useState('');
  const [negPrompt, setNegPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedStyle, setSelectedStyle] = useState('none');
  const [aspect, setAspect] = useState('1:1');
  const [showNeg, setShowNeg] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [steps, setSteps] = useState(30);
  const [cfg, setCfg] = useState(7);
  const [seed, setSeed] = useState('');
  const [count, setCount] = useState(1);
  const [history, setHistory] = useState<Generation[]>(() => (state.studio.history as Generation[]) || []);
  const [selected, setSelected] = useState<Generation | null>(() => ((state.studio.history as Generation[]) || []).find(item => item.id === state.studio.selectedGenerationId) || ((state.studio.history as Generation[])[0] ?? null));
  const [subTab, setSubTab] = useState(state.studio.activeSubTab || 'generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [describeUrl, setDescribeUrl] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const aspectDimensions = useMemo(() => {
    switch (aspect) {
      case '16:9': return { width: 1280, height: 720 };
      case '9:16': return { width: 720, height: 1280 };
      case '4:3': return { width: 1152, height: 864 };
      case '3:2': return { width: 1216, height: 832 };
      default: return { width: 1024, height: 1024 };
    }
  }, [aspect]);

  const selectedDimensions = useMemo(() => getGenerationDimensions(selected, aspectDimensions), [selected, aspectDimensions]);
  const selectedAspectRatio = useMemo(() => formatAspectRatio(selectedDimensions), [selectedDimensions]);
  const enhancedPromptPreview = useMemo(
    () => buildEnhancedPrompt(prompt, selectedStyle, aspect, selectedModel.id),
    [prompt, selectedStyle, aspect, selectedModel.id]
  );

  useEffect(() => {
    dispatch({ type: 'SET_STUDIO', studio: { history, activeSubTab: subTab, selectedGenerationId: selected?.id || null } });
  }, [dispatch, history, selected, subTab]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    const promptWithStyle = buildEnhancedPrompt(prompt, selectedStyle, aspect, selectedModel.id);
    const generatedItems: Generation[] = Array.from({ length: count }, (_, index) => ({
      id: crypto.randomUUID(),
      prompt: promptWithStyle,
      negativePrompt: negPrompt.trim() || undefined,
      model: selectedModel.name,
      style: selectedStyle,
      aspect,
      timestamp: Date.now() + index,
      status: 'generating',
      dimensions: { width: aspectDimensions.width, height: aspectDimensions.height },
    }));

    setHistory(prev => [...generatedItems, ...prev]);
    setSelected(generatedItems[0]);

    await Promise.allSettled(generatedItems.map(async (generation, index) => {
      const generationSeed = seed.trim() || `${Date.now()}-${index}`;
      const imageUrl = buildPollinationsImageUrl({
        prompt: promptWithStyle,
        negativePrompt: negPrompt.trim() || undefined,
        model: selectedModel.id,
        width: aspectDimensions.width,
        height: aspectDimensions.height,
        seed: generationSeed,
      });

      try {
        await preloadImage(imageUrl);
        setHistory(prev => prev.map(item => item.id === generation.id ? { ...item, status: 'complete', imageUrl } : item));
        setSelected(prev => prev?.id === generation.id ? { ...prev, status: 'complete', imageUrl } : prev);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Generation failed.';
        setHistory(prev => prev.map(item => item.id === generation.id ? { ...item, status: 'error', error: message } : item));
        setSelected(prev => prev?.id === generation.id ? { ...prev, status: 'error', error: message } : prev);
      }
    }));

    setIsGenerating(false);
  };

  const handleUpscale = async () => {
    if (!selected?.imageUrl) return;
    setIsGenerating(true);
    const sourceDimensions = getGenerationDimensions(selected, aspectDimensions);
    const sourceAspect = selected?.aspect || aspect;
    const upscalePrompt = `${selected.prompt}, ultra high resolution, extremely detailed, 8k, masterpiece quality`;
    const imageUrl = buildPollinationsImageUrl({
      prompt: upscalePrompt,
      model: 'flux',
      width: Math.min(sourceDimensions.width * 2, 2048),
      height: Math.min(sourceDimensions.height * 2, 2048),
      seed: `upscale-${Date.now()}`,
    });
    const gen: Generation = { id: crypto.randomUUID(), prompt: upscalePrompt, model: 'Flux (upscale)', style: selectedStyle, aspect: sourceAspect, timestamp: Date.now(), status: 'generating', dimensions: { width: Math.min(sourceDimensions.width * 2, 2048), height: Math.min(sourceDimensions.height * 2, 2048) } };
    setHistory(prev => [gen, ...prev]);
    setSelected(gen);
    try {
      await preloadImage(imageUrl);
      setHistory(prev => prev.map(item => item.id === gen.id ? { ...item, status: 'complete', imageUrl } : item));
      setSelected(prev => prev?.id === gen.id ? { ...prev, status: 'complete', imageUrl } : prev);
    } catch {
      setHistory(prev => prev.map(item => item.id === gen.id ? { ...item, status: 'error', error: 'Upscale failed' } : item));
      setSelected(prev => prev?.id === gen.id ? { ...prev, status: 'error', error: 'Upscale failed' } : prev);
    }
    setIsGenerating(false);
  };

  const handleEditGenerate = async () => {
    if (!editPrompt.trim()) return;
    setIsGenerating(true);
    const sourceDimensions = getGenerationDimensions(selected, aspectDimensions);
    const editedPrompt = buildEnhancedPrompt(editPrompt.trim(), selectedStyle, selected?.aspect || aspect, selectedModel.id);
    const imageUrl = buildPollinationsImageUrl({
      prompt: editedPrompt,
      model: selectedModel.id,
      width: sourceDimensions.width,
      height: sourceDimensions.height,
      seed: `edit-${Date.now()}`,
    });
    const gen: Generation = { id: crypto.randomUUID(), prompt: editedPrompt, model: selectedModel.name, style: selectedStyle, aspect: selected?.aspect || aspect, timestamp: Date.now(), status: 'generating', dimensions: { width: sourceDimensions.width, height: sourceDimensions.height } };
    setHistory(prev => [gen, ...prev]);
    setSelected(gen);
    try {
      await preloadImage(imageUrl);
      setHistory(prev => prev.map(item => item.id === gen.id ? { ...item, status: 'complete', imageUrl } : item));
      setSelected(prev => prev?.id === gen.id ? { ...prev, status: 'complete', imageUrl } : prev);
    } catch {
      setHistory(prev => prev.map(item => item.id === gen.id ? { ...item, status: 'error', error: 'Edit failed' } : item));
    }
    setIsGenerating(false);
  };

  const SUB_TABS = [
    { id: 'generate', label: '✦ Generate', desc: 'Create images from text' },
    { id: 'edit', label: '✎ Edit', desc: 'Modify existing images' },
    { id: 'upscale', label: '⬆ Upscale', desc: 'Enhance resolution' },
    { id: 'describe', label: '👁 Describe', desc: 'Get prompts from images' },
  ];

  const sidebarContent = (
    <>
      {subTab === 'generate' && (
        <>
          {/* Model */}
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Model</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {MODELS.map(m => (
                <button key={m.id} onClick={() => setSelectedModel(m)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  background: selectedModel.id === m.id ? 'rgba(59,130,246,0.12)' : 'transparent',
                  border: selectedModel.id === m.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 18 }}>{m.emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Prompt</label>
            <textarea ref={textareaRef} value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your image..."
              rows={4} style={{
                width: '100%', padding: 12, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
                color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{prompt.length}/2000</span>
              <button onClick={() => setPrompt(PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)])} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'rgba(59,130,246,0.7)', fontFamily: 'inherit',
              }}>🎲 Random</button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {PROMPT_BOOSTERS.map(booster => (
                <button
                  key={booster.label}
                  onClick={() => setPrompt(current => current.trim() ? `${current.trim()}, ${booster.text}` : booster.text)}
                  style={{
                    padding: '5px 9px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.56)', fontSize: 10, fontWeight: 600,
                  }}
                >
                  + {booster.label}
                </button>
              ))}
            </div>
            {prompt.trim() && (
              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.16)' }}>
                <div style={{ fontSize: 10, color: 'rgba(147,197,253,0.75)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 5 }}>Prompt package</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>{enhancedPromptPreview}</div>
              </div>
            )}
          </div>

          {/* Negative */}
          <button onClick={() => setShowNeg(!showNeg)} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'inherit', fontWeight: 600,
          }}>
            <span style={{ transform: showNeg ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.15s', fontSize: 10 }}>▾</span>
            Negative Prompt
          </button>
          {showNeg && (
            <textarea value={negPrompt} onChange={e => setNegPrompt(e.target.value)}
              placeholder="Describe what to avoid in the image (e.g. blurry, low quality, text, watermark...)" rows={3} style={{
                width: '100%', padding: 12, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                lineHeight: 1.5, resize: 'vertical', minHeight: 60,
              }} />
          )}

          {/* Style */}
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setSelectedStyle(s.id)} style={{
                  padding: '6px 2px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  background: selectedStyle === s.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                  border: selectedStyle === s.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  <span style={{ fontSize: 9, color: selectedStyle === s.id ? 'rgba(59,130,246,0.9)' : 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Aspect Ratio</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {ASPECTS.map(a => (
                <button key={a.id} onClick={() => setAspect(a.id)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  background: aspect === a.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                  border: aspect === a.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: a.w * 0.4, height: a.h * 0.4,
                    border: `1.5px solid ${aspect === a.id ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: 2,
                  }} />
                  <span style={{ fontSize: 10, color: aspect === a.id ? 'rgba(59,130,246,0.9)' : 'rgba(255,255,255,0.4)' }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Count</label>
              <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{count}</span>
            </div>
            <input type="range" min={1} max={4} value={count} onChange={e => setCount(+e.target.value)} style={{ width: '100%' }} />
          </div>

          {/* Advanced */}
          <button onClick={() => setShowAdvanced(!showAdvanced)} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'inherit',
          }}>
            <span style={{ transform: showAdvanced ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.15s', fontSize: 10 }}>▾</span>
            Advanced Settings
          </button>
          {showAdvanced && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Steps</span>
                  <span style={{ fontSize: 12, color: '#fff' }}>{steps}</span>
                </div>
                <input type="range" min={10} max={50} value={steps} onChange={e => setSteps(+e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>CFG Scale</span>
                  <span style={{ fontSize: 12, color: '#fff' }}>{cfg}</span>
                </div>
                <input type="range" min={1} max={20} value={cfg} onChange={e => setCfg(+e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>Seed</span>
                <input value={seed} onChange={e => setSeed(e.target.value)} placeholder="Random"
                  style={{ width: '100%', padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>
          )}

          <button disabled={!prompt.trim()} onClick={handleGenerate} style={{
            width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 14, fontWeight: 600,
            background: prompt.trim() ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
            border: prompt.trim() ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.08)',
            color: prompt.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
            cursor: prompt.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}>
            {isGenerating ? 'Generating…' : `✦ Generate ${count > 1 ? `(${count})` : ''}`}
          </button>
        </>
      )}

      {subTab === 'edit' && (
        <>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 8 }}>
            Describe changes to an existing image. The model will generate a new version with your modifications applied.
          </div>
          {selected?.imageUrl && (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
              <img src={selected.imageUrl} alt="Source" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
              <div style={{ padding: '6px 10px', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Source: {selected.prompt.slice(0, 50)}…</div>
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Edit Instructions</label>
            <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="e.g. Make the sky red and add a moon..." rows={4} style={{
              width: '100%', padding: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical',
            }} />
          </div>
          {!selected?.imageUrl && (
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Or paste image URL</label>
              <input value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)} placeholder="https://..." style={{
                width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit',
              }} />
            </div>
          )}
          <button disabled={!editPrompt.trim()} onClick={handleEditGenerate} style={{
            width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 14, fontWeight: 600,
            background: editPrompt.trim() ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
            border: editPrompt.trim() ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.08)',
            color: editPrompt.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
            cursor: editPrompt.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
          }}>
            {isGenerating ? 'Editing…' : '✎ Apply Edit'}
          </button>
        </>
      )}

      {subTab === 'upscale' && (
        <>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 8 }}>
            Enhance the resolution of a selected image. Select an image from your history first, then click Upscale.
          </div>
          {selected?.imageUrl && (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
              <img src={selected.imageUrl} alt="To upscale" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{selected.model}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{selected.aspect} · {selected.prompt.slice(0, 60)}…</div>
              </div>
            </div>
          )}
          <button disabled={!selected?.imageUrl || isGenerating} onClick={handleUpscale} style={{
            width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 14, fontWeight: 600,
            background: selected?.imageUrl ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
            border: selected?.imageUrl ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.08)',
            color: selected?.imageUrl ? '#fff' : 'rgba(255,255,255,0.3)',
            cursor: selected?.imageUrl ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
          }}>
            {isGenerating ? 'Upscaling…' : '⬆ Upscale 2×'}
          </button>
          {!selected?.imageUrl && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 8 }}>
              Generate or select an image first to upscale it.
            </div>
          )}
        </>
      )}

      {subTab === 'describe' && (
        <>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 8 }}>
            Get a detailed text prompt from an image. Paste an image URL or select one from your history.
          </div>
          {selected?.imageUrl && (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
              <img src={selected.imageUrl} alt="Describe" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Image URL</label>
            <input value={describeUrl || selected?.imageUrl || ''} onChange={e => setDescribeUrl(e.target.value)} placeholder="https://..." style={{
              width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit',
            }} />
          </div>
          <button disabled={!(describeUrl || selected?.imageUrl)} onClick={() => {
            const url = describeUrl || selected?.imageUrl || '';
            if (url) { setPrompt(`Describe this image in great detail for image generation: ${url}`); setSubTab('generate'); }
          }} style={{
            width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 14, fontWeight: 600,
            background: (describeUrl || selected?.imageUrl) ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
            border: (describeUrl || selected?.imageUrl) ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.08)',
            color: (describeUrl || selected?.imageUrl) ? '#fff' : 'rgba(255,255,255,0.3)',
            cursor: (describeUrl || selected?.imageUrl) ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
          }}>
            👁 Generate Description Prompt
          </button>
          {selected?.prompt && (
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Original Prompt</label>
              <div style={{ padding: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                {selected.prompt}
                <button onClick={() => navigator.clipboard.writeText(selected.prompt)} style={{
                  display: 'block', marginTop: 6, background: 'none', border: 'none', color: 'rgba(59,130,246,0.7)', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                }}>📋 Copy prompt</button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 76, boxSizing: 'border-box' }}>
      {/* Sub-nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        padding: '8px 16px', flexShrink: 0, position: 'relative',
        background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'absolute', left: 16, fontSize: 11, color: 'rgba(255,255,255,0.42)', display: 'none' }}>
          Pollinations API · {getPollinationsBaseUrl()}
        </div>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} title={t.desc} style={{
            padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 500,
            color: subTab === t.id ? '#fff' : 'rgba(255,255,255,0.5)',
            background: subTab === t.id ? 'rgba(59,130,246,0.15)' : 'transparent',
            border: subTab === t.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
        {/* Mobile controls toggle */}
        <button onClick={() => setShowMobileControls(!showMobileControls)} style={{
          display: 'none', padding: '7px 12px', borderRadius: 10, fontSize: 12,
          background: showMobileControls ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
        }} className="studio-mobile-toggle">⚙ Controls</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Desktop sidebar */}
        <div className="studio-sidebar" style={{
          width: 'clamp(260px, 22vw, 320px)', flexShrink: 0, overflowY: 'auto', overflowX: 'hidden',
          background: 'rgba(12,12,14,0.6)', backdropFilter: 'blur(30px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {sidebarContent}
        </div>

        {/* Mobile controls overlay */}
        {showMobileControls && (
          <div className="studio-mobile-panel" style={{
            display: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
            background: 'rgba(10,10,12,0.98)', backdropFilter: 'blur(20px)',
            overflowY: 'auto', padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Studio Controls</span>
              <button onClick={() => setShowMobileControls(false)} style={{
                width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 16, cursor: 'pointer',
              }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Canvas / Gallery */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 'clamp(12px, 2vw, 24px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {history.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.2)', textAlign: 'center', gap: 16,
            }}>
              <div style={{ fontSize: 64, opacity: 0.5 }}>🎨</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 6, color: 'rgba(255,255,255,0.4)' }}>Your canvas is empty</div>
                <div style={{ fontSize: 13, maxWidth: 300, lineHeight: 1.5 }}>
                  Write a prompt and hit Generate to create your first image. Try clicking 🎲 for inspiration.
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 500, marginTop: 8 }}>
                {PROMPT_SUGGESTIONS.slice(0, 3).map(s => (
                  <button key={s} onClick={() => { setPrompt(s); textareaRef.current?.focus(); }} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                    {s.length > 40 ? s.slice(0, 40) + '...' : s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Selected image view */}
              {selected && (
                <div
                  onClick={() => { if (selected.status === 'complete' && selected.imageUrl) setLightboxUrl(selected.imageUrl); }}
                  style={{
                    position: 'relative', borderRadius: 16, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    aspectRatio: selectedAspectRatio, maxHeight: '60vh', margin: '0 auto', width: '100%', maxWidth: 700,
                    cursor: selected.status === 'complete' ? 'zoom-in' : 'default',
                  }}>
                  {selected.status === 'generating' ? (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3B82F6',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Creating your image...</span>
                    </div>
                  ) : selected.status === 'error' ? (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 36 }}>⚠️</div>
                      <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>Generation failed</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.56)', maxWidth: 320 }}>{selected.error || 'Pollinations did not return an image in time.'}</div>
                    </div>
                  ) : selected.imageUrl ? (
                    <img src={selected.imageUrl} alt={selected.prompt} style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'radial-gradient(circle at top, rgba(59,130,246,0.12), transparent 55%), rgba(5,7,12,0.95)' }} />
                  ) : null}
                </div>
              )}
              {selected && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap',
                  padding: '6px 0',
                }}>
                  {selected.imageUrl && (
                    <button onClick={() => { if (selected.imageUrl) window.open(selected.imageUrl, '_blank', 'noopener,noreferrer'); }} style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 12,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
                    }}>⬇ Download</button>
                  )}
                  <button onClick={handleGenerate} style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
                  }}>🔄 Regenerate</button>
                  {selected.imageUrl && (
                    <>
                      <button onClick={() => { setEditPrompt(selected.prompt); setSubTab('edit'); }} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
                      }}>✎ Edit</button>
                      <button onClick={() => { setSubTab('upscale'); }} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
                      }}>⬆ Upscale</button>
                      <button onClick={() => navigator.clipboard.writeText(selected.prompt)} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
                      }}>📋 Prompt</button>
                    </>
                  )}
                </div>
              )}

              {/* Prompt info */}
              {selected && selected.status === 'complete' && (
                <div style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5,
                }}>
                  <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{selected.model}</span> · {selected.aspect} · {selected.style !== 'none' ? selected.style : 'no style'} · {selectedDimensions.width}×{selectedDimensions.height}
                  <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.4)' }}>{selected.prompt}</div>
                </div>
              )}

              {/* History grid */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>History ({history.length})</h3>
                  {history.length > 0 && (
                    <button onClick={() => { setHistory([]); setSelected(null); }} style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                    }}>Clear all</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
                  {history.map(g => (
                    <button key={g.id} onClick={() => setSelected(g)} style={{
                      aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)',
                      border: selected?.id === g.id ? '2px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.06)',
                      padding: 0, position: 'relative',
                    }}>
                      {g.status === 'generating' ? (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.2)', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                      ) : g.status === 'error' ? (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚠️</div>
                      ) : g.imageUrl ? (
                        <img src={g.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div onClick={() => setLightboxUrl(null)} style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
        }}>
          <img src={lightboxUrl} alt="Preview" style={{
            maxWidth: '92vw', maxHeight: '92vh', objectFit: 'contain',
            borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }} />
          <button onClick={() => setLightboxUrl(null)} style={{
            position: 'absolute', top: 20, right: 20,
            width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
      )}
    </div>
  );
}
