import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * §8 compiler stage contracts (pure: parse + shape-check, no DB).
 * Registry-dependent validation (builds_on existence, recall targets) lives
 * in the service, which has the repositories.
 */

export interface ConceptKeyTerm {
  term: string;
  definition: string;
}

export interface ConceptLessonShape {
  hook: string;
  intuition: string;
  definition: string;
  worked_example: string;
  faded_practice: string;
  retrieval_questions: string;
}

/**
 * §8 media: diagrams declared in the outline, referenced from content as
 * {{diagram:<id>}}. `kind` is an open vocabulary (flowchart, sequence,
 * mindmap, …) — the structural check matches known kinds strictly and
 * accepts any other recognized Mermaid header for the rest.
 */
export interface OutlineDiagram {
  id: string;
  caption: string;
  kind: string;
}

export interface ConceptOutline {
  title: string;
  objectives: string[];
  key_terms: ConceptKeyTerm[];
  builds_on: string[];
  recall_hooks: string[];
  diagrams: OutlineDiagram[];
  /** RAG placeholder: always null until the research phase fills it. */
  research_brief: null;
  lesson_shape: ConceptLessonShape;
  difficulty: string;
}

export interface CritiqueResult {
  blocking_issues: string[];
  suggestions: string[];
}

export interface FactcheckResult {
  consistent: boolean;
  outline_drift: string[];
  term_issues: string[];
}

const LESSON_SHAPE_KEYS: Array<keyof ConceptLessonShape> = [
  'hook',
  'intuition',
  'definition',
  'worked_example',
  'faded_practice',
  'retrieval_questions',
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];

function stageFailure(stage: string, detail: string): HttpException {
  return new HttpException(
    {
      statusCode: HttpStatus.BAD_GATEWAY,
      message: `Compiler ${stage} stage returned an unusable response: ${detail}`,
      error: 'Bad Gateway',
    },
    HttpStatus.BAD_GATEWAY,
  );
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((v) => typeof v === 'string')) return null;
  return value;
}

/** Strict outline parse: every field present with the right shape. */
export function parseOutline(raw: string): ConceptOutline {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw stageFailure('outline', 'response is not valid JSON.');
  }
  if (typeof parsed['title'] !== 'string' || !parsed['title']) {
    throw stageFailure('outline', 'missing string "title".');
  }
  const objectives = asStringArray(parsed['objectives']);
  if (!objectives || objectives.length === 0) {
    throw stageFailure(
      'outline',
      '"objectives" must be a non-empty string array.',
    );
  }
  if (!Array.isArray(parsed['key_terms'])) {
    throw stageFailure('outline', '"key_terms" must be an array.');
  }
  const keyTerms: ConceptKeyTerm[] = [];
  for (const entry of parsed['key_terms'] as unknown[]) {
    const term =
      typeof entry === 'object' && entry !== null
        ? (entry as Record<string, unknown>)['term']
        : undefined;
    const definition =
      typeof entry === 'object' && entry !== null
        ? (entry as Record<string, unknown>)['definition']
        : undefined;
    if (typeof term !== 'string' || !term.trim()) {
      throw stageFailure('outline', 'every key_term needs a non-empty "term".');
    }
    if (typeof definition !== 'string' || !definition.trim()) {
      throw stageFailure(
        'outline',
        `key_term "${term}" needs a non-empty "definition".`,
      );
    }
    keyTerms.push({ term: term.trim(), definition: definition.trim() });
  }
  const buildsOn = asStringArray(parsed['builds_on']);
  if (!buildsOn) {
    throw stageFailure('outline', '"builds_on" must be a string array.');
  }
  const recallHooks = asStringArray(parsed['recall_hooks']);
  if (!recallHooks) {
    throw stageFailure('outline', '"recall_hooks" must be a string array.');
  }
  if (!Array.isArray(parsed['diagrams'])) {
    throw stageFailure(
      'outline',
      '"diagrams" must be an array (possibly empty).',
    );
  }
  const diagrams: OutlineDiagram[] = [];
  const seenIds = new Set<string>();
  for (const entry of parsed['diagrams'] as unknown[]) {
    const record =
      typeof entry === 'object' && entry !== null
        ? (entry as Record<string, unknown>)
        : null;
    const id = record?.['id'];
    const caption = record?.['caption'];
    const kind = record?.['kind'];
    if (
      typeof id !== 'string' ||
      !id.trim() ||
      typeof caption !== 'string' ||
      !caption.trim() ||
      typeof kind !== 'string' ||
      !kind.trim()
    ) {
      throw stageFailure(
        'outline',
        'every diagram needs non-empty string "id", "caption", and "kind".',
      );
    }
    if (seenIds.has(id.trim())) {
      throw stageFailure('outline', `duplicate diagram id "${id}".`);
    }
    seenIds.add(id.trim());
    diagrams.push({
      id: id.trim(),
      caption: caption.trim(),
      kind: kind.trim(),
    });
  }
  const shape = parsed['lesson_shape'] as Record<string, unknown> | undefined;
  if (typeof shape !== 'object' || shape === null) {
    throw stageFailure('outline', '"lesson_shape" must be an object.');
  }
  for (const key of LESSON_SHAPE_KEYS) {
    if (typeof shape[key] !== 'string' || !shape[key].trim()) {
      throw stageFailure(
        'outline',
        `lesson_shape."${key}" must be a non-empty string.`,
      );
    }
  }
  if (
    typeof parsed['difficulty'] !== 'string' ||
    !DIFFICULTIES.includes(parsed['difficulty'])
  ) {
    throw stageFailure(
      'outline',
      `"difficulty" must be one of: ${DIFFICULTIES.join(', ')}.`,
    );
  }
  if (
    parsed['research_brief'] !== null &&
    parsed['research_brief'] !== undefined
  ) {
    throw stageFailure(
      'outline',
      '"research_brief" must be null (RAG fills it later).',
    );
  }
  return {
    title: parsed['title'],
    objectives,
    key_terms: keyTerms,
    builds_on: buildsOn,
    recall_hooks: recallHooks,
    diagrams,
    research_brief: null,
    lesson_shape: Object.fromEntries(
      LESSON_SHAPE_KEYS.map((k) => [k, (shape[k] as string).trim()]),
    ) as unknown as ConceptLessonShape,
    difficulty: parsed['difficulty'],
  };
}

/** Bloom-verb sniff over objectives: returns objectives lacking a Bloom verb (warnings, never failures). */
export function objectivesWithoutBloomVerb(objectives: string[]): string[] {
  const verbs = [
    'define',
    'describe',
    'explain',
    'summarize',
    'interpret',
    'apply',
    'demonstrate',
    'implement',
    'use',
    'analyze',
    'compare',
    'differentiate',
    'evaluate',
    'justify',
    'create',
    'design',
    'construct',
    'identify',
    'list',
    'recall',
    'discuss',
  ];
  return objectives.filter((objective) => {
    const firstWords = objective
      .toLowerCase()
      .split(/[^a-z]+/)
      .slice(0, 3);
    return !firstWords.some((word) => verbs.includes(word));
  });
}

export function parseCritique(raw: string): CritiqueResult {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw stageFailure('critique', 'response is not valid JSON.');
  }
  const blocking = asStringArray(parsed['blocking_issues']);
  const suggestions = asStringArray(parsed['suggestions']);
  if (!blocking || !suggestions) {
    throw stageFailure(
      'critique',
      '"blocking_issues" and "suggestions" must both be string arrays.',
    );
  }
  return { blocking_issues: blocking, suggestions };
}

export function parseFactcheck(raw: string): FactcheckResult {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw stageFailure('fact-check', 'response is not valid JSON.');
  }
  if (typeof parsed['consistent'] !== 'boolean') {
    throw stageFailure('fact-check', '"consistent" must be a boolean.');
  }
  const drift = asStringArray(parsed['outline_drift']);
  const termIssues = asStringArray(parsed['term_issues']);
  if (!drift || !termIssues) {
    throw stageFailure(
      'fact-check',
      '"outline_drift" and "term_issues" must both be string arrays.',
    );
  }
  return {
    consistent: parsed['consistent'],
    outline_drift: drift,
    term_issues: termIssues,
  };
}

export interface ResearchBrief {
  brief: string;
  key_points: string[];
}

/**
 * Strict private-brief parse. Malformed briefs degrade (caller records a
 * warning and continues without one) — research never fails a concept.
 */
export function parseResearchBrief(raw: string): ResearchBrief {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw stageFailure('research', 'response is not valid JSON.');
  }
  if (typeof parsed['brief'] !== 'string' || !parsed['brief'].trim()) {
    throw stageFailure('research', '"brief" must be a non-empty string.');
  }
  const keyPoints = asStringArray(parsed['key_points']);
  if (!keyPoints) {
    throw stageFailure('research', '"key_points" must be a string array.');
  }
  return {
    brief: parsed['brief'].trim(),
    key_points: keyPoints,
  };
}

export interface ParsedDiagram {
  /** Fence-stripped Mermaid source, ready to store and render. */
  mermaid: string;
}

/** Strict diagram parse: a JSON object carrying non-empty Mermaid source. */
export function parseDiagram(raw: string): ParsedDiagram {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw stageFailure('diagram', 'response is not valid JSON.');
  }
  if (typeof parsed['mermaid'] !== 'string' || !parsed['mermaid'].trim()) {
    throw stageFailure('diagram', '"mermaid" must be a non-empty string.');
  }
  const mermaid = parsed['mermaid']
    .replace(/^```(?:mermaid)?\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim();
  if (!mermaid) {
    throw stageFailure('diagram', 'mermaid source is empty after cleanup.');
  }
  return { mermaid };
}

const DIAGRAM_REFERENCE_PATTERN =
  /\{\{\s*diagram\s*:\s*([A-Za-z0-9_-]+)\s*\}\}/g;

/** Content references to stored diagrams (`{{diagram:<id>}}`), deduplicated. */
export function extractDiagramRefs(content: string): string[] {
  const refs: string[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  DIAGRAM_REFERENCE_PATTERN.lastIndex = 0;
  while ((match = DIAGRAM_REFERENCE_PATTERN.exec(content)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      refs.push(match[1]);
    }
  }
  return refs;
}

/** Strict headers for the headline kinds; everything else takes any known header. */
const STRICT_DIAGRAM_HEADERS: Record<string, RegExp> = {
  flowchart: /^(flowchart|graph)\s+(TD|TB|BT|RL|LR)\s*$/,
  sequence: /^sequenceDiagram\s*$/,
  mindmap: /^mindmap\s*$/,
};

const KNOWN_DIAGRAM_HEADERS: RegExp[] = [
  /^(flowchart|graph)\s+(TD|TB|BT|RL|LR)/,
  /^sequenceDiagram/,
  /^mindmap/,
  /^gantt/,
  /^pie(\s|$)/,
  /^erDiagram/,
  /^stateDiagram(-v2)?(\s|$)/,
  /^classDiagram/,
  /^journey/,
  /^gitGraph/,
  /^timeline/,
  /^requirementDiagram/,
  /^sankey-beta/,
  /^xychart-beta/,
  /^packet-beta/,
];

export interface MermaidCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Structural compile check — deterministic and dependency-free, so it runs
 * in unit tests and any CI. It catches the common LLM failure modes (wrong
 * header for the declared kind, fences left in, unbalanced delimiters,
 * single-line stubs), not full layout semantics. A headless render
 * (mermaid-cli/Kroki) can replace this seam when that infra exists; the
 * regen-once contract around it stays the same.
 */
export function validateMermaid(mermaid: string, kind: string): MermaidCheck {
  const text = mermaid.trim();
  if (!text) return { ok: false, reason: 'empty mermaid source' };
  if (/^```/.test(text) || /```\s*$/.test(text)) {
    return { ok: false, reason: 'markdown fences left in mermaid source' };
  }
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { ok: false, reason: 'diagram has fewer than 2 content lines' };
  }
  const strict = STRICT_DIAGRAM_HEADERS[kind.toLowerCase()];
  if (strict) {
    if (!strict.test(lines[0])) {
      return {
        ok: false,
        reason: `first line "${lines[0]}" is not a ${kind} header`,
      };
    }
  } else if (!KNOWN_DIAGRAM_HEADERS.some((re) => re.test(lines[0]))) {
    return {
      ok: false,
      reason: `unrecognized diagram header "${lines[0]}"`,
    };
  }
  // Delimiter balance, ignoring quoted label text (labels often contain
  // brackets, e.g. A["x (y)"]).
  const code = text.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");
  const pairs: Array<[string, string]> = [
    ['(', ')'],
    ['[', ']'],
    ['{', '}'],
  ];
  for (const [open, close] of pairs) {
    let depth = 0;
    for (const char of code) {
      if (char === open) depth += 1;
      if (char === close) depth -= 1;
      if (depth < 0) {
        return { ok: false, reason: `unbalanced "${open}${close}" delimiters` };
      }
    }
    if (depth !== 0) {
      return { ok: false, reason: `unbalanced "${open}${close}" delimiters` };
    }
  }
  return { ok: true };
}

/**
 * Thinking-leakage lint (live incident: a published lesson contained a full
 * "Here's a thinking process:" block plus echoed system-prompt guidelines).
 * One constant so the pattern list grows without code changes. Each entry
 * carries a short label used in warnings and the targeted revise prompt.
 */
export const THINKING_LEAK_PATTERNS: Array<{ label: string; pattern: RegExp }> =
  [
    { label: 'reasoning marker', pattern: /thinking process/i },
    { label: 'request analysis', pattern: /analyze (the|your|user) request/i },
    { label: 'first-person planning', pattern: /^i (need|will|should) /im },
    { label: 'planning note', pattern: /let me (plan|re-read|outline)/i },
    { label: 'echoed instruction block', pattern: /strictly forbidden/i },
    { label: 'echoed instruction block', pattern: /do not output preamble/i },
  ];

export interface LeakageLint {
  leaked: boolean;
  /** Labels of the matched patterns (deduplicated). */
  hits: string[];
}

export function lintLeakage(content: string): LeakageLint {
  const hits: string[] = [];
  for (const { label, pattern } of THINKING_LEAK_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content) && !hits.includes(label)) {
      hits.push(label);
    }
  }
  return { leaked: hits.length > 0, hits };
}
