# Admin dashboard — checkpoint 24

Completed 2026-10-27. Route: `/admin/dashboard`. This checkpoint implements the admin
GUI overview only; checkpoint 25, users, remains unstarted. All changes stay local.
Earlier dirty checkpoints are preserved. No backend, schema, migrations, dependencies,
terminal commands, staging, commits or publishing changes.

## Interface and existing tools

The scoped orange, warm-paper and charcoal workspace uses the approved Inter/Lucide
system, native controls, visible focus, 44px targets and reduced-motion styling.
An original finite vector illustration introduces the overview; it is decorative,
not an analytics chart. Four metric cards show the eight reported platform totals.
A review highlight and four-item paged queue expose new lessons and staged revisions;
local All/New/Staged filters make no API write. Roadmap analytics show up to six rows,
sorted by reported learner count or title. Contribution and lesson-progress lists
show up to six entries each. The activity list contains the current recipient's latest
five notifications and explicitly identifies itself as an inbox, not an audit log.

Queue links use validated concept IDs and explicitly open the existing admin CLI review.
Content review and users links are labelled Classic. AI jobs, articles and analytics
links are labelled CLI. Actual moderation and account management remain in their existing
tools. The shared shell receives an explicit admin context; an admin using the developer
workspace still gets developer navigation and CLI. Mode switching uses navigation-disabled
preference changes before following the selected route, without changing saved learning
location. The server route passes no function props; the client leaf chooses GUI/classic.
The original classic dashboard is preserved byte-for-byte apart from its export name.

## What the reported numbers mean

- Active developers means developers with progress updates in the last seven days,
  not account logins. Completions are completed developer progress records. XP is the
  platform's reported total; no trend, comparison period or inferred growth is shown.
- Roadmap learners are developers with recorded progress, not a separate enrollment
  table. Completion is the API's average across those learners. Roadmap counts include
  all review/publication states. A roadmap with no linked lessons is identified explicitly.
- Lesson statistics report completed and in-progress records. Developer contributions
  report authored lessons, created roadmaps, answers and MCQs. No invented return visits,
  relative popularity scores or platform-wide audit activity are shown.
- The review endpoint includes pending lessons and approved lessons with non-null staged
  drafts in submitted/published roadmaps. An empty-string draft still counts as staged.
  Ordering uses lesson creation time; the interface explicitly says submission dates
  are not reported. All displayed dates are UTC.

## Reads, cache and unavailable states

Uses existing GET `/users/me`, `/admin/analytics/{overview,roadmaps,concepts,developers}`,
`/admin/content-review/pending` and recipient notification reads. No dashboard writes,
automatic retries, polling, window-focus or reconnect refresh are added. Manual refresh
works per section or across the dashboard, blocks duplicate requests synchronously and
reports partial failures without pretending all sections succeeded. Feedback receives focus.

A fresh matching admin account gates entry. Each resource read is timed/abortable and
bracketed by fresh matching account/admin checks, with original-token guards. Same-tab
auth events and cross-tab auth-storage changes hide cached dashboard data. Section cache
keys include account ID/role. Notification activity reuses the existing recipient inbox
key and shape so the shared bell can update it. Cache reuse remains a last-checked snapshot,
not realtime data or an atomic snapshot across all endpoints.

Strict projections reject malformed lists, duplicates, invalid IDs/dates, missing or
negative counts and invalid percentages. Only displayed metadata enters the cache:
queue bodies, staged text, questions, answers and author relations are omitted; developer
emails are omitted. Fixed errors discard raw transport/backend payloads. Loading, failed,
unavailable, empty and legitimate zero states are distinct. Failed/refetching resources
hide old values; access denial hides the whole private dashboard and shell account data.
A successful Check admin access refreshes the actor; an existing denied section can still
require Reload dashboard to start a fresh resource check. This does not promise atomic
role changes, cross-tab invalidation without events, or request snapshot consistency.

## Verification and remaining manual work

499 frontend tests across 17 files pass, including 19 new dashboard tests. These cover
projection, scope labels, ranking/filtering, abortable read guards, role/account/token
changes, safe failures, read-only feed, fresh entry gating, actor-scoped keys, duplicate
refresh prevention, partial failures, cached-data hiding on denial, explicit shell routing,
saved-location preservation and the classic appearance. Standalone TypeScript, touched-file
ESLint, theme guard, whitespace checks, exact classic comparison and final production
webpack build pass. The existing unused test variable warning and multi-lockfile build
warning remain. Backend, terminal, admin layout and dependency comparisons are unchanged;
backend tests were not run because backend code is unchanged.

A clearly labelled disposable sample rendered the actual view and shell with local
callbacks and no API reads/writes. Browser checks covered desktop, 375 × 812 phone,
768 × 1024 tablet and 812 × 375 landscape, light/dark, long unbroken titles/names,
queue filtering/paging, roadmap sorting, refresh feedback/focus, zero/loading/partial
failure states and mobile menu Escape/focus return. No page horizontal overflow or console
warnings/errors were observed. The narrow roadmap table owns its horizontal overflow and
has a focusable labelled region; focus was checked, actual keyboard horizontal scrolling
was not established. Final lesson-caption cleanup was covered by the final build/typecheck.

No real admin/account/content/notification/provider/progress/billing operation was performed.
Service behavior is covered by mocked tests, not signed-in API verification. Live admin
permissions, analytics accuracy, recipient integration, actual route handoffs, preference
synchronization, session/concurrency races, screen readers and OS reduced-motion behavior
remain manual. The sample route/server/tab were removed, viewport reset, light theme
restored and port 3211 confirmed closed. The final build contains no sample route.

Review image: `/home/yaswanth/.codex/visualizations/2026/10/27/source-dev-admin-dashboard.jpg`
(1265 × 712, labelled local sample). Stop for visual review before checkpoint 25.
