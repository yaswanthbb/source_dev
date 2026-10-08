import type { MigrationInterface, QueryRunner } from 'typeorm';
export class EvalAuditStorage1788110000000 implements MigrationInterface {
  name = 'EvalAuditStorage1788110000000';
  async up(runner: QueryRunner) {
    const base = `id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()`;
    await runner.query(`CREATE TABLE eval_runs (${base}, task text NOT NULL, prompt_version varchar(32) NOT NULL, prompt_hash text NOT NULL,
      artifact_hash text NOT NULL, artifact jsonb NOT NULL, context jsonb NOT NULL, generator_model text NOT NULL, judge_model text,
      judge_prompt_version varchar(32), judge_prompt_hash text, rubric_version varchar(32) NOT NULL, seed integer, judge_seed integer,
      golden_id text, golden_set_hash text, mode text NOT NULL CHECK(mode IN ('shadow','baseline','candidate','saved_artifact')),
      status text NOT NULL CHECK(status IN ('pending','completed','failed')), deterministic_result jsonb NOT NULL,
      judge_result jsonb, judge_raw text, golden_diff jsonb, warnings jsonb NOT NULL DEFAULT '[]', source jsonb,
      created_by_id uuid REFERENCES users(id) ON DELETE SET NULL)`);
    await runner.query(
      `CREATE INDEX IDX_eval_runs_task_created ON eval_runs(task,created_at)`,
    );
    await runner.query(`CREATE TABLE eval_comparisons (${base}, task text NOT NULL,
      baseline_prompt_id uuid NOT NULL REFERENCES ai_prompt_versions(id) ON DELETE RESTRICT,
      candidate_prompt_id uuid NOT NULL REFERENCES ai_prompt_versions(id) ON DELETE RESTRICT,
      golden_set_hash text NOT NULL, baseline_run_ids jsonb NOT NULL, candidate_run_ids jsonb NOT NULL, result jsonb NOT NULL)`);
    await runner.query(`CREATE TABLE eval_prompt_releases (${base}, task text NOT NULL,
      baseline_prompt_id uuid NOT NULL REFERENCES ai_prompt_versions(id) ON DELETE RESTRICT,
      candidate_prompt_id uuid NOT NULL REFERENCES ai_prompt_versions(id) ON DELETE RESTRICT,
      comparison_id uuid NOT NULL REFERENCES eval_comparisons(id) ON DELETE RESTRICT,
      baseline_hash text NOT NULL, candidate_hash text NOT NULL, golden_set_hash text NOT NULL,
      status text NOT NULL CHECK(status IN ('approved','revoked')), approved_by_id uuid REFERENCES users(id) ON DELETE SET NULL)`);
    // Partial uniqueness belongs in migration SQL, not @Unique (which cannot express WHERE).
    await runner.query(
      `CREATE UNIQUE INDEX UQ_eval_release_approved_task ON eval_prompt_releases(task) WHERE status='approved'`,
    );
    await runner.query(`CREATE TABLE eval_expert_reviews (${base}, eval_run_id uuid NOT NULL REFERENCES eval_runs(id) ON DELETE RESTRICT,
      expert_id uuid REFERENCES users(id) ON DELETE SET NULL, decision text NOT NULL CHECK(decision IN ('approve','edit','reject')),
      reason_codes jsonb NOT NULL, reason text NOT NULL, rubric_version varchar(32) NOT NULL, scores jsonb NOT NULL, proposed_revision text)`);
  }
  async down(runner: QueryRunner) {
    // Explicit accepted audit/calibration data loss on schema downgrade; production artifacts/attempts are untouched.
    await runner.query(`DROP TABLE eval_expert_reviews`);
    await runner.query(`DROP TABLE eval_prompt_releases`);
    await runner.query(`DROP TABLE eval_comparisons`);
    await runner.query(`DROP TABLE eval_runs`);
  }
}
