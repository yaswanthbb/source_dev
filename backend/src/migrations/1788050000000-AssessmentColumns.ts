import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AssessmentColumns1788050000000 implements MigrationInterface {
  name = 'AssessmentColumns1788050000000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE mcq_questions
      ADD COLUMN bloom_level text, ADD COLUMN intended_difficulty text,
      ADD COLUMN correct_rationale text, ADD COLUMN lint_result jsonb,
      ADD COLUMN verification_result jsonb`);
    await runner.query(`ALTER TABLE mcq_options
      ADD COLUMN misconception text, ADD COLUMN distractor_rationale text`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE mcq_options DROP COLUMN distractor_rationale, DROP COLUMN misconception`,
    );
    await runner.query(`ALTER TABLE mcq_questions DROP COLUMN verification_result,
      DROP COLUMN lint_result, DROP COLUMN correct_rationale,
      DROP COLUMN intended_difficulty, DROP COLUMN bloom_level`);
  }
}
