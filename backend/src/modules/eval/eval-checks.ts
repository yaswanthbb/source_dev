import {
  AssessmentItem,
  auditBloom,
  parseAssessment,
} from '../ai-generate/assessment';
import {
  lintLeakage,
  validateMermaid,
  extractDiagramRefs,
} from '../ai-generate/compiler-stages';
import { McqLintService } from '../ai-generate/mcq-lint.service';
import { sanitizeConceptLinks } from '../ai-generate/concept-links';

export interface EvalCheck {
  code: string;
  passed: boolean;
  detail: string;
}
export interface EvalArtifact {
  kind: 'lesson' | 'mcq_set' | 'compilation' | 'prose' | 'structured';
  content?: string;
  mcqs?: unknown;
  structured?: unknown;
  conceptRefs?: string[];
  termRefs?: string[];
  callbackRefs?: string[];
  diagrams?: Array<{ id: string; kind: string; mermaid: string }>;
  stages?: Array<{ stage: string; ok: boolean }>;
}
export interface EvalContext {
  concepts: Array<{ id: string; title: string }>;
  terms: string[];
  placements: string[];
  edges: Array<{ from: string; to: string; type: string }>;
  /** Recorded public-link resolution results, never live HTTP in Layer 1. */
  links: Record<string, boolean>;
  bloomTarget?: number;
}
export const EMPTY_EVAL_CONTEXT: EvalContext = {
  concepts: [],
  terms: [],
  placements: [],
  edges: [],
  links: {},
};
export const LESSON_SECTIONS = [
  ['hook', 'why', 'motivation'],
  ['intuition', 'mental model'],
  ['definition'],
  ['worked example', 'example'],
  ['faded practice', 'practice'],
  ['retrieval', 'recall', 'check your understanding'],
];
const normal = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
export function hasDependencyCycle(edges: EvalContext['edges']): boolean {
  const next = new Map<string, string[]>();
  for (const e of edges.filter((e) =>
    ['prerequisite', 'builds_on'].includes(e.type),
  ))
    next.set(e.from, [...(next.get(e.from) ?? []), e.to]);
  const visiting = new Set<string>(),
    visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    if ((next.get(id) ?? []).some(visit)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return [...next.keys()].some(visit);
}
function verification(q: AssessmentItem): number[] | undefined {
  const v = q.verificationResult;
  const evidence = v?.retainedDraftKey ? v.initial : v?.final;
  if (!v || v.agreed !== true || !evidence || typeof evidence !== 'object')
    return undefined;
  const row = evidence as Record<string, unknown>;
  const indexes = row.defensibleIndexes;
  if (
    !Array.isArray(indexes) ||
    indexes.length !== 1 ||
    !Number.isInteger(indexes[0]) ||
    indexes[0] !== q.options.findIndex((o) => o.isCorrect) ||
    row.answerIndex !== indexes[0] ||
    typeof row.reason !== 'string' ||
    !row.reason.trim()
  )
    return undefined;
  return indexes as number[];
}

/** Pure deterministic observations: no DB writes, model calls, HTTP, repairs or publication. */
export async function evaluateArtifact(
  artifact: EvalArtifact,
  context: EvalContext = EMPTY_EVAL_CONTEXT,
) {
  const checks: EvalCheck[] = [];
  const add = (code: string, passed: boolean, detail: string) =>
    checks.push({ code, passed, detail });
  const content = artifact.content ?? '';
  if (['lesson', 'compilation', 'prose'].includes(artifact.kind)) {
    const leak = lintLeakage(content);
    add(
      'NO_REASONING_LEAK',
      !leak.leaked && !!content.trim(),
      leak.hits.join(', ') ||
        'Nonempty artifact without known reasoning markers',
    );
    const targets = [...content.matchAll(/\[[^\]]+\]\(([^\s)]+)\)/g)].map(
      (m) => m[1],
    );
    const invalid = targets.filter(
      (url) =>
        !url.startsWith('#') &&
        !/^\/developer\/terminal\?concept=/.test(url) &&
        (!/^https?:\/\//.test(url) || context.links[url] !== true),
    );
    const sanitized = await sanitizeConceptLinks(
      content,
      async (url) => context.links[url] === true,
    );
    add(
      'LINKS_VALID',
      !invalid.length &&
        (!targets.some((u) => /^https?:/.test(u)) ||
          sanitized === content.trim()),
      invalid.length
        ? `Unresolved or unsafe links: ${invalid.join(', ')}`
        : 'Sanitizer agrees with recorded link resolution; no network performed',
    );
    const conceptRefs = [
      ...(artifact.conceptRefs ?? []),
      ...[...content.matchAll(/\{\{concept:([^}]+)\}\}/g)].map((m) => m[1]),
      ...targets
        .filter((u) => u.startsWith('/developer/terminal?concept='))
        .map(
          (u) =>
            new URL(u, 'https://eval.invalid').searchParams.get('concept') ??
            '',
        ),
    ];
    const termRefs = [
      ...(artifact.termRefs ?? []),
      ...[...content.matchAll(/\{\{term:([^}]+)\}\}/g)].map((m) => m[1]),
    ];
    const unknown = [
      ...conceptRefs.filter((id) => !context.concepts.some((c) => c.id === id)),
      ...termRefs.filter(
        (t) => !context.terms.some((known) => normal(known) === normal(t)),
      ),
      ...(artifact.callbackRefs ?? []).filter(
        (ref) =>
          ![...context.terms, ...context.concepts.map((c) => c.title)].some(
            (known) => normal(known) === normal(ref),
          ),
      ),
    ];
    add(
      'CALLBACKS_EXIST',
      !unknown.length,
      unknown.length
        ? `Unknown callbacks: ${unknown.join(', ')}`
        : 'Declared and explicit concept/term callbacks resolve in the recorded course context',
    );
  }
  if (['lesson', 'compilation'].includes(artifact.kind)) {
    const headings = [...content.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) =>
      normal(m[1]),
    );
    const missing = LESSON_SECTIONS.filter(
      (aliases) => !headings.some((h) => aliases.some((a) => h.includes(a))),
    );
    add(
      'LESSON_STRUCTURE',
      !missing.length,
      missing.length
        ? `Missing section families: ${missing.map((s) => s[0]).join(', ')}`
        : 'All six observable teaching-section families present',
    );
    const titles = context.concepts.map((c) => normal(c.title));
    add(
      'NO_DUPLICATE_CONCEPTS',
      new Set(context.placements).size === context.placements.length &&
        new Set(titles).size === titles.length,
      'Roadmap concept placements and normalized titles must be unique',
    );
    add(
      'NO_DEPENDENCY_CYCLES',
      !hasDependencyCycle(context.edges),
      'Combined prerequisite and BUILDS_ON graph must be acyclic',
    );
    const diagrams = artifact.diagrams ?? [];
    const broken = diagrams.filter(
      (d) => !validateMermaid(d.mermaid, d.kind).ok,
    );
    const missingRefs = extractDiagramRefs(content).filter(
      (id) => !diagrams.some((d) => d.id === id),
    );
    add(
      'MERMAID_VALID',
      !broken.length &&
        !missingRefs.length &&
        new Set(diagrams.map((d) => d.id)).size === diagrams.length,
      `Structural validation; broken diagrams: ${broken.map((d) => d.id).join(', ')}; unresolved references: ${missingRefs.join(', ')}`,
    );
  }
  if (artifact.kind === 'mcq_set' || artifact.kind === 'compilation') {
    const raw = artifact.mcqs;
    const parsed = parseAssessment(raw);
    add(
      'MCQ_SCHEMA',
      !!parsed,
      'Nonempty typed assessment with exactly one marked key and rationale-bearing distractors',
    );
    const items =
      parsed?.map((q, i) => ({
        ...q,
        verificationResult: (raw as AssessmentItem[])[i].verificationResult,
      })) ?? [];
    const lint = new McqLintService();
    const failures = items.flatMap((q, i) =>
      lint
        .lint(q, verification(q))
        .checks.filter((c) => !c.passed)
        .map((c) => `item ${i + 1}: ${c.code}`),
    );
    add(
      'NBME_LINT',
      !!items.length && !failures.length,
      failures.join('; ') || 'All structural NBME checks pass',
    );
    add(
      'DEFENSIBLE_KEY',
      !!items.length && items.every((q) => !!verification(q)),
      'Every key must agree with its stored blind-verification evidence; absent/conflicting evidence fails, never inferred from isCorrect',
    );
    const bloom = auditBloom(items, context.bloomTarget ?? 40);
    add(
      'BLOOM_TARGET',
      bloom.passed,
      `${bloom.higher}/${bloom.total} Apply-or-higher; target ${bloom.target}%`,
    );
    const optionCount = items[0]?.options.length ?? 0;
    const positions = Array.from(
      { length: optionCount },
      (_, i) =>
        items.filter((q) => q.options.findIndex((o) => o.isCorrect) === i)
          .length,
    );
    const balanced =
      !!items.length &&
      items.every((q) => q.options.length === optionCount) &&
      Math.max(...positions) - Math.min(...positions) <= 1;
    add(
      'KEY_POSITIONS_BALANCED',
      balanced,
      `Correct-position counts: [${positions.join(', ')}]; max-min must be <=1`,
    );
  }
  if (artifact.kind === 'compilation') {
    const required = [
      'outline',
      'draft',
      'fact-check',
      'critique-revise',
      'validate',
      'publish',
    ];
    const stages = artifact.stages ?? [];
    add(
      'COMPILATION_STAGES',
      required.every((s) =>
        stages.some((entry) => entry.stage === s && entry.ok),
      ) && stages.every((s) => s.ok),
      'Required successful compiler stages and no recorded failed stages',
    );
  }
  if (artifact.kind === 'structured')
    add(
      'STRUCTURED_PRESENT',
      artifact.structured !== undefined && artifact.structured !== null,
      'Structured output is present; exact golden schema/diff evaluated separately',
    );
  return { passed: checks.length > 0 && checks.every((c) => c.passed), checks };
}
