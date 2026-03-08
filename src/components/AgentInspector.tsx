'use client';

import { useStore } from '@/lib/store';
import { AgentNode } from '@/lib/types';

interface NodeConfigProps {
  node: AgentNode;
  onChange: (updates: Partial<AgentNode>) => void;
  onTest: () => void;
}

const MissingConfig = ({ nodeType }: { nodeType: string }) => <div className="text-red-500">Config for &apos;{nodeType}&apos; not found.</div>;

const NODE_CONFIG_COMPONENTS: Record<string, React.FC<NodeConfigProps>> = {
  // Placeholder for actual node config components
  'Chat Model': ({ node, onChange, onTest }) => (
    <div>
      <h4 className="text-lg font-semibold mb-2">Chat Model Config</h4>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400">Node Name</label>
        <input type="text" value={node.name} onChange={e => onChange({ name: e.target.value })} className="mt-1 p-2 bg-gray-800 border border-gray-700 rounded-md w-full" />
      </div>
      <button onClick={() => onTest()} className="px-4 py-2 bg-blue-500 text-white rounded-md">Test Node</button>
    </div>
  ),
  'HTTP Request': ({ node, onChange, onTest }) => (
    <div>
      <h4 className="text-lg font-semibold mb-2">HTTP Request Config</h4>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400">Node Name</label>
        <input type="text" value={node.name} onChange={e => onChange({ name: e.target.value })} className="mt-1 p-2 bg-gray-800 border border-gray-700 rounded-md w-full" />
      </div>
      <button onClick={() => onTest()} className="px-4 py-2 bg-blue-500 text-white rounded-md">Test Node</button>
    </div>
  ),
  // Add more node types here as needed
};

export default function AgentInspector() {
  const { state, dispatch } = useStore();
  const selectedNode = state.agent.nodes.find(n => n.id === state.agent.selectedNodeId);

  const handleConfigChange = (updates: Partial<AgentNode>) => {
    if (!selectedNode) return;
    dispatch({ type: 'UPDATE_AGENT_NODE', id: selectedNode.id, updates });
  };

  const handleSave = () => {
    // Changes are applied immediately for now.
  };

  const handleTestNode = () => {
    console.log('Testing node...', selectedNode);
    // Implement actual node testing logic here
  };

  if (!selectedNode) {
    return (
      <div style={{
        width: 320, flexShrink: 0, marginTop: 0, overflowY: 'auto',
        background: 'var(--glass-panel)', backdropFilter: 'blur(22px) saturate(160%)',
        border: '1px solid var(--glass-border)', padding: 20, display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13,
      }}>
        Select a node to configure it
      </div>
    );
  }

  const ConfigComponent = NODE_CONFIG_COMPONENTS[selectedNode.type];

  return (
    <div style={{
      width: 320, flexShrink: 0, marginTop: 0, overflowY: 'auto',
      background: 'var(--glass-panel)', backdropFilter: 'blur(22px) saturate(160%)',
      border: '1px solid var(--glass-border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{selectedNode.type} Inspector</h3>
        <button onClick={() => dispatch({ type: 'SET_AGENT', agent: { selectedNodeId: null } })} className="text-gray-500 hover:text-gray-300">
          ×</button>
      </div>

      {ConfigComponent ? <ConfigComponent node={selectedNode} onChange={handleConfigChange} onTest={handleTestNode} /> : <MissingConfig nodeType={selectedNode.type} />}

      <div className="mt-auto pt-4 border-t border-gray-700">
        <button onClick={handleSave} style={{
          width: '100%', padding: '10px 0', background: 'var(--accent-blue)',
          border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>Save Changes</button>
      </div>
    </div>
  );
}
