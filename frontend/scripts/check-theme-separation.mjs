#!/usr/bin/env node
/* ==========================================================================
   Theme separation guard
   --------------------------------------------------------------------------
   The architecture promises that command logic is theme-agnostic: the parser,
   the interpreter and the state machine emit semantic lines, and every
   decision about how those lines *look* lives in the rendering layer.

   A promise like that decays the first time someone reaches for a hex value
   inside a command because it was quicker. This script is the assertion that
   it has not: it fails if anything under `lib/terminal/` contains a colour, a
   box-drawing glyph, a font or a pixel measurement.

   Run: node scripts/check-theme-separation.mjs
   ========================================================================== */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GUARDED = path.join(ROOT, "lib", "terminal");

/** What must never appear in the command layer, and what to say when it does.
 *  Each `test` runs against one line. */
const RULES = [
  {
    name: "hex colour",
    // #fff / #ffffff / #ffffffff, not preceded by a word character so an id
    // fragment or a comment's `#1` does not trip it.
    test: (line) => /(^|[^\w&])#[0-9a-fA-F]{3,8}\b/.test(line),
    why: "colour belongs to the theme — emit a LineKind and let the renderer choose",
  },
  {
    name: "box-drawing or block glyph",
    // U+2500–U+257F box drawing, U+2580–U+259F blocks, U+25A0–U+25FF shapes.
    test: (line) => /[─-╿▀-▟■-◿]/.test(line),
    why: "furniture glyphs belong to the theme's glyph set in components/terminal/themes",
  },
  {
    name: "css colour function",
    test: (line) => /\b(rgba?|hsla?)\s*\(/.test(line),
    why: "colour belongs to the theme",
  },
  {
    name: "font declaration",
    test: (line) => /\bfont-(family|size|weight)\b|fontFamily|fontSize/.test(line),
    why: "typography belongs to the renderer",
  },
  {
    name: "pixel measurement",
    test: (line) => /\b\d+(\.\d+)?px\b/.test(line),
    why: "spacing belongs to the renderer",
  },
  {
    name: "tailwind class attribute",
    test: (line) => /className\s*[=:]/.test(line),
    why: "command logic must not render markup",
  },
];

/** Lines that are allowed to look like a violation, because they are talking
 *  *about* the rule rather than breaking it. Kept explicit and small — an
 *  exception list that grows is the same decay this script exists to catch. */
function isExempt(line) {
  const trimmed = line.trim();
  // A comment may name a colour or a glyph when explaining why it is not here.
  return (
    trimmed.startsWith("*") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*")
  );
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
      continue;
    }
    // Test files may assert on rendered output, so they are not the contract.
    if (/\.test\.(mjs|ts)$/.test(entry.name)) continue;
    if (/\.(ts|tsx|mjs|js)$/.test(entry.name)) yield full;
  }
}

const violations = [];

if (!fs.existsSync(GUARDED)) {
  console.error(`check-theme-separation: ${GUARDED} does not exist`);
  process.exit(2);
}

for (const file of walk(GUARDED)) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (isExempt(line)) return;
    for (const rule of RULES) {
      if (rule.test(line)) {
        violations.push({
          file: path.relative(ROOT, file),
          line: index + 1,
          rule: rule.name,
          why: rule.why,
          text: line.trim().slice(0, 100),
        });
      }
    }
  });
}

if (violations.length === 0) {
  console.log(
    "check-theme-separation: OK — command layer contains no theme-specific rendering",
  );
  process.exit(0);
}

console.error(
  `check-theme-separation: ${violations.length} violation(s) — theme details have leaked into the command layer\n`,
);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.rule}]`);
  console.error(`    ${v.text}`);
  console.error(`    → ${v.why}\n`);
}
process.exit(1);
