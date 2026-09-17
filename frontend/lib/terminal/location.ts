/* ==========================================================================
   source:dev — virtual filesystem location
   --------------------------------------------------------------------------
   Where the user is, as one value both modes agree on.

   The platform is modelled as a filesystem:

       /roadmaps/<roadmap>/<module>/<concept>

   and this module is the only place that knows how to read, write, walk and
   project that path. Nothing here imports React, the router, a palette or a
   component — it is pure data, so the rules below are testable on their own
   and both the CLI interpreter and the GUI read the *same* answers rather
   than each deriving their own.

   The one subtlety worth stating plainly, because it is the whole reason the
   modes cannot drift:

     Location is TOTAL. Every path below is representable and preservable.
     GUI rendering is PARTIAL. Only some locations have a page to render.

   Deep content — roadmap, module, concept — is CLI-only in this build. When
   GUI mode cannot render where the user is, it shows the nearest real page
   instead. That projection is *lossy*, so it must never be written back as
   the user's position: `guiFallback` answers "what do I show", never "where
   are you now". Keeping those two questions apart is what stops a mode
   switch from silently resetting someone to the root.
   ========================================================================== */

/** Where the user is. Four shapes, one per depth, so an impossible location —
 *  a module with no roadmap — cannot be constructed. */
export type Location =
  | { kind: "root" }
  | { kind: "roadmap"; roadmap: string }
  | { kind: "module"; roadmap: string; module: string }
  | { kind: "concept"; roadmap: string; module: string; concept: string };

export const ROOT: Location = { kind: "root" };

/** Depth as a number, so walking up is arithmetic rather than a switch. */
export function depthOf(loc: Location): 0 | 1 | 2 | 3 {
  switch (loc.kind) {
    case "root":
      return 0;
    case "roadmap":
      return 1;
    case "module":
      return 2;
    case "concept":
      return 3;
  }
}

/** The path segments below `/roadmaps`, shallowest first. The inverse of
 *  `fromSegments`, and the representation every other function works in. */
export function segmentsOf(loc: Location): string[] {
  switch (loc.kind) {
    case "root":
      return [];
    case "roadmap":
      return [loc.roadmap];
    case "module":
      return [loc.roadmap, loc.module];
    case "concept":
      return [loc.roadmap, loc.module, loc.concept];
  }
}

/** Build a location from segments below `/roadmaps`. Returns null for more
 *  than three — there is no level under a concept. */
export function fromSegments(segments: string[]): Location | null {
  const [roadmap, module, concept] = segments;
  switch (segments.length) {
    case 0:
      return ROOT;
    case 1:
      return { kind: "roadmap", roadmap };
    case 2:
      return { kind: "module", roadmap, module };
    case 3:
      return { kind: "concept", roadmap, module, concept };
    default:
      return null;
  }
}

/** A slug we are willing to put in a path. Deliberately the same shape as the
 *  allowlist the terminal page already applies to URL-supplied references: no
 *  spaces, no quotes, no dots, nothing the tokeniser or a traversal could
 *  reinterpret. `.` and `..` are handled by `resolvePath` before they ever
 *  reach here, so they are correctly rejected as *stored* names. */
const SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidSegment(segment: string): boolean {
  return SEGMENT.test(segment);
}

// ─── Reading and writing paths ──────────────────────────────────────────────

/** Parse an absolute virtual path. `/`, `/roadmaps` and `/roadmaps/a/b/c` are
 *  all locations; anything else — a relative path, an unknown top-level
 *  directory, a fourth level, a segment with a slash or a quote in it — is
 *  null, which every caller turns into a real `No such file or directory`.
 *
 *  Accepts and ignores a trailing slash and repeated slashes, the way a shell
 *  does, so `/roadmaps//voip/` is the same place as `/roadmaps/voip`. */
export function parsePath(path: string): Location | null {
  if (typeof path !== "string" || !path.startsWith("/")) return null;

  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return ROOT;

  // `/roadmaps` is the only directory at the top level, and it *is* the root:
  // the root listing is the roadmaps, so the two names mean one place.
  const [head, ...rest] = parts;
  if (head !== "roadmaps") return null;
  if (rest.some((segment) => !isValidSegment(segment))) return null;

  return fromSegments(rest);
}

/** Render a location as an absolute virtual path. Always `/roadmaps`-rooted
 *  and never trailing-slashed, so a path printed by `pwd` can be pasted back
 *  into `cd` unchanged. */
export function formatPath(loc: Location): string {
  const segments = segmentsOf(loc);
  return segments.length ? `/roadmaps/${segments.join("/")}` : "/roadmaps";
}

/** The path as a prompt shows it, with home abbreviated to `~`.
 *
 *  The curriculum root *is* home, so `/roadmaps` prints as `~` and everything
 *  below it as `~/voip/intro` — the same abbreviation a shell makes, and the
 *  reason it belongs beside `formatPath` rather than in a component: it is a
 *  fact about the path, with no colour, glyph or font in it.
 *
 *  `formatPath` stays the canonical form. This one is for reading. */
export function displayPath(loc: Location): string {
  const segments = segmentsOf(loc);
  return segments.length ? `~/${segments.join("/")}` : "~";
}

/** The location one level up. Root's parent is root, exactly as `cd ..` at `/`
 *  in a real shell leaves you at `/` rather than erroring. */export function parentOf(loc: Location): Location {
  const segments = segmentsOf(loc);
  return fromSegments(segments.slice(0, -1)) ?? ROOT;
}

/** The last segment — what `ls` calls the current directory. Root has no name
 *  of its own, so it answers with the path. */
export function basename(loc: Location): string {
  const segments = segmentsOf(loc);
  return segments[segments.length - 1] ?? "/roadmaps";
}

// ─── Walking ────────────────────────────────────────────────────────────────

/** Resolve one argument against a current location, the way a shell resolves
 *  an argument against `$PWD`. This is the single code path behind *both*
 *  step-by-step `cd` navigation and direct absolute-path arguments, which is
 *  why `cat /roadmaps/a/b/c` works from anywhere without a prior `cd`: every
 *  command resolves its argument through here, and none of them cares which
 *  form the user typed.
 *
 *  Handles, in order: empty and `~` (home is root), absolute paths, then a
 *  relative walk where `..` ascends, `.` stays, and anything else descends.
 *
 *  Returns null when the walk is impossible — a fourth level below a concept,
 *  or an invalid segment. `..` past the root is *not* an error: it clamps at
 *  root, as every shell does. */
export function resolvePath(cwd: Location, arg?: string): Location | null {
  const target = (arg ?? "").trim();

  // `cd` and `cd ~` both go home, and home is the root of the curriculum.
  if (target === "" || target === "~") return ROOT;

  if (target.startsWith("/")) return parsePath(target);

  // `~/a/b` is an absolute path written from home.
  if (target.startsWith("~/")) return parsePath(`/roadmaps/${target.slice(2)}`);

  let at = cwd;
  for (const step of target.split("/").filter(Boolean)) {
    if (step === ".") continue;
    if (step === "..") {
      at = parentOf(at);
      continue;
    }
    if (!isValidSegment(step)) return null;
    const next = fromSegments([...segmentsOf(at), step]);
    // Nothing exists below a concept: descending from one is the shell's
    // `Not a directory`, which the caller phrases.
    if (!next) return null;
    at = next;
  }
  return at;
}

/** Is `loc` at or below `ancestor`? Used to decide whether a location is still
 *  meaningful after the thing containing it has gone. */
export function isWithin(loc: Location, ancestor: Location): boolean {
  const a = segmentsOf(ancestor);
  const b = segmentsOf(loc);
  return a.length <= b.length && a.every((segment, i) => segment === b[i]);
}

export function sameLocation(a: Location, b: Location): boolean {
  return a.kind === b.kind && formatPath(a) === formatPath(b);
}

/** What a location contains, by name — what `ls` is listing and what `cd`
 *  descends into. A concept contains nothing; it is a file, not a directory. */
export type ChildKind = "roadmap" | "module" | "concept" | null;

export function childKindOf(loc: Location): ChildKind {
  switch (loc.kind) {
    case "root":
      return "roadmap";
    case "roadmap":
      return "module";
    case "module":
      return "concept";
    case "concept":
      return null;
  }
}

/** True when the location names a readable thing rather than a directory —
 *  what `cat`, `less` and `quiz` act on, and what `cd` must refuse. */
export function isReadable(loc: Location): boolean {
  return loc.kind === "concept";
}

// ─── The CLI route ──────────────────────────────────────────────────────────
// CLI location travels in a query parameter on the terminal route rather than
// in route segments. The URL still shows the true location — shareable,
// refresh-safe, correct under back/forward — but no page file has to exist per
// depth, so the deep GUI pages can claim real segments later without this
// having to be unpicked.

export const TERMINAL_ROUTE = "/student/terminal";
export const ADMIN_TERMINAL_ROUTE = "/admin/terminal";
export const PATH_PARAM = "path";

export type Role = "student" | "instructor" | "admin";

function terminalRouteFor(role?: Role): string {
  return role === "admin" ? ADMIN_TERMINAL_ROUTE : TERMINAL_ROUTE;
}

/** The CLI URL for a location. Root is the bare terminal route: a query
 *  parameter that only ever says "you are at the top" is noise in the address
 *  bar and one more thing to keep consistent. */
export function toCliRoute(loc: Location, role?: Role): string {
  const base = terminalRouteFor(role);
  if (loc.kind === "root") return base;
  return `${base}?${PATH_PARAM}=${encodeURIComponent(formatPath(loc))}`;
}

/** Read a location back out of a `?path=` value. Invalid input is null rather
 *  than a silent fall back to root, so a bad link is reported instead of
 *  quietly landing somewhere the user did not ask for. */
export function fromCliParam(param?: string | null): Location | null {
  if (param == null || param === "") return ROOT;
  let decoded = param;
  try {
    decoded = decodeURIComponent(param);
  } catch {
    // A malformed escape is malformed input, not a location.
    return null;
  }
  return parsePath(decoded);
}

// ─── The GUI projection ─────────────────────────────────────────────────────
// Deep content has no GUI page in this build. These two functions are the
// entire seam, kept together so the rule is read in one place.

/** Does this location have a GUI page that can render it?
 *
 *  Only the root does. A roadmap, module or concept is CLI-only until the
 *  redesigned content pages land in a later phase; when they do, this is the
 *  one function that changes. */
export function hasGuiPage(loc: Location): boolean {
  return loc.kind === "root";
}

/** The GUI route to show for a location — the page itself where one exists,
 *  and the nearest real page for this user where it does not.
 *
 *  This answers "what do I render", never "where is the user". The result is
 *  lossy — every depth below root collapses onto one dashboard — so a caller
 *  must not store it back as the user's position. `lastLocation` stays put
 *  across a GUI switch precisely so switching back can restore the concept
 *  the user was actually on. */
export function guiFallback(loc: Location, role?: Role): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "instructor") return "/instructor/dashboard";
  // Students: the dashboard is the nearest thing to "inside the curriculum"
  // that has a page, and it is where continue/resume already lives.
  void loc;
  return "/student/dashboard";
}

// ─── Persistence ────────────────────────────────────────────────────────────

/** Serialise for storage. A path string rather than the object, so what is
 *  written to localStorage and to the user's preferences is the same thing a
 *  human reads in `pwd` — and so a stored value that predates a shape change
 *  still parses. */
export function serializeLocation(loc: Location): string {
  return formatPath(loc);
}

/** Restore a stored location, falling back to root for anything unreadable
 *  rather than throwing: a corrupt preference should put someone at the top of
 *  the curriculum, not break the shell. */
export function deserializeLocation(value?: string | null): Location {
  if (!value) return ROOT;
  return parsePath(value) ?? ROOT;
}
