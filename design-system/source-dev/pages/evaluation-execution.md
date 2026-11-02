# Evaluation execution — checkpoint 31, completed 2026-10-30

Current follow-up (2026-11-02): checkpoint 33 adds Prompt releases, retained-comparison approval and
explicit task-wide rollback. Shared write pause/recovery includes releases. See `evaluation-releases.md`
for current verification and API limits. The earlier checkpoint scope below is a historical record.

Current follow-up (2026-10-30): checkpoint 32 adds expert/replacement decisions and shares the write
pause/recovery with execution. See `evaluation-decisions.md`; release controls remain checkpoint 33.
The checkpoint 31 scope below is a historical record.

## Scope

Extends `/admin/evaluation` with a separate **Run evaluations** view. Inspection still performs GETs only;
entry, typing, task selection, opening scope/details and manual reference refresh never execute evaluations.
The approved paper/charcoal/orange design, existing guarded route/admin workspace and developer-shell
separation are retained. No backend, schema, dependency, terminal registry, release or expert/content decision
change. Checkpoints 32 (expert review/replacement) and 33 (release approval/rollback) remain unstarted.

Graphify-first audit followed the current evaluation controller/DTO/service/entities, judge/gate and prompt
registry. Existing synchronous POSTs are used only after exact-action confirmation:

| Action | Existing request and evidence |
| --- | --- |
| Candidate | POST `/admin/eval/candidates` with exact task/new version/full system template/changelog. New immutable draft only; no model call or release. Response must match every submitted field, draft status and UUID. There is no candidate GET/catalog; success is a validated ACK, not independent persistence lookup. |
| Shadow | POST `/admin/eval/shadow` with known task/version. Task golden cohort follows `registryTask`, including historical research/diagram aliases. Returned full runs must match task/version/mode/cohort, actor and rubric; every returned ID is read back through GET `/admin/eval/runs/:id`. |
| Regression | POST `/admin/eval/regression` over all 14 registry tasks/effective configured versions, regardless of inspection filters. Requires one unique report per supported task, validates reported cohort and aggregate result, then checks every returned full run against its report through GET. Missing production versions and uncovered tasks remain explicit failed reports. Effective prompt catalog/configuration cannot be previewed via these APIs. |
| Comparison | POST `/admin/eval/comparisons` with two distinct known versions. Confirms the exact golden cohort for each version, not a guessed call count. Validates comparison UUID/prompt IDs/cohort IDs and protected-metric summary/delta shape, then GET-checks both run cohorts/task/version/mode/hash/rubric. Comparison metadata/result are ACK evidence; no comparison GET exists. Does not promote or activate serving. |
| Compilation | POST `/admin/eval/compilations/:id` with explicit `judge:false` by default or deliberate `true`. Even false persists a new run and may check public links; true may incur provider costs. Saved run GET must match source compilation ID and saved-artifact mode. Current artifact/provenance are resolved server-side, with no invented compilation preview/version guarantee. Does not edit or publish the lesson. |

Task/version choices are entered explicitly because no prompt catalog endpoint exists. Candidate versions
follow the service's bounded semantic-version contract; existing evaluation versions need nonempty bounded
strings rather than an invented semantic-version requirement. Forms validate task, field bounds and UUIDs
before requests. Full candidate text and changelog whitespace are retained and reviewed literally.

## Confirmation and request guards

- Native modal freezes exact normalized action and checked reference scope. Full serialized payload and
  case IDs are inspectable, without HTML execution, media loading or external links. Separate fresh
  consent each time; initial focus Keep editing. Keep/Escape retain drafts and return trigger focus.
- Paid confirmation states operator-configured models/credentials, unknown cost/call count, possible
  charges despite failure, internal/user-quota distinction and extra verification/judging calls. No
  guessed provider/model selection, spend estimate, budget guarantee or production release is invented.
- Pending disables action/consent/close/overlap, blocks Escape and focuses visible pending status. Native
  dialog is explicitly centered despite the global CSS reset. Completion focus is restored after native
  close; normal cancel focus is not stolen by older feedback. Short-landscape scrolling keeps focus visible.
- Original session, auth/storage invalidation and actor/role cache guards from checkpoint 30 remain.
  Execution does fresh matching admin/reference reads before one POST and matching admin again after
  acknowledgement/run readback. Selected references must match reviewed semantics before POST; a change
  requires a new review. Candidate needs fresh account access, not golden success; other selections need
  relevant checked rubric/corpus. UI declines uncovered shadow/comparison tasks rather than presenting
  an empty cohort as useful evidence. This is a GUI selection rule, not a claimed new backend constraint.
- Shared synchronous controller lock covers lookup, reference refresh, execution and recovery; confirmation
  has an additional synchronous send guard. No automatic POST retry. Reads use 12-second timeouts; model-
  backed POST waits up to 300 seconds, other writes 12 seconds. Server work may exceed frontend timeout,
  and navigation/closed page/timeout do not cancel it. No job polling or background paid execution on entry.
- Strict minimal acknowledgement projection rejects wrong actor/IDs/task/version/mode/cohort/ownership,
  malformed reports and unexpected saved values. Optional omitted nullable judge seed in a new-run ACK
  remains unknown/null, never an inferred score. GET data remains parsed against the existing run contract.
- Run readback uses bounded groups of four GETs, at most the service-bounded cohort (comparison can return
  100 IDs). Semantic fingerprints sort JSON object keys while preserving array order, so JSONB key ordering
  does not create false uncertainty; changed artifact/context/source/status/evidence/seed still fails.
- Run persistence confirmation is separate from quality. Completed status does not erase failed checks,
  and regression/comparison failures remain visible. Report/comparison metadata still comes from the ACK;
  this UI does not independently reconstruct release eligibility or claim a comparison-record readback.

## Uncertainty and recovery

Every sent failure, including 4xx/network/ACK/readback failure, pauses further writes. A failed preflight
before POST reports that no execution was sent. Fixed messages do not expose operator secrets or raw errors.
Known run IDs are retained only after a valid ACK; malformed/absent ACKs may leave no discoverable IDs.

GET-only recovery checks original admin access, both reference resources and any known run IDs without
repeating a write. Failed checks stay paused. Checked state remains read-only until an explicit separate
acknowledgement that earlier writes/charges may remain unknown, followed by “Use checked references and
resume”. Resumption adopts checked references, preserves per-action drafts and focuses the retained earlier-
request warning. Unknown IDs/absence of a list or candidate/comparison GET cannot establish that nothing
was saved or charged. An earlier server request may still finish after any check or resumed action.

Drafts survive action/view changes and transient reference failures because execution stays mounted when
inspection changes. Results and recovery state stay local; reference cache remains actor scoped. Result
runs have six-item paging, heading focus and explicit saved-evidence inspection through the existing run
view. No optimistic success, atomic snapshot/conditional write, exactly-once outcome, provider cancellation,
cross-tab lock or remount-persistent pause is promised. Reloading is not proof the earlier request stopped.

## Verification and limits

- Final full frontend suite: 651 tests across 17 files, clean exit; 24 new execution checks. Focused
  evaluation/execution run: 44 passing. All five action successes, exact bodies/timeouts, immutable ACKs,
  cohort aliases, regression missing versions, judged/unjudged compilation, malformed IDs/fields/evidence,
  account/token/reference drift, 4xx/network/partial failures, readback changes, JSONB ordering, unknown/
  known-ID GET-only recovery, synchronous shared/send locks, draft retention, consent, pending Escape and
  explicit adoption covered with mocks. No live provider/API operation is asserted by these tests.
- Final standalone TypeScript, touched ESLint, theme-token check, `git diff --check` and fixture-free
  production webpack build pass. One existing unused test-variable lint warning in this checkpoint's
  touched set; no introduced warnings/errors. Existing multiple-lockfile build warning remains. Backend,
  dependency and terminal files unchanged; earlier dirty work preserved. No staging/commit/push/PR/publish.
- Labelled disposable actual-view browser QA: desktop 1280×720, phone 375×812, tablet 768×1024 and landscape
  812×375, light/dark. Checked validation/focus, exact candidate source including inert script text,
  per-action/view/reference-failure draft retention, safe initial focus/Keep/Escape/trigger return, all
  five confirmation types and judged/unjudged consequences, case counts, explicit consent/local success,
  result focus, pause/failed check/check/adopt/retained warning and disabled controls. Pending sample held
  its native modal through Escape with visible waiting focus, then only the disposable sample was reloaded.
  Short-landscape confirmation-button focus remained visible. No checked horizontal overflow or browser
  warning/error. UI callbacks and records were local samples; no real API/evaluation/provider/content/
  account/progress/billing/expert/replacement/release operation was performed.
- Browser success/uncertainty/pending samples are simulated; real operator configuration/permissions,
  database persistence, paid execution latency/costs, partial results/late outcomes, real compiled content,
  high-volume evidence, cross-tab/concurrent behavior, actual preferences/navigation, screen readers and
  OS reduced-motion behavior remain manual acceptance. No claim of backend/API production readiness.
- Sample/dev cache removed, owned tab closed, viewport reset, light restored, server stopped and port3211
  confirmed closed. Build includes `/admin/evaluation` and no sample route. Review images:
  `/home/yaswanth/.codex/visualizations/2026/10/30/source-dev-evaluation-execution-confirmation.jpg`
  and `source-dev-evaluation-execution-recovery.jpg` (local only).

Stop for visual review. Next: checkpoint 32, expert review and question replacement decisions.
