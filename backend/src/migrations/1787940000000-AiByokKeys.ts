import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §5 BYOK: per-user encrypted provider keys (max 2), one default each
 * (partial unique index), per-key quota attribution on logs, and key
 * linkage on jobs (drives the in-use deletion lock).
 */
export class AiByokKeys1787940000000 implements MigrationInterface {
  name = 'AiByokKeys1787940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ai_provider_enum" AS ENUM('nvidia', 'gemini')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_provider_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "provider" "public"."ai_provider_enum" NOT NULL, "key_ciphertext" text NOT NULL, "key_hint" character varying(8) NOT NULL, "label" character varying(120), "is_default" boolean NOT NULL DEFAULT false, "daily_limit" integer NOT NULL DEFAULT 20, CONSTRAINT "PK_ai_provider_keys" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_provider_keys_user" ON "ai_provider_keys" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_ai_provider_keys_default_per_user" ON "ai_provider_keys" ("user_id") WHERE "is_default"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_keys" ADD CONSTRAINT "FK_ai_provider_keys_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" ADD COLUMN "provider_key_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" ADD CONSTRAINT "FK_ai_generation_logs_key" FOREIGN KEY ("provider_key_id") REFERENCES "ai_provider_keys"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_jobs" ADD COLUMN "provider_key_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_jobs" ADD CONSTRAINT "FK_ai_generation_jobs_key" FOREIGN KEY ("provider_key_id") REFERENCES "ai_provider_keys"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_jobs" ADD COLUMN "provider" "public"."ai_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_jobs" ADD COLUMN "model" character varying(120)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_generation_jobs" DROP COLUMN "model"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_jobs" DROP COLUMN "provider"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_jobs" DROP CONSTRAINT "FK_ai_generation_jobs_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_jobs" DROP COLUMN "provider_key_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" DROP CONSTRAINT "FK_ai_generation_logs_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" DROP COLUMN "provider_key_id"`,
    );
    await queryRunner.query(`DROP TABLE "ai_provider_keys"`);
    await queryRunner.query(`DROP TYPE "public"."ai_provider_enum"`);
  }
}
