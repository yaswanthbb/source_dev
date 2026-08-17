import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountDeletionRequests1786630000000 implements MigrationInterface {
  name = 'AddAccountDeletionRequests1786630000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."account_deletion_requests_status_enum" AS ENUM('pending', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "account_deletion_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "reason" text,
        "status" "public"."account_deletion_requests_status_enum" NOT NULL DEFAULT 'pending',
        "reviewed_by_admin_id" uuid,
        "reviewed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_account_deletion_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_account_deletion_requests_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_account_deletion_requests_admin" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "account_deletion_requests"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."account_deletion_requests_status_enum"`,
    );
  }
}
