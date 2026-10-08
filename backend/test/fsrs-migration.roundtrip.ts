/**
 * Real PostgreSQL migration check, isolated in a transaction-owned schema.
 * Run with FSRS_TEST_DATABASE_URL set to a disposable database; never reads app env.
 * Everything is rolled back, including fixtures, schema, functions and triggers.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { FsrsReviewState1788080000000 } from '../src/migrations/1788080000000-FsrsReviewState';

async function main() {
  const url = process.env.FSRS_TEST_DATABASE_URL;
  if (!url)
    throw new Error(
      'Set FSRS_TEST_DATABASE_URL to a disposable PostgreSQL database',
    );
  const db = await new DataSource({ type: 'postgres', url }).initialize();
  const runner = db.createQueryRunner();
  try {
    await runner.startTransaction();
    const schema = `fsrs_check_${randomUUID().replaceAll('-', '')}`;
    await runner.query(`CREATE SCHEMA "${schema}"`);
    await runner.query(`SET LOCAL search_path TO "${schema}"`);
    await runner.query(`CREATE TABLE users (id uuid PRIMARY KEY);
      CREATE TABLE concepts (id uuid PRIMARY KEY, title text NOT NULL);
      CREATE TABLE mcq_questions (id uuid PRIMARY KEY, concept_id uuid NOT NULL REFERENCES concepts(id) ON DELETE CASCADE);
      CREATE TABLE review_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
        mcq_question_id uuid NOT NULL, interval_days integer NOT NULL DEFAULT 1,
        correct_streak integer NOT NULL DEFAULT 0, due_date date NOT NULL,
        last_reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_review_items_user_question" UNIQUE(user_id,mcq_question_id),
        CONSTRAINT "FK_review_items_user" FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT "FK_review_items_mcq_question" FOREIGN KEY(mcq_question_id) REFERENCES mcq_questions(id) ON DELETE CASCADE);
      CREATE INDEX "IDX_review_items_user_due_date" ON review_items(user_id,due_date)`);
    const user = randomUUID(),
      concept = randomUUID();
    const questions = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
    await runner.query('INSERT INTO users VALUES ($1)', [user]);
    await runner.query('INSERT INTO concepts VALUES ($1,$2)', [
      concept,
      'Retained lesson',
    ]);
    for (const id of questions)
      await runner.query('INSERT INTO mcq_questions VALUES ($1,$2)', [
        id,
        concept,
      ]);
    await runner.query(
      `INSERT INTO review_items (user_id,mcq_question_id,interval_days,correct_streak,due_date,last_reviewed_at)
      VALUES ($1,$2,8,3,'2026-10-08','2026-09-30T12:00Z'),
        ($1,$3,1,0,'2026-10-09',NULL), ($1,$4,1,0,'2026-10-08','2026-10-07T12:00Z')`,
      [user, ...questions.slice(0, 3)],
    );
    const served = () =>
      runner.query(
        `SELECT id,user_id,mcq_question_id,interval_days,correct_streak,due_date::text,last_reviewed_at FROM review_items ORDER BY id`,
      );
    const before = await served();
    const migration = new FsrsReviewState1788080000000();
    await migration.up(runner);
    assert.deepEqual(
      await served(),
      before,
      'up must not rewrite identities or served fields',
    );
    const [experienced] = await runner.query(
      'SELECT * FROM review_items WHERE mcq_question_id=$1',
      [questions[0]],
    );
    assert.equal(experienced.stability, 8);
    assert.equal(experienced.difficulty, 5);
    assert.equal(experienced.reps, 3);
    assert.equal(experienced.lapses, 0);
    assert.equal(experienced.state, 'review');
    assert.equal(experienced.last_grade, 'Good');
    assert.equal(experienced.source_concept_title, 'Retained lesson');
    const [unseen] = await runner.query(
      'SELECT * FROM review_items WHERE mcq_question_id=$1',
      [questions[1]],
    );
    assert.equal(unseen.state, 'new');
    assert.equal(unseen.stability, 0);
    const [failed] = await runner.query(
      'SELECT * FROM review_items WHERE mcq_question_id=$1',
      [questions[2]],
    );
    assert.equal(failed.state, 'review');
    assert.equal(failed.reps, 1);
    assert.equal(failed.last_grade, 'Again');
    // A flag-off insert has no new columns in its payload. The DB snapshots its source.
    await runner.query(
      `INSERT INTO review_items(user_id,mcq_question_id,due_date) VALUES ($1,$2,'2026-10-09')`,
      [user, questions[3]],
    );
    const [inserted] = await runner.query(
      'SELECT * FROM review_items WHERE mcq_question_id=$1',
      [questions[3]],
    );
    assert.equal(inserted.source_question_id, questions[3]);
    assert.equal(inserted.source_concept_id, concept);
    assert.equal(inserted.source_concept_title, 'Retained lesson');
    await runner.query(
      `INSERT INTO review_items(user_id,mcq_question_id,due_date) VALUES ($1,$2,'2026-10-09') ON CONFLICT DO NOTHING`,
      [user, questions[3]],
    );
    assert.equal(
      (await runner.query('SELECT count(*)::int AS n FROM review_items'))[0].n,
      4,
    );
    await runner.query('SAVEPOINT source_delete');
    await runner.query('DELETE FROM concepts WHERE id=$1', [concept]);
    const tombstones = await runner.query('SELECT * FROM review_items');
    assert.equal(
      tombstones.length,
      4,
      'question/concept deletion must retain every history',
    );
    assert(
      tombstones.every(
        (r) => r.mcq_question_id === null && r.source_concept_id === concept,
      ),
    );
    await assert.rejects(migration.down(runner), /retained review histories/);
    await runner.query('ROLLBACK TO SAVEPOINT source_delete');
    await migration.down(runner);
    const columns = await runner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='review_items'`,
      [schema],
    );
    assert.equal(columns.length, 9, 'full down restores original columns');
    assert(!columns.some((r) => r.column_name === 'stability'));
    assert.equal(
      (
        await runner.query(
          `SELECT is_nullable FROM information_schema.columns WHERE table_schema=$1 AND table_name='review_items' AND column_name='mcq_question_id'`,
          [schema],
        )
      )[0].is_nullable,
      'NO',
    );
    assert.equal(
      (
        await runner.query(
          `SELECT confdeltype FROM pg_constraint WHERE conname='FK_review_items_mcq_question' AND conrelid='review_items'::regclass`,
        )
      )[0].confdeltype,
      'c',
    );
    assert.equal(
      (await runner.query('SELECT count(*)::int AS n FROM review_items'))[0].n,
      4,
    );
    await migration.up(runner);
    assert.equal(
      (await runner.query('SELECT count(*)::int AS n FROM review_items'))[0].n,
      4,
    );
    console.log(
      'PASS: PostgreSQL up/backfill/uniqueness/flag-off snapshots/deletion retention/guarded down/full down/re-up',
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
