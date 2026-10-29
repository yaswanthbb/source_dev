# Users — checkpoint 25

Completed 2026-10-27. Route: `/admin/users`. The user authorized this checkpoint only.
Checkpoint 26, content review, remains unstarted. All work stays local; previous dirty
checkpoints are preserved. No backend, schema, migrations, dependencies, terminal commands,
staging, commits or publishing changes.

## Directory and request history

The approved orange/paper/charcoal admin workspace now contains account totals, protected
admin totals and pending-request totals, an original finite identity-card vector and two
button-selected views. Missing/loading/failed data stays unknown rather than becoming zero.
The full existing directory and request endpoints load together. Name/email search is local,
literal and case-insensitive; role filters, name/newest sorting and eight-item paging operate
on those loaded records. This does not invent server pagination or per-keystroke requests.
Displayed dates are UTC. Counts always describe the complete checked lists, not the current
search results. No account-creation, role-editing or invented profile-detail endpoint is added.

Deletion requests default to Pending, with All/Rejected/Approved filters, newest-first ordering,
read-only details, escaped submitted reasons, creation/review timestamps and reviewer names.
Approved describes request state, not proof that an account was removed. Account deletion
cascades request history, so the interface does not promise a permanent deletion audit log.
Unmatched/missing user relations and protected targets have no action controls. Current admins,
including the signed-in account, are protected. Only matched developer accounts can be removed
or have a pending request approved/rejected through this GUI.

Uses existing Inter/Lucide, scoped tokens, native labels/selects/details/dialog, visible focus,
44px controls, responsive cards and reduced-motion styling. Long names/emails/reasons wrap.
The phone filter selects are constrained to their grid cells; a browser-discovered overflow
was fixed and rechecked. Long reasons have bounded, keyboard-focusable labelled regions.
The confirmation dialog identifies the exact account and submitted reason, states permanent
removal and preserved authored content, and defaults focus to Keep account or Keep request
pending. Cancel/Escape send no action; focus returns to the trigger when it remains mounted,
otherwise to feedback. Explicit confirmation closes the dialog before the guarded request;
processing blocks other account actions. Result/error/recovery feedback receives focus.

The admin layout retains its existing auth guards and bypasses legacy chrome only for this
route in GUI appearance. The original users page is copied exactly apart from its export and
remains in CLI appearance with its legacy frame and a same-route return-to-GUI button. The
route is a server wrapper with a client leaf. Shared navigation and dashboard directory links
now recognize Users as a completed GUI destination; unfinished content review remains Classic.
Existing mode handoffs do not change saved learning location.

## Existing APIs and checked decisions

GET `/users/me`, `/users` and `/users/deletion-requests`; DELETE `/users/:id`; PATCH
`/users/deletion-requests/:id/approve` or `/reject`. No new endpoints. No automatic retries,
polling, focus/reconnect refresh or optimistic account/count changes. Shared notifications
retain their existing recipient behavior; this page adds no notification writes.

Reads are timed/abortable and bracketed by fresh matching admin-account checks with original
session guards. A fresh read on entry hides prior cached lists while checking. Query keys
include account ID/role; same-tab auth and cross-tab auth-storage events hide private details.
Raw transport/backend errors are discarded for fixed messages. Projections retain only the
shown directory/request fields: no password hashes, OAuth IDs, preferences, photos or unrelated
entities. Malformed/duplicate records, identity mismatches and invalid dates/statuses fail the
read rather than silently dropping rows. Both lists must validate before a snapshot is exposed.

Each decision freshly reads admin access and both complete lists, compares the selected account's
identity/role/creation metadata and, for review actions, the exact pending request/reason/review
metadata. Changed/missing/protected targets stop before a write. A synchronous busy ref blocks
same-tick overlaps. One explicit DELETE/PATCH follows preflight. Direct deletion/approval require
`success: true`, then a fresh checked directory without that account and no requests for it.
Rejection requires matching request/user/reviewer/reason/date acknowledgement and matching saved
review readback with the account still listed. Safe projections enter cache only after checks;
related admin dashboard/analytics caches are invalidated without automatic reads.

The backend approves a request before running account deletion and has no transaction around
both operations. Any approval failure, including a 4xx, is treated as uncertain because review
state may already have changed. Transport/408/5xx, malformed acknowledgement or failed/inconsistent
readback also pause account writes. Read-only Check current state never repeats the mutation,
reports the account/request currently observed, and does not attribute absence to a particular
request. Failed checks keep the pause. Successful checks stage a snapshot until explicit Use
checked list & resume; an earlier-request warning remains after adoption. This pause is local
to the mounted page and can reset on navigation. No atomic decision, conditional-write,
idempotency, cancellation, cross-tab lock, snapshot consistency or exactly-once claim is made.
Existing auth/401 redirects remain inherited. Backend authorization remains authoritative;
client checks cannot eliminate changes occurring between preflight and the write.

## Verification and remaining manual work

522 frontend tests across 17 files pass, including 23 new Users cases. Coverage includes minimal
projection, malformed/duplicate/foreign records, local filters/sorting, timed/abortable admin
checks, protected/changed/missing targets, changed sessions/roles, stale reviewed requests,
one-write deletion/approval/rejection, cascade-aware absence, reviewer/date/reason acknowledgement,
partial approval 4xx, uncertainty/readback failures, read-only recovery and explicit adoption,
synchronous deduplication, private-cache hiding, unknown versus zero, confirmation cancellation,
escaped reasons and classic mode. The final focused 23-test run passed again after the last
accessibility markup refinement. Standalone TypeScript, touched-file ESLint, theme guard,
whitespace/classic/source comparisons and final fixture-free webpack build pass. Four existing
lint warnings remain: three unused admin-layout imports and one unused test variable. The
existing multiple-lockfile build warning remains. Backend/terminal/dependencies are unchanged;
backend tests were not run because backend source is unchanged.

A labelled disposable sample used the actual view/shell with in-memory callbacks, no auth bypass
of the real admin route, and no API reads or writes. Browser checks covered desktop, 375 × 812,
768 × 1024 and 812 × 375, light/dark, search/role/sort/paging, request details/status/history,
confirmation cancellation/Escape/default focus/return, sample deletion/rejection feedback,
empty/loading/read-error/pending/paused/recovery states, explicit adoption with retained warning,
mobile menu Escape/focus, long unbroken names/emails/reasons and visible long-dialog focus.
No page/card/dialog horizontal overflow or console warnings/errors were observed after the phone
select fix. Final focusable-reason markup was source/test/build checked; actual keyboard scrolling
within those reason regions remains manual. Screenshot saved before that nonvisual refinement.

No real account, deletion, approval, rejection, notification, provider, progress or billing action
was performed in browser QA. Service contracts are mocked in tests. Live permissions, real cascade
outcomes/authored-data retention, partial failures and races/late requests, preference sync,
actual GUI/classic/CLI route handoffs, screen readers and OS reduced motion remain manual.
The temporary sample/server/tab were removed, viewport reset, light theme restored and port3211
confirmed closed. The final production build contains no preview route.

Review image: `/home/yaswanth/.codex/visualizations/2026/10/27/source-dev-admin-users.jpg`
(1265 × 988, clearly labelled local sample). Stop for visual review before checkpoint 26.
