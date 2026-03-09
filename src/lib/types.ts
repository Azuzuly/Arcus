export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: { id: string; name: string; provider: string } | null;
  isStreaming?: boolean;
  reasoning?: ReasoningStep[];
  toolUsage?: ToolUsageItem[];
  attachments?: ChatAttachment[];
  research?: ResearchPacket;
  customCard?: CustomCard;
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
  query?: string;
  queries: string[];
  sources: ResearchSource[];
  brief?: string;
  trustedDomains?: string[];
  factChecked?: boolean;
}

export interface ToolUsageItem {
  id: string;
  kind: 'search' | 'results' | 'weather' | 'facts' | 'artifact' | 'market' | 'sports' | 'conversion' | 'travel';
  label: string;
  detail?: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

export interface ReasoningStep {
  id: string;
  label: string;
  detail?: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

export interface WeatherCardData {
  location: string;
  condition: string;
  icon: string;
  temperatureC: number;
  temperatureF: number;
  apparentTemperatureC?: number;
  apparentTemperatureF?: number;
  localTime?: string;
  locationSource?: 'device' | 'query';
  daily: Array<{
    label: string;
    condition: string;
    icon: string;
    maxC: number;
    minC: number;
    maxF: number;
    minF: number;
  }>;
  sourceLabel: string;
}

export interface ProfileCardData {
  name: string;
  subtitle?: string;
  summary: string;
  imageUrl?: string;
  sourceUrl?: string;
  quickFacts?: string[];
  sourceLabel: string;
}

export interface MarketCardData {
  assetType: 'stock' | 'crypto';
  symbol: string;
  name: string;
  price: number;
  currency: string;
  changePercent?: number;
  changeValue?: number;
  exchange?: string;
  marketState?: string;
  openPrice?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  averageVolume?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  points: Array<{
    label: string;
    value: number;
  }>;
  sourceLabel: string;
}

export interface SportsCardData {
  league: string;
  queryLabel: string;
  updatedAt?: string;
  events: Array<{
    id: string;
    status: string;
    summary?: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: string;
    awayScore: string;
    venue?: string;
    startTime?: string;
  }>;
  sourceLabel: string;
}

export interface ConversionCardData {
  category: string;
  inputLabel: string;
  primaryResult: string;
  formula?: string;
  quickResults: Array<{
    label: string;
    value: string;
  }>;
  sourceLabel: string;
}

export interface TravelCardData {
  location: string;
  region?: string;
  country?: string;
  timezone: string;
  localTime: string;
  coordinates: string;
  mapImageUrl?: string;
  summary?: string;
  sourceLabel: string;
}

export interface MathCardData {
  topic: string;
  prompt: string;
  badge: string;
  hints: string[];
}

export type CustomCard =
  | { type: 'weather'; data: WeatherCardData }
  | { type: 'profile'; data: ProfileCardData }
  | { type: 'market'; data: MarketCardData }
  | { type: 'sports'; data: SportsCardData }
  | { type: 'conversion'; data: ConversionCardData }
  | { type: 'travel'; data: TravelCardData }
  | { type: 'math'; data: MathCardData };

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
  provider?: string;
  runtime?: 'puter' | 'openrouter';
  availableRuntimes?: Array<'puter' | 'openrouter'>;
  description?: string;
  created?: number;
  context_length?: number;
  openness?: 'open' | 'proprietary';
  intelligenceIndex?: number;
  latencySeconds?: number;
  speedTokensPerSecond?: number;
  priceBlended?: number;
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
  runtime?: 'puter' | 'openrouter';
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
  style?: string[] | string;
  aspect?: string;
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
  label?: string;
}

export interface AgentRunStep {
  nodeId: string;
  nodeName: string;
  nodeKind: string;
  status: 'success' | 'error' | 'skipped';
  elapsed: number;
  timestamp: number;
  input?: unknown;
  output?: unknown;
  error?: string;
  detail: string;
}

export interface SavedAgentWorkflow {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  nodes: AgentNode[];
  edges: AgentEdge[];
  triggerInput: string;
}

export interface AgentRunRecord {
  id: string;
  workflowName: string;
  timestamp: number;
  duration: number;
  status: 'success' | 'error';
  summary: string;
  finalOutput?: unknown;
  error?: string | null;
  steps: Record<string, AgentRunStep>;
}

export interface AgentWorkflow {
  nodes: AgentNode[];
  edges: AgentEdge[];
  selectedNodeId: string | null;
  workflowName: string;
  activeSavedWorkflowId: string | null;
  isRunning: boolean;
  executionLog: ExecutionLogEntry[];
  triggerInput: string;
  lastRunOutput?: unknown;
  lastRunStatus: 'idle' | 'success' | 'error';
  lastRunError?: string | null;
  lastRunAt: number | null;
  lastRunSteps: Record<string, AgentRunStep>;
  runHistory: AgentRunRecord[];
  savedWorkflows: SavedAgentWorkflow[];
}

export interface ExecutionLogEntry {
  timestamp: number;
  nodeId: string;
  nodeName: string;
  status: 'success' | 'error' | 'skipped';
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
  autoScrollOnStream: boolean;
  animationsEnabled: boolean;
  showTimestamps: boolean;
  compactChatSpacing: boolean;
}

export type TabType = 'home' | 'studio' | 'agent';
export type ModalType = 'settings' | 'pricing' | 'rename' | 'delete' | 'model-selector' | 'personalization' | null;
export type SettingsSection = 'account' | 'appearance' | 'personalization' | 'chat' | 'memory' | 'usage' | 'about';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
