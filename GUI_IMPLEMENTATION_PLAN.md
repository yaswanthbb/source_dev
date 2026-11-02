# source:dev GUI — page-by-page rollout

Direction approved: clean, attractive and simple, inspired by https://www.gitbook.com/,
with purposeful animation. Develop **one page at a time**, validate it and get visual feedback
before moving on. No commits or pushes. Preserve the CLI and existing APIs; backend changes require
explicit approval (checkpoint 8 has approval for a read-only lesson media field).

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
| 4 | Forgot/reset password and OAuth callback | Approved; continued on user instruction |
| 5 | Developer dashboard `/developer/dashboard`: shared authenticated GUI shell | Approved; continued on user instruction |
| 6 | Roadmap browser + roadmap overview `/developer/roadmaps`, `/developer/roadmaps/[reference]` | Approved; continued on user instruction |
| 7 | Module overview `/developer/roadmaps/[reference]/modules/[moduleReference]` | Approved; continued on user instruction |
| 8 | Lesson reader: diagrams, media, progress and accurate GUI↔CLI location mapping | Approved; continued on user instruction |
| 9 | Quiz / answer feedback | Approved; continued on user instruction |
| 10 | Review session and queue (FSRS read model) | Approved; continued on user instruction |
| 11 | Lesson discussion + private Ask AI | Approved; continued on user instruction |
| 12 | Own content `/developer/content` | Approved; continued on user instruction |
| 13 | Roadmap authoring `/developer/content/[roadmapId]` | Approved; continued on user instruction |
| 14 | New lesson `/developer/concepts/new` | Approved; continued on user instruction |
| 15 | Edit lesson `/developer/concepts/[id]/edit` | Approved; continued on user instruction |
| 16 | AI generation/jobs `/developer/generate` (existing APIs; explicit paid actions only) | Approved; continued on user instruction |
| 17 | Provider keys `/developer/keys` | Approved; continued on user instruction |
| 18 | Public articles `/articles` | Implemented; ready for visual review |
| 19 | Article reader `/articles/[id]` | Implemented; ready for visual review |
| 20 | Own articles `/developer/articles` | Implemented; ready for visual review |
| 21 | Article editor `/developer/articles/[id]/edit` | Implemented; ready for visual review |
| 22 | Profile `/profile` | Implemented; ready for visual review |
| 23 | Notifications (shared surface) | Implemented; ready for visual review |
| 24 | Admin dashboard `/admin/dashboard` | Implemented; ready for visual review |
| 25 | Users `/admin/users` | Implemented; ready for visual review |
| 26 | Content review `/admin/content-review` | Implemented; ready for visual review |
| 27 | Admin API-parity audit + AI jobs `/admin/jobs` | Implemented; ready for visual review |
| 28 | Admin articles `/admin/articles`: review, reasoned deletion and existing admin editor handoff | Implemented; ready for visual review |
| 29 | Contextual discussion moderation parity + remaining admin navigation audit | Implemented; ready for visual review |
| 30 | Evaluation inspection `/admin/evaluation`: rubric, goldens, known run and question metrics + write/serving audit | Implemented; ready for visual review |
| 31 | Prompt candidates and explicit evaluation execution (shadow/regression/comparison/saved compilation) | Implemented; ready for visual review |
| 32 | Expert review and question replacement decisions | Implemented; ready for visual review |
| 33 | Prompt release approval and rollback | Implemented; ready for visual review |

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

## Developer dashboard checkpoint — 2026-10-09

- `/developer/dashboard` now selects a new orange GUI dashboard or the original terminal dashboard.
  The latter was moved intact, with only the exported function renamed; terminal commands, motion,
  data queries and account controls remain unchanged. Preference readiness remains mode-aware.
- Added a reusable, opt-in workspace shell: recall-knot brand, named sidebar navigation, mobile
  disclosure/Escape/focus return, account/profile/admin-view access, theme and CLI switches, and a
  native GUI logout confirmation. Confirmed logout clears the same auth/query/terminal caches.
  The developer auth layout remains unchanged; unfinished routes keep their own frames.
- Primary cards cover most-recent in-progress concept and the real review queue. FSRS total due,
  available session, held-back and unavailable counts are distinct. CLI learning/roadmap/review/
  notification handoffs are explicitly marked and persist mode without racing default navigation.
  GUI learning pages are the next checkpoint, not invented here.
- Real account XP/streak/completed-concept/award metrics, year-of-XP activity with an exact-data
  table, four real roadmap cards with individual progress, earned/catalog milestones and timestamped
  recent events are wired to existing APIs and shared React Query keys. Only displayed roadmaps
  fetch progress; failures do not become fake zero totals. No estimated historical XP awards.
- Independent loading, empty, retry and stale-refresh feedback preserve usable sections. Dashboard
  requests have abort signals, a 12-second timeout and one retry. Existing progress hook is reused.
  Scoped light/dark tokens, finite entrances and reduced-motion CSS follow the UI skills.
- Passed typecheck, new-code ESLint, sixteen Node test files (including thirteen dashboard checks),
  theme separation and production build. Existing multiple-lockfile warning remains.
- Browser visual QA used the actual components rendered in an isolated, visibly labelled sample-data
  fixture with bundled project fonts: desktop, 375px phone, 768px tablet and 812px landscape bounds,
  light/dark and loading/error/empty presentations. This is layout QA, not an authenticated API smoke.
  Mode handoff, menu Escape/focus, modal focus restoration and logout cleanup are component-tested.
  Live signed-in requests/navigation and OS reduced-motion still require a user-operated check.
- No backend/dependency changes, agent staging, commits or pushes. User changes remain preserved.
  Notes: `design-system/source-dev/pages/dashboard.md`. Stop for dashboard feedback; checkpoint 6
  (roadmap browser/overview) has not started.

## Roadmap browser / overview checkpoint — 2026-10-09

- User approved the dashboard and requested the next checkpoint. Added opt-in GUI learning routes
  under the existing developer auth guard; no changes to backend visibility or publishing rules.
  Dashboard browse/view-all/roadmap links and the shared sidebar now lead to the GUI browser.
- Browser: actual catalog cards, title/description search, origin filter, newest/A–Z sorting,
  accessible result counts and eight-card pagination. Only displayed cards request progress.
  Missing progress is a retryable error, not fake 0%; origin and private-draft labels use API data.
- Overview: real description/counts, ordered native module disclosures, visible concepts, progress,
  completion/in-progress/untracked states, difficulty/question counts and per-placement prerequisites.
  Next-concept guidance requires loaded progress and satisfied prerequisites; stale errors retain
  data but suppress the recommendation. Draft visibility and tracked totals are explained separately.
- Module/lesson links remain explicitly labelled CLI handoffs until their own checkpoints. They carry
  exact VFS placement plus concept ID. Shared VFS normalization/collision handling is reused rather
  than inventing module slugs. Overview resolves API IDs and CLI names through the visible catalog.
- GUI projection now renders roadmaps and uses them as the nearest page for deeper locations without
  overwriting a same-roadmap concept/module position. Developer-shell mode switching stays in the
  developer shell even for admins. CLI URL synchronization runs only on terminal routes, preventing
  a GUI-to-CLI click from resetting location before navigation. Initial CLI visits redirect; explicit
  GUI links own later mode navigation and are protected from a competing overview redirect.
- Orange master tokens, light/dark, native labelled search/selects/disclosures, helpful no-results
  guidance, persistent errors/retries, skeleton states and finite/reduced-motion entrances follow the
  UI skills. Existing shared progress/detail hooks now accept abort signals and 12-second timeouts
  with one retry; their keys/normalization/contracts are unchanged. The legacy bulk hook is untouched.
- Passed typecheck, touched-file ESLint, seventeen Node test files (fifteen focused roadmap checks),
  theme separation and production build. Existing multiple-lockfile workspace-root warning remains.
- Browser QA used actual interactive components/bundled fonts in a visibly labelled sample-data
  fixture, not a fabricated authenticated application session. Checked desktop, 375px phone, 768px
  tablet and 812px landscape bounds, light/dark, search/no-results/clear/origin/sort, roadmap navigation,
  module disclosure, mobile menu Escape/focus and loading/error/empty presentations. No console errors.
  CLI handoffs/provider location preservation/initial redirects are component-tested. Live signed-in
  API requests, permission revocation, retry recovery and OS reduced-motion remain manual checks.
- Temporary preview stopped and browser overrides/tab cleaned up. No backend, dependency, account,
  paid-provider, staging, commit or push actions. Existing user changes preserved. Notes:
  `design-system/source-dev/pages/roadmaps.md`. Stop for review; module overview is next, not started.

## Module overview checkpoint — 2026-10-09

- User approved continuing from roadmaps. Added a nested module GUI route beneath the existing
  developer auth guard. Server params are awaited and passed as plain strings; handlers stay client-side.
- Warm orange module header, original finite path-drawing motif, ordered numbered lesson cards,
  accurate difficulty/question counts, completion labels and per-placement prerequisite guidance.
  Breadcrumbs, previous/next modules and the current-marked roadmap module index provide navigation.
- Module-only progress counts tracked placements in the selected module, excluding other modules
  and untracked drafts. Recommendations stay inside this module while checking prerequisite completion
  across the roadmap. No reading-to-completion shortcut, invented timing or learning-state writes.
- Reused visible catalog/detail/progress APIs, shared query keys, bounded/abortable requests and
  feedback. Initial loading/errors, retries, empty modules, zero tracked concepts, cached refresh
  warnings and generic missing/wrong-parent/404 feedback remain distinct. Failed reads never become
  fabricated zero progress, and stale progress suppresses the next-lesson recommendation.
- Roadmap module links now open GUI. Lessons retain labelled exact CLI path + concept-ID handoffs
  until checkpoint 8. Module projection is real; a CLI concept projects to its nearest module without
  discarding its precise saved position. API IDs and collision-safe VFS names resolve under the visible
  parent; direct CLI module visits resolve names before handoff and explicit links own later navigation.
- UI styling/UX skills informed the three-level breadcrumb, semantic lesson/navigation hierarchy,
  persistent feedback, 44px controls and mobile wrapping. Scoped orange light/dark tokens are reused;
  the brief drawing and page entrance stop for reduced motion. No CLI recoloring or new dependencies.
- Passed typecheck, touched-file lint, seventeen Node test files including twenty-five focused
  roadmap/module checks, theme-separation guard and production build. Existing multiple-lockfile
  workspace-root warning remains. No backend, migration, credentials, paid-provider or Git publishing.
- Actual components/bundled fonts checked in a labelled interactive sample fixture: desktop, 375px
  phone, 768px tablet, 812px landscape, light/dark, module/roadmap navigation, mobile menu Escape/focus,
  initial pending/error/empty and stale progress. No console errors or horizontal viewport overflow.
  This is component layout/interaction QA, not live authenticated API smoke. Signed-in permission,
  retry recovery and mode-switch smoke plus OS reduced-motion remain manual; seams are component-tested.
- Temporary preview stopped and browser overrides/tab cleaned up; user changes preserved. Notes:
  `design-system/source-dev/pages/module.md`. Stop for module review; lesson reader is next, unstarted.

## Lesson reader checkpoint — 2026-10-09

- User approved continuing from the module overview, plus the read-only media API field and Mermaid
  dependency. Added `/developer/roadmaps/[reference]/modules/[moduleReference]/lessons/[conceptReference]`
  beneath the existing auth guard. Server params remain plain strings; resolve roadmap, module and
  lesson references under the visible parent using shared VFS names, IDs and placement IDs.
- Warm orange reader with real Markdown, readable code/copy feedback, tables, quote callouts,
  source-labelled diagrams, section links, module lessons and adjacent lessons across modules.
  Desktop keeps a quiet reading column; phone/tablet navigation uses native collapsible disclosures
  to put content first. Scoped light/dark, focus/44px controls and reduced-motion entrance rules.
  UI styling/UX skills informed content hierarchy, accessible navigation and persistent feedback.
- The existing lesson API now returns ordered `{id, kind, payload, license}` media after the shared
  visibility guard. No migration, media generation, provider, publishing or quota changes. Stored
  diagram placeholders and Mermaid fences render lazily with strict security, fixed configuration,
  size/edge bounds and source fallback. SVG stays an inert image; raw author HTML and unsafe links
  are blocked. External images and YouTube players require an explicit load click. Video IDs choose
  a fixed privacy-enhanced embed host, with close-player and external-watch fallback links.
- Opening an approved nonempty lesson starts progress once per mounted placement; failure remains
  visible with retry and does not block reading. Completion is explicit, never automatic from reading.
  Fresh parent/content visibility reads must finish before starting, changing location or completing.
  Cached quiz/progress failures disable it. Before POST, four fresh reads verify accessible lesson,
  current placement, tracking, per-placement prerequisites and resolved quiz status (zero questions
  is valid). The existing completion API does not itself enforce those gates; these client checks
  are UX safeguards, not a substitute for backend authorization. Backend hardening is outside this
  approved read-only extension. Show saved success only after the actual completion acknowledgement.
- Roadmap/module lesson and continue links now open GUI; developer concept projection reaches the
  exact lesson instead of its module. Direct CLI visits and explicit reader handoffs preserve the
  exact placement path plus concept ID, including developer-shell semantics for admins. Quiz GUI
  remains checkpoint 9; the reader clearly directs knowledge checks to the existing terminal.
- Passed frontend typecheck, touched lint, 223 regressions across 17 Node test files (37 roadmap/reader
  checks), theme guard and production build; backend typecheck and 55 suites / 661 tests. Existing
  multiple-lockfile warning remains. Mermaid is pinned to 12.1.0, with a scoped KaTeX 0.18.2 override
  removing its new transitive advisory; 12 existing audit findings remain (11 high, 1 critical), with
  affected dependency versions unchanged. No broad dependency upgrades or audit-fix actions.
- Browser-checked actual production components in an explicitly labelled sample fixture: 1440px
  desktop, 375px phone, 768px tablet and 812px landscape; light/dark; rendered flowchart and math;
  invalid-source fallback; diagram disclosure; section targets; copy; mobile disclosures and menu
  Escape/focus; pending/error/empty/stale/save-error/completion-error and sample success. No viewport
  overflow or unexpected console errors. This is not an authenticated API smoke test; real permission,
  start/completion/retry and mode-switch smoke, external video playback and OS reduced-motion remain
  manual. Video opt-in/embed/close behavior is component-tested without third-party requests.
- Temporary public fixture removed and preview server stopped. Browser tab/viewport cleanup was
  blocked by the connection-error page URL policy; temporary preview tabs may remain. Existing
  servers and user changes preserved. No staging, commits or pushes. Notes:
  `design-system/source-dev/pages/lesson.md`. Stop for reader review; quiz page is next, not started.

## Quiz checkpoint — 2026-10-10

- Added the nested `/developer/roadmaps/[reference]/modules/[moduleReference]/lessons/[conceptReference]/quiz`
  route under the existing developer auth guard. Reader knowledge-check links now open this GUI.
  Shared parent-scoped placement/VFS resolution and exact concept location remain unchanged.
- Orange question cards, native labelled radios, per-question saved counters, previous/skip/question
  navigation, answer-key reveal after resolution only, resolved/correct summary and return-to-reader.
  Skipping and selecting don't spend an attempt. Resolved by exhaustion is never called correct or
  mastered. No made-up explanations, XP awards or new backend fields; existing status is authoritative.
- UI styling/UX guidance shaped readable hierarchy, native keyboard selection, focused persistent
  feedback, 44px controls, one-column small-screen flow and finite reduced-motion-aware entrance.
  Existing orange master/fonts/Lucide/CSS modules retained; no packages or palette replacement.
- Guarded lesson GET precedes question/status reads. Student-facing projection strips author/admin
  answer and distractor metadata. Inconsistent/partial snapshots fail visibly, not as an empty quiz.
  Fresh lesson, roadmap placement, progress, questions and attempts are rechecked before exactly one
  POST. Changed questions/history, inaccessible placement, drafts and missing prerequisites block it.
- Attempts are never retried automatically. Rapid clicks are deduplicated; pending saves lock choices
  and question controls. Unconfirmed/invalid acknowledgements never show saved success and lock
  answering until an explicit successful fresh-status review. Last-confirmed counters are labelled
  when an answer is unconfirmed. Successful acknowledgements refresh quiz/progress/reward/review data.
- Existing backend quiz question/status/attempt endpoints do not enforce the shared lesson visibility
  predicate themselves. These GUI preflight/approval/prerequisite checks are UX safeguards, not server
  authorization or a cross-tab transactional attempt limit. Server-side hardening is a separate task;
  no backend/migration/generation/provider/quota changes in this checkpoint. Backend auto-completes a
  lesson once all questions resolve, including exhausted attempts; GUI confirms via roadmap progress.
- Explicit/direct quiz CLI handoffs retain exact placement and concept ID with `view=quiz`. The terminal
  entry composes only literal `quiz` plus a validated single reference, never an arbitrary URL command.
  General GUI/CLI appearance switching keeps concept location, not unsaved radio selection/session step.
- Passed frontend typecheck, touched lint, theme-separation guard and 238 regressions across 17 files
  (52 roadmap/reader/quiz checks). Production route built with Turbopack before preview; subsequent
  Turbopack CSS worker port binding was blocked even after approved retry. Supported webpack build
  verified the sample preview; final fixture-free webpack production build also passed. Existing
  multiple-lockfile warning and previously recorded dependency advisories remain; no broad upgrades.
- Actual component browser QA used labelled sample data without account/API writes: 1440px desktop,
  375px phone, 768px tablet, 812px landscape, light/dark, radio keyboard selection, wrong/correct saved
  feedback, next-heading focus, menu Escape/focus and empty/pending/resolved/unconfirmed/stale states.
  No horizontal viewport overflow or browser console errors observed. Live authenticated API and
  cross-tab/permission/mode-switch flows, initial-load retry and OS-level reduced motion remain manual.
- Sample fixture removed, localhost preview stopped, browser viewport reset and temporary tab closed.
  User servers/changes preserved. No staging/commits/pushes. Notes: `design-system/source-dev/pages/quiz.md`.
  Stop for quiz review; checkpoint 10 (FSRS review queue/session) is next, not started.

## Checkpoint 10 — review queue and session (2026-10-10)

- User continued from quiz checkpoint 9. Added `/developer/review` under existing auth;
  dashboard and shared workspace navigation now link to the real GUI review surface.
- Orange queue/session, original finite recall-loop motif, light/dark responsive layout,
  native radios, keyboard focus, persistent feedback and reduced-motion support. UI skills
  shaped these interactions; off-topic generated styles were not adopted over the master.
- Actual due, returned-session, held-back, unavailable and difficult-question values remain
  distinct. Legacy missing fields stay unknown, not invented zeroes. Lesson grouping is
  overview-only; sessions retain server order. Broken-option questions are disclosed/skipped.
- Freeze an explicit local batch; no mount writes or automatic grading/advancement. Fresh
  due/fingerprint/options and guarded concept preflight before one answer POST. Show only
  acknowledged correctness, correct answer, next civil due date, interval and XP. Reward/count
  cache invalidation uses shared keys. Finish/reload leaves unanswered items due on the server.
- Uncertain/malformed answers lock submission until explicit successful fresh queue check.
  Failed refresh does not unlock. Missing/rescheduled items aren't locally counted as saved or
  awarded XP; held-back/new items don't silently enter the batch. End summary is not “all clear.”
- Difficult-question lesson links resolve visible placements with existing guarded content,
  catalog/detail APIs and shared VFS names. Lookup is abortable with a total 12-second budget.
  Reviews never rewrite saved content position; explicit/direct CLI handoffs keep exact path
  plus allowlisted `view=review`, using existing terminal queue and explicit `review start`.
- Backend unchanged. Existing legacy review visibility and non-transactional concurrent-answer
  limits remain documented; GUI guards are not backend authorization or cross-tab exactly-once.
- Final frontend typecheck, touched-file ESLint, theme guard and **254 tests across 17 files**
  (**68 roadmap/reader/quiz/review checks**) passed. Fixture-free webpack production build passed;
  existing multiple-lockfile warning remains. Test harness now passes actual filenames to the
  TypeScript transpiler so `.ts` generics aren't accidentally interpreted as JSX. Removing the
  temporary preview briefly left stale generated Next types; final build regenerated them and
  the final standalone typecheck passes, without deleting the user's active dev cache.
- Labelled actual-component sample browser QA: 1440px desktop, 375px phone, 768px tablet,
  812px landscape, light/dark; keyboard radio selection, correct/wrong saved results,
  remediation, next/summary focus, pending/uncertain/loading/error/retry/empty/stale states,
  finish and menu Escape/focus. No horizontal overflow or console errors. Final native focus
  brings off-screen questions/feedback into view; disabled-option hover is suppressed.
- No authenticated account/API/scheduling writes in visual QA. Live signed-in visibility,
  actual scheduling/XP, uncertainty reconciliation, cross-tab/mode handoffs and OS reduced
  motion remain manual. Temporary fixture/server/tab removed and viewport reset. User
  servers/changes preserved; no migrations/dependencies/provider/staging/commits/pushes.
  Notes: `design-system/source-dev/pages/review.md`. Stop for review; checkpoint 11
  (lesson discussion + private Ask AI) is next, not started.

## Discussion privacy prerequisite — 2026-10-11

- User approved correcting the existing Ask AI question-body leak before the GUI.
  Persisted `target` protects whole private threads, including failed generation;
  access is asker/admin only, not concept author. Known-ID question/answer mutation
  paths use the same privacy guard. Public discussion behavior remains intact.
- New versioned migration backfills AI-backed questions without deleting text.
  Old failed requests have no saved target/provenance and require manual audit.
  Rollback refuses to remove privacy while any private questions exist.
- CLI privacy copy/thread actions match the new contract. Live migration is for
  the user to run; rollout and smoke checks: `backend/qa-privacy.md`. No live DB or
  provider action, and no staging/commit/push. Discussion GUI remains planned.
- Verified backend typecheck, 56 suites / 692 tests, touched backend lint; frontend
  typecheck, 255 tests across 17 files, touched lint, theme guard and production
  webpack build. Existing multiple-lockfile warning remains. Migration SQL tests
  use mocks, not live PostgreSQL; signed-in privacy smoke remains user-operated.

## Lesson discussion / Ask AI checkpoint — 2026-10-12

- User reported the privacy migration succeeded and requested the next page. Added
  nested lesson discussion route and reader link, scoped orange public/private
  forms, search/pagination, native validation/consent, ownership-based maintenance,
  author/admin verified controls and explicit deletion confirmation. Shared safe
  Markdown replies use unique heading prefixes; light/dark and reduced motion.
- Fresh guarded placement/account/thread checks precede every single write. No
  progress writes, automatic provider calls, optimistic content or mutation retries.
  Persisted privacy contracts fail closed. Uncertain outcomes lock until explicit
  fresh reads; warn about unfinished requests/duplicate charges, require new AI
  consent, keep text on errors and question/reply drafts across channel changes.
- Lesson/placement CLI handoff uses literal allowlisted `qa concept` and safe IDs;
  existing general mode projection stays at the reader. No quota balance invented.
- Labelled no-account/no-API sample checks desktop/mobile/tablet/landscape, light/
  dark, forms/focus/cancellation, privacy and all feedback states without overflow or
  console errors. Live authenticated/paid/cross-tab/mode smoke remains manual.
- Notes: `design-system/source-dev/pages/discussion.md`. No new dependencies,
  backend/migration actions, staging/commits/pushes. Own-content checkpoint 12 is next.
- Final frontend typecheck, 270 tests across 17 files (83 learning checks), touched
  lint (one pre-existing unused test variable warning), theme guard and fixture-free
  webpack production build pass. Existing multiple-lockfile warning remains.

## My content checkpoint — 2026-10-12

- User approved discussion and continued to checkpoint 12. `/developer/content` now
  selects a scoped orange GUI library or the preserved classic page. Search, status
  filters, newest/title sorting, six-card pagination, real dates/counts/origin, review
  feedback and effective scheduled changes use existing roadmap metadata.
- Only the signed-in user's own roadmaps are listed, including for admins. Missing
  counts stay unknown; initial loading/errors never imply an empty library. Contract
  and access failures hide private cache/form; ordinary refresh errors retain drafts
  and the last library while pausing creation. No learning-location writes.
- Native private-roadmap creation uses existing APIs: focused linked validation,
  current-account preflight, one guarded POST, no automatic retry, confirmed-only
  success and persistent pending/error feedback. Ambiguous results require an explicit
  successful fresh library check and warn about outstanding requests/duplicates.
  No exactly-once guarantee, AI generation, optimistic content or auto-redirect.
- Card and success links label the existing editor as classic. The original library
  implementation is identical apart from its export name; mode switching stays on
  this route. Roadmap authoring checkpoint 13 is not redesigned yet.
- Labelled local-only sample browser QA checks 1280px desktop, 375px phone, 768px
  tablet, 812px landscape, light/dark, filters/search/sort/pagination, validation and
  success focus, retained drafts, loading/error/empty/stale/pending/uncertain feedback,
  recovery and mobile menu Escape/focus. No overflow or console errors observed.
- Frontend typecheck, touched lint, 283 tests across 17 files (96 learning/authoring
  checks), theme guard and fixture-free webpack build pass. Existing unused test
  variable warning and multiple-lockfile build warning remain. Live signed-in
  creation/permission/mode and OS reduced-motion smoke remain manual.
- Temporary sample removed, its server/tab closed and viewport reset. No backend,
  migration, package, real-account, paid-provider, staging, commit or push actions.
  Notes: `design-system/source-dev/pages/content.md`. Stop for review; editor is next.

## Roadmap authoring checkpoint — 2026-10-12

- User approved continuing to checkpoint 13. The roadmap editor now selects a scoped
  orange GUI outline/review panel or the original classic editor, preserved apart from
  its export and plain roadmap ID parameter. Server page passes only the ID; both
  appearance switches stay on the authoring route without changing learner location.
- Existing module creation, own-lesson search/attach, detach, whole-roadmap submission
  and request/withdraw takedown are wired to existing APIs. New modules follow the
  maximum current order index. Published trees allow additions but hide detach; draft
  submission shows the real 3-module / 3-lessons-per-module minimums. Review metadata,
  pending drafts, feedback, deletion dates and takedown countdowns stay truthful.
- Strict account/ownership/placement/review projection keeps only metadata, never
  lesson or draft bodies. Admin attachment search is still own-only; raw generation
  booleans and transient origin labels yield equivalent metadata. Unknown structure
  or access/contract errors hide private cache; ordinary read errors retain the checked
  outline and drafts while pausing writes. Existing GET review normalizes elapsed
  unpublish dates before detail is read; no new backend/date-transition mechanism.
- Every write uses fresh account/tree/fingerprint and placement/lesson checks before
  one POST or DELETE, then verifies acknowledgement and saved state. No write retries,
  optimistic success, AI generation, quotas or progress writes. Ambiguous responses
  lock changes until explicit successful refresh, warning that an earlier request can
  still finish and repeating a change can duplicate it. No exactly-once guarantee.
- Native forms, linked/focused validation, retained drafts, persistent feedback and
  focused inline confirmations with Escape/cancel focus return. Changed checked data
  dismisses old confirmations without clearing module drafts (unit verified). Shared shell navigation
  now marks My content active on nested authoring routes. Library links no longer label
  this editor classic; new/edit lesson links still explicitly disclose classic view.
- Labelled actual-component local-only sample QA covered desktop, 375px phone, 768px
  tablet and 812px landscape; light/dark; search/attach, module creation, detach/cancel,
  submit/takedown/withdraw, validation/status focus, draft retention and all read/write
  feedback states, mobile menu Escape/focus. Fixed a phone module-heading squeeze by
  putting the attach button in its own grid row. No overflow or console errors observed.
- Verification: 299 frontend tests across 17 files (112 learning/authoring cases),
  touched-file lint, theme separation, classic preservation and final typecheck/build.
  Existing unused test variable and multiple-lockfile warning remain. Browser sample
  excludes real account/API actions; live permissions, cross-tab changes, effective-date
  transitions, signed-in mode switching and OS reduced-motion remain manual.
- Temporary sample removed, its server/tab closed and viewport reset. No backend,
  schema, package, account/provider, staging, commit or push changes. Design notes and
  manual checks: `design-system/source-dev/pages/roadmap-authoring.md`. Stop for visual
  review; checkpoint 14 (new lesson) has not started.

## New lesson checkpoint — 2026-10-12

- User approved the roadmap editor and continued to checkpoint 14. New lesson now
  selects a scoped orange writing desk or the classic form, preserved byte-for-byte
  except its export name. Server page reads/normalizes target query data and passes
  plain values; mode switches stay on the route without changing learner location.
- Native title/body labels, 200-character title and existing 20-character body minimum,
  difficulty radios, linked/focused submit summary, retained writing and an explicit
  Write/Preview switch. Preview reuses the safe reader renderer: skipped HTML, inert
  unsafe links, consent-gated external images, existing protected diagrams/code/tables.
  No autosave, AI/provider calls, fabricated publication or invented grading.
- My content includes a standalone new-lesson entry; each roadmap module’s new-lesson
  link carries its exact module/roadmap IDs. Module-only legacy links resolve one owned
  parent. Repeated/unsafe/wrong-parent/foreign/deleted targets fail closed instead of
  silently creating an unattached lesson. New/editing saved lessons are separate:
  editing remains labelled classic until checkpoint 15.
- Account and target are freshly checked before one POST /concepts. Exact owner,
  title, unchanged Markdown body, difficulty, pending/manual review metadata and ID
  must be acknowledged before reporting creation. ID-based metadata tolerates an
  empty legacy slug for international titles; backend slug behavior is unchanged.
- Linked saving then uses the existing guarded roadmap attachment helper. These are
  two separate writes, not a transaction. Attachment failure retains the confirmed
  lesson ID and blocks creating it again. Explicit fresh saved-lesson/module checks
  can enable attachment-only retry. Lost targets hide their old metadata while a
  freshly verified owned lesson keeps its classic edit link; account changes hide
  all private cache/form.
- Unknown create outcomes lock further creation until explicit successful metadata
  search using the original submitted title/difficulty, even if local writing changes.
  Candidate matches do not establish which request created them. Failed checks stay
  locked; warnings say earlier requests may still finish and repeat creation can
  duplicate lessons. No automatic retries or exactly-once guarantee.
- Confirmed saves retain readable submitted text and focused status; no forced redirect
  into the unfinished editor. A deliberate Start another lesson rechecks access and
  clears the form. Failed recovery feedback gets focus ahead of simultaneous saved
  feedback. Ordinary loading/network/stale/pending/uncertain states retain the draft.
- Labelled actual-component local-only browser sample checked desktop, 375px phone,
  768px tablet and 812px landscape, light/dark, validation/body links, difficulty,
  safe preview, create/attach/partial-recovery/target-loss, submitted text, explicit
  reset, all read/write feedback and mobile menu Escape/focus. No overflow or console
  errors observed. No signed-in account/content/provider writes were performed.
- Frontend typecheck, touched lint, theme guard, classic preservation, 317 tests across
  17 files (130 learning/authoring cases, 18 new lesson cases), diff check and final
  fixture-free webpack build. Existing unused test variable and lockfile warnings
  remain. Actual signed-in permissions, two-step save/attach, cross-tab transitions,
  mode switching and OS reduced-motion remain manual; notes list these checks.
- Temporary sample route removed, server/tab closed, viewport reset. No backend,
  schema, dependency, staging, commit or push changes; no migration needed.
  Notes: `design-system/source-dev/pages/new-lesson.md`. Stop for visual review;
  checkpoint 15 (edit lesson) has not started.

## Edit lesson checkpoint — 2026-10-12

- User approved new lesson and continued to checkpoint 15. Saved lessons now open
  an orange GUI editor or the preserved classic editor. Server route awaits a plain
  ID; mode changes stay on this route and never update learner location.
- The writing desk starts with a pending draft, including an empty one, when present.
  Checked saved body and pending draft have separate safe Markdown comparisons.
  Local writing survives rechecks and ordinary failures. Replacing the form with
  checked text is deliberate and confirmed; no autosave or automatic overwrite.
- Title/difficulty and body use separate existing PATCH requests. This avoids the
  backend staged-body early return skipping difficulty. Details update immediately
  while keeping body/review state; body saves explain immediate/staged/pending behavior
  in a native focused confirmation. No auto-chained save, approval or publication.
- Author/admin permissions are mirrored, including admin edits to another author
  or an unlinked author. Placement summaries do not imply publication or roadmap
  editing access. My content navigation and new-lesson/roadmap editor links now
  describe GUI editing accurately. Classic editor logic is kept byte-for-byte except
  its export and plain ID input.
- Fresh account ID/role, lesson fields, update timestamp and placement fingerprint
  precede one PATCH. Exact acknowledgement and a second fresh account/lesson read
  confirm details, staged draft or direct-body result. Other fields/origin must stay
  unchanged. No write retries, optimistic success, AI/provider/progress operations.
- Unknown transport/408/5xx/incomplete/mismatched/readback outcomes pause further
  saves until explicit successful checking. Failed checks stay locked; access/contract
  failures hide private cached text. Recovery warns that earlier requests may still
  finish and a read cannot identify the request that saved. Client preflight does not
  provide transaction isolation, cancellation or exactly-once behavior.
- Native labels/radios, linked error summary, body Write/Preview and honest matching/
  unsaved status. Feedback focuses after modal closure; successful recheck feedback
  has priority over previous saved feedback. Escape returns focus, checked-text reset
  focuses title. Shared safe reader skips HTML/unsafe URLs and gates external images;
  code/tables/protected diagrams reused with distinct local/saved/draft prefixes.
- Local-only actual-component production sample covered desktop, 375px phone, 768px
  tablet and 812px landscape, light/dark, field validation, retained edits on checks,
  staged/details saves, previews/comparisons, explicit reset, error/unknown/pending/
  admin/no-placement states and mobile menu Escape. Fixed a result-focus race when
  closing a save modal. No horizontal overflow or app console errors observed.
- Verification: 332 frontend tests across 17 files (145 learning/authoring cases,
  15 new edit cases), typecheck, touched lint, theme guard, classic comparison, diff
  check and final fixture-free webpack build. Existing unused test variable and
  multiple-lockfile warnings remain. A sandbox-only Next TypeScript subprocess
  failure cleared on an approved build outside the sandbox; no config changes.
- Real signed-in save/readback, author/admin permissions, cross-tab/stale races,
  route/mode continuity and OS reduced-motion remain manual. Temporary sample,
  server and tabs removed, viewport reset; no backend/schema/package/Git publishing
  actions or migration. Notes: `design-system/source-dev/pages/edit-lesson.md`.
  Stop for visual review; checkpoint 16 (AI generation/jobs) has not started.

## AI generation / jobs checkpoint — 2026-10-12

- User approved edit lesson and emphasized the next checkpoint. Added an authenticated
  GUI generation workspace for all three existing batch actions: roadmap modules,
  module lessons and module questions. Shared navigation, library and exact owned
  roadmap/module authoring links are wired. Single-lesson `concept ai` remains in the
  existing developer terminal; its registry and implementation are unchanged.
- Plain normalized target/job IDs cross the Server/Client boundary. Invalid, repeated,
  missing-parent and unavailable linked targets never trigger a job or silently bind
  a foreign module. Selection stays local and never overwrites learner location;
  CLI handoff uses the exact stored developer-shell path, including for admins.
- Provider/default-key metadata and applicable quota come from current APIs. Only
  metadata is retained; no key entry, decryption or secret storage here. Quota is
  distinct from provider pricing/reserved capacity, admin bypass is not labelled free.
  Model catalog loads only on request, with live versus curated fallback disclosure,
  current-key binding and an optional verified model override. No invented models/prices.
- Native scope radios/selects, linked focused validation and a native confirmation
  naming action, target, provider/key, model choice, quota gate, transmitted scope,
  saved output and existing automatic retry/fallback behavior. Consent starts unchecked
  for each request. The frozen confirmation snapshot is checked synchronously at
  dispatch as well as invalidated by effects, closing the stale-consent timing gap.
- Fresh account ID/role, owned target/tree, capacity, default-key/settings fingerprint,
  available quota, active target jobs and selected model precede one start POST.
  Returned job ID and a fresh requester-owned saved record must match the exact ID,
  type, target and approved provider/key/model snapshot before reporting acceptance.
  Acceptance is separate from completion; frontend never claims every item succeeded.
- Unknown transport/408/5xx/ACK/readback outcomes retain any known ID and pause writes
  until explicit successful checks. Failed checks do not unlock; renewed consent is
  required. Recovery warns of outstanding requests, charges and matching-job ambiguity.
  No automatic frontend start retry or exactly-once/cancellation/atomic-version guarantee.
- Own active jobs and unread results load independently of generation settings. Optional
  visible-page 5-second read polling stops on errors/background/unmount; normal polls
  do not move focus or announce empty checking pulses. Completed result IDs refresh
  relevant content/target/quota caches. Transition races prefer the later terminal row.
- Actual progress steps, distinct created/failed/skipped counts, failure reasons,
  retry lineage, legacy unknown snapshots and known-ID inspection. No fake percentages,
  cancellation or failed-only retry controls. Unread list is explicitly capped at 20.
  Mark reviewed sends one selected own finished ID and confirms its stored flag before
  removing a card; no optimistic dismissal or blanket acknowledgement. Content stays.
- Orange master, original finite SVG, shared GUI tokens, native 44px controls, light/dark,
  responsive desk/cards and reduced-motion support. Local-only actual-component sample
  checks desktop/375px/768px/812px, loading/unavailable/empty/quota/admin/uncertain states,
  model/fallback choices, unchecked/renewed consent, local acceptance, status focus,
  partial results/details/reviewed retention, known-ID reads, recovery and menu Escape.
  No overflow or app console errors; no real account, provider, paid generation or
  acknowledgement operations used for verification.
- Verification: 354 frontend tests across 17 files (167 learning/authoring checks,
  22 new generation cases), typecheck, touched lint, theme guard, diff check and final
  fixture-free webpack build. Existing unused test variable and lockfile warnings remain.
  Signed-in API/persistence, provider billing/routing, multi-tab/default-key races,
  pipeline-enabled/legacy output and OS reduced-motion smoke remain manual.
- Temporary sample/server/tabs removed, viewport reset. No backend/schema/package,
  staging/commit/push or migration work. Notes: `design-system/source-dev/pages/ai-generation.md`.
  Stop for visual review; checkpoint 17 (provider keys) has not started.

## Provider keys checkpoint — 2026-10-19

- User approved generation/jobs and continued to provider keys. Orange GUI at
  `/developer/keys`, scoped responsive light/dark styling, finite vector motif,
  shared shell/feedback/authoring controls. Classic implementation is preserved
  apart from its export; same-page appearance controls preserve learner location.
- Real metadata-only key/provider reads, independent current quota, two-key capacity,
  first-key default, explicit default/clear-default, labels, cap 1–50, current-key
  model choices and selected-key removal through existing APIs. No entry provider
  lookup or write. Shared-service quota failure does not block key management.
- Masked volatile key input; no query/mutation-cache, URL, storage or error-body
  retention. Fixed safe errors strip Axios request/config/response. Explicit unchecked
  named-provider contact/storage consent resets on relevant changes; synchronous
  saved-fingerprint binding prevents stale permission before effects run. Pre-save
  live lookup is separate from saving; changing the key/provider discards its catalog.
- Fresh account/role/owned list/fingerprint before one write; strict ACK plus fresh
  matching saved list before success. Unknown outcomes pause writes; only a successful
  explicit check unlocks, failed checks remain locked and unfinished-request warning
  remains. Native key-specific removal confirmation explains permanent stored-key
  loss, active-job guard, exact default fallback and lack of provider revocation.
- Shared key/provider parsers reuse generation metadata validation; generation page
  links now open the new GUI. No backend/schema/dependencies or migration work.
- 375 frontend tests across 17 files (21 new provider-key cases), typecheck, touched
  lint, theme guard, diff check, classic comparison and fixture-free webpack build.
  Existing unused test variable and multiple-lockfile warnings remain. Labelled
  local-only actual-component sample checked desktop/375/768/812, light/dark,
  metadata edits, validation, renewed consent, fallback catalogs, local saved/default/
  cap/removal state, modal Escape/focus, empty/full/unavailable/admin/pending/unknown
  states and recovery. No real credential/provider/account or billing test.
- Temporary sample/server/tabs removed, viewport reset. Signed-in persistence/access,
  real provider/model billing, worker deletion lock, multi-tab/account/default races
  and OS reduced motion remain manual; no atomicity/exactly-once/secret-erasure claim.
  All changes stay local, with no Git staging/commit/push. Details:
  `design-system/source-dev/pages/provider-keys.md`. Stop for visual review;
  checkpoint 18 (public articles) is unstarted.

## Public articles checkpoint — 2026-10-20

- User approved provider keys and continued to `/articles`. Orange public notebook,
  shared reading header/footer and GUI tokens, original finite vector artwork,
  responsive light/dark article cards with actual author/date/plain-text previews.
  Classic composition is retained, with error/loading/paging parity and a same-page
  return-to-GUI control; learner location and existing terminal behavior are unchanged.
- Server-only anonymous existing article GET, encoded title search, no credentials
  forwarded, 12-second abort and fresh no-store reads. Validated plain summaries only
  cross to clients; full body/account/curriculum metadata is not passed through.
  Invalid/repeated queries make no API read. Existing newest-first/title-match semantics
  stay intact. Backend returns a full array; 12-per-page presentation slices, totals,
  safe clamping and URL navigation do not imply new backend pagination.
- Native search resets pages, preserves shareable query URLs and distinguishes empty,
  no-match, unavailable, invalid and loading states. Native pager anchors and a guarded
  post-hydration animation-frame step focus the visible GUI/classic results heading;
  ordinary/loading/passive states do not steal focus. Both public HTML surfaces use
  the existing before-paint appearance selector. No auth gate or fabricated counts,
  popularity, reading times, models, writes or provider actions.
- Reader links remain existing ID routes with prefetch disabled; checkpoint 19 is
  unchanged. Writing links now use the real `/developer/articles` workspace rather
  than the previously missing `/developer/articles/new` route.
- 392 frontend tests across 17 files (17 new article cases), typecheck, touched lint,
  theme guard, diff check and final fixture-free production build. Existing unused test
  variable and multi-lockfile warnings remain. Local-only actual-component samples
  checked desktop/375/768/812, light/dark, search/page reset/counts, both-appearance
  native navigation/focus, reload, menu Escape, long titles/names, deleted author,
  empty/no-match/loading/unavailable states without overflow or app console errors.
- Temporary sample/server/tabs removed and viewport reset. No real article API/account,
  provider, content/progress write or billing test. Real service/persistence/large-list,
  live reader/authoring transitions, OS motion and screen-reader smoke remain manual.
  No backend/schema/dependency/migration/staging/commit/push work; existing local
  checkpoint 17 changes are preserved. Notes:
  `design-system/source-dev/pages/public-articles.md`. Stop for visual review;
  checkpoint 19 (article reader) has not started.


## Article reader checkpoint — 2026-10-21

- User continued to checkpoint 19, `/articles/[id]`. Shared orange public reading shell,
  responsive title/byline/UTC dates, bounded body, collapsible section navigation,
  safe formatted Markdown, copyable code, scrollable tables and local diagrams.
  Restored article-only bullet/number markers after the shared CSS reset. External
  images remain opt-in with host disclosure and retry; HTML/unsafe links stay inert.
- Anonymous server-only existing GET with omitted credentials, 12-second abort,
  fresh no-store reads and strict ID/body/author/date validation. Plain reading props
  exclude raw accounts, email/credentials, linked IDs/draft titles. Only true 404 or
  invalid IDs use the custom missing boundary; failures remain unavailable with fresh
  retry. Distinct loading, blank body and deleted-author states. Existing linked
  curriculum sign-in invitation retained without fetching protected targets.
- Classic JSX preserved with projected fields, literal Markdown, before-paint appearance
  selection and same-page return-to-GUI; no learner-location change. Shared renderer
  accepts an optional article label while preserving lesson defaults.
- 402 frontend tests across 17 files (10 new reader cases), standalone typecheck,
  touched lint, theme guard, classic comparison, diff check and final fixture-free
  webpack build pass. Baseline unused-variable/multiple-lockfile warnings remain.
  Labelled local samples checked desktop/375/768/812, light/dark, section navigation,
  copy/diagram/opt-in image failure, mobile menu Escape/focus, classic reload/return,
  every reading state and unbroken metadata/code/tables without GUI overflow.
  Actual invalid-ID route shows the custom not-found boundary and noindex, without API
  access. Screenshot saved; sample/server/tabs removed, viewport restored.
- No real article API/account/provider/progress/content/billing operation. Live service,
  real authoring/reader transitions, preference sync, curriculum visibility, remote
  image delivery, screen readers and OS motion remain manual. No backend/schema/package,
  migration or Git publishing changes; local checkpoints 17–18 preserved. Notes:
  `design-system/source-dev/pages/article-reader.md`. Stop for visual review;
  checkpoint 20 (own articles) has not started.


## Own articles checkpoint — 2026-10-21

- User continued to checkpoint 20, `/developer/articles`. Orange shared workspace,
  original finite pen/paper vector, responsive composer/library, actual last-checked
  own counts, title search/sort/six-item pagination and distinct loading/read-error/
  empty/no-match states. Safe local Markdown preview; linked validation summary,
  optional UUID fields, readable scoped errors, native 44px controls, reduced motion.
- Explicit publication review explains immediate public text/author visibility and no
  approval step; selected deletion confirms permanent loss. Native dialogs focus Cancel,
  support Escape/trapping/return. Drafts remain on ordinary failures/checks and after
  confirmed publication; explicit Start another clears and focuses title. No autosave,
  URL/storage/query-cache draft persistence or provider work.
- Existing account/list/detail/POST/DELETE APIs only; timed abortable reads without auto
  retry/refocus/reconnect writes. Account-scoped cache, fresh account/role/session and
  owned-list checks, strict projected metadata and exact ownership even for admins.
  Publishing requires matching acknowledgement plus detail/list readback. Deletion
  checks selected fingerprint/ownership, one DELETE, boolean ACK, actual 404 and list
  absence. Safe errors discard backend request/config/body; no optimistic writes.
- In-flight busy guard; ambiguous timeout/408/5xx/malformed ACK/readback pauses all writes
  and retains known IDs/context. Read-only checks never repeat mutations. Failed checks
  stay locked; successful checks require explicit review before resume, with retained
  late-request/duplicate warning. No atomicity/idempotency/cross-tab guarantee.
- Classic JSX preserved except named export, same-page GUI return, no learner-location
  change. Existing edit links explicitly say classic; checkpoint 21 editor is unchanged.
- 422 frontend tests across 17 files (20 new cases), standalone typecheck, touched lint,
  theme guard, classic/editor comparison, diff check and final fixture-free production
  webpack build pass. Existing test-variable and multi-lockfile warnings remain.
  Labelled resettable local sample checked desktop/375/768/812 light/dark, validation/
  focus/preview/long-content, publish/delete/cancel, retained drafts, start-another,
  search/sort/paging, loading/error/pending/empty, uncertain/failed-check/resume, admin
  and mobile menu Escape/focus without overflow or browser warning/error logs.
- Screenshot saved; sample/server/tabs removed and viewport restored. No real account,
  article/content/progress/provider/billing action in browser QA. Live persistence,
  authorization, link resolution, reader/editor transitions, preference sync, races,
  assistive technology and OS motion remain manual. No backend/schema/dependency,
  migration or Git publishing work; local checkpoints 17–19 preserved. Notes:
  `design-system/source-dev/pages/own-articles.md`. Stop for visual review;
  checkpoint 21 (article editor) is unstarted.


## Article editor checkpoint — 2026-10-21

- User continued to checkpoint 21, `/developer/articles/[id]/edit`. Shared orange
  workspace, original finite refinement vector, writing desk/saved-reference sidebar,
  actual author/UTC dates and ID-based public link. Responsive light/dark, local safe
  Markdown preview, escaped saved-text comparison, linked focused field validation,
  optional UUID/null clearing and no invented review/staging state.
- Explicit immediate-public-save confirmation, Keep writing initial focus, Escape/
  trapping/return, long-title wrapping and retained text after confirmed save. Dirty
  page-memory drafts survive ordinary failures and checks; no autosave/query/URL/
  storage draft payloads or navigation-persistence claim. Author/admin/orphan roles
  mirror the existing endpoint, with explicit admin override copy and stable authorship.
- Account/detail GETs and one PATCH only. Shared timed/abortable account/session helpers,
  actor/article-scoped cache, strict permission-checked projection and full saved-body/
  metadata fingerprint before writing. No-change/invalid/stale edits stop before PATCH;
  matching ACK plus checked readback before success. No optimistic update or raw errors.
- Busy guard; ambiguous transport/408/5xx/malformed ACK/readback pauses saves. Read-only
  checks stage saved text without overwriting the draft. Failed checks stay locked;
  explicit keep-draft rebase or separately confirmed local replacement resumes editing.
  Earlier-request warnings persist; no atomic conditional-write/idempotency guarantee.
- Server route/plain keyed ID client leaf, classic editor retained except export/ID
  boundary, same-page GUI return and no learner-location writes. Own-list Edit labels
  now open the implemented editor; nested routes keep My articles active.
- 438 frontend tests across 17 files (16 new editor cases), standalone typecheck,
  touched lint, theme guard, classic comparison, diff check and final fixture-free
  webpack build pass. Existing test-variable/multi-lockfile warnings remain. Labelled
  resettable local sample checked desktop/375/768/812, light/dark, validation/focus,
  preview/link clearing, save/cancel, retained drafts, saved-version compare/adoption/
  replacement, failed checks/late warnings, admin/orphan notices, long content/modal,
  pending/read-error/loading and menu Escape without page overflow or console errors.
- Screenshot saved; sample/server/tabs removed, viewport restored, port 3211 closed.
  No live API/account/article/provider/progress/billing operation in browser QA. Real
  permissions/persistence/link resolution/handoffs, appearance sync, races/late saves,
  navigation, assistive technology and OS motion remain manual. No backend/schema/
  dependency/migration/Git publishing work; prior local checkpoints preserved. Notes:
  `design-system/source-dev/pages/article-editor.md`. Stop for visual review;
  checkpoint 22 (profile) is unstarted.


## Profile checkpoint — 2026-10-24

- User continued checkpoint 22, `/profile`. Shared scoped orange workspace, original
  finite identity-card vector, responsive profile/security desk and account/sidebar,
  light/dark, reduced motion and 44px native controls. Existing name/timezone/photo/
  read-only email/password capabilities; focused linked validation, local bounded
  256px photo crop, explicit null removal and preserved external provider photos.
- Separate password form only for password-capable accounts, specific visibility
  labels, Keep editing-first native confirmation/Escape/focus and fields cleared
  before submit. Provider-only accounts show actual sign-in method. No connection,
  deletion or new security endpoint. Existing 401 login redirect remains inherited.
- Current-account GET and existing PATCHes only. Account-scoped projected cache,
  timed/abortable reads, original-session checks before actions and across requests,
  fresh account/editable-field fingerprint before one profile PATCH. Matching ACK
  and checked readback before profile success; password success uses exact ACK only.
  Raw errors/credentials never enter query/mutation caches or storage.
- Dirty profile drafts stay in page memory, including ordinary failures/checks.
  Uncertain saves pause writes, failed checks stay locked and checked saved details
  require explicit keep or separately confirmed replacement. Late-request warning
  persists; password ambiguity directs sign-in/recovery without pretending a profile
  read verifies it. No atomic/idempotent/cross-tab or navigation-persistence claim.
- Server route/client leaf; classic original retained except export, same-page GUI
  return, no learner-location writes. Account/session changes hide cached details
  and drafts; busy guard blocks overlapping profile/password/check actions.
- 459 frontend tests in 17 files (21 new), standalone typecheck, touched lint, theme
  guard, exact classic comparison, diff check and fixture-free production webpack
  build pass. Three preserved lint warnings and multi-lockfile build warning remain.
  Labelled resettable sample checked desktop/375/768/812 light/dark, validation/focus,
  save/discard/Escape, empty-password validation, social/admin/long-account, loading/
  error/pending/uncertain/failed-check/review and menu without overflow or console logs.
- Review screenshot saved; sample route/server/tab removed, viewport reset and port
  3211 closed. No real account/photo/password/provider/progress/billing action in QA;
  API behavior is mocked. Live persistence/permissions, photo decoding/upload, password
  success/refusal/recovery, auth redirects, preference sync, navigation, races, screen
  readers and OS motion remain manual. No backend/schema/dependency/migration or Git
  publishing work; prior local checkpoints preserved. Notes:
  `design-system/source-dev/pages/profile.md`. Stop for visual review;
  checkpoint 23 (notifications) is unstarted.


## Notifications checkpoint — 2026-10-24

- User continued checkpoint 23, shared notifications. The redesigned workspace bell
  now opens a scoped orange native inbox dialog. Authenticated count read, lazy history,
  manual refresh and explicit last-checked copy; unknown counts are not zero. No opening
  or link-following marks an item read, and no polling or automatic retry is added.
- All-type/unread filters and six-item paging over the complete checked history;
  reason/reviewer/removal/effective-date/job details, explicit UTC timestamps, checked
  internal targets and honest scheduled-deletion/future-type labels. Raw provider errors,
  arbitrary entities/URLs and foreign-recipient rows are excluded. No deletion action.
- Explicit Mark as read plus Keep unread-first account-wide Mark all confirmation,
  including outside-filter/new-arrival scope. Native Escape/focus return, visible phone
  confirmation focus, 44px controls, responsive long text and reduced-motion empty art.
  Read success never removes history. Current shell chooses the CLI handoff, including
  admins in the developer workspace; admin review destination is explicitly classic.
- Existing account/list/count GETs and one PATCH/POST only. Timed abortable reads,
  account-scoped cache, identity/session/recipient/selected-version checks, matching ACK
  plus fresh readback, safe fixed errors and synchronous busy guards. Already-read is
  a checked no-op; no optimistic badge decrement. Account changes hide cached history.
- Ambiguity pauses writes. Failed checks remain paused, successful read-only checks
  require explicit saved-inbox adoption, and earlier-request warnings persist. New
  unread arrivals prevent false all-read success. No atomic exact-count/set, idempotency,
  cancellation, cross-tab or navigation/remount-persistent pause guarantee is claimed.
- 480 frontend tests in 17 files (21 new), standalone typecheck, touched lint, theme
  guard, backend/terminal unchanged comparison, diff check and final fixture-free webpack
  build pass. Existing test-variable and multi-lockfile warnings remain. Labelled actual-
  view sample checked desktop/375/768/812 light/dark, filter/paging/reset/read/history,
  details/confirm/cancel/Escape/focus, long text, all read/error/pending/empty/unavailable/
  recovery states and admin links without page/dialog overflow or console warnings/errors.
- Screenshot saved; temporary sample/server/tab removed, viewport reset and port 3211
  closed. No live account/notification/content/provider/progress/billing operation;
  APIs are mocked in tests. Live persistence/recipient authorization/emission/counts,
  destinations, cross-tab/concurrency/late requests, preference sync, screen readers
  and OS motion remain manual. No backend/schema/dependency/migration or Git publishing
  work; prior dirty checkpoints preserved. Notes:
  `design-system/source-dev/pages/notifications.md`. Stop for visual review;
  checkpoint 24 (admin dashboard) is unstarted.


## Admin dashboard checkpoint — 2026-10-27

- Implemented `/admin/dashboard` with the shared orange admin workspace, original finite
  vector, real platform totals, creation-ordered review highlight/queue, local filters and
  paging, sortable roadmap analytics, contribution/lesson lists and own notification activity.
  Scope copy follows existing backend metrics; unknown/error values never become zero.
- Existing read-only endpoints only. Fresh matching admin checks before/after resource reads,
  original-session guards, account-scoped cache, safe projections/errors, auth-change hiding
  and synchronous refresh deduplication. Denied access hides the whole private overview.
  Shared inbox cache lets the existing bell update recipient activity; no dashboard writes.
- Explicit admin shell keeps developer navigation unchanged for admins in developer view.
  Unfinished review/users links say Classic; terminal destinations say CLI. Mode handoffs
  preserve learning location. Server wrapper/client leaf; classic source exact except export.
- 499 frontend tests in 17 files (19 new), standalone typecheck, touched lint, theme guard,
  diff/classic/source comparisons and final fixture-free webpack build pass. Existing unused
  test-variable and lockfile warnings remain. Labelled local actual-view sample checked
  desktop/375/768/812, light/dark, filter/paging/sort/refresh/focus, long content and zero/loading/
  partial-error states without page overflow or console warnings/errors. Table focus checked;
  keyboard horizontal scrolling and OS motion remain manual.
- Screenshot saved; sample/server/tab removed, viewport reset, light theme restored, port3211
  closed. No real admin/account/content/provider/progress/billing action. API tests are mocked;
  live permissions/metrics/notification integration, actual destinations, preferences, races
  and assistive technology remain manual. No backend/schema/dependency/migration or Git
  publishing changes; earlier dirty work preserved. Notes:
  `design-system/source-dev/pages/admin-dashboard.md`. Stop for visual review;
  checkpoint 25 (users) is unstarted.


## Users checkpoint — 2026-10-27

- Implemented `/admin/users` in the approved admin workspace: checked account/admin/pending
  totals, local name/email search, role/name/newest filters, eight-item paging and deletion
  request status/history/details. Empty, loading, failed and legitimate zero states differ.
  Admin/current accounts are protected; unmatched requests expose no actions. Native confirmations
  name the account/reason/consequences, default to keeping it, and support Escape/focus return.
- Existing APIs only. Fresh matching admin and full-list preflight, original-session guards,
  selected identity/request fingerprints, one explicit write, matching ACK plus checked readback,
  minimal projections/fixed errors and synchronous deduplication. Deletion checks cascade-aware
  absence; rejection checks saved review while preserving the account. Approval can partially
  write before deletion, so even approval 4xx pauses further actions. Read-only recovery never
  repeats a write; failed checks stay paused, checked-list adoption is explicit and the earlier-
  request warning persists. No atomicity/idempotency/cross-tab/remount-persistent pause promise.
- Server wrapper/client leaf, original users page exact except export in CLI appearance with
  legacy chrome preserved; GUI owns its admin frame. Users navigation/dashboard links now lead
  to the GUI. No role-edit/create endpoint, backend/schema/dependency/migration or Git publishing.
- 522 frontend tests in 17 files (23 new), final focused run, standalone typecheck, touched lint,
  theme guard, diff/classic/source checks and final fixture-free webpack build pass. Four baseline
  lint warnings and the lockfile warning remain. Labelled local actual-view sample checked
  desktop/375/768/812 light/dark, search/filter/sort/paging/history, confirmation/cancel/Escape/focus,
  sample feedback, empty/loading/error/pending/paused/recovery, long data and mobile menu. Fixed
  and rechecked phone select containment; no final overflow or console warnings/errors observed.
- Screenshot saved; sample/server/tab removed, viewport reset, light restored and port3211 closed.
  No real admin/account/content/provider/progress/billing operation. API tests are mocked; live
  authorization/cascades/partial-write outcomes/races/preferences/destinations, screen readers,
  keyboard reason scrolling and OS motion remain manual. Earlier dirty checkpoints preserved.
  Notes: `design-system/source-dev/pages/admin-users.md`. Stop for visual review;
  checkpoint 26 (content review) remains unstarted.


## Content review checkpoint — 2026-10-29

- Implemented the scoped admin GUI with lesson/roadmap/maintenance views, checked totals,
  local search/origin/staged/state filters and six-item paging. Complete saved/staged text
  (including empty drafts), safe explicit Markdown preview and the saved admin answer key;
  no quiz attempts, learner progress or provider calls. Unknown/error/loading remain distinct
  from zero; creation dates are not labelled submission dates.
- Fresh roadmap module review exposes endpoint-aligned publication/takedown/deletion actions.
  No new submission structure gate. Existing date schedules remain after publication, overdue
  deletion and elapsed takedown are distinguished, and cancellation consequences are explicit.
  Maintenance purge is globally scoped, lists reviewed targets and requires acknowledgement;
  it can partially finish and does not promise an exact set/count.
- Native exact-version/consequence confirmations default to keeping content, retain per-item
  reason drafts, validate/focus rejection feedback, guard pending close/actions and focus checked
  result/error feedback. Fresh actor/library/selected source/questions/report preflight, original-
  session guards, account/role cache, minimal projections/fixed errors, one write and matching
  ACK plus saved-state/queue readback. Every sent-write failure pauses decisions. GET-only
  recovery never repeats one, failed checks stay paused, explicit checked-state adoption is
  required and an earlier-request warning persists. No atomicity/idempotency/cross-tab/snapshot/
  cancellation/remount-persistent lock claim. Existing review GET can lazily normalize a date;
  the row is read afterwards. Backend behavior is unchanged.
- Server wrapper/client leaf; classic exact except export and legacy frame retained in CLI
  appearance. Shared sidebar/dashboard/notification destinations now identify GUI review;
  explicit CLI handoffs preserve learning location. No backend/schema/migration/dependency/
  terminal/Git publishing work; prior dirty checkpoints preserved.
- 550 frontend tests in 17 files (28 new; two updated navigation expectations), final focused
  30 checks, standalone typecheck, touched lint/theme/diff/classic/source checks and final
  fixture-free webpack build pass. Four baseline lint warnings and the lockfile warning remain.
  Labelled actual-view sample checked desktop/375/768/812 light/dark, full text/preview/key,
  filters/paging, validation/draft/cancel/Escape/focus, sample decisions, roadmap states,
  global scope, all loading/error/pending/uncertain/recovery states and long data without final
  overflow or console warnings/errors. Screenshots saved; sample/server/tab removed, viewport
  reset, light restored and port3211 closed. No live moderation/API/provider/progress/billing
  operation; contracts mocked. Live permissions/state transitions/emission/cascades/races/clocks/
  preferences/destinations/media, screen readers and OS motion remain manual.
  Notes: `design-system/source-dev/pages/content-review.md`. Stop for visual review;
  checkpoint 27, remaining admin surfaces and API-parity audit, is unstarted.


## Admin jobs and API-parity checkpoint — 2026-10-29

- Audited remaining admin terminal/controller contracts. All four analytics resources already have
  GUI dashboard coverage. Jobs lists remain requester-scoped, admin known-ID lookup may inspect
  other requesters, and unread results are capped at 20. Article moderation, contextual discussion
  parity and evaluation are recorded as separate future checkpoints; no invented global job/run/
  discussion queue or paid/serving changes in this page. Audit: `design-system/source-dev/pages/admin-parity-audit.md`.
- Implemented `/admin/jobs` in the approved orange admin workspace with active/unread views,
  literal local search, six-item paging, progress/summary/failure details, manual refresh and
  known-ID inspection. Shared job cards retain developer behavior; admin hides the generic own-
  content link. Tablet cards use one column, long values wrap, page/result feedback receives focus.
- Fresh matching admin before/after reads, original-session/auth/storage guards, actor/role cache,
  strict existing parsers, fixed errors, honest unavailable/loading/zero states and synchronous
  duplicate blocking. One explicit owned finished result per acknowledgement, exact fresh row
  preflight, strict count/saved-row/feed readback; no empty-ID bulk request. Every sent failure
  pauses acknowledgement. GET-only recovery, explicit checked-state adoption, retained late-request
  warning and local-pause limits. No generation/provider/quota/eval action or content approval.
- Server wrapper/client leaf, GUI sidebar destination, explicit same-route GUI return/admin terminal
  handoff in CLI appearance. Backend/schema/dependencies/terminal registry and Git publishing unchanged.
- 568 full frontend tests in 17 files (18 new), final 31 affected checks, standalone TypeScript,
  touched lint with no introduced diagnostics, diff checks and final fixture-free webpack build pass.
  Four baseline lint warnings and the lockfile warning remain. Removed preview types caused the
  documented stale Next.js cache failure; cleared only generated `.next` and reran successfully.
- Labelled disposable local actual-view/shell QA covered desktop/375/768/812, light/dark, filters,
  paging/focus, details, known-ID lookup, sample acknowledgement/refresh, empty/loading/error/pending,
  pause/check/adopt, long targets and mobile menu/Escape/focus return. No checked horizontal overflow
  or console warnings/errors. Screenshots saved; sample/both owned tabs/server removed, viewport
  reset, light restored and port 3211 closed. Mock contracts/local callbacks are not real API proof;
  live admin permissions, cross-requester records, acknowledgements/banner sync/concurrency/late
  outcomes, destinations/preferences, screen readers and OS motion remain manual.
- Notes: `design-system/source-dev/pages/admin-jobs.md`. Stop for visual review before checkpoint 28.


## Admin article moderation checkpoint — 2026-10-30

- Implemented `/admin/articles` in the approved workspace: checked public count/list, literal local
  search, author filters, newest/title sorting, eight-item paging and explicit full saved-source review.
  Optional existing safe Markdown preview, public-reader link and existing developer editor handoff.
  Confirmed that the editor already handles another author/orphan as admin, publishes immediately and
  preserves authorship; no duplicate editor or changed PATCH behavior.
- Native exact-article/source/consequence confirmation defaults to Keep, validates/focuses a specific
  trimmed reason, retains per-item drafts, restores focus after cancel and blocks pending close/actions.
  Own/orphan/other-author notification copy follows the actual service. Linked curriculum remains.
- Fresh matching admin before/after list/detail reads, session/auth/storage guards, actor/role cache,
  strict minimal projections/fixed errors and synchronous deduplication. Complete target metadata/body
  preflight, one admin DELETE with reason, strict ACK, detail 404 and checked-list absence. Public article
  caches invalidated without auto-refetch. No atomic compare/delete guarantee; existing endpoint unchanged.
- Notification attempt precedes removal and delivery is not checked; every sent-write failure, including
  4xx, pauses deletions. GET-only recovery never repeats DELETE, failed checks stay paused, explicit
  checked-state adoption and persistent late-request warning. Pause is local to this mounted page.
- Server wrapper/client leaf, GUI sidebar destination and explicit admin CLI handoff/same-route GUI
  return. Existing auth guards preserved. No backend/schema/dependency/migration/terminal/Git publishing.
- 590 full frontend tests in 17 files (22 new), final 33 moderation/editor/navigation checks, touched
  lint with no introduced diagnostics, diff checks and final fixture-free webpack build pass. Four
  baseline lint warnings and the lockfile warning remain. Standalone TypeScript passes.
- Labelled local actual-view/shell QA checked desktop/375/768/812 light/dark, filters/sort/paging/focus,
  full source/preview, reason validation/retention, safe confirmation/Keep/Escape, local success/modal
  closure, orphan/own copy, pending guard, uncertainty/check/adopt/earlier warning, read/empty/error and
  mobile menu. Fixed normal cancel focus being stolen by old status feedback. No checked horizontal
  overflow or browser warnings/errors. Images saved; sample/cache/tab/server removed, viewport reset,
  light restored and port 3211 closed. No real API/content/account/deletion/notification/provider/progress/
  billing operation; contracts mocked. Live permissions/public-list scale/races/late outcomes/database/
  delivery/preferences/destinations, assistive tech and OS motion remain manual.
- Notes: `design-system/source-dev/pages/admin-articles.md`. Stop for visual review before checkpoint 29.


## Contextual discussion moderation and navigation checkpoint — 2026-10-30

- Audited current Q&A service/entity/UI contracts. Existing contextual lesson discussion covers admin
  question/answer edits, cascaded deletes and human-answer verification. Whole private Ask AI threads
  remain asker/admin only; concept authors have no bypass, private threads accept no human replies,
  and AI answers cannot be verified. No global queue/by-ID GET exists; no duplicate admin route added.
- Admin answered-question and saved-AI editing notes explain unchanged replies and text-only editing.
  Inline deletion starts on Keep it and returns trigger focus. Content-review placement links explicitly
  open the developer discussion workspace; admin keeps its full developer shell/terminal there.
  Analytics now opens the actual GUI dashboard anchor without a CLI badge.
- Original-session/auth/storage guards, fresh matching account before/after reads, concept/actor/role
  cache and fresh mount validation prevent cross-account/stale private display. Failed first refresh
  hides cached data; later transient failures retain drafts after a verified read and block writing.
- Fresh visible placement/concept/thread preflight, expanded ownership/AI/identity fingerprint, one
  write and matching ACK plus saved readback for all non-ask actions. Void deletes verify absence.
  Existing ask ACK flow retained. Every sent-write failure pauses actions; GET-only checks stage
  read-only rows, explicit adoption keeps/rebases writing, late-request warning persists. No replay,
  atomicity, cancellation, exactly-once/cross-tab/remount-lock promise. Backend direct mutation shared-
  visibility predicate gap is recorded, not claimed solved; no backend/schema/dependency changes.
- 607 frontend tests in 17 files (17 new), final 32 affected checks, standalone TypeScript, touched
  lint/diff checks and fixture-free production webpack build pass. One baseline unused test variable
  warning in this checkpoint touched set and existing multi-lockfile warning remain.
- Labelled local actual-view/shell QA covered desktop/375/768/812 light/dark, admin answered/private-AI
  edits, draft retention/uncertainty/check/adoption, local save, safe delete/Keep focus return, private
  reply/verification limits, pending/empty states, contextual links and mobile navigation. No checked
  horizontal overflow or browser warning/error. Screenshots saved; sample/cache/tab/server removed,
  viewport reset, light restored, port 3211 closed. APIs mocked/local callbacks; real authorization,
  persistence/cascades/races/late outcomes, destinations/preferences, assistive tech and OS motion remain
  manual. No real moderation/account/provider/progress/billing or Git publishing operation.
- Notes: `design-system/source-dev/pages/discussion-moderation.md`. Stop for visual review before
  checkpoint 30 evaluation/prompt release/question quality, which remains unstarted.


## Evaluation inspection checkpoint — 2026-10-30

- Audited evaluation controller/DTO/service/entities, judge, rubric/goldens, question psychometrics and
  prompt registry. No run list or prompt/comparison/release/review GET, and no terminal evaluation commands.
  Defined this audit-dependent checkpoint as read-only inspection; paid execution, expert/replacement
  decisions and serving-release controls remain separate checkpoints 31–33, not claimed implemented.
- `/admin/evaluation` has four reference/inspection views in the approved admin workspace: current rubric,
  full golden inputs/expected/claims/provenance with registry aliases, local search/task filter/six-item
  paging, known saved run and known question-version metrics. Literal evidence never executes HTML or
  loads media. Run completion/checks/golden differences/judge evidence remain separate. Recorded rubric
  mismatch, unknown provenance, null versus zero, sample limits and heuristic flags are explicit.
- Original-session/auth/storage guards, fresh matching admin before/after GETs, actor/role reference cache,
  fresh-mount display gating, independent reference errors and fixed messages. Lookups remain local,
  strict projected/schema/range/identity parsing, complete UUID validation, 12s timed/abortable GETs and
  synchronous duplicate guard. No polling/retry/provider/write. Drafts retained; error/empty/loading/
  pending distinct, input/result/error and paging focus checked, explicit read retry recovers.
- Server wrapper/client leaf, existing admin layout guard and GUI navigation; CLI appearance honestly
  offers GUI return/admin terminal, with no invented evaluation command or learner-location change.
- 627 frontend tests in 17 files (20 new), focused 20, standalone TypeScript, touched lint/theme/diff checks
  and fixture-free webpack build pass. Four existing lint and multi-lockfile warnings remain.
- Labelled local actual-view QA: desktop/375/768/812 light/dark, actual rubric copy, filters/aliases/paging/
  details, validation/drafts, failed lookup/retry/result focus, literal script evidence, limited/full
  metrics, partial/loading/error/recovery/empty/pending/long reference states and mobile menu. No checked
  horizontal overflow or browser warnings/errors. Sample/dev cache/tab/server removed, viewport reset,
  light restored, port3211 closed. APIs mocked/local callbacks; live permissions/data/serving/preferences/
  destinations/concurrency, screen readers and OS motion remain manual. No real provider/evaluation/
  account/moderation/progress/billing or Git publishing action; backend/dependencies/terminal unchanged.
- Notes and full endpoint/write/serving audit: `design-system/source-dev/pages/evaluation.md`.
  Stop for visual review before checkpoint 31.


## Evaluation execution checkpoint — 2026-10-30

- Added explicit Run evaluations view to `/admin/evaluation`: immutable candidate drafts, shadow,
  full regression, version comparison and saved-compilation evaluation (judge false by default).
  Entry/inspection remain GET-only. No expert/replacement/release control; 32–33 remain unstarted.
- Exact frozen payload/case-scope native confirmation, full literal template/changelog, fresh per-action
  consent and honest unknown operator cost/model/call-count copy. Safe Keep/Escape/return; pending blocks
  close/overlap and focuses visible waiting status. Centering and post-native-close result focus fixed.
  Per-action drafts survive view changes and transient reference failure; outcome runs have paging and
  existing explicit evidence inspection. Missing data/failed checks never become successful quality.
- Original-session/account/role/cache guards, fresh admin/reference preflight, exact reviewed references,
  one POST and strict ACK. Candidate/comparison metadata ACK-only; no invented read API/catalog. All
  returned runs GET-checked in bounded batches; semantic fingerprints tolerate JSONB object key order,
  retain array order and detect changed values. Comparison cohorts and all-task regression reports
  checked; unknown historical/omitted nullable judge seed remains unknown. No fake release eligibility.
- Every sent failure pauses writes; GET-only recovery checks known IDs/references, cannot discover unknown
  partial writes/charges, keeps failed checks paused and requires explicit acknowledgement/adoption.
  Earlier-request warning persists/focuses after resume. No retry/cancellation/exactly-once/atomicity/
  cross-tab/remount lock promise. Paid POST timeout 300s may precede server completion; no provider calls
  or real writes during verification. Unjudged compilation is still a persisted evaluation.
- 651 full frontend tests in 17 files (24 new), focused 44, standalone TypeScript, touched lint/theme/diff
  and fixture-free webpack build pass. One baseline unused test variable in touched set and existing
  multi-lockfile warning remain. Backend/dependencies/terminal unchanged; prior dirty work preserved.
- Labelled local browser QA: 1280/375/768/812 light/dark, validation/exact source/inert script, drafts,
  all confirmation types/case counts/consent, Keep/Escape/focus, local outcomes and partial/read failure/
  check/adopt/earlier warning, pending Escape/disable/focus and short-landscape controls. No checked
  horizontal overflow or browser warning/error. APIs mocked/local callbacks; live permissions/operator
  config/paid costs/persistence/latency/partial/concurrent outcomes/content/preferences/navigation,
  assistive tech and OS motion remain manual. Images saved; sample/dev cache/tab/server removed,
  viewport reset, light restored and port3211 closed. No real account/evaluation/provider/progress/
  billing/content/release or Git publishing operation.
- Notes: `design-system/source-dev/pages/evaluation-execution.md`. Stop for visual review before 32.


## Expert review and question replacement checkpoint — 2026-10-30

- Added **Expert decisions** within `/admin/evaluation`, using existing admin-only GUI guards and
  server-wrapper/client-leaf boundary. No new backend endpoint, schema, dependency, terminal command
  or release control. Graphify-first audit followed expert-review/quiz/psychometrics DTOs/services/entities.
- Expert review checks a known run and matching current rubric, renders complete original evidence,
  requires four explicit anchored integer scores, decision/reason/codes and proposed text for edits.
  One POST, strict matching actor/run/rubric/payload ACK; no independent expert-review GET exists.
  Proposed text is recorded only, with no content edit or prompt-release approval.
- Replacement checks an explicit concept/current-question pair, original text/key/options, version,
  predecessor, shared placements and full descriptive metrics. The list omits original Bloom/difficulty/
  correct rationale; the UI labels fresh optional metadata and clears stale lint/verifier expectations.
  Complete replacement with 2–12 options, exactly one key, optional distractor explanations and reason.
- Frozen exact-payload native confirmation includes original/successor versions, all-placement pending
  review/access consequence and original answer key. Fresh consent, Keep/Escape/trigger focus, pending
  Escape/close/overlap lock and waiting-status focus. Independent drafts survive view/reference failure.
  Browser-discovered retained modal scroll fixed for both decision and execution confirmations.
- Original-session/fresh matching admin checks, full evidence/rubric/metrics/concept fingerprint preflight,
  one POST and strict ACK. Replacement successor text/options/version/predecessor read back, original
  absent from current list and shared concept pending checked separately. No concurrency isolation claim.
- One synchronous lock and shared uncertain-write pause across execution and decisions. Every sent
  failure, including 4xx/ACK/readback, pauses writes; GET-only recovery checks known state without replay.
  Unknown review/unknown-successor outcomes remain unknown, failed checks stay paused, explicit consent
  and reference adoption resume writing, earlier-request warning persists. Mount-only lock, no automatic
  retries/polling/provider call, exactly-once/cancellation/atomicity promise or real content operation.
- 674 full frontend tests across 17 files pass with clean exit (23 new), including terminal regressions.
  Standalone TypeScript, touched ESLint, GUI token/diff checks and fixture-free production webpack build
  pass. One existing unused test variable and existing multi-lockfile build warnings remain.
- Labelled local actual-view/shell QA checked 1280/375/768/812 light/dark, validation, full anchors,
  original/key/version/placements, exact confirmation/consent, draft retention, local success/read failure/
  drift/timeout/failed recovery/check/adoption, pending disable/Escape/focus and short-landscape controls.
  No checked horizontal overflow or browser warnings/errors. Screenshots saved; sample/dev cache/tab/
  server removed, viewport reset, light restored and port3211 closed. Mock/local proof only; live access,
  persistence/concurrency/visibility/scale/preferences/navigation, screen readers and OS motion remain
  manual. No real account/content/review/provider/evaluation/progress/billing/release or Git publication.
- Verification details and screenshots: `design-system/source-dev/pages/evaluation-decisions.md`.
  Stop for visual review before checkpoint 33, prompt release approval and rollback.


## Prompt release approval and rollback checkpoint — 2026-11-02

- Added **Prompt releases** to `/admin/evaluation`, retaining guarded admin route, server/client boundary,
  GUI tokens and CLI/developer/learner scope. Graphify-first current service/controller/entity/registry/gate
  audit; no backend/schema/dependency/terminal changes and no live release/provider operation.
- Approval uses the latest checked comparison response retained from Run evaluations in this mounted
  workspace. It never starts or repeats a paid comparison. No comparison/release/serving GET exists;
  arbitrary historical IDs cannot be safely previewed here. That limitation is explicit in the empty state.
- Explicit GET check revalidates current rubric/goldens and every saved cohort run, in batches of four,
  with original-session/matching fresh admin guards. Retained comparison metadata stays ACK evidence.
  Recomputes observed cohort/condition/rate/check/dimension non-regression and requires exact agreement
  with the retained summary; full run evidence/fingerprints and baseline/candidate/delta table available.
  Non-regression can retain equal failures; it is never labelled absolute quality or final eligibility.
- Exact frozen native confirmation reviews comparison/task/version scope or complete task-wide rollback,
  fresh consent, safe Keep/Escape/trigger focus, pending disable/close/Escape/waiting focus. Reopening
  starts at the full heading; selected rollback task remains across views/reference failures.
- Approval replaces prior task approvals; serving additionally needs operator opt-in/per-task selection
  and matching baseline/candidate/corpus hashes. Rollback revokes all currently approved task releases,
  preserves baseline/configuration and does not cancel in-flight generation. No affected count or live
  serving selector is invented. One empty-body POST, strict scoped ACK, fresh matching account afterward;
  both feedback paths remain response-only evidence, not an independent active-prompt readback.
- Shared synchronous lock/pause now covers execution, expert decisions, replacement and releases. Every
  sent failure including conflict/timeout/ACK/post-write account error pauses writes. GET-only recovery
  checks refs/known runs without replay or release-state inference. Failed checks stay paused; separate
  uncertainty consent/reference adoption required, checked approval invalidated, earlier warning retained.
  Pause is mount-local; no automatic retry/poll/cancellation/isolation/exactly-once guarantee.
- 694 full frontend tests in 17 files pass with clean exit (20 new), including terminal regressions.
  Standalone TypeScript, touched ESLint, token/diff checks and fixture-free webpack build pass. Existing
  unused test variable and multiple-lockfile warnings remain; no introduced diagnostics.
- Labelled local actual-view/shell QA checked 1280/375/768/812 light/dark, no-source and blocked-gate
  states, full metrics/fingerprints/run source, task validation, scope/consent/Keep/Escape/focus, retained
  task across views/reference failure, local success/read failure/drift/timeout/failed recovery/check/
  adoption, earlier warning and pending disable/Escape/waiting focus. No checked horizontal overflow or
  browser warning/error. Screenshots saved; sample/dev cache/owned preview tab/server removed, viewport
  reset, light restored, port3211 closed. API contracts mocked/local callbacks; live authorization,
  serving/config/DB transactions/concurrency/late outcomes/scale/preferences/navigation and assistive
  technology remain manual. No real account/provider/content/progress/billing/release or Git publication.
- Verification details and local sample screenshots: `design-system/source-dev/pages/evaluation-releases.md`.
  Checkpoints 1–33 now have implementation entries. Stop for visual review; live acceptance remains.
