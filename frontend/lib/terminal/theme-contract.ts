/* ==========================================================================
   source:dev — the theme contract
   --------------------------------------------------------------------------
   The only piece of theming the command layer is allowed to know about: the
   *shape* of a glyph set, and a slot to read the active one out of. There are
   no values in this file, deliberately. It declares that a theme supplies a
   prompt mark, a rule character and a way to draw a meter; it never says what
   any of those are.

   That keeps the dependency arrow pointing the right way. Rendering imports
   this contract and supplies concrete glyphs; commands read them back through
   `activeGlyphs()`. A second theme is therefore a new value under
   `components/terminal/themes` and no command change at all, which is the
   property `scripts/check-theme-separation.mjs` exists to keep honest.
   ========================================================================== */

/** The furniture a theme draws the shell with. Every member is presentation:
 *  the moment a command wants to branch on one of these, the branch belongs
 *  in the renderer instead. */
export interface ThemeGlyphs {
  /** Drawn at the left of a prompt line. */
  prompt: string;
  /** The block that marks the caret. */
  caret: string;
  /** One cell of a horizontal rule, repeated to the console's width. */
  rule: string;
  /** Status markers for a listing: complete, in progress, not started. These
   *  are what `ls` prints in its first column, and what the dashboard tree
   *  uses, so the two never disagree. */
  done: string;
  active: string;
  todo: string;
  /** Wraps a runnable word printed inline in a sentence. */
  tokenOpen: string;
  tokenClose: string;
  /** The pager's status line, as `less` draws it. */
  more: (percent: number) => string;
  /** The product mark the shell opens with. It lives here because the boot
   *  script is command logic — it decides *that* a mark is printed and when —
   *  while the art itself is entirely presentation, and sized to a viewport
   *  the command layer knows nothing about. Also read off `ThemeDefinition`
   *  by the renderer; both point at one constant, so they cannot disagree. */
  banner: string;
  /** A percentage rendered as a bar. The theme owns the entire string — cell
   *  count, fill characters, and how the number is formatted — because all of
   *  it is presentation, and the width in particular is a layout decision
   *  about the narrowest supported viewport rather than anything a command
   *  should be reasoning about. A plainer theme may return the bare number. */
  meter: (percent: number) => string;
}

let installed: ThemeGlyphs | null = null;

/** Called by the rendering layer when a theme becomes active. Kept separate
 *  from the registry's own import so that switching themes later is the same
 *  operation as setting the first one, not a special case. */
export function installGlyphs(glyphs: ThemeGlyphs): void {
  installed = glyphs;
}

/** The active glyph set.
 *
 *  This throws rather than falling back to a built-in default, and the reason
 *  is the whole point of the file: a default would mean glyph literals living
 *  here, in the command layer, which is exactly the leak this arrangement
 *  prevents. Importing the theme registry installs one, so any renderer that
 *  can draw the console has already satisfied it. */
export function activeGlyphs(): ThemeGlyphs {
  if (!installed) {
    throw new Error(
      "No theme glyphs installed — import components/terminal/themes before running a command",
    );
  }
  return installed;
}
