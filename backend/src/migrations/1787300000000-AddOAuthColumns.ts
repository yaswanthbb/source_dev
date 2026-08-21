import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOAuthColumns1787300000000 implements MigrationInterface {
  name = 'AddOAuthColumns1787300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "password_hash" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "auth_provider" character varying NULL,
      ADD COLUMN "auth_provider_id" character varying NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_auth_provider_id" 
      ON "users" ("auth_provider", "auth_provider_id") 
      WHERE "auth_provider" IS NOT NULL AND "auth_provider_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_users_auth_provider_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "auth_provider_id",
      DROP COLUMN "auth_provider"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "password_hash" SET NOT NULL
    `);
  }
}
