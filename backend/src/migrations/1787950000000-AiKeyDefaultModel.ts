import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §5 key default model: each stored key remembers the model picked from its
 * live list at save time. Used when a generation omits `model`.
 * (Separate migration because AiByokKeys already ran on dev DBs.)
 */
export class AiKeyDefaultModel1787950000000 implements MigrationInterface {
  name = 'AiKeyDefaultModel1787950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_provider_keys" ADD COLUMN "default_model" character varying(120)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_provider_keys" DROP COLUMN "default_model"`,
    );
  }
}
