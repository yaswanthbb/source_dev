import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandAiGenerationTypes1786960000000 implements MigrationInterface {
  name = 'ExpandAiGenerationTypes1786960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."ai_generation_logs_generation_type_enum" ADD VALUE IF NOT EXISTS 'roadmap_modules';
    `);
    await queryRunner.query(`
      ALTER TYPE "public"."ai_generation_logs_generation_type_enum" ADD VALUE IF NOT EXISTS 'module_concepts';
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Postgres enums do not natively support removing values without recreation.
  }
}
