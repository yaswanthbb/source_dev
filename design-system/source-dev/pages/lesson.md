# Lesson reader

Checkpoint 8, 2026-10-09. Continue the approved orange MASTER. The UI styling and UX skills guide
reading hierarchy, native disclosures, focus and persistent feedback; no generated palette override.

## Composition

Breadcrumb → module lesson rail → generous reading column → quiet page outline. The article contains
the real API body, not placeholder marketing copy. Code blocks have explicit copy/status, tables stay
locally scrollable, and diagrams have captions and source disclosures. Phone/tablet collapse both
navigation groups by default. Adjacent lessons cross module boundaries in roadmap order. Approved
origin, difficulty, quiz status and completion are real metadata; no invented reading times or XP.
Warm paper/charcoal tokens, orange accents and a finite 350ms entrance; reduced motion disables it.

## Data and location

Resolve catalog → roadmap ID/detail → selected module → selected placement. IDs, placement IDs and
collision-safe canonical names are accepted under the visible parent only. Fetch `/concepts/:id`
for `content`; never display `draftContent` or select a parent from the API's global `appearsIn` list.
The new read-only `media` field contains ordered presentation data after visibility checks. Reuse
shared progress caches, client API/timeouts and persistent feedback. Missing/wrong-parent/access-
denied content hides cached lesson bodies and doesn't change location or start progress.

Developer concept locations now project to this actual reader. Success sets the exact placement;
CLI handoffs carry its canonical path plus concept ID and keep developer-shell semantics for admins.
Roadmap/module continue links open GUI. The quiz is still the existing terminal activity until 9.

## Content and action safety

ReactMarkdown/GFM skip raw HTML, reject unsafe links and defer remote images until consent. Resolve
diagram placeholders from media or Mermaid fences, lazily importing pinned Mermaid 12.1.0. Strict
security, disabled HTML labels, protected configuration, 20k source/150-edge limits and serialized
rendering; reject source directives/frontmatter. Never insert SVG into the document or bind events:
use image context with caption/alt, loading and readable-source error fallback. Theme changes cancel
abandoned renders. KaTeX is scoped to patched 0.18.2; flowchart/math browser checks pass. Malformed
or missing diagrams don't break prose. YouTube uses validated 11-character IDs and a fixed nocookie
host only after clicking load; close unmounts the player. Watch links remain if the player fails.

Starting an approved nonempty lesson is idempotent and deduplicated per mounted placement. Failed
start has retry, without hiding prose. Completion waits for valid, nonfailed quiz/progress reads, then
freshly fetches roadmap/detail, concept, progress and quiz status before writing. Check exact current
placement, approval/content/tracking, its prerequisites and resolved questions (not necessarily all
correct; zero questions needs no quiz). Pending/failed mutations never show saved success; no automatic
completion from reading. Invalidate progress/gamification/badges/review after acknowledgement. The
backend completion endpoint currently doesn't enforce quiz/prerequisites; GUI gates are UX safeguards,
not a security boundary. This checkpoint changes only the authorized read API, not completion policy.

## Verification

Frontend typecheck, touched lint, 223 tests in 17 files (37 roadmap/reader checks), theme guard and
production build; backend typecheck, 55 suites / 661 tests. Production component fixture verifies
desktop/phone/tablet/landscape, light/dark, diagrams/math/fallback, copy/anchors, native disclosures,
menu keyboard behavior and feedback states without viewport overflow/unexpected errors. Fixture is
explicitly sample-only, no account or API writes; removed before delivery. Real authenticated API,
permission/retry/mode-switch, external video and OS reduced-motion smoke remain manual. Existing
lockfile warning and 12 pre-existing dependency audit findings remain; no broad upgrades or publishing.
Preview server stopped; browser tab/viewport cleanup was blocked by the connection-error URL policy,
so temporary preview tabs may remain.
