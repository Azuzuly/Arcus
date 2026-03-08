'use client';

import { useMemo, useRef, useState } from 'react';

interface Generation {
  id: string;
  prompt: string;
  model: string;
  style: string;
  aspect: string;
  timestamp: number;
  status: 'generating' | 'done' | 'error';
  imageUrl?: string;
  error?: string;
}

const MODELS = [
  { id: 'flux', name: 'FLUX', provider: 'Pollinations', emoji: '⚡', desc: 'Best overall prompt adherence' },
  { id: 'turbo', name: 'Turbo', provider: 'Pollinations', emoji: '💨', desc: 'Fast previews and iteration' },
  { id: 'flux-anime', name: 'FLUX Anime', provider: 'Pollinations', emoji: '🌸', desc: 'Illustration and stylized scenes' },
  { id: 'flux-realism', name: 'FLUX Realism', provider: 'Pollinations', emoji: '📷', desc: 'Sharper photorealistic rendering' },
];

const STYLES = [
  { id: 'none', label: 'None', emoji: '✨' },
  { id: 'photorealistic', label: 'Photo', emoji: '📷' },
  { id: 'cinematic', label: 'Cinema', emoji: '🎬' },
  { id: 'anime', label: 'Anime', emoji: '🌸' },
  { id: 'oil-painting', label: 'Oil', emoji: '🖼️' },
  { id: 'watercolor', label: 'Watercolor', emoji: '💧' },
  { id: 'digital-art', label: 'Digital', emoji: '🖥️' },
  { id: '3d-render', label: '3D', emoji: '🎲' },
  { id: 'sketch', label: 'Sketch', emoji: '✏️' },
  { id: 'pixel-art', label: 'Pixel', emoji: '👾' },
  { id: 'comic', label: 'Comic', emoji: '💥' },
  { id: 'neon', label: 'Neon', emoji: '💜' },
];

const ASPECTS = [
  { id: '1:1', label: 'Square', width: 1024, height: 1024, previewWidth: 40, previewHeight: 40 },
  { id: '16:9', label: 'Landscape', width: 1344, height: 768, previewWidth: 48, previewHeight: 27 },
  { id: '9:16', label: 'Portrait', width: 768, height: 1344, previewWidth: 27, previewHeight: 48 },
  { id: '4:3', label: 'Classic', width: 1152, height: 864, previewWidth: 44, previewHeight: 33 },
  { id: '3:2', label: 'Photo', width: 1216, height: 832, previewWidth: 45, previewHeight: 30 },
];

const PROMPT_SUGGESTIONS = [
  'Quiet neon street in Tokyo after rain, reflective asphalt, late-night atmosphere',
  'Portrait of an astronaut in a field of flowers at blue hour, cinematic lighting',
  'A cozy cabin in the mountains during snowfall, warm interior glow, night scene',
  'Abstract chrome sculpture with moonlit fog and electric highlights',
  'Bioluminescent forest trail under a star-filled sky, ultra detailed',
];

const SUB_TABS = [
  { id: 'generate', label: 'Generate', desc: 'Create images from text' },
  { id: 'edit', label: 'Edit', desc: 'Prompt-to-prompt editing is coming soon' },
  { id: 'upscale', label: 'Upscale', desc: 'Higher resolution exports are coming soon' },
  { id: 'describe', label: 'Describe', desc: 'Image-to-prompt tools are coming soon' },
];

function buildPollinationsUrl(options: {
  prompt: string;
  negativePrompt: string;
  style: string;
  aspect: string;
  model: string;
  seed: string;
}) {
  const aspectConfig = ASPECTS.find(item => item.id === options.aspect) || ASPECTS[0];
  const stylePrompt = options.style !== 'none' ? `Rendered in a ${options.style.replace(/-/g, ' ')} style.` : '';
  const negativePrompt = options.negativePrompt.trim() ? `Avoid: ${options.negativePrompt.trim()}.` : '';
  const fullPrompt = `${options.prompt.trim()}. ${stylePrompt} ${negativePrompt}`.trim();
  const query = new URLSearchParams({
    width: String(aspectConfig.width),
    height: String(aspectConfig.height),
    model: options.model,
    nologo: 'true',
    private: 'true',
    safe: 'false',
    enhance: 'true',
  });

  if (options.seed.trim()) query.set('seed', options.seed.trim());

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?${query.toString()}`;
}

export default function StudioView() {
  const [prompt, setPrompt] = useState('');
  const [negPrompt, setNegPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedStyle, setSelectedStyle] = useState('none');
  const [aspect, setAspect] = useState('1:1');
  const [showNeg, setShowNeg] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [steps, setSteps] = useState(28);
  const [cfg, setCfg] = useState(7);
  const [seed, setSeed] = useState('');
  const [count, setCount] = useState(1);
  const [history, setHistory] = useState<Generation[]>([]);
  const [selected, setSelected] = useState<Generation | null>(null);
  const [subTab, setSubTab] = useState('generate');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeAspect = useMemo(() => ASPECTS.find(item => item.id === aspect) || ASPECTS[0], [aspect]);
  const pendingCount = history.filter(item => item.status === 'generating').length;
  const unavailable = subTab !== 'generate';

  const handleGenerate = () => {
    if (!prompt.trim() || unavailable) return;

    const nextItems = Array.from({ length: count }, (_, index) => {
      const id = crypto.randomUUID();
      const imageUrl = buildPollinationsUrl({
        prompt,
        negativePrompt: negPrompt,
        style: selectedStyle,
        aspect,
        model: selectedModel.id,
        seed: seed || `${Date.now() + index}`,
      });

      return {
        id,
        prompt: prompt.trim(),
        model: selectedModel.name,
        style: selectedStyle,
        aspect,
        timestamp: Date.now() + index,
        status: 'generating' as const,
        imageUrl,
      };
    });

    setHistory(prev => [...nextItems, ...prev]);
    setSelected(nextItems[0]);
  };

  const markGenerationLoaded = (id: string) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, status: 'done' } : item));
    setSelected(prev => prev?.id === id ? { ...prev, status: 'done' } : prev);
  };

  const markGenerationError = (id: string) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, status: 'error', error: 'Pollinations could not generate this image.' } : item));
    setSelected(prev => prev?.id === id ? { ...prev, status: 'error', error: 'Pollinations could not generate this image.' } : prev);
  };

  const randomizePrompt = () => {
    setPrompt(PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)]);
    textareaRef.current?.focus();
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '12px 16px', flexShrink: 0,
        background: 'rgba(6,8,14,0.54)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {SUB_TABS.map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)} title={tab.desc} style={{
            padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
            color: subTab === tab.id ? '#fff' : 'rgba(255,255,255,0.55)',
            background: subTab === tab.id ? 'rgba(124,140,255,0.18)' : 'transparent',
            border: subTab === tab.id ? '1px solid rgba(124,140,255,0.28)' : '1px solid transparent',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: 'clamp(280px, 24vw, 340px)', flexShrink: 0, overflowY: 'auto',
          background: 'rgba(8,10,16,0.56)', backdropFilter: 'blur(28px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: 18, display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{
            padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Studio status
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
              {pendingCount > 0 ? `${pendingCount} generation${pendingCount > 1 ? 's' : ''} running` : 'Ready to create'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Images are generated with Pollinations so the output now follows the prompt instead of using placeholder photos.
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Model</label>
            <div style={{ display: 'grid', gap: 6 }}>
              {MODELS.map(model => (
                <button key={model.id} onClick={() => setSelectedModel(model)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  background: selectedModel.id === model.id ? 'rgba(124,140,255,0.14)' : 'rgba(255,255,255,0.02)',
                  border: selectedModel.id === model.id ? '1px solid rgba(124,140,255,0.28)' : '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 18 }}>{model.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{model.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)' }}>{model.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Prompt</label>
              <button onClick={randomizePrompt} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(124,140,255,0.9)', fontFamily: 'inherit' }}>Random</button>
            </div>
            <textarea ref={textareaRef} value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="Describe your image..." rows={5} style={{
              width: '100%', padding: 14, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
              color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{prompt.length}/2000</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{selectedModel.provider}</span>
            </div>
          </div>

          <button onClick={() => setShowNeg(!showNeg)} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'inherit',
          }}>
            <span style={{ transform: showNeg ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.15s', fontSize: 10 }}>▾</span>
            Negative prompt
          </button>
          {showNeg && (
            <textarea value={negPrompt} onChange={event => setNegPrompt(event.target.value)} placeholder="What should Pollinations avoid?" rows={2} style={{
              width: '100%', padding: 10, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
              color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit',
            }} />
          )}

          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {STYLES.map(style => (
                <button key={style.id} onClick={() => setSelectedStyle(style.id)} style={{
                  padding: '8px 4px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  background: selectedStyle === style.id ? 'rgba(124,140,255,0.14)' : 'rgba(255,255,255,0.03)',
                  border: selectedStyle === style.id ? '1px solid rgba(124,140,255,0.28)' : '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 15 }}>{style.emoji}</span>
                  <span style={{ fontSize: 9, color: selectedStyle === style.id ? '#DDE4FF' : 'rgba(255,255,255,0.45)' }}>{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Aspect Ratio</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {ASPECTS.map(item => (
                <button key={item.id} onClick={() => setAspect(item.id)} style={{
                  flex: 1, padding: '9px 6px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  background: aspect === item.id ? 'rgba(124,140,255,0.14)' : 'rgba(255,255,255,0.03)',
                  border: aspect === item.id ? '1px solid rgba(124,140,255,0.28)' : '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                }}>
                  <div style={{ width: item.previewWidth * 0.4, height: item.previewHeight * 0.4, border: `1.5px solid ${aspect === item.id ? 'rgba(221,228,255,0.85)' : 'rgba(255,255,255,0.25)'}`, borderRadius: 2 }} />
                  <span style={{ fontSize: 10, color: aspect === item.id ? '#DDE4FF' : 'rgba(255,255,255,0.45)' }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Count</label>
              <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{count}</span>
            </div>
            <input type="range" min={1} max={4} value={count} onChange={event => setCount(+event.target.value)} />
          </div>

          <button onClick={() => setShowAdvanced(!showAdvanced)} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'inherit',
          }}>
            <span style={{ transform: showAdvanced ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.15s', fontSize: 10 }}>▾</span>
            Advanced settings
          </button>
          {showAdvanced && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Steps</span>
                  <span style={{ fontSize: 12, color: '#fff' }}>{steps}</span>
                </div>
                <input type="range" min={10} max={50} value={steps} onChange={event => setSteps(+event.target.value)} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Guidance</span>
                  <span style={{ fontSize: 12, color: '#fff' }}>{cfg}</span>
                </div>
                <input type="range" min={1} max={20} value={cfg} onChange={event => setCfg(+event.target.value)} />
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>Seed</span>
                <input value={seed} onChange={event => setSeed(event.target.value)} placeholder="Random" style={{ width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>
          )}

          <button disabled={!prompt.trim() || unavailable} onClick={handleGenerate} style={{
            width: '100%', padding: '14px 0', borderRadius: 16, fontSize: 14, fontWeight: 700,
            background: prompt.trim() && !unavailable ? 'var(--accent-blue)' : 'rgba(255,255,255,0.06)',
            border: 'none', color: prompt.trim() && !unavailable ? '#fff' : 'rgba(255,255,255,0.35)',
            cursor: prompt.trim() && !unavailable ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            boxShadow: prompt.trim() && !unavailable ? '0 18px 40px color-mix(in srgb, var(--accent-blue) 28%, transparent)' : 'none',
          }}>
            Generate with Pollinations {count > 1 ? `(${count})` : ''}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px, 2vw, 24px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {unavailable ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', padding: 32,
            }}>
              <div>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🛠️</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{SUB_TABS.find(tab => tab.id === subTab)?.label} is being rebuilt</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 420, lineHeight: 1.6 }}>
                  The broken placeholder behavior was removed. The Generate tab now uses Pollinations correctly, and the other studio tools can be expanded on top of this cleaner foundation.
                </div>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.28)', textAlign: 'center', gap: 18,
            }}>
              <div style={{ fontSize: 62 }}>🌌</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.5)' }}>Create your first image</div>
                <div style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.6 }}>
                  Write a prompt, pick a Pollinations model, and generate. The image URL is now built from the prompt itself instead of a placeholder stock-photo service.
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 680, marginTop: 6 }}>
                {PROMPT_SUGGESTIONS.slice(0, 4).map(suggestion => (
                  <button key={suggestion} onClick={() => { setPrompt(suggestion); textareaRef.current?.focus(); }} style={{
                    padding: '8px 14px', borderRadius: 999, fontSize: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.56)', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {selected && (
                <div style={{
                  position: 'relative', borderRadius: 24, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  aspectRatio: activeAspect.width / activeAspect.height, maxHeight: '62vh', margin: '0 auto', width: '100%', maxWidth: 760,
                }}>
                  {selected.imageUrl && (
                    <img
                      src={selected.imageUrl}
                      alt={selected.prompt}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: selected.status === 'error' ? 'none' : 'block' }}
                      onLoad={() => markGenerationLoaded(selected.id)}
                      onError={() => markGenerationError(selected.id)}
                    />
                  )}

                  {selected.status === 'generating' && (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 12,
                      background: 'linear-gradient(180deg, rgba(5,7,13,0.15), rgba(5,7,13,0.55))',
                    }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', border: '3px solid rgba(124,140,255,0.18)', borderTopColor: 'var(--accent-blue)', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)' }}>Pollinations is generating your image…</span>
                    </div>
                  )}

                  {selected.status === 'error' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', background: 'rgba(5,7,13,0.84)' }}>
                      <div>
                        <div style={{ fontSize: 34, marginBottom: 10 }}>⚠️</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{selected.error}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Try another seed, tweak the prompt, or regenerate.</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selected && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12, alignItems: 'start' }}>
                  <div style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Prompt</div>
                    <div style={{ color: '#fff', fontSize: 14, lineHeight: 1.6 }}>{selected.prompt}</div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Specs</div>
                      <div style={{ color: '#fff', fontSize: 13, lineHeight: 1.6 }}>{selected.model} · {selected.style === 'none' ? 'No added style' : selected.style} · {selected.aspect}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <a href={selected.imageUrl} download={`arcus-${selected.id}.png`} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none', fontSize: 12 }}>Download</a>
                      <button onClick={handleGenerate} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(124,140,255,0.14)', border: '1px solid rgba(124,140,255,0.25)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Regenerate</button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.42)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>History</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {history.map(item => (
                    <button key={item.id} onClick={() => setSelected(item)} style={{
                      aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)',
                      border: selected?.id === item.id ? '2px solid rgba(124,140,255,0.55)' : '1px solid rgba(255,255,255,0.06)',
                      padding: 0, position: 'relative',
                    }}>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.prompt}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: item.status === 'error' ? 0.25 : 1 }}
                          onLoad={() => markGenerationLoaded(item.id)}
                          onError={() => markGenerationError(item.id)}
                        />
                      )}
                      {item.status === 'generating' && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,7,13,0.34)' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid rgba(124,140,255,0.2)', borderTopColor: 'var(--accent-blue)', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
