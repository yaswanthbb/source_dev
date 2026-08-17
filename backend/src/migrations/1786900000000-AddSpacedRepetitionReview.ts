import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpacedRepetitionReview1786900000000 implements MigrationInterface {
  name = 'AddSpacedRepetitionReview1786900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."xp_events_source_type_enum" ADD VALUE IF NOT EXISTS 'review_correct';
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "review_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "mcq_question_id" uuid NOT NULL,
        "interval_days" integer NOT NULL DEFAULT 1,
        "correct_streak" integer NOT NULL DEFAULT 0,
        "due_date" date NOT NULL,
        "last_reviewed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_items" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_review_items_user_question" UNIQUE ("user_id", "mcq_question_id"),
        CONSTRAINT "FK_review_items_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_review_items_mcq_question" FOREIGN KEY ("mcq_question_id") REFERENCES "mcq_questions"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_review_items_user_due_date" ON "review_items" ("user_id", "due_date");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "review_items"`);
  }
}
