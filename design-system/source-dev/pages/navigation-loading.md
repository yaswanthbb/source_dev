# Navigation loading

The orange master tokens and recall-knot identity apply to GUI route loading as well as page content.
This is shared feedback, not a new page or a fabricated terminal boot sequence.

- A centered, compact source:dev card announces “Opening your page” with a plain description.
  Protected workspace gates use access-check copy. No fake percentages, progress or logs.
- `ModeAwareLoader` waits for the existing preference provider rather than guessing an appearance.
  GUI finishes when the actual async guard completes; CLI keeps its existing minimum boot timing.
- A 150ms CSS entrance delay suppresses very short flashes without postponing route completion.
  Three orange opacity dots communicate activity; reduced motion disables all animations.
- The status is politely announced once through `role="status"`; decorative branding and dots
  are hidden from assistive technology. No focus trapping or focus movement on transient loading.
- Reuse scoped GUI light/dark tokens, full-width responsive sizing and a 380px maximum card.
  The UI styling and UI/UX guidance influenced the announcement, anti-flicker and motion behavior.
- Terminal overlay clones may survive CLI navigation only. A GUI switch immediately hides them,
  removes them on the next bridge frame and stops the animation.

Verification: typecheck, new-code lint, fifteen Node test files, theme guard and build passed.
Homepage/login round trip, CLI-to-GUI and a genuinely pending GUI route were browser-checked.
Additional dark/mobile capture was inconclusive due to preview automation failures; signed-in
protected gates and OS-level reduced-motion smoke remain manual. Legacy lint baselines unchanged.
