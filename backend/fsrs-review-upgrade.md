# FSRS review upgrade — rollout and verification

## Scope and library

Backend-only upgrade of review scheduling. Quiz attempts still feed concept completion into review-card population; answering a review is the only scheduling decision. The attempt/review DTOs contain only an option selection, not timing or confidence: wrong maps to **Again**, correct to **Good**. Hard/Easy are not invented.

Pinned `ts-fsrs@5.4.2` ([upstream](https://github.com/open-spaced-repetition/ts-fsrs), [changelog](https://github.com/open-spaced-repetition/ts-fsrs/blob/main/packages/fsrs/CHANGELOG.md)). Evaluation on 2026-10-08: MIT, maintained FSRS-6 implementation, Node >=20, CommonJS exports and TypeScript declarations. This checkout uses Node 22.22.2 and TypeScript 5.7.3; the adapter compiles and executes against the installed package. No handwritten FSRS equations or weight optimization.

`review-scheduler.ts` separates `ReviewScheduler`, exact legacy doubling, and the library adapter. Library fuzz is disabled for reproducibility; long-term intervals keep the existing 60-day ceiling. Learning/relearning steps are `23h`, rounded **up to at least one civil day** in the served API. The library still owns stability, difficulty, learning state and step cursor. `1d` library steps would graduate immediately instead of retaining a relearning state; `23h` deliberately retains that state while preserving this app's daily sessions and early-answer/XP guard. No intraday review API is added.

## Configuration

Set in the backend's existing environment and restart the process:

| Variable | Default | Valid values |
| --- | --- | --- |
| `FSRS_ENABLED` | off | Exactly `true` enables FSRS; every other value uses legacy |
| `FSRS_REQUEST_RETENTION` | `0.9` | Finite number, `0.7`–`0.99` inclusive |
| `FSRS_LEECH_THRESHOLD` | `8` | Integer, `1`–`100` inclusive |
| `FSRS_REVIEW_SESSION_CAP` | `50` | Integer, `1`–`500` inclusive |

Higher retention means shorter intervals and more review workload; lower retention accepts more forgetting. Start at 0.9, not a personalized claim of optimal retention. Settings are validated when the relevant FSRS operation uses them; invalid retention/threshold cannot award XP or persist an answer. Invalid queue caps reject queue preparation. The legacy path ignores FSRS-only settings, including invalid ones.

## Migration and deterministic legacy mapping

One new migration: `src/migrations/1788080000000-FsrsReviewState.ts`. Existing migrations are unchanged. It adds nullable memory columns (`stability`, `difficulty`, `reps`, `lapses`, `state`, `last_grade`), the learning step cursor, an FSRS review timestamp marker, and source provenance snapshots. It does not change existing row IDs, served intervals/dates, streaks, or review timestamps. The live `(user_id, mcq_question_id)` unique constraint remains in place.

- History exists if `last_reviewed_at` is set, `correct_streak > 0`, or `interval_days > 1`.
- With history: stability = `max(interval_days, 1)`, difficulty = 5, reps = `max(correct_streak, timestamp-present ? 1 : 0)`, lapses = 0, state = `review`.
- Without history: stability/difficulty/reps/lapses = 0, state = `new`.
- Last grade is null without a timestamp; otherwise Good for a positive streak, Again for zero streak. Learning cursor starts at 0; FSRS marker starts at the existing review timestamp.
- Example: interval 8 / streak 3 becomes stability 8, difficulty 5, reps 3, lapses 0, Review. The next Good grows memory/interval within the 60-day bound, rather than creating an unbounded jump.

This is a deterministic approximation, not reconstruction of missing review history. For migrated history without a timestamp, the adapter estimates the previous review from the served due date minus interval. New cards inserted with the flag off can have null memory; FSRS seeds it lazily on first use.

Run yourself from `backend/` with your normal DB env loaded:

```sh
npm run typeorm:migration:run
```

Apply the migration **before running the upgraded backend**, even with FSRS off: TypeORM reads the new entity columns. Do not use schema synchronization instead of migrations.

### Rollback

Set `FSRS_ENABLED=false` and restart: no schema downgrade is needed. Legacy answers use exactly the old doubling/reset/streak/2-or-0 XP behavior and leave FSRS memory frozen. Re-enabling detects a mismatch between `last_reviewed_at` and `fsrs_reviewed_at`, rebases stability from the current served interval, and preserves lifetime reps/lapses. It does not silently use stale memory across legacy reviews; the next scheduling log says `rebased:true`.

A full schema down drops all added columns/trigger/function and restores the original NOT NULL/CASCADE question FK. Memory/provenance loss on schema downgrade is accepted. **If source-less retained histories exist, down fails before making changes**: restoring the original NOT NULL FK without deleting those rows is impossible. Export/reconcile them deliberately first, or use the flag rollback. Never silently delete histories to force a downgrade. Only revert when this migration is the latest applied migration, and run the older code after schema downgrade.

```sh
npm run typeorm:migration:revert
```

## Deleted or withdrawn sources

Question deletion changes the review question FK to NULL instead of cascading away the review. Concept deletion cascades its questions, but review rows and their IDs/memory remain. A BEFORE INSERT trigger snapshots question ID, concept ID and title even for legacy inserts; backfill snapshots existing cards. No question text or answer is duplicated. Snapshot columns have no live source FK, intentionally surviving deletion.

With FSRS enabled, missing sources are excluded from the answerable session and included in `unavailableCount`. Withdrawn/unpublished/expired placements use the existing shared concept/roadmap visibility predicates on reads **and answers**; author/admin bypass remains. The app has no separate archive flag: those visibility transitions are its archive-equivalent behavior. Answering an unavailable source returns 404 without XP or deleting/resetting the history. Deleted sources cannot be bypassed. With the flag off, source-less rows are still retained and counted in the original total and excluded safely from the array, with a warning log; healthy legacy response shapes are unchanged.

## Queue, API and leeches

`GET /review/due` remains an array. Its due predicate is `due_date <= today` in the learner's timezone. Each FSRS session sorts by civil due date, then lowest retrievability, creation time and ID. Within the oldest remaining date, choose the first card from a different concept than the previous card when possible; otherwise take the first ranked card. This interleaves concepts deterministically without putting a later date ahead of overdue work. Interleaving may move a same-date card ahead of a more forgettable card to avoid adjacent concepts. The cap limits output, not stored work.

`GET /review/due-count` always keeps `count` and `dueCount`. With FSRS enabled it adds:

```json
{
  "count": 64,
  "dueCount": 64,
  "sessionCount": 50,
  "heldBackCount": 10,
  "unavailableCount": 4,
  "leechCount": 2
}
```

`count = sessionCount + heldBackCount + unavailableCount`; `leechCount` counts visible due leeches, including held-back cards. Clients can show “10 more due” without confusing unavailable histories with held-back work. Legacy returns exactly the original two count keys and does not cap/interleave.

FSRS due items and answer responses add `isLeech` and nullable `remediation`. A leech is derived from lifetime lapses >= threshold. Remediation contains a plain-language message, `conceptId`, and the existing working `/developer/terminal?concept=<id>` lesson link. Cards are never deleted/reset at threshold. FSRS counts a lapse on a Review→Again transition; additional Again answers while already relearning do not invent more lapses. Repeated lapse/recovery cycles do cross the threshold. The frontend rendering of the nudge/count is not changed in this backend build; the API supplies both.

Ownership checks, option membership, early-answer rejection, correctness redaction, the original answer fields, `REVIEW_CORRECT` XP (2 correct / 0 wrong), notifications, quiz DTOs and attempt APIs remain unchanged. Learner options use an explicit allowlist, excluding assessment verification/lint/rationale/misconception metadata.

## Observability

Existing Nest logger emits structured JSON, without question/answer text:

- `review_scheduled` (log): user/card ID, `fsrsEnabled`, scheduler/version, binary grade, served interval/date, state, and rebase decision; both flag paths.
- `review_queue` (debug): scheduler version, total due, session, held-back, unavailable and leech counts. Enable debug logging to inspect queue behavior.
- `review_leech` (warn): threshold crossing, card/concept IDs and lifetime lapse count.
- `review_source_unavailable` (warn): missing-source count on the legacy queue path.

## Verification and manual smoke

Local verification on 2026-10-08: `npx tsc --noEmit` clean; review Jest 48/48 tests (5 suites); full Jest 541/541 tests (41 suites); `npm run build` clean; `git diff --check` clean. The round-trip check below passed on an isolated PostgreSQL 18.6 instance under `/tmp` (stopped afterward), including the intentional tombstone downgrade refusal and a successful full down/re-up with live sources. No application database migration was applied. No commit, push or fresh-pull verification was performed, per the user's standing Git restriction.

From `backend/`:

```sh
npx tsc --noEmit
npx jest review --runInBand
npx jest --runInBand
```

Colocated tests cover binary mapping, unchanged legacy specs, flag off/on/off/on rebasing, bounded migrated-card behavior, retention validation, real library relearning, repeated lapses/leeches, counts/caps/interleaving/redaction, missing and expired sources, published non-owner access, IST midnight, New York midnight and spring/fall DST calendar-day scheduling.

`test/fsrs-migration.roundtrip.ts` is a separate actual-PostgreSQL check, not the mocked SQL-contract Jest test. Point it only at a disposable database. It creates a transaction-owned schema, verifies up/backfill/served-field parity/uniqueness/legacy insert snapshots/concept-delete retention/guarded down/full down/re-up, then rolls back everything. It does not load app dotenv or touch application tables:

```sh
FSRS_TEST_DATABASE_URL='<disposable PostgreSQL URL>' node -r ts-node/register test/fsrs-migration.roundtrip.ts
```

Manual authenticated API smoke after **you** apply the migration:

1. With the flag off, answer one due card: Good doubles (cap 60), Again gives 1 day, and response/count keys match legacy. Try another user's item (403) and a future item (400).
2. Enable FSRS with cap 2 and threshold 2 in dev. Complete a concept: new review cards are due tomorrow, never immediately. Inspect due-count totals against the capped due array; metadata must not reveal correctness.
3. On due days, alternate Again and Good on the same card until two lapses: retained row, relearning, no XP on Again, leech flag and lesson link. Follow the link. Try answering before the next civil date (400).
4. For a non-author reader, unpublish an otherwise-visible source: unavailable count increases and answers give 404. Delete a disposable source: review history survives with NULL live question FK and snapshots.
5. Answer once with FSRS, switch off and answer on a later due day, then re-enable: next answer should log `rebased:true`, preserving lifetime counters. Inspect the scheduler version and held-back telemetry.

Dev database migration application and authenticated API/browser smoke remain operator steps, not automatically performed here. Queue ranking still loads all due rows (like the original queue); the session cap bounds response size, not database memory or ranking cost. Bulk archival and very large backlogs may eventually warrant paging. Review/XP transaction/concurrency behavior is unchanged from the original system and is not made atomic by this build.
