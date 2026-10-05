import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §3.8 published-edit model: roadmaps gain unpublish-request state +
 * effective dates (30-day public countdown, scheduled admin deletion),
 * concepts gain pending-draft content storage for the draft/live split.
 * No cron exists, so effective dates are evaluated lazily in the visibility
 * predicate; rows past a scheduled deletion are purged via maintenance
 * endpoint (see AdminContentReviewController.purgeDeletedRoadmaps).
 */
export class PublishedEditModel1787930000000 implements MigrationInterface {
  name = 'PublishedEditModel1787930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."roadmaps_unpublish_status_enum" AS ENUM('none', 'requested', 'approved')`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" ADD COLUMN "unpublish_status" "public"."roadmaps_unpublish_status_enum" NOT NULL DEFAULT 'none'`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" ADD COLUMN "unpublish_effective_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" ADD COLUMN "delete_effective_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "concepts" ADD COLUMN "draft_content" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "concepts" DROP COLUMN "draft_content"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" DROP COLUMN "delete_effective_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" DROP COLUMN "unpublish_effective_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" DROP COLUMN "unpublish_status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."roadmaps_unpublish_status_enum"`,
    );
  }
}
