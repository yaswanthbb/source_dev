# Expert review and question replacement — checkpoint 32, 2026-10-30

Current follow-up (2026-11-02): checkpoint 33 adds Prompt releases, retained-comparison approval and
explicit task-wide rollback. Shared write pause/recovery includes releases. See `evaluation-releases.md`
for current verification and API limits. The earlier checkpoint scope below is a historical record.

## Scope and contracts

Adds **Expert decisions** inside `/admin/evaluation`. The guarded admin route, approved warm
paper/charcoal/orange design, developer-shell separation and learner location are retained. No backend,
schema, dependency, terminal-registry or release-control changes. Checkpoint 33 remains unstarted.
Graphify CLI was used before targeted reads of the current evaluation, quiz, concept and psychometrics
controllers/services/DTOs/entities and event hooks. Existing inspection/entry remains GET-only.

| Flow | Existing API and evidence |
| --- | --- |
| Expert original | GET current rubric/goldens and known `/admin/eval/runs/:id`, with matching fresh admin before/after. Full saved evidence is literal. Only a run with the current matching rubric can be scored; no substitution for historical anchors. Reference goldens are read alongside the rubric but not required for this submission. |
| Expert decision | POST `/admin/eval/runs/:id/expert-reviews`. Independent explicit 1–5 integer scores for all four dimensions; approve/edit/reject, reason up to 2,000 characters, allowed unique codes (required for edit/reject), proposed revision required for edit and bounded to 60,000. Full matching UUID/run/actor/rubric/reason/codes/scores/revision ACK projected. No expert-review GET/list exists: response evidence only, never an independent persistence claim. Proposed text does not apply a content edit or approve prompt serving. |
| Replacement original | Explicit concept/current-question IDs. GET `/concepts/:id`, `/concepts/:id/questions` and `/eval/questions/:id/psychometrics`; exact concept membership, full text/key/options, current-list membership, version/predecessor and metrics/option consistency required. No question-by-ID detail/global catalog invented. Only admin GUI access is added, although replacement service also permits concept authors. |
| Replacement decision | POST `/eval/questions/:id/replacements`, complete text/options/key/metadata/reason. 2–12 options with exactly one correct answer; sequential option order. Parent position sent and preserved by service. Distractor misconception/rationale excluded from the correct key. Reason up to 1,000; text/rationale fields have a clearly labelled 60,000-character GUI bound where the backend declares no length maximum. No fabricated lint/verifier input. |
| Replacement result | Strict successor ACK: actor, different ID, same concept/position, predecessor, next version, unretired status, exact text/options/metadata and expert-replacement provenance. Lint/verification results must be null. GET successor current-list text/options and metrics version/predecessor; original absent from current list and shared concept pending checked separately, plus fresh admin. These reads do not guarantee unchanged concurrent state or prove historical retention through a separate history API. |

The current question-list projection **omits original Bloom level, intended difficulty, correct rationale,
retirement field and version**. Version/predecessor come from metrics, current membership from the list.
Missing metadata is never invented or silently copied: optional form fields describe the new version,
blank values become unrecorded, and the consequence is explained before editing. The backend transaction
creates the successor, retires the original and resets the shared concept review state. Existing attempts
are not deleted by this audited method; no history browser or independent retired-record GET is invented.
Concept placements come from the existing concept-detail response and are rendered as plain text.

## Confirmation and guards

- A known original must be checked before a decision form appears. UUIDs, array identity, timestamps,
  membership, option/key consistency and observed versions are validated. Extra account/entity fields
  are discarded. Literal artifact/context/source/question/revision never execute HTML/Markdown or
  fetch media. Errors use fixed safe copy rather than backend/raw exception payloads.
- Full reviewed record fingerprints compare rubric/run evidence or question/concept/placements/metrics
  before the POST. Object key order is canonicalized; arrays retain meaning. New attempts/observations,
  text/key/version/placement/status or access changes require rechecking. No automatic rebasing/sending.
- Native dialog freezes original target and exact serialized payload, with fresh explicit consent.
  Replacement explains old→new version, retirement, unchanged position, cleared lint/verifier evidence,
  shared pending review and possible non-author/non-admin access loss across **all** placements.
- Initial focus Keep editing; Escape/Keep preserve drafts and return trigger focus. Each opening resets
  retained dialog scroll to show its complete heading. Pending disables close/Escape/duplicate submits
  and focuses the visible waiting message. Result/error focus is restored after native dialog closes.
- Scores start empty; full recorded-version anchors are next to each radio. Linked error summary and
  inline errors retain fields. Option count/key controls are native; no default key or invented score.
  Review/replacement drafts remain independent and mounted across evaluation views/reference failures.
- Original token captured by controller and passed through every preflight/read/write; fresh matching
  admin account/role before/after reads and settled writes. Auth/storage/denied changes hide private
  evidence/drafts by unmounting the view. Existing actor/role reference-cache/fresh-mount gating remains.
- One synchronous lock covers reference refresh, inspection, execution, decisions and recovery. All sent
  failures (including HTTP 4xx, malformed ACK and failed readback) cause one shared evaluation write pause.
  No automatic replay, optimistic success, polling, provider operation, cancellation or exactly-once claim.
  12-second decisions/reads may time out after a server write completes. Lock/pause are mount-local.

## Recovery

Shared **Check without replaying** is available in execution and decisions. It checks fresh matching admin,
current references and known records for whichever action caused the pause, without another POST.
Execution still GET-checks known run IDs. Expert recovery can only check the original run; saved review
status remains unknown because no GET exists. Replacement recovery checks current-list membership and,
when a fully validated ACK supplied a successor ID, that current successor/predecessor. Without an ID,
original absence cannot identify which request changed it; original presence cannot prove failure because
an earlier request may still finish. Failed checks stay paused. Checked references are staged until a
separate uncertainty acknowledgement and explicit adoption. Earlier request warnings persist after resume;
no recovery read can cancel earlier work or exclude duplicates. No automatic retry across tabs/reloads.

## Verification

- Full frontend suite: **674 passing tests across 17 files**, clean process exit, 23 new checkpoint
  checks. Includes all terminal regressions; backend tests were not run because no backend changed.
- New tests cover explicit score/code/reason/revision validation, option count/key/metadata, original
  membership/identity/key consistency, rubric/run/metrics/concept drift, exact success ACK, successor
  readback, no invented review GET, sent 4xx/timeout/ACK/read failures, known/unknown-state recovery,
  original/late session replacement, retained forms/linked errors/frozen confirmation/fresh consent,
  shared synchronous lock/pause, failed recovery and separate adoption. Existing recovery UI regression
  updated for the shared component without removing its separate consent coverage.
- Standalone `npx tsc --noEmit --incremental false`, touched-file ESLint, GUI token check,
  `git diff --check` and fixture-free `npm run build -- --webpack` passed. ESLint has one existing
  unused `h` warning at `roadmaps.test.mjs:399`; build retains the existing multiple-lockfile warning.
- Logs: `/tmp/source-dev-checkpoint32-tests-final.log`, `-typecheck-final.log`, `-lint-final.log` and
  `-build-final.log` (all with the same `/tmp/source-dev-checkpoint32` prefix).

Labelled disposable local actual-view/shell sample with local callbacks only:

- 1280×720 light, 375×812 light/dark, 768×1024 dark and 812×375 dark checks. Full anchors, independent
  scores, required fields/key, literal original/proposed text, exact payload and shared-placement warning.
- Keep/Escape/fresh consent, trigger/result/waiting/recovery/adoption-warning focus; original-read failure,
  preflight drift, local success, sent timeout, failed recovery, staged check/explicit adoption and pending
  controls/Escape. Form drafts retained across view and reference failures; phone native navigation/theme.
- Retained confirmation scroll clipping was found and fixed in decision/execution opening effects.
  Checked layouts had no horizontal overflow; the local tab reported no browser warning/error.
- Sample route and generated dev cache removed; preview process stopped, port3211 closed, owned tab
  closed, viewport reset and light appearance restored. No real account/content/review/replacement/
  evaluation/provider/progress/billing/release/Git publishing operation. Prior dirty work preserved.

Screenshots (local samples, not live API proof):

- `/home/yaswanth/.codex/visualizations/2026/10/30/source-dev-evaluation-decisions-replacement.jpg`
- `/home/yaswanth/.codex/visualizations/2026/10/30/source-dev-evaluation-decisions-recovery.jpg`

Live authorization, database persistence/version transactions, concurrent editor/late outcomes,
content visibility across real placements, real data scale/latency, account preferences/navigation,
screen-reader announcements and OS reduced-motion behavior remain manual. Backend semantics were
read and mocked, not exercised against live content. Stop for visual review before checkpoint 33.
