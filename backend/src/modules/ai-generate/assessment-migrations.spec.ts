import { QueryRunner } from 'typeorm';
import { AssessmentColumns1788050000000 } from '../../migrations/1788050000000-AssessmentColumns';
import { AssessmentPromptTasks1788060000000 } from '../../migrations/1788060000000-AssessmentPromptTasks';
import { AssessmentPromptSeeds1788070000000 } from '../../migrations/1788070000000-AssessmentPromptSeeds';
import {
  ASSESSMENT_DRAFT_PROMPT,
  ASSESSMENT_VERIFY_PROMPT,
  MISCONCEPTIONS_PROMPT,
} from './constants/assessment-prompts';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { auditBloom, parseAssessment } from './assessment';
import { McqLintService } from './mcq-lint.service';

describe('assessment migration contracts (SQL review, not live PostgreSQL)', () => {
  test('new golden fixture locks the typed draft, lint and Bloom contracts', () => {
    const golden = JSON.parse(
      readFileSync(
        join(__dirname, 'golden/concept_mcq_draft.v1.jsonl'),
        'utf8',
      ),
    );
    const questions = parseAssessment(golden.output.questions)!;
    expect(questions).not.toBeNull();
    expect(new McqLintService().lint(questions[0], [0]).passed).toBe(
      golden.expectLintPassed,
    );
    expect(auditBloom(questions).passed).toBe(golden.expectBloomPassed);
  });
  test('every added column is nullable and has a full down', async () => {
    const query = jest.fn();
    const runner = { query } as unknown as QueryRunner;
    const migration = new AssessmentColumns1788050000000();
    await migration.up(runner);
    const up = query.mock.calls.map(([sql]) => sql).join(' ');
    query.mockClear();
    await migration.down(runner);
    const down = query.mock.calls.map(([sql]) => sql).join(' ');
    for (const col of [
      'bloom_level',
      'intended_difficulty',
      'correct_rationale',
      'lint_result',
      'verification_result',
      'misconception',
      'distractor_rationale',
    ]) {
      expect(up).toContain(`ADD COLUMN ${col}`);
      expect(down).toContain(`DROP COLUMN ${col}`);
    }
    expect(up).not.toMatch(/NOT NULL|UPDATE/);
  });
  test('immutable seed snapshots match runtime prompts and rollback is scoped', async () => {
    const query = jest.fn();
    const runner = { query } as unknown as QueryRunner;
    const migration = new AssessmentPromptSeeds1788070000000();
    await migration.up(runner);
    expect(query.mock.calls.map((c) => c[1][1])).toEqual([
      MISCONCEPTIONS_PROMPT,
      ASSESSMENT_DRAFT_PROMPT,
      ASSESSMENT_VERIFY_PROMPT,
    ]);
    query.mockClear();
    await migration.down(runner);
    expect(query.mock.calls[0][0]).toMatch(/version = '1.0.0'/);
  });
  test('task down rebuilds enum preserving existing labels and removes only new labels', async () => {
    const query = jest.fn(async (sql: string) =>
      sql.startsWith('SELECT')
        ? [
            'concept_mcqs',
            'concept_draft',
            'concept_misconceptions',
            'concept_mcq_draft',
            'concept_mcq_verify',
          ].map((enumlabel) => ({ enumlabel }))
        : [],
    );
    await new AssessmentPromptTasks1788060000000().down({
      query,
    } as unknown as QueryRunner);
    expect(query.mock.calls.map(([sql]) => sql).join(' ')).toContain(
      "AS ENUM ('concept_mcqs','concept_draft')",
    );
    expect(query.mock.calls.map(([sql]) => sql).join(' ')).toMatch(
      /USING task::text::public.ai_prompt_versions_task_enum/,
    );
    expect(query.mock.calls.at(-1)?.[0]).toContain(
      'DROP TYPE public.ai_prompt_versions_task_enum_old',
    );
  });
});
