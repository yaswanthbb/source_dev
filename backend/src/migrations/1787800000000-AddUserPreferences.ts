import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cross-device UI preferences (interface mode, theme, last location, one-time
 * onboarding flags) as a single JSONB column.
 *
 * NOT NULL with a `{}` default so every existing row is immediately valid and
 * the application never has to branch on a null preferences object — an absent
 * key means "not set", which is the only absence the code has to handle.
 */
export class AddUserPreferences1787800000000 implements MigrationInterface {
  name = 'AddUserPreferences1787800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "preferences" jsonb NOT NULL DEFAULT '{}'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "preferences"
    `);
  }
}
