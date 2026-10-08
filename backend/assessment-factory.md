# Assessment factory rollout and verification

Only `COURSE_ENGINE_ENABLED=true` enables the assessment pipeline. All other values preserve the legacy single-shot paths. Disable this flag first for a behavior rollback; nullable schema additions may remain installed.

`ASSESSMENT_BLOOM_TARGET_PERCENT` is a percentage between 0 and 100 (default 40; invalid values fall back to 40). MCQ draft task routes use the fast tier and 4000 tokens; misconception extraction uses fast, independent answer verification uses strong. Provider-specific `<PROVIDER>_STRONG_MODEL_ID` selects the strong model; without it both tiers may use the same model. Verification is still a separate blinded call with no draft key or rationales. Provider/key never changes within the operation.

## Migrations

Run in `backend`: `npm run typeorm:migration:run`. The user confirmed successful application during this build. The three ordered migrations are:

1. `1788050000000-AssessmentColumns`: seven nullable columns, legacy rows unchanged.
2. `1788060000000-AssessmentPromptTasks`: enum labels only, committed before seeds.
3. `1788070000000-AssessmentPromptSeeds`: immutable v1 seeds for misconception extraction, typed MCQ drafting, and independent verification.

For a schema rollback, disable the flag and stop assessment traffic, then run `npm run typeorm:migration:revert` three times in reverse order (seeds → tasks → columns). Confirm these are the latest applied migrations before reverting. This removes assessment metadata and v1 seed rows. Later prompt versions for these tasks must be removed/exported separately before reverting the enum migration; otherwise PostgreSQL safely rejects the cast. The schema down drops only the seven new columns. The task down rebuilds the enum, preserving other labels. No rollback was executed against the user's database. SQL contract tests verify down coverage and snapshot integrity; they do not replace a live round-trip test on a disposable database.

## Behavioral contracts

- Single generation returns `{rawText}` as an author-side JSON array. Existing title/content requests remain supported. Optional `conceptId` is author/admin scoped and uses persisted concept content; if a roadmap placement or card exists, extraction stores the inventory. Scope-less drafts use a transient inventory because no concept/card exists yet. A scoped but unattached concept without a card records a storage warning.
- Module generation and failed-set retries share the same pipeline, still skip concepts with questions, and preserve progress/failed-item/notification handling. One slot is charged per flag-on module job; all remaining set drafts and internal calls use internal logs. Flag-off jobs retain per-concept billing. A successful primary parse retry still charges exactly one slot, including after an initial provider failure.
- Every draft retry logs telemetry. Parsing reuses the existing JSON repair with exactly one retry and temperature bump. Verification disagreement permits one repair and fresh verification; persistent conflict retains the original draft/key and records both verification results and a warning. Verification/extraction/revision failures warn, rather than failing a valid draft.
- The Bloom audit replaces the minimum number of lowest-level items once, re-verifies/re-lints replacements, and records pre/post distributions and answer positions. Still below target → warning and publish. Lint failures likewise publish with explicit item traces/warnings under the compiler's warning policy.
- Persisted question metadata: Bloom, intended difficulty, correct rationale, lint and verification results. Correct options have null distractor fields. Author clients can send the generated top-level fields and option metadata back to the existing question-create endpoint; the backend preserves them only when the flag is on. Clients that reconstruct only legacy fields must retain the new fields to retain this metadata.
- Learner quiz options redact `isCorrect`, `misconception`, and `distractorRationale`. Question responses remain an explicit allowlist. Review reads already allowlist learner fields; submission/XP/review scheduling logic is unchanged.
- Assessment traces use `assessment:<conceptId>:<title>` compilation titles so they do not overwrite article compiler traces. Stage outcomes and loud warning codes are retained in `concept_compilations`. Scopeless single traces have null job/roadmap/concept IDs.

## Checks and manual smoke test

From `backend`, run `npx tsc --noEmit` and `npx jest --runInBand`. Focused suite: `npx jest assessment mcq-lint --runInBand`. Tests cover all lint codes, adversarial cues, verifier blinding/conflicts/outages, Bloom boundaries/revisions, migration SQL/down coverage, seed/golden integrity, all three entry points, quota logs, persistence, author scoping, and flag-off payload parity.

After migration, enable the flag on dev, generate a module MCQ job, inspect its compilation stages and one non-internal `concept_mcqs` log row across the job. Confirm card inventories and metadata columns are populated. Fetch the quiz as a non-author before submission and verify no key/rationale/verification metadata is present. Repeat with the flag off to confirm legacy output/writes. Use a disposable database for live migration down/up tests. Deterministic grammatical/homogeneity/subsumption checks are conservative heuristics; subject-matter correctness requires the independent verifier and author review. Psychometrics are deliberately deferred.
