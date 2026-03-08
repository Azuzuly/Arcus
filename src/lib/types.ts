export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: { id: string; name: string; provider: string } | null;
  isStreaming?: boolean;
  reasoning?: ReasoningStep[];
  attachments?: ChatAttachment[];
  research?: ResearchPacket;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: 'image' | 'file';
  previewUrl?: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  content: string;
  provider: string;
  score?: number;
  favicon?: string;
  query: string;
}

export interface ResearchPacket {
  mode: 'standard' | 'deep';
  queries: string[];
  sources: ResearchSource[];
  brief?: string;
  trustedDomains?: string[];
}

export interface ReasoningStep {
  id: string;
  label: string;
  detail?: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

export interface ChatSettings {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: { id: string; name: string; provider: string };
  messages: Message[];
  settings: ChatSettings;
  pinned: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  created?: number;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
  };
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
}

export interface SelectedModel {
  id: string;
  name: string;
  provider: string;
}

export interface MemoryItem {
  id: string;
  text: string;
  date: number;
}

export interface UsageDay {
  date: string;
  requests: number;
}

export interface UsageData {
  today: { requests: number; limit: number };
  history: UsageDay[];
  modelBreakdown: Record<string, { count: number; tokens: number }>;
}

export interface StudioGeneration {
  id: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  imageUrl?: string;
  timestamp: number;
  status: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
  dimensions: { width: number; height: number };
  style?: string[];
}

export interface AgentNode {
  id: string;
  type: string;
  category: string;
  name: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
  status: 'idle' | 'running' | 'success' | 'error';
}

export interface AgentEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePort: 'output';
  targetPort: 'input';
}

export interface AgentWorkflow {
  nodes: AgentNode[];
  edges: AgentEdge[];
  selectedNodeId: string | null;
  workflowName: string;
  isRunning: boolean;
  executionLog: ExecutionLogEntry[];
}

export interface ExecutionLogEntry {
  timestamp: number;
  nodeId: string;
  nodeName: string;
  status: 'success' | 'error';
  elapsed: number;
  input?: unknown;
  output?: unknown;
  error?: string;
}

export interface PersonalizationSettings {
  webSearchEnabled: boolean;
  autoWebSearch: boolean;
  responseStyle: 'balanced' | 'concise' | 'detailed';
  researchDepth: 'standard' | 'deep' | 'exhaustive';
  trustedDomains: string[];
}

export type TabType = 'home' | 'studio' | 'agent';
export type ModalType = 'settings' | 'pricing' | 'rename' | 'delete' | 'model-selector' | 'personalization' | null;
export type SettingsSection = 'account' | 'appearance' | 'system-prompt' | 'memory' | 'usage' | 'about';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
