import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiGenerationLog1786950000000 implements MigrationInterface {
  name = 'AddAiGenerationLog1786950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."ai_generation_logs_generation_type_enum" AS ENUM(
          'roadmap_description',
          'concept_content',
          'concept_mcqs'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_generation_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "generation_type" "public"."ai_generation_logs_generation_type_enum" NOT NULL,
        "generated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_generation_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_generation_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ai_generation_logs_user_generated_at" ON "ai_generation_logs" ("user_id", "generated_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_generation_logs"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."ai_generation_logs_generation_type_enum"`,
    );
  }
}
