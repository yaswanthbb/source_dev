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

export interface ConceptOutline {
  title: string;
  objectives: string[];
  key_terms: ConceptKeyTerm[];
  builds_on: string[];
  recall_hooks: string[];
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
