import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiGenerationJobs1787600000000 implements MigrationInterface {
  name = 'AddAiGenerationJobs1787600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."ai_generation_jobs_job_type_enum" AS ENUM(
          'roadmap_modules',
          'module_concepts',
          'module_mcqs'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."ai_generation_jobs_status_enum" AS ENUM(
          'pending',
          'running',
          'completed',
          'failed'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_generation_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "requested_by_user_id" uuid NOT NULL,
        "job_type" "public"."ai_generation_jobs_job_type_enum" NOT NULL,
        "target_id" uuid NOT NULL,
        "status" "public"."ai_generation_jobs_status_enum" NOT NULL DEFAULT 'pending',
        "progress_current" integer NOT NULL DEFAULT 0,
        "progress_total" integer NOT NULL DEFAULT 0,
        "result_summary" jsonb,
        "error_message" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_generation_jobs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_generation_jobs_user" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ai_generation_jobs_target_status" ON "ai_generation_jobs" ("target_id", "status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ai_generation_jobs_user_status" ON "ai_generation_jobs" ("requested_by_user_id", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ai_generation_jobs_user_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ai_generation_jobs_target_status"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_generation_jobs"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."ai_generation_jobs_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."ai_generation_jobs_job_type_enum"`,
    );
  }
}
