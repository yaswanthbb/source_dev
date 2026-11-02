# Roadmap browser and overview

Checkpoint 6, 2026-10-09. The user approved the dashboard, then requested the next page.
The orange MASTER remains authoritative. Skill search initially suggested children's claymorphism;
a narrower developer-documentation search matched minimal/Swiss hierarchy. Only applicable spacing,
quiet transitions and prominent search guidance are used; no generated green palette, fonts or
unrelated marketing/support sections replace the approved identity.

## Composition

Reuse the opt-in workspace shell with active Roadmaps navigation and the section label. The browser
has a compact editorial heading and an original three-node connection-path SVG, then labelled native
search/origin/sort controls, result count and two-column real catalog cards. Phone stacks cards;
wide desktops can show three. Cards use orange branch glyphs, neutral API-origin/private-draft labels,
real module/visible-concept counts and individual tracked progress. Eight cards per page bounds requests.

Overview: breadcrumb → warm peach title/description panel → ordered module outline and progress panel.
Native details/summary retain keyboard behavior without an accordion dependency. Concept completion
has both text and an icon; difficulty, question counts and recommended prerequisites come from the API.
Draft visibility and approved-concept progress totals are distinct. No invented durations, enrollment,
certificates, completion writes, paid model actions or fabricated catalog entries in app code.

## Data / state ownership

- Read `/roadmaps`, `/roadmaps/:id`, `/roadmaps/:id/progress` and `/users/me` through existing auth/API
  client, React Query keys and progress/detail hooks. IDs and VFS names both resolve through the visible
  catalog because detail API accepts IDs only. Preserve backend visibility; do not client-invent access.
- Initial pending has polite skeleton status. Initial failure is persistent shared GUI feedback with
  retry, not an empty catalog or 0% progress. Stale refresh failures retain data with a warning;
  recommendation is withheld. 404 detail uses unavailable feedback and hides a cached outline.
- Search no-results offers clear filters; genuine empty catalog links to existing My content.
  Newest/A–Z sorting is independent of origin/search. Filtering resets page; catalog changes clamp it.
- The next available concept must be tracked, not completed and satisfy visible per-placement
  prerequisites. It prefers an in-progress concept, otherwise the first in curriculum order.
  Detail placements, not duplicate concept-only progress entries, determine prerequisite context.
- Progress/detail/catalog/profile reads use abort signals, 12-second timeout and one retry. CLI bulk
  progress behavior is unchanged; GUI does not use its error-to-zero fallback.

## GUI / CLI seam

New GUI routes: `/developer/roadmaps` and `/developer/roadmaps/[reference]`. Server route props are
plain reference strings; hooks/handlers stay client-side. Shared VFS `slugify` and `uniqueNames` are
used for canonical roadmap/module/concept names. Module/lesson links are visibly marked CLI and carry
the exact path, plus the existing concept opening parameter when reading a lesson.

Roadmap GUI projection exists; module/concept GUI projection lands on the nearest roadmap without
writing a shallower position over a same-roadmap deeper location. Browser root is an actual move;
opening another roadmap changes position. Developer shell owns developer registry, including admins.
Provider URL synchronization is terminal-route-only. Initial CLI visits hand off to the existing
terminal; later explicit GUI links own navigation so a route gate cannot overwrite their lesson target.

## Accessibility / verification

Native links/buttons/search/selects/details, visible focus, named navigation/regions and polite result
counts. Min 44px controls, no color-only states, long-text wrapping and minmax(0,1fr) grids. Selects get
an explicit focus ring. Finite 450ms page entrance and skeleton pulse stop for reduced motion.
Dark mode uses the master warm charcoal/peach palette, not arbitrary per-page colors.

Typecheck, touched-file lint, seventeen Node test files including fifteen roadmap checks, theme guard
and production build passed; existing lockfile warning remains. Actual interactive components were
browser-tested in a labelled sample-data fixture with bundled fonts: desktop/375px/768px/812px
landscape, light/dark, filters/clear/search/no-results, sorting, roadmap navigation, module disclosure,
mobile menu Escape/focus and initial data states; no console errors or horizontal viewport overflow.
This is layout/interaction QA, not live authenticated API testing. Signed-in permission/retry/navigation
smoke and OS reduced-motion remain manual. Temporary preview stopped; no real account/provider writes.
