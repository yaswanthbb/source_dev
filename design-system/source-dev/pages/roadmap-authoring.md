# Roadmap authoring — checkpoint 13

Route: `/developer/content/[roadmapId]`. Approved master palette, Inter, Lucide,
warm paper/charcoal and consistent orange. Uses `GuiWorkspaceShell`, `GuiFeedback`,
the appearance provider and existing account/API/query utilities. No dependency or
backend changes. The UI styling and UI/UX skills inform hierarchy, responsive layout,
native forms, linked validation and focus; generated palette suggestions do not
override the approved master.

## Composition and scope

- Original finite connected-route vector follows the module/lesson motif. Hero names
  the real roadmap. Last-checked label and explicit refresh, no ticking countdown.
- Main module outline, real lesson status/origin/pending-draft/review feedback and
  own-lesson attachment search. Side panel describes review/publication. The panel
  stacks below the outline on smaller screens; phone module headings get their full
  column and an attach button on the next row. Controls at least 44px; native scroll.
- New modules append after the maximum actual order index. No generated lessons,
  optimistic counts or invented submission progress. The existing submit guard is
  at least 3 modules and at least 3 lessons in every module. Submission requeues
  rejected concepts and stays private until admin publication.
- Published roadmaps retain additions, hide detach and offer request/withdraw
  takedown with inline confirmation. Admin approval starts the existing 30-day
  countdown; roadmap remains published until the effective date. Deletion dates
  display when supplied; overdue deletion hides the editor rather than offering
  writes. No timers or scheduler.
- New/edit lesson links deliberately disclose classic view; those pages are later
  checkpoints. Classic roadmap editor remains available with unchanged implementation
  apart from export and plain ID input. No new metadata editing, ordering, module
  deletion, AI job or admin publish controls are introduced in this checkpoint.

## Contracts and state

- Account → GET review → GET detail. The existing review endpoint can normalize an
  elapsed unpublish; detail follows it to avoid showing two lifecycle states. This
  is existing lazy backend behavior, not a new explicit frontend write.
- Metadata-only own-roadmap projection checks role, owner, parent IDs, lesson owners,
  unique modules/placements per module, arrays/order, effective dates and coherent
  review counts/status. Raw lesson bodies and staged text are never retained in query
  data. A pending-draft boolean preserves even an empty staged string.
- Search explicitly submits a title term of at least 2 characters and filters the
  existing concept API to the signed-in author. Admins get only their own lessons,
  excluding already attached results. Actual `isAiGenerated` booleans provide a label
  when the admin list omits its transient label, matching detail preflight metadata.
- Synchronous duplicate guard, fresh identity/role/tree/fingerprint before changes,
  fresh lesson ownership/metadata before attach, explicit published detach guard and
  structure checks. One request, no retries. Saved-state reread must confirm the
  change before success clears the affected input or closes its confirmation.
- Timeout, network, 408/5xx, malformed acknowledgement and unconfirmed saved state
  lock changes until explicit successful refresh. Failed recovery stays locked. The
  warning says an earlier request may still finish; repeating can duplicate changes.
  No idempotency or exactly-once promise. Definitive access/contract failures hide
  private cache/form; ordinary read failures preserve outline and drafts, pause writes.
- Persistent loading/error/success messages; submit error summary focuses after DOM
  commit and links to the title with inline error. New module drafts survive unrelated
  successful changes and ordinary failures. Inline confirmations focus when opened,
  return focus on Escape/cancel, and do not disguise a detach as lesson deletion.
  Changed checked data dismisses an old confirmation without clearing module drafts;
  this final safeguard is unit verified, with unchanged visual presentation.
- Direct classic/GUI switch stays on the editor route; authoring never writes learner
  location or progress. Shared My content navigation includes nested editor routes.

## Verification and remaining checks

Frontend typecheck, touched lint (one existing unused test variable warning), theme
guard, classic preservation comparison, 299 tests in 17 files (112 learning/authoring
cases, 16 new editor cases), diff check and final fixture-free webpack production
build. Existing multiple-lockfile build warning remains.

Labelled actual-component production sample used only local data/state: desktop,
375px phone, 768px tablet and 812px landscape, light/dark, search, attachment, module
creation, detach/cancel, submit/takedown/withdraw, validation and saved feedback focus,
new draft retention, loading/error/empty/stale/pending/uncertain/recovered states,
mobile menu Escape/focus. No overflow or console errors observed. OS media-preference
emulation was unavailable; CSS final states disable entrances/drawing/transitions
under reduced motion. Temporary route, tab and server removed; viewport reset.

Manual signed-in checks still required:

1. Open owned roadmap as Developer and Admin; verify other/unowned content stays
   unavailable here. Check private metadata hides after 401/403/404 or account change.
2. Add a module after legacy zero and nonsequential indices, search own lessons,
   attach, then detach from an unpublished tree. Verify other placements/lesson remain.
3. In another tab, change the roadmap/lesson before a write. Verify preflight refuses
   the stale action and refresh gives a reviewable current tree. These frontend guards
   are UX, not transaction isolation or server authorization.
4. Submit insufficient and valid structures; check rejected lesson requeue/admin
   review, request/withdraw takedown and the effective dates/deletion boundaries.
5. Exercise slow/network-refused writes and recovery with actual API saved state;
   verify no automatic write retry and the unfinished-request warning remains.
6. Switch GUI/classic on this route without changing learner location. Check OS-level
   reduced motion and keyboard navigation in the actual signed-in environment.

No migration is needed. Backend unit/live database tests were not rerun because the
backend is unchanged. Checkpoint 14, new lesson, has not started.
