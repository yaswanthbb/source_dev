import type { MigrationInterface, QueryRunner } from 'typeorm';

export class QaQuestionPrivacy1788130000000 implements MigrationInterface {
  name = 'QaQuestionPrivacy1788130000000';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE "questions"
      ADD COLUMN "target" varchar(16) NOT NULL DEFAULT 'discussion',
      ADD CONSTRAINT "CHK_questions_target" CHECK ("target" IN ('discussion', 'ai'))`);
    // Old versions did not store target. An AI answer is the only reliable
    // historical evidence; failed requests without an answer need manual audit.
    await runner.query(`UPDATE "questions" q SET "target" = 'ai'
      WHERE EXISTS (SELECT 1 FROM "answers" a
        WHERE a."question_id" = q."id" AND a."is_ai_answer" = true)`);
  }

  async down(runner: QueryRunner): Promise<void> {
    // Never silently remove the privacy boundary from saved private content.
    await runner.query(`DO $$ BEGIN
      LOCK TABLE "questions" IN ACCESS EXCLUSIVE MODE;
      IF EXISTS (SELECT 1 FROM "questions" WHERE "target" = 'ai') THEN
        RAISE EXCEPTION 'Cannot remove QA privacy while private questions exist';
      END IF;
      ALTER TABLE "questions" DROP CONSTRAINT "CHK_questions_target", DROP COLUMN "target";
    END; $$`);
  }
}
