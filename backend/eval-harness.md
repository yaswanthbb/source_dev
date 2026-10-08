# §8 Eval harness: operator guide

Backend implementation only. No learner experiments, UI, automatic repairs or automatic prompt rollout.
The agent does not commit/push or apply migrations to the development database.

## Audit and implementation trail

Graphify routed the initial audit to the existing prompt registry, compiler/assessment traces, validators,
quiz entities and API guards. Existing goldens are seven append-only files with 21 input contracts;
most pinned prompt rendering, not model outputs. Assessment included a synthetic output example.
The registry had 13 versioned tasks; this build adds `eval_judge` (14 total). Routing has 15 keys.
Research and diagram calls historically resolve the `concept_content` registry task. Eval records those
aliases rather than changing generation routing. This can expose an existing prompt mismatch in a live run.

- A: `src/modules/eval/eval-checks.ts` reuses leakage, assessment/NBME/Bloom and Mermaid validators.
  The link sanitizer was extracted without changing its generation behavior. Layer 1 consumes recorded
  link observations and course context; it makes no provider, DB or HTTP calls. Every result has
  `{code, passed, detail}`. Saved compilations load real terms/aliases, placements, prerequisites, edges,
  active question versions and diagram payloads. New outline traces retain declared callback targets.
- B: `eval-rubric.ts` has four dimensions and observable anchors at every integer 1–5. Strict parsing
  rejects extra/missing fields, out-of-range scores and quotes absent from the artifact. Low scores need
  failure/revision text; confidence is low/medium/high, not a fabricated probability. Judge batches have
  bounded size, temperature zero and a requested seed. Runs record generator and judge model IDs,
  separate generator/judge seeds, prompt versions/hashes, rubric version and raw judge JSON.
- C: `eval/golden/*.v1.jsonl` adds 24 output references covering all 21 original inputs and all 14 tasks.
  Original golden files/specs are untouched. Prose uses explicit semantic claim alternatives and forbidden
  reversals; this is conservative lexical semantic matching, not general semantic equivalence. Structured
  outputs compare canonical JSON exactly (object-key order ignored, array order/values retained).
- D: `eval-psychometrics.ts` and its service return first-attempt, distinct-learner aggregates with `n`
  and `insufficient_data`. Replacements create a linked new question/options and retire the predecessor
  transactionally. Old attempts/options remain unchanged. Existing quiz endpoints refuse edits/deletion
  of answered or retired versions. New quizzes exclude retired versions; existing FSRS cards retain their
  original question version. Review population does not allocate retired versions.
- E: `EvalService` persists shadows/comparisons, enforces nonregression at promotion and creates an
  approval record. Approval does **not** change production prompt statuses or serve a candidate. Registry
  selection requires an explicit config mapping plus a current fingerprint/corpus-matching approval.
  `EvalEvents` exposes safe, metadata-only `artifact_versioned`/`eval_recorded` hooks; no experiments run.
- F: `EvalExpertReview` stores append-only approve/edit/reject reviews, reason codes and four anchored
  integer scores linked to the run/rubric. An edit stores a proposal; it does not modify the artifact.
  Agreement statistics and calibration UI are deliberately absent.

## Configuration (defaults off)

| Setting | Meaning/default |
| --- | --- |
| `EVAL_ENABLED` | Exact `true` permits model-backed evals; unset disables paid calls. |
| `EVAL_PROVIDER` | `nvidia` default, or `gemini`. |
| `EVAL_PROVIDER_API_KEY` | Dedicated operator credential, never a user's BYOK key or API response. |
| `EVAL_GENERATOR_MODEL` | Explicit generator recommended; otherwise configured provider default. |
| `EVAL_JUDGE_MODEL` | Explicit independent model recommended; otherwise the existing strong-tier resolver. Same-model use warns. |
| `EVAL_SEED` | 42; integer 0–2147483647. Request recorded, not a promise of provider determinism. |
| `EVAL_JUDGE_BATCH_SIZE` | 2; integer 1–4. |
| `EVAL_TIMEOUT_MS` | 60000 per completion; integer 1000–300000. |
| `EVAL_LINK_ALLOWED_HOSTS` | Empty: HTTP disabled and external links unresolved. Comma-separated exact **trusted** public hostnames allow probing. |
| `EVAL_PROMPT_SELECTION_ENABLED` | Exact `true` opts into approved per-task prompt selection. Independent from enabling eval calls. |
| `EVAL_PROMPT_VERSIONS` | JSON object, e.g. `{"concept_draft":"2.0.0"}`. Unmapped tasks retain baseline. |
| `EVAL_ADMIN_USER_ID` | Existing admin UUID for the explicit live CLI. |

Never paste secrets into commands, candidate templates or fixtures. Use your existing protected env setup.
Model completions use direct operator dispatch, `internal: true` logs and no user quota methods. Raw
provider errors/credential-bearing URLs are not stored. Golden fixtures are synthetic. Saved-artifact
eval accepts generated course compilations only, not arbitrary learner/QA text. Psychometrics returns no
learner IDs or responses. Keep authored fixtures free of private material.

Calls are bounded (50 cases maximum, ten MCQs/case, 60000 characters/artifact), sequential generation
and batched judging. They still cost provider tokens; compare generates **both** corpora and independently
verifies MCQ keys. There is no background scheduler, auto-run or billing estimate.

Link observations use at most 20 unique links, four concurrent probes, five-second HTTP timeouts,
HEAD with GET fallback, no followed redirects, no URL credentials/IP literals/nondefault ports, and DNS
preflight rejection of private/nonpublic addresses. Only allow domains under trusted control: DNS can
change between lookup and fetch; this is not a general-purpose hostile-URL fetcher. Default-off is safest.
Replay/promotion uses the stored observations, never fresh HTTP.

## Migrations (user-operated)

Apply the four new additive migrations in order with the existing command:

```bash
cd backend
npm run typeorm:migration:run
```

1. `1788090000000-EvalJudgeTask`: add judge labels to both existing PostgreSQL enums.
2. `1788100000000-EvalJudgeSeed`: byte-exact v1 production seed and strict JSON schemas.
3. `1788110000000-EvalAuditStorage`: four audit/comparison/release/expert tables and partial approved-task uniqueness.
4. `1788120000000-QuestionVersions`: predecessor/version/retirement/provenance metadata and one-successor uniqueness.

Enum and seed migrations commit separately (`migrationsTransactionMode: each` already exists). Do not
amend a migration that ran. Deploy schema before code that queries the new entities/columns.

**Rollback normally means flag off/revoke approval, not schema down.** Full down exists and was tested.
It deliberately discards eval audit/calibration rows, eval-only telemetry and all `eval_judge` versions;
other task versions/logs and all questions/options/attempts survive. Question down drops version/retirement
metadata without deleting either predecessor or successor. Old code will therefore see both rows;
reconcile which versions are served before using old code after schema downgrade. No automatic destructive
question cleanup is performed.

## API contract and release sequence

Paths below are backend paths (there is no global `/api` prefix; Swagger lives at `/api/docs`). Auth remains the global JWT guard.
`/admin/eval/*` is admin-only. Question endpoints additionally allow developers but enforce concept
author/admin ownership and the shared visibility predicate in the service.

| Method/path | Input/result |
| --- | --- |
| `GET /admin/eval/rubric` | Versioned observable anchors. |
| `GET /admin/eval/goldens` | Synthetic corpus with resolved original inputs. |
| `GET /admin/eval/runs/:id` | Admin-only auditable run. |
| `POST /admin/eval/candidates` | `{task,version,systemTemplate,changelog}`; new immutable draft version. |
| `POST /admin/eval/shadow` | `{task,version}`; stored output/checks/judge, nothing served. |
| `POST /admin/eval/regression` | Current effective production/approved selection over every golden; per-task diffs/run IDs. |
| `POST /admin/eval/comparisons` | `{task,baselineVersion,candidateVersion}`; identical corpus/settings for both. |
| `POST /admin/eval/comparisons/:id/promote` | Revalidates stored evidence and approves only nonregressing comparison. |
| `POST /admin/eval/tasks/:task/rollback` | Revokes active approval; subsequent resolutions return baseline. |
| `POST /admin/eval/compilations/:id` | `{judge:false}` for pure stored-artifact checks; `true` explicitly pays for judging. |
| `POST /admin/eval/runs/:id/expert-reviews` | `{decision,reasonCodes,reason,scores,proposedRevision?}`. |
| `GET /eval/questions/:id/psychometrics` | Author/admin aggregate, version and exact rest-cohort IDs. |
| `POST /eval/questions/:id/replacements` | Existing create-question DTO plus required `reason`; new linked version, review reset. |

Reason codes: `accuracy`, `clarity`, `pedagogy`, `difficulty`, `evidence`, `other`. Scores:
`{accuracy,clarity,pedagogy,difficultyCalibration}`. Edit requires a revision; edit/reject require reason codes.
Replacement does not copy/trust supplied verifier or lint verdicts. Review the new question before publishing.
The replacement transaction locks its predecessor and the DB enforces one successor. Legacy draft edits
use an attempt-count guard, not a cross-endpoint transaction with first-attempt submission: avoid concurrent
draft mutation/first answers. Replacements are the safe history-preserving author workflow; this build does
not redesign all legacy quiz/concept deletion or concurrency semantics.

Release: create a new candidate → shadow/compare against the current production baseline → inspect
quoted evidence → promote → explicitly configure task selection. The gate recomputes Layer 1, golden
diffs and strict judge parsing, verifies prompt/artifact/corpus fingerprints, complete identical case sets
and generator/judge/model/seed/rubric conditions. Protected metrics are overall and per-check Layer 1
pass rates, golden pass rate and every rubric-dimension mean. Missing/failed runs or any regression block.
The stored comparison summary alone cannot authorize promotion. No absolute quality threshold/statistical
significance policy is invented; this is a nonregression gate, not proof that a bad baseline is good.

Flag off restores the original baseline on the next registry resolution. If editing env files, restart/reload
your process as usual; there is no env-file watcher. Revoke endpoint needs no restart. No sticky learner
assignment exists, and in-flight generations keep prompts already resolved. Compiler prompt selection
still follows the existing course-engine/registry boundary; flags do not activate the compiler themselves.

## Psychometric interpretation

Difficulty is proportion correct (higher is easier). First attempts per learner/question version only;
retries do not inflate `n`. Distractor/position rates are descriptive even for small samples. Inferential
correlation/discrimination needs at least 20 distinct complete learners, at least two rest items and
nonzero score variation. Complete same-concept rest items use current versions, excluding every relative
of the target item; historical students may not have answered this cohort, so historical estimates can
be unavailable rather than mixing incompatible item versions.

The point-biserial calculation is Pearson correlation between binary item correctness and the rest-item
total (corrected item-rest, not a circular total including the item); see [SciPy's reference](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pointbiserialr.html).
Upper/lower groups use 27% tails with boundary ties included and overlapping tied groups suppressed;
[ETS's 1952 study](https://www.ets.org/research/policy_research_reports/publications/report/1952/hnyj.html)
is the source for the conventional tail fraction. Minimum 20 is a conservative product guard, not a power
analysis. Review flags (`p<.2`/`p>.9`, discrimination/correlation `<.2`, distractor selection `<.05`) are
explicit heuristics, never automatic replacements. No timing/confidence signal is inferred from attempts.

## Verification and honest limits

From `backend`:

```bash
npx tsc --noEmit
npx jest --runInBand
npm run eval:regression
npm run build
```

`eval:regression` is **offline**: all eval unit/workflow tests plus reference-output replay and original
input-contract checks, with per-case names/diffs. Provider mocks test mechanics, not model quality.
The real production-model command is separate and deliberately opt-in:

```bash
# After migrations and protected env configuration; costs provider tokens.
npm run eval:live
```

It runs the current effective prompt over all cases, saves runs and prints per-task checks, diffs, judges,
warnings and IDs; nonpassing results exit 1. The output references were authored synthetic acceptance
examples this build, **not captured successful production outputs or independently expert-calibrated gold**.
The original one-question assessment example remains one question although its builder requests five;
strict output diff may expose that mismatch. Do not edit expectations just to obtain green. New behavior
adds reviewed rows and a documented reason; corpus changes invalidate old approvals.

Layer 1 remains observable/structural: section heading aliases, Mermaid syntax checks and known leakage
patterns cannot prove correctness or cognitive effectiveness. Stored blind verification is required for
defensible keys, not inferred from `isCorrect`. Unrecognized natural-language callbacks need declared
outline targets; historical traces lacking targets cannot be reconstructed. Historical writer/version/seed
is explicitly unknown rather than fabricated. New publish traces identify the last writer; edited content
warns. Provider seeds are best-effort and provider/model changes still require re-evaluation.

Real migration check (only an **empty** disposable DB named `eval_harness_check_*`; no app env loaded):

```bash
EVAL_TEST_DATABASE_URL='<disposable-db-url>' node -r ts-node/register test/eval-migrations.roundtrip.ts
```

The check commits enum additions before seeds, tests audit storage/constraints, preserves attempts and
old options through replacement, full down and re-up. This session used a separate PostgreSQL 18.6 `/tmp`
cluster and stopped it afterward; no development DB migration was run. Runtime entity metadata and
compiled JSONL packaging were also verified. Live provider quality, authenticated API smoke and the
user-operated push/fresh-pull verification remain pending; local green is not a claim those passed.

Final local checkpoint: typecheck/build clean, full Jest **659/659 across 55 suites**, offline eval target
**118/118 across 14 suites**. No pre-existing test was weakened; the routing task-name pin deliberately
includes the new judge key. Generation tests, quiz/review tests and all other backend suites remain green.
