'use client';

import { useStore } from '@/lib/store';
import { useState, useRef, useEffect } from 'react';
import { AgentNode, AgentEdge } from '@/lib/types';
import { generateUUID } from '@/lib/utils';
import AgentNodeLibrary from './AgentNodeLibrary';
import AgentInspector from './AgentInspector';

export default function AgentView() {
  const { state, dispatch } = useStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) { // Middle click
        setIsPanning(true);
        setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      canvas.style.cursor = 'grab';
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleAmount = -e.deltaY * 0.001;
      const newZoom = Math.max(0.2, Math.min(2.5, zoom + scaleAmount));

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - pan.x) / zoom;
      const worldY = (mouseY - pan.y) / zoom;

      const newPanX = mouseX - worldX * newZoom;
      const newPanY = mouseY - worldY * newZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [isPanning, pan, zoom, startPan]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    const categoryColor = e.dataTransfer.getData('categoryColor');
    const nodeName = e.dataTransfer.getData('nodeName');

    if (nodeType) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      const newNode: AgentNode = {
        id: generateUUID(),
        type: nodeType,
        category: nodeType.split(' ')[0],
        name: nodeName,
        x,
        y,
        config: {},
        status: 'idle',
      };
      dispatch({ type: 'ADD_AGENT_NODE', node: newNode });
    }
  };

  const renderEdges = () => {
    const svgElements: React.ReactElement[] = [];
    state.agent.edges.forEach(edge => {
      const sourceNode = state.agent.nodes.find(n => n.id === edge.sourceId);
      const targetNode = state.agent.nodes.find(n => n.id === edge.targetId);

      if (sourceNode && targetNode) {
        // These are placeholder coordinates, calculate actual port positions
        const startX = sourceNode.x + 260; // Assuming node width is 260 for output port
        const startY = sourceNode.y + 25; // Assuming node height is 50 for output port center

        const endX = targetNode.x; // Assuming target node starts at 0 for input port
        const endY = targetNode.y + 25;

        // Apply pan and zoom
        const pannedStartX = startX * zoom + pan.x;
        const pannedStartY = startY * zoom + pan.y;
        const pannedEndX = endX * zoom + pan.x;
        const pannedEndY = endY * zoom + pan.y;

        const cpx1 = pannedStartX + 50;
        const cpy1 = pannedStartY;
        const cpx2 = pannedEndX - 50;
        const cpy2 = pannedEndY;

        const strokeColor = state.agent.nodes.find(n => n.id === edge.sourceId)?.category === 'Triggers' ? '#22C55E' : '#3B82F6'; // Placeholder color

        svgElements.push(
          <path
            key={edge.id}
            d={`M ${pannedStartX} ${pannedStartY} C ${cpx1} ${cpy1} ${cpx2} ${cpy2} ${pannedEndX} ${pannedEndY}`}
            stroke={strokeColor}
            strokeWidth="2"
            fill="none"
            style={{ pointerEvents: 'stroke' }}
          />
        );
      }
    });
    return (
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {svgElements}
      </svg>
    );
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden' }}>
      {/* Left Panel - Node Library */}
      <AgentNodeLibrary />

      {/* Center Canvas */}
      <div
        ref={canvasRef}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--bg-void)',
          cursor: isPanning ? 'grabbing' : 'grab', marginTop: 0,
        }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div id="node-canvas" style={{
          position: 'absolute', inset: 0,
          transformOrigin: '0 0',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}>
          {renderEdges()}
          {state.agent.nodes.map(node => (
            <div key={node.id} onClick={() => dispatch({ type: 'SET_AGENT', agent: { selectedNodeId: node.id } })}
              onDoubleClick={() => dispatch({ type: 'SET_AGENT', agent: { selectedNodeId: node.id } })}
              style={{
                position: 'absolute', left: node.x, top: node.y,
                minWidth: 200, maxWidth: 260, background: 'var(--glass-card)',
                backdropFilter: 'blur(16px)', border: `1px solid ${state.agent.selectedNodeId === node.id ? 'var(--accent-blue)' : 'var(--glass-border)'}`, 
                borderRadius: 'var(--radius-sm)', boxShadow: `var(--shadow-card)${state.agent.selectedNodeId === node.id ? ', var(--shadow-glow-blue)' : ''}`,
                cursor: 'pointer', userSelect: 'none', paddingBottom: 10,
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                borderBottom: '1px solid var(--glass-border)',
                borderLeft: `3px solid ${node.category === 'Triggers' ? '#22C55E' : node.category === 'AI / LLM' ? '#8B5CF6' : '#3B82F6'}`,
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{node.name}</span>
              </div>
              {/* Example ports, will need to be dynamic */}
              <div style={{
                position: 'absolute', width: 12, height: 12, borderRadius: '50%',
                background: 'var(--bg-elevated)', border: '2px solid var(--glass-border)',
                cursor: 'crosshair', zIndex: 5, transition: 'all var(--dur-fast) var(--ease-out)',
                right: -6, top: '50%', transform: 'translateY(-50%)',
              }} />
              <div style={{
                position: 'absolute', width: 12, height: 12, borderRadius: '50%',
                background: 'var(--bg-elevated)', border: '2px solid var(--glass-border)',
                cursor: 'crosshair', zIndex: 5, transition: 'all var(--dur-fast) var(--ease-out)',
                left: -6, top: '50%', transform: 'translateY(-50%)',
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Inspector */}
      <AgentInspector />
    </div>
  );
}
