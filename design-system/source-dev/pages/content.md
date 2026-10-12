# My content — checkpoint 12

Route: `/developer/content`. Approved orange master, Inter/Lucide, warm paper and
charcoal themes. UI styling and UX guidance informed native labelled forms, focused
error summaries, persistent feedback, restrained finite motion and responsive layout.
No new design dependencies or global CLI recoloring.

## Scope and hierarchy

Original decorative connected lesson cards accompany the authoring heading. Four
last-loaded counts lead to a searchable, status-filtered library with newest/title
sorting and six-item pagination. Desktop places a private-roadmap form beside the
list; tablet/phone put it below. New roadmap focuses its title with native scrolling.
Controls have visible focus and 44px targets; animations stop for reduced motion.

Existing classic library moved intact except its named export. Interface toggles use
the preference provider without navigation or learning-location mutation. Editor links
explicitly say Classic view; checkpoint 13 owns that redesign. No concept editor,
publication, deletion or paid generation controls are introduced here.

## Data and safety contract

- Guarded GET `/users/me` followed by GET `/roadmaps`; separate own-content cache,
  abortable reads, 12-second per-request timeout and no automatic retry.
- Only matching `createdById` rows, even for admins. Strict ownership/status/date/ID
  validation and metadata-only projection discard lesson bodies and draft payloads.
- API states are draft/submitted/published, not invented approved/readiness states.
  Known module counts or actual returned module length are used; absent counts remain
  unavailable. Rejection text and AI/handwritten/mixed labels require actual metadata.
- Effective unpublish/deletion dates are evaluated at the successful load timestamp.
  Counts say last checked; refresh/focus reads update them. No timer, cron, purge or
  normalization write. Overdue deletion rows have no editor action.
- Initial pending/error differs from known empty. Network refresh failure keeps the
  prior library/draft and disables creation. Definitive access/contract failures hide
  private cached data and the form; losing the draft in that case is deliberate.
- Creation validates title/description using existing 120/2,000 client limits,
  rechecks account ID/role, and sends one POST `/roadmaps` with trimmed fields.
  International titles work; blank optional descriptions are omitted. A synchronous
  busy guard plus disabled pending controls prevent repeat local submissions.
- Success requires a validated private-draft acknowledgement matching owner and
  submitted text. Only then clear inputs, show an editor link and invalidate own
  library/shared roadmap queries. No optimistic row or automatic editor navigation.
- Timeout/5xx/malformed acknowledgements lock further creation until an explicit
  successful fresh read. Failed recovery remains locked. Retain text and warn that
  an outstanding request may still complete. The backend has no idempotency contract:
  neither this UI nor checking the list guarantees exactly-once/cross-tab behavior.
- Page entry, search and refresh never create content or call AI. The form states
  private-to-author-and-admin visibility until reviewed and published.

## Verification and handoff

Frontend typecheck, touched lint, theme guard, 283 Node checks across 17 files
(including 13 new authoring checks) and fixture-free webpack build pass. Existing
unused test variable and multiple-lockfile warnings remain; backend unchanged.

Labelled local-state-only production sample checked 1280/375/768/812 layouts,
light/dark, filter/search/sort/page reset, empty validation summary focus/field links,
confirmed save/input clearing, draft retention, pending/uncertain/recovery/read states,
mobile menu Escape/focus and absence of overflow/console errors. Fixture/server/tab
removed and viewport reset; no real account content was created.

Still manual: signed-in API creation and identity/permission changes, real list refresh
after save, GUI/classic account preference handoff, concurrent tabs and OS-level reduced
motion. Sample screenshot is proof of presentation, not a live authenticated write.
