import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RestructureModuleScopedPrerequisites1786890000000
  implements MigrationInterface
{
  name = 'RestructureModuleScopedPrerequisites1786890000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop old global concept_prerequisites table
    await queryRunner.query(
      `DROP TABLE IF EXISTS "concept_prerequisites" CASCADE`,
    );

    // 2. Ensure sequential unique order_index per module in module_concepts
    await queryRunner.query(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY module_id ORDER BY order_index ASC, created_at ASC) as rn
        FROM module_concepts
      )
      UPDATE module_concepts mc
      SET order_index = ranked.rn
      FROM ranked
      WHERE mc.id = ranked.id;
    `);

    // 3. Add UNIQUE constraint on (module_id, order_index)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "module_concepts" 
        ADD CONSTRAINT "UQ_module_concepts_module_order" UNIQUE ("module_id", "order_index");
      EXCEPTION
        WHEN duplicate_table THEN null;
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 4. Create module_concept_prerequisites table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "module_concept_prerequisites" (
        "module_concept_id" uuid NOT NULL,
        "prerequisite_module_concept_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_module_concept_prerequisites" PRIMARY KEY ("module_concept_id", "prerequisite_module_concept_id"),
        CONSTRAINT "FK_mcp_module_concept" FOREIGN KEY ("module_concept_id") REFERENCES "module_concepts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_mcp_prerequisite_module_concept" FOREIGN KEY ("prerequisite_module_concept_id") REFERENCES "module_concepts"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "module_concept_prerequisites" CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_concepts" DROP CONSTRAINT IF EXISTS "UQ_module_concepts_module_order"`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "concept_prerequisites" (
        "concept_id" uuid NOT NULL,
        "prerequisite_concept_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_concept_prerequisites" PRIMARY KEY ("concept_id", "prerequisite_concept_id"),
        CONSTRAINT "FK_concept_prerequisites_concept" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_concept_prerequisites_prereq" FOREIGN KEY ("prerequisite_concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE
      );
    `);
  }
}
