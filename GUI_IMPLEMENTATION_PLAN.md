# source:dev GUI — page-by-page rollout

Direction approved: clean, attractive and simple, inspired by https://www.gitbook.com/,
with purposeful animation. Develop **one page at a time**, validate it and get visual feedback
before moving on. No backend changes, commits or pushes. Preserve the CLI and existing APIs.

## Design rules

- Warm paper surfaces, near-black text, consistent orange accents, generous whitespace.
- Consistent readable typography, rounded controls, fine borders and quiet depth.
- Responsive light/dark themes, semantic markup, keyboard focus and reduced-motion support.
- Short entrances, scroll reveals, diagram drawing and interaction feedback. No scroll hijacking,
  obligatory loading theatre, constant background motion or fabricated social proof.
- Scoped GUI tokens/styles: don't recolor the CLI or unfinished legacy pages globally.
- Reuse auth, preference, query and API utilities. GUI/CLI share data and content location.
- Public previews are explicitly examples, never simulated learner progress or real API actions.

## Sequence

Each numbered item is a separate implementation/review checkpoint. Order within a group can change
with user approval. A completed visual redesign does not imply new backend work.

| # | Page / surface | Status |
| --- | --- | --- |
| 1 | Homepage `/`: navigation, hero, interactive product preview, learning story, FAQ, CTA/footer | Approved; continued to login on user instruction |
| 2 | Login `/login` | Approved; continued to register on user instruction |
| 3 | Register `/register` | Approved; distinct left-side artwork added on user request |
| 4 | Forgot/reset password and OAuth callback | Implemented; ready for visual review |
| 5 | Developer dashboard `/developer/dashboard`: shared authenticated GUI shell | Planned |
| 6 | Roadmap browser + roadmap overview (new learning routes) | Planned |
| 7 | Module overview (new learning route) | Planned |
| 8 | Lesson reader: diagrams, media, progress and accurate GUI↔CLI location mapping | Planned |
| 9 | Quiz / answer feedback | Planned |
| 10 | Review session and queue (FSRS read model) | Planned |
| 11 | Lesson discussion + private Ask AI | Planned |
| 12 | Own content `/developer/content` | Planned |
| 13 | Roadmap authoring `/developer/content/[roadmapId]` | Planned |
| 14 | New lesson `/developer/concepts/new` | Planned |
| 15 | Edit lesson `/developer/concepts/[id]/edit` | Planned |
| 16 | AI generation/jobs (existing APIs; explicit paid actions only) | Planned |
| 17 | Provider keys `/developer/keys` | Planned |
| 18 | Public articles `/articles` | Planned |
| 19 | Article reader `/articles/[id]` | Planned |
| 20 | Own articles `/developer/articles` | Planned |
| 21 | Article editor `/developer/articles/[id]/edit` | Planned |
| 22 | Profile `/profile` | Planned |
| 23 | Notifications (shared surface) | Planned |
| 24 | Admin dashboard `/admin/dashboard` | Planned |
| 25 | Users `/admin/users` | Planned |
| 26 | Content review `/admin/content-review` | Planned |
| 27 | Remaining admin moderation/analytics/eval surfaces; audit API parity before defining routes | Planned |

## Per-page acceptance

1. Read its current flows and backend contracts through Graphify-first exploration.
2. Build real working interactions; expose loading, empty and error states where applicable.
3. Check 375px, tablet and desktop layouts; light/dark; keyboard; reduced motion.
4. Run frontend typecheck, touched-file lint, terminal regressions and production build.
5. Review browser screenshots and navigation/interaction behavior. Record exact limitations.
6. Update this plan and append a checkpoint to master-plan §11; stop before the next page.

## Homepage scope

Guest entry remains public. Existing signed-in redirect is preserved. The new GUI homepage loads
without the retro five-second intro; the classic homepage remains available in CLI appearance.
Appearance selection on `/` must persist without redirecting guests into authenticated routes.
Workspace preview controls switch **the example**, not the account's interface mode or learner state.
Public CTA destinations use existing register/login/articles routes. No invented courses, prices,
testimonials, user counts or success guarantees.

## Homepage checkpoint — 2026-10-08

- Implemented responsive navigation, hero, original learning preview, three-step story, GUI/CLI
  explanation, native FAQ disclosures, final CTA and footer. All register/login/articles links use
  existing routes. Those destination pages are intentionally still legacy until their checkpoints.
- Scoped reusable GUI light/dark tokens live in `frontend/components/gui/gui-theme.module.css`;
  homepage layout and motion are isolated in its own CSS Module. No packages or backend changes.
- Preview lesson/quiz/terminal controls are local examples. Radio answers, disabled-until-selected
  submission, correct/incorrect explanation and polite announcements work without API writes.
- Homepage appearance switching persists via the existing provider with navigation explicitly
  disabled. CLI keeps its original homepage/intro; the return-to-GUI control is available even
  during the intro. Existing workspace switch callers still navigate as before.
- Passed frontend `npx tsc --noEmit`, touched-file ESLint, seven Node test files (homepage + terminal
  regressions), theme-separation guard and production build. Sandboxed build stalled; the permitted
  unsandboxed build passed. Existing multiple-lockfile workspace-root warning remains unchanged.
- Browser checked 375px, 768px and desktop layouts; light/dark; mobile menu/Escape/focus return;
  quiz wrong/right/disabled states; FAQ expansion; example terminal; GUI/CLI switching and reload
  persistence; production homepage and CTA destinations. No homepage browser errors observed.
- Reduced-motion CSS and observer handling are implemented and inspected. Browser tooling did not
  expose media-preference emulation, so an OS-level reduced-motion smoke test remains for the user.
  Signed-in redirect code is preserved; no authenticated account session was exercised.
- Stop here for homepage feedback. Login is the next page, not part of this change.

## Homepage identity experiment — 2026-10-08

User approved the first draft, staged it, and requested a bolder project-specific variation.
The staged snapshot remains unchanged; this experiment is an unstaged working-copy change.

- Direction: **The Connection Workshop**. Forest ink, warm paper, citron highlighter, terracotta
  connection cues, editorial typography and a dotted working surface. Original headline:
  “Ideas aren’t islands.” The theme override is homepage-only; the shared master remains unchanged.
- Custom vector **recall knot** mark replaces the generic Layers icon throughout the GUI homepage.
  An S-shaped route and square terminals echo source:dev and learning/returning. Reusable brand
  component, no bitmap, dependencies, external generation, paid provider calls or wider brand rollout.
- Interactive hero map: native graph-node buttons and numbered controls both select Learn,
  Connect or Recall, with pressed states, focus outlines and a shared polite explanation. The same
  recipe data powers the page's three cards. The illustration never alters learner/account state.
- Existing quiz, FAQ, auth/article links, light/dark provider and public CLI/GUI switch are retained.
  Reduced-motion anchor navigation also focuses its target, including the skip link.
- Checked 375px, 768px, 812px landscape and 1440px desktop; light/dark; map node and keyboard
  selections; selected-control synchronization; recipe navigation; mobile menu/Escape/focus; sample
  quiz; public CLI/GUI switching; and production font/color rendering. Fixed mobile grid minimum
  widths and aspect-ratio overflow, plus stylesheet-order specificity. No homepage console errors.
- Frontend typecheck, touched-file lint, seven homepage/terminal test files, theme-separation guard
  and production build passed. Existing workspace-root warning remains. No authenticated session
  or OS-level reduced-motion emulation was exercised. No backend edits, commits, staging or pushes.
- Rationale and token/component ownership: `design-system/source-dev/pages/homepage-experiment.md`.
  Stop for review of this variation before moving to login or adopting these tokens more widely.

## Homepage product-copy / orange refinement — 2026-10-08

- User approved the layout and identity, requested accurate product messaging and orange throughout.
  Retained the recall-knot geometry, interactive learning loop, recipe and purposeful motion.
- Unified shared opt-in GUI tokens: orange buttons/accents/logo, peach highlights, warm neutrals
  and near-black ink; dark mode uses warm charcoal and peach-orange. Removed forest/citron
  overrides, green demo indicators and green terminal-preview colors. Actual CLI is unchanged.
- Hero, recipe, workspace labels, interface explanation, FAQs and CTA now describe actual flows.
  Added explicit AI course generation/BYOK, concept discussion/private Ask AI and developer
  authoring/reviewed-publication cards. Examples remain illustrative; no inventory/usage claims.
- Passed frontend typecheck, touched-file ESLint, all seven homepage/terminal test files, theme
  separation and production build. Added normal-text color-pair contrast checks for both themes.
  Existing multiple-lockfile workspace-root warning remains unchanged.
- Browser checked desktop, 768px tablet and 375px mobile, light/dark palettes, card/diagram/CTA
  bounds, keyboard map selection, menu Escape/focus, quiz feedback, terminal example and FAQ.
  Production rendering was checked separately. No homepage console errors observed.
- No authenticated session or OS-level reduced-motion emulation was exercised. Existing reduced
  motion and auth/appearance behavior is retained. No backend, dependencies, staging, commits or
  pushes. The user's staged baseline is untouched; stop for feedback before login.

## Login checkpoint — 2026-10-08

- Orange GUI login now uses the shared recall-knot identity, light/dark tokens and an illustrated
  roadmap/concept/practice loop. Mobile puts the form first. The existing terminal login lives in
  its own component and is preserved apart from its export and return-to-GUI control.
- GUI mode opens without the terminal boot sequence. Switching appearances persists on `/login`
  without navigating to a workspace. Email/password, Google/GitHub, recovery links and developer/admin
  destinations retain the existing API/session contracts; no backend or dependency changes.
- Reusable GUI feedback provides persistent, dismissible errors and informative loading/success
  states. Field blur and submit validation, focusable summaries with field links, retained inputs,
  password visibility/autocomplete, duplicate-submission protection, a 20-second request timeout,
  cancellation/unmount abort, storage-failure recovery and OAuth-back recovery are implemented.
- Passed frontend typecheck, ESLint for the new GUI route/components/helper/tests, nine Node test
  files (homepage, feedback, sign-in and six terminal files), theme-separation guard and production
  build. The moved CLI has pre-existing render-time ref lint errors and an OAuth location warning;
  its original implementation was compared with the staged source and left unchanged. Existing
  multiple-lockfile build warning remains.
- Browser checked 375px mobile, 768px tablet and desktop; light/dark; GUI/CLI switching and reload
  persistence; field-summary focus, password visibility and a real intentionally rejected API login.
  Production rendering and error-summary focus were checked separately. Auth links retain existing
  destinations. Successful session/role routing and cancellation are covered by helper tests, not
  an authenticated browser session. Full provider consent and OS reduced-motion smoke remain manual.
- Design notes: `design-system/source-dev/pages/login.md`. Existing staged homepage work is
  preserved; no staging, commits or pushes. Stop for login review; register is next, not started.

## Register checkpoint — 2026-10-08

- GUI registration carries the approved orange identity into a simple name/email/password form,
  with explicit password requirements, browser autocomplete/paste support, optional visibility,
  field-blur validation and a focusable linked error summary. Light/dark and form-first mobile
  layouts reuse the auth shell and GUI feedback rather than introducing another design system.
- Login and Register now share `GuiAccountForm` for validation presentation, OAuth recovery,
  duplicate-submit protection, request lifecycle and success navigation. Registration retains
  existing name rules, `/auth/register`, browser timezone detection, auth events/session marker
  and role destinations. No role picker, fabricated verification or new password policy.
- Persistent messages cover existing email, timeout/network ambiguity, server/rate-limit errors
  and account-created/session-storage failure. Recovery offers sign-in/reset where appropriate.
  Pending registration disables repeat submissions; leaving aborts response handling but cannot
  undo server-side creation, so it deliberately has no misleading cancellation control.
- Original terminal registration moved intact except its export and GUI-return control; compared
  directly with the tracked source. GUI/CLI switching and reload stay on `/register` and preserve
  appearance. Existing CLI ref lint errors and OAuth location warning remain baseline issues.
- Passed typecheck, new/changed GUI/helper/test ESLint, eleven Node test files (shared form,
  feedback, homepage, sign-in, sign-up and six terminal files), theme guard and production build.
  Existing multiple-lockfile warning remains. No backend, dependency, staging, commit or push.
- Browser checked mobile 375px, tablet 768px, landscape 812px and desktop; light/dark; empty/invalid
  validation, international letter-name correction, summary/dismissal focus, password visibility,
  GUI/CLI and reload persistence. Production Register → Login navigation and Login validation/
  visibility were regression-checked; no production console errors observed.
- No real account was created. Request/persistence/success, conflict, storage, ambiguous failure
  and abandoned-response behavior are helper-tested; real sign-up, full external provider consent
  and OS-level reduced-motion remain manual checks. Design notes: `design-system/source-dev/pages/register.md`.
  Stop for review. Password recovery and OAuth callback are next; not redesigned in this checkpoint.

## Recovery / callback checkpoint — 2026-10-09

- User approved continuing to checkpoint 4 and requested a different Register illustration.
  Register now has an original, decorative course-draft canvas with a module and concepts;
  Login keeps its learning loop. Both use the orange master palette and existing vector identity.
- `/forgot-password` and its `/reset-password` alias select GUI or preserved CLI recovery.
  The GUI follows the actual backend contract: email → six-digit OTP → new password → sign in.
  No reset-link flow, account-existence disclosure or automatic login is invented.
- Native labels/autocomplete, formatted-code normalization, retained input, focused linked
  validation, phase-heading focus, duplicate prevention, timeout/unmount handling, 60-second
  resend cooldown and explicit loading/success/restart/error states are implemented. Reset
  tokens and password fields are memory-only; leaving cannot undo a completed backend write.
- OAuth callback now uses shared verification in both modes, with an isolated request client
  that does not inject an old token or globally redirect 401s. Profile verification precedes
  auth persistence; only new accounts attempt optional timezone sync. Query secrets are removed
  from the address/history entry after capture. GUI gets real pending/error/success states and
  role-based navigation; CLI keeps its existing terminal loader/error presentation.
- A callback-only exception to the workspace 401 redirect protects verification from old-session
  background preference requests. Normal protected routes retain their existing auth guard.
- Passed typecheck, touched-code ESLint, fourteen Node test files, theme separation and production
  build. The moved recovery CLI was compared with HEAD: only its export and GUI-return control
  changed. Existing Login/Register CLI lint issues and multiple-lockfile build warning remain.
- The workspace-client internal-location assignment lint warning is also pre-existing; the
  callback safeguard leaves protected-route navigation behavior unchanged.
- Production browser checks covered desktop, 768px tablet, 375px mobile and 812px landscape bounds;
  light/dark, empty-field summary/field/dismissal focus, generic unknown-email request, formatted
  incorrect code, real error/pending UI, cooldown/resend/restart, reset alias, GUI/CLI reload
  persistence, missing/malformed-error/invalid-token callback and query removal. No application
  console errors observed. Register's distinct artwork was checked in both themes and mobile.
- Successful OTP/password update, browser-storage failure and successful provider session paths
  are helper-tested, not authenticated browser-tested. Actual inbox delivery, user-operated
  password change/provider consent and OS reduced-motion smoke remain manual. No real password
  or account was changed. No backend, packages, staging, commits or pushes.
- Notes: `design-system/source-dev/pages/auth-recovery.md` and the Register artwork addendum.
  Stop for review; checkpoint 5 (developer dashboard) has not started.

## Mode-aware navigation loading follow-up — 2026-10-09

- Fixed the root, developer and admin route fallbacks and both protected-layout loading gates.
  They now wait for the existing appearance preference: GUI uses a shared orange branded status,
  CLI retains its terminal loader. The auth preference placeholder reuses the GUI status.
- GUI completion follows actual request completion, with no terminal minimum-duration delay.
  The small CSS entrance delay avoids flashes without holding navigation; status announcements,
  shared light/dark tokens, responsive sizing and reduced-motion handling follow the UI skills.
- Both legacy terminal overlay bridges now refuse creation in GUI, remove themselves after a
  mode switch and stop animating. CSS hides them immediately when the document mode changes.
  CLI boot presentation/timing, auth guards and recent-sign-in fallback suppression are preserved.
- Passed typecheck, new-code ESLint, fifteen Node test files, theme separation and production
  build. The legacy loaders retain exactly their baseline two purity errors and seven warnings;
  the admin layout's three existing warnings also remain. Multiple-lockfile build warning unchanged.
- Browser checked homepage → login → homepage and CLI → GUI; actual pending navigation displayed
  the GUI status without terminal overlays. An isolated response-delay proxy was used only for QA,
  not application code. Additional dark/mobile screenshot capture was inconclusive after preview
  connection/automation failures. CSS/tests cover theme, sizing and reduced motion; authenticated
  protected gates and OS-level reduced-motion smoke remain manual. No real auth action performed.
- No backend/dependency changes, staging, commits or pushes. Dashboard checkpoint remains unstarted.
  Design note: `design-system/source-dev/pages/navigation-loading.md`.
