# Quiz / answer feedback — checkpoint 9

Uses source-dev MASTER orange tokens, existing Inter/Lucide and scoped CSS modules. UI styling/UX
skills informed native single-choice controls, readable hierarchy, persistent feedback, focus and
responsive flow; generated marketing palettes/patterns did not replace the established application.

## Composition

Nested lesson `/quiz` route with awaited plain server params under existing auth. Reader links say
Start knowledge check or Review knowledge check from actual status. Breadcrumb to reader/module,
one question card, saved-attempt hint, native radio fieldset, explicit Check answer, previous/skip and
question index. Side summary shows resolved versus correct counts; small screens stack it after the
question. Choice and question controls lock during submission; leaving still permits navigation.
Finite 350ms entrance, no endless decorative animation, reduced-motion final state; orange light/dark
and visible keyboard focus. Native radio arrow keys work; next question focuses its heading. Errors
and saved responses focus a persistent feedback region rather than disappearing as a toast.

## Contracts / truthful feedback

Existing GET lesson, questions, quiz-status and roadmap/progress, POST question attempt. Three attempts
per question. No attempt on mount, selection, skip, refresh or navigation. No client grading from option
metadata: project only student-facing text/IDs/order, even for authors/admins; strip unrevealed keys.
Validate complete matching question/status snapshots, counts and server acknowledgements. Never
interpret network failure as zero questions. Reveal status-authorized answer only after correct or
exhausted resolution. API has no learner explanation field; encourage revisiting actual lesson content.
Resolved by exhaustion is not correct/mastered. No invented XP. Backend resolves/auto-completes globally
by concept; roadmap progress confirms completion separately. No extra completion POST from this page.

Fresh preflight checks current accessible lesson, exact placement, progress/prerequisites, current
question/option and attempt history before one POST. Reject changed history or edited question instead
of spending another attempt against a stale selection. Never auto-retry an attempt; uncertain/invalid
ack locks further answering until an explicit successful status refresh. Counts are last-confirmed
when an answer is uncertain. Post-success invalidation updates real quiz/progress/reward/review data.

Existing backend quiz endpoints do not enforce the shared visibility predicate themselves; GUI reads
the guarded lesson first, but that is not backend authorization or a transactional cross-tab limit.
Backend security/concurrency hardening requires separate scope. This checkpoint has no backend,
migration, provider, generation or dependency changes.

## CLI / verification

Quiz handoffs preserve canonical concept path plus ID and `view=quiz`; terminal entry uses only literal
quiz and its validated reference. Existing CLI commands/registries remain unchanged. Appearance mode
keeps concept location; returning from CLI opens reader, not an unsaved GUI question step.

Frontend typecheck, touched lint, theme guard and 238 tests across 17 files (52 roadmap/reader/quiz).
Turbopack production route build passed before temporary preview; later CSS worker port binding was
environment-blocked even after escalation. Supported webpack verifies production preview and final
fixture-free delivery build; no bundler configuration changes. Existing lockfile/advisory notes remain.
Actual labelled sample component browser QA: desktop/phone/tablet/landscape, light/dark, keyboard radios,
answer feedback, next-heading focus, menu Escape/focus and empty/pending/resolved/error/stale states;
no horizontal overflow or unexpected console errors. No account/API writes. Live authenticated
permissions/submissions/retry, cross-tab and mode-switch smoke, initial-load retry and OS reduced-motion
remain manual. Sample route/server/tab removed and browser viewport reset before delivery. Screenshot
is illustrative QA, not a saved learner session. Stop for review before FSRS checkpoint 10.
