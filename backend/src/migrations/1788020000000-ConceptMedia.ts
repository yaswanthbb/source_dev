import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §8 media: exactly one new table. Diagrams are pipeline-authored originals;
 * videos are embed-by-reference rows (IDs + metadata, content never copied).
 */
export class ConceptMedia1788020000000 implements MigrationInterface {
  name = 'ConceptMedia1788020000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "concept_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "concept_id" uuid NOT NULL, "kind" character varying(16) NOT NULL, "payload" jsonb NOT NULL, "license" character varying(128) NOT NULL, CONSTRAINT "PK_concept_media" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "concept_media" ADD CONSTRAINT "FK_concept_media_concept" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "concept_media" DROP CONSTRAINT "FK_concept_media_concept"`,
    );
    await queryRunner.query(`DROP TABLE "concept_media"`);
  }
}
