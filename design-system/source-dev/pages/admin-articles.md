# Admin articles — checkpoint 28, completed 2026-10-30

## Scope and design

`/admin/articles` is a server wrapper with a GUI client leaf inside the approved admin workspace.
Orange, warm paper/charcoal tokens, Inter/Lucide, original finite document/check SVG, native controls,
44px targets, visible focus and reduced-motion CSS. Local literal title/author/ID search, author filters
(all/mine/no author), newest/title sorting and eight-item paging use the checked public list. Pending,
failed and genuine empty values remain distinct. Long strings wrap and phone selectors stay contained.

Full selected saved Markdown is fetched explicitly, displayed literally in a keyboard-focusable scrolling
region, and can be previewed through the existing safe Markdown renderer. HTML is not executed; external
images require a separate explicit action. Public reader and existing developer editor destinations are
provided. The editor already permits admins to edit another author or an orphan article, explains that
changes publish immediately, and preserves authorship; no duplicate editor or new PATCH behavior added.

## Contracts and guards

- Existing GET `/users/me`, GET `/articles`, GET `/articles/:id` and reasoned DELETE
  `/articles/admin/:id` only. No new backend/schema/migration/dependency/terminal command.
- Matching fresh admin before and after list/detail checks, original-session guard, auth/storage
  invalidation, actor/role cache and fresh mount read. No polling, automatic retries or focus/reconnect
  refetch. Synchronous ref guard prevents overlapping refresh/inspect/delete/recovery.
- Strict existing public/editor parsing plus slug validation. List cache stores metadata, not all article
  bodies or returned author objects. Selected detail keeps only content and required metadata. Exact raw
  title/body whitespace is preserved. Duplicate IDs, missing fields, wrong identity or list/detail drift
  are rejected; fixed errors hide server internals and unconfirmed data.
- Native modal identifies the selected article, saved version and consequences; saved source remains
  inspectable. Initial focus is Keep article, Escape cancels and restores focus, pending controls and
  Escape are blocked. Each article’s reason draft survives cancel. Inline validation focuses the reason;
  trimmed 1–2000 character limit is this form’s bound, not a claimed backend limit.
- Fresh complete library/selected metadata and full source preflight precedes one explicit admin DELETE
  with `{reason}`. Strict `success:true`, detail 404 and checked-list absence are required before reporting
  checked removal. Public article caches are invalidated without auto-refetch. No promise of an atomic
  version-conditioned delete: another change can race the preflight because the existing endpoint has
  no conditional-write contract.
- Backend `safeNotify` is attempted before article removal, skips the current author’s own account and
  missing author, and does not prove delivery. Confirmation distinguishes these cases. A notification
  can exist even when a later removal fails. Every sent-write failure, including 4xx, pauses deletions;
  no transport error is treated as proof that nothing happened.
- Recovery is GET-only, checks matching detail/list presence or absence, never repeats DELETE, keeps
  failed checks paused and requires explicit checked-state adoption. Earlier-request warning persists
  after adoption. Pause belongs to this mounted page; no cancellation, exactly-once, cross-tab or
  remount-persistent lock is promised. No real notification, restore or deletion endpoint was added.
- Sidebar now opens the GUI route. CLI appearance explicitly hands off to existing admin article
  commands and offers same-route GUI return without changing saved learner location. Admin layout
  keeps existing account guards. Earlier approved surfaces remain unchanged.

## Verification and limits

- Full frontend suite: 590 tests in 17 files, including 22 new moderation checks. Final affected
  moderation/editor/navigation run: 33 passing. Production webpack build passes with `/admin/articles`
  and no sample route. Final standalone TypeScript check passes.
- Touched ESLint: zero errors or introduced warnings; four baseline warnings remain (three admin layout
  imports, one test variable). `git diff --check` passes. Existing multi-lockfile build warning remains.
- Labelled disposable actual-view/shell browser QA: desktop, 375×812, 768×1024 and 812×375, light/dark;
  local search/no match, author filters/sort, paging and heading focus, full source/safe preview,
  native confirmation/safe focus, blank reason validation, retained drafts, Keep/Escape focus return,
  local success with modal closure/status focus, orphan/own-author messages, pending disabled controls/
  Escape guard, uncertainty pause/check/adopt/retained warning, empty/loading/error and mobile menu.
  Old status feedback no longer overrides normal cancel focus. Checked geometry has no horizontal
  overflow; short-landscape safe focus is visible within the scrolling dialog. Browser warning/error
  log empty. OS reduced motion and screen readers remain manual.
- All browser data/callbacks were local samples; services/controllers were tested with mocks. No real
  account/content/provider/progress/billing/deletion/notification operation. Live authorization, full
  public-list scale, concurrent edits/removals, late requests, notification creation/delivery, real
  reader/editor navigation/preferences and real database outcomes remain manual.
- Sample route and its generated dev cache removed; owned sample tab closed, viewport reset, light
  restored, server stopped and port 3211 confirmed closed. Final source/build contain no fixture.
- Review images: `/home/yaswanth/.codex/visualizations/2026/10/30/source-dev-admin-articles-overview.jpg`
  and `source-dev-admin-articles-confirmation.jpg`. No staging/commit/push/PR or publishing performed.

Stop here for visual review. Checkpoint 29 is the contextual discussion moderation and navigation audit.
