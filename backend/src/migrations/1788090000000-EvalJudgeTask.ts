import type { MigrationInterface, QueryRunner } from 'typeorm';
export class EvalJudgeTask1788090000000 implements MigrationInterface {
  name = 'EvalJudgeTask1788090000000';
  async up(runner: QueryRunner) {
    await runner.query(
      `ALTER TYPE public.ai_prompt_versions_task_enum ADD VALUE 'eval_judge'`,
    );
    await runner.query(
      `ALTER TYPE public.ai_generation_logs_generation_type_enum ADD VALUE 'eval_judge'`,
    );
  }
  async down(runner: QueryRunner) {
    // Schema downgrade explicitly discards eval-only telemetry and candidate prompts
    // after eval tables/seeds are reverted. Other task versions and logs survive.
    await runner.query(
      `DELETE FROM ai_generation_logs WHERE generation_type::text='eval_judge'`,
    );
    await runner.query(
      `DELETE FROM ai_prompt_versions WHERE task::text='eval_judge'`,
    );
    for (const [type, table, column] of [
      ['ai_prompt_versions_task_enum', 'ai_prompt_versions', 'task'],
      [
        'ai_generation_logs_generation_type_enum',
        'ai_generation_logs',
        'generation_type',
      ],
    ]) {
      const labels: Array<{ enumlabel: string }> = await runner.query(
        `SELECT enumlabel FROM pg_enum WHERE enumtypid=$1::regtype ORDER BY enumsortorder`,
        [`public.${type}`],
      );
      const retained = labels
        .filter((r) => r.enumlabel !== 'eval_judge')
        .map((r) => `'${r.enumlabel.replace(/'/g, "''")}'`)
        .join(',');
      await runner.query(
        `ALTER TYPE public.${type} RENAME TO ${type}_eval_old`,
      );
      await runner.query(`CREATE TYPE public.${type} AS ENUM (${retained})`);
      await runner.query(
        `ALTER TABLE ${table} ALTER COLUMN ${column} TYPE public.${type} USING ${column}::text::public.${type}`,
      );
      await runner.query(`DROP TYPE public.${type}_eval_old`);
    }
  }
}
