import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import * as prompts from '../ai-generate/constants/prompts';
import * as assessment from '../ai-generate/constants/assessment-prompts';
import {
  EVAL_JUDGE_SYSTEM_PROMPT,
  EVAL_RUBRIC,
  RUBRIC_VERSION,
} from './eval-rubric';
import { canonical, hashValue } from './eval-hash';
import type { EvalArtifact } from './eval-checks';

export interface EvalGolden {
  id: string;
  task: AiGenerationType | 'concept_research' | 'concept_diagram';
  /** Historic research/media calls resolve through concept_content; observe that mapping without changing it. */
  registryTask?: AiGenerationType;
  sourceInput?: string;
  input?: Record<string, any>;
  format: 'prose' | 'structured' | 'mcq_set' | 'lesson';
  expected: unknown;
  claims?: Array<{
    label: string;
    alternatives: string[];
    forbidden?: string[];
  }>;
  forbidden?: string[];
  provenance: string;
}
export const STATIC_SYSTEMS: Record<AiGenerationType, string> = {
  roadmap_modules: prompts.ROADMAP_MODULES_SYSTEM_PROMPT,
  module_concepts: prompts.MODULE_CONCEPTS_SYSTEM_PROMPT,
  concept_content: prompts.CONCEPT_CONTENT_SYSTEM_PROMPT,
  concept_mcqs: prompts.CONCEPT_MCQ_SYSTEM_PROMPT,
  qa_answer: prompts.QA_ANSWER_SYSTEM_PROMPT,
  concept_outline: prompts.CONCEPT_OUTLINE_SYSTEM_PROMPT,
  concept_draft: prompts.CONCEPT_DRAFT_SYSTEM_PROMPT,
  concept_factcheck: prompts.CONCEPT_FACTCHECK_SYSTEM_PROMPT,
  concept_critique: prompts.CONCEPT_CRITIQUE_SYSTEM_PROMPT,
  concept_revise: prompts.CONCEPT_REVISE_SYSTEM_PROMPT,
  concept_misconceptions: assessment.MISCONCEPTIONS_PROMPT,
  concept_mcq_draft: assessment.ASSESSMENT_DRAFT_PROMPT,
  concept_mcq_verify: assessment.ASSESSMENT_VERIFY_PROMPT,
  eval_judge: EVAL_JUDGE_SYSTEM_PROMPT,
};
/** Same production builders, not copies of their rendered strings. Includes historic unversioned media inputs. */
export function renderGoldenInput(
  task: string,
  i: Record<string, any>,
): string {
  switch (task) {
    case 'roadmap_modules':
      return prompts.buildRoadmapModulesUserPrompt(
        i.roadmapTitle,
        i.roadmapDescription,
        i.existingModuleTitles ?? [],
        i.targetCount ?? 6,
      );
    case 'module_concepts':
      return prompts.buildModuleConceptsUserPrompt({
        ...i,
        siblingModules: i.siblingModules ?? [],
      } as any);
    case 'concept_content':
      return prompts.buildConceptContentUserPrompt(i as any);
    case 'concept_mcqs':
      return prompts.buildConceptMcqUserPrompt(i.title, i.content);
    case 'qa_answer':
      return prompts.buildQaAnswerUserPrompt(
        i.conceptTitle,
        i.conceptContent,
        i.questionBody,
      );
    case 'concept_outline':
      return prompts.buildOutlineUserPrompt(i as any);
    case 'concept_draft':
      return prompts.buildDraftUserPrompt(i as any);
    case 'concept_factcheck':
      return prompts.buildFactcheckUserPrompt(i as any);
    case 'concept_critique':
      return prompts.buildCritiqueUserPrompt(i as any);
    case 'concept_revise':
      return prompts.buildReviseUserPrompt(i as any);
    case 'concept_research':
      return prompts.buildResearchBriefUserPrompt(i as any);
    case 'concept_diagram':
      return prompts.buildDiagramUserPrompt(i as any);
    case 'concept_mcq_draft':
      return assessment.buildAssessmentUserPrompt(i as any, {
        action: 'draft',
        count: 5,
      });
    case 'concept_misconceptions':
      return JSON.stringify({ title: i.title, content: i.content });
    case 'concept_mcq_verify':
      return JSON.stringify(i);
    case 'eval_judge':
      return JSON.stringify({
        rubricVersion: RUBRIC_VERSION,
        rubric: EVAL_RUBRIC,
        artifacts: i.artifacts,
      });
    default:
      throw new Error(`Unknown golden task ${task}`);
  }
}
export function loadPromptContracts() {
  const dir = join(__dirname, '../ai-generate/golden');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.v1.jsonl'))
    .sort()
    .flatMap((file) =>
      readFileSync(join(dir, file), 'utf8')
        .split('\n')
        .filter((l) => l.trim())
        .map((line, index) => ({
          ...JSON.parse(line),
          id: `${file}:${index + 1}`,
        })),
    );
}
export function loadEvalGoldens(): EvalGolden[] {
  const dir = join(__dirname, 'golden');
  const contracts = new Map(loadPromptContracts().map((r) => [r.id, r]));
  const rows: EvalGolden[] = readdirSync(dir)
    .filter((f) => f.endsWith('.v1.jsonl'))
    .sort()
    .flatMap((file) =>
      readFileSync(join(dir, file), 'utf8')
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line)),
    );
  if (new Set(rows.map((r) => r.id)).size !== rows.length)
    throw new Error('Duplicate golden IDs');
  for (const row of rows) {
    if (
      (!Object.values(AiGenerationType).includes(
        row.task as AiGenerationType,
      ) &&
        !['concept_research', 'concept_diagram'].includes(row.task)) ||
      !row.id ||
      !row.provenance ||
      row.expected === undefined
    )
      throw new Error('Malformed eval golden');
    if (row.sourceInput) {
      const source = contracts.get(row.sourceInput);
      if (!source || source.task !== row.task)
        throw new Error(`Missing/mismatched golden input ${row.sourceInput}`);
      row.input = source.input;
    }
    if (!row.input) throw new Error(`Missing golden input ${row.id}`);
  }
  return rows;
}
export const goldenSetHash = (rows: EvalGolden[]) => hashValue(rows);
const normalized = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
/** Prose uses explicit semantic claim contracts with allowed phrasings and forbidden reversals.
 * It is an auditable proxy, not an assertion that token overlap proves entailment; anchored judges are a second layer. */
export function diffGolden(golden: EvalGolden, actual: unknown) {
  const differences: string[] = [];
  if (golden.format === 'prose' || golden.format === 'lesson') {
    if (typeof actual !== 'string' || !actual.trim())
      differences.push('Expected nonempty prose');
    const text = normalized(typeof actual === 'string' ? actual : '');
    for (const claim of golden.claims ?? []) {
      if (!claim.alternatives.some((s) => text.includes(normalized(s))))
        differences.push(`Missing semantic claim: ${claim.label}`);
      if (claim.forbidden?.some((s) => text.includes(normalized(s))))
        differences.push(`Contradicted semantic claim: ${claim.label}`);
    }
    for (const phrase of golden.forbidden ?? [])
      if (text.includes(normalized(phrase)))
        differences.push(`Forbidden prose: ${phrase}`);
    if (!golden.claims?.length)
      differences.push('No prose semantic anchors configured');
  } else if (canonical(actual) !== canonical(golden.expected)) {
    differences.push(
      `Exact structured mismatch\nexpected: ${canonical(golden.expected)}\nactual: ${canonical(actual)}`,
    );
  }
  return { passed: !differences.length, differences };
}
export function artifactFromOutput(
  golden: EvalGolden,
  raw: string,
): { output: unknown; artifact: EvalArtifact } {
  if (golden.format === 'prose' || golden.format === 'lesson')
    return {
      output: raw,
      artifact: {
        kind: golden.format === 'lesson' ? 'lesson' : 'prose',
        content: raw,
      },
    };
  const output: unknown = JSON.parse(raw);
  if (golden.format === 'mcq_set')
    return {
      output,
      artifact: {
        kind: 'mcq_set',
        mcqs: (output as { questions?: unknown })?.questions,
      },
    };
  return { output, artifact: { kind: 'structured', structured: output } };
}
