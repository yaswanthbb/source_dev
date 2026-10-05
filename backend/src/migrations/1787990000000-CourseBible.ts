import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §8 Phase 1 (tight schema per review): terminology registry, per-concept
 * cards (misconceptions/sources/examples as JSONB — no dedicated tables),
 * directed concept edges, and a teacher-persona JSONB column on roadmaps.
 */
export class CourseBible1787990000000 implements MigrationInterface {
  name = 'CourseBible1787990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."course_concept_edges_type_enum" AS ENUM('prerequisite', 'builds_on', 'introduced_in', 'revisited_in', 'applied_by', 'related_to')`,
    );
    await queryRunner.query(
      `CREATE TABLE "course_terms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "roadmap_id" uuid NOT NULL, "term" character varying(200) NOT NULL, "definition" text NOT NULL, "aliases" jsonb NOT NULL DEFAULT '[]'::jsonb, "introduced_in_concept_id" uuid, CONSTRAINT "UQ_course_terms_roadmap_term" UNIQUE ("roadmap_id", "term"), CONSTRAINT "PK_course_terms" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_terms" ADD CONSTRAINT "FK_course_terms_roadmap" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_terms" ADD CONSTRAINT "FK_course_terms_concept" FOREIGN KEY ("introduced_in_concept_id") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "course_concept_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "roadmap_id" uuid NOT NULL, "concept_id" uuid NOT NULL, "summary" text, "key_claims" jsonb NOT NULL DEFAULT '[]'::jsonb, "bloom_level" character varying(32), "difficulty_phase" character varying(32), "misconceptions" jsonb NOT NULL DEFAULT '[]'::jsonb, "sources" jsonb NOT NULL DEFAULT '[]'::jsonb, "examples" jsonb NOT NULL DEFAULT '[]'::jsonb, CONSTRAINT "UQ_course_concept_cards_concept" UNIQUE ("concept_id"), CONSTRAINT "PK_course_concept_cards" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_concept_cards" ADD CONSTRAINT "FK_course_concept_cards_roadmap" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_concept_cards" ADD CONSTRAINT "FK_course_concept_cards_concept" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "course_concept_edges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "roadmap_id" uuid NOT NULL, "from_concept_id" uuid NOT NULL, "to_concept_id" uuid NOT NULL, "type" "public"."course_concept_edges_type_enum" NOT NULL, CONSTRAINT "UQ_course_concept_edges_triple" UNIQUE ("from_concept_id", "to_concept_id", "type"), CONSTRAINT "PK_course_concept_edges" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_concept_edges" ADD CONSTRAINT "FK_course_concept_edges_roadmap" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_concept_edges" ADD CONSTRAINT "FK_course_concept_edges_from" FOREIGN KEY ("from_concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_concept_edges" ADD CONSTRAINT "FK_course_concept_edges_to" FOREIGN KEY ("to_concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roadmaps" ADD COLUMN "teacher_persona" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roadmaps" DROP COLUMN "teacher_persona"`,
    );
    await queryRunner.query(`DROP TABLE "course_concept_edges"`);
    await queryRunner.query(`DROP TABLE "course_concept_cards"`);
    await queryRunner.query(`DROP TABLE "course_terms"`);
    await queryRunner.query(
      `DROP TYPE "public"."course_concept_edges_type_enum"`,
    );
  }
}
