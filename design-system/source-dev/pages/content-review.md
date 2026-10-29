# Content review — checkpoint 26

Completed 2026-10-29. Route: `/admin/content-review`. The user authorized this checkpoint
only. Checkpoint 27, the remaining admin surfaces/API-parity audit, remains unstarted.
All work stays local and earlier dirty checkpoints are preserved. No backend, schema,
migration, dependency, terminal-command, staging, commit or publishing changes.

## Review workspace

Uses the approved orange, paper and charcoal admin workspace, Inter/Lucide, an original
finite paper/check vector, scoped styles, native controls, visible focus, 44px targets
and reduced-motion handling. Checked totals cover queued lessons, submitted roadmaps and
overdue deletion schedules. Loading/failed/unavailable data remains unknown, not zero.
Lessons, Roadmaps and Maintenance are explicit button-selected views. All displayed dates
are UTC and describe checked state; no polling, realtime countdown or automatic retry is added.

The complete lesson queue is ordered by lesson creation time, with local title/author search,
AI/handwritten and new/staged filters and six-item paging. Submission dates are not reported.
Native disclosures expose author/context, all placements, previous feedback, the full current
body, and the complete staged body including an empty string. No 3,000-character clipping.
Source is the default; explicit Preview reuses the existing safe Markdown renderer, including
HTML suppression, code, tables and opt-in external images. Queue responses do not include
stored media records; diagram references needing those records can remain unavailable here.
Inline diagram fences use the existing renderer. No learner reader/start/completion or paid
provider operation is invoked by review entry or preview. Source/preview have labelled,
focusable scroll areas. The administrative answer key shows the currently saved questions,
options and marked-correct flags without sending attempts or editing them. Missing/multiple
correct flags are review information, not a new approval hard gate. Approving text does not
replace the question set.

Roadmap views cover submitted, published, requested/approved takedowns, scheduled deletion,
draft/effectively private and all records, with local search and paging. Open review loads
a fresh module/lesson rollup before exposing actions. Publication readiness mirrors the
current backend review contract exactly; the GUI does not reintroduce submission structure
minimums. Counts describe lesson placements, and staged drafts are separate from the module's
status-only approval rollup. Publishing does not clear removal schedules. Dates distinguish
stored publication from an elapsed takedown or overdue deletion; an approved countdown is
not described as an immediate takedown, nor a schedule as completed permanent deletion.

Actions preserve the existing API semantics: approve/reject a lesson; publish/reject a
submitted roadmap; unpublish now; approve an author takedown request; close a pending request
or active countdown; schedule deletion; cancel a schedule; and purge overdue roadmaps.
Rejection of staged text clears it while keeping the current body and prior review status,
including the pending-plus-draft edge case. Rejection without a draft marks the lesson
rejected. Shared lesson decisions apply across placements. Cancelling overdue deletion
can restore public access if the roadmap is otherwise published, which the confirmation
explains. Backend notification emission is retained; the GUI does not claim delivery.

Maintenance shows all overdue schedules at the last check. Purge confirmation identifies the
reviewed titles/dates, states global scope across filters and roadmaps becoming due before
server processing, describes permanent module/placement removal and possible partial failure,
and requires a separate scope checkbox. Shared lesson rows are not deleted by this endpoint.
The confirmation never promises an exact atomic set or count.

## Confirmations, feedback and recovery

Every decision uses a native modal with exact content identity and consequences. Initial focus
is Keep reviewing or Keep scheduled roadmaps; Escape/cancel sends no action and returns focus
when the trigger remains mounted, otherwise to feedback. Reject requires trimmed feedback of
1–2,000 characters. Empty submission focuses the linked invalid field. Feedback drafts are
kept per lesson/roadmap in page memory, including after cancellation or failure; they are not
persisted or put in a mutation cache. Hidden/unmounted views lose this local state.

Processing uses a synchronous busy ref and disables overlapping actions and modal close/cancel
while awaiting a checked result. Status/error feedback inside the modal receives focus and
remains visible in narrow/short layouts. An explicit decision completion version closes the
modal after success even when successive success messages are identical. Ordinary refresh
feedback does not close a new confirmation. No optimistic queue/count changes are made.

Ambiguous results pause moderation actions. Check current state uses GETs only and never
repeats the earlier decision. Failed checks keep the pause; successful checks stage the
observed state until explicit Use checked queue & resume. An earlier-request warning remains
after adoption. Queue absence is not inferred to mean approval or deletion; recovery reports
the saved lesson status/draft or roadmap/schedule actually read. Purge recovery describes
absence from the checked list without claiming a complete purge or causal exact count.
The pause is local to this mounted page and can reset on navigation. Closing/reloading cannot
cancel an accepted server request. No atomicity, idempotency, cross-tab lock, snapshot consistency,
conditional-write, remount persistence or exactly-once guarantee is claimed.

## Existing API contract and guards

- GET `/users/me`, `/admin/content-review/pending`, `/roadmaps`, `/roadmaps/:id/review`,
  `/roadmaps/:id`, and `/concepts/:id`. PATCH `/admin/content-review/:id/approve|reject`
  and `/admin/content-review/roadmaps/:id/{publish,reject,unpublish,approve-unpublish,
  deny-unpublish,schedule-delete,cancel-scheduled-delete}`. DELETE
  `/admin/content-review/roadmaps/purge-deleted`. No new endpoint.
- Fresh matching admin checks bracket entry/detail reads. Reads are timed/abortable; original
  session guards, account/role query keys, fresh mount checks, same-tab auth and cross-tab auth
  storage handling hide private bodies, answer keys and shell account data when unavailable.
  An initial failed/refetching query hides old values. A failed ordinary manual refresh can
  retain the explicitly last-checked snapshot; a new decision still performs fresh preflight.
- Projections retain only displayed review metadata, bodies, placements, question keys and
  roadmap state. Author emails, raw user relations, provider/teacher persona data and nested
  roadmap entities are discarded. Malformed/duplicate IDs, flags, counts, dates or mismatched
  report identity/readiness fail the check. Text is bounded at two million characters per field;
  oversized data fails rather than being silently truncated. Raw errors are replaced by fixed
  safe messages. No mutation cache retains transport objects or backend payloads.
- Each decision freshly checks the full library and actor. Lessons compare complete source,
  draft, metadata, placements, author and saved question/option flags. Roadmaps compare the fresh
  row and module review report, with endpoint-aligned action eligibility. Rejection feedback is
  checked before requests. Changed/missing targets stop before the write.
- Roadmap review GET may apply the backend's existing lazy normalization of an elapsed takedown.
  The row is read afterwards and the report must agree with it. This is existing server behavior,
  not a newly added scheduled job or moderation PATCH. GET-only recovery avoids that review GET.
- One explicit PATCH/DELETE follows preflight. Every sent-write failure is treated as uncertain,
  including 4xx; purge can partially complete and review paths can normalize dates. Exact projected
  acknowledgement plus fresh saved body/row and refreshed queue/library checks precede success.
  Reviewed actor/time/reason fields and unchanged body/identity/schedules are checked as applicable.
  New schedule acknowledgements must be approximately 30 days ahead (one-day clock tolerance).
- Purge rechecks the reviewed overdue set before sending, validates a nonnegative integer server
  count, checks reviewed roadmap lookups are absent and refreshes the library. The server still
  acts globally at processing time; concurrent arrivals/clock differences can change its set.
  Success labels the server-reported count separately from the reviewed targets' checked absence.
  Related admin/content/roadmap caches are invalidated without automatic refetch after success.

Server wrapper/client leaf preserves the Next boundary. The classic review page is exact apart
from its export and keeps legacy chrome in CLI appearance, with a same-route return to GUI.
GUI owns its admin frame. Sidebar, dashboard queue and notification links now recognize the GUI
review destination; explicit admin CLI handoffs retain saved learner location. Backend permission
checks remain authoritative; frontend preflights cannot eliminate races after the final read.

## Verification and remaining manual work

550 frontend tests across 17 files pass, including 28 new moderation cases and two deliberately
updated navigation expectations. The final 30 matching checks passed again after copy/style
refinements. Coverage includes minimal/complete projection, empty staged text, answer keys,
malformed/duplicate data, publish readiness without structure gates, effective dates, local
filters, timed/abortable admin checks, review-before-row ordering, session/role changes, each
lesson and roadmap action, selected body/answer-key/context changes, acknowledgement/readback,
partial purge, changed global candidates, safe errors, recovery/adoption, duplicate blocking,
private-cache hiding, feedback retention, scope checkbox and classic-mode isolation.
Standalone TypeScript, touched-file ESLint, theme guard, whitespace/classic/source comparisons
and final fixture-free webpack production build pass. Four baseline lint warnings remain
(three unused admin-layout imports and one unused test variable), plus the existing multiple-
lockfile build warning. Backend/terminal/dependency comparisons are unchanged; backend tests
were not run because backend source is unchanged.

A labelled disposable sample used the actual view/shell and local in-memory callbacks, without
an auth bypass of the real route or API reads/writes. Browser checks covered desktop, 375 × 812,
768 × 1024 and 812 × 375, light/dark, full source/Markdown/answer key, search/origin/staged filters,
paging, blank reason validation/focus, retained reason after cancel/Escape, default/return focus,
sample rejection/staged approval, roadmap blocked/ready states, publication/schedule consequences,
global purge scope/checkbox/sample feedback, empty/loading/read-error/pending/paused/recovery,
explicit adoption and retained warning, mobile menu focus, long names/titles, visible phone error
focus and short-landscape safe focus. A simulated pending dialog kept actions/cancel disabled;
reloading reset only that disposable sample. Narrow select text was refined and rechecked.
No final page/card/dialog horizontal overflow or console warnings/errors were observed.
No real moderation/account/notification/provider/progress/billing operation was performed.
Service behavior is mocked, not signed-in API proof.

Live role/visibility enforcement, exact staged-body/publication/schedule outcomes, notification
delivery, purge cascades/shared-content retention, partial writes, concurrent reviews/late requests,
clock skew, preference and actual GUI/classic/CLI navigation, stored media, screen readers and
OS reduced motion remain manual. Sample/server/tab were removed, viewport reset, light theme
restored and port3211 confirmed closed. The final build contains no sample route.

Review images (1265 × 712, local sample):
- `/home/yaswanth/.codex/visualizations/2026/10/29/source-dev-content-review.jpg`
- `/home/yaswanth/.codex/visualizations/2026/10/29/source-dev-content-review-queue.jpg`

Stop for visual review before checkpoint 27.
