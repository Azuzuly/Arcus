'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface AgentNode {
  id: string;
  type: 'trigger' | 'model' | 'tool' | 'logic' | 'output';
  label: string;
  emoji: string;
  x: number;
  y: number;
  config: Record<string, string>;
}

interface Edge {
  id: string;
  from: string;
  to: string;
}

const NODE_LIBRARY = [
  { section: 'Triggers', items: [
    { type: 'trigger' as const, label: 'User Input', emoji: '💬', desc: 'Start from user message' },
    { type: 'trigger' as const, label: 'Webhook', emoji: '🔗', desc: 'HTTP trigger' },
    { type: 'trigger' as const, label: 'Schedule', emoji: '⏰', desc: 'Run on a timer' },
    { type: 'trigger' as const, label: 'File Upload', emoji: '📁', desc: 'Triggered by file' },
  ]},
  { section: 'AI Models', items: [
    { type: 'model' as const, label: 'Chat Completion', emoji: '🤖', desc: 'Send to any AI model' },
    { type: 'model' as const, label: 'Image Gen', emoji: '🎨', desc: 'Generate images' },
    { type: 'model' as const, label: 'Embeddings', emoji: '📐', desc: 'Create vector embeddings' },
    { type: 'model' as const, label: 'Vision', emoji: '👁️', desc: 'Analyze images' },
  ]},
  { section: 'Tools', items: [
    { type: 'tool' as const, label: 'Web Search', emoji: '🔍', desc: 'Search the internet' },
    { type: 'tool' as const, label: 'Code Execute', emoji: '💻', desc: 'Run code snippets' },
    { type: 'tool' as const, label: 'HTTP Request', emoji: '🌐', desc: 'Make API calls' },
    { type: 'tool' as const, label: 'Data Transform', emoji: '🔧', desc: 'Parse/transform data' },
  ]},
  { section: 'Logic', items: [
    { type: 'logic' as const, label: 'Condition', emoji: '🔀', desc: 'If/else branching' },
    { type: 'logic' as const, label: 'Loop', emoji: '🔁', desc: 'Repeat actions' },
    { type: 'logic' as const, label: 'Delay', emoji: '⏱️', desc: 'Wait before continuing' },
    { type: 'logic' as const, label: 'Merge', emoji: '🔗', desc: 'Combine multiple inputs' },
  ]},
  { section: 'Outputs', items: [
    { type: 'output' as const, label: 'Response', emoji: '📤', desc: 'Send response to user' },
    { type: 'output' as const, label: 'Save File', emoji: '💾', desc: 'Write to storage' },
    { type: 'output' as const, label: 'Notify', emoji: '🔔', desc: 'Send notification' },
    { type: 'output' as const, label: 'Webhook Out', emoji: '📡', desc: 'Send HTTP request' },
  ]},
];

const TYPE_COLORS: Record<string, string> = {
  trigger: '#10B981',
  model: '#3B82F6',
  tool: '#F59E0B',
  logic: '#8B5CF6',
  output: '#EC4899',
};

const TEMPLATES = [
  { name: 'Chat Assistant', desc: 'Simple input → model → response flow', emoji: '💬',
    nodes: [
      { type: 'trigger' as const, label: 'User Input', emoji: '💬', x: 100, y: 200 },
      { type: 'model' as const, label: 'Chat Completion', emoji: '🤖', x: 400, y: 200 },
      { type: 'output' as const, label: 'Response', emoji: '📤', x: 700, y: 200 },
    ]},
  { name: 'Research Agent', desc: 'Search → analyze → summarize', emoji: '🔍',
    nodes: [
      { type: 'trigger' as const, label: 'User Input', emoji: '💬', x: 100, y: 200 },
      { type: 'tool' as const, label: 'Web Search', emoji: '🔍', x: 350, y: 200 },
      { type: 'model' as const, label: 'Chat Completion', emoji: '🤖', x: 600, y: 200 },
      { type: 'output' as const, label: 'Response', emoji: '📤', x: 850, y: 200 },
    ]},
  { name: 'Image Pipeline', desc: 'Generate → upscale → deliver', emoji: '🎨',
    nodes: [
      { type: 'trigger' as const, label: 'User Input', emoji: '💬', x: 100, y: 200 },
      { type: 'model' as const, label: 'Image Gen', emoji: '🎨', x: 400, y: 200 },
      { type: 'output' as const, label: 'Response', emoji: '📤', x: 700, y: 200 },
    ]},
];

export default function AgentView() {
  const [nodes, setNodes] = useState<AgentNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showLibrary, setShowLibrary] = useState(true);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const addNode = (item: { type: AgentNode['type']; label: string; emoji: string }) => {
    const node: AgentNode = {
      id: crypto.randomUUID(),
      type: item.type,
      label: item.label,
      emoji: item.emoji,
      x: 300 + Math.random() * 200 - pan.x,
      y: 200 + Math.random() * 100 - pan.y,
      config: {},
    };
    setNodes(prev => [...prev, node]);
  };

  const loadTemplate = (t: typeof TEMPLATES[0]) => {
    const newNodes = t.nodes.map(n => ({
      id: crypto.randomUUID(),
      ...n,
      config: {},
    }));
    const newEdges: Edge[] = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      newEdges.push({ id: crypto.randomUUID(), from: newNodes[i].id, to: newNodes[i + 1].id });
    }
    setNodes(newNodes);
    setEdges(newEdges);
    setWorkflowName(t.name);
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
    if (selectedNode === id) setSelectedNode(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNode(null);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    if (dragging) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom - dragging.offsetX;
      const y = (e.clientY - rect.top - pan.y) / zoom - dragging.offsetY;
      setNodes(prev => prev.map(n => n.id === dragging.id ? { ...n, x, y } : n));
    }
  }, [isPanning, panStart, dragging, pan, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragging(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [handleMouseMove, handleMouseUp]);

  const handleWheel = (e: React.WheelEvent) => {
    const newZoom = Math.min(2, Math.max(0.3, zoom - e.deltaY * 0.001));
    setZoom(newZoom);
  };

  const handleNodeClick = (id: string) => {
    if (connecting) {
      if (connecting !== id) {
        setEdges(prev => [...prev, { id: crypto.randomUUID(), from: connecting, to: id }]);
      }
      setConnecting(null);
    } else {
      setSelectedNode(id);
    }
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', flexShrink: 0,
        background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setShowLibrary(!showLibrary)} style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 12,
            background: showLibrary ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
            border: showLibrary ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          }}>☰ Library</button>
          <input value={workflowName} onChange={e => setWorkflowName(e.target.value)} style={{
            background: 'transparent', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600,
            outline: 'none', fontFamily: 'inherit', width: 200,
          }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{nodes.length} nodes · {edges.length} connections</span>
          <button onClick={() => { setNodes([]); setEdges([]); setSelectedNode(null); }} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
          }}>Clear</button>
          <button onClick={() => setIsRunning(!isRunning)} style={{
            padding: '6px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: isRunning ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            border: isRunning ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)',
            color: isRunning ? '#EF4444' : '#10B981', cursor: 'pointer', fontFamily: 'inherit',
          }}>{isRunning ? '■ Stop' : '▶ Run'}</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Node Library */}
        {showLibrary && (
          <div style={{
            width: 'clamp(220px, 18vw, 280px)', flexShrink: 0, overflowY: 'auto',
            background: 'rgba(12,12,14,0.6)', backdropFilter: 'blur(30px)',
            borderRight: '1px solid rgba(255,255,255,0.06)', padding: 12,
          }}>
            {/* Templates */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, padding: '0 4px' }}>Templates</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {TEMPLATES.map(t => (
                  <button key={t.name} onClick={() => loadTemplate(t)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}>
                    <span style={{ fontSize: 18 }}>{t.emoji}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Node categories */}
            {NODE_LIBRARY.map(section => (
              <div key={section.section} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, padding: '0 4px' }}>{section.section}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {section.items.map(item => (
                    <button key={item.label} onClick={() => addNode(item)} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                      borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      background: 'transparent', border: '1px solid transparent',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ fontSize: 16 }}>{item.emoji}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{item.label}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Canvas */}
        <div ref={canvasRef} data-canvas="true"
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
          style={{
            flex: 1, position: 'relative', overflow: 'hidden', cursor: isPanning ? 'grabbing' : 'grab',
            background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.02) 0%, transparent 60%)',
          }}>
          {/* Grid dots */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse"
                x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)}>
                <circle cx={1} cy={1} r={0.5} fill="rgba(255,255,255,0.06)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Edges */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              const x1 = fromNode.x * zoom + pan.x + 80;
              const y1 = fromNode.y * zoom + pan.y + 25;
              const x2 = toNode.x * zoom + pan.x;
              const y2 = toNode.y * zoom + pan.y + 25;
              const mx = (x1 + x2) / 2;
              return (
                <g key={edge.id}>
                  <path d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                    stroke={TYPE_COLORS[fromNode.type] || '#3B82F6'} strokeWidth={2} fill="none" opacity={0.5}
                  />
                  <path d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                    stroke={TYPE_COLORS[fromNode.type] || '#3B82F6'} strokeWidth={2} fill="none" opacity={0.3}
                    strokeDasharray="6 4" style={{ animation: 'dash-move 1s linear infinite' }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => (
            <div key={node.id}
              onMouseDown={e => {
                e.stopPropagation();
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                setDragging({
                  id: node.id,
                  offsetX: (e.clientX - rect.left - pan.x) / zoom - node.x,
                  offsetY: (e.clientY - rect.top - pan.y) / zoom - node.y,
                });
              }}
              onClick={e => { e.stopPropagation(); handleNodeClick(node.id); }}
              style={{
                position: 'absolute',
                left: node.x * zoom + pan.x,
                top: node.y * zoom + pan.y,
                zIndex: 2,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: 160, padding: '10px 12px',
                borderRadius: 14,
                background: 'rgba(18,18,20,0.9)',
                backdropFilter: 'blur(16px)',
                border: `1.5px solid ${selectedNode === node.id ? TYPE_COLORS[node.type] : 'rgba(255,255,255,0.08)'}`,
                boxShadow: selectedNode === node.id ? `0 0 20px ${TYPE_COLORS[node.type]}33` : '0 4px 16px rgba(0,0,0,0.3)',
                cursor: 'grab', userSelect: 'none' as const,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}>
              {/* Color bar */}
              <div style={{ position: 'absolute', top: 0, left: 12, right: 12, height: 2, borderRadius: '0 0 2px 2px', background: TYPE_COLORS[node.type], opacity: 0.6 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{node.emoji}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{node.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{node.type}</div>
                </div>
              </div>
              {/* Connection dots */}
              <div style={{ position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', background: TYPE_COLORS[node.type], border: '2px solid rgba(18,18,20,0.9)' }} />
              <div onClick={e => { e.stopPropagation(); setConnecting(node.id); }}
                style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', background: TYPE_COLORS[node.type], border: '2px solid rgba(18,18,20,0.9)', cursor: 'crosshair' }} />
            </div>
          ))}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16, pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 64, opacity: 0.3 }}>🤖</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Build your AI agent</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', maxWidth: 300, lineHeight: 1.5 }}>
                  Add nodes from the library or pick a template to get started. Connect nodes by clicking the output dot then clicking another node.
                </div>
              </div>
            </div>
          )}

          {/* Connecting indicator */}
          {connecting && (
            <div style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              padding: '8px 20px', borderRadius: 20, background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)', fontSize: 13, color: '#3B82F6',
              zIndex: 10,
            }}>
              Click a node to connect — or <button onClick={() => setConnecting(null)} style={{ background: 'none', border: 'none', color: '#3B82F6', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>cancel</button>
            </div>
          )}

          {/* Zoom controls */}
          <div style={{
            position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 4,
            background: 'rgba(12,12,14,0.8)', backdropFilter: 'blur(20px)',
            borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', padding: 4, zIndex: 10,
          }}>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>+</button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={{ padding: '0 8px', height: 32, borderRadius: 8, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{Math.round(zoom * 100)}%</button>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>−</button>
          </div>
        </div>

        {/* Inspector Panel */}
        {selectedNodeData && (
          <div style={{
            width: 'clamp(240px, 20vw, 300px)', flexShrink: 0, overflowY: 'auto',
            background: 'rgba(12,12,14,0.6)', backdropFilter: 'blur(30px)',
            borderLeft: '1px solid rgba(255,255,255,0.06)', padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Inspector</h3>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 28 }}>{selectedNodeData.emoji}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{selectedNodeData.label}</div>
                <div style={{
                  fontSize: 11, color: TYPE_COLORS[selectedNodeData.type],
                  textTransform: 'capitalize', fontWeight: 500,
                }}>{selectedNodeData.type} Node</div>
              </div>
            </div>

            {/* Config fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Label</label>
                <input value={selectedNodeData.label} onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, label: e.target.value } : n))}
                  style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              </div>

              {selectedNodeData.type === 'model' && (
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Model</label>
                  <select style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                    <option>Claude Opus 4</option>
                    <option>GPT-5.4</option>
                    <option>Gemini 3.1 Pro</option>
                    <option>DeepSeek R1</option>
                  </select>
                </div>
              )}

              {(selectedNodeData.type === 'model' || selectedNodeData.type === 'tool') && (
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Instructions</label>
                  <textarea rows={4} placeholder="Custom instructions for this node..."
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
              )}

              {selectedNodeData.type === 'logic' && selectedNodeData.label === 'Condition' && (
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Condition</label>
                  <input placeholder="e.g. output.contains('yes')"
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => setConnecting(selectedNode)} style={{
                width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 12,
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                color: '#3B82F6', cursor: 'pointer', fontFamily: 'inherit',
              }}>🔗 Connect to...</button>
              <button onClick={() => { if (selectedNode) deleteNode(selectedNode); }} style={{
                width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 12,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit',
              }}>🗑 Delete Node</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
