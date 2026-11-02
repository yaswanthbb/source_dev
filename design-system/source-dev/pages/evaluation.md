# Evaluation inspection — checkpoint 30, completed 2026-10-30

Current follow-up (2026-11-02): checkpoint 33 adds Prompt releases, retained-comparison approval and
explicit task-wide rollback. Shared write pause/recovery includes releases. See `evaluation-releases.md`
for current verification and API limits. The earlier checkpoint scope below is a historical record.

Current follow-up (2026-10-30): checkpoint 31 added explicit candidate/execution workflows in a separate
Run evaluations view. Inspection remains GET-only. See `evaluation-execution.md` for current write guards,
ACK/readback limits, recovery and verification. The checkpoint 30 inspection record below is historical;
checkpoints 32–33 remain unstarted.

Current follow-up (2026-10-30): checkpoint 32 also added expert review and question replacement in
Expert decisions, with shared execution/decision pause and recovery. See `evaluation-decisions.md`.
Checkpoint 33 release controls remain unstarted.

## Audit-led scope

Graphify-first controller, DTO, service, entity, rubric/golden, psychometrics and prompt registry audit.
The existing admin terminal has no evaluation commands. The API has no run listing and no GET for prompt
versions, comparisons, releases or expert reviews. Do not invent a global run browser, production selector,
prompt-version catalog, readback endpoint, terminal command or current serving-state claim.

Checkpoint 30 is a complete read-only `/admin/evaluation` workspace: current rubric, checked golden corpus,
known saved run, and known question-version metrics. Paid execution, expert/content decisions and release
controls are separate implementation/review checkpoints 31–33. They are not implemented or implicitly
approved for live execution here. This split defines the previously audit-dependent checkpoint rather
than claiming all mutation parity is finished. No backend API/schema/dependency change is needed now.

| Existing endpoint / behavior | Scope and follow-up |
| --- | --- |
| GET `/admin/eval/rubric` | Current version plus four independently anchored dimensions, five scores each. Controller is admin guarded. Implemented inspection. |
| GET `/admin/eval/goldens` | Full checked corpus, bounded by the service at 50 cases. Input, expected output, claim contracts, forbidden output, provenance and original/registry aliases. These are references, not successful runs or learner outcomes. Implemented inspection. |
| GET `/admin/eval/runs/:id` | Admin-only known-ID lookup, complete saved evaluation evidence. No list endpoint. Implemented inspection. |
| GET `/eval/questions/:id/psychometrics` | Backend allows concept author/admin with concept visibility; this admin workspace does not expand developer access. Aggregated first-attempt statistics and current same-concept rest-item cohort, excluding other target-family versions. Implemented inspection. |
| POST candidates | Immutable unique task/version, bounded semantic version (32), system text (30000) and changelog (2000); creates a draft, does not release it. Follow-up 31. |
| POST shadow / regression / comparisons | Provider-backed generation/verifier/judge work using operator evaluation settings and credentials, internal logs, no user quota charging and no serving of artifacts. Provider use may still cost money. Partial persisted runs can precede failures; no automatic retry. Comparison creates a comparison record after both sets. No comparison GET. Follow-up 31. |
| POST compilations/:id | Even `judge:false` persists a new saved-artifact evaluation. `judge:true` additionally calls the provider. Current artifact/questions/media/context are read, historical provenance remains unknown rather than inferred. Follow-up 31. |
| POST runs/:id/expert-reviews | Creates a separate review record with all four anchored integer scores 1–5, reason, required codes for edit/reject and required proposed revision for edit. It does not apply that revision or approve content publication. No review GET/list. Follow-up 32. |
| POST questions/:id/replacements | Author/admin transaction locks a current non-retired item, requires reason and 2–12 options with one key, creates successor and retires parent. Clears lint/verifier evidence, preserves order and moves the shared concept back to pending review. This is a content/visibility decision, not a metric read. Follow-up 32. |
| POST comparisons/:id/promote | Transaction rechecks current production baseline, non-archived candidate, current golden corpus, stored run identity/hashes/evidence and protected metrics; revokes prior approved releases and records an approved release. It does not change production prompt-row status or deployment config. Effective selection additionally requires `EVAL_PROMPT_SELECTION_ENABLED` and matching per-task `EVAL_PROMPT_VERSIONS`, with matching release/hash/corpus checks in the registry. Follow-up 33. |
| POST tasks/:task/rollback | Revokes approved releases for that task; baseline prompt row/config is not rewritten. ACK says baseline restored; no effective-serving GET exists to independently verify it. Follow-up 33. |

Future write-flow design must explicitly distinguish ACK-only evidence from independent GET readback,
retain late/partial-outcome warnings, prevent automatic paid replays, and describe serving/content effects
accurately. Any proposed new backend read API needs separate backend authorization; none is added here.

## UI and contracts

- Approved orange, warm paper/charcoal theme, existing Inter/Lucide, original finite evidence/magnifier SVG,
  native controls, 44px minimum buttons, visible focus, scoped CSS and reduced-motion final states.
  Admin sidebar and existing guarded admin layout recognize the GUI route. Admin in developer view keeps
  developer navigation. Server wrapper passes no function-bearing props to the client leaf.
- Four view buttons: Rubric, Golden cases, Inspect a run, Question quality. Local literal golden ID/task/
  provenance search, registry-task filter and six-item paging. Original research/diagram aliases remain
  visible; paging/reset focuses the reference heading. Native details expose exact literal JSON/text.
- Run status, deterministic result/checks, golden difference and judge dimensions are independent. A
  completed run can have failed checks or no judge result. Judge quotes/confidence/revisions are recorded
  observations, not proven learner outcomes or release permission. A different recorded rubric is never
  silently replaced with current anchors. Models, seeds including zero, versions, warnings and hashes are
  explicit; missing provenance stays “Not recorded”. No aggregate grade or invented release eligibility.
- Known run/question IDs require complete UUIDs before any request. Separate per-view drafts survive view
  changes and read failures. Validation focuses input; result/error receives focus; synchronous request
  guard blocks overlapping refresh/lookup and pending controls are disabled. References refresh manually;
  a lookup is never triggered on typing, view change or entry.
- Metrics preserve null versus zero. Difficulty index means fraction correct, not an inverted difficulty
  score. Sample/complete-cohort/minimum counts, missing-data reasons, version/predecessor, groups/ties,
  positions/key and selection rates are labelled. Empty heuristic flags never certify quality, especially
  with limited data. No student identifiers are projected. No automatic replacement or learner outcome.
- Original token guard, auth/storage invalidation and matching fresh admin account before/after every
  reference batch and lookup. Concept/record APIs retain their backend authorization. Timed abortable GETs
  only (12000ms), strict identity/schema/finite ranges/sample/position checks and fixed safe errors.
  Run projection omits returned account objects/IDs and duplicated raw judge batch; artifact/context/source
  remain literal evidence. UI JSON bounds (depth 24, 1MB per document) reject excessive responses and are
  not claimed backend limits. No HTML/Markdown execution, automatic media or external-link requests.
- Reference cache is actor/role scoped and requires a fresh successful mounted read before display.
  Loading/refresh/error hide old values and inspection; unknown/errors remain distinct from checked zero.
  Rubric/golden transient errors are independent; auth/role denial hides the whole workspace. Lookup
  records stay local rather than in shared query cache. Missing IDs/404/network errors retain fixed retry
  copy, not stale record details; explicit retry can recover. Auth/session changes discard in-flight results.
- No polling, automatic retries, focus/reconnect refresh, provider action, write, restore or release selector.
  Read snapshots are not atomic or realtime. CLI appearance explicitly offers same-route GUI return and
  admin terminal return without claiming evaluation commands or changing saved learner location.

## Verification and limits

- 627 frontend tests across 17 files pass with clean process exit, including 20 new evaluation cases.
  Final focused evaluation run: 20 passing. Success and malformed data, aliases/duplicates, saved evidence,
  missing/zero metrics, account drift, forbidden/timeout-like network errors, missing records, original-
  session changes, deduplication, read-only recovery, fresh cache gating, filter/paging/draft/validation,
  rubric mismatch and explicit GUI/CLI/admin/developer navigation were covered with mocks.
- Pure frontend parsers also accepted the current backend rubric 1.0.0 and all 24 disk-loaded golden
  cases with source inputs resolved. This is static reference-data validation, not a live API check.
- Standalone `npx tsc --noEmit --incremental false`, touched ESLint, theme-token check, `git diff --check`
  and final fixture-free `npm run build -- --webpack` pass. Four baseline lint warnings remain (three admin
  layout imports and one test variable), no introduced diagnostics. Existing multiple-lockfile build
  warning remains. Backend, dependency files and terminal registries are unchanged; earlier dirty work retained.
- Labelled disposable actual-view/shell browser QA checked desktop 1280×720, phone 375×812, tablet 768×1024
  and landscape 812×375, light/dark: full real rubric copy, golden filter/alias/paging/reset/focus, details,
  UUID validation/focus, failed lookup/explicit retry/result focus, saved run observations/literal script
  text, null and full sample metrics/positions, partial failure, loading/error/manual recovery/empty/pending,
  long reference wrapping, admin menu/theme/Escape and evaluation destination. No checked horizontal
  overflow or browser warning/error. No real API, provider, evaluation, account/content/progress/billing,
  expert decision/replacement or release operation; UI callbacks were local and contracts mocked.
- Real backend authorization/data/evidence consistency at scale, actual evaluation/serving configuration,
  preferences/destinations, cross-tab/concurrent changes, screen readers and OS reduced motion remain
  manual. The browser did not navigate to authenticated production surfaces or execute paid/write endpoints.
- Sample route/dev cache removed, owned tab closed, viewport reset, light restored, server stopped and
  port 3211 confirmed closed. Build contains `/admin/evaluation` and no preview route. No Git staging,
  commit, push, PR or publishing. Review images: `/home/yaswanth/.codex/visualizations/2026/10/30/source-dev-evaluation-overview.jpg`
  and `source-dev-evaluation-run.jpg` (local sample only).

Stop for visual review. Next is checkpoint 31, prompt candidates and explicit evaluation execution.
