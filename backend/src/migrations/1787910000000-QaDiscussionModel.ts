import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §12 QA discussion model: role-named columns become role-neutral, answers
 * gain verification state, and AI-answer privacy is enforced in the service
 * layer (no schema needed for that — `is_ai_answer` + the question's asker
 * are sufficient).
 */
export class QaDiscussionModel1787910000000 implements MigrationInterface {
  name = 'QaDiscussionModel1787910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "answers" RENAME COLUMN "instructor_id" TO "responder_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ADD COLUMN "is_verified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ADD COLUMN "verified_by_user_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ADD CONSTRAINT "FK_answers_verified_by" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ADD COLUMN "verified_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" RENAME COLUMN "student_id" TO "asker_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" RENAME COLUMN "asker_id" TO "student_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" DROP CONSTRAINT "FK_answers_verified_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" DROP COLUMN "verified_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" DROP COLUMN "verified_by_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" DROP COLUMN "is_verified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "answers" RENAME COLUMN "responder_id" TO "instructor_id"`,
    );
  }
}
