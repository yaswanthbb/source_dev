import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiJobRetryAndAck1787700000000 implements MigrationInterface {
  name = 'AddAiJobRetryAndAck1787700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ai_generation_jobs"
      ADD COLUMN IF NOT EXISTS "failed_count" integer NOT NULL DEFAULT 0;
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_generation_jobs"
      ADD COLUMN IF NOT EXISTS "acknowledged_at" TIMESTAMP WITH TIME ZONE;
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_generation_jobs"
      ADD COLUMN IF NOT EXISTS "retry_of_job_id" uuid;
    `);

    // Back-fill: existing terminal jobs are treated as already acknowledged so
    // they do NOT flood the new results banner on first deploy.
    await queryRunner.query(`
      UPDATE "ai_generation_jobs"
      SET "acknowledged_at" = now()
      WHERE "status" IN ('completed', 'failed') AND "acknowledged_at" IS NULL;
    `);

    // Back-fill failed_count from the persisted result summary where available.
    await queryRunner.query(`
      UPDATE "ai_generation_jobs"
      SET "failed_count" = COALESCE(("result_summary"->>'failedCount')::int, 0)
      WHERE "result_summary" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ai_generation_jobs" DROP COLUMN IF EXISTS "retry_of_job_id";
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_generation_jobs" DROP COLUMN IF EXISTS "acknowledged_at";
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_generation_jobs" DROP COLUMN IF EXISTS "failed_count";
    `);
  }
}
