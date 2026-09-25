import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §7 notifications: general-purpose entity (recipient + type + payload +
 * read-state) from the start. Emitters are wired per feature; ARTICLE_DELETED
 * is emitted once §6 lands.
 */
export class Notifications1787960000000 implements MigrationInterface {
  name = 'Notifications1787960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('roadmap_submitted', 'roadmap_published', 'roadmap_rejected', 'concept_approved', 'concept_rejected', 'roadmap_unpublish_approved', 'roadmap_unpublished', 'roadmap_deleted', 'article_deleted', 'ai_job_completed', 'ai_job_failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "payload" jsonb NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_notifications" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_read" ON "notifications" ("user_id", "is_read")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_type" ON "notifications" ("user_id", "type")`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
  }
}
