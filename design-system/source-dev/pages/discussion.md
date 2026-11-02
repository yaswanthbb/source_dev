# Lesson discussion / private Ask AI — 2026-10-12

Inherits the approved orange master, Inter/Lucide and opt-in GUI workspace. UI
styling/accessibility and UX skills informed native forms, focus, semantic feedback,
readable hierarchy and finite motion; generated palettes/fonts were not substituted.

## Presentation and routes

- Nested lesson `/discussion` page, linked from the reader; breadcrumbs and back
  link retain the exact visible roadmap/module/placement. Public/private buttons
  are pressed-state filters, not incomplete ARIA tabs. Eight threads per page,
  search, real timestamps, public/private and verified badges, safe Markdown replies.
- Public and AI question drafts are separate. Reply/edit draft text is retained on
  errors and channel/filter changes. Inline validation, native required controls,
  a 4,000-character client limit and persistent focused save/error feedback.
- Owner/admin edit/delete rules mirror the backend. Answered questions lock for
  non-admins; only author/admin verify human answers. Deletion requires explicit
  inline confirmation, safe cancellation and focus return. AI answers are never
  offered verification or public reply actions.
- Private form states asker/admin access and transmission to the configured AI
  provider. A separate consent checkbox is required before an explicit AI request.
  No fake remaining-quota figures: the existing generic quota read does not promise
  the task-specific `qa_answer` routing bucket. Explain limits/charges and surface
  server quota/provider errors; provider key management retains its existing route.
- Explicit CLI link keeps placement path plus concept and literal `view=qa`; server
  allowlist produces `qa concept <safe-reference>`, not arbitrary commands. A general
  mode switch still projects to the concept reader; no extra content-location depth.

## Data, privacy and writes

- Read-only entry: guarded concept/account then authenticated question list. No
  progress, quiz, generation or provider writes. Timed/abortable reads; no automatic
  generation/retry. The user reports the privacy migration succeeded; it was not
  rerun or independently verified here.
- Strict response projection requires persisted `target`, matching concept/question
  IDs and valid metadata. Unknown privacy contracts, malformed replies and private
  threads returned for another account fail closed. Access/contract errors hide
  cached text; connection refresh failures retain the view/drafts but pause writes.
- Every write freshly checks the guarded parent placement, account, discussion,
  ownership/moderation and thread fingerprint. Draft edits retain the fingerprint
  from opening; only an explicit saved-state review rebases it. Fresh reads are UX
  safeguards, not a replacement for server authorization or a transaction.
- Exactly one POST/PATCH/DELETE per action; no automatic mutation retries. Server
  acknowledgement is validated before success; no optimistic posted replies or
  provider allowance decrement. Known-ID disappearance/access failures hide cached
  content. Confirmed writes refresh shared discussion/quota caches.
- AI failure (including quota/credential failure after saving its private question),
  network/5xx and malformed acknowledgements are unconfirmed. Further writes lock
  until an explicit successful fresh read; failed reads keep the lock. The recovery
  warning remains: an old request may still be running and another explicit request
  can duplicate it/charge again. The API has no idempotency/job status for Ask AI;
  a fresh list is not proof that an outstanding request has finished.
- Leaving cannot cancel an already-sent server/provider action. No auto-save or
  browser storage of drafts. Reload/navigation cannot guarantee draft preservation.

## Verification and remaining manual smoke

Typecheck, touched lint (one existing unused test-harness warning), theme guard,
270 frontend tests across 17 files (83 learning checks, including 15 discussion
checks) and fixture-free webpack production build. Existing multiple-lockfile
warning remains. No new
dependencies/backend/migrations/staging/commit/push actions.

Labelled actual-component sample QA: desktop, 375px, 768px and 812px landscape;
light/dark, separate drafts, keyboard consent, sample acknowledgement/focus,
reply/cancel and delete/keep focus, menu Escape, loading/error/empty/stale/pending/
uncertain states; no horizontal overflow or console errors. Sample actions were
local React state only, no account/API/provider writes. Temporary page/server/tab
removed and viewport reset. Latest reply-draft channel retention is regression
covered; the browser sample used the preceding visually identical build.

Manual signed-in smoke: open a real lesson's Discussion & Ask AI link; confirm
public posting/reply/edit/delete and author/admin verification; separately check
asker/other developer/concept author/admin private lists and known-ID guards. With
explicit human approval for any paid request, verify successful/failed generation,
quota/key errors, timeout reconciliation, real mode handoff and role/access changes.
Cross-tab races remain backend-authorized but not transactionally deduplicated;
OS reduced-motion and assistive-technology smoke remain manual.
