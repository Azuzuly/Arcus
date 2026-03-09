/**
 * Cortex — The Smart Model Router
 * Analyzes user prompts and auto-routes to the optimal AI model.
 * Named after the brain's thinking layer.
 */

import { ModelInfo, SelectedModel } from './types';

/* ------------------------------------------------------------------ */
/*  CATEGORY DEFINITIONS                                               */
/* ------------------------------------------------------------------ */

export type PromptCategory =
  | 'coding'
  | 'creative'
  | 'math'
  | 'factual'
  | 'vision'
  | 'reasoning'
  | 'translation'
  | 'conversation'
  | 'research'
  | 'writing'
  | 'general';

interface CategoryRule {
  category: PromptCategory;
  patterns: RegExp[];
  keywords: string[];
  weight: number;
}

interface ModelRoute {
  category: PromptCategory;
  preferredModels: string[]; // model ID prefixes in priority order
  fallback: string;
}

/* ------------------------------------------------------------------ */
/*  CLASSIFICATION RULES                                               */
/* ------------------------------------------------------------------ */

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'coding',
    patterns: [
      /\b(code|coding|program|function|class|method|api|endpoint|bug|debug|refactor|regex|sql|query|algorithm|data structure)\b/i,
      /\b(javascript|typescript|python|rust|go|java|c\+\+|ruby|php|swift|kotlin|html|css|react|vue|angular|node|next\.?js|express|django|flask)\b/i,
      /\b(compile|runtime|syntax|error|exception|stack trace|lint|test|unit test|integration|deploy|docker|kubernetes|ci\/cd|git)\b/i,
      /```[\s\S]*```/,
      /\b(npm|pip|cargo|brew|yarn|pnpm)\b/i,
      /\b(write|create|build|implement|fix|optimize|refactor)\s+(a|the|this|my)?\s*(code|function|class|component|script|app|module|hook|api|server|backend|frontend)/i,
    ],
    keywords: ['code', 'function', 'bug', 'api', 'debug', 'script', 'component', 'typescript', 'python', 'implement', 'programming'],
    weight: 1.3,
  },
  {
    category: 'creative',
    patterns: [
      /\b(write|compose|create|draft|craft)\s+(a|an|the|me|my)?\s*(poem|story|song|lyrics|novel|screenplay|script|haiku|limerick|sonnet|essay|blog|article|narrative|fiction)/i,
      /\b(creative|imaginative|artistic|poetic|literary|expressive|vivid|evocative)\b/i,
      /\b(brainstorm|ideate|inspire|muse|creative writing)\b/i,
      /\b(character development|plot|worldbuilding|dialogue|setting|tone|voice|style)\b/i,
    ],
    keywords: ['poem', 'story', 'creative', 'write', 'compose', 'fiction', 'narrative', 'lyrics', 'brainstorm'],
    weight: 1.2,
  },
  {
    category: 'math',
    patterns: [
      /\b(calculate|compute|solve|equation|formula|integral|derivative|proof|theorem|algebra|calculus|statistics|probability|matrix|vector|eigenvalue)\b/i,
      /\b(math|mathematics|arithmetic|geometry|trigonometry|linear algebra|differential|numerical|combinatorics)\b/i,
      /[\d]+\s*[+\-*/^%]\s*[\d]+/,
      /\b(sum|product|factorial|logarithm|exponential|polynomial|quadratic|cubic)\b/i,
      /\b(optimize|maximize|minimize|converge|diverge|limit|infinity)\b/i,
    ],
    keywords: ['calculate', 'equation', 'math', 'solve', 'proof', 'formula', 'integral', 'derivative', 'statistics'],
    weight: 1.4,
  },
  {
    category: 'factual',
    patterns: [
      /^(what|who|when|where|how|which|why)\s+(is|are|was|were|did|does|do|can|will|would|should|has|have|had)\b/i,
      /\b(define|definition|meaning|explain simply|quick answer|tell me about|what does|how does)\b/i,
      /\b(fact|facts|true or false|is it true|correct that)\b/i,
    ],
    keywords: ['what is', 'who is', 'define', 'meaning', 'quick', 'simple', 'fact'],
    weight: 0.8,
  },
  {
    category: 'vision',
    patterns: [
      /\b(image|picture|photo|screenshot|diagram|chart|graph|visual|look at|see this|analyze this image|describe this|what('s| is) in this)\b/i,
      /\b(ocr|read text|extract text|handwriting|scan|identify|recognize)\b/i,
    ],
    keywords: ['image', 'picture', 'screenshot', 'diagram', 'photo', 'visual', 'describe this'],
    weight: 1.5,
  },
  {
    category: 'reasoning',
    patterns: [
      /\b(reason|reasoning|logic|logical|deduce|infer|conclude|analyze|critical thinking|argument|premise|fallacy)\b/i,
      /\b(step by step|chain of thought|think through|work through|break down|pros and cons|compare and contrast|evaluate|assess)\b/i,
      /\b(why does|how come|what if|suppose|hypothetical|thought experiment|paradox|dilemma)\b/i,
    ],
    keywords: ['reason', 'logic', 'analyze', 'step by step', 'think through', 'evaluate', 'compare'],
    weight: 1.3,
  },
  {
    category: 'translation',
    patterns: [
      /\b(translate|translation|interpret|convert)\s+(this|that|it|the following)?\s*(to|into|from|in)\s+(english|spanish|french|german|chinese|japanese|korean|arabic|portuguese|russian|italian|hindi|thai|vietnamese|indonesian|turkish|dutch|polish|swedish)/i,
      /\b(how do you say|what('s| is) .+ in (english|spanish|french|german|chinese|japanese|korean))\b/i,
    ],
    keywords: ['translate', 'translation', 'language', 'interpret'],
    weight: 1.1,
  },
  {
    category: 'research',
    patterns: [
      /\b(research|investigate|deep dive|comprehensive|thorough|exhaustive|literature review|survey|state of the art|systematic review)\b/i,
      /\b(compare .+ (with|to|vs|versus)|benchmark|evaluation|meta-analysis|case study)\b/i,
      /\b(latest|recent|current|up to date|state of|trends in|developments in)\b/i,
    ],
    keywords: ['research', 'investigate', 'comprehensive', 'deep dive', 'compare', 'trends', 'analysis'],
    weight: 1.1,
  },
  {
    category: 'writing',
    patterns: [
      /\b(write|draft|compose|edit|proofread|rewrite|rephrase|summarize|outline|format)\s+(a|an|the|my|this)?\s*(email|letter|report|memo|proposal|resume|cv|cover letter|documentation|readme|description|bio|introduction|conclusion|paragraph|abstract|summary)/i,
      /\b(grammar|spelling|punctuation|tone|clarity|concise|formal|informal|professional|academic)\b/i,
    ],
    keywords: ['write', 'draft', 'email', 'report', 'edit', 'proofread', 'summarize', 'document'],
    weight: 1.0,
  },
];

/* ------------------------------------------------------------------ */
/*  MODEL ROUTING TABLE                                                */
/* ------------------------------------------------------------------ */

const MODEL_ROUTES: ModelRoute[] = [
  {
    category: 'coding',
    preferredModels: [
      'anthropic/claude-sonnet',
      'anthropic/claude-opus',
      'deepseek/deepseek-chat',
      'qwen/qwen',
    ],
    fallback: 'anthropic/claude-sonnet-4-6',
  },
  {
    category: 'creative',
    preferredModels: [
      'anthropic/claude-opus',
      'anthropic/claude-sonnet',
      'openai/gpt-5',
    ],
    fallback: 'anthropic/claude-opus-4',
  },
  {
    category: 'math',
    preferredModels: [
      'deepseek/deepseek-r1',
      'openai/o3',
      'openai/o4-mini',
      'google/gemini',
    ],
    fallback: 'deepseek/deepseek-r1',
  },
  {
    category: 'factual',
    preferredModels: [
      'openai/gpt-5-nano',
      'openai/gpt-4o-mini',
      'google/gemini-3.1-flash',
      'anthropic/claude-haiku',
    ],
    fallback: 'openai/gpt-5-nano',
  },
  {
    category: 'vision',
    preferredModels: [
      'google/gemini-3.1-pro',
      'google/gemini-2.5-pro',
      'anthropic/claude-sonnet',
      'openai/gpt-5',
    ],
    fallback: 'google/gemini-3.1-pro-preview',
  },
  {
    category: 'reasoning',
    preferredModels: [
      'deepseek/deepseek-r1',
      'openai/o3',
      'anthropic/claude-opus',
      'google/gemini-2.5-pro',
    ],
    fallback: 'deepseek/deepseek-r1',
  },
  {
    category: 'translation',
    preferredModels: [
      'openai/gpt-5',
      'anthropic/claude-sonnet',
      'google/gemini',
    ],
    fallback: 'openai/gpt-5.4',
  },
  {
    category: 'research',
    preferredModels: [
      'anthropic/claude-opus',
      'openai/gpt-5.4-pro',
      'google/gemini-2.5-pro',
    ],
    fallback: 'anthropic/claude-opus-4',
  },
  {
    category: 'writing',
    preferredModels: [
      'anthropic/claude-sonnet',
      'openai/gpt-5',
      'anthropic/claude-opus',
    ],
    fallback: 'anthropic/claude-sonnet-4-6',
  },
  {
    category: 'conversation',
    preferredModels: [
      'anthropic/claude-sonnet',
      'openai/gpt-5',
      'meta-llama/llama-4',
    ],
    fallback: 'anthropic/claude-sonnet-4-6',
  },
  {
    category: 'general',
    preferredModels: [
      'anthropic/claude-sonnet',
      'openai/gpt-5',
      'google/gemini-2.5-pro',
    ],
    fallback: 'anthropic/claude-sonnet-4-6',
  },
];

/* ------------------------------------------------------------------ */
/*  CLASSIFICATION ENGINE                                              */
/* ------------------------------------------------------------------ */

function classifyPrompt(prompt: string, hasImages: boolean): PromptCategory {
  if (hasImages) return 'vision';

  const scores: Record<PromptCategory, number> = {
    coding: 0, creative: 0, math: 0, factual: 0, vision: 0,
    reasoning: 0, translation: 0, conversation: 0, research: 0,
    writing: 0, general: 0,
  };

  const lowerPrompt = prompt.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    // Pattern matching
    for (const pattern of rule.patterns) {
      if (pattern.test(prompt)) {
        scores[rule.category] += 2 * rule.weight;
      }
    }

    // Keyword matching
    for (const keyword of rule.keywords) {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        scores[rule.category] += 1 * rule.weight;
      }
    }
  }

  // Boost coding if backticks or code-like patterns are present
  if (/```|\bfunction\b|\bconst\b|\blet\b|\bvar\b|=>|\bimport\b|\bexport\b|\breturn\b/i.test(prompt)) {
    scores.coding += 3;
  }

  // Boost math if lots of numbers/operators
  if ((prompt.match(/[\d+\-*/=<>^]/g) || []).length > 5) {
    scores.math += 2;
  }

  // Find the highest scoring category
  let maxScore = 0;
  let bestCategory: PromptCategory = 'general';

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category as PromptCategory;
    }
  }

  // If no strong signal, default to general
  if (maxScore < 1.5) return 'general';

  return bestCategory;
}

/* ------------------------------------------------------------------ */
/*  MODEL RESOLVER                                                     */
/* ------------------------------------------------------------------ */

function findBestModel(
  category: PromptCategory,
  availableModels: ModelInfo[]
): SelectedModel | null {
  const route = MODEL_ROUTES.find(r => r.category === category);
  if (!route) return null;

  const modelIds = availableModels.map(m => m.id);

  // Try each preferred model prefix
  for (const prefix of route.preferredModels) {
    const match = availableModels.find(m => m.id.startsWith(prefix));
    if (match) {
      return {
        id: match.id,
        name: match.name,
        provider: (match as any).provider || match.id.split('/')[0] || 'Unknown',
        runtime: match.runtime,
      };
    }
  }

  // Try fallback exact match
  const fallbackModel = availableModels.find(m => m.id === route.fallback);
  if (fallbackModel) {
    return {
      id: fallbackModel.id,
      name: fallbackModel.name,
      provider: (fallbackModel as any).provider || fallbackModel.id.split('/')[0] || 'Unknown',
      runtime: fallbackModel.runtime,
    };
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  PUBLIC API                                                         */
/* ------------------------------------------------------------------ */

export const CORTEX_MODEL_ID = '__cortex_auto__';
export const CORTEX_MODEL: SelectedModel = {
  id: CORTEX_MODEL_ID,
  name: 'Cortex Auto',
  provider: 'Arcus',
  runtime: 'puter',
};

export interface CortexResult {
  category: PromptCategory;
  selectedModel: SelectedModel;
  confidence: number;
  reasoning: string;
}

/**
 * Analyze a prompt and route to the best model.
 * Returns the selected model + reasoning for display.
 */
export function routeModel(
  prompt: string,
  availableModels: ModelInfo[],
  options?: { hasImages?: boolean; currentModel?: SelectedModel }
): CortexResult {
  const hasImages = options?.hasImages || false;
  const category = classifyPrompt(prompt, hasImages);
  const selectedModel = findBestModel(category, availableModels);

  const categoryLabels: Record<PromptCategory, string> = {
    coding: 'Code & Development',
    creative: 'Creative Writing',
    math: 'Math & Logic',
    factual: 'Quick Facts',
    vision: 'Image Analysis',
    reasoning: 'Deep Reasoning',
    translation: 'Translation',
    conversation: 'Conversation',
    research: 'Research & Analysis',
    writing: 'Professional Writing',
    general: 'General Purpose',
  };

  if (!selectedModel) {
    // Fall back to current model or a sensible default
    const fallback = options?.currentModel || {
      id: 'anthropic/claude-sonnet-4-6',
      name: 'Claude Sonnet 4.6',
      provider: 'Anthropic',
      runtime: 'puter' as const,
    };

    return {
      category,
      selectedModel: fallback,
      confidence: 0.5,
      reasoning: `Detected ${categoryLabels[category]}. Using ${fallback.name} as fallback.`,
    };
  }

  return {
    category,
    selectedModel,
    confidence: 0.85,
    reasoning: `Detected ${categoryLabels[category]}. Routing to ${selectedModel.name} for optimal results.`,
  };
}

/**
 * Get context-aware companion card suggestions based on the detected category.
 */
export function getCompanionCards(category: PromptCategory): { label: string; icon: string; prompt: string }[] {
  const cards: Record<PromptCategory, { label: string; icon: string; prompt: string }[]> = {
    coding: [
      { label: 'Debug this', icon: '🐛', prompt: 'Help me debug this code and find the issue' },
      { label: 'Optimize', icon: '⚡', prompt: 'Optimize this code for better performance' },
      { label: 'Add tests', icon: '🧪', prompt: 'Write comprehensive unit tests for this' },
      { label: 'Explain logic', icon: '📖', prompt: 'Explain how this code works step by step' },
    ],
    creative: [
      { label: 'More vivid', icon: '🎨', prompt: 'Make this more vivid and descriptive' },
      { label: 'Different tone', icon: '🎭', prompt: 'Rewrite this in a different tone or style' },
      { label: 'Expand story', icon: '📚', prompt: 'Expand on this with more detail and depth' },
      { label: 'Add dialogue', icon: '💬', prompt: 'Add compelling dialogue to this piece' },
    ],
    math: [
      { label: 'Show work', icon: '📝', prompt: 'Show the detailed step-by-step solution' },
      { label: 'Visualize', icon: '📊', prompt: 'Create a visual representation of this' },
      { label: 'Real examples', icon: '🌍', prompt: 'Give real-world applications of this concept' },
      { label: 'Verify proof', icon: '✅', prompt: 'Verify and validate this mathematical proof' },
    ],
    factual: [
      { label: 'Go deeper', icon: '🔍', prompt: 'Explain this in more detail' },
      { label: 'Compare', icon: '⚖️', prompt: 'Compare this with alternatives' },
      { label: 'History', icon: '📜', prompt: 'What is the history behind this?' },
      { label: 'Latest info', icon: '📡', prompt: 'What are the latest developments?' },
    ],
    vision: [
      { label: 'Describe all', icon: '👁️', prompt: 'Describe everything you see in detail' },
      { label: 'Extract text', icon: '📋', prompt: 'Extract all text visible in this image' },
      { label: 'Identify', icon: '🔎', prompt: 'Identify all objects and elements' },
      { label: 'Explain chart', icon: '📈', prompt: 'Explain the data shown in this chart' },
    ],
    reasoning: [
      { label: 'Counter-argue', icon: '🤔', prompt: 'Present the strongest counter-arguments' },
      { label: 'Pros & cons', icon: '⚖️', prompt: 'List all pros and cons systematically' },
      { label: 'Edge cases', icon: '🔬', prompt: 'What edge cases should I consider?' },
      { label: 'Decision matrix', icon: '📊', prompt: 'Create a decision matrix for this' },
    ],
    translation: [
      { label: 'Formal version', icon: '👔', prompt: 'Give a more formal translation' },
      { label: 'Casual version', icon: '😊', prompt: 'Give a casual/colloquial translation' },
      { label: 'Cultural context', icon: '🌏', prompt: 'Explain cultural nuances in this translation' },
      { label: 'Pronunciation', icon: '🗣️', prompt: 'How do you pronounce this?' },
    ],
    conversation: [
      { label: 'Go deeper', icon: '🔍', prompt: 'Tell me more about this topic' },
      { label: 'Simplify', icon: '💡', prompt: 'Explain this more simply' },
      { label: 'Examples', icon: '📌', prompt: 'Give me concrete examples' },
      { label: 'Related topics', icon: '🔗', prompt: 'What related topics should I explore?' },
    ],
    research: [
      { label: 'Cite sources', icon: '📚', prompt: 'Include sources and citations' },
      { label: 'Methodology', icon: '🔬', prompt: 'Explain the research methodology' },
      { label: 'Key findings', icon: '💎', prompt: 'Summarize the key findings' },
      { label: 'Limitations', icon: '⚠️', prompt: 'What are the limitations and gaps?' },
    ],
    writing: [
      { label: 'More concise', icon: '✂️', prompt: 'Make this more concise and punchy' },
      { label: 'Professional', icon: '👔', prompt: 'Adjust to a more professional tone' },
      { label: 'Add structure', icon: '📋', prompt: 'Add better structure with headings and sections' },
      { label: 'Grammar check', icon: '✅', prompt: 'Check grammar and improve clarity' },
    ],
    general: [
      { label: 'Go deeper', icon: '🔍', prompt: 'Elaborate on this in more detail' },
      { label: 'Summarize', icon: '📝', prompt: 'Give me a concise summary' },
      { label: 'Examples', icon: '💡', prompt: 'Provide practical examples' },
      { label: 'Alternatives', icon: '🔄', prompt: 'What are the alternatives?' },
    ],
  };

  return cards[category] || cards.general;
}

/**
 * Quick check if a model is the Cortex auto-routing model.
 */
export function isCortexAuto(model: SelectedModel): boolean {
  return model.id === CORTEX_MODEL_ID;
}
