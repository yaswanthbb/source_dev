import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetOtps1787100000000 implements MigrationInterface {
  name = 'AddPasswordResetOtps1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_otps" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "otp_hash" character varying NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "attempts_used" integer NOT NULL DEFAULT 0,
        "used" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_otps_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_password_reset_otps_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_password_reset_otps_lookup" ON "password_reset_otps" ("user_id", "used", "expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_password_reset_otps_lookup"`,
    );
    await queryRunner.query(`DROP TABLE "password_reset_otps"`);
  }
}
