# Register — source:dev GUI

Checkpoint 3, 2026-10-08. Reuses the approved orange master tokens, original recall-knot mark,
auth shell and decorative learning-loop illustration. Product copy describes roadmaps, concepts,
practice and writing courses; no fabricated catalog, progress, verification, encryption or guarantees.

UI-styling accessibility patterns informed native labels, field descriptions, password visibility
and focus recovery. UI/UX authentication guidance informed password-manager/paste support and
minimal visual hierarchy. Its generic marketing-layout/palette recommendation did not fit this
form: the verified minimal-style guidance and approved project colors take precedence.

## Composition and reuse

The story panel introduces the workspace; the right column exposes all three required fields at
once. Phones put the form first and remove the decorative diagram. Registration reuses the auth
CSS Module and opts into GUI tokens, without recoloring CLI or unfinished pages.

`GuiAccountForm` is shared with Login. It owns field/error rendering, password visibility,
duplicate prevention, OAuth dispatch/back recovery, request cleanup and success navigation.
`sign-up.ts` owns registration-specific validation/API/error interpretation; `persistAuthSession`
reuses the exact login storage/events/session-marker contract. The existing terminal registration
is preserved separately. Appearance switching stays on the current auth route.

## Feedback policy

- Required fields and existing name rules validate on blur and submit. Failed submit focuses
  an alert summary linking to each invalid field. Correcting one field keeps other errors intact.
- Password help states the real eight-character minimum. No invented complexity/strength rules,
  confirmation retyping or blocked paste. `autocomplete=new-password` supports password managers.
- Pending requests disable duplicate submissions and announce actual account creation, with no
  pretend identity check or progress percentage. Requests time out after 20 seconds.
- Account creation is a server-side write: aborting navigation/response handling cannot guarantee
  cancellation. There is no Cancel creation button. Connection/timeout recovery explains the
  unknown outcome and suggests signing in before retrying; 409 offers sign-in/provider/reset paths.
- A created account with blocked browser storage is described distinctly and directed to sign in
  after allowing storage, rather than claiming registration failed. Partial auth cleanup is attempted.
- Success clears the password, announces the account is ready and opens the role-specific workspace,
  with an explicit fallback link. Reduced-motion skips the short transition and disables animation.

## Contract and verification boundaries

Existing `/auth/register`, name/email trimming, unmodified password bytes, timezone detection,
provider endpoints and developer/admin routes are preserved. No backend/API/schema/package changes.
Recovery and OAuth callback retain their current pages until checkpoint 4.

Typecheck, new-code lint, eleven test files, theme guard and production build passed. The terminal
baseline's ref lint errors/OAuth location warning and the multiple-lockfile build warning remain.
Responsive light/dark, input validation, focus, password visibility, mode persistence and production
Login navigation/regressions were browser-checked with no production console errors. No real account
creation or full provider consent was performed; successful/failed request and persistence behavior
is covered by helper tests. OS-level reduced-motion remains a manual smoke test.

## Artwork refinement — 2026-10-09

User requested an illustration distinct from Login. Register now depicts a layered course-draft
canvas: roadmap header, a module, two concept rows and a Write · Connect · Share footer. This is
original repo-native CSS/vector artwork, not an AI bitmap or a live course/creation control.
It communicates authoring without inventing a catalog or saved user content. Login keeps its
roadmap/concept/practice loop. Shared orange/light/dark tokens and finite entrance motion remain;
mobile hides the decorative canvas and keeps the real form first. SSR regressions pin the two
different illustrations. Browser checked both themes and mobile rendering.
