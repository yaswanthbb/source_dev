import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §8 research ingestion (RAG): lawful-sources corpus + chunk store for
 * pgvector top-k retrieval. The `vector` extension install is best-effort,
 * probed via pg_available_extensions first (a failed CREATE would poison the
 * migration transaction — a caught error cannot un-abort it): when
 * unavailable the `embedding` column falls back to `text` and similarity
 * runs as JS cosine — the research stage degrades gracefully either way and
 * never fails a concept. The extension itself is never dropped on down (it
 * may be shared).
 */
export class ResearchIngestion1788010000000 implements MigrationInterface {
  name = 'ResearchIngestion1788010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Probe first: a failed CREATE EXTENSION poisons the whole migration
    // transaction (Postgres aborts everything after the first error, and a
    // JS try/catch cannot un-abort it). A plain SELECT never fails, so the
    // extension is only created when it is actually available.
    const probe: Array<{ exists: boolean }> = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') AS "exists"`,
    );
    let vectorAvailable = probe[0]?.exists === true;
    if (vectorAvailable) {
      try {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "vector"`);
      } catch {
        vectorAvailable = false;
      }
    }
    const embeddingType = vectorAvailable ? 'vector' : 'text';
    await queryRunner.query(
      `CREATE TABLE "course_sources" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "roadmap_id" uuid, "title" character varying(400) NOT NULL, "url" text NOT NULL, "license" character varying(32) NOT NULL, "source_type" character varying(32) NOT NULL, "content_hash" character varying(64) NOT NULL, "ingested_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_course_sources_url" UNIQUE ("url"), CONSTRAINT "CHK_course_sources_license" CHECK ("license" IN ('public-domain', 'CC0', 'CC-BY', 'CC-BY-SA', 'OER', 'explicit')), CONSTRAINT "PK_course_sources" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_sources" ADD CONSTRAINT "FK_course_sources_roadmap" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "course_source_chunks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "source_id" uuid NOT NULL, "chunk_index" integer NOT NULL, "content" text NOT NULL, "embedding" ${embeddingType}, "token_count" integer NOT NULL, CONSTRAINT "UQ_course_source_chunks_source_index" UNIQUE ("source_id", "chunk_index"), CONSTRAINT "PK_course_source_chunks" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_source_chunks" ADD CONSTRAINT "FK_course_source_chunks_source" FOREIGN KEY ("source_id") REFERENCES "course_sources"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "course_source_chunks" DROP CONSTRAINT "FK_course_source_chunks_source"`,
    );
    await queryRunner.query(`DROP TABLE "course_source_chunks"`);
    await queryRunner.query(
      `ALTER TABLE "course_sources" DROP CONSTRAINT "FK_course_sources_roadmap"`,
    );
    await queryRunner.query(`DROP TABLE "course_sources"`);
  }
}
