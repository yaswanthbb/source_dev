import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfilePicture1787200000000 implements MigrationInterface {
  name = 'AddUserProfilePicture1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "profile_picture" text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "profile_picture"
    `);
  }
}
