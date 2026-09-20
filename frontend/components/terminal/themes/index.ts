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
  banner: BannerLine[];
}

export type BannerTone = "dim" | "bright" | "accent";

/** One row of the product mark, and which of the three mark tones it is drawn
 *  in. The tones glow toward the core — dim tips, bright frame, accent heart —
 *  the distro-logo idiom, where the emblem carries hues instead of one flat
 *  colour. */
export interface BannerLine {
  text: string;
  tone: BannerTone;
}

/** The product mark: a diamond core with a `>_` at its heart — the shell at
 *  the centre of the learning — hung with node dots at the four vertices for
 *  the graph around it. Fifteen rows by twenty-five columns, so it stands
 *  beside the facts from 560px up and stacks above them on a phone, with no
 *  sideways scroll either way. Every row but the middle mirrors left-for-right;
 *  the middle carries the asymmetric `>_` and is exempt. */
const BANNER: BannerLine[] = [
  {
    text: "            o            ",
    tone: "dim"
  },
  {
    text: "           / \\           ",
    tone: "dim"
  },
  {
    text: "          /   \\          ",
    tone: "bright"
  },
  {
    text: "         /     \\         ",
    tone: "bright"
  },
  {
    text: "        /   _   \\        ",
    tone: "bright"
  },
  {
    text: "       /   / \\   \\       ",
    tone: "accent"
  },
  {
    text: "      /   /   \\   \\      ",
    tone: "accent"
  },
  {
    text: "     o   <  >_  >   o    ",
    tone: "accent"
  },
  {
    text: "      \\   \\   /   /      ",
    tone: "accent"
  },
  {
    text: "       \\   \\ /   /       ",
    tone: "accent"
  },
  {
    text: "        \\   V   /        ",
    tone: "bright"
  },
  {
    text: "         \\     /         ",
    tone: "bright"
  },
  {
    text: "          \\   /          ",
    tone: "bright"
  },
  {
    text: "           \\ /           ",
    tone: "dim"
  },
  {
    text: "            o            ",
    tone: "dim"
  }
];

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
    banner: BANNER.map((line) => line.text).join("\n"),
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
