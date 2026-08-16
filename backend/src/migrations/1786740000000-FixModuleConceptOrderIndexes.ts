import type { MigrationInterface, QueryRunner } from 'typeorm';

export class FixModuleConceptOrderIndexes1786740000000
  implements MigrationInterface
{
  name = 'FixModuleConceptOrderIndexes1786740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH ranked_concepts AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY module_id ORDER BY created_at ASC) as new_order
        FROM module_concepts
      )
      UPDATE module_concepts mc
      SET order_index = rc.new_order
      FROM ranked_concepts rc
      WHERE mc.id = rc.id;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No rollback necessary for sequential order index cleanup
  }
}
