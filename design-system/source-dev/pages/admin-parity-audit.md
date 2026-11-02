# Remaining admin API parity — 2026-10-29

Graphify-first inventory, followed by the current terminal registry and backend controllers/services.
No new backend, schema, dependency or terminal command is needed for checkpoint 27.

| Surface | Existing contract and GUI coverage | Checkpoint / next step |
| --- | --- | --- |
| Jobs | GET active and results are requester-scoped, even for admin; unread results newest-first capped at 20. GET known ID allows owner/admin. POST acknowledgement is owner-scoped; omitted/empty IDs acknowledge all unread results. Developer generation GUI already covers its own jobs. | 27: `/admin/jobs`, own lists, arbitrary known-ID admin inspection, explicit one-owned-result acknowledgement. No platform-wide listing/history/cancellation/retry/start promise. Bulk acknowledgement intentionally remains CLI-only. |
| Articles | Public GET list/detail; admin DELETE `/articles/admin/:id` requires author-facing reason. Existing public reader and own-author GUI are complete. PATCH allows author/admin; the existing editor was verified to support another author or an orphan as admin, with immediate public save and preserved authorship. | 28 implemented: `/admin/articles`, full current source, reasoned admin deletion, fresh admin/version preflight, uncertain-write recovery and existing reader/editor handoffs. No live deletion or notification delivery tested. |
| Analytics | GET `/admin/analytics/{overview,roadmaps,concepts,developers}`. All four are already represented in the admin dashboard with read-only guards and backend-aligned labels. | 29 complete: sidebar opens `/admin/dashboard#admin-analytics` at the existing roadmap analytics section, without a CLI badge. No duplicate analytics page required; CLI commands retained. No time series, spend/cost, retention or CSV endpoint exists here. |
| Discussion moderation | Concept-scoped discussion GET, admin edits/deletes questions/answers, verify/unverify answers. No global moderation queue or by-ID question GET in the controller. Existing lesson discussion GUI covers these contextual operations. Private AI threads are asker/admin only, reject human replies and have no AI-answer verification. Admin can edit answered questions and saved AI text. | 29 implemented: retain contextual route, add content-review placement handoffs, actor/session cache guards, non-ask saved readback and explicit uncertain-write recovery. No global route invented. See `discussion-moderation.md` for direct-endpoint visibility caveat and live-test limits. |
| Evaluation | Admin GET rubric/goldens/run-by-ID. POST candidates, shadow, regression, comparison, promotion, rollback, compilation evaluation, expert review. Question psychometrics GET/replacement POST also exist. No run-list controller endpoint. Shadow/judging may incur provider charges; promotion/rollback affect serving behavior. | 30 implemented: read-only `/admin/evaluation` rubric/golden/known-run/question-metric inspection. Full DTO/service/registry audit in `evaluation.md`; 31 implemented: explicit candidate/shadow/regression/comparison/compilation execution with confirmation, run GET readback and paused recovery (`evaluation-execution.md`). 32 implemented: anchored expert reviews and current-question replacements with shared write pause (`evaluation-decisions.md`). 33 implemented: retained comparison approval and explicit task-wide rollback with serving/configuration and ACK-only limits (`evaluation-releases.md`). No global runs/comparison/release browser or mutation on read. |
| Keys/quota | Admin terminal exposes the signed-in account’s keys/quota; developer provider-key and generation GUIs already cover these, including admin actor roles. | Reuse developer workspace; do not present account settings as platform provider administration. |

Current jobs semantics verified in `ai-generate.service.ts` and controller, article/analytics/eval/Q&A routes verified in their controllers. This audit describes API availability, not live permissions or successful real operations. Discussion service review is complete in checkpoint 29; evaluation services still need deeper review when checkpoint 30 starts.

2026-10-30 checkpoint 28 follow-up: article service inspected through Graphify-guided targeted reads. Notification attempt precedes removal and skips own/missing author; every sent failure is treated as uncertain in the GUI. See `admin-articles.md` for verification and remaining live-test limits.

2026-10-30 checkpoint 29 follow-up: contextual Q&A service/UI parity and remaining Analytics navigation
review completed. Admin remains in the developer shell when entering lesson discussion. Existing backend
edit/delete/verify methods do not explicitly invoke the shared concept-visibility predicate; GUI fresh
visible-placement/concept checks do not establish direct-endpoint parity. No backend change or live
moderation/provider operation. See `discussion-moderation.md`; evaluation remains unstarted.

2026-10-30 checkpoint 30 follow-up: evaluation service/DTO/entity/judge/psychometrics/registry audit
complete. Admin terminal has no evaluation commands. No run list or prompt/comparison/release/expert-review
GET. Promotion records an approved release, while serving additionally requires matching opt-in config,
hashes and corpus; rollback revokes releases without rewriting baseline/config. Even unjudged compilation
evaluation persists a run. Question replacement retires the old item and resets the shared concept to
pending review. These writes remain distinct checkpoints 31–33. Inspection GUI is complete; no live
provider/evaluation/release/content operation or backend change. See `evaluation.md`.

2026-10-30 checkpoint 31 follow-up: explicit candidate and evaluation execution UI implemented inside
`/admin/evaluation`; inspection stays GET-only. Candidate/comparison metadata remain ACK-only; returned
runs are independently GET-checked. All sent failures pause writes, read-only checks never replay them,
and unknown partial outcomes remain explicit. Native exact-scope consent and explicit checked-reference
adoption preserve earlier-request warnings. No live provider/write/release action or backend/API change.
See `evaluation-execution.md`. Expert/replacement decisions and release controls remain 32–33.

2026-10-30 checkpoint 32 follow-up: expert review and question replacement implemented in the separate
Expert decisions view. Original evidence/anchors, complete replacement/key/metadata and all-placement
pending-review consequences are confirmed explicitly. Expert review ACK-only; replacement successor,
version/predecessor, old-current absence and shared pending state GET-checked. One lock/shared pause
covers execution and decisions; recovery never replays unknown writes. No real content/review/provider
operation or backend change. See `evaluation-decisions.md`. Only checkpoint 33 release controls remain.

2026-11-02 checkpoint 33 follow-up: Prompt releases implemented in `/admin/evaluation`. Approval is
limited to the latest checked comparison response retained in this mounted workspace because the API
has no comparison/release/serving GET. Explicit current run/reference GET recheck, protected-metric
observations and server-authoritative approval; task-wide rollback preserves baseline/configuration.
Both responses remain ACK evidence. One shared lock/pause/recovery covers all evaluation writes; no
release-state inference or automatic replay. No live release/provider write. See `evaluation-releases.md`.
All planned GUI checkpoints now have implementations; visual review and authorized live acceptance remain.
