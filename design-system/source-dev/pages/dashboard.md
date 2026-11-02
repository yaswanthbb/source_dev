# Developer dashboard

The approved orange master remains authoritative. Generic generated design-system results were
off-topic marketing/AI recommendations, so their palette and hero pattern were not adopted.
The UI skills inform semantic controls, focus handling, responsive hierarchy and motion safeguards.

## Composition

- A quiet 232px sidebar establishes a reusable workspace frame, opt-in per page. Mobile uses a
  disclosure below the brand bar; Escape closes it and returns focus. The auth layout stays a guard.
- Continue-learning and review cards lead. The warm peach concept card includes an original
  decorative recall-knot path; the review card uses a simple actual count, not a fake progress ring.
- Four small statistics support the main actions. Activity is a year of real backend civil-day XP,
  with horizontal overflow confined to the graph and exact values available through a native table.
- Four roadmap cards, milestones and recent timestamped events complete the overview. Data is
  retrieved from current APIs, not the fixture used for visual QA. No invented courses or achievements
  are bundled into the application. Historic event XP is not guessed from current difficulty.

## Behavior and scope

- Every query region distinguishes pending, successful empty, initial error and failed refresh.
  Cached content survives refresh errors with an explicit stale notice and retry action.
- Roadmap cards reuse the existing individual progress hook/cache; only displayed cards request
  progress. Failed progress is unavailable, never represented as zero percent.
- Review total includes all due histories; session count reflects availability. Held-back and
  inaccessible items are explained separately, and no session CTA appears for zero available items.
- Learning, roadmap, review and notification routes remain the existing CLI until their checkpoints.
  Handoffs are marked CLI and change preference without the provider's default navigation race.
- The workspace switch targets the developer shell even for admins. Profile and admin access remain.
- Native logout dialog uses named title/description, Cancel-first focus, Escape and focus restoration.
  Confirm clears auth, query cache and terminal sessions and returns to Login. No new auth contract.
- Tokens, 180–200ms control transitions and finite entrances are scoped. Reduced motion disables
  entrances/pulses/transitions. No persistent decorative animation, new package or bitmap asset.

## Verification

Typecheck, new-code lint, sixteen Node test files, theme guard and build passed. Thirteen dashboard
checks cover civil dates/XP thresholds, historical awards, recent focus/events, legacy progress and
FSRS shapes, initial/stale errors, empty/pending views, CLI handoff, shell navigation and actual
menu/dialog/logout handlers with focus cleanup. Existing build lockfile warning remains.

Browser layout QA: actual rendered components and bundled fonts in a labelled offline sample-data
fixture, desktop/375px/768px/812px landscape, light/dark and data states, no viewport overflow.
It does not bypass app auth or claim live account/API/navigation verification. Signed-in smoke and
OS reduced-motion remain manual. No account creation/password/provider action was performed.
