/* ==========================================================================
   source:dev — theme registry
   --------------------------------------------------------------------------
   The presentation half of the shell. Everything a theme decides lives here
   or below: the palette, the glyphs, the ASCII mark, the spacing idiom.

   The contract with the command layer is deliberately narrow. Commands emit
   semantic lines — `ok`, `err`, `dim`, `head`, `rule`, `banner` — and know
   nothing about how any of them look. A theme is therefore a value in this
   registry, not a branch inside a command: adding one means writing a new
   entry against the same `LineKind` and `ThemeGlyphs` vocabulary, and
   touching no command logic at all.

   Note the direction of the imports below: this file depends on the command
   layer's contract, and nothing in the command layer depends on this file.
   `scripts/check-theme-separation.mjs` enforces the other half of that — it
   fails the build if a colour, a box-drawing glyph or a font ever appears
   under `lib/terminal/`.
   ========================================================================== */

import {
  installGlyphs,
  type ThemeGlyphs,
} from "@/lib/terminal/theme-contract";
import { DARK, LIGHT } from "./palette";

// Re-exported so the dashboards and account controls that use the palette
// have one import site for the theme, rather than reaching past the registry
// into the file underneath it.
export { DARK, LIGHT } from "./palette";
export type { ThemeGlyphs } from "@/lib/terminal/theme-contract";

export interface ThemeDefinition {
  id: string;
  /** Shown in the navbar's theme control. */
  label: string;
  /** One line describing the look, for the theme picker when it ships. */
  description: string;
  /** Palettes, one per colour scheme. A theme that has only one look may
   *  point both at the same object. */
  palette: { dark: typeof DARK; light: typeof LIGHT };
  glyphs: ThemeGlyphs;
  /** The mark printed at boot. Owned by the theme because it is pure
   *  presentation — and because it has to fit a 360px viewport, which is a
   *  rendering constraint, not something a command should be reasoning about. */
  banner: string;
}

/** The product mark at a width that survives a narrow phone. Ten characters
 *  across, so a 360px viewport at the console's type size still shows it
 *  without wrapping — the previous six-line slant logo did not, and a banner
 *  that breaks apart mid-letter reads as corruption rather than as a logo. */
const BANNER = `┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐ ┌┬┐┌─┐┬  ┬
└─┐│ ││ │├┬┘│  ├┤   ││├┤ └┐┌┘
└─┘└─┘└─┘┴└─└─┘└─┘ ─┴┘└─┘ └┘`;

/** Twenty cells, so the bar still fits beside a label at 360px. */
const METER_CELLS = 20;

const TERMINAL: ThemeDefinition = {
  id: "terminal",
  label: "TERMINAL",
  description: "Monospace console, box-drawn panels, ASCII meters.",
  palette: { dark: DARK, light: LIGHT },
  glyphs: {
    prompt: "$",
    caret: "█",
    rule: "─",
    done: "[x]",
    active: "[~]",
    todo: "[ ]",
    tokenOpen: "[",
    tokenClose: "]",
    /** `less`'s status line. It carries the keys as well as the position,
     *  because the pager is the one place in this shell where the keyboard
     *  does something the prompt has not taught you — and the affordance is
     *  printed, since nothing inside the terminal window is clickable. */
    more: (percent) =>
      `--More--(${percent}%)  space: next page · enter: next line · G: end · q: quit`,
    banner: BANNER,
    meter: (percent) => {
      const filled = Math.max(
        0,
        Math.min(METER_CELLS, Math.round((percent / 100) * METER_CELLS)),
      );
      return `[${"█".repeat(filled)}${"░".repeat(
        METER_CELLS - filled,
      )}] ${String(Math.round(percent)).padStart(3)}%`;
    },
  },
  banner: BANNER,
};

/** Every theme the build ships. One today — the registry exists so the second
 *  is an entry here rather than a refactor. */
export const THEMES: ThemeDefinition[] = [TERMINAL];

export const DEFAULT_THEME_ID = TERMINAL.id;

export function getTheme(id?: string): ThemeDefinition {
  return THEMES.find((theme) => theme.id === id) ?? TERMINAL;
}

/** Whether a theme picker would have anything to offer. The navbar's control
 *  reads this rather than hardcoding `disabled`, so the day a second theme is
 *  registered the button becomes live without anyone remembering to go and
 *  enable it. */
export function hasThemeChoice(): boolean {
  return THEMES.length > 1;
}

/** Install the default on import.
 *
 *  `activeGlyphs()` throws when nothing is installed — that is what stops a
 *  default glyph set from being smuggled into the command layer — so the
 *  registry satisfies it here. Any renderer able to draw the console has
 *  imported this module, and `setTheme` can call `installGlyphs` again later
 *  without this line becoming a special case. */
installGlyphs(TERMINAL.glyphs);
