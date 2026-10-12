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
| 16 | AI generation/jobs `/developer/generate` (existing APIs; explicit paid actions only) | Implemented; ready for visual review |
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
