/* ==========================================================================
   source:dev — terminal palette
   --------------------------------------------------------------------------
   Shared dashboard palette. Keep the console and account controls in sync.

   This lives in the rendering layer, not in `lib/terminal/`, because that is
   what it is: colour. It used to sit beside the command code, which meant the
   theme-separation guard failed on it — a palette one import away from the
   parser is how a `if (isDark)` eventually ends up inside a command.
   ========================================================================== */

export const DARK = {
  base: "#0a0c0e",
  panel: "#111417",
  head: "#171a1d",
  hover: "#202327",
  ink: "#ffffff",
  text: "#e2e4e8",
  dim: "#949aa2",
  faint: "#656a73",
  line: "#34383f",
  primary: "#38ef7d",
  alert: "#f59e0b",
  // Reviews-due card, applied only while the queue is non-empty so the card
  // reads as the action card exactly when there is an action. Mirrors the light
  // export's amber wash, swapped to the dark accent.
  dueWash: "#0d1f16",
  dueChipBg: "#123524",
  dueChipInk: "#38ef7d",
  dueChipLine: "#1f7a4d",
  dueSub: "#7ad9a3",
  dueRule: "#1f7a4d",
  shadow: "#000000",
  shadowStrong: "#000000",
};

export const LIGHT = {
  base: "#faf9f4",
  panel: "#ffffff",
  head: "#f5f4ef",
  hover: "#e9e8e3",
  ink: "#1b1c19",
  text: "#1b1c19",
  dim: "#45474a",
  faint: "#75777b",
  line: "#c5c6cb",
  primary: "#b45309",
  // `alert` is the second accent, not an error colour: badge stars, the [BADGE]
  // and [CLI] tags, and the sync state. Dark splits these off from `primary`
  // and light has to do the same, or [BADGE] and [CONCEPT] collapse into one
  // colour on this side only.
  //
  // Login's light palette carries no second hue to borrow, and every other
  // light value here is amber-family, so this is the one deliberate addition:
  // deep teal, 5.2:1 on the panel. Amber/cyan is the terminal pairing, and a
  // cool hue is what keeps it legible beside `primary` — a green would read as
  // "ok" and invert dark's meaning, where [SYS: SYNC] is the amber one and
  // [SYS: OK] the accent. Red stays reserved for real errors, as in login.
  alert: "#0f766e",
  // Reviews-due card, applied only while the queue is non-empty so the card
  // reads as the action card exactly when there is an action. Values are the
  // export's amber wash verbatim.
  dueWash: "#fffbeb",
  dueChipBg: "#fef3c7",
  dueChipInk: "#92400e",
  dueChipLine: "#f59e0b",
  dueSub: "#92400e",
  dueRule: "#fde68a",
  // Every panel casts the same soft shadow, mission_control included.
  // `shadowStrong` is only for the inverted resume/start buttons, which sit on
  // a filled accent and need the harder edge. In dark both are black.
  shadow: "#c5c6cb",
  shadowStrong: "#1b1c19",
};
