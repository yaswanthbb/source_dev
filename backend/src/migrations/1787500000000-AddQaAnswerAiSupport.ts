import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQaAnswerAiSupport1787500000000 implements MigrationInterface {
  name = 'AddQaAnswerAiSupport1787500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."ai_generation_logs_generation_type_enum" ADD VALUE IF NOT EXISTS 'qa_answer';
    `);

    await queryRunner.query(`
      ALTER TABLE "public"."answers" ADD COLUMN IF NOT EXISTS "is_ai_answer" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."answers" DROP COLUMN IF EXISTS "is_ai_answer";
    `);
  }
}
