# Profile — checkpoint 22

Completed: 2026-10-24, continued from the 2026-10-21 implementation. Route: `/profile`.
The user authorized this checkpoint only. Checkpoint 23, notifications, remains unstarted.

## Account workspace

Uses the approved scoped orange/warm-paper/charcoal master, existing Inter/Lucide,
shared workspace shell and an original finite identity-card illustration. Profile
form and account/sign-in/appearance sidebar stack on narrow screens. Native controls
have 44px targets, visible focus, linked focused validation and reduced-motion support.
Admin overview links retain `/admin/dashboard`; shared workspace keeps its Admin view.

Existing name, timezone, photo, read-only email and password capabilities remain.
Current valid timezones outside the common option list are retained. Successful profile
save stays on this page with checked feedback rather than navigating away. Empty names
and names over 100 characters are refused; names are trimmed only when saving.

Photo selection prepares a centered 256 × 256 JPEG locally, with a white background
for transparency. Unsupported/empty/files over 10 MB are rejected before decode;
images over 40 million pixels are rejected after decode. The bitmap is released on
success or failure. Existing HTTPS provider photos are displayed without the image
proxy or referrer. Broken photo previews fall back to an icon. Selection and removal
are local edits until Save; removal sends null. Unchanged provider URLs are omitted
from PATCH because the backend accepts data URI/null uploads, not remote URLs.
Actual browser photo selection/decoding remains a manual check; canvas handling is mocked.

Password fields are separate from profile saving and available only when the API
reports `hasPassword`. Minimum eight characters, a different new password and matching
confirmation are required. Each visibility control has a specific accessible name.
Native confirmation focuses Keep editing and supports Escape, trapping and focus return.
Fields and visibility state clear before submission; credentials stay out of query and
mutation caches, storage, URLs, notices and retained error objects. Social-only accounts
show their actual provider and no password form. Connection changes are not offered.

Drafts stay in page memory; ordinary errors and recovery reads retain profile edits.
Native unload warnings cover profile/password edits and processing/pending operations.
Internal navigation, mode changes, reloads and the existing global 401 sign-in redirect
can discard edits. No autosave or navigation-persistence guarantee is claimed. Existing
401 handling is retained: an incorrect-current-password response may redirect to login.

## Existing API contract and write handling

- Only GET/PATCH `/users/me` and PATCH `/users/me/password`; no backend, schema,
  dependency, migration, deletion, provider, progress or terminal-command changes.
- Timed, abortable profile reads with no retry, focus or reconnect refetch. Account ID
  and role scope the cache. Strict identity/capability/photo/timezone projection drops
  password hashes, provider IDs, arbitrary entity fields and unknown preferences while
  retaining known appearance/location preferences. Read failure is not an empty form.
- Same-tab auth events and cross-tab auth-storage changes hide cached account details
  and edits. Each action checks the original token again before any request; service
  guards also check it across asynchronous reads/writes. Changed identity/role stops
  the operation before PATCH. Synchronous busy guards prevent overlapping actions.
- Profile save checks fresh identity and a full editable/security-field fingerprint,
  sends one scoped PATCH, and requires matching acknowledgement plus a checked readback.
  No optimistic update or success claim from an acknowledgement alone. Known user
  preferences are preserved and never sent as part of the profile edit body.
- Profile transport/408/5xx/malformed acknowledgement/readback ambiguity pauses saves.
  Read-only checks stage saved name/timezone/photo status without replacing local edits.
  Failed checks stay locked; successful checks require an explicit keep-edits choice
  or separately confirmed replacement. A warning that an earlier save may still finish
  remains after review. No automatic repeat mutation or hidden rebase.
- Password submission rechecks identity/email and password capability, then sends only
  current and new password once. The exact existing acknowledgement is required; no
  profile read can verify a password change. Ambiguous results pause password changes
  and direct the user to sign-in/recovery. Raw Axios errors and backend messages are
  discarded. This pause is page-local, not a cross-tab or reload-persistent guarantee.
- No backend atomic conditional write, cancellation of accepted requests, idempotency,
  exactly-once or race-free account-change guarantee is claimed.

The server route passes no function props. Appearance readiness chooses GUI or the
classic page; the classic file is byte-for-byte original except its named export.
Same-page GUI return changes no learner location. Notifications remain the existing
explicit CLI handoff, pending checkpoint 23.

## Verification and remaining manual checks

459 frontend tests across 17 files pass, including 21 new profile cases. Coverage
includes sanitized projection/preferences, timezone/photo/password validation,
timed abortable read, unchanged/invalid/stale-account rejection, one PATCH/readback,
remote-photo omission/null removal, malformed/refused/uncertain responses, token changes,
local crop/bitmap release, social account UI, confirmation credential clearing, duplicate
clicks, retained edits/recovery choices, hidden unavailable data and classic handoff.
Standalone typecheck, touched-file ESLint, theme guard, diff check, exact classic
comparison and final fixture-free webpack production build pass. Lint retains only
three pre-existing warnings: unused Sparkles and raw image in the classic copy, plus
the existing unused test variable. Build retains the multi-lockfile warning.

A labelled resettable local sample was checked at desktop, 375 × 812, 768 × 1024 and
812 × 375 in light/dark themes, with no page overflow or console warnings/errors.
Browser checks covered empty-name validation and focus, sample save/timezone feedback,
discard/Keep editing/Escape/focus return, empty-password validation, social-only/admin/
long-account/loading/read-error/pending/uncertain/failed-check states, explicit recovery
review and mobile menu Escape. No credentials were entered, no real profile/photo/
password/provider/progress/billing operation was performed, and sample callbacks made
no API writes. Service behavior is mocked. The final session/photo-ARIA refinements
were verified by focused tests, lint, typecheck and build after sample inspection.

Live signed-in permissions/persistence, actual photo processing/upload/removal,
password success/refusal/recovery, expired-session redirects, preference sync,
internal navigation, concurrency/late requests, screen readers and OS reduced motion
remain manual. No backend verification was run because backend code is unchanged.

Review image: `/home/yaswanth/.codex/visualizations/2026/10/12/01a12e68-bed3-7c30-ade4-984afb4827b9/source-dev-profile.jpg`
(1265 × 1725, labelled local sample). Sample route/server/tab removed, viewport reset,
port 3211 closed. All work remains local; prior dirty checkpoints are preserved.
Stop for visual review before checkpoint 23.
