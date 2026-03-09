import { AgentEdge, AgentNode, AgentRunStep, ExecutionLogEntry, ModelInfo, SelectedModel } from './types';
import { chatCompletion } from './openrouter';
import { buildPollinationsImageUrl, preloadImage } from './pollinations';

type RuntimeNode = AgentNode;
type RuntimeEdge = AgentEdge;

export interface RuntimeStepRecord {
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

export interface WorkflowExecutionResult {
  logs: ExecutionLogEntry[];
  stepsById: Record<string, RuntimeStepRecord>;
  finalOutput: unknown;
  summary: string;
}

export interface WorkflowExecutionCallbacks {
  onNodeStart?: (node: RuntimeNode, input: unknown) => void;
  onNodeComplete?: (node: RuntimeNode, result: RuntimeStepRecord) => void;
  onNodeError?: (node: RuntimeNode, result: RuntimeStepRecord) => void;
  onNodeSkipped?: (node: RuntimeNode, detail: string) => void;
}

export interface ExecuteWorkflowOptions {
  nodes: RuntimeNode[];
  edges: RuntimeEdge[];
  inputText: string;
  selectedModel: SelectedModel;
  availableModels?: ModelInfo[];
  signal?: AbortSignal;
  callbacks?: WorkflowExecutionCallbacks;
}

interface StepSnapshot {
  nodeId: string;
  nodeName: string;
  output: unknown;
  input: unknown;
  detail: string;
  status: RuntimeStepRecord['status'];
  elapsed: number;
  timestamp: number;
  nodeKind: string;
}

interface RuntimeContext {
  signal?: AbortSignal;
  selectedModel: SelectedModel;
  availableModels?: ModelInfo[];
  originalInput: unknown;
  currentInput: unknown;
  stepsById: Record<string, StepSnapshot>;
  stepsBySlug: Record<string, StepSnapshot>;
}

interface NodeExecutionResult {
  output: unknown;
  detail: string;
  nextTargets?: string[];
}

export class WorkflowExecutionError extends Error {
  result: WorkflowExecutionResult;

  constructor(message: string, result: WorkflowExecutionResult) {
    super(message);
    this.name = 'WorkflowExecutionError';
    this.result = result;
  }
}

const BROWSER_DB_PREFIX = 'arcus-agent-db:';

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new Error('Workflow stopped by user.');
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timeoutId);
      reject(new Error('Workflow stopped by user.'));
    };

    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'step';
}

function getNodeKind(node: RuntimeNode): string {
  return String(node.config?.nodeKind || node.name);
}

function getNodeSlugMap(nodes: RuntimeNode[]): Record<string, string> {
  const counts = new Map<string, number>();
  return Object.fromEntries(nodes.map(node => {
    const base = slugify(getNodeKind(node));
    const count = counts.get(base) || 0;
    counts.set(base, count + 1);
    return [node.id, count === 0 ? base : `${base}-${count + 1}`];
  }));
}

function parseInputText(inputText: string): unknown {
  const trimmed = inputText.trim();
  if (!trimmed) return '';
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseLooseJson(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function getPathValue(source: unknown, rawPath: string): unknown {
  const path = rawPath.trim();
  if (!path) return undefined;

  const normalized = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);

  let current: unknown = source;
  for (const part of normalized) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function buildTemplateScope(context: RuntimeContext, currentInput: unknown) {
  return {
    input: context.originalInput,
    current: currentInput,
    output: currentInput,
    steps: {
      ...context.stepsBySlug,
      byId: context.stepsById,
    },
  };
}

function resolveTemplateString(template: string, context: RuntimeContext, currentInput: unknown, preserveType = false): unknown {
  const exactMatch = template.match(/^\s*{{\s*([^}]+)\s*}}\s*$/);
  const scope = buildTemplateScope(context, currentInput);

  if (exactMatch) {
    const rawValue = getPathValue(scope, exactMatch[1]);
    if (rawValue !== undefined) return rawValue;
  }

  const replaced = template.replace(/{{\s*([^}]+)\s*}}/g, (_, expr) => {
    const rawValue = getPathValue(scope, String(expr));
    if (rawValue === null || rawValue === undefined) return '';
    if (typeof rawValue === 'string') return rawValue;
    return JSON.stringify(rawValue);
  });

  if (preserveType) {
    return parseLooseJson(replaced);
  }

  return replaced;
}

function resolveTemplateValue(value: unknown, context: RuntimeContext, currentInput: unknown): unknown {
  if (typeof value === 'string') return resolveTemplateString(value, context, currentInput, true);
  if (Array.isArray(value)) return value.map(item => resolveTemplateValue(item, context, currentInput));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, resolveTemplateValue(entry, context, currentInput)]));
  }
  return value;
}

function parseHeaders(value: unknown): Record<string, string> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, String(entry)]));
  }

  if (typeof value === 'string') {
    const parsed = parseLooseJson(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(Object.entries(parsed as Record<string, unknown>).map(([key, entry]) => [key, String(entry)]));
    }
  }

  return {};
}

function evaluateExpression(expression: string, context: RuntimeContext, currentInput: unknown, extras?: Record<string, unknown>): boolean {
  const interpolated = expression.replace(/{{\s*([^}]+)\s*}}/g, (_, expr) => JSON.stringify(getPathValue(buildTemplateScope(context, currentInput), String(expr))));
  const scope = buildTemplateScope(context, currentInput);
  const fn = new Function('input', 'current', 'output', 'steps', 'extras', `return Boolean(${interpolated || 'false'});`);
  return Boolean(fn(scope.input, scope.current, scope.output, scope.steps, extras || {}));
}

function parseRouterLines(value: string): Array<{ route: string; expression: string }> {
  return value
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) return { route: line, expression: 'true' };
      return {
        route: line.slice(0, separatorIndex).trim(),
        expression: line.slice(separatorIndex + 1).trim() || 'true',
      };
    });
}

function getEdgeLabel(edge: RuntimeEdge): string {
  return String(edge.label || '').trim();
}

function matchEdgeByLabel(edges: RuntimeEdge[], matcher: (label: string) => boolean): RuntimeEdge | undefined {
  return edges.find(edge => matcher(getEdgeLabel(edge).toLowerCase()));
}

function normalizeRouteKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function buildWorkflowResult(stepsById: Record<string, StepSnapshot>, logs: ExecutionLogEntry[], finalOutput: unknown): WorkflowExecutionResult {
  return {
    logs,
    stepsById: Object.fromEntries(Object.entries(stepsById).map(([id, step]) => [id, {
      nodeId: step.nodeId,
      nodeName: step.nodeName,
      nodeKind: step.nodeKind,
      status: step.status,
      elapsed: step.elapsed,
      timestamp: step.timestamp,
      input: step.input,
      output: step.output,
      detail: step.detail,
      error: step.status === 'error' ? step.detail : undefined,
    } satisfies AgentRunStep])) as Record<string, RuntimeStepRecord>,
    finalOutput,
    summary: `Executed ${Object.values(stepsById).filter(step => step.status === 'success').length} node(s).`,
  };
}

function sortNodesForDisplay(nodes: RuntimeNode[]): RuntimeNode[] {
  return [...nodes].sort((a, b) => a.x - b.x || a.y - b.y);
}

function topologicalSort(nodes: RuntimeNode[], edges: RuntimeEdge[]): RuntimeNode[] {
  const sortedPool = sortNodesForDisplay(nodes);
  const indegree = new Map<string, number>(nodes.map(node => [node.id, 0]));
  const outgoing = new Map<string, string[]>();

  for (const edge of edges) {
    indegree.set(edge.targetId, (indegree.get(edge.targetId) || 0) + 1);
    outgoing.set(edge.sourceId, [...(outgoing.get(edge.sourceId) || []), edge.targetId]);
  }

  const queue = sortedPool.filter(node => (indegree.get(node.id) || 0) === 0);
  const result: RuntimeNode[] = [];

  while (queue.length) {
    queue.sort((a, b) => a.x - b.x || a.y - b.y);
    const node = queue.shift();
    if (!node) break;
    result.push(node);

    for (const targetId of outgoing.get(node.id) || []) {
      indegree.set(targetId, (indegree.get(targetId) || 0) - 1);
      if ((indegree.get(targetId) || 0) === 0) {
        const targetNode = nodes.find(item => item.id === targetId);
        if (targetNode) queue.push(targetNode);
      }
    }
  }

  if (result.length !== nodes.length) {
    throw new Error('Loops are not supported yet. Remove the cycle to run this workflow.');
  }

  return result;
}

function collectIncomingInput(sourceIds: string[], stepsById: Record<string, StepSnapshot>, nodeSlugMap: Record<string, string>) {
  const activeSources = sourceIds
    .map(sourceId => stepsById[sourceId])
    .filter((step): step is StepSnapshot => Boolean(step) && step.status !== 'skipped');

  if (activeSources.length === 0) return undefined;
  if (activeSources.length === 1) return activeSources[0].output;

  return {
    items: activeSources.map(step => step.output),
    byStep: Object.fromEntries(activeSources.map(step => [nodeSlugMap[step.nodeId], step.output])),
  };
}

function resolveAuthHeaders(node: RuntimeNode, context: RuntimeContext, currentInput: unknown): Record<string, string> {
  const authType = String(node.config.authType || 'bearer');
  const secretValue = String(resolveTemplateValue(node.config.secretValue || '', context, currentInput) || '').trim();
  const headerName = String(resolveTemplateValue(node.config.headerName || 'x-api-key', context, currentInput) || 'x-api-key');
  const username = String(resolveTemplateValue(node.config.username || '', context, currentInput) || '');
  const password = String(resolveTemplateValue(node.config.password || '', context, currentInput) || '');

  if (authType === 'bearer' && secretValue) {
    return { Authorization: `Bearer ${secretValue}` };
  }

  if (authType === 'api-key' && secretValue) {
    return { [headerName]: secretValue };
  }

  if (authType === 'basic' && username) {
    const encoded = btoa(`${username}:${password}`);
    return { Authorization: `Basic ${encoded}` };
  }

  return {};
}

async function executeProxyRequest(payload: {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  extract?: 'raw' | 'text';
}, signal?: AbortSignal) {
  const response = await fetch('/api/agent/http', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'HTTP request failed.');
  }
  return data;
}

function getBrowserTable(table: string): unknown[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${BROWSER_DB_PREFIX}${table}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setBrowserTable(table: string, rows: unknown[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`${BROWSER_DB_PREFIX}${table}`, JSON.stringify(rows));
}

function filterRows(rows: Record<string, unknown>[], query: string, context: RuntimeContext, currentInput: unknown) {
  const trimmed = query.trim();
  if (!trimmed) return rows;
  return rows.filter(row => evaluateExpression(trimmed, context, currentInput, { row }));
}

async function executeNode(node: RuntimeNode, currentInput: unknown, context: RuntimeContext, outgoingEdges: RuntimeEdge[], orderedTargets: RuntimeNode[]): Promise<NodeExecutionResult> {
  assertNotAborted(context.signal);
  const kind = getNodeKind(node);
  const resolvedInstructions = String(resolveTemplateValue(node.config.instructions || '', context, currentInput) || '').trim();

  switch (kind) {
    case 'User Input':
    case 'Webhook':
    case 'Form Submit':
    case 'File Upload':
    case 'RSS Watch':
    case 'Schedule':
      return {
        output: currentInput ?? context.originalInput,
        detail: `${kind} received trigger data.`,
      };

    case 'API Auth': {
      const headers = resolveAuthHeaders(node, context, currentInput);
      return {
        output: { headers, authType: node.config.authType || 'bearer' },
        detail: Object.keys(headers).length ? `${Object.keys(headers).length} auth header(s) prepared.` : 'No auth headers were configured.',
      };
    }

    case 'HTTP Request':
    case 'Webhook Out': {
      const url = String(resolveTemplateValue(node.config.url || '', context, currentInput) || '').trim();
      if (!url) throw new Error('HTTP Request needs a URL.');
      const method = String(resolveTemplateValue(node.config.method || 'GET', context, currentInput) || 'GET').toUpperCase();
      const headers = {
        ...parseHeaders(resolveTemplateValue(node.config.headers || '', context, currentInput)),
        ...((typeof currentInput === 'object' && currentInput && 'headers' in (currentInput as Record<string, unknown>))
          ? parseHeaders((currentInput as Record<string, unknown>).headers)
          : {}),
      };
      const body = resolveTemplateValue(node.config.body || (method === 'GET' ? '' : currentInput), context, currentInput);
      const result = await executeProxyRequest({ url, method, headers, body, extract: 'raw' }, context.signal);
      return {
        output: result,
        detail: `${method} ${url} → ${result.status}`,
      };
    }

    case 'Web Scraper': {
      const url = String(resolveTemplateValue(node.config.url || currentInput || '', context, currentInput) || '').trim();
      if (!url) throw new Error('Web Scraper needs a URL.');
      const result = await executeProxyRequest({ url, method: 'GET', extract: 'text' }, context.signal);
      const selector = String(resolveTemplateValue(node.config.headers || '', context, currentInput) || '').trim();
      const text = typeof result.text === 'string' ? result.text : '';
      return {
        output: {
          ...result,
          selector,
          excerpt: text.slice(0, 2400),
        },
        detail: `Scraped ${result.title || url}`,
      };
    }

    case 'Web Search': {
      const query = String(resolveTemplateValue(node.config.query || resolvedInstructions || currentInput || '', context, currentInput) || '').trim();
      if (!query) throw new Error('Web Search needs a query.');
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode: /deep|research|exhaustive/i.test(resolvedInstructions) ? 'deep' : 'standard' }),
        signal: context.signal,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : 'Web search failed.');
      return {
        output: payload,
        detail: `Found ${(payload.results || []).length} result(s) via ${payload.provider}.`,
      };
    }

    case 'JSON Parser': {
      const source = resolveTemplateValue(node.config.template || currentInput || '', context, currentInput);
      const parsed = typeof source === 'string' ? parseLooseJson(source) : source;
      return {
        output: parsed,
        detail: typeof parsed === 'string' ? 'Input was not valid JSON, so it was passed through as text.' : 'Parsed structured data.',
      };
    }

    case 'Data Transform':
    case 'Set Data': {
      const template = node.config.template;
      const transformed = template ? resolveTemplateValue(template, context, currentInput) : currentInput;
      return {
        output: transformed,
        detail: template ? 'Template mapped data into a new shape.' : 'Passed data through unchanged.',
      };
    }

    case 'Code Execute': {
      const script = String(resolveTemplateValue(node.config.script || node.config.instructions || '', context, currentInput) || '').trim();
      if (!script) throw new Error('Code Execute needs a JavaScript snippet.');
      const scope = buildTemplateScope(context, currentInput);
      const fn = new Function(
        'input',
        'current',
        'output',
        'steps',
        `'use strict';\n${script.includes('return') ? script : `return (${script});`}`,
      );
      const output = fn(scope.input, scope.current, scope.output, scope.steps);
      return {
        output,
        detail: 'Executed custom JavaScript transform.',
      };
    }

    case 'Database': {
      const table = String(resolveTemplateValue(node.config.table || '', context, currentInput) || '').trim();
      if (!table) throw new Error('Database node needs a table name.');
      const operation = String(resolveTemplateValue(node.config.operation || 'select', context, currentInput) || 'select').toLowerCase();
      const rows = getBrowserTable(table).filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object' && !Array.isArray(row));
      const query = String(resolveTemplateValue(node.config.query || '', context, currentInput) || '');
      const matched = filterRows(rows, query, context, currentInput);
      const payload = resolveTemplateValue(node.config.template || currentInput, context, currentInput);

      if (operation === 'select') {
        return { output: matched, detail: `Selected ${matched.length} row(s) from ${table}.` };
      }

      if (operation === 'insert') {
        const items = Array.isArray(payload) ? payload : [payload];
        const enriched = items.map(item => {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            return { id: crypto.randomUUID(), ...(item as Record<string, unknown>) };
          }
          return { id: crypto.randomUUID(), value: item };
        });
        const nextRows = [...rows, ...enriched];
        setBrowserTable(table, nextRows);
        return { output: enriched, detail: `Inserted ${enriched.length} row(s) into ${table}.` };
      }

      if (operation === 'update') {
        const patch = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload as Record<string, unknown> : { value: payload };
        const nextRows = rows.map(row => matched.includes(row) ? { ...row, ...patch } : row);
        setBrowserTable(table, nextRows);
        return { output: nextRows.filter(row => matched.some(match => match.id === row.id)), detail: `Updated ${matched.length} row(s) in ${table}.` };
      }

      if (operation === 'delete') {
        const nextRows = rows.filter(row => !matched.some(match => match.id === row.id));
        setBrowserTable(table, nextRows);
        return { output: matched, detail: `Deleted ${matched.length} row(s) from ${table}.` };
      }

      throw new Error(`Unsupported database operation: ${operation}`);
    }

    case 'Delay': {
      const delay = Number(resolveTemplateValue(node.config.delay || '1000', context, currentInput) || 1000);
      const safeDelay = Number.isFinite(delay) && delay >= 0 ? delay : 1000;
      await sleep(safeDelay, context.signal);
      return { output: currentInput, detail: `Waited ${safeDelay}ms.` };
    }

    case 'Merge': {
      return {
        output: currentInput,
        detail: 'Merged active branch data.',
      };
    }

    case 'Condition': {
      const condition = String(node.config.condition || 'Boolean(output)').trim();
      const passed = evaluateExpression(condition, context, currentInput);
      const sortedTargets = [...orderedTargets].sort((a, b) => a.y - b.y || a.x - b.x);
      const trueEdge = matchEdgeByLabel(outgoingEdges, label => ['true', 'yes', 'pass', 'success'].includes(label));
      const falseEdge = matchEdgeByLabel(outgoingEdges, label => ['false', 'no', 'else', 'fail'].includes(label));
      const trueTarget = trueEdge?.targetId || sortedTargets[0]?.id;
      const falseTarget = falseEdge?.targetId || sortedTargets.find(target => target.id !== trueTarget)?.id;
      const nextTargets = passed ? (trueTarget ? [trueTarget] : []) : (falseTarget ? [falseTarget] : []);
      return {
        output: { passed, value: currentInput },
        detail: passed ? 'Condition evaluated true.' : 'Condition evaluated false.',
        nextTargets,
      };
    }

    case 'Router': {
      const routes = parseRouterLines(String(node.config.routes || 'continue: true'));
      const sortedTargets = [...orderedTargets].sort((a, b) => a.y - b.y || a.x - b.x);
      const selectedRouteNames: string[] = [];
      const selectedTargets = routes.flatMap((route, index) => {
        const routeKey = normalizeRouteKey(route.route);
        const targetByLabel = outgoingEdges.find(edge => normalizeRouteKey(getEdgeLabel(edge)) === routeKey);
        const fallbackTarget = sortedTargets[index];
        const targetId = targetByLabel?.targetId || fallbackTarget?.id;
        if (!targetId) return [];
        if (!evaluateExpression(route.expression, context, currentInput)) return [];
        selectedRouteNames.push(route.route);
        return [targetId];
      });
      return {
        output: { selectedRoutes: selectedRouteNames, value: currentInput },
        detail: selectedTargets.length ? `Router activated ${selectedTargets.length} branch(es).` : 'Router did not match any branches.',
        nextTargets: selectedTargets,
      };
    }

    case 'Loop':
      throw new Error('Loop nodes are not supported yet. Use multiple branches for now.');

    case 'Chat Completion':
    case 'Summarizer':
    case 'Classifier': {
      const model = String(resolveTemplateValue(node.config.model || '', context, currentInput) || '') || context.selectedModel.id;
      const runtime = context.selectedModel.runtime;
      const inputText = stringifyValue(currentInput || context.originalInput);
      const systemInstruction = (() => {
        if (kind === 'Summarizer') {
          return `Summarize the following content clearly and concisely. ${resolvedInstructions}`.trim();
        }
        if (kind === 'Classifier') {
          return `Classify the following input. Return ONLY valid JSON with keys label, confidence, and reasoning. ${resolvedInstructions}`.trim();
        }
        return resolvedInstructions || 'Follow the user request and produce a direct result.';
      })();
      const response = await chatCompletion([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: inputText },
      ], { model, runtime, availableModels: context.availableModels });
      const output = kind === 'Classifier' ? parseLooseJson(response) : response;
      return {
        output,
        detail: `${kind} completed with ${model}.`,
      };
    }

    case 'Embeddings': {
      const source = stringifyValue(currentInput || context.originalInput);
      const normalized = source.trim();
      if (!normalized) throw new Error('Embeddings needs text input.');
      const vector = Array.from({ length: 24 }, (_, index) => {
        let acc = 0;
        for (let i = 0; i < normalized.length; i++) {
          acc = (acc + normalized.charCodeAt(i) * (index + 7) * (i + 1)) % 10000;
        }
        return Number((acc / 10000).toFixed(6));
      });
      return {
        output: { vector, dimensions: vector.length, source: normalized.slice(0, 240) },
        detail: `Created ${vector.length}-dimensional embedding vector.`,
      };
    }

    case 'Vision': {
      const imageUrl = String(resolveTemplateValue(node.config.imageUrl || getPathValue(currentInput, 'imageUrl') || getPathValue(currentInput, 'url') || '', context, currentInput) || '').trim();
      const prompt = String(resolveTemplateValue(node.config.prompt || resolvedInstructions || 'Describe the provided image context.', context, currentInput) || 'Describe the provided image context.');
      const contextPayload = {
        imageUrl,
        input: currentInput,
      };
      const response = await chatCompletion([
        { role: 'system', content: 'You analyze image context provided as metadata, captions, alt text, OCR text, and URLs. Be explicit about uncertainty if the actual pixels are unavailable.' },
        { role: 'user', content: `${prompt}\n\nImage context:\n${stringifyValue(contextPayload)}` },
      ], { model: context.selectedModel.id, runtime: context.selectedModel.runtime, availableModels: context.availableModels });
      return {
        output: { imageUrl, analysis: response },
        detail: imageUrl ? 'Analyzed the supplied image context.' : 'Analyzed the supplied visual metadata.',
      };
    }

    case 'Image Gen': {
      const prompt = String(resolveTemplateValue(node.config.prompt || resolvedInstructions || currentInput || '', context, currentInput) || '').trim();
      if (!prompt) throw new Error('Image Gen needs a prompt or incoming text.');
      const model = String(resolveTemplateValue(node.config.model || 'flux', context, currentInput) || 'flux');
      const width = Number(resolveTemplateValue(node.config.width || '1024', context, currentInput) || 1024);
      const height = Number(resolveTemplateValue(node.config.height || '1024', context, currentInput) || 1024);
      const negativePrompt = String(resolveTemplateValue(node.config.negativePrompt || '', context, currentInput) || '');
      const imageUrl = buildPollinationsImageUrl({ prompt, model, width, height, negativePrompt });
      await preloadImage(imageUrl);
      return {
        output: { imageUrl, prompt, model, width, height },
        detail: `Generated image with ${model}.`,
      };
    }

    case 'Response': {
      const responsePayload = resolveTemplateValue(node.config.message || resolvedInstructions || currentInput, context, currentInput);
      return {
        output: responsePayload,
        detail: 'Prepared final response output.',
      };
    }

    case 'Notify':
    case 'Slack':
    case 'Discord':
    case 'Email': {
      const channel = String(resolveTemplateValue(node.config.channel || '', context, currentInput) || '').trim();
      const message = resolveTemplateValue(node.config.message || currentInput, context, currentInput);
      return {
        output: { channel, message, type: kind.toLowerCase() },
        detail: channel ? `${kind} payload prepared for ${channel}.` : `${kind} payload prepared.`,
      };
    }

    case 'Save File': {
      const filename = String(resolveTemplateValue(node.config.filename || `workflow-output-${Date.now()}.json`, context, currentInput) || `workflow-output-${Date.now()}.json`);
      const mimeType = String(resolveTemplateValue(node.config.mimeType || 'application/json', context, currentInput) || 'application/json');
      const content = resolveTemplateValue(node.config.template || currentInput, context, currentInput);
      return {
        output: { filename, content, mimeType },
        detail: `Prepared file ${filename}.`,
      };
    }

    default:
      return {
        output: currentInput,
        detail: `${kind} passed its input through.`,
      };
  }
}

export function formatAgentOutput(value: unknown): string {
  return stringifyValue(value);
}

export async function executeAgentWorkflow(options: ExecuteWorkflowOptions): Promise<WorkflowExecutionResult> {
  const { nodes, edges, inputText, selectedModel, availableModels, signal, callbacks } = options;

  if (!nodes.length) {
    throw new Error('Add a few nodes before running the workflow.');
  }

  const orderedNodes = topologicalSort(nodes, edges);
  const nodeSlugMap = getNodeSlugMap(nodes);
  const outgoingBySource = new Map<string, RuntimeEdge[]>();
  const incomingByTarget = new Map<string, string[]>();

  for (const edge of edges) {
    outgoingBySource.set(edge.sourceId, [...(outgoingBySource.get(edge.sourceId) || []), edge]);
    incomingByTarget.set(edge.targetId, [...(incomingByTarget.get(edge.targetId) || []), edge.sourceId]);
  }

  const originalInput = parseInputText(inputText);
  const context: RuntimeContext = {
    signal,
    selectedModel,
    availableModels,
    originalInput,
    currentInput: originalInput,
    stepsById: {},
    stepsBySlug: {},
  };

  const activatedEdgeIds = new Set<string>();
  const logs: ExecutionLogEntry[] = [];
  let finalOutput: unknown = originalInput;

  for (const node of orderedNodes) {
    assertNotAborted(signal);
    const incomingSources = incomingByTarget.get(node.id) || [];
    const activeIncomingEdges = edges.filter(edge => edge.targetId === node.id && activatedEdgeIds.has(edge.id));
    const isRoot = incomingSources.length === 0;

    if (!isRoot && activeIncomingEdges.length === 0) {
      callbacks?.onNodeSkipped?.(node, 'No active branch reached this node.');
      const skipped: StepSnapshot = {
        nodeId: node.id,
        nodeName: node.name,
        nodeKind: getNodeKind(node),
        status: 'skipped',
        output: undefined,
        input: undefined,
        detail: 'Skipped because no active branch reached this node.',
        elapsed: 0,
        timestamp: Date.now(),
      };
      context.stepsById[node.id] = skipped;
      context.stepsBySlug[nodeSlugMap[node.id]] = skipped;
      logs.unshift({
        timestamp: skipped.timestamp,
        nodeId: node.id,
        nodeName: node.name,
        status: 'skipped',
        elapsed: 0,
        output: skipped.detail,
      });
      continue;
    }

    const currentInput = isRoot
      ? originalInput
      : collectIncomingInput(activeIncomingEdges.map(edge => edge.sourceId), context.stepsById, nodeSlugMap);

    const startTime = Date.now();
    callbacks?.onNodeStart?.(node, currentInput);

    try {
      const outgoingEdges = outgoingBySource.get(node.id) || [];
      const orderedTargets = outgoingEdges
        .map(edge => orderedNodes.find(item => item.id === edge.targetId))
        .filter((item): item is RuntimeNode => Boolean(item));
      const result = await executeNode(node, currentInput, context, outgoingEdges, orderedTargets);
      const elapsed = Date.now() - startTime;
      const snapshot: StepSnapshot = {
        nodeId: node.id,
        nodeName: node.name,
        nodeKind: getNodeKind(node),
        status: 'success',
        output: result.output,
        input: currentInput,
        detail: result.detail,
        elapsed,
        timestamp: Date.now(),
      };
      context.stepsById[node.id] = snapshot;
      context.stepsBySlug[nodeSlugMap[node.id]] = snapshot;
      finalOutput = result.output;

      const nextTargets = result.nextTargets;
      if (nextTargets) {
        for (const edge of outgoingEdges) {
          if (nextTargets.includes(edge.targetId)) activatedEdgeIds.add(edge.id);
        }
      } else {
        for (const edge of outgoingEdges) activatedEdgeIds.add(edge.id);
      }

      const logEntry: ExecutionLogEntry = {
        timestamp: snapshot.timestamp,
        nodeId: node.id,
        nodeName: node.name,
        status: 'success',
        elapsed,
        input: currentInput,
        output: result.output,
      };
      logs.unshift(logEntry);
      callbacks?.onNodeComplete?.(node, {
        ...snapshot,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown workflow error.';
      const elapsed = Date.now() - startTime;
      const snapshot: StepSnapshot = {
        nodeId: node.id,
        nodeName: node.name,
        nodeKind: getNodeKind(node),
        status: 'error',
        output: undefined,
        input: currentInput,
        detail: message,
        elapsed,
        timestamp: Date.now(),
      };
      context.stepsById[node.id] = snapshot;
      context.stepsBySlug[nodeSlugMap[node.id]] = snapshot;
      const logEntry: ExecutionLogEntry = {
        timestamp: snapshot.timestamp,
        nodeId: node.id,
        nodeName: node.name,
        status: 'error',
        elapsed,
        input: currentInput,
        error: message,
      };
      logs.unshift(logEntry);
      callbacks?.onNodeError?.(node, {
        ...snapshot,
        error: message,
      });
      throw new WorkflowExecutionError(message, buildWorkflowResult(context.stepsById, logs, finalOutput));
    }
  }

  const outputNodes = orderedNodes.filter(node => node.type === 'output');
  for (const node of [...outputNodes].reverse()) {
    const snapshot = context.stepsById[node.id];
    if (snapshot?.status === 'success') {
      finalOutput = snapshot.output;
      break;
    }
  }

  return buildWorkflowResult(context.stepsById, logs, finalOutput);
}
