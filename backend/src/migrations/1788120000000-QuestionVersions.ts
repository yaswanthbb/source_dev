import type { MigrationInterface, QueryRunner } from 'typeorm';
export class QuestionVersions1788120000000 implements MigrationInterface {
  name = 'QuestionVersions1788120000000';
  async up(runner: QueryRunner) {
    await runner.query(`ALTER TABLE mcq_questions ADD COLUMN predecessor_id uuid,
      ADD COLUMN version_number integer NOT NULL DEFAULT 1 CHECK(version_number > 0), ADD COLUMN retired_at timestamptz,
      ADD COLUMN generation_provenance jsonb,
      ADD CONSTRAINT FK_mcq_predecessor FOREIGN KEY(predecessor_id) REFERENCES mcq_questions(id) ON DELETE RESTRICT`);
    await runner.query(
      `CREATE UNIQUE INDEX UQ_mcq_successor ON mcq_questions(predecessor_id) WHERE predecessor_id IS NOT NULL`,
    );
  }
  async down(runner: QueryRunner) {
    // Accepted version/provenance metadata loss; NEVER delete questions, options or attempts.
    await runner.query(`DROP INDEX UQ_mcq_successor`);
    await runner.query(`ALTER TABLE mcq_questions DROP CONSTRAINT FK_mcq_predecessor,
      DROP COLUMN generation_provenance, DROP COLUMN retired_at, DROP COLUMN version_number, DROP COLUMN predecessor_id`);
  }
}
