/**
 * Cortex — The thinking layer of Arcus.
 *
 * Re-exports the core router under the "Cortex" brand and adds
 * context-aware companion-card hint generation so the chat UI can
 * show smart pills that match the *intent* of a query rather than
 * displaying generic "Step-by-step reasoning" for everything.
 */

export {
  ROUTER_MODEL_ID as CORTEX_MODEL_ID,
  ROUTER_MODEL_INFO as CORTEX_MODEL_INFO,
  ROUTER_SELECTED_MODEL as CORTEX_SELECTED_MODEL,
  isRouterModelId as isCortexModelId,
  resolveModelRoute as cortexRoute,
} from './modelRouter';

/* ── Context-aware companion card hints ── */

interface CompanionHint {
  label: string;
  icon: string;
}

type QueryCategory =
  | 'math'
  | 'coding'
  | 'creative'
  | 'science'
  | 'geography'
  | 'history'
  | 'language'
  | 'business'
  | 'health'
  | 'general';

const HINT_MAP: Record<QueryCategory, CompanionHint[]> = {
  math: [
    { label: 'Step-by-step solution', icon: '📐' },
    { label: 'LaTeX equations', icon: '∑' },
    { label: 'Worked examples', icon: '✏️' },
    { label: 'Visual diagrams', icon: '📊' },
  ],
  coding: [
    { label: 'Complete code', icon: '💻' },
    { label: 'Error explanations', icon: '🐛' },
    { label: 'Best practices', icon: '✅' },
    { label: 'Example usage', icon: '▶️' },
  ],
  creative: [
    { label: 'Original ideas', icon: '💡' },
    { label: 'Tone variations', icon: '🎭' },
    { label: 'Extended draft', icon: '📝' },
    { label: 'Style examples', icon: '🎨' },
  ],
  science: [
    { label: 'Key concepts', icon: '🔬' },
    { label: 'Real-world examples', icon: '🌍' },
    { label: 'Visual diagrams', icon: '📈' },
    { label: 'Further reading', icon: '📚' },
  ],
  geography: [
    { label: 'Visual diagrams', icon: '🗺️' },
    { label: 'Key concepts', icon: '📍' },
    { label: 'Real-world examples', icon: '🌎' },
    { label: 'Climate & culture', icon: '☀️' },
  ],
  history: [
    { label: 'Timeline view', icon: '📅' },
    { label: 'Key figures', icon: '👤' },
    { label: 'Cause & effect', icon: '🔗' },
    { label: 'Primary sources', icon: '📜' },
  ],
  language: [
    { label: 'Grammar breakdown', icon: '📖' },
    { label: 'Example sentences', icon: '💬' },
    { label: 'Pronunciation tips', icon: '🗣️' },
    { label: 'Cultural context', icon: '🌏' },
  ],
  business: [
    { label: 'Action items', icon: '✅' },
    { label: 'SWOT analysis', icon: '📊' },
    { label: 'Market context', icon: '📈' },
    { label: 'Risk assessment', icon: '⚠️' },
  ],
  health: [
    { label: 'Key information', icon: '🏥' },
    { label: 'When to seek help', icon: '🩺' },
    { label: 'Lifestyle tips', icon: '🥗' },
    { label: 'Reliable sources', icon: '📋' },
  ],
  general: [
    { label: 'Clear explanation', icon: '💡' },
    { label: 'Key takeaways', icon: '📌' },
    { label: 'Examples', icon: '📝' },
    { label: 'Further context', icon: '🔍' },
  ],
};

function detectCategory(prompt: string): QueryCategory {
  const q = prompt.toLowerCase();

  if (/(solve|simplify|equation|integral|derive|derivative|fraction|probability|algebra|geometry|calculus|trigonometr|logarithm|math|\d\s*[+\-*/=^]\s*\d)/i.test(q)) return 'math';
  if (/(write|debug|fix|refactor|code|function|class|typescript|javascript|python|react|sql|api|regex|html|css|rust|golang|java\b|kotlin|swift)/i.test(q)) return 'coding';
  if (/(story|poem|lyrics|screenplay|novel|fiction|creative|worldbuild|character|fantasy|haiku|essay.*(write|draft))/i.test(q)) return 'creative';
  if (/(physics|chemistry|biolog|quantum|atom|molecule|cell|evolution|genome|relativity|thermodynamic|neuroscience)/i.test(q)) return 'science';
  if (/(geography|continent|country|capital|river|mountain|ocean|climate|population|longitude|latitude|explain.*geometry)/i.test(q)) return 'geography';
  if (/(history|century|war|empire|revolution|ancient|medieval|colonial|dynasty|civilization)/i.test(q)) return 'history';
  if (/(translate|grammar|conjugat|vocabulary|language|spanish|french|german|japanese|chinese|korean|arabic)/i.test(q)) return 'language';
  if (/(business|startup|revenue|market|strategy|roi|investor|pitch|product.*launch|branding|kpi)/i.test(q)) return 'business';
  if (/(health|symptom|diet|exercise|nutrition|mental health|medical|vitamin|disease|treatment|wellness)/i.test(q)) return 'health';

  return 'general';
}

/** Return 3 context-aware companion card hints for a given prompt. */
export function getCompanionHints(prompt: string): CompanionHint[] {
  const category = detectCategory(prompt);
  return HINT_MAP[category].slice(0, 3);
}

/** Return the overall category label for display. */
export function getPromptCategory(prompt: string): string {
  const labels: Record<QueryCategory, string> = {
    math: 'Math & Logic',
    coding: 'Code & Dev',
    creative: 'Creative Writing',
    science: 'Science',
    geography: 'Geography',
    history: 'History',
    language: 'Language',
    business: 'Business',
    health: 'Health & Wellness',
    general: 'General',
  };
  return labels[detectCategory(prompt)];
}
