import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §8 compiler stage-distinct prompt tasks, part 1 of 2: enum labels only.
 * The five compiler stages (outline/draft/fact-check/critique/revise)
 * resolve prompts through their own task rows instead of sharing
 * concept_content, so per-stage versions can ship without touching the
 * other stages. Seed rows ship separately in StagePromptSeeds — Postgres
 * refuses to USE new enum labels in the transaction that creates them
 * (55P04), so labels and rows must commit in order across two migrations.
 *
 * Log generation_type stays CONCEPT_CONTENT for quota/analytics identity;
 * only prompt resolution goes per-stage.
 */
export class StagePromptTasks1788030000000 implements MigrationInterface {
  name = 'StagePromptTasks1788030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."ai_prompt_versions_task_enum" ADD VALUE 'concept_outline'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ai_prompt_versions_task_enum" ADD VALUE 'concept_draft'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ai_prompt_versions_task_enum" ADD VALUE 'concept_factcheck'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ai_prompt_versions_task_enum" ADD VALUE 'concept_critique'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ai_prompt_versions_task_enum" ADD VALUE 'concept_revise'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Intentional no-op: Postgres cannot drop enum labels, and the seed
    // rows live in StagePromptSeeds (revert that first). With the rows
    // gone these labels are inert — no code reads them without rows.
    void queryRunner;
  }
}
