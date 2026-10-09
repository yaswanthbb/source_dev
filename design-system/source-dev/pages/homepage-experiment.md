# Homepage experiment — The Connection Workshop

User requested a bolder, project-specific variation after staging the approved first draft.
The layout and recall-knot identity were approved. The follow-up request replaces mixed green/orange
with a consistent orange brand and replaces abstract slogans with actual product capabilities.
It is not a global reskin of the CLI or unfinished legacy pages.

## Philosophy

Knowledge is not a stack of isolated pages. It becomes useful when ideas find one another.
The homepage therefore opens with a connection map, not a generic product screenshot. A quiet
editorial headline and an off-axis working surface make it feel like a developer's thinking space.

Warm paper, near-black ink and orange form the material language. Burnt-orange controls have
white text in light mode; dark mode uses peach-orange controls with dark text. Peach highlights
and orange connection cues carry the identity through the logo, map, recipe, preview and CTA.
The dotted page suggests a workshop without inventing account statistics or customer claims.

The custom recall knot is an S-shaped route between two square terminals. It links the name
source:dev to the product's cycle of learning and returning. It is drawn in SVG, recognizable at
small sizes, and repeated in the navigation, idea map, interface card, closing illustration and footer.
It is not an off-the-shelf book, stacked-layers icon or generated bitmap.

The project's own recipe is Learn → Connect → Recall. Native buttons let visitors trace it in
the hero, with both graph nodes and numbered controls updating the same explanation. The same
data drives the recipe cards below. This is honest illustrative interaction: no timer, auto-play,
fake progress, API write, paid generation or account preference change.

Motion explains the connection being selected. Paths draw once, entrances finish, and keyboard
users get the same experience as pointer users. Reduced-motion rules show completed paths and
visible content. On a phone, the editorial column stacks above the map; neither the diagram nor
the content requires dragging, hovering or sideways scrolling.

## Implementation

- Reuse existing Inter, Space Grotesk and Rubik font variables. No new font downloads or packages.
- Shared orange tokens: `gui-theme.module.css`; page-only diagram/highlighter tokens:
  `homepage-experiment.module.css`. Increased override specificity is preserved for stylesheet-order
  parity. There is no competing page-level brand palette; untouched surfaces keep their colors.
- Mark: `frontend/components/brand/source-mark.tsx`, 32px viewBox, square terminals, fixed aspect ratio.
  SVG is decorative wherever the adjacent brand text or link label already provides its name.
- Interactive map: `connection-lab.tsx`; shared copy: `LEARNING_RECIPE` in `homepage-data.ts`.
- Hero and recipe explain roadmaps, concepts, questions and reviews. `PRODUCT_FEATURES` adds
  AI-assisted courses/BYOK, shared discussion/private Ask AI and developer authoring/reviewed
  publication. Claims follow master-plan Vision, sections 1–5 and 12 and shipped section 8 decisions.
  Git examples remain illustrative, never advertised as real catalog entries.
- Existing auth routes, GUI/CLI appearance behavior, theme provider and sample quiz remain intact.
- New changes stay unstaged so the user's staged first draft remains their comparison baseline.
- Local skill search did not yield an adult-developer palette match (documentation/brutalism and
  children's education/claymorphism results). Those recommendations were not persisted. This
  direction is an explicit product-specific design interpretation, guided by brand/vector and
  semantic-control principles, not a copied generated design system.

## Verification

Record checks and remaining limitations in `GUI_IMPLEMENTATION_PLAN.md` and master-plan §11.
No wider brand rollout or next-page development until this experiment is reviewed.
