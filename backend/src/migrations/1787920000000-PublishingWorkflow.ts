import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §3 publishing workflow: roadmaps gain a review lifecycle
 * (draft → submitted → published) plus rejection bookkeeping.
 * Module "approved" stays a derived display (all concepts approved) —
 * no stored module state.
 */
export class PublishingWorkflow1787920000000 implements MigrationInterface {
  name = 'PublishingWorkflow1787920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."roadmaps_review_status_enum" AS ENUM('draft', 'submitted', 'published')`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" ADD COLUMN "review_status" "public"."roadmaps_review_status_enum" NOT NULL DEFAULT 'draft'`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" ADD COLUMN "rejection_reason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" ADD COLUMN "reviewed_by_user_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" ADD CONSTRAINT "FK_roadmaps_reviewed_by" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" ADD COLUMN "reviewed_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roadmaps" DROP CONSTRAINT "FK_roadmaps_reviewed_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" DROP COLUMN "reviewed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" DROP COLUMN "reviewed_by_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" DROP COLUMN "rejection_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" DROP COLUMN "review_status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."roadmaps_review_status_enum"`,
    );
  }
}
