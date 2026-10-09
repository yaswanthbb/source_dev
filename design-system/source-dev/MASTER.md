# source:dev GUI design system

Reference: GitBook public homepage, inspected 2026-10-08. Inspiration is composition, quiet hierarchy,
rounded controls and warm/coral accents; no GitBook copy, illustrations, logos or customer claims reused.
The UI/UX skill's minimal/Swiss guidance informs spacing and hierarchy; the user's reference takes
precedence over generated palette/font suggestions. Existing Inter and Lucide are reused, no new packages.

## Tokens and scope

`frontend/components/gui/gui-theme.module.css` is the reusable opt-in GUI theme class. It owns
semantic `--gui-*` colors, radius, easing and typography in light/dark variants. It must only be attached
to redesigned GUI surfaces, never globally to the terminal or untouched pages.

User-approved accent direction (2026-10-08): **orange consistently**, not mixed forest-green/citron
and orange. Light: warm off-white background, white surfaces, near-black ink, readable warm-gray
secondary text, fine warm-gray borders, burnt-orange primary buttons and peach highlights.
Dark: warm charcoal surfaces, light ink and bright peach-orange buttons with dark text. The logo,
focus rings, demo indicators and illustrative terminal accents use the same orange family.
Text pairs must meet 4.5:1 contrast. Keep Inter body typography; the homepage uses Space Grotesk
headings. Reserve monospace for code and short technical labels. These tokens remain opt-in:
untouched legacy and actual CLI pages are not recolored by the homepage update.

Layout: 1140px maximum marketing content width, 24px mobile gutters (20px on small phones), 4/8px
spacing rhythm, text measure ≤65 characters, responsive section spacing and sensible heading wrapping.
Cards: restrained 16–24px rounding. Buttons: pill shape, 44px minimum hit area, visible keyboard outline.

## Motion

- Hero entrance 500–650ms once; short stagger, no letter-by-letter screen-reader fragmentation.
- Section reveal 600ms once on entry, with content visible if JS/IntersectionObserver is unavailable.
- Card/button hover 180–240ms; layout does not move surrounding content.
- Demo changes fade/translate slightly; illustration draw is finite, not an endless loop.
- `prefers-reduced-motion: reduce`: final visible states, no motion or animated scrolling.
- Don't put animation, marketing styles or colors into terminal command logic.

## Interaction / content

Use links for navigation, buttons for actions, fieldsets/radios for single-answer questions, native details
for FAQs, named landmarks and a skip link. Preview examples are explicitly labelled and never write
progress, consume quota or trigger model calls. No fake social proof. Mobile menu is a disclosure, not
a dialog; Escape closes it and returns focus. Homepage style establishes direction, not feature completion
for the rest of the site. Rollout is tracked in `GUI_IMPLEMENTATION_PLAN.md`.

Homepage copy leads with real capabilities: structured roadmaps/modules/concepts, AI-assisted
course generation, quizzes and scheduled reviews, shared discussion versus private Ask AI,
developer authoring and reviewed publication. No fabricated catalog, usage metrics or guarantees.
