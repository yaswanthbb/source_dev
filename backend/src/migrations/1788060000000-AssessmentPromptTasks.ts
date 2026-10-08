import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AssessmentPromptTasks1788060000000 implements MigrationInterface {
  name = 'AssessmentPromptTasks1788060000000';
  async up(runner: QueryRunner): Promise<void> {
    for (const task of [
      'concept_misconceptions',
      'concept_mcq_draft',
      'concept_mcq_verify',
    ]) {
      await runner.query(
        `ALTER TYPE public.ai_prompt_versions_task_enum ADD VALUE '${task}'`,
      );
    }
  }
  async down(runner: QueryRunner): Promise<void> {
    // Rebuild the enum preserving all other labels; seed migration must be reverted first.
    const labels: Array<{ enumlabel: string }> =
      await runner.query(`SELECT enumlabel FROM pg_enum
      WHERE enumtypid = 'public.ai_prompt_versions_task_enum'::regtype ORDER BY enumsortorder`);
    const retained = labels.filter(
      (r) =>
        ![
          'concept_misconceptions',
          'concept_mcq_draft',
          'concept_mcq_verify',
        ].includes(r.enumlabel),
    );
    await runner.query(
      `ALTER TYPE public.ai_prompt_versions_task_enum RENAME TO ai_prompt_versions_task_enum_old`,
    );
    await runner.query(
      `CREATE TYPE public.ai_prompt_versions_task_enum AS ENUM (${retained.map((r) => `'${r.enumlabel.replace(/'/g, "''")}'`).join(',')})`,
    );
    await runner.query(
      `ALTER TABLE ai_prompt_versions ALTER COLUMN task TYPE public.ai_prompt_versions_task_enum USING task::text::public.ai_prompt_versions_task_enum`,
    );
    await runner.query(`DROP TYPE public.ai_prompt_versions_task_enum_old`);
  }
}
