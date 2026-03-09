'use client';

import Image from 'next/image';
import { useState, useRef, useCallback, useEffect } from 'react';
import { executeAgentWorkflow, formatAgentOutput, WorkflowExecutionError } from '@/lib/agent-runtime';
import { chatCompletion } from '@/lib/openrouter';
import { useStore } from '@/lib/store';
import { AgentRunRecord, AgentRunStep, ModelInfo } from '@/lib/types';

interface RunLogEntry {
  id: string;
  nodeId: string;
  nodeLabel: string;
  status: 'running' | 'success' | 'error' | 'skipped';
  detail: string;
  timestamp: number;
  duration?: number;
}

interface AgentNode {
  id: string;
  type: 'trigger' | 'model' | 'tool' | 'logic' | 'output';
  label: string;
  emoji: string;
  x: number;
  y: number;
  config: Record<string, string>;
  status?: 'idle' | 'running' | 'success' | 'error';
}

interface Edge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface WorkflowExportPayload {
  version: 1;
  exportedAt: number;
  workflow: {
    id: string | null;
    name: string;
    triggerInput: string;
    nodes: Array<{
      id: string;
      type: AgentNode['type'];
      label: string;
      emoji: string;
      x: number;
      y: number;
      config: Record<string, string>;
      status?: AgentNode['status'];
    }>;
    edges: Edge[];
  };
}

interface LibraryItem {
  type: AgentNode['type'];
  label: string;
  emoji: string;
}

interface LibraryCatalogItem extends LibraryItem {
  desc: string;
}

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2;

function sortRunSteps(steps: Record<string, AgentRunStep>): AgentRunStep[] {
  return Object.values(steps).sort((a, b) => a.timestamp - b.timestamp || a.nodeName.localeCompare(b.nodeName));
}

function inferDownloadFile(value: unknown): { filename: string; mimeType: string; content: string } | null {
  if (!value) return null;
  if (typeof value === 'object' && value && 'filename' in value && 'content' in value) {
    const fileValue = value as { filename?: unknown; mimeType?: unknown; content?: unknown };
    return {
      filename: typeof fileValue.filename === 'string' ? fileValue.filename : `workflow-output-${Date.now()}.json`,
      mimeType: typeof fileValue.mimeType === 'string' ? fileValue.mimeType : 'application/json',
      content: typeof fileValue.content === 'string' ? fileValue.content : formatAgentOutput(fileValue.content),
    };
  }

  if (typeof value === 'object' && value && 'imageUrl' in value) {
    return {
      filename: `arcus-image-${Date.now()}.url`,
      mimeType: 'text/plain',
      content: String((value as { imageUrl?: unknown }).imageUrl || ''),
    };
  }

  return {
    filename: `workflow-output-${Date.now()}.json`,
    mimeType: 'application/json',
    content: formatAgentOutput(value),
  };
}

const NODE_LIBRARY = [
  { section: 'Triggers', items: [
    { type: 'trigger' as const, label: 'User Input', emoji: '💬', desc: 'Start from user message' },
    { type: 'trigger' as const, label: 'Webhook', emoji: '🔗', desc: 'HTTP trigger' },
    { type: 'trigger' as const, label: 'Schedule', emoji: '⏰', desc: 'Run on a timer' },
    { type: 'trigger' as const, label: 'File Upload', emoji: '📁', desc: 'Triggered by file' },
    { type: 'trigger' as const, label: 'Form Submit', emoji: '📝', desc: 'Capture website form data' },
    { type: 'trigger' as const, label: 'RSS Watch', emoji: '📰', desc: 'Trigger from feed updates' },
  ]},
  { section: 'AI Models', items: [
    { type: 'model' as const, label: 'Chat Completion', emoji: '🤖', desc: 'Send to any AI model' },
    { type: 'model' as const, label: 'Image Gen', emoji: '🎨', desc: 'Generate images' },
    { type: 'model' as const, label: 'Embeddings', emoji: '📐', desc: 'Create vector embeddings' },
    { type: 'model' as const, label: 'Vision', emoji: '👁️', desc: 'Analyze images' },
    { type: 'model' as const, label: 'Classifier', emoji: '🏷️', desc: 'Route content by intent or class' },
    { type: 'model' as const, label: 'Summarizer', emoji: '🧾', desc: 'Condense long text or data' },
  ]},
  { section: 'Tools', items: [
    { type: 'tool' as const, label: 'Web Search', emoji: '🔍', desc: 'Search the internet' },
    { type: 'tool' as const, label: 'Code Execute', emoji: '💻', desc: 'Run code snippets' },
    { type: 'tool' as const, label: 'HTTP Request', emoji: '🌐', desc: 'Make API calls' },
    { type: 'tool' as const, label: 'Data Transform', emoji: '🔧', desc: 'Parse/transform data' },
    { type: 'tool' as const, label: 'Web Scraper', emoji: '🕷️', desc: 'Extract content from pages' },
    { type: 'tool' as const, label: 'JSON Parser', emoji: '🧩', desc: 'Parse API payloads' },
    { type: 'tool' as const, label: 'Database', emoji: '🗄️', desc: 'Query or update a database' },
    { type: 'tool' as const, label: 'API Auth', emoji: '🔐', desc: 'Attach API keys or bearer tokens' },
  ]},
  { section: 'Logic', items: [
    { type: 'logic' as const, label: 'Condition', emoji: '🔀', desc: 'If/else branching' },
    { type: 'logic' as const, label: 'Loop', emoji: '🔁', desc: 'Repeat actions' },
    { type: 'logic' as const, label: 'Delay', emoji: '⏱️', desc: 'Wait before continuing' },
    { type: 'logic' as const, label: 'Merge', emoji: '🔗', desc: 'Combine multiple inputs' },
    { type: 'logic' as const, label: 'Router', emoji: '🧭', desc: 'Route to different branches' },
    { type: 'logic' as const, label: 'Set Data', emoji: '📦', desc: 'Create or override fields' },
  ]},
  { section: 'Outputs', items: [
    { type: 'output' as const, label: 'Response', emoji: '📤', desc: 'Send response to user' },
    { type: 'output' as const, label: 'Save File', emoji: '💾', desc: 'Write to storage' },
    { type: 'output' as const, label: 'Notify', emoji: '🔔', desc: 'Send notification' },
    { type: 'output' as const, label: 'Webhook Out', emoji: '📡', desc: 'Send HTTP request' },
    { type: 'output' as const, label: 'Email', emoji: '✉️', desc: 'Send an email action' },
    { type: 'output' as const, label: 'Slack', emoji: '💬', desc: 'Post a Slack message' },
    { type: 'output' as const, label: 'Discord', emoji: '🎮', desc: 'Post to Discord' },
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
  { name: 'Data Pipeline', desc: 'Fetch → transform → store', emoji: '🔧',
    nodes: [
      { type: 'trigger' as const, label: 'Webhook', emoji: '🔗', x: 100, y: 200 },
      { type: 'tool' as const, label: 'HTTP Request', emoji: '🌐', x: 350, y: 200 },
      { type: 'tool' as const, label: 'Data Transform', emoji: '🔧', x: 600, y: 200 },
      { type: 'output' as const, label: 'Save File', emoji: '💾', x: 850, y: 200 },
    ]},
  { name: 'API Automation', desc: 'Webhook → auth → API → parse → response', emoji: '🌐',
    nodes: [
      { type: 'trigger' as const, label: 'Webhook', emoji: '🔗', x: 100, y: 200 },
      { type: 'tool' as const, label: 'API Auth', emoji: '🔐', x: 330, y: 200 },
      { type: 'tool' as const, label: 'HTTP Request', emoji: '🌐', x: 560, y: 200 },
      { type: 'tool' as const, label: 'JSON Parser', emoji: '🧩', x: 790, y: 200 },
      { type: 'output' as const, label: 'Response', emoji: '📤', x: 1020, y: 200 },
    ]},
  { name: 'Lead Enricher', desc: 'Form → scrape → classify → Slack', emoji: '🧠',
    nodes: [
      { type: 'trigger' as const, label: 'Form Submit', emoji: '📝', x: 100, y: 200 },
      { type: 'tool' as const, label: 'Web Scraper', emoji: '🕷️', x: 340, y: 200 },
      { type: 'model' as const, label: 'Classifier', emoji: '🏷️', x: 580, y: 200 },
      { type: 'output' as const, label: 'Slack', emoji: '💬', x: 820, y: 200 },
    ]},
  { name: 'Multi-Step Agent', desc: 'Condition → branch → merge output', emoji: '🔀',
    nodes: [
      { type: 'trigger' as const, label: 'User Input', emoji: '💬', x: 100, y: 200 },
      { type: 'logic' as const, label: 'Condition', emoji: '🔀', x: 350, y: 200 },
      { type: 'model' as const, label: 'Chat Completion', emoji: '🤖', x: 600, y: 120 },
      { type: 'tool' as const, label: 'Web Search', emoji: '🔍', x: 600, y: 300 },
      { type: 'logic' as const, label: 'Merge', emoji: '🔗', x: 850, y: 200 },
      { type: 'output' as const, label: 'Response', emoji: '📤', x: 1100, y: 200 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2, label: 'true' },
      { from: 1, to: 3, label: 'false' },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
    ]},
];

interface WorkflowDraftNode {
  id: string;
  label: string;
  config?: Record<string, string>;
}

interface WorkflowDraft {
  name: string;
  triggerInput?: string;
  nodes: WorkflowDraftNode[];
  edges: Array<{ from: string; to: string; label?: string }>;
}

const WORKFLOW_BUILDER_EXAMPLES = [
  'Create a workflow that researches the latest Roblox chat updates and sends me a clean summary.',
  'Build an automation that receives a webhook, calls an API, parses the JSON, and saves the result.',
  'Make a lead triage workflow that classifies inbound form submissions and posts hot leads to Slack.',
];

const ALL_LIBRARY_ITEMS: LibraryCatalogItem[] = NODE_LIBRARY.flatMap(section => section.items as LibraryCatalogItem[]);
const LIBRARY_ITEM_LOOKUP = new Map(ALL_LIBRARY_ITEMS.map(item => [item.label.toLowerCase(), item]));

function stripCodeFences(value: string): string {
  return value.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}

function buildHeuristicWorkflowDraft(request: string): WorkflowDraft {
  if (/(latest|news|update|updates|research|monitor|watch|track)/i.test(request)) {
    return {
      name: 'Research Monitor',
      triggerInput: '{\n  "topic": "latest updates",\n  "audience": "me"\n}',
      nodes: [
        { id: 'input', label: 'User Input' },
        { id: 'search', label: 'Web Search', config: { template: '{{input.topic || input}} latest updates ' + new Date().getFullYear() } },
        { id: 'summary', label: 'Summarizer', config: { instructions: 'Summarize the results into crisp bullets with risks and what changed.' } },
        { id: 'response', label: 'Response', config: { message: '{{steps.summarizer.output}}' } },
      ],
      edges: [
        { from: 'input', to: 'search' },
        { from: 'search', to: 'summary' },
        { from: 'summary', to: 'response' },
      ],
    };
  }

  if (/(webhook|api|endpoint|json|sync|automation)/i.test(request)) {
    return {
      name: 'API Automation',
      triggerInput: '{\n  "url": "https://api.example.com/data",\n  "payload": { "id": 1 }\n}',
      nodes: [
        { id: 'trigger', label: 'Webhook' },
        { id: 'request', label: 'HTTP Request', config: { method: 'POST', url: '{{input.url}}', body: '{{input.payload}}' } },
        { id: 'parse', label: 'JSON Parser', config: { template: '{{steps.http-request.output.body}}' } },
        { id: 'save', label: 'Save File', config: { filename: 'api-result.json', template: '{{steps.json-parser.output}}', mimeType: 'application/json' } },
      ],
      edges: [
        { from: 'trigger', to: 'request' },
        { from: 'request', to: 'parse' },
        { from: 'parse', to: 'save' },
      ],
    };
  }

  if (/(lead|form|triage|classif|slack|discord|email)/i.test(request)) {
    return {
      name: 'Lead Triage',
      triggerInput: '{\n  "name": "Taylor",\n  "company": "Arcus Labs",\n  "message": "Need pricing and onboarding help"\n}',
      nodes: [
        { id: 'trigger', label: 'Form Submit' },
        { id: 'classify', label: 'Classifier', config: { instructions: 'Return JSON with priority, team, and summary for the inbound lead.' } },
        { id: 'router', label: 'Router', config: { routes: 'sales: (steps.classifier.output?.priority || 0) >= 80\nsupport: true' } },
        { id: 'slack', label: 'Slack', config: { channel: '#sales-alerts', message: '{{steps.classifier.output.summary}}' } },
        { id: 'response', label: 'Response', config: { message: '{{steps.classifier.output}}' } },
      ],
      edges: [
        { from: 'trigger', to: 'classify' },
        { from: 'classify', to: 'router' },
        { from: 'router', to: 'slack', label: 'sales' },
        { from: 'router', to: 'response', label: 'support' },
      ],
    };
  }

  if (/(image|logo|poster|thumbnail|illustration)/i.test(request)) {
    return {
      name: 'Image Builder',
      triggerInput: '{\n  "prompt": "A cinematic neon skyline"\n}',
      nodes: [
        { id: 'input', label: 'User Input' },
        { id: 'image', label: 'Image Gen', config: { prompt: '{{input.prompt || input}}' } },
        { id: 'response', label: 'Response', config: { message: '{{steps.image-gen.output}}' } },
      ],
      edges: [
        { from: 'input', to: 'image' },
        { from: 'image', to: 'response' },
      ],
    };
  }

  return {
    name: 'Workflow Copilot Draft',
    triggerInput: '{\n  "message": "Describe the task"\n}',
    nodes: [
      { id: 'input', label: 'User Input' },
      { id: 'model', label: 'Chat Completion', config: { instructions: request } },
      { id: 'response', label: 'Response', config: { message: '{{steps.chat-completion.output}}' } },
    ],
    edges: [
      { from: 'input', to: 'model' },
      { from: 'model', to: 'response' },
    ],
  };
}

function parseWorkflowDraft(raw: string): WorkflowDraft | null {
  try {
    const parsed = JSON.parse(stripCodeFences(raw)) as Partial<WorkflowDraft>;
    if (!parsed || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) return null;

    const nodes = parsed.nodes
      .map((node, index) => ({
        id: typeof node?.id === 'string' && node.id.trim() ? node.id.trim() : `node-${index + 1}`,
        label: typeof node?.label === 'string' ? node.label.trim() : '',
        config: typeof node?.config === 'object' && node.config ? Object.fromEntries(Object.entries(node.config).map(([key, value]) => [key, String(value)])) : undefined,
      }))
      .filter(node => LIBRARY_ITEM_LOOKUP.has(node.label.toLowerCase()));

    if (nodes.length === 0) return null;

    const nodeIds = new Set(nodes.map(node => node.id));
    const edges = Array.isArray(parsed.edges)
      ? parsed.edges
          .map(edge => ({
            from: typeof edge?.from === 'string' ? edge.from.trim() : '',
            to: typeof edge?.to === 'string' ? edge.to.trim() : '',
            label: typeof edge?.label === 'string' ? edge.label.trim() : undefined,
          }))
          .filter(edge => nodeIds.has(edge.from) && nodeIds.has(edge.to) && edge.from !== edge.to)
      : [];

    return {
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'Workflow Copilot Draft',
      triggerInput: typeof parsed.triggerInput === 'string' ? parsed.triggerInput : undefined,
      nodes,
      edges,
    };
  } catch {
    return null;
  }
}

async function generateWorkflowDraft(request: string, selectedModel: { id: string; runtime?: 'puter' | 'openrouter' }, availableModels: ModelInfo[]): Promise<WorkflowDraft> {
  const allowedLabels = ALL_LIBRARY_ITEMS.map(item => item.label).join(', ');

  try {
    const response = await chatCompletion([
      {
        role: 'system',
        content: `You design executable Arcus agent workflows. Return ONLY a JSON object with this shape: {"name":"...","triggerInput":"...","nodes":[{"id":"input","label":"User Input","config":{"instructions":"..."}}],"edges":[{"from":"input","to":"search","label":"optional"}]}. Use only these exact node labels: ${allowedLabels}. Prefer 3 to 6 nodes. Build something practical that can run in-browser with the provided nodes.`,
      },
      {
        role: 'user',
        content: request,
      },
    ], { model: selectedModel.id, runtime: selectedModel.runtime, availableModels });

    const draft = parseWorkflowDraft(response);
    if (draft) return draft;
  } catch {
    // fall back below
  }

  return buildHeuristicWorkflowDraft(request);
}

function materializeWorkflowDraft(draft: WorkflowDraft): { name: string; triggerInput: string; nodes: AgentNode[]; edges: Edge[] } {
  const rowY = [140, 250, 360];
  const builtNodes = draft.nodes.map((node, index) => {
    const template = LIBRARY_ITEM_LOOKUP.get(node.label.toLowerCase()) || ALL_LIBRARY_ITEMS[0];
    return {
      id: crypto.randomUUID(),
      type: template.type,
      label: template.label,
      emoji: template.emoji,
      x: 110 + index * 240,
      y: rowY[index % rowY.length],
      config: { nodeKind: template.label, ...(node.config || {}) },
      status: 'idle' as const,
    };
  });

  const nodeIdLookup = new Map(draft.nodes.map((node, index) => [node.id, builtNodes[index].id]));
  const builtEdges: Edge[] = [];
  for (const edge of (draft.edges.length > 0 ? draft.edges : draft.nodes.slice(0, -1).map((node, index): { from: string; to: string; label?: string } => ({ from: node.id, to: draft.nodes[index + 1].id })))) {
    const from = nodeIdLookup.get(edge.from);
    const to = nodeIdLookup.get(edge.to);
    if (!from || !to) continue;
    builtEdges.push({ id: crypto.randomUUID(), from, to, label: edge.label });
  }

  return {
    name: draft.name,
    triggerInput: draft.triggerInput || '',
    nodes: builtNodes,
    edges: builtEdges,
  };
}

export default function AgentView() {
  const { state, dispatch, showToast } = useStore();
  const [nodes, setNodes] = useState<AgentNode[]>(() => state.agent.nodes.map(node => ({ id: node.id, type: node.type as AgentNode['type'], label: node.name, emoji: String(node.config.emoji || '⚙️'), x: node.x, y: node.y, config: Object.fromEntries(Object.entries({ ...node.config, nodeKind: node.config.nodeKind || node.name }).map(([key, value]) => [key, String(value)])), status: node.status })));
  const [edges, setEdges] = useState<Edge[]>(() => state.agent.edges.map(edge => ({ id: edge.id, from: edge.sourceId, to: edge.targetId, label: edge.label ? String(edge.label) : undefined })));
  const [selectedNode, setSelectedNode] = useState<string | null>(state.agent.selectedNodeId);
  const [activeSavedWorkflowId, setActiveSavedWorkflowId] = useState<string | null>(state.agent.activeSavedWorkflowId || null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showLibrary, setShowLibrary] = useState(true);
  const [workflowName, setWorkflowName] = useState(state.agent.workflowName || 'Untitled Workflow');
  const [isRunning, setIsRunning] = useState(state.agent.isRunning);
  const [runLog, setRunLog] = useState<RunLogEntry[]>(() => state.agent.executionLog.map(entry => ({ id: crypto.randomUUID(), nodeId: entry.nodeId, nodeLabel: entry.nodeName, status: entry.status === 'success' || entry.status === 'skipped' ? entry.status : 'error', detail: entry.error || `${entry.nodeName} executed.`, timestamp: entry.timestamp, duration: entry.elapsed })));
  const [triggerInput, setTriggerInput] = useState(state.agent.triggerInput || '');
  const [lastRunOutput, setLastRunOutput] = useState<unknown>(state.agent.lastRunOutput);
  const [lastRunStatus, setLastRunStatus] = useState<'idle' | 'success' | 'error'>(state.agent.lastRunStatus || 'idle');
  const [lastRunError, setLastRunError] = useState<string | null>(state.agent.lastRunError || null);
  const [lastRunAt, setLastRunAt] = useState<number | null>(state.agent.lastRunAt || null);
  const [lastRunSteps, setLastRunSteps] = useState<Record<string, AgentRunStep>>(state.agent.lastRunSteps || {});
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>(state.agent.runHistory || []);
  const [savedWorkflows, setSavedWorkflows] = useState(state.agent.savedWorkflows || []);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(state.agent.runHistory?.[0]?.id || null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showRunInspector, setShowRunInspector] = useState(true);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [showSetupPanel, setShowSetupPanel] = useState(() => state.agent.nodes.length === 0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(NODE_LIBRARY.map(s => s.section)));
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);
  const [workflowPrompt, setWorkflowPrompt] = useState('');
  const [isBuildingWorkflow, setIsBuildingWorkflow] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const runAbortRef = useRef<AbortController | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch({
      type: 'SET_AGENT',
      agent: {
        workflowName,
        selectedNodeId: selectedNode,
        activeSavedWorkflowId,
        isRunning,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          category: node.type,
          name: node.label,
          x: node.x,
          y: node.y,
          config: { ...node.config, emoji: node.emoji },
          status: node.status || 'idle',
        })),
        edges: edges.map(edge => ({ id: edge.id, sourceId: edge.from, targetId: edge.to, sourcePort: 'output', targetPort: 'input', label: edge.label })),
        executionLog: runLog.filter((entry): entry is RunLogEntry & { status: 'success' | 'error' | 'skipped' } => entry.status !== 'running').map(entry => ({ timestamp: entry.timestamp, nodeId: entry.nodeId, nodeName: entry.nodeLabel, status: entry.status, elapsed: entry.duration || 0, error: entry.status === 'error' ? entry.detail : undefined, output: entry.detail })),
        triggerInput,
        lastRunOutput,
        lastRunStatus,
        lastRunError,
        lastRunAt,
        lastRunSteps,
        runHistory,
        savedWorkflows,
      },
    });
  }, [dispatch, workflowName, selectedNode, activeSavedWorkflowId, isRunning, nodes, edges, runLog, triggerInput, lastRunOutput, lastRunStatus, lastRunError, lastRunAt, lastRunSteps, runHistory, savedWorkflows]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section); else next.add(section);
      return next;
    });
  };

  const clampZoom = useCallback((value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)), []);

  const addNode = useCallback((item: LibraryItem, position?: { x: number; y: number }) => {
    const nodeId = crypto.randomUUID();
    setNodes(prev => {
      const offsetIndex = prev.length;
      const node: AgentNode = {
        id: nodeId,
        type: item.type,
        label: item.label,
        emoji: item.emoji,
        x: position?.x ?? (300 + (offsetIndex % 4) * 54 - pan.x),
        y: position?.y ?? (200 + (offsetIndex % 3) * 42 - pan.y),
        config: { nodeKind: item.label },
        status: 'idle',
      };
      return [...prev, node];
    });
    setSelectedNode(nodeId);
  }, [pan.x, pan.y]);

  const buildWorkflowWithCopilot = useCallback(async () => {
    const request = workflowPrompt.trim();
    if (!request) return;

    setIsBuildingWorkflow(true);
    try {
      const draft = await generateWorkflowDraft(request, state.selectedModel, state.allModels);
      const graph = materializeWorkflowDraft(draft);
      setNodes(graph.nodes);
      setEdges(graph.edges);
      setWorkflowName(graph.name);
      setTriggerInput(graph.triggerInput);
      setSelectedNode(graph.nodes[0]?.id || null);
      setActiveSavedWorkflowId(null);
      setPan({ x: 0, y: 0 });
      setZoom(1);
      setRunLog([]);
      setLastRunStatus('idle');
      setLastRunError(null);
      setLastRunOutput(undefined);
      setLastRunAt(null);
      setLastRunSteps({});
      setSelectedRunId(null);
      setSelectedStepId(null);
      setShowSetupPanel(false);
      showToast(`Built workflow “${graph.name}”.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Workflow builder failed.', 'error');
    } finally {
      setIsBuildingWorkflow(false);
    }
  }, [showToast, state.allModels, state.selectedModel, workflowPrompt]);

  const getCanvasPoint = useCallback((clientX: number, clientY: number, customPan = pan, customZoom = zoom) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - customPan.x) / customZoom,
      y: (clientY - rect.top - customPan.y) / customZoom,
    };
  }, [pan, zoom]);

  const zoomAtPoint = useCallback((targetZoom: number, origin?: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const nextZoom = clampZoom(targetZoom);
    if (!rect) {
      setZoom(nextZoom);
      return;
    }

    const clientX = origin?.clientX ?? rect.left + rect.width / 2;
    const clientY = origin?.clientY ?? rect.top + rect.height / 2;
    const worldPoint = getCanvasPoint(clientX, clientY);
    setZoom(nextZoom);
    setPan({
      x: clientX - rect.left - worldPoint.x * nextZoom,
      y: clientY - rect.top - worldPoint.y * nextZoom,
    });
  }, [clampZoom, getCanvasPoint]);

  const fitCanvasToNodes = useCallback((targetNodes: AgentNode[] = nodes) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || targetNodes.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const padding = 72;
    const nodeWidth = 160;
    const nodeHeight = 54;
    const minX = Math.min(...targetNodes.map(node => node.x));
    const minY = Math.min(...targetNodes.map(node => node.y));
    const maxX = Math.max(...targetNodes.map(node => node.x + nodeWidth));
    const maxY = Math.max(...targetNodes.map(node => node.y + nodeHeight));
    const contentWidth = Math.max(1, maxX - minX);
    const contentHeight = Math.max(1, maxY - minY);
    const nextZoom = clampZoom(Math.min((rect.width - padding * 2) / contentWidth, (rect.height - padding * 2) / contentHeight, 1));

    setZoom(nextZoom);
    setPan({
      x: rect.width / 2 - ((minX + maxX) / 2) * nextZoom,
      y: rect.height / 2 - ((minY + maxY) / 2) * nextZoom,
    });
  }, [clampZoom, nodes]);

  const shouldIgnoreCanvasWheel = useCallback((target: EventTarget | null) => {
    const element = target instanceof HTMLElement ? target : null;
    if (!element) return false;
    return Boolean(element.closest('[data-agent-scroll-panel="true"], input, textarea, select, button, pre, [contenteditable="true"]'));
  }, []);

  const handleLibraryDragStart = (event: React.DragEvent, item: LibraryItem) => {
    event.dataTransfer.setData('application/x-arcus-node', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const loadTemplate = (t: typeof TEMPLATES[0]) => {
    const newNodes = t.nodes.map(n => ({
      id: crypto.randomUUID(),
      ...n,
      config: { nodeKind: n.label },
      status: 'idle' as const,
    }));
    const newEdges: Edge[] = t.edges?.length
      ? t.edges.map(edge => ({ id: crypto.randomUUID(), from: newNodes[edge.from].id, to: newNodes[edge.to].id, label: edge.label }))
      : newNodes.slice(0, -1).map((node, index) => ({ id: crypto.randomUUID(), from: node.id, to: newNodes[index + 1].id }));
    setNodes(newNodes);
    setEdges(newEdges);
    setWorkflowName(t.name);
    setActiveSavedWorkflowId(null);
    setRunLog([]);
    setLastRunStatus('idle');
    setLastRunError(null);
    setLastRunOutput(undefined);
    setLastRunAt(null);
    setLastRunSteps({});
    setSelectedRunId(null);
    setSelectedStepId(null);
    setShowSetupPanel(false);
    requestAnimationFrame(() => fitCanvasToNodes(newNodes));
  };

  const autoLayout = () => {
    const layoutedNodes = nodes.map((node, index) => ({
      ...node,
      x: 110 + (index % 3) * 250,
      y: 120 + Math.floor(index / 3) * 140,
    }));
    setNodes(layoutedNodes);
    requestAnimationFrame(() => fitCanvasToNodes(layoutedNodes));
  };

  const buildWorkflowExport = (): WorkflowExportPayload => ({
    version: 1,
    exportedAt: Date.now(),
    workflow: {
      id: activeSavedWorkflowId,
      name: workflowName,
      triggerInput,
      nodes,
      edges,
    },
  });

  const applyWorkflowSnapshot = (payload: WorkflowExportPayload['workflow']) => {
    setNodes(payload.nodes.map(node => ({
      ...node,
      config: Object.fromEntries(Object.entries({ ...node.config, nodeKind: node.config.nodeKind || node.label }).map(([key, value]) => [key, String(value)])),
      status: 'idle',
    })));
    setEdges(payload.edges.map(edge => ({ ...edge })));
    setWorkflowName(payload.name || 'Imported Workflow');
    setTriggerInput(payload.triggerInput || '');
    setActiveSavedWorkflowId(payload.id || null);
    setSelectedNode(null);
    setSelectedStepId(null);
    setLastRunStatus('idle');
    setLastRunError(null);
    setLastRunOutput(undefined);
    setLastRunAt(null);
    setLastRunSteps({});
    setRunLog([]);
    setShowSetupPanel(false);
    showToast(`Loaded workflow “${payload.name || 'Imported Workflow'}”.`, 'success');
    requestAnimationFrame(() => fitCanvasToNodes(payload.nodes));
  };

  const saveWorkflowSnapshot = () => {
    const now = Date.now();
    const exists = savedWorkflows.some(item => item.id === (activeSavedWorkflowId || ''));
    const snapshot = {
      id: activeSavedWorkflowId || crypto.randomUUID(),
      name: workflowName.trim() || 'Untitled Workflow',
      description: `${nodes.length} nodes · ${edges.length} connections`,
      createdAt: now,
      updatedAt: now,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        category: node.type,
        name: node.label,
        x: node.x,
        y: node.y,
        config: { ...node.config, emoji: node.emoji },
        status: node.status || 'idle',
      })),
      edges: edges.map(edge => ({ id: edge.id, sourceId: edge.from, targetId: edge.to, sourcePort: 'output' as const, targetPort: 'input' as const, label: edge.label })),
      triggerInput,
    };

    setSavedWorkflows(prev => {
      const existing = prev.find(item => item.id === snapshot.id);
      const next = existing
        ? prev.map(item => item.id === snapshot.id ? { ...item, ...snapshot, createdAt: item.createdAt, updatedAt: now } : item)
        : [{ ...snapshot }, ...prev];
      return next.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 24);
    });
    setActiveSavedWorkflowId(snapshot.id);
    showToast(exists ? 'Workflow updated.' : 'Workflow saved to library.', 'success');
  };

  const loadSavedWorkflow = (id: string) => {
    const saved = savedWorkflows.find(item => item.id === id);
    if (!saved) return;
    applyWorkflowSnapshot({
      id: saved.id,
      name: saved.name,
      triggerInput: saved.triggerInput,
      nodes: saved.nodes.map(node => ({
        id: node.id,
        type: node.type as AgentNode['type'],
        label: node.name,
        emoji: String(node.config.emoji || '⚙️'),
        x: node.x,
        y: node.y,
        config: Object.fromEntries(Object.entries({ ...node.config, nodeKind: node.config.nodeKind || node.name }).map(([key, value]) => [key, String(value)])),
        status: node.status,
      })),
      edges: saved.edges.map(edge => ({ id: edge.id, from: edge.sourceId, to: edge.targetId, label: edge.label ? String(edge.label) : undefined })),
    });
  };

  const deleteSavedWorkflow = (id: string) => {
    setSavedWorkflows(prev => prev.filter(item => item.id !== id));
    if (activeSavedWorkflowId === id) setActiveSavedWorkflowId(null);
    showToast('Saved workflow removed.', 'info');
  };

  const exportWorkflow = () => {
    const payload = buildWorkflowExport();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(workflowName || 'arcus-workflow').toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'arcus-workflow'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Workflow exported.', 'success');
  };

  const importWorkflow = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as Partial<WorkflowExportPayload>;
      if (!parsed.workflow || !Array.isArray(parsed.workflow.nodes) || !Array.isArray(parsed.workflow.edges)) {
        throw new Error('This file does not look like an Arcus workflow export.');
      }
      applyWorkflowSnapshot({
        id: typeof parsed.workflow.id === 'string' ? parsed.workflow.id : null,
        name: typeof parsed.workflow.name === 'string' ? parsed.workflow.name : 'Imported Workflow',
        triggerInput: typeof parsed.workflow.triggerInput === 'string' ? parsed.workflow.triggerInput : '',
        nodes: parsed.workflow.nodes.map(node => ({
          id: String(node.id || crypto.randomUUID()),
          type: (node.type || 'tool') as AgentNode['type'],
          label: String(node.label || 'Imported Node'),
          emoji: String(node.emoji || '⚙️'),
          x: Number(node.x || 0),
          y: Number(node.y || 0),
          config: Object.fromEntries(Object.entries(node.config || {}).map(([key, value]) => [key, String(value)])),
          status: (node.status || 'idle') as AgentNode['status'],
        })),
        edges: parsed.workflow.edges.map(edge => ({
          id: String(edge.id || crypto.randomUUID()),
          from: String(edge.from || ''),
          to: String(edge.to || ''),
          label: typeof edge.label === 'string' ? edge.label : undefined,
        })).filter(edge => edge.from && edge.to),
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Workflow import failed.', 'error');
    } finally {
      event.target.value = '';
    }
  };

  const copyLastOutput = async () => {
    try {
      await navigator.clipboard.writeText(formatAgentOutput(lastRunOutput ?? ''));
      showToast('Last output copied.', 'success');
    } catch {
      showToast('Copy failed in this browser.', 'error');
    }
  };

  const downloadLastOutput = () => {
    const file = inferDownloadFile(lastRunOutput);
    if (!file) return;
    const blob = new Blob([file.content], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.filename;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${file.filename}.`, 'success');
  };

  const duplicateNode = (id: string) => {
    const source = nodes.find(n => n.id === id);
    if (!source) return;
    const newNode: AgentNode = {
      ...source,
      id: crypto.randomUUID(),
      x: source.x + 40,
      y: source.y + 40,
      status: 'idle',
    };
    setNodes(prev => [...prev, newNode]);
  };

  const appendRunLog = (entry: RunLogEntry) => {
    setRunLog(prev => [entry, ...prev].slice(0, 40));
  };

  const pushRunHistory = (record: AgentRunRecord) => {
    setRunHistory(prev => [record, ...prev].slice(0, 12));
    setSelectedRunId(record.id);
    const firstStep = sortRunSteps(record.steps)[0];
    setSelectedStepId(firstStep?.nodeId || null);
  };

  const runWorkflow = async () => {
    if (nodes.length === 0) return;
    if (isRunning) return;

    const controller = new AbortController();
    runAbortRef.current = controller;
    setIsRunning(true);
    setRunLog([]);
    setNodes(prev => prev.map(node => ({ ...node, status: 'idle' })));
    const startedAt = Date.now();

    try {
      const result = await executeAgentWorkflow({
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          category: node.type,
          name: node.label,
          x: node.x,
          y: node.y,
          config: node.config,
          status: node.status || 'idle',
        })),
        edges: edges.map(edge => ({ id: edge.id, sourceId: edge.from, targetId: edge.to, sourcePort: 'output', targetPort: 'input' })),
        inputText: triggerInput,
        selectedModel: state.selectedModel,
        availableModels: state.allModels,
        signal: controller.signal,
        callbacks: {
          onNodeStart: (node, input) => {
            setNodes(prev => prev.map(item => item.id === node.id ? { ...item, status: 'running' } : item));
            appendRunLog({
              id: crypto.randomUUID(),
              nodeId: node.id,
              nodeLabel: node.name,
              status: 'running',
              detail: typeof input === 'string' && input ? `${node.name} started with text input.` : `${node.name} started.`,
              timestamp: Date.now(),
            });
          },
          onNodeComplete: (node, entry) => {
            setNodes(prev => prev.map(item => item.id === node.id ? { ...item, status: 'success' } : item));
            appendRunLog({
              id: crypto.randomUUID(),
              nodeId: node.id,
              nodeLabel: node.name,
              status: 'success',
              detail: entry.detail,
              timestamp: Date.now(),
              duration: entry.elapsed,
            });
          },
          onNodeError: (node, entry) => {
            setNodes(prev => prev.map(item => item.id === node.id ? { ...item, status: 'error' } : item));
            appendRunLog({
              id: crypto.randomUUID(),
              nodeId: node.id,
              nodeLabel: node.name,
              status: 'error',
              detail: entry.error || entry.detail,
              timestamp: Date.now(),
              duration: entry.elapsed,
            });
          },
          onNodeSkipped: (node, detail) => {
            setNodes(prev => prev.map(item => item.id === node.id ? { ...item, status: 'idle' } : item));
            appendRunLog({
              id: crypto.randomUUID(),
              nodeId: node.id,
              nodeLabel: node.name,
              status: 'skipped',
              detail,
              timestamp: Date.now(),
            });
          },
        },
      });

      setLastRunOutput(result.finalOutput);
      setLastRunStatus('success');
      setLastRunError(null);
      setLastRunAt(Date.now());
      setLastRunSteps(result.stepsById);
      setShowRunInspector(true);
      pushRunHistory({
        id: crypto.randomUUID(),
        workflowName,
        timestamp: Date.now(),
        duration: Date.now() - startedAt,
        status: 'success',
        summary: result.summary,
        finalOutput: result.finalOutput,
        error: null,
        steps: result.stepsById,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Workflow execution failed.';
      const partialResult = error instanceof WorkflowExecutionError ? error.result : null;
      setLastRunStatus('error');
      setLastRunError(message);
      setLastRunAt(Date.now());
      setLastRunOutput(partialResult?.finalOutput);
      setLastRunSteps(partialResult?.stepsById || {});
      setShowRunInspector(true);
      appendRunLog({
        id: crypto.randomUUID(),
        nodeId: 'workflow',
        nodeLabel: workflowName,
        status: 'error',
        detail: message,
        timestamp: Date.now(),
      });
      pushRunHistory({
        id: crypto.randomUUID(),
        workflowName,
        timestamp: Date.now(),
        duration: Date.now() - startedAt,
        status: 'error',
        summary: partialResult?.summary || 'Workflow failed before completion.',
        finalOutput: partialResult?.finalOutput,
        error: message,
        steps: partialResult?.stepsById || {},
      });
    } finally {
      runAbortRef.current = null;
      setIsRunning(false);
    }
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
    if (selectedNode === id) setSelectedNode(null);
  };

  const deleteEdge = (id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
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

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      if (shouldIgnoreCanvasWheel(event.target)) return;
      event.preventDefault();
      const delta = event.deltaMode === 1 ? event.deltaY * 0.06 : event.deltaY * 0.0015;
      const nextZoom = clampZoom(zoom * Math.exp(-delta));
      zoomAtPoint(nextZoom, { clientX: event.clientX, clientY: event.clientY });
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [clampZoom, shouldIgnoreCanvasWheel, zoom, zoomAtPoint]);

  const handleCanvasDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes('application/x-arcus-node')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    if (!isCanvasDragOver) setIsCanvasDragOver(true);
  };

  const handleCanvasDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsCanvasDragOver(false);
    }
  };

  const handleCanvasDrop = (event: React.DragEvent<HTMLDivElement>) => {
    const raw = event.dataTransfer.getData('application/x-arcus-node');
    if (!raw) return;
    event.preventDefault();
    setIsCanvasDragOver(false);
    try {
      const item = JSON.parse(raw) as LibraryItem;
      const point = getCanvasPoint(event.clientX, event.clientY);
      addNode(item, {
        x: Math.max(20, point.x - 80),
        y: Math.max(20, point.y - 28),
      });
    } catch {
      showToast('Could not drop that node.', 'error');
    }
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
  const selectedNodeKind = selectedNodeData ? String(selectedNodeData.config.nodeKind || selectedNodeData.label) : null;
  const nodeEdgesIn = selectedNodeData ? edges.filter(e => e.to === selectedNode) : [];
  const nodeEdgesOut = selectedNodeData ? edges.filter(e => e.from === selectedNode) : [];
  const selectedRun = selectedRunId ? runHistory.find(run => run.id === selectedRunId) || null : (runHistory[0] || null);
  const inspectorSteps = selectedRun ? sortRunSteps(selectedRun.steps) : sortRunSteps(lastRunSteps);
  const selectedStep = (selectedRun?.steps && selectedStepId ? selectedRun.steps[selectedStepId] : undefined)
    || (selectedStepId ? lastRunSteps[selectedStepId] : undefined)
    || inspectorSteps[0]
    || null;

  useEffect(() => {
    if (!selectedStepId && inspectorSteps[0]) {
      setSelectedStepId(inspectorSteps[0].nodeId);
      return;
    }

    if (selectedStepId && !inspectorSteps.some(step => step.nodeId === selectedStepId)) {
      setSelectedStepId(inspectorSteps[0]?.nodeId || null);
    }
  }, [inspectorSteps, selectedStepId]);

  const libraryContent = (
    <>
      {savedWorkflows.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, padding: '0 4px' }}>Saved</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {savedWorkflows.map(workflow => (
              <div key={workflow.id} style={{ padding: '8px 10px', borderRadius: 10, background: activeSavedWorkflowId === workflow.id ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)', border: activeSavedWorkflowId === workflow.id ? '1px solid rgba(59,130,246,0.22)' : '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workflow.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{workflow.description || `${workflow.nodes.length} nodes`}</div>
                  </div>
                  <button onClick={() => deleteSavedWorkflow(workflow.id)} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', fontSize: 11 }}>✕</button>
                </div>
                <button onClick={() => loadSavedWorkflow(workflow.id)} style={{ marginTop: 8, width: '100%', padding: '7px 0', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Load snapshot</button>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{t.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Node categories (collapsible) */}
      {NODE_LIBRARY.map(section => (
        <div key={section.section} style={{ marginBottom: 8 }}>
          <button onClick={() => toggleSection(section.section)} style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%',
            fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase',
            letterSpacing: '0.05em', fontWeight: 600, padding: '4px 4px',
            background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <span style={{ transform: expandedSections.has(section.section) ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.15s', fontSize: 10 }}>▾</span>
            {section.section}
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{section.items.length}</span>
          </button>
          {expandedSections.has(section.section) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.items.map(item => (
                <button key={item.label} onClick={() => addNode(item)} draggable onDragStart={event => handleLibraryDragStart(event, item)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  background: 'transparent', border: '1px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontSize: 16 }}>{item.emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );

  const inspectorContent = selectedNodeData && (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Inspector</h3>
        <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 28 }}>{selectedNodeData.emoji}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{selectedNodeData.label}</div>
          <div style={{ fontSize: 11, color: TYPE_COLORS[selectedNodeData.type], textTransform: 'capitalize', fontWeight: 500 }}>{selectedNodeData.type} Node</div>
        </div>
      </div>

      {/* Connections summary */}
      <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
        <div>{nodeEdgesIn.length} input{nodeEdgesIn.length !== 1 ? 's' : ''} · {nodeEdgesOut.length} output{nodeEdgesOut.length !== 1 ? 's' : ''}</div>
        {nodeEdgesOut.map(e => {
          const target = nodes.find(n => n.id === e.to);
          return target && (
            <div key={e.id} style={{ display: 'grid', gap: 6, marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span>→ {target.emoji} {target.label}</span>
                <button onClick={() => deleteEdge(e.id)} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', fontSize: 10 }}>✕</button>
              </div>
              <input
                value={e.label || ''}
                onChange={event => setEdges(prev => prev.map(edge => edge.id === e.id ? { ...edge, label: event.target.value } : edge))}
                placeholder={selectedNodeKind === 'Condition' ? 'true / false' : selectedNodeKind === 'Router' ? 'route name' : 'optional edge label'}
                style={{ width: '100%', padding: '7px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 11, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          );
        })}
      </div>

      {/* Config fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Label</label>
          <input value={selectedNodeData.label} onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, label: e.target.value } : n))}
            style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
        </div>

        {selectedNodeData.type === 'model' && selectedNodeKind !== 'Image Gen' && (
          <>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Model</label>
              <select
                value={selectedNodeData.config.model || ''}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, model: e.target.value } } : n))}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                <option value="">Select model...</option>
                <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
                <option value="anthropic/claude-opus-4">Claude Opus 4</option>
                <option value="openai/gpt-4o">GPT-4o</option>
                <option value="openai/o3-mini">o3-mini</option>
                <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="deepseek/deepseek-r1">DeepSeek R1</option>
              </select>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Temperature</label>
                <span style={{ fontSize: 12, color: '#fff' }}>{selectedNodeData.config.temperature || '0.7'}</span>
              </div>
              <input type="range" min={0} max={2} step={0.1}
                value={selectedNodeData.config.temperature || '0.7'}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, temperature: e.target.value } } : n))}
                style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Max Tokens</label>
              <input
                value={selectedNodeData.config.maxTokens || ''}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, maxTokens: e.target.value } } : n))}
                placeholder="4096"
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </>
        )}

        {(selectedNodeData.type === 'model' || selectedNodeData.type === 'tool') && (
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Instructions</label>
            <textarea rows={4} placeholder="Custom instructions for this node..."
              value={selectedNodeData.config.instructions || ''}
              onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, instructions: e.target.value } } : n))}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
        )}

        {selectedNodeData.type === 'tool' && selectedNodeKind === 'Code Execute' && (
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>JavaScript</label>
            <textarea rows={7}
              value={selectedNodeData.config.script || ''}
              onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, script: e.target.value } } : n))}
              placeholder={"const items = Array.isArray(current?.items) ? current.items : [];\nreturn {\n  count: items.length,\n  titles: items.map((item) => item.title)\n};"}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'ui-monospace, SFMono-Regular, monospace', resize: 'vertical' }} />
          </div>
        )}

        {selectedNodeData.type === 'model' && (selectedNodeKind === 'Vision' || selectedNodeKind === 'Embeddings') && (
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{selectedNodeKind === 'Vision' ? 'Image URL Template' : 'Source Template'}</label>
            <input
              value={selectedNodeKind === 'Vision' ? (selectedNodeData.config.imageUrl || '') : (selectedNodeData.config.template || '')}
              onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, ...(selectedNodeKind === 'Vision' ? { imageUrl: e.target.value } : { template: e.target.value }) } } : n))}
              placeholder={selectedNodeKind === 'Vision' ? '{{input.imageUrl}}' : '{{input.message}}'}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
          </div>
        )}

        {(selectedNodeData.type === 'tool' && (selectedNodeKind === 'HTTP Request' || selectedNodeKind === 'Web Scraper')) || (selectedNodeData.type === 'output' && selectedNodeKind === 'Webhook Out') ? (
          <>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Method</label>
              <select
                value={selectedNodeData.config.method || 'GET'}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, method: e.target.value } } : n))}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}>
                <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>URL</label>
              <input
                value={selectedNodeData.config.url || ''}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, url: e.target.value } } : n))}
                placeholder="https://api.example.com/data"
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{selectedNodeKind === 'Web Scraper' ? 'Selector' : 'Headers (JSON)'}</label>
              <textarea rows={3}
                value={selectedNodeData.config.headers || ''}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, headers: e.target.value } } : n))}
                placeholder={selectedNodeKind === 'Web Scraper' ? '.headline, article p' : '{"Authorization":"Bearer {{steps.api-auth.output.headers.Authorization}}"}'}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
            {selectedNodeKind !== 'Web Scraper' && (
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Body / Payload</label>
                <textarea rows={4}
                  value={selectedNodeData.config.body || ''}
                  onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, body: e.target.value } } : n))}
                  placeholder='{"message":"Hello from Arcus"}'
                  style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
            )}
          </>
        ) : null}

        {selectedNodeData.type === 'tool' && selectedNodeKind === 'API Auth' && (
          <>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Auth Type</label>
              <select
                value={selectedNodeData.config.authType || 'bearer'}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, authType: e.target.value } } : n))}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}>
                <option value="bearer">Bearer token</option>
                <option value="api-key">API key</option>
                <option value="basic">Basic auth</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Credential Label</label>
              <input
                value={selectedNodeData.config.secretName || ''}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, secretName: e.target.value } } : n))}
                placeholder="OPENAI_API_KEY"
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            {selectedNodeData.config.authType === 'api-key' && (
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Header Name</label>
                <input
                  value={selectedNodeData.config.headerName || ''}
                  onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, headerName: e.target.value } } : n))}
                  placeholder="x-api-key"
                  style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            )}
            {selectedNodeData.config.authType === 'basic' && (
              <>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Username</label>
                  <input
                    value={selectedNodeData.config.username || ''}
                    onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, username: e.target.value } } : n))}
                    placeholder="arcus"
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Password</label>
                  <input
                    type="password"
                    value={selectedNodeData.config.password || ''}
                    onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, password: e.target.value } } : n))}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </>
            )}
            {selectedNodeData.config.authType !== 'basic' && (
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Secret Value</label>
                <input
                  type="password"
                  value={selectedNodeData.config.secretValue || ''}
                  onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, secretValue: e.target.value } } : n))}
                  placeholder="Paste a token or API key"
                  style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            )}
          </>
        )}

        {selectedNodeData.type === 'tool' && selectedNodeKind === 'Database' && (
          <>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Operation</label>
              <select
                value={selectedNodeData.config.operation || 'select'}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, operation: e.target.value } } : n))}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}>
                <option value="select">Select</option>
                <option value="insert">Insert</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Table / Collection</label>
              <input
                value={selectedNodeData.config.table || ''}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, table: e.target.value } } : n))}
                placeholder="users"
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Query / Filters</label>
              <textarea rows={3}
                value={selectedNodeData.config.query || ''}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, query: e.target.value } } : n))}
                placeholder='status = "active"'
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
          </>
        )}

        {(selectedNodeData.type === 'tool' && (selectedNodeKind === 'JSON Parser' || selectedNodeKind === 'Data Transform' || selectedNodeKind === 'Database' || selectedNodeKind === 'Web Search')) || (selectedNodeData.type === 'logic' && selectedNodeKind === 'Set Data') || (selectedNodeData.type === 'output' && selectedNodeKind === 'Response') || (selectedNodeData.type === 'model' && selectedNodeKind === 'Image Gen') ? (
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{selectedNodeKind === 'Image Gen' ? 'Prompt Template' : selectedNodeKind === 'Web Search' ? 'Query / Template' : selectedNodeKind === 'Response' ? 'Response Template' : 'Template / Mapping'}</label>
            <textarea rows={4}
              value={(selectedNodeKind === 'Response' ? selectedNodeData.config.message : selectedNodeKind === 'Image Gen' ? selectedNodeData.config.prompt : selectedNodeData.config.template) || ''}
              onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, ...(selectedNodeKind === 'Response' ? { message: e.target.value } : selectedNodeKind === 'Image Gen' ? { prompt: e.target.value } : { template: e.target.value }) } } : n))}
              placeholder={selectedNodeKind === 'Web Search' ? '{{input}} latest updates' : selectedNodeKind === 'Image Gen' ? 'cinematic neon skyline, volumetric lighting' : selectedNodeKind === 'Response' ? '{{steps.chat-completion.output}}' : '{"name":"{{steps.http-request.output.body.name}}"}'}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
        ) : null}

        {selectedNodeData.type === 'output' && selectedNodeKind === 'Save File' && (
          <>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Filename Template</label>
              <input
                value={selectedNodeData.config.filename || ''}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, filename: e.target.value } } : n))}
                placeholder="results-{{input.id}}.json"
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Content Template</label>
              <textarea rows={4}
                value={selectedNodeData.config.template || ''}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, template: e.target.value } } : n))}
                placeholder="{{steps.data-transform.output}}"
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Mime Type</label>
              <input
                value={selectedNodeData.config.mimeType || ''}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, mimeType: e.target.value } } : n))}
                placeholder="application/json"
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </>
        )}

        {selectedNodeData.type === 'logic' && selectedNodeKind === 'Condition' && (
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Condition</label>
            <input placeholder="e.g. output.contains('yes')"
              value={selectedNodeData.config.condition || ''}
              onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, condition: e.target.value } } : n))}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
          </div>
        )}

        {selectedNodeData.type === 'logic' && selectedNodeKind === 'Delay' && (
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Delay (ms)</label>
            <input type="number" placeholder="1000"
              value={selectedNodeData.config.delay || ''}
              onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, delay: e.target.value } } : n))}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
          </div>
        )}

        {selectedNodeData.type === 'logic' && selectedNodeKind === 'Router' && (
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Routes</label>
            <textarea rows={4}
              value={selectedNodeData.config.routes || ''}
              onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, routes: e.target.value } } : n))}
              placeholder={'priority: score > 80\nreview: score <= 80'}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
        )}

        {selectedNodeData.type === 'trigger' && selectedNodeKind === 'Schedule' && (
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Cron Expression</label>
            <input placeholder="*/5 * * * *"
              value={selectedNodeData.config.cron || ''}
              onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, cron: e.target.value } } : n))}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
          </div>
        )}

        {(selectedNodeData.type === 'trigger' && (selectedNodeKind === 'Webhook' || selectedNodeKind === 'Form Submit')) && (
          <>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Path</label>
              <input placeholder="/leads/new"
                value={selectedNodeData.config.path || ''}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, path: e.target.value } } : n))}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Allowed Method</label>
              <select
                value={selectedNodeData.config.triggerMethod || 'POST'}
                onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, triggerMethod: e.target.value } } : n))}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}>
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
          </>
        )}

        {(selectedNodeData.type === 'output' && (selectedNodeKind === 'Notify' || selectedNodeKind === 'Slack' || selectedNodeKind === 'Discord' || selectedNodeKind === 'Email')) && (
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{selectedNodeKind === 'Email' ? 'Recipient' : 'Channel / Destination'}</label>
            <input
              value={selectedNodeData.config.channel || ''}
              onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, channel: e.target.value } } : n))}
              placeholder={selectedNodeKind === 'Email' ? 'ops@example.com' : '#alerts'}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Message</label>
            <textarea rows={4}
              value={selectedNodeData.config.message || ''}
              onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, message: e.target.value } } : n))}
              placeholder='{{steps.classifier.output.summary}}'
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
        )}
      </div>

      {/* Position */}
      <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>X</span>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{Math.round(selectedNodeData.x)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Y</span>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{Math.round(selectedNodeData.y)}</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={() => setConnecting(selectedNode)} style={{
          width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 12,
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
          color: '#3B82F6', cursor: 'pointer', fontFamily: 'inherit',
        }}>🔗 Connect to…</button>
        <button onClick={() => { if (selectedNode) duplicateNode(selectedNode); }} style={{
          width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 12,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
        }}>⧉ Duplicate</button>
        <button onClick={() => { if (selectedNode) deleteNode(selectedNode); }} style={{
          width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 12,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit',
        }}>🗑 Delete Node</button>
      </div>
    </>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 76, boxSizing: 'border-box' }}>
      <input ref={importInputRef} type="file" accept="application/json" onChange={event => { void importWorkflow(event); }} style={{ display: 'none' }} />

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', flexShrink: 0, flexWrap: 'wrap', gap: 8,
        background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowLibrary(!showLibrary)} className="agent-sidebar-btn" style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 12,
            background: showLibrary ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
            border: showLibrary ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          }}>☰ Library</button>
          <button onClick={() => setShowMobilePanel(true)} className="agent-mobile-toggle" style={{
            display: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          }}>⚙ Panels</button>
          <button onClick={() => setShowSetupPanel(value => !value)} style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 12,
            background: showSetupPanel ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
            border: showSetupPanel ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          }}>{showSetupPanel ? 'Hide setup' : 'Show setup'}</button>
          <input value={workflowName} onChange={e => setWorkflowName(e.target.value)} style={{
            background: 'transparent', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
            outline: 'none', fontFamily: 'inherit', width: 'clamp(100px, 20vw, 200px)',
          }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{nodes.length}n · {edges.length}c</span>
          <span style={{
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)',
            color: '#93C5FD', fontSize: 10, fontWeight: 700,
          }}>LIVE RUNTIME</span>
          <span style={{
            padding: '4px 10px', borderRadius: 999,
            background: isRunning ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isRunning ? 'rgba(16,185,129,0.24)' : 'rgba(255,255,255,0.08)'}`,
            color: isRunning ? '#10B981' : 'rgba(255,255,255,0.42)',
            fontSize: 10, fontWeight: 700,
          }}>{isRunning ? 'RUNNING' : 'IDLE'}</span>
          <button onClick={saveWorkflowSnapshot} style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 11,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            color: '#93C5FD', cursor: 'pointer', fontFamily: 'inherit',
          }}>Save</button>
          <button onClick={exportWorkflow} style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 11,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontFamily: 'inherit',
          }}>Export</button>
          <button onClick={() => importInputRef.current?.click()} style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 11,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontFamily: 'inherit',
          }}>Import</button>
          <button onClick={autoLayout} style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 11,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
          }}>Auto-layout</button>
          <button onClick={() => fitCanvasToNodes()} style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 11,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.62)', cursor: 'pointer', fontFamily: 'inherit',
          }}>Fit view</button>
          <button onClick={() => { setNodes([]); setEdges([]); setSelectedNode(null); setRunLog([]); setActiveSavedWorkflowId(null); setLastRunSteps({}); setLastRunOutput(undefined); setLastRunError(null); setLastRunStatus('idle'); setSelectedRunId(null); setSelectedStepId(null); setShowSetupPanel(true); setPan({ x: 0, y: 0 }); setZoom(1); }} style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 11,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
          }}>Clear</button>
          <button onClick={() => { if (!isRunning) { void runWorkflow(); } else { runAbortRef.current?.abort(); setNodes(prev => prev.map(node => ({ ...node, status: node.status === 'running' ? 'idle' : node.status }))); } }} style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: isRunning ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            border: isRunning ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)',
            color: isRunning ? '#EF4444' : '#10B981', cursor: 'pointer', fontFamily: 'inherit',
          }}>{isRunning ? '■ Stop' : '▶ Run'}</button>
        </div>
      </div>

      {showSetupPanel ? (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.05fr) minmax(280px, 0.95fr)',
        gap: 12,
        padding: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(7,7,9,0.78)',
        backdropFilter: 'blur(18px)',
      }}>
        <div style={{ minWidth: 0, display: 'grid', gap: 12 }}>
          <div style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Workflow copilot</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>Describe the automation and Arcus will build a runnable graph.</div>
              </div>
              <button onClick={() => setWorkflowPrompt(WORKFLOW_BUILDER_EXAMPLES[Math.floor(Math.random() * WORKFLOW_BUILDER_EXAMPLES.length)])} style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Inspire me</button>
            </div>
            <textarea
              value={workflowPrompt}
              onChange={e => setWorkflowPrompt(e.target.value)}
              placeholder='Create a workflow that automates this...'
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 12, lineHeight: 1.5, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {WORKFLOW_BUILDER_EXAMPLES.map(example => (
                <button key={example} onClick={() => setWorkflowPrompt(example)} style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {example.length > 44 ? `${example.slice(0, 44)}…` : example}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <div style={{ fontSize: 11, color: 'rgba(147,197,253,0.76)' }}>Builds with your current model and falls back to a smart local plan if needed.</div>
              <button onClick={() => { void buildWorkflowWithCopilot(); }} disabled={!workflowPrompt.trim() || isBuildingWorkflow} style={{ padding: '8px 14px', borderRadius: 12, background: workflowPrompt.trim() && !isBuildingWorkflow ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.05)', border: workflowPrompt.trim() && !isBuildingWorkflow ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.08)', color: workflowPrompt.trim() && !isBuildingWorkflow ? '#DBEAFE' : 'rgba(255,255,255,0.36)', fontSize: 12, fontWeight: 700, cursor: workflowPrompt.trim() && !isBuildingWorkflow ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>{isBuildingWorkflow ? 'Building…' : 'Build workflow'}</button>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Trigger payload</div>
              <button onClick={() => setTriggerInput('{\n  "message": "Find the latest AI agent tooling news and summarize it",\n  "priority": 87\n}')} style={{
                padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.62)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit'
              }}>Insert sample JSON</button>
            </div>
            <textarea
              value={triggerInput}
              onChange={e => setTriggerInput(e.target.value)}
              placeholder='Type text or paste JSON. Example: {"message":"Summarize this page","url":"https://example.com"}'
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 12, lineHeight: 1.5, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
            />
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
              Tip: use <span style={{ color: '#fff' }}>{'{{input}}'}</span> or <span style={{ color: '#fff' }}>{'{{steps.web-search.output.results}}'}</span> in node templates.
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(147,197,253,0.78)' }}>
              Runs are real: supported nodes execute live model, search, HTTP, and browser-storage actions right in this workspace.
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Last output</div>
              <span style={{
                padding: '4px 9px', borderRadius: 999,
                background: lastRunStatus === 'success' ? 'rgba(16,185,129,0.14)' : lastRunStatus === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${lastRunStatus === 'success' ? 'rgba(16,185,129,0.25)' : lastRunStatus === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: lastRunStatus === 'success' ? '#10B981' : lastRunStatus === 'error' ? '#EF4444' : 'rgba(255,255,255,0.42)',
                fontSize: 10, fontWeight: 700,
              }}>{isRunning ? 'RUNNING' : lastRunStatus.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastRunOutput !== undefined && (
                <>
                  <button onClick={() => { void copyLastOutput(); }} style={{ padding: '4px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Copy</button>
                  <button onClick={downloadLastOutput} style={{ padding: '4px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Download</button>
                </>
              )}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{lastRunAt ? new Date(lastRunAt).toLocaleTimeString() : 'No runs yet'}</div>
            </div>
          </div>
          <div style={{ minHeight: 118, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: 12, overflow: 'hidden' }}>
            {lastRunError ? (
              <div style={{ fontSize: 12, color: '#FCA5A5', lineHeight: 1.6 }}>{lastRunError}</div>
            ) : (
              <>
                {typeof lastRunOutput === 'object' && lastRunOutput && 'imageUrl' in (lastRunOutput as Record<string, unknown>) && typeof (lastRunOutput as Record<string, unknown>).imageUrl === 'string' && (
                  <a href={String((lastRunOutput as Record<string, unknown>).imageUrl)} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: 10 }}>
                    <Image src={String((lastRunOutput as Record<string, unknown>).imageUrl)} alt="Workflow result" width={960} height={540} style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }} unoptimized />
                  </a>
                )}
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, lineHeight: 1.55, color: 'rgba(255,255,255,0.82)', fontFamily: 'inherit', maxHeight: 160, overflowY: 'auto' }}>{formatAgentOutput(lastRunOutput ?? 'Run the workflow to see its final output here.')}</pre>
              </>
            )}
          </div>
        </div>
      </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(7,7,9,0.78)', backdropFilter: 'blur(18px)', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
            <span style={{ padding: '4px 9px', borderRadius: 999, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', color: '#BFDBFE', fontSize: 10, fontWeight: 700 }}>SETUP HIDDEN</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>{triggerInput.trim() ? `Trigger ready · ${triggerInput.trim().slice(0, 72)}${triggerInput.trim().length > 72 ? '…' : ''}` : 'Add a trigger payload or build from a prompt when you need it.'}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>Last run: {lastRunAt ? new Date(lastRunAt).toLocaleTimeString() : 'never'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: lastRunStatus === 'success' ? '#86EFAC' : lastRunStatus === 'error' ? '#FCA5A5' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{lastRunStatus.toUpperCase()}</span>
            <button onClick={() => setShowSetupPanel(true)} style={{ padding: '7px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Open setup</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Node Library - Desktop */}
        {showLibrary && (
          <div className="agent-sidebar" style={{
            width: 'clamp(220px, 18vw, 280px)', flexShrink: 0, overflowY: 'auto', overflowX: 'hidden',
            background: 'rgba(12,12,14,0.6)', backdropFilter: 'blur(30px)',
            borderRight: '1px solid rgba(255,255,255,0.06)', padding: 12,
          }}>
            {libraryContent}
          </div>
        )}

        {/* Mobile panels overlay */}
        {showMobilePanel && (
          <div className="agent-mobile-panel" style={{
            display: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
            background: 'rgba(10,10,12,0.98)', backdropFilter: 'blur(20px)',
            overflowY: 'auto', padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Agent Panels</span>
              <button onClick={() => setShowMobilePanel(false)} style={{
                width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 16, cursor: 'pointer',
              }}>×</button>
            </div>
            {selectedNodeData && (
              <div style={{ marginBottom: 20, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Node Inspector</h4>
                {inspectorContent}
              </div>
            )}
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Node Library</h4>
            {libraryContent}
          </div>
        )}

        {/* Canvas */}
        <div ref={canvasRef} data-canvas="true"
          onMouseDown={handleCanvasMouseDown}
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
          style={{
            flex: 1, position: 'relative', overflow: 'hidden', cursor: isPanning ? 'grabbing' : 'grab',
            outline: isCanvasDragOver ? '2px solid rgba(59,130,246,0.45)' : 'none',
            outlineOffset: isCanvasDragOver ? -2 : 0,
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
                  {edge.label && (
                    <g>
                      <rect x={mx - 34} y={(y1 + y2) / 2 - 11} width={68} height={22} rx={11} fill="rgba(10,10,12,0.92)" stroke="rgba(255,255,255,0.08)" />
                      <text x={mx} y={(y1 + y2) / 2 + 4} textAnchor="middle" fill="rgba(255,255,255,0.72)" fontSize="10" fontWeight="600">{edge.label}</text>
                    </g>
                  )}
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
                border: `1.5px solid ${node.status === 'running' ? '#10B981' : node.status === 'success' ? 'rgba(111,177,120,0.6)' : node.status === 'error' ? '#EF4444' : selectedNode === node.id ? TYPE_COLORS[node.type] : 'rgba(255,255,255,0.08)'}`,
                boxShadow: node.status === 'running'
                  ? '0 0 22px rgba(16,185,129,0.22)'
                  : selectedNode === node.id
                    ? `0 0 20px ${TYPE_COLORS[node.type]}33`
                    : '0 4px 16px rgba(0,0,0,0.3)',
                cursor: 'grab', userSelect: 'none' as const,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}>
              {/* Color bar */}
              <div style={{ position: 'absolute', top: 0, left: 12, right: 12, height: 2, borderRadius: '0 0 2px 2px', background: TYPE_COLORS[node.type], opacity: 0.6 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{node.emoji}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{node.label}</div>
                  <div style={{ fontSize: 10, color: node.status === 'running' ? '#10B981' : 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{node.status === 'running' ? 'running' : node.type}</div>
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
                  Drag nodes from the library or click to add them. Connect nodes by clicking the output dot then clicking another node.
                </div>
              </div>
            </div>
          )}

          {isCanvasDragOver && (
            <div style={{
              position: 'absolute', inset: 18, zIndex: 3,
              borderRadius: 20, border: '2px dashed rgba(59,130,246,0.45)',
              background: 'rgba(59,130,246,0.08)', pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#DBEAFE', fontSize: 14, fontWeight: 700,
            }}>
              Drop node into workflow
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
            <button onClick={() => zoomAtPoint(zoom + 0.12)} style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>+</button>
            <button onClick={() => fitCanvasToNodes()} style={{ padding: '0 8px', height: 32, borderRadius: 8, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Fit</button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={{ padding: '0 8px', height: 32, borderRadius: 8, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{Math.round(zoom * 100)}%</button>
            <button onClick={() => zoomAtPoint(zoom - 0.12)} style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>−</button>
          </div>

          {showRunInspector && (selectedRun || Object.keys(lastRunSteps).length > 0) && (
            <div data-agent-scroll-panel="true" style={{
              position: 'absolute', right: 16, bottom: 16, zIndex: 10,
              width: 'min(460px, calc(100% - 120px))', maxHeight: 'min(70vh, 620px)', overflow: 'hidden',
              background: 'rgba(12,12,14,0.86)', backdropFilter: 'blur(22px)',
              borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)',
              display: 'grid', gridTemplateRows: 'auto auto minmax(0, 1fr)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Run inspector</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>{selectedRun ? `${selectedRun.workflowName} · ${selectedRun.summary}` : 'Latest execution details'}</div>
                </div>
                <button onClick={() => setShowRunInspector(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 15 }}>×</button>
              </div>

              <div data-agent-scroll-panel="true" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {runHistory.slice(0, 6).map(run => (
                  <button key={run.id} onClick={() => { setSelectedRunId(run.id); setSelectedStepId(sortRunSteps(run.steps)[0]?.nodeId || null); }} style={{
                    minWidth: 132, padding: '8px 10px', borderRadius: 12,
                    background: selectedRunId === run.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                    border: selectedRunId === run.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(255,255,255,0.06)',
                    color: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: run.status === 'success' ? '#86EFAC' : '#FCA5A5' }}>{run.status.toUpperCase()}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{run.workflowName}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{new Date(run.timestamp).toLocaleTimeString()}</div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '170px minmax(0, 1fr)', minHeight: 0 }}>
                <div data-agent-scroll-panel="true" style={{ borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: 10, display: 'grid', gap: 6 }}>
                  {inspectorSteps.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>No step data yet.</div>
                  ) : inspectorSteps.map(step => (
                    <button key={`${selectedRun?.id || 'latest'}-${step.nodeId}`} onClick={() => setSelectedStepId(step.nodeId)} style={{
                      padding: '8px 10px', borderRadius: 12, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
                      background: selectedStep?.nodeId === step.nodeId ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                      border: selectedStep?.nodeId === step.nodeId ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.05)',
                      color: '#fff',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: step.status === 'success' ? '#86EFAC' : step.status === 'error' ? '#FCA5A5' : 'rgba(255,255,255,0.45)' }}>{step.status.toUpperCase()}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{step.nodeName}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{step.elapsed}ms</div>
                    </button>
                  ))}
                </div>

                <div data-agent-scroll-panel="true" style={{ padding: 12, overflowY: 'auto', minWidth: 0 }}>
                  {selectedStep ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{selectedStep.nodeName}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{selectedStep.nodeKind} · {new Date(selectedStep.timestamp).toLocaleTimeString()}</div>
                        </div>
                        <span style={{ padding: '4px 8px', borderRadius: 999, background: selectedStep.status === 'success' ? 'rgba(16,185,129,0.12)' : selectedStep.status === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: selectedStep.status === 'success' ? '#86EFAC' : selectedStep.status === 'error' ? '#FCA5A5' : 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700 }}>{selectedStep.status.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.68)', lineHeight: 1.6 }}>{selectedStep.detail}</div>
                      <div style={{ display: 'grid', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.46)', marginBottom: 6 }}>Input</div>
                          <pre data-agent-scroll-panel="true" style={{ margin: 0, padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.78)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, lineHeight: 1.55, fontFamily: 'inherit', maxHeight: 140, overflowY: 'auto' }}>{formatAgentOutput(selectedStep.input ?? '—')}</pre>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.46)', marginBottom: 6 }}>Output</div>
                          <pre data-agent-scroll-panel="true" style={{ margin: 0, padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.78)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, lineHeight: 1.55, fontFamily: 'inherit', maxHeight: 180, overflowY: 'auto' }}>{formatAgentOutput(selectedStep.output ?? selectedStep.error ?? '—')}</pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Run the workflow to inspect step inputs, outputs, and timings.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!showRunInspector && (selectedRun || Object.keys(lastRunSteps).length > 0) && (
            <button onClick={() => setShowRunInspector(true)} style={{
              position: 'absolute', right: 16, bottom: 16, zIndex: 10,
              padding: '10px 14px', borderRadius: 14,
              background: 'rgba(12,12,14,0.86)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
            }}>Open run inspector</button>
          )}
        </div>

        {/* Inspector Panel - Desktop */}
        {selectedNodeData && (
          <div className="agent-inspector" style={{
            width: 'clamp(240px, 20vw, 300px)', flexShrink: 0, overflowY: 'auto', overflowX: 'hidden',
            background: 'rgba(12,12,14,0.6)', backdropFilter: 'blur(30px)',
            borderLeft: '1px solid rgba(255,255,255,0.06)', padding: 16,
          }}>
            {inspectorContent}
          </div>
        )}
      </div>
    </div>
  );
}
