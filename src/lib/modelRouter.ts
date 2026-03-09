import { ChatAttachment, ModelInfo, SelectedModel } from './types';

export const ROUTER_MODEL_ID = 'arcus/prism-router';
const ROUTER_LEGACY_MODEL_IDS = new Set(['arcus/max-router-v2', ROUTER_MODEL_ID]);

export const ROUTER_MODEL_INFO: ModelInfo = {
  id: ROUTER_MODEL_ID,
  name: 'Arcus Prism',
  provider: 'Arcus',
  runtime: 'puter',
  availableRuntimes: ['puter', 'openrouter'],
  created: 0,
  context_length: 1_000_000,
  openness: 'proprietary',
  intelligenceIndex: 99,
  latencySeconds: 0.15,
  speedTokensPerSecond: 999,
  description: 'Arcus meta-router that analyzes each prompt and automatically selects the best underlying model for quality, speed, and cost.',
  pricing: {},
  top_provider: {
    max_completion_tokens: 65536,
  },
  architecture: {
    input_modalities: ['text', 'image', 'audio', 'video'],
    output_modalities: ['text'],
    modality: 'router',
  },
};

export const ROUTER_SELECTED_MODEL: SelectedModel = {
  id: ROUTER_MODEL_INFO.id,
  name: ROUTER_MODEL_INFO.name,
  provider: 'Arcus',
  runtime: 'puter',
};

type PrimaryTaskType =
  | 'REASONING'
  | 'CODING'
  | 'CREATIVE_WRITING'
  | 'PROFESSIONAL_WRITING'
  | 'ANALYSIS'
  | 'EXTRACTION'
  | 'SUMMARIZATION'
  | 'TRANSLATION'
  | 'CONVERSATION'
  | 'INSTRUCTION_FOLLOWING'
  | 'MULTIMODAL'
  | 'IMAGE_GENERATION'
  | 'RESEARCH'
  | 'TUTORING'
  | 'FACTUAL_QA'
  | 'ROLEPLAY'
  | 'FUNCTION_CALLING'
  | 'META';

type ContextWindowNeeded = 'SMALL' | 'MEDIUM' | 'LARGE' | 'MASSIVE';
type LatencySensitivity = 'REAL_TIME' | 'STANDARD' | 'BATCH';
type CostSensitivity = 'MINIMIZE' | 'BALANCED' | 'MAXIMIZE_QUALITY';
type Domain = 'STEM' | 'HUMANITIES' | 'BUSINESS' | 'LEGAL' | 'MEDICAL' | 'TECHNICAL' | 'GENERAL' | 'ACADEMIC';
type OutputFormat = 'FREE_TEXT' | 'STRUCTURED' | 'CODE' | 'VISUAL' | 'MIXED';
type ConfidenceLabel = 'HIGH' | 'MEDIUM' | 'LOW';
type SpecialRequirement =
  | 'NEEDS_CURRENT_INFO'
  | 'NEEDS_CODE_EXECUTION'
  | 'NEEDS_FILE_ANALYSIS'
  | 'NEEDS_IMAGE_INPUT'
  | 'NEEDS_IMAGE_OUTPUT'
  | 'NEEDS_AUDIO_VIDEO'
  | 'NEEDS_CITATIONS'
  | 'NEEDS_SAFETY_CARE'
  | 'NEEDS_MULTILINGUAL'
  | 'NEEDS_STRUCTURED_OUTPUT'
  | 'NEEDS_LONG_OUTPUT'
  | 'NEEDS_MATHEMATICAL_PRECISION'
  | 'PROMPT_INJECTION_RISK';

interface RouterAnalysis {
  primary_task_type: PrimaryTaskType;
  complexity: number;
  context_window_needed: ContextWindowNeeded;
  latency_sensitivity: LatencySensitivity;
  cost_sensitivity: CostSensitivity;
  special_requirements: SpecialRequirement[];
  domain: Domain;
  output_format: OutputFormat;
  prompt_summary: string;
}

interface RoutingPipelineStep {
  step: number;
  component: string;
  purpose: string;
}

interface RoutingDecisionPayload {
  selected_model: string;
  selected_tools: string[];
  pipeline: RoutingPipelineStep[];
  confidence: number;
  confidence_label: ConfidenceLabel;
}

interface AlternativeModel {
  model: string;
  score: number;
  note: string;
}

interface RouterReasoning {
  why_selected: string;
  why_not_alternatives: string;
  top_alternatives: AlternativeModel[];
}

interface RouterInstructions {
  suggested_system_prompt_additions: string;
  suggested_temperature: number;
  suggested_max_tokens: number | null;
  suggested_reasoning_effort: 'low' | 'medium' | 'high' | null;
}

export interface RouterDecision {
  analysis: RouterAnalysis;
  routing_decision: RoutingDecisionPayload;
  reasoning: RouterReasoning;
  model_instructions: RouterInstructions;
  resolvedModel: SelectedModel;
}

interface RoutePromptOptions {
  prompt: string;
  attachments?: ChatAttachment[];
  availableModels?: ModelInfo[];
  deepResearch?: boolean;
}

interface CandidateModelProfile {
  id: string;
  provider: string;
  runtime: 'puter' | 'openrouter';
  costTier: 1 | 2 | 3 | 4 | 5;
  latencyTier: 1 | 2 | 3 | 4 | 5;
  supportsVision?: boolean;
  supportsAudioVideo?: boolean;
  context: number;
  taskFit: Partial<Record<PrimaryTaskType, number>>;
  domainFit?: Partial<Record<Domain, number>>;
  note: string;
}

const MODEL_PROFILES: CandidateModelProfile[] = [
  {
    id: 'openai/gpt-5.4',
    provider: 'OpenAI',
    runtime: 'puter',
    costTier: 5,
    latencyTier: 4,
    supportsVision: true,
    context: 1_000_000,
    note: 'Frontier generalist for complex reasoning, coding, and structured responses.',
    taskFit: { REASONING: 92, CODING: 94, CREATIVE_WRITING: 90, PROFESSIONAL_WRITING: 91, ANALYSIS: 92, RESEARCH: 89, TUTORING: 88, FACTUAL_QA: 86, INSTRUCTION_FOLLOWING: 96, FUNCTION_CALLING: 94, META: 93, MULTIMODAL: 88 },
    domainFit: { STEM: 91, TECHNICAL: 94, BUSINESS: 88, ACADEMIC: 89, GENERAL: 90, MEDICAL: 86, LEGAL: 87, HUMANITIES: 88 },
  },
  {
    id: 'anthropic/claude-opus-4',
    provider: 'Anthropic',
    runtime: 'puter',
    costTier: 5,
    latencyTier: 4,
    supportsVision: true,
    context: 200_000,
    note: 'Careful, thorough model for nuanced writing, safety, and long-document work.',
    taskFit: { ANALYSIS: 94, PROFESSIONAL_WRITING: 93, CREATIVE_WRITING: 94, RESEARCH: 91, EXTRACTION: 90, SUMMARIZATION: 91, CODING: 89, REASONING: 89, TUTORING: 88, MULTIMODAL: 84, INSTRUCTION_FOLLOWING: 94 },
    domainFit: { LEGAL: 90, MEDICAL: 89, BUSINESS: 90, HUMANITIES: 93, ACADEMIC: 91, TECHNICAL: 87, GENERAL: 88 },
  },
  {
    id: 'anthropic/claude-sonnet-4',
    provider: 'Anthropic',
    runtime: 'puter',
    costTier: 4,
    latencyTier: 3,
    supportsVision: true,
    context: 200_000,
    note: 'Balanced high-quality model for professional tasks and coding.',
    taskFit: { CODING: 90, ANALYSIS: 89, PROFESSIONAL_WRITING: 90, CREATIVE_WRITING: 88, RESEARCH: 87, INSTRUCTION_FOLLOWING: 91, TUTORING: 86 },
    domainFit: { TECHNICAL: 89, BUSINESS: 87, GENERAL: 86, HUMANITIES: 86, ACADEMIC: 86 },
  },
  {
    id: 'anthropic/claude-haiku-3.5',
    provider: 'Anthropic',
    runtime: 'puter',
    costTier: 2,
    latencyTier: 1,
    supportsVision: true,
    context: 200_000,
    note: 'Fast, cheap option for straightforward summarization and extraction.',
    taskFit: { EXTRACTION: 85, SUMMARIZATION: 84, FACTUAL_QA: 81, CONVERSATION: 78, TRANSLATION: 80, INSTRUCTION_FOLLOWING: 80 },
    domainFit: { GENERAL: 80, BUSINESS: 79, TECHNICAL: 75 },
  },
  {
    id: 'google/gemini-2.5-pro',
    provider: 'Google',
    runtime: 'puter',
    costTier: 5,
    latencyTier: 3,
    supportsVision: true,
    supportsAudioVideo: true,
    context: 1_000_000,
    note: 'Best for huge context windows and multimodal-heavy work.',
    taskFit: { MULTIMODAL: 95, ANALYSIS: 92, CODING: 89, RESEARCH: 87, REASONING: 88, FACTUAL_QA: 84 },
    domainFit: { TECHNICAL: 88, STEM: 89, ACADEMIC: 90, GENERAL: 84 },
  },
  {
    id: 'google/gemini-2.5-flash',
    provider: 'Google',
    runtime: 'puter',
    costTier: 2,
    latencyTier: 1,
    supportsVision: true,
    supportsAudioVideo: true,
    context: 1_000_000,
    note: 'Fast and cost-effective for current info synthesis and large-context lightweight tasks.',
    taskFit: { FACTUAL_QA: 80, SUMMARIZATION: 82, EXTRACTION: 83, MULTIMODAL: 82, CONVERSATION: 78, RESEARCH: 74 },
    domainFit: { GENERAL: 81, TECHNICAL: 78, BUSINESS: 78 },
  },
  {
    id: 'openai/o3',
    provider: 'OpenAI',
    runtime: 'puter',
    costTier: 5,
    latencyTier: 5,
    supportsVision: true,
    context: 200_000,
    note: 'Top-tier reasoning for hard math, science, algorithms, and formal logic.',
    taskFit: { REASONING: 97, CODING: 91, ANALYSIS: 90, TUTORING: 86 },
    domainFit: { STEM: 98, TECHNICAL: 91, ACADEMIC: 92 },
  },
  {
    id: 'openai/o4-mini',
    provider: 'OpenAI',
    runtime: 'puter',
    costTier: 3,
    latencyTier: 4,
    supportsVision: true,
    context: 200_000,
    note: 'Smarter reasoning value pick for STEM and coding without o3 cost.',
    taskFit: { REASONING: 86, CODING: 87, ANALYSIS: 82, TUTORING: 80 },
    domainFit: { STEM: 89, TECHNICAL: 87, ACADEMIC: 84 },
  },
  {
    id: 'deepseek/deepseek-r1',
    provider: 'DeepSeek',
    runtime: 'puter',
    costTier: 2,
    latencyTier: 3,
    context: 128_000,
    note: 'Excellent low-cost reasoning for math, code, and logic-heavy tasks.',
    taskFit: { REASONING: 89, CODING: 88, ANALYSIS: 78, TUTORING: 76 },
    domainFit: { STEM: 91, TECHNICAL: 87, ACADEMIC: 80 },
  },
  {
    id: 'deepseek/deepseek-chat',
    provider: 'DeepSeek',
    runtime: 'puter',
    costTier: 1,
    latencyTier: 2,
    context: 128_000,
    note: 'Cheap general-purpose model for everyday coding and Q&A.',
    taskFit: { CODING: 81, FACTUAL_QA: 76, CONVERSATION: 74, SUMMARIZATION: 75, INSTRUCTION_FOLLOWING: 73 },
    domainFit: { TECHNICAL: 79, GENERAL: 74 },
  },
  {
    id: 'meta-llama/llama-4-maverick',
    provider: 'Meta',
    runtime: 'puter',
    costTier: 2,
    latencyTier: 2,
    supportsVision: true,
    context: 1_000_000,
    note: 'Good open-weight multilingual generalist with long context.',
    taskFit: { CONVERSATION: 78, TRANSLATION: 83, FACTUAL_QA: 74, MULTIMODAL: 76 },
    domainFit: { GENERAL: 77, HUMANITIES: 76 },
  },
  {
    id: 'mistralai/mistral-large-2',
    provider: 'Mistral',
    runtime: 'puter',
    costTier: 3,
    latencyTier: 3,
    context: 128_000,
    note: 'Strong multilingual and function-style generalist.',
    taskFit: { TRANSLATION: 88, FUNCTION_CALLING: 84, CODING: 82, ANALYSIS: 80, CONVERSATION: 76 },
    domainFit: { HUMANITIES: 81, GENERAL: 79, TECHNICAL: 80 },
  },
  {
    id: 'x-ai/grok-3',
    provider: 'xAI',
    runtime: 'puter',
    costTier: 4,
    latencyTier: 3,
    supportsVision: true,
    context: 128_000,
    note: 'Good all-around reasoning and conversational model with fresher-world flavor.',
    taskFit: { REASONING: 84, CONVERSATION: 82, FACTUAL_QA: 78, META: 84 },
    domainFit: { GENERAL: 80, TECHNICAL: 79 },
  },
  {
    id: 'openai/gpt-4o-mini',
    provider: 'OpenAI',
    runtime: 'puter',
    costTier: 2,
    latencyTier: 1,
    supportsVision: true,
    context: 128_000,
    note: 'Fast balanced everyday model for light coding, chat, and structured tasks.',
    taskFit: { CONVERSATION: 83, FACTUAL_QA: 80, CODING: 79, INSTRUCTION_FOLLOWING: 83 },
    domainFit: { GENERAL: 82, TECHNICAL: 80, BUSINESS: 79 },
  },
];

const MODEL_PROFILE_MAP = new Map(MODEL_PROFILES.map(profile => [profile.id, profile]));

function inferCostTier(model: ModelInfo): 1 | 2 | 3 | 4 | 5 {
  const promptCost = Number(model.pricing?.prompt ?? Number.NaN);
  if (Number.isFinite(promptCost)) {
    if (promptCost <= 0.08) return 1;
    if (promptCost <= 0.35) return 2;
    if (promptCost <= 1.5) return 3;
    if (promptCost <= 5) return 4;
    return 5;
  }

  if (/nano|micro|lite|flash-lite|mini|haiku|small|8b|4b/i.test(model.id)) return 1;
  if (/flash|scout|maverick|coder|70b|72b|medium/i.test(model.id)) return 2;
  if (/sonnet|large|pro|4o|4\.1/i.test(model.id)) return 3;
  if (/opus|gpt-5|o3|405b|235b/i.test(model.id)) return 5;
  return 3;
}

function inferLatencyTier(model: ModelInfo): 1 | 2 | 3 | 4 | 5 {
  if (typeof model.latencySeconds === 'number') {
    if (model.latencySeconds <= 0.6) return 1;
    if (model.latencySeconds <= 1.2) return 2;
    if (model.latencySeconds <= 2.4) return 3;
    if (model.latencySeconds <= 5) return 4;
    return 5;
  }

  if (typeof model.speedTokensPerSecond === 'number') {
    if (model.speedTokensPerSecond >= 180) return 1;
    if (model.speedTokensPerSecond >= 110) return 2;
    if (model.speedTokensPerSecond >= 70) return 3;
    if (model.speedTokensPerSecond >= 35) return 4;
    return 5;
  }

  if (/nano|micro|lite|flash-lite|mini|haiku|small|8b|4b/i.test(model.id)) return 1;
  if (/flash|scout|maverick|turbo/i.test(model.id)) return 2;
  if (/sonnet|large|pro|70b|72b/i.test(model.id)) return 3;
  if (/opus|gpt-5|o3|405b|235b/i.test(model.id)) return 4;
  return 3;
}

function inferTaskFit(model: ModelInfo): Partial<Record<PrimaryTaskType, number>> {
  const id = model.id.toLowerCase();
  const taskFit: Partial<Record<PrimaryTaskType, number>> = {
    CONVERSATION: 76,
    FACTUAL_QA: 75,
    INSTRUCTION_FOLLOWING: 76,
  };

  if (/gpt-5|claude|gemini-2\.5-pro|gemini-3\.1-pro|grok-3|large|opus|sonnet|405b|235b/i.test(id)) {
    taskFit.REASONING = 88;
    taskFit.ANALYSIS = 87;
    taskFit.PROFESSIONAL_WRITING = 86;
    taskFit.RESEARCH = 84;
  }
  if (/code|coder|codestral|gpt-5|claude|o3|o4|deepseek|qwen-2\.5-coder|gemini-2\.5-pro|gemini-3\.1-pro/i.test(id)) {
    taskFit.CODING = 87;
  }
  if (/reason|r1|o3|o4|prover|phi-4|math|reasoning/i.test(id)) {
    taskFit.REASONING = Math.max(taskFit.REASONING ?? 0, 90);
    taskFit.TUTORING = 82;
  }
  if (/sonar|perplexity|command-r|command-a|research/i.test(id)) {
    taskFit.RESEARCH = 88;
    taskFit.SUMMARIZATION = 84;
    taskFit.EXTRACTION = 83;
  }
  if (/flash|nano|micro|lite|mini|haiku|small|8b|4b/i.test(id)) {
    taskFit.SUMMARIZATION = Math.max(taskFit.SUMMARIZATION ?? 0, 82);
    taskFit.EXTRACTION = Math.max(taskFit.EXTRACTION ?? 0, 82);
    taskFit.CONVERSATION = 82;
  }
  if (/vision|vl|pixtral|gpt-4o|gpt-5|claude|gemini|llama-4|grok|multimodal/i.test(id) || model.architecture?.input_modalities?.includes('image')) {
    taskFit.MULTIMODAL = 84;
  }
  if (/mistral|qwen|glm|jamba|llama|gemma/i.test(id)) {
    taskFit.TRANSLATION = 82;
  }

  return taskFit;
}

function inferDomainFit(model: ModelInfo): Partial<Record<Domain, number>> {
  const id = model.id.toLowerCase();
  const domainFit: Partial<Record<Domain, number>> = {
    GENERAL: 78,
  };

  if (/code|coder|gpt-5|claude|o3|o4|deepseek|qwen-2\.5-coder|gemini/i.test(id)) {
    domainFit.TECHNICAL = 86;
  }
  if (/reason|r1|o3|o4|phi-4|prover|math/i.test(id)) {
    domainFit.STEM = 88;
    domainFit.ACADEMIC = 84;
  }
  if (/command-r|command-a|sonar|claude|gpt-5|gemini/i.test(id)) {
    domainFit.BUSINESS = 82;
  }
  if (/claude|opus|sonnet|command-r|sonar/i.test(id)) {
    domainFit.LEGAL = 82;
    domainFit.MEDICAL = 80;
  }
  if (/mistral|qwen|glm|llama|gemma|claude/i.test(id)) {
    domainFit.HUMANITIES = 81;
  }

  return domainFit;
}

function inferProfileFromModel(model: ModelInfo): CandidateModelProfile {
  const existing = MODEL_PROFILE_MAP.get(model.id);
  if (existing) return existing;

  const id = model.id.toLowerCase();

  return {
    id: model.id,
    provider: model.provider || model.id.split('/')[0] || 'Unknown',
    runtime: model.runtime || 'puter',
    costTier: inferCostTier(model),
    latencyTier: inferLatencyTier(model),
    supportsVision: Boolean(model.architecture?.input_modalities?.includes('image') || /vision|vl|pixtral|gpt-4|gpt-5|claude|gemini|llama-4|grok/i.test(id)),
    supportsAudioVideo: Boolean(model.architecture?.input_modalities?.includes('audio') || model.architecture?.input_modalities?.includes('video') || /audio|video|gemini/i.test(id)),
    context: model.context_length || 128_000,
    taskFit: inferTaskFit(model),
    domainFit: inferDomainFit(model),
    note: model.description || `${model.name} is available in Arcus Prism's live model directory.`,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isRouterModelId(modelId?: string | null): boolean {
  return ROUTER_LEGACY_MODEL_IDS.has(String(modelId || '').trim().toLowerCase());
}

function latestUserPrompt(prompt: string): string {
  return prompt.replace(/\s+/g, ' ').trim();
}

function detectPrimaryTaskType(prompt: string): PrimaryTaskType {
  if (/(create|generate|draw|design|render).*(image|logo|poster|illustration|photo|artwork)|\bimage\b.*(generate|creation)/i.test(prompt)) return 'IMAGE_GENERATION';
  if (/(analyze this image|what's in this image|look at this image|photo|screenshot)/i.test(prompt)) return 'MULTIMODAL';
  if (/(write|debug|fix|refactor|implement|typescript|javascript|python|react|next\.js|sql|api|regex|code|function|class|bug)/i.test(prompt)) return 'CODING';
  if (/(prove|proof|theorem|integral|derivative|algorithm|optimi[sz]e|formal logic|reason|why does|math|calculate)/i.test(prompt)) return 'REASONING';
  if (/(research|compare sources|investigate|deep dive|analyze the latest|literature review)/i.test(prompt)) return 'RESEARCH';
  if (/(summari[sz]e|tl;dr|condense|brief overview)/i.test(prompt)) return 'SUMMARIZATION';
  if (/(extract|pull out|find all|list every|parse this|structured data from)/i.test(prompt)) return 'EXTRACTION';
  if (/(translate|rewrite in spanish|rewrite in french|locali[sz]e)/i.test(prompt)) return 'TRANSLATION';
  if (/(email|memo|proposal|report|resume|cover letter|statement of work|contract|policy)/i.test(prompt)) return 'PROFESSIONAL_WRITING';
  if (/(story|novel|poem|lyrics|screenplay|worldbuilding|character|creative|fiction)/i.test(prompt)) return 'CREATIVE_WRITING';
  if (/(tutor|teach me|explain step by step|help me understand|lesson|quiz me)/i.test(prompt)) return 'TUTORING';
  if (/(json|xml|csv|schema|structured output|return only|format exactly)/i.test(prompt)) return 'INSTRUCTION_FOLLOWING';
  if (/(roleplay|pretend to be|act as|simulate)/i.test(prompt)) return 'ROLEPLAY';
  if (/(which model|best ai model|compare gpt|claude vs|what model should)/i.test(prompt)) return 'META';
  if (/(current|latest|today|news|recent|what happened|who won|price right now)/i.test(prompt)) return 'FACTUAL_QA';
  if (/(function call|tool call|api payload|webhook|json schema)/i.test(prompt)) return 'FUNCTION_CALLING';
  if (/(analy[sz]e|critique|evaluate|assess|trade-offs|pros and cons)/i.test(prompt)) return 'ANALYSIS';
  return 'CONVERSATION';
}

function detectComplexity(prompt: string, primaryTaskType: PrimaryTaskType, options: RoutePromptOptions): number {
  let score = 3;
  const text = prompt.toLowerCase();
  if (primaryTaskType === 'RESEARCH' || options.deepResearch) score += 3;
  if (primaryTaskType === 'REASONING') score += 3;
  if (primaryTaskType === 'CODING') score += 2;
  if (/(architecture|system design|large codebase|end-to-end|production-ready|all edge cases|optimi[sz]e|multi-step|phd|formal proof|competitive programming)/i.test(prompt)) score += 2;
  if (/(brief|quick|simple|one sentence|small|easy|basic)/i.test(text)) score -= 1;
  if ((options.attachments?.length || 0) > 0) score += 1;
  if (prompt.length > 800) score += 1;
  return clamp(score, 1, 10);
}

function detectContextWindow(prompt: string, options: RoutePromptOptions): ContextWindowNeeded {
  const length = prompt.length;
  if (/(entire codebase|large document|full transcript|100k|200k|massive|very long|thousands of lines|whole repo)/i.test(prompt)) return 'MASSIVE';
  if ((options.attachments?.length || 0) > 2 || /(long pdf|report|contract|paper|many files|book)/i.test(prompt) || length > 5000) return 'LARGE';
  if (length > 1000 || /(several examples|multiple files|multi-part|long context)/i.test(prompt)) return 'MEDIUM';
  return 'SMALL';
}

function detectLatency(prompt: string, options: RoutePromptOptions): LatencySensitivity {
  if (options.deepResearch) return 'BATCH';
  if (/(asap|urgent|quickly|fast|brief answer|real-time|immediately|right now)/i.test(prompt)) return 'REAL_TIME';
  if (/(take your time|thorough|deep dive|exhaustive|comprehensive)/i.test(prompt)) return 'BATCH';
  return 'STANDARD';
}

function detectCost(prompt: string, complexity: number): CostSensitivity {
  if (/(cheapest|budget|low cost|fast and cheap|economical|minimize cost)/i.test(prompt)) return 'MINIMIZE';
  if (/(best possible|highest quality|most accurate|perfect|no matter the cost|maximum quality)/i.test(prompt) || complexity >= 8) return 'MAXIMIZE_QUALITY';
  if (complexity <= 3) return 'MINIMIZE';
  return 'BALANCED';
}

function detectDomain(prompt: string): Domain {
  if (/(typescript|javascript|python|react|next\.js|sql|api|docker|kubernetes|devops|code|software|database)/i.test(prompt)) return 'TECHNICAL';
  if (/(math|physics|chemistry|biology|theorem|equation|integral|proof|statistics)/i.test(prompt)) return 'STEM';
  if (/(market|finance|strategy|sales|marketing|revenue|pricing|startup|business)/i.test(prompt)) return 'BUSINESS';
  if (/(contract|legal|law|regulation|compliance|policy|terms)/i.test(prompt)) return 'LEGAL';
  if (/(medical|health|symptom|diagnosis|treatment|clinical|mental health)/i.test(prompt)) return 'MEDICAL';
  if (/(essay|literature|history|philosophy|poem|story|humanities|criticism)/i.test(prompt)) return 'HUMANITIES';
  if (/(research paper|citation|scholar|thesis|abstract|peer review)/i.test(prompt)) return 'ACADEMIC';
  return 'GENERAL';
}

function detectOutputFormat(prompt: string, primaryTaskType: PrimaryTaskType): OutputFormat {
  if (primaryTaskType === 'CODING') return 'CODE';
  if (primaryTaskType === 'IMAGE_GENERATION') return 'VISUAL';
  if (/(json|xml|csv|table|bullet list|schema|yaml)/i.test(prompt)) return 'STRUCTURED';
  if (/(diagram|visual|chart)/i.test(prompt)) return 'VISUAL';
  if (/(with code and explanation|mixed format|table and analysis)/i.test(prompt)) return 'MIXED';
  return 'FREE_TEXT';
}

function detectSpecialRequirements(prompt: string, options: RoutePromptOptions, analysis: Omit<RouterAnalysis, 'special_requirements' | 'prompt_summary'>): SpecialRequirement[] {
  const requirements = new Set<SpecialRequirement>();
  const text = prompt.toLowerCase();
  const hasImage = (options.attachments || []).some(attachment => attachment.kind === 'image');
  const hasFile = (options.attachments || []).some(attachment => attachment.kind === 'file');

  if (/(latest|current|today|recent|news|what happened|right now|this week|2026|2025)/i.test(prompt) || options.deepResearch) requirements.add('NEEDS_CURRENT_INFO');
  if (/(run this code|execute|benchmark|simulate|plot|calculate from file|use python|sandbox)/i.test(prompt)) requirements.add('NEEDS_CODE_EXECUTION');
  if (hasFile || /(pdf|spreadsheet|csv|document|file attached|uploaded file)/i.test(text)) requirements.add('NEEDS_FILE_ANALYSIS');
  if (hasImage || /(attached image|image above|photo|screenshot)/i.test(text)) requirements.add('NEEDS_IMAGE_INPUT');
  if (/(generate an image|make a logo|draw|create a poster|illustration)/i.test(text)) requirements.add('NEEDS_IMAGE_OUTPUT');
  if (/(audio|video|transcript from video|podcast|recording)/i.test(text)) requirements.add('NEEDS_AUDIO_VIDEO');
  if (/(cite|citations|sources|references|footnotes)/i.test(text) || analysis.primary_task_type === 'RESEARCH') requirements.add('NEEDS_CITATIONS');
  if (/(medical|health|symptom|diagnosis|treatment|legal|law|mental health|self-harm|suicide|dangerous|harm)/i.test(text)) requirements.add('NEEDS_SAFETY_CARE');
  if (/(translate|spanish|french|german|japanese|korean|chinese|arabic|portuguese|italian)/i.test(text) || /[^\u0000-\u007F]/.test(prompt)) requirements.add('NEEDS_MULTILINGUAL');
  if (/(json|xml|csv|schema|return only valid|strict format|table with columns)/i.test(text)) requirements.add('NEEDS_STRUCTURED_OUTPUT');
  if (/(2000 words|3000 words|long essay|detailed report|comprehensive report|very detailed)/i.test(text)) requirements.add('NEEDS_LONG_OUTPUT');
  if (/(proof|exact|precise|rigorous|equation|integral|derivative|statistics|calculate|math)/i.test(text)) requirements.add('NEEDS_MATHEMATICAL_PRECISION');
  if (/(ignore previous|jailbreak|developer instructions|system prompt|reveal hidden prompt|bypass safety)/i.test(text)) requirements.add('PROMPT_INJECTION_RISK');

  return [...requirements];
}

function summarizePrompt(prompt: string): string {
  const clean = latestUserPrompt(prompt);
  if (clean.length <= 160) return clean;
  return `${clean.slice(0, 157)}...`;
}

function detectExplicitModelRequest(prompt: string): string | null {
  const patterns: Array<[RegExp, string]> = [
    [/\bgpt-?5\.4\b/i, 'openai/gpt-5.4'],
    [/\bclaude(?:\s|-)?opus\b|\bclaude 4 opus\b/i, 'anthropic/claude-opus-4'],
    [/\bclaude(?:\s|-)?sonnet\b|\bclaude 4 sonnet\b/i, 'anthropic/claude-sonnet-4'],
    [/\bgemini(?:\s|-)?2\.5 pro\b|\bgemini pro\b/i, 'google/gemini-2.5-pro'],
    [/\bgemini(?:\s|-)?2\.5 flash\b|\bgemini flash\b/i, 'google/gemini-2.5-flash'],
    [/\bo3\b/i, 'openai/o3'],
    [/\bo4(?:\s|-)?mini\b/i, 'openai/o4-mini'],
    [/\bdeepseek(?:\s|-)?r1\b/i, 'deepseek/deepseek-r1'],
    [/\bdeepseek(?:\s|-)?v3\b|\bdeepseek chat\b/i, 'deepseek/deepseek-chat'],
    [/\bmistral(?:\s|-)?large\b/i, 'mistralai/mistral-large-2'],
    [/\bgrok(?:\s|-)?3\b/i, 'x-ai/grok-3'],
  ];

  for (const [pattern, modelId] of patterns) {
    if (pattern.test(prompt)) return modelId;
  }

  return null;
}

function getCandidatePool(availableModels?: ModelInfo[]): CandidateModelProfile[] {
  const usableModels = (availableModels || []).filter(model => model.id !== ROUTER_MODEL_ID);
  if (usableModels.length > 0) {
    return usableModels.map(inferProfileFromModel);
  }

  return MODEL_PROFILES;
}

function scoreCost(profile: CandidateModelProfile, costSensitivity: CostSensitivity, complexity: number): number {
  if (costSensitivity === 'MAXIMIZE_QUALITY') return 88 - (profile.costTier - 1) * 6;
  if (costSensitivity === 'MINIMIZE') return 100 - (profile.costTier - 1) * 22;
  if (complexity <= 3) return 100 - (profile.costTier - 1) * 18;
  return 92 - Math.abs(profile.costTier - 3) * 10;
}

function scoreLatency(profile: CandidateModelProfile, latencySensitivity: LatencySensitivity): number {
  if (latencySensitivity === 'REAL_TIME') return 100 - (profile.latencyTier - 1) * 20;
  if (latencySensitivity === 'BATCH') return 92 - Math.abs(profile.latencyTier - 4) * 6;
  return 94 - Math.abs(profile.latencyTier - 3) * 10;
}

function scoreComplexity(profile: CandidateModelProfile, complexity: number): number {
  const targetCapability = complexity >= 9 ? 5 : complexity >= 7 ? 4 : complexity >= 5 ? 3 : complexity >= 3 ? 2 : 1;
  const modelCapability = profile.costTier >= 5 ? 5 : profile.costTier >= 4 ? 4 : profile.id.includes('/o4-mini') || profile.id.includes('deepseek-r1') ? 4 : profile.costTier >= 3 ? 3 : 2;
  const difference = Math.abs(targetCapability - modelCapability);
  return clamp(100 - difference * 18 - (complexity <= 3 && modelCapability >= 5 ? 20 : 0), 40, 100);
}

function scoreSpecialRequirements(profile: CandidateModelProfile, requirements: SpecialRequirement[]): number {
  let score = 84;
  if (requirements.includes('NEEDS_IMAGE_INPUT') && !profile.supportsVision) score -= 25;
  if (requirements.includes('NEEDS_AUDIO_VIDEO') && !profile.supportsAudioVideo) score -= 20;
  if (requirements.includes('PROMPT_INJECTION_RISK') && !['openai/gpt-5.4', 'anthropic/claude-opus-4', 'anthropic/claude-sonnet-4'].includes(profile.id)) score -= 15;
  if (requirements.includes('NEEDS_SAFETY_CARE') && !['openai/gpt-5.4', 'anthropic/claude-opus-4', 'anthropic/claude-sonnet-4'].includes(profile.id)) score -= 12;
  if (requirements.includes('NEEDS_MATHEMATICAL_PRECISION') && ['openai/o3', 'openai/o4-mini', 'deepseek/deepseek-r1'].includes(profile.id)) score += 10;
  if (requirements.includes('NEEDS_STRUCTURED_OUTPUT') && profile.id === 'openai/gpt-5.4') score += 8;
  return clamp(score, 35, 100);
}

function tiebreakProfiles(a: ScoredModel, b: ScoredModel): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.profile.latencyTier !== b.profile.latencyTier) return a.profile.latencyTier - b.profile.latencyTier;
  if (a.profile.costTier !== b.profile.costTier) return a.profile.costTier - b.profile.costTier;
  return `${a.profile.provider}/${a.profile.id}`.localeCompare(`${b.profile.provider}/${b.profile.id}`);
}

interface ScoredModel {
  profile: CandidateModelProfile;
  score: number;
}

function buildSystemAdditions(analysis: RouterAnalysis, selectedModelId: string): RouterInstructions {
  const additions: string[] = [];
  if (analysis.special_requirements.includes('NEEDS_STRUCTURED_OUTPUT')) additions.push('Return strictly valid structured output that matches the requested schema exactly.');
  if (analysis.special_requirements.includes('NEEDS_CITATIONS')) additions.push('Cite the supplied sources naturally and avoid unsupported claims.');
  if (analysis.primary_task_type === 'CODING') additions.push('Provide complete, production-sensible code with clear trade-offs and minimal hand-waving.');
  if (analysis.primary_task_type === 'REASONING') additions.push('Show a rigorous, correct solution and avoid leaps in logic.');
  if (analysis.primary_task_type === 'PROFESSIONAL_WRITING') additions.push('Maintain polish, clarity, and audience-appropriate tone.');
  if (analysis.primary_task_type === 'CREATIVE_WRITING') additions.push('Prioritize originality, voice consistency, and vivid detail.');
  if (analysis.special_requirements.includes('NEEDS_SAFETY_CARE')) additions.push('Be careful, measured, and explicit about uncertainty or risk boundaries.');

  const suggested_temperature = analysis.primary_task_type === 'CREATIVE_WRITING'
    ? 0.9
    : analysis.primary_task_type === 'CONVERSATION' || analysis.primary_task_type === 'ROLEPLAY'
      ? 0.7
      : analysis.special_requirements.includes('NEEDS_MATHEMATICAL_PRECISION') || analysis.primary_task_type === 'CODING'
        ? 0.2
        : 0.4;

  const suggested_max_tokens = analysis.special_requirements.includes('NEEDS_LONG_OUTPUT') || analysis.primary_task_type === 'RESEARCH'
    ? 4000
    : analysis.output_format === 'STRUCTURED'
      ? 1500
      : null;

  const suggested_reasoning_effort = selectedModelId === 'openai/o3'
    ? 'high'
    : selectedModelId === 'openai/o4-mini'
      ? 'medium'
      : null;

  return {
    suggested_system_prompt_additions: additions.join(' '),
    suggested_temperature,
    suggested_max_tokens,
    suggested_reasoning_effort,
  };
}

function toSelectedModel(modelId: string, availableModels?: ModelInfo[]): SelectedModel {
  const match = (availableModels || []).find(model => model.id === modelId);
  if (match) {
    return {
      id: match.id,
      name: match.name,
      provider: match.provider || match.id.split('/')[0],
      runtime: match.runtime || 'puter',
    };
  }

  const fallback = MODEL_PROFILES.find(profile => profile.id === modelId);
  return {
    id: modelId,
    name: fallback ? fallback.id.split('/').pop()?.replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()) || modelId : modelId,
    provider: fallback?.provider || modelId.split('/')[0] || 'Unknown',
    runtime: fallback?.runtime || 'puter',
  };
}

export function resolveModelRoute(options: RoutePromptOptions): RouterDecision {
  const prompt = latestUserPrompt(options.prompt);
  const primary_task_type = detectPrimaryTaskType(prompt);
  const complexity = detectComplexity(prompt, primary_task_type, options);
  const context_window_needed = detectContextWindow(prompt, options);
  const latency_sensitivity = detectLatency(prompt, options);
  const cost_sensitivity = detectCost(prompt, complexity);
  const domain = detectDomain(prompt);
  const output_format = detectOutputFormat(prompt, primary_task_type);
  const baseAnalysis = {
    primary_task_type,
    complexity,
    context_window_needed,
    latency_sensitivity,
    cost_sensitivity,
    domain,
    output_format,
  } satisfies Omit<RouterAnalysis, 'special_requirements' | 'prompt_summary'>;
  const special_requirements = detectSpecialRequirements(prompt, options, baseAnalysis);
  const analysis: RouterAnalysis = {
    ...baseAnalysis,
    special_requirements,
    prompt_summary: summarizePrompt(prompt),
  };

  const selected_tools = special_requirements.includes('NEEDS_CURRENT_INFO') ? ['web-search'] : [];
  const explicitModel = detectExplicitModelRequest(prompt);
  const candidatePool = getCandidatePool(options.availableModels);

  let forcedModelId: string | null = null;
  if (explicitModel) {
    forcedModelId = explicitModel;
  } else if (special_requirements.includes('PROMPT_INJECTION_RISK')) {
    forcedModelId = 'anthropic/claude-opus-4';
  } else if (special_requirements.includes('NEEDS_SAFETY_CARE')) {
    forcedModelId = analysis.complexity >= 7 ? 'anthropic/claude-opus-4' : 'openai/gpt-5.4';
  } else if (special_requirements.includes('NEEDS_AUDIO_VIDEO')) {
    forcedModelId = 'google/gemini-2.5-pro';
  } else if (context_window_needed === 'MASSIVE') {
    forcedModelId = latency_sensitivity === 'REAL_TIME' ? 'google/gemini-2.5-flash' : 'google/gemini-2.5-pro';
  } else if (special_requirements.includes('NEEDS_MATHEMATICAL_PRECISION') && complexity >= 7) {
    forcedModelId = cost_sensitivity === 'MINIMIZE' ? 'deepseek/deepseek-r1' : 'openai/o3';
  }

  const scored: ScoredModel[] = candidatePool.map(profile => {
    const taskFit = profile.taskFit[primary_task_type] ?? (primary_task_type === 'CONVERSATION' ? 74 : 70);
    const domainFit = profile.domainFit?.[domain] ?? 76;
    const costScore = scoreCost(profile, cost_sensitivity, complexity);
    const latencyScore = scoreLatency(profile, latency_sensitivity);
    const complexityScore = scoreComplexity(profile, complexity);
    const specialScore = scoreSpecialRequirements(profile, special_requirements);
    const score = forcedModelId && profile.id === forcedModelId
      ? 100
      : Math.round((taskFit * 0.30) + (complexityScore * 0.25) + (domainFit * 0.15) + (costScore * 0.15) + (latencyScore * 0.10) + (specialScore * 0.05));
    return { profile, score };
  }).sort(tiebreakProfiles);

  const winner = scored[0];
  const alternatives = scored.slice(1, 3);
  const selectedModelId = winner?.profile.id || 'openai/gpt-5.4';
  const resolvedModel = toSelectedModel(selectedModelId, options.availableModels);
  const model_instructions = buildSystemAdditions(analysis, selectedModelId);
  const confidence = clamp(
    forcedModelId
      ? 96
      : winner && scored[1]
        ? Math.round(clamp(82 + (winner.score - scored[1].score) * 2.5, 68, 97))
        : 84,
    50,
    100,
  );
  const confidence_label: ConfidenceLabel = confidence >= 90 ? 'HIGH' : confidence >= 70 ? 'MEDIUM' : 'LOW';
  const pipeline: RoutingPipelineStep[] = [
    ...selected_tools.map((tool, index) => ({
      step: index + 1,
      component: tool,
      purpose: tool === 'web-search' ? 'Retrieve fresh information before synthesis.' : 'Support the request with a website capability.',
    })),
    {
      step: selected_tools.length + 1,
      component: selectedModelId,
      purpose: selected_tools.length ? 'Synthesize the final answer using the routed model.' : 'Handle the user request directly.',
    },
  ];

  return {
    analysis,
    routing_decision: {
      selected_model: selectedModelId,
      selected_tools,
      pipeline,
      confidence,
      confidence_label,
    },
    reasoning: {
      why_selected: forcedModelId
        ? `${resolvedModel.name} was selected by a high-priority routing rule based on this prompt's constraints. It is the best match for the task profile, requested capabilities, and risk/cost trade-off in Arcus.`
        : `${resolvedModel.name} scored highest on task fit, complexity match, and overall capability for this prompt. The route balances speed, cost, and quality based on the request instead of defaulting to a single frontier model every time.`,
      why_not_alternatives: alternatives.length > 0
        ? `${alternatives[0].profile.id.split('/').pop()} and ${alternatives[1]?.profile.id.split('/').pop() || 'the next-best candidate'} were viable, but they lost on either task specialization, cost efficiency, or latency fit for this specific prompt.`
        : 'The available alternative models were a meaningfully weaker fit for the detected task requirements.',
      top_alternatives: alternatives.map(item => ({
        model: item.profile.id,
        score: item.score,
        note: item.profile.note,
      })),
    },
    model_instructions,
    resolvedModel,
  };
}
