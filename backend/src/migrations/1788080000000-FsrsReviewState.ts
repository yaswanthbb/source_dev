import type { MigrationInterface, QueryRunner } from 'typeorm';

export class FsrsReviewState1788080000000 implements MigrationInterface {
  name = 'FsrsReviewState1788080000000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE review_items
      ADD COLUMN stability double precision,
      ADD COLUMN difficulty double precision,
      ADD COLUMN reps integer,
      ADD COLUMN lapses integer,
      ADD COLUMN state text,
      ADD COLUMN last_grade text,
      ADD COLUMN learning_steps integer,
      ADD COLUMN fsrs_reviewed_at timestamptz,
      ADD COLUMN source_question_id uuid,
      ADD COLUMN source_concept_id uuid,
      ADD COLUMN source_concept_title text,
      ADD CONSTRAINT CK_review_memory_state CHECK (state IN ('new','learning','review','relearning')),
      ADD CONSTRAINT CK_review_last_grade CHECK (last_grade IN ('Again','Good'))`);
    // Deterministic seed, NOT inferred full review history:
    // history exists iff a review timestamp, positive streak, or interval > 1 exists.
    // Experienced: S=max(interval,1), D=5, reps=max(streak,last-reviewed?1:0), lapses=0, Review.
    // Unseen: S=D=reps=lapses=0, New. Last grade is inferred only when a timestamp exists.
    // Served interval_days/due_date/correct_streak/last_reviewed_at and row identities are untouched.
    await runner.query(`UPDATE review_items SET
      stability = CASE WHEN last_reviewed_at IS NOT NULL OR correct_streak > 0 OR interval_days > 1 THEN GREATEST(interval_days,1) ELSE 0 END,
      difficulty = CASE WHEN last_reviewed_at IS NOT NULL OR correct_streak > 0 OR interval_days > 1 THEN 5 ELSE 0 END,
      reps = GREATEST(correct_streak, CASE WHEN last_reviewed_at IS NOT NULL THEN 1 ELSE 0 END),
      lapses = 0,
      state = CASE WHEN last_reviewed_at IS NOT NULL OR correct_streak > 0 OR interval_days > 1 THEN 'review' ELSE 'new' END,
      last_grade = CASE WHEN last_reviewed_at IS NULL THEN NULL WHEN correct_streak > 0 THEN 'Good' ELSE 'Again' END,
      learning_steps = 0, fsrs_reviewed_at = last_reviewed_at,
      source_question_id = mcq_question_id`);
    await runner.query(`UPDATE review_items r SET source_concept_id = q.concept_id, source_concept_title = c.title
      FROM mcq_questions q JOIN concepts c ON c.id = q.concept_id WHERE q.id = r.mcq_question_id`);
    // A concept/question deletion retains the owner's review history as a source-less tombstone.
    // The original unique (user_id,mcq_question_id) constraint remains unchanged for live cards.
    await runner.query(`ALTER TABLE review_items DROP CONSTRAINT "FK_review_items_mcq_question",
      ALTER COLUMN mcq_question_id DROP NOT NULL,
      ADD CONSTRAINT "FK_review_items_mcq_question" FOREIGN KEY (mcq_question_id) REFERENCES mcq_questions(id) ON DELETE SET NULL`);
    // Snapshot newly inserted cards even while the legacy flag is off, so deletion never loses provenance.
    await runner.query(`CREATE FUNCTION snapshot_review_source() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.mcq_question_id IS NOT NULL THEN
        NEW.source_question_id := NEW.mcq_question_id;
        SELECT q.concept_id, c.title INTO NEW.source_concept_id, NEW.source_concept_title
          FROM mcq_questions q JOIN concepts c ON c.id = q.concept_id WHERE q.id = NEW.mcq_question_id;
      END IF;
      RETURN NEW;
    END; $$`);
    await runner.query(`CREATE TRIGGER snapshot_review_source BEFORE INSERT ON review_items
      FOR EACH ROW EXECUTE FUNCTION snapshot_review_source()`);
  }
  async down(runner: QueryRunner): Promise<void> {
    // A true schema rollback restores NOT NULL/CASCADE. Refuse to erase tombstones to do so.
    // Flag rollback is always safe and needs no schema down. Export/reconcile retained histories first.
    await runner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM review_items WHERE mcq_question_id IS NULL) THEN
      RAISE EXCEPTION 'Cannot restore legacy NOT NULL while retained review histories exist; export/reconcile tombstones first, or use FSRS_ENABLED=false';
      END IF; END; $$`);
    await runner.query(`DROP TRIGGER snapshot_review_source ON review_items`);
    await runner.query(`DROP FUNCTION snapshot_review_source()`);
    await runner.query(`ALTER TABLE review_items DROP CONSTRAINT "FK_review_items_mcq_question",
      ALTER COLUMN mcq_question_id SET NOT NULL,
      ADD CONSTRAINT "FK_review_items_mcq_question" FOREIGN KEY (mcq_question_id) REFERENCES mcq_questions(id) ON DELETE CASCADE`);
    // Accepted state/snapshot data loss on schema downgrade; never delete a review row.
    await runner.query(`ALTER TABLE review_items DROP CONSTRAINT CK_review_memory_state, DROP CONSTRAINT CK_review_last_grade,
      DROP COLUMN source_concept_title, DROP COLUMN source_concept_id, DROP COLUMN source_question_id,
      DROP COLUMN fsrs_reviewed_at, DROP COLUMN learning_steps, DROP COLUMN last_grade,
      DROP COLUMN state, DROP COLUMN lapses, DROP COLUMN reps, DROP COLUMN difficulty, DROP COLUMN stability`);
  }
}
