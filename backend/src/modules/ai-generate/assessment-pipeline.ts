import {
  AssessmentItem,
  auditBloom,
  BLOOM_LEVELS,
  parseAssessment,
} from './assessment';
import { McqLintService } from './mcq-lint.service';
import { buildAssessmentUserPrompt } from './constants/assessment-prompts';

export interface AssessmentTrace {
  stages: Array<Record<string, unknown>>;
  warnings: string[];
}
export interface AssessmentDependencies {
  draft: (
    request: string,
    internal: boolean,
    attempt: number,
  ) => Promise<string>;
  verify: (request: string) => Promise<string>;
  parse: (raw: string) => unknown;
  isTerminalError: (error: unknown) => boolean;
}
interface Verification {
  answerIndex: number | null;
  defensibleIndexes: number[];
  reason: string;
  nullSetCorrect: boolean;
}

/** Shared single/batch pipeline; transport, registry, quota and persistence stay at the caller. */
export class AssessmentPipeline {
  private readonly lint = new McqLintService();
  async run(
    input: {
      title: string;
      content?: string;
      misconceptions: string[];
      target: number;
    },
    deps: AssessmentDependencies,
    trace: AssessmentTrace,
  ): Promise<AssessmentItem[]> {
    const note = (stage: string, ok: boolean, detail: unknown) =>
      trace.stages.push({ stage, ok, detail });
    const context = {
      title: input.title,
      content: input.content ?? '',
      misconceptions: input.misconceptions,
      targetPercent: input.target,
    };
    const draft = async (
      request: unknown,
      internal: boolean,
      count?: number,
    ) => {
      for (let attempt = 1; attempt <= (internal ? 1 : 2); attempt++) {
        try {
          const raw = await deps.draft(
            buildAssessmentUserPrompt(context, request),
            internal || attempt > 1,
            attempt,
          );
          const items = parseAssessment(deps.parse(raw));
          if (items && (!count || items.length === count)) return items;
          trace.warnings.push(`ASSESSMENT_DRAFT_INVALID: attempt ${attempt}`);
        } catch (error) {
          if (deps.isTerminalError(error)) throw error;
          if (attempt === (internal ? 1 : 2)) throw error;
          trace.warnings.push('ASSESSMENT_DRAFT_RETRY');
        }
      }
      return null;
    };
    const verify = async (q: AssessmentItem): Promise<Verification | null> => {
      try {
        // Deliberately omit the key, Bloom label and ALL rationales/metadata.
        const raw = await deps.verify(
          JSON.stringify({
            title: input.title,
            content: input.content ?? '',
            questionText: q.questionText,
            options: q.options.map((o) => o.optionText),
          }),
        );
        const v = JSON.parse(raw) as Verification;
        const validIndex = (n: unknown) =>
          Number.isInteger(n) && Number(n) >= 0 && Number(n) < q.options.length;
        if (
          !v ||
          (v.answerIndex !== null && !validIndex(v.answerIndex)) ||
          !Array.isArray(v.defensibleIndexes) ||
          !v.defensibleIndexes.every(validIndex) ||
          new Set(v.defensibleIndexes).size !== v.defensibleIndexes.length ||
          typeof v.reason !== 'string' ||
          typeof v.nullSetCorrect !== 'boolean' ||
          (v.answerIndex !== null &&
            !v.defensibleIndexes.includes(v.answerIndex))
        )
          throw new Error('Invalid verifier JSON');
        return v;
      } catch {
        trace.warnings.push('ANSWER_VERIFICATION_UNAVAILABLE');
        return null;
      }
    };
    const agrees = (q: AssessmentItem, v: Verification | null) =>
      !!v &&
      v.answerIndex === q.options.findIndex((o) => o.isCorrect) &&
      v.defensibleIndexes.length === 1;
    const check = async (original: AssessmentItem): Promise<AssessmentItem> => {
      let q = original;
      const first = await verify(q);
      let final = first;
      let repairAttempted = false;
      if (first && !agrees(q, first)) {
        repairAttempted = true;
        try {
          const repaired = await draft(
            {
              action: 'repair answer conflict',
              count: 1,
              item: q,
              verification: first,
            },
            true,
            1,
          );
          if (repaired) {
            final = await verify(repaired[0]);
            if (agrees(repaired[0], final)) q = repaired[0];
          }
        } catch {
          trace.warnings.push('ANSWER_REPAIR_FAILED');
        }
        if (q === original)
          trace.warnings.push(
            'ANSWER_KEY_CONFLICT: keeping original draft key after one repair attempt',
          );
      }
      // Retained original keys are evaluated against their OWN verification, not a rejected repair's.
      const evidence = q === original ? first : final;
      q.verificationResult = {
        agreed: agrees(q, evidence),
        initial: first,
        final,
        repairAttempted,
        retainedDraftKey: q === original && repairAttempted,
      };
      if (evidence) q.nullSetCorrect = evidence.nullSetCorrect;
      else q.nullSetCorrect = false;
      q.lintResult = this.lint.lint(q, evidence?.defensibleIndexes);
      if (
        input.misconceptions.length &&
        q.options.some(
          (o) =>
            !o.isCorrect &&
            !input.misconceptions.includes(o.misconception ?? ''),
        )
      ) {
        q.lintResult.passed = false;
        (q.lintResult.checks as Array<{ code: string; passed: boolean }>).push({
          code: 'DISTRACTOR_MAPPING',
          passed: false,
        });
      }
      note('answer-verify', agrees(q, evidence), q.verificationResult);
      note('lint', q.lintResult.passed === true, q.lintResult);
      if (!q.lintResult.passed)
        trace.warnings.push(`MCQ_LINT_FAILED: ${q.questionText}`);
      return q;
    };
    let questions = await draft({ action: 'draft', count: 5 }, false);
    if (!questions)
      throw new Error(
        'Model returned no valid assessment questions after 2 attempts.',
      );
    note('draft', true, { count: questions.length });
    questions = await Promise.all(questions.map(check));
    const before = auditBloom(questions, input.target);
    note('bloom-audit', before.passed, before);
    if (!before.passed) {
      const required = Math.max(
        0,
        Math.ceil((questions.length * input.target) / 100) - before.higher,
      );
      const weakest = questions
        .map((q, index) => ({ q, index }))
        .filter(({ q }) => BLOOM_LEVELS.indexOf(q.bloomLevel) < 2)
        .sort(
          (a, b) =>
            BLOOM_LEVELS.indexOf(a.q.bloomLevel) -
            BLOOM_LEVELS.indexOf(b.q.bloomLevel),
        )
        .slice(0, required);
      try {
        const replacements = await draft(
          {
            action:
              'replace weakest items with genuine Apply-or-higher scenarios',
            count: weakest.length,
            items: weakest.map(({ q }) => q),
          },
          true,
          weakest.length,
        );
        if (replacements)
          for (let i = 0; i < replacements.length; i++)
            questions[weakest[i].index] = await check(replacements[i]);
        note('bloom-revise', !!replacements, {
          replaced: replacements?.length ?? 0,
        });
      } catch {
        trace.warnings.push('BLOOM_REVISION_FAILED');
        note('bloom-revise', false, null);
      }
      const after = auditBloom(questions, input.target);
      note('bloom-audit-final', after.passed, after);
      if (!after.passed)
        trace.warnings.push(
          'BLOOM_BELOW_TARGET: published after one revision attempt',
        );
    }
    return questions;
  }
}
