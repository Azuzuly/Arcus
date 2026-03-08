'use client';

const NODE_CATEGORIES = [
  { id: 'Triggers', color: '#22C55E', nodes: ['Manual Start', 'Schedule', 'Webhook', 'File Watch'] },
  { id: 'AI / LLM', color: '#8B5CF6', nodes: ['Chat Model', 'Text Prompt', 'Image Gen', 'Transcribe', 'Embeddings', 'Agent Loop'] },
  { id: 'Data', color: '#3B82F6', nodes: ['HTTP Request', 'JSON Parse', 'CSV Parse', 'JavaScript Code', 'Transform', 'Filter', 'Merge', 'Split'] },
  { id: 'Integrations', color: '#F59E0B', nodes: ['OpenRouter', 'OpenAI Direct', 'Google Search', 'Slack', 'Email (SMTP)', 'Discord'] },
  { id: 'Control Flow', color: '#EC4899', nodes: ['If/Else', 'Switch', 'Loop', 'Wait', 'Sub-workflow', 'Error Handler'] },
  { id: 'Output', color: '#14B8A6', nodes: ['Send Response', 'Log', 'Notify', 'Write File'] },
];

export default function AgentNodeLibrary() {
  const onDragStart = (e: React.DragEvent, nodeType: string, categoryColor: string, nodeName: string) => {
    e.dataTransfer.setData('nodeType', nodeType);
    e.dataTransfer.setData('categoryColor', categoryColor);
    e.dataTransfer.setData('nodeName', nodeName);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{
      width: 280, flexShrink: 0, marginTop: 0, overflowY: 'auto',
      background: 'var(--glass-panel)', backdropFilter: 'blur(22px) saturate(160%)',
      borderRight: '1px solid var(--glass-border)',
      padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <input placeholder="Search nodes..." style={{
        width: '100%', padding: '8px 12px', background: 'var(--glass-input)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xs)',
        color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {NODE_CATEGORIES.map(category => (
          <div key={category.id}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{category.id}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {category.nodes.map(nodeName => (
                <div key={nodeName}
                  draggable
                  onDragStart={(e) => onDragStart(e, nodeName, category.color, nodeName)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    borderRadius: 'var(--radius-xs)', cursor: 'grab',
                    transition: 'background var(--dur-fast) var(--ease-out)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', background: category.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13 }}>{nodeName}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
