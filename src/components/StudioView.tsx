/* eslint-disable @next/next/no-img-element */
'use client';

import { useMemo, useRef, useState } from 'react';
import { buildPollinationsImageUrl, getPollinationsBaseUrl, preloadImage } from '@/lib/pollinations';

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

export default function StudioView() {
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
  const [history, setHistory] = useState<Generation[]>([]);
  const [selected, setSelected] = useState<Generation | null>(null);
  const [subTab, setSubTab] = useState('generate');
  const [isGenerating, setIsGenerating] = useState(false);
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

  const stylePrompt = selectedStyle === 'none' ? '' : `, ${selectedStyle.replace(/-/g, ' ')}`;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    const promptWithStyle = `${prompt.trim()}${stylePrompt}`;
    const generatedItems: Generation[] = Array.from({ length: count }, (_, index) => ({
      id: crypto.randomUUID(),
      prompt: promptWithStyle,
      model: selectedModel.name,
      style: selectedStyle,
      aspect,
      timestamp: Date.now() + index,
      status: 'generating',
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
        setHistory(prev => prev.map(item => item.id === generation.id ? { ...item, status: 'done', imageUrl } : item));
        setSelected(prev => prev?.id === generation.id ? { ...prev, status: 'done', imageUrl } : prev);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Generation failed.';
        setHistory(prev => prev.map(item => item.id === generation.id ? { ...item, status: 'error', error: message } : item));
        setSelected(prev => prev?.id === generation.id ? { ...prev, status: 'error', error: message } : prev);
      }
    }));

    setIsGenerating(false);
  };

  const SUB_TABS = [
    { id: 'generate', label: '✦ Generate', desc: 'Create images from text' },
    { id: 'edit', label: '✎ Edit', desc: 'Modify existing images' },
    { id: 'upscale', label: '⬆ Upscale', desc: 'Enhance resolution' },
    { id: 'describe', label: '👁 Describe', desc: 'Get prompts from images' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sub-nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        padding: '8px 16px', flexShrink: 0,
        background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ position: 'absolute', left: 16, fontSize: 11, color: 'rgba(255,255,255,0.42)' }}>
          Pollinations API · {getPollinationsBaseUrl()}
        </div>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} title={t.desc} style={{
            padding: '7px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
            color: subTab === t.id ? '#fff' : 'rgba(255,255,255,0.5)',
            background: subTab === t.id ? 'rgba(59,130,246,0.15)' : 'transparent',
            border: subTab === t.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left — Controls */}
        <div style={{
          width: 'clamp(260px, 22vw, 320px)', flexShrink: 0, overflowY: 'auto',
          background: 'rgba(12,12,14,0.6)', backdropFilter: 'blur(30px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
        }}>
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
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{m.provider} · {m.desc}</div>
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
          </div>

          {/* Negative */}
          <button onClick={() => setShowNeg(!showNeg)} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'inherit',
          }}>
            <span style={{ transform: showNeg ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.15s', fontSize: 10 }}>▾</span>
            Negative Prompt
          </button>
          {showNeg && (
            <textarea value={negPrompt} onChange={e => setNegPrompt(e.target.value)}
              placeholder="What to avoid..." rows={2} style={{
                width: '100%', padding: 10, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit',
              }} />
          )}

          {/* Style presets */}
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
            <input type="range" min={1} max={4} value={count} onChange={e => setCount(+e.target.value)} />
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
                <input type="range" min={10} max={50} value={steps} onChange={e => setSteps(+e.target.value)} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>CFG Scale</span>
                  <span style={{ fontSize: 12, color: '#fff' }}>{cfg}</span>
                </div>
                <input type="range" min={1} max={20} value={cfg} onChange={e => setCfg(+e.target.value)} />
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>Seed</span>
                <input value={seed} onChange={e => setSeed(e.target.value)} placeholder="Random"
                  style={{ width: '100%', padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>
          )}

          {/* Generate button */}
          <button disabled={!prompt.trim()} onClick={handleGenerate} style={{
            width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 14, fontWeight: 600,
            background: prompt.trim() ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' : 'rgba(255,255,255,0.06)',
            border: 'none', color: prompt.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
            cursor: prompt.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            boxShadow: prompt.trim() ? '0 4px 24px rgba(59,130,246,0.3)' : 'none',
            transition: 'all 0.2s',
          }}>
            {isGenerating ? 'Generating…' : `✦ Generate ${count > 1 ? `(${count})` : ''}`}
          </button>
        </div>

        {/* Center — Canvas / Gallery */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px, 2vw, 24px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {subTab !== 'generate' && (
            <div style={{
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              padding: '18px 20px',
              color: 'rgba(255,255,255,0.72)',
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{SUB_TABS.find(tab => tab.id === subTab)?.label}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                Pollinations generation is live for the main Studio flow now. The edit, upscale, and describe lanes are queued next so the whole image lab stays on the same backend.
              </div>
            </div>
          )}
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
              {/* Quick suggestions */}
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
                <div style={{
                  position: 'relative', borderRadius: 16, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  aspectRatio: aspect.replace(':', '/'), maxHeight: '60vh', margin: '0 auto', width: '100%', maxWidth: 600,
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
                    <img src={selected.imageUrl} alt={selected.prompt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                </div>
              )}
              {selected && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '8px 0',
                }}>
                  {['⬇ Download', '🔄 Regenerate', '✎ Edit', '⬆ Upscale'].map(a => (
                    <button key={a} onClick={() => {
                      if (a === '⬇ Download' && selected.imageUrl) window.open(selected.imageUrl, '_blank', 'noopener,noreferrer');
                      if (a === '🔄 Regenerate') void handleGenerate();
                    }} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 12,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
                    }}>{a}</button>
                  ))}
                </div>
              )}

              {/* History grid */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>History</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
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
    </div>
  );
}
