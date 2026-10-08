/** Real PostgreSQL enum/seed/storage/version roundtrip. Disposable, empty database ONLY.
 * Does not load .env or application DB config. Enum changes commit separately, as in production. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { AiGenerationType } from '../src/common/enums/ai-generation-type.enum';
import { EvalJudgeTask1788090000000 } from '../src/migrations/1788090000000-EvalJudgeTask';
import { EvalJudgeSeed1788100000000 } from '../src/migrations/1788100000000-EvalJudgeSeed';
import { EvalAuditStorage1788110000000 } from '../src/migrations/1788110000000-EvalAuditStorage';
import { QuestionVersions1788120000000 } from '../src/migrations/1788120000000-QuestionVersions';
import { EVAL_JUDGE_SYSTEM_PROMPT } from '../src/modules/eval/eval-rubric';
async function main() {
  const url = process.env.EVAL_TEST_DATABASE_URL;
  if (!url)
    throw new Error(
      'Set EVAL_TEST_DATABASE_URL to an empty disposable database named eval_harness_check_*',
    );
  const db = await new DataSource({ type: 'postgres', url }).initialize();
  const runner = db.createQueryRunner();
  try {
    const [identity] = await runner.query('SELECT current_database() AS name');
    assert.match(identity.name, /^eval_harness_check_[a-z0-9_]+$/);
    assert.equal(
      (
        await runner.query(
          "SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public'",
        )
      )[0].n,
      0,
      'refuse a nonempty database',
    );
    const labels = Object.values(AiGenerationType).filter(
      (t) => t !== AiGenerationType.EVAL_JUDGE,
    );
    const enumSql = labels.map((t) => `'${t}'`).join(',');
    await runner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE TYPE public.ai_prompt_versions_task_enum AS ENUM (${enumSql});
      CREATE TYPE public.ai_generation_logs_generation_type_enum AS ENUM (${enumSql});
      CREATE TABLE users (id uuid PRIMARY KEY);
      CREATE TABLE ai_prompt_versions (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), task public.ai_prompt_versions_task_enum NOT NULL,
        version varchar(32) NOT NULL, system_template text NOT NULL, input_schema jsonb, output_schema jsonb, changelog text, status text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(task,version));
      CREATE TABLE ai_generation_logs(id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),generation_type public.ai_generation_logs_generation_type_enum NOT NULL);
      CREATE TABLE mcq_questions(id uuid PRIMARY KEY, question_text text NOT NULL);
      CREATE TABLE mcq_options(id uuid PRIMARY KEY, question_id uuid NOT NULL REFERENCES mcq_questions(id), option_text text NOT NULL);
      CREATE TABLE mcq_attempts(id uuid PRIMARY KEY, question_id uuid NOT NULL REFERENCES mcq_questions(id),
        selected_option_id uuid NOT NULL REFERENCES mcq_options(id), student_id uuid NOT NULL REFERENCES users(id), is_correct boolean NOT NULL, attempt_number integer NOT NULL)`);
    const user = randomUUID(),
      parent = randomUUID(),
      option = randomUUID(),
      attempt = randomUUID(),
      baseline = randomUUID(),
      candidate = randomUUID();
    await runner.query('INSERT INTO users VALUES ($1)', [user]);
    await runner.query('INSERT INTO mcq_questions VALUES ($1,$2)', [
      parent,
      'Historical stem',
    ]);
    await runner.query('INSERT INTO mcq_options VALUES ($1,$2,$3)', [
      option,
      parent,
      'Historical option',
    ]);
    await runner.query('INSERT INTO mcq_attempts VALUES ($1,$2,$3,$4,true,1)', [
      attempt,
      parent,
      option,
      user,
    ]);
    await runner.query(
      "INSERT INTO ai_prompt_versions(id,task,version,system_template,status) VALUES ($1,'concept_content','1.0.0','baseline','production'),($2,'concept_content','2.0.0','candidate','draft')",
      [baseline, candidate],
    );
    await runner.query(
      "INSERT INTO ai_generation_logs(generation_type) VALUES ('concept_content')",
    );
    const history = () =>
      runner.query(
        'SELECT a.*,q.question_text,o.option_text FROM mcq_attempts a JOIN mcq_questions q ON q.id=a.question_id JOIN mcq_options o ON o.id=a.selected_option_id',
      );
    const original = await history();
    const migrations = [
      new EvalJudgeTask1788090000000(),
      new EvalJudgeSeed1788100000000(),
      new EvalAuditStorage1788110000000(),
      new QuestionVersions1788120000000(),
    ];
    const transact = async (action: () => Promise<void>) => {
      await runner.startTransaction();
      try {
        await action();
        await runner.commitTransaction();
      } catch (error) {
        await runner.rollbackTransaction();
        throw error;
      }
    };
    for (const migration of migrations)
      await transact(() => migration.up(runner));
    const [seed] = await runner.query(
      "SELECT * FROM ai_prompt_versions WHERE task='eval_judge'",
    );
    assert.equal(
      seed.system_template,
      EVAL_JUDGE_SYSTEM_PROMPT,
      'byte-exact seed',
    );
    assert.equal(seed.output_schema.additionalProperties, false);
    await runner.query(
      "INSERT INTO ai_prompt_versions(task,version,system_template,status) VALUES ('eval_judge','2.0.0','judge candidate','draft')",
    );
    await runner.query(
      "INSERT INTO ai_generation_logs(generation_type) VALUES ('eval_judge')",
    );
    const run = randomUUID(),
      comparison = randomUUID();
    await runner.query(
      `INSERT INTO eval_runs(id,task,prompt_version,prompt_hash,artifact_hash,artifact,context,generator_model,rubric_version,seed,mode,status,deterministic_result,created_by_id)
      VALUES ($1,'concept_content','1.0.0','hash','artifact','{}','{}','generator','1.0.0',NULL,'saved_artifact','completed','{"passed":true,"checks":[]}',$2)`,
      [run, user],
    );
    await runner.query(
      "INSERT INTO eval_comparisons(id,task,baseline_prompt_id,candidate_prompt_id,golden_set_hash,baseline_run_ids,candidate_run_ids,result) VALUES ($1,'concept_content',$2,$3,'corpus','[]','[]','{}')",
      [comparison, baseline, candidate],
    );
    const release = () =>
      runner.query(
        "INSERT INTO eval_prompt_releases(task,baseline_prompt_id,candidate_prompt_id,comparison_id,baseline_hash,candidate_hash,golden_set_hash,status) VALUES ('concept_content',$1,$2,$3,'b','c','corpus','approved')",
        [baseline, candidate, comparison],
      );
    await release();
    await assert.rejects(release(), /duplicate key/);
    await runner.query("UPDATE eval_prompt_releases SET status='revoked'");
    await release();
    await runner.query(
      "INSERT INTO eval_expert_reviews(eval_run_id,decision,reason_codes,reason,rubric_version,scores) VALUES ($1,'approve','[]','Anchored review','1.0.0','{}')",
      [run],
    );
    const successor = randomUUID();
    await runner.query(
      'INSERT INTO mcq_questions(id,question_text,predecessor_id,version_number) VALUES ($1,$2,$3,2)',
      [successor, 'New stem', parent],
    );
    await runner.query(
      'UPDATE mcq_questions SET retired_at=now() WHERE id=$1',
      [parent],
    );
    await assert.rejects(
      runner.query(
        'INSERT INTO mcq_questions(id,question_text,predecessor_id,version_number) VALUES ($1,$2,$3,2)',
        [randomUUID(), 'Second successor', parent],
      ),
      /duplicate key/,
    );
    assert.deepEqual(
      await history(),
      original,
      'replacement must retain the answered version and option',
    );
    for (const migration of [...migrations].reverse())
      await transact(() => migration.down(runner));
    assert.deepEqual(
      await history(),
      original,
      'down must retain attempts and original options',
    );
    assert.equal(
      (await runner.query('SELECT count(*)::int AS n FROM mcq_questions'))[0].n,
      2,
      'down must not delete successor',
    );
    assert.equal(
      (
        await runner.query('SELECT count(*)::int AS n FROM ai_prompt_versions')
      )[0].n,
      2,
      'only eval task versions discarded',
    );
    assert.equal(
      (
        await runner.query('SELECT count(*)::int AS n FROM ai_generation_logs')
      )[0].n,
      1,
      'non-eval telemetry survives',
    );
    const restored = await runner.query(
      "SELECT enumlabel FROM pg_enum WHERE enumtypid='public.ai_prompt_versions_task_enum'::regtype ORDER BY enumsortorder",
    );
    assert.deepEqual(
      restored.map((r: any) => r.enumlabel),
      labels,
    );
    assert.equal(
      (
        await runner.query(
          "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'eval_%'",
        )
      )[0].n,
      0,
    );
    for (const migration of migrations)
      await transact(() => migration.up(runner));
    assert.deepEqual(await history(), original, 're-up retains history');
    console.log(
      'PASS: PostgreSQL enum commit, byte-exact seed, audit FKs/storage, partial release/successor uniqueness, attempt preservation, full down and re-up',
    );
  } finally {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    await runner.release();
    await db.destroy();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
