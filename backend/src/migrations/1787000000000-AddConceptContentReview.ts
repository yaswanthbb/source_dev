import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConceptContentReview1787000000000
  implements MigrationInterface
{
  name = 'AddConceptContentReview1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."concepts_review_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD "review_status" "public"."concepts_review_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD "is_ai_generated" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD "rejection_reason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD "reviewed_by_user_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD "reviewed_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD CONSTRAINT "FK_concepts_reviewed_by_user_id" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Backfill all existing concepts as 'approved' so existing published content remains live
    await queryRunner.query(
      `UPDATE "concepts" SET "review_status" = 'approved' WHERE "review_status" IS NULL OR "review_status" = 'pending'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "concepts" DROP CONSTRAINT "FK_concepts_reviewed_by_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" DROP COLUMN "reviewed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" DROP COLUMN "reviewed_by_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" DROP COLUMN "rejection_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" DROP COLUMN "is_ai_generated"`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" DROP COLUMN "review_status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."concepts_review_status_enum"`,
    );
  }
}
