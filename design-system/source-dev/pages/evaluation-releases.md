# Prompt release controls — checkpoint 33, completed 2026-11-02

## Scope and audited contract

**Prompt releases** inside `/admin/evaluation` adds explicit comparison approval and task-wide rollback.
Existing admin authorization, server-wrapper/client-leaf structure, warm paper/charcoal/orange GUI,
developer-shell behavior and learner location remain. No backend, schema, dependency, terminal registry,
operator environment or live release changes. Graphify CLI guided targeted current controller/service,
DTO/entity, comparison gate and registry reads before implementation.

| Action | Existing contract and GUI proof |
| --- | --- |
| Approval | POST `/admin/eval/comparisons/:id/promote` with `{}`. Backend locks baseline/candidate prompt rows; verifies current production baseline/task/status, current golden corpus, run/prompt/artifact fingerprints and auditable source/judge evidence; recomputes deterministic/golden/judge gate. In one transaction revokes prior approved task releases and saves a new approved release. GUI checks the exact returned comparison/task/prompt IDs, baseline/candidate/corpus hashes, status, actor, timestamps and release UUID, then freshly checks matching admin. No release GET exists: checked response only. |
| Rollback | POST `/admin/eval/tasks/:task/rollback` with `{}`. Backend revokes **all** currently approved releases for the task and returns `{task, baselineRestored:true}`, including when there were no approved rows. It does not choose a historical release, rewrite baseline/configuration or report a changed count. GUI validates exact task/true acknowledgement and fresh account; active serving cannot be read back. |
| Serving | Approval alone is insufficient. Registry needs opt-in selection enabled, a selected per-task candidate and approved release matching current production baseline ID, candidate ID/text hashes and current corpus; archived/missing/mismatched candidates are refused in favor of unchanged production baseline. GUI does not expose configuration editing or claim which prompt is active. Rollback affects future resolutions and does not cancel in-flight generation. |

## Evidence availability and preflight

There is no comparison, prompt catalog, release or serving-status GET/controller listing. Approval therefore
uses **the latest successful checked comparison response retained from Run evaluations in this mounted
workspace**, including a comparison whose quality report failed. It is retained independently from later
non-comparison execution results. A new checked comparison replaces it and invalidates prior checked
approval. Entry does not execute a comparison, spend provider quota or write a release.

No source means an explicit empty state. Arbitrary historical comparison IDs cannot be safely previewed
here; no fake lookup, manual unverified JSON import, active-release list or automatic paid rerun is added.
Remounting loses the retained response. Existing APIs remain available outside this GUI; backend read
API expansion would be separate authorized work. The missing lookup is an API limitation, not a claim
that stored historical comparisons do not exist.

An explicit **Check comparison runs and references** performs GETs only:

- Fresh matching admin/role and original token, fresh rubric/goldens, semantically identical reviewed
  references, every known run GET in groups of four, exact UUID/actor and original projected evidence.
- Full source/action/response/cohort shape revalidated; registry aliases and complete expected golden IDs,
  separate baseline/candidate versions/modes, prompt/corpus/rubric fingerprints and no cross-cohort IDs.
- Observed gate recomputes completed/judged cohort coverage, generator/judge/models/prompt/rubric/seeds,
  deterministic/golden pass rates, every protected baseline check and all four judge dimensions. Result,
  failures, summaries and deltas must exactly match the retained comparison report. Object key order
  is canonicalized; array meaning retained. Failed/mismatching evidence cannot be approved.
- Human-readable baseline/candidate/change table, individual checks, full fingerprints/response and
  explicit per-run literal evidence inspection. Non-regression can pass with the same failures in both
  versions: no absolute quality, learner-outcome or final backend eligibility claim.
- Approval repeats current account/reference/run preflight immediately before one POST and checks that
  confirmation still matches retained checked source. Backend alone can revalidate prompt status/current
  baseline, raw judge/source evidence and transaction-time eligibility. No UI concurrency-isolation claim.
- Rollback requires an explicit allowlisted task, checked account and full task-wide confirmation. It
  does not fabricate a prerequisite read of unavailable release state or require irrelevant corpus data
  to send a valid rollback. Shared recovery still checks current reference data before later resumption.

## Confirmation, uncertainty and privacy

Native dialog freezes comparison/task/version or task-wide rollback scope and exact `{}` request payload.
Approval explains replacement of prior task approvals and configuration/fingerprint-dependent serving.
Rollback explains all currently approved releases, including concurrently created ones, unknown affected
list/count, unchanged baseline/configuration and no in-flight cancellation. No automatic mutation on view,
field entry, inspection, view switch, details opening or reference refresh.

Fresh explicit consent per opening; initial focus Keep reviewing, Escape/Keep restore trigger and draft,
reopen at top to show full heading. Pending disables close/Escape/duplicate/overlapping writes and focuses
the visible waiting message. Results/errors focus after native close. Rollback selection and retained
source stay mounted across evaluation views and transient reference errors; unchecked private data hides
when current access/references fail. Auth/storage/token/role changes hide all private workspace evidence.
Literal evidence never executes HTML/Markdown or fetches embedded media; private returned account/entity
objects are projected away. Errors use fixed safe copy rather than raw server exception payloads.

One synchronous lock and shared pause covers execution, expert decisions, replacement and release
operations. Every sent failure, including HTTP conflict, timeout, malformed ACK and post-write account
failure, pauses writes. 12-second writes/reads can time out after server completion. No automatic replay,
optimistic active-state update, polling, cancellation, exactly-once or cross-tab/remount lock guarantee.

**Check without replaying** checks current matching admin/references and known run IDs from an approval
(or no run IDs for task rollback). It performs no release POST or invented status GET. Failed checks
stay paused. Success only stages checked references; a separate unknown-outcome acknowledgement and
explicit adoption resumes writes, invalidates checked approval, and retains/focuses an earlier-request
warning. Neither run success nor a successful read-only check determines whether approval/revocation
completed or which prompt is serving. An earlier request can still finish and race with later actions.

## Verification

- **694 passing frontend tests across 17 files**, clean exit, including all terminal regressions and
  20 new release tests. Success/blocked gate/summary inconsistency, full cohort/run/corpus/ownership
  drift, exact approval/rollback ACK, conflict/timeout/malformed responses, original/late token changes,
  GET-only recovery/failed recovery, independent drafts/frozen consent, stale confirmation, retained
  source and shared lock/pause/adoption covered with mocks. No backend changed; backend suite not run.
- Standalone `npx tsc --noEmit --incremental false`, touched-file ESLint, GUI color-token check,
  `git diff --check` and fixture-free `npm run build -- --webpack` passed. ESLint retains the existing
  unused `h` warning at `roadmaps.test.mjs:399`; build retains the existing multiple-lockfile warning.
  Production routes include `/admin/evaluation` and no disposable release preview.
- Final logs, recreated and checked on 2026-11-02: `/tmp/source-dev-checkpoint33-tests-final.log`,
  `/tmp/source-dev-checkpoint33-typecheck-final.log`, `/tmp/source-dev-checkpoint33-lint-final.log`,
  `/tmp/source-dev-checkpoint33-build-final.log`. Earlier temporary logs were unavailable after the
  interruption; the current full run supplies the final command evidence.

Labelled disposable actual-view/shell browser sample used local callbacks only on 2026-10-30, with final
pending-state checks completed on 2026-11-02:

- Desktop 1280×720 light, phone 375×812 light/dark, tablet 768×1024 dark, short landscape 812×375.
  Empty retained-source state, gate block, metrics/individual checks/fingerprints/run source, exact scope,
  task-required validation, literal script text, draft retention across view/reference failure.
- Fresh consent, initial Keep/Escape/trigger focus, local approval and rollback success/result focus,
  original-read failure, preflight drift, sent timeout, failed recovery, staged check/adoption/warning focus.
- Pending disables Keep/submit/consent; Escape cannot close; visible waiting message receives focus.
  Short landscape controls remain reachable. Checked layouts had no horizontal overflow; local browser
  tab reported no warning/error. OS reduced motion and screen-reader announcements remain manual.
- Disposable route/dev cache removed, owned preview tab closed, viewport reset, light restored, verified
  local preview process stopped and port3211 closed. No live account/comparison/provider/release/content/
  progress/billing operation or Git staging/commit/push/PR/publish. Earlier dirty work preserved.

Local screenshots (2026-10-30, not live serving/API proof):

- `/home/yaswanth/.codex/visualizations/2026/10/30/source-dev-prompt-release-approval.jpg`
- `/home/yaswanth/.codex/visualizations/2026/10/30/source-dev-prompt-release-recovery.jpg`

Live authorization, DB transaction/locking, server raw-judge revalidation, actual operator selection/
serving/corpus drift, concurrent/late outcomes, in-flight behavior, real data scale/latency/preferences/
navigation and assistive technology remain manual. This completes the planned implementation sequence
through checkpoint 33; stop for visual review and separately authorized live acceptance.
