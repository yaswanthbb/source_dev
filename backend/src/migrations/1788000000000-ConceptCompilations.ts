import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §8 compiler observability: exactly one new table (`concept_compilations`
 * stage traces) plus the `internal` quota-exempt flag on
 * `ai_generation_logs` (pipeline stages record telemetry without consuming
 * quota slots — readQuota counts only internal=false rows).
 */
export class ConceptCompilations1788000000000 implements MigrationInterface {
  name = 'ConceptCompilations1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" ADD COLUMN "internal" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE TABLE "concept_compilations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "job_id" uuid, "title" character varying(300) NOT NULL, "roadmap_id" uuid, "concept_id" uuid, "status" character varying(32) NOT NULL, "stages" jsonb NOT NULL DEFAULT '[]'::jsonb, "warnings" jsonb NOT NULL DEFAULT '[]'::jsonb, CONSTRAINT "UQ_concept_compilations_job_title" UNIQUE ("job_id", "title"), CONSTRAINT "PK_concept_compilations" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "concept_compilations" ADD CONSTRAINT "FK_concept_compilations_roadmap" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "concept_compilations" ADD CONSTRAINT "FK_concept_compilations_concept" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "concept_compilations" DROP CONSTRAINT "FK_concept_compilations_concept"`,
    );
    await queryRunner.query(
      `ALTER TABLE "concept_compilations" DROP CONSTRAINT "FK_concept_compilations_roadmap"`,
    );
    await queryRunner.query(`DROP TABLE "concept_compilations"`);
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" DROP COLUMN "internal"`,
    );
  }
}
