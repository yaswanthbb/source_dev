# Notifications — checkpoint 23

Completed 2026-10-24. Shared surface in the redesigned GUI workspace header; no new
route. The user authorized this checkpoint only. Checkpoint 24, admin dashboard,
remains unstarted. Backend, terminal controls/commands, dependencies and earlier local
checkpoints are unchanged. All work remains local.

## Shared inbox and presentation

The shared GUI bell now opens a native inbox dialog instead of immediately switching
to CLI. Before account data is available the bell is disabled. The authenticated bell
checks the unread count; notification history loads on opening. Neither opening nor
following a notification marks it read. Read state changes have explicit buttons.
Unread badges cap visual text at 99+ but retain the full accessible count. Missing
counts are unknown, never an invented zero. Counts and timestamps say last checked;
there is no automatic polling, focus/reconnect refetch, or realtime promise. Refresh
is an explicit read. Account-scoped query data can be reused across workspace pages.

Uses the approved orange/warm-paper/charcoal tokens, Inter/Lucide, native 44px controls,
visible focus and responsive scroll containment. Sticky title/close and footer retain
navigation while long history scrolls. Close receives initial focus; native dialog
traps focus, supports Escape and returns focus to the trigger. Explicit action/error
feedback receives focus, including when marking an unread item removes it from the
current filter. No passive polling moves focus. Native details disclose reasons,
reviewer/remover stamps, effective dates, job IDs and actual created/failed counts.
All displayed times are explicitly UTC.

Type and unread filters operate on the full validated loaded list; six-item paging
limits the rendered rows, without inventing backend pagination. Empty history, empty
filters, loading, read failures, pending actions, unknown counts and unavailable
account states are distinct. There is no notification deletion action. Mark all read
preserves history; its confirmation focuses Keep unread, states full-account scope
including rows outside filters and arrivals before processing, and shows the last
checked count. Escape first cancels confirmation, then closes the inbox. Cancel sends
no write. Buttons prevent overlapping actions while processing or checking state.

Known payload fields are projected and text is escaped; raw entities, user relations,
provider errors and arbitrary payload/URL fields are not displayed or cached. Future
type names have an own-property-checked fallback label. Roadmap deletion notices avoid
claiming that a scheduled deletion has already taken effect; effective dates remain
visible in details. Notifications describe past decisions; destination pages check
current availability and permission. Generation outcome notices do not start jobs or
model calls and make no invented success-count or quota claims.

Links are constructed from checked IDs and known internal routes: owned roadmap/lesson
editors, own content/articles, generation & jobs, and an explicitly classic admin review
queue for admins. Removed-content notices link to the collection, not a deleted detail.
An explicit Open in CLI link changes mode with navigation disabled before following the
chosen shell route. Shell context, not account role, selects that route: an admin in
the developer workspace keeps the developer CLI; a future admin workspace can explicitly
pass the admin shell. No learner-location changes or retired command names are added.

## Existing API contract and guarded writes

- GET `/users/me`, `/notifications`, `/notifications/unread-count`; PATCH
  `/notifications/:id/read`; POST `/notifications/read-all`. Only existing endpoints.
  Reads are timed/abortable, mutations are timed and automatic retries are disabled.
- Fresh expected account ID/role and original-token guards surround reads and writes.
  Source rows must belong to the recipient, have valid UUIDs/dates/read state and
  validated known payload fields/counts; duplicates or malformed lists fail as a whole.
  Same-tab auth events and cross-tab auth-storage events hide cached inbox data. Action
  handlers check the original session again before starting requests.
- Mark one rechecks current account, full inbox/count and selected immutable displayed
  fields before one PATCH. A changed/missing item stops before writing. Already-read
  state returns a checked no-op. Matching owned acknowledgement, read timestamp and
  fresh list/count readback are required before success. No optimistic badge decrement.
- Mark all rechecks the account and inbox, sends one account-wide POST, validates the
  reported nonnegative integer count, and confirms zero unread plus no unread loaded
  row. An already-all-read inbox sends no POST. The reported count is labelled as the
  server's report; concurrent arrivals mean it is not an atomic exact set/count promise.
- Transport/408/5xx/malformed acknowledgement/readback ambiguity pauses writes. Failed
  checks keep the pause; successful read-only checks stage the new count/list until
  explicit Use checked inbox & resume. No check repeats a mutation. An earlier-request
  warning remains after adoption because a read cannot cancel an accepted request.
  A new unread arrival during all-read confirmation prevents false all-read success.
- Safe errors discard raw Axios request/response data and backend messages. A synchronous
  busy ref blocks overlapping one/all/check actions. No mutation cache or storage is
  used for pending writes. The pause lasts for this mounted surface; closing and
  reopening retain it, while navigation/remount can reset it. No cross-tab, atomic
  conditional-write, cancellation or exactly-once guarantee is claimed. Existing global
  auth/401 redirects remain inherited.

## Verification and remaining manual work

480 frontend tests across 17 files pass, including 21 new notification cases. Coverage
includes safe projection and future labels, malformed/foreign/duplicate records, checked
internal links, timed abortable reads, cached/uncached entry, selected-version checks,
one/all acknowledgement/readback and no-op behavior, concurrent unread arrival,
fixed safe failures, changed sessions, same-tick deduplication, failed/successful recovery,
escaped UI text, confirmation cancellation, header composition and explicit shell routing.
Standalone typecheck, touched-file ESLint, theme guard, diff check and final fixture-free
webpack build pass. The existing unused test variable warning and multi-lockfile build
warning remain. Backend and terminal source comparisons show no changes for this work.

A labelled resettable local sample used the actual inbox view with local callbacks.
Browser checks covered desktop, 375 × 812, 768 × 1024 and 812 × 375, light/dark, long
unbroken reasons/titles, no page or dialog horizontal overflow, filter/paging/reset,
mark-one feedback and disappearance from Unread only, all-read cancel/Escape/confirmation,
retained history, details, close/focus return, visible phone confirmation focus,
loading/error/empty/pending/unavailable states, admin destinations, failed recovery,
explicit resume and retained late-request warning. No console warnings/errors observed.
No real notification/account/content/provider/progress/billing operation was performed;
service behavior is mocked. Final future-type and workspace-routing refinements were
verified by tests, lint, typecheck and build after sample inspection.

Live recipient permissions/persistence, real unread counts and emission, races/late
requests/cross-tab sessions, actual destination availability, preference synchronization,
assistive technology and OS reduced-motion behavior remain manual. No backend tests
were run because backend code is unchanged. Sample route/server/tab were removed,
viewport reset and port 3211 confirmed closed.

Review image: `/home/yaswanth/.codex/visualizations/2026/10/12/01a12e68-bed3-7c30-ade4-984afb4827b9/source-dev-notifications.jpg`
(1280 × 720, local sample). Stop for visual review before checkpoint 24.
