# Module overview

Checkpoint 7, 2026-10-09. Continue the approved orange MASTER, not the generated skill palette.
UI styling and UX searches inform hierarchy, breadcrumbs, feedback and accessible controls.

## Composition

Three-level breadcrumb → peach module title/description/count panel → numbered lesson cards and a
module-only progress/navigation panel. An original recall-path SVG draws once in 800ms; reduced
motion reveals the completed path immediately. The stamp disappears on phones, leaving content first.
Cards and side navigation use warm paper/charcoal tokens, fine borders, orange accents and no green.
Previous/next links and an ordered module index have descriptive names; current module uses aria-current.
No invented durations, achievement claims or synthetic progress. Native progress, headings, lists,
links and buttons retain accessible keyboard behavior; shared theme supplies visible focus rings.

## Data and state

- `/developer/roadmaps/[reference]/modules/[moduleReference]` awaits server params and passes plain
  strings to the existing client page controller. Reuse `/roadmaps`, `/roadmaps/:id`,
  `/roadmaps/:id/progress`, `/users/me`, auth guard, API client and query keys. No module GET endpoint
  is invented. Both roadmap and module IDs/canonical VFS names resolve through the visible parent.
- Module numbers and links use shared VFS ordering, normalization and collision handling. Never use
  a title-derived local slug with different suffix rules. Wrong-parent module IDs are unavailable.
- Progress intersects selected module placements with approved tracked concepts from the roadmap
  progress endpoint. Count placements, including repeated tracked concept placements, not global
  roadmap totals. Drafts without tracking rows are not completed or included in the denominator.
- Recommendation is the next tracked available concept in this module, preferring in-progress,
  with prerequisites evaluated from this placement against full-roadmap completion. Cross-module
  prerequisites still apply; an unrelated in-progress lesson never becomes this module's next step.
- Initial pending uses skeleton status and checking-progress labels, not zero completion. Initial
  failure has persistent shared feedback and retry. Cached refresh failures retain last-loaded
  status/counts but hide recommendations. 404 parent detail hides cached content; missing module
  offers a parent link/recheck. Empty outline, untracked draft outline and completed tracked outline
  have distinct messaging. No completion writes occur here; reading is not labelled completion.

## GUI / CLI seam

Roadmap module links now open GUI. Module and concept locations project to this module page while
the precise same-module concept position remains stored. Navigating to another module changes
location; a missing module or 404 does not. Lesson links remain explicit CLI links with exact VFS
placement and concept ID until checkpoint 8; mode changes use navigate:false so the link owns its target.
Direct CLI-mode visits resolve parent/module API IDs to canonical names before redirecting, preserving
developer-shell role even for admins. A visited-GUI ref is checked in effects, never during render,
to avoid overwriting an explicit lesson handoff. No command registry/backend behavior changes.

## Verification

Typecheck, touched lint, seventeen Node test files (twenty-five roadmap/module checks), theme guard
and production build pass. Existing multiple-lockfile warning remains. Actual components and bundled
fonts checked in a labelled sample-only interactive preview: desktop, 375px, 768px, 812px landscape,
light/dark, next-module navigation, roadmap/module links, mobile menu Escape/focus, pending/error/empty
and stale states. No console errors or horizontal overflow. This is not a live authenticated API test;
signed-in permission/retry/mode-switch smoke and OS-level reduced-motion remain manual. Tests cover
ID/name resolution, wrong parents, cached 404, local totals/drafts/repeats, cross-module prerequisites,
exact CLI URLs, location preservation and handoff races. Temporary browser/server cleaned up.
