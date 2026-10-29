# Admin jobs — checkpoint 27

## Scope and design

`/admin/jobs` is a server wrapper with a client leaf inside the existing admin workspace.
Uses approved warm paper/charcoal/orange tokens, Inter/Lucide, a finite original job/check
vector, native controls/disclosures, 44px targets, visible focus and reduced-motion CSS.
Shared generation JobCard retains developer defaults; admin omits the generic own-content link.
Cards use two columns on wide desktop and one below 1050px; long targets/UUIDs wrap.
No packages, backend/schema/migrations, terminal commands or Git publishing changes.

The API audit is in `admin-parity-audit.md`. Articles are checkpoint 28; contextual moderation
and evaluation need separate service-level audits before their routes/interactions are defined.
All four analytics endpoints already have dashboard GUI coverage; the explicit CLI shortcut remains.

## Existing contracts and behavior

- Fresh matching admin checks before and after GET `/ai-generate/jobs/active` and `/results`.
  Both lists belong to the current requester, including admins. Results are newest-first,
  capped at 20, and not a full history. Manual refresh, local literal search and six-item paging.
  Pending/error values are hidden and never presented as empty/zero. Existing feed parser handles
  a job finishing between the sequential active/results reads by preferring its finished row.
- GET `/ai-generate/jobs/:id` permits admin inspection of a known ID from any requester.
  Full UUID, returned ID/requester, strict job projection and current admin/session checked.
  No platform-wide jobs list is inferred. Provider/model values are request snapshots, not proof
  of every serving model. Existing counts describe reported units/stages, not invented lessons.
- POST `/ai-generate/jobs/acknowledge` always includes exactly one reviewed own finished v4 ID.
  Fresh full selected-record preflight, one write, count 0/1 only, matching saved record with
  acknowledgement timestamp, fresh owner feed and selected unread absence. Another requester’s
  job cannot be acknowledged. No bulk/empty-ID request, generation start, retry, cancel, quota,
  provider-model lookup or evaluation operation is triggered by this page.
- Marking reviewed changes only unread acknowledgement; it does not approve or modify content.
  Every sent-write failure pauses further acknowledgements. GET-only saved-state recovery never
  repeats a write, failed recovery keeps the pause, explicit checked-state adoption is required,
  and the earlier-request warning remains afterwards. Pause is local to this mounted page;
  no atomicity, exactly-once, cancellation, cross-tab or remount-persistent lock guarantee.
- Account/role-scoped cache, fresh mount reads, no polling/automatic retry/focus/reconnect refetch,
  fixed errors, original-token guards, same-tab auth and cross-tab storage hiding. Synchronous ref
  prevents duplicate refresh/lookup/review/recovery. Private lookup values clear before a new check.
  Success feedback and updated pagination headings receive keyboard focus.
- GUI sidebar opens `/admin/jobs`. CLI appearance offers an explicit admin terminal handoff and
  same-route GUI return without changing the saved learning location. Existing terminal unchanged.

## Verification

- Full frontend suite: 568 passing tests across 17 files, including 18 new job service/view/controller
  checks. Final affected jobs/generation/shell run: 31 passing. Touched ESLint has no introduced
  warnings/errors; four existing warnings remain (three admin layout imports, one test variable).
- Final standalone TypeScript and fixture-free webpack build: passed after clean-cache rerun.
  Removed-preview route types required the documented generated `.next` cache reset.
- Labelled disposable actual-view/shell sample tested in desktop/375/768/812 layouts and light/dark:
  active/results, search/no-match, page navigation/focus, full failure details, known-ID lookup,
  sample acknowledgement/result focus, refresh, empty/loading/error/pending, pause/check/adopt,
  mobile menu/Escape/focus return and long unbroken targets. No horizontal overflow in checked
  geometry; tablet columns and disabled-page-button focus corrected and rechecked. Console warning/
  error log empty. Short-landscape containment also checked through read-only DOM measurements.
- Preview used local callbacks, no real account/provider/content/progress/billing/acknowledgement
  operation. Service/controller tests use mocks. Live authorization, another requester’s real job,
  real banner synchronization, acknowledgement/readback outcomes, concurrent/late requests, dates,
  preferences/navigation destinations, screen readers and OS reduced motion remain manual.
- Screenshots: `/home/yaswanth/.codex/visualizations/2026/10/29/source-dev-admin-jobs-overview.jpg`
  and `source-dev-admin-jobs-results.jpg`. Sample route removed, both owned tabs closed, viewport
  reset, light theme restored, temporary server stopped and port 3211 confirmed closed.
