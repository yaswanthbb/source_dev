# source:dev — Full CLI Mode + Rebrand — Implementation Plan

Branch: `feature/redesign-frontend-terminal-style`
Scope: full CLI mode for both student and admin, shared-location architecture, extensible theming seam, KIP → source:dev rebrand.

---

## 0. What already exists (verified against HEAD `a95a40b`)

This is not a greenfield build. The existing terminal is in good shape and most of the work is **extending contracts that are already correct**, not writing new ones.

| Piece | File | State |
|---|---|---|
| Command registry + dispatcher | `frontend/lib/terminal/commands.ts` (929 L) | `CommandSpec{name,usage,summary,group,aliases,hidden,run}`, `runCommand()`, `COMMANDS` map, tab-completion, boot sequence |
| Domain commands | `frontend/lib/terminal/learning-commands.ts` (1392 L) | `roadmaps open continue read jump quiz complete review qa status dashboard` |
| Output vocabulary | `frontend/lib/terminal/output.ts` (152 L) | `LineKind`, `TerminalAction`, `segmentsOf()`, listing index, `stuck()` |
| Session/screen state | `frontend/lib/terminal/session.ts` (61 L) | `Screen`, `ConsoleEntry`, command handoff, `clearTerminalSessions()` |
| React host | `frontend/components/terminal/use-terminal-session.ts` (698 L) | `TerminalIO` impl, boot animation, history, TAB, ^C |
| Renderer | `frontend/components/terminal/terminal-workspace.tsx` (615 L) | line rendering, markdown, spinner |
| Navbar | `frontend/components/terminal/terminal-chrome.tsx` (257 L) | `TerminalHeader`, `TerminalSurface`, `TerminalCommandBar` |
| Palette | `frontend/lib/terminal/theme.ts` (64 L) | `DARK`/`LIGHT` objects → CSS custom properties |
| Tests | `frontend/lib/terminal/commands.test.mjs` (632 L) | node:test, already passing |

**The architecture the brief asks for is ~70% already present.** `commands.ts` has a header comment stating commands never touch React state and receive everything via `CommandCtx`. `output.ts` says explicitly "the host owns the palette". The `LineKind` union is already a semantic vocabulary (`ok`/`err`/`dim`/`head`/`rule`/`banner`), not a style vocabulary.

### Gaps against the brief

1. **No location concept at all.** Commands like `read`/`open` take a title or id and print into a screen buffer. There is no cwd, no path, no `pwd`/`ls`/`cd`/`cat`/`less`/`find`/`grep`/`man`/`history`. `ls` is currently an **alias for `roadmaps`** — this must be reworked.
2. **No mode concept.** The GUI dashboard and the CLI tab are two routes (`/student/dashboard`, `/student/terminal`) linked by navbar tabs, not a persisted mode.
3. **Theme persistence is localStorage-only** (`kip_theme` in `providers/theme-provider.tsx:23`). The brief says mode must persist to localStorage **and** the backend User entity — but **the backend has no preferences column at all** (`user.entity.ts` has only email/passwordHash/authProvider/name/role/timezone/profilePicture). This needs a migration.
4. **Admin dashboard is entirely un-converted** — old design tokens, `lucide-react` icon cards, rounded-2xl surfaces, sidebar layout. Full rewrite.
5. **Theme values are imported directly by components** (`DARK`/`LIGHT` from `theme.ts` into `terminal-chrome.tsx`, `terminal-workspace.tsx`, `student/dashboard/page.tsx`). Works, but it is a hardcoded two-theme binary, not a registry.

---

## 1. Architecture: one location, two renderers

### 1.1 The single source of truth

The brief is explicit that route and virtual path must be **the same value, not two synced values**. The only way to guarantee that structurally is to make one of them *derived* from the other rather than storing both.

**Decision: the URL is the single source of truth. The virtual path is a pure function of it, and vice versa.**

New file `frontend/lib/terminal/location.ts` — pure, no React, no imports from components:

```ts
export type Location =
  | { kind: "root" }
  | { kind: "roadmap"; roadmap: string }
  | { kind: "module";  roadmap: string; module: string }
  | { kind: "concept"; roadmap: string; module: string; concept: string };

parsePath(path: string): Location | null   // "/roadmaps/voip-basics/intro" -> Location
formatPath(loc: Location): string          // Location -> "/roadmaps/voip-basics/intro"
resolvePath(cwd: Location, arg: string): Location | null  // handles "..", "~", "", relative, absolute
toRoute(loc: Location): string             // Location -> Next.js route
fromRoute(route: string): Location | null  // Next.js route -> Location
```

Why this works: there is no `useState` holding a path anywhere. The CLI's `pwd` reads `fromRoute(usePathname())`. `cd` calls `router.push(toRoute(next))`. The GUI's links call `router.push()` too. **Both modes read and write the same `usePathname()` value** — drift is impossible because there is no second copy to drift from.

### 1.1a Deep content is CLI-only — location is total, GUI rendering is partial

**Decision (revised):** the deleted GUI pages (`roadmaps/`, `roadmaps/[id]`, `concepts/[id]`, `review/`, `qa/`) stay deleted. Deep content — roadmap, module, concept — is **CLI-only** in this build. They get redesigned in a later phase, after the backend architecture work.

This splits a thing the first draft wrongly treated as one thing:

- **Location is total.** Every virtual path is representable, trackable, and preserved — including the ones with no GUI page.
- **GUI rendering is partial.** Only some locations have a page to render.

So the URL cannot be the sole carrier of location after all: at a concept, GUI mode has no URL to sit at that means "inside this concept." The fix keeps one source of truth without pretending every location is routable:

```ts
// The authoritative location. In CLI mode this is derived from the URL as
// before. In GUI mode, where the URL cannot express deep content, the URL
// holds the *projection* and this holds the real position.
lastLocation: Location   // persisted to localStorage + preferences.lastLocation
```

Rules, in one place (`lib/terminal/location.ts`), so the projection is never ad-hoc:

```ts
hasGuiPage(loc: Location): boolean          // root: yes. roadmap/module/concept: no.
guiFallback(loc: Location, role): string    // nearest real GUI page for this context
```

- Switching **CLI → GUI** at a location with no GUI page: `router.push(guiFallback(loc))` — student dashboard for students, admin dashboard for admins — **and `lastLocation` is left untouched.** That is the whole trick: the projection is lossy, so it must not be allowed to write back. A projection that wrote back would silently reset the user to root, which is exactly the drift the brief warns about.
- Switching **GUI → CLI**: restore from `lastLocation`, landing on the exact concept they left.
- While in CLI mode, `cd` keeps writing the URL as before (it is expressive there), and every write also updates `lastLocation`.

Route mapping for the CLI-expressible paths:

| Virtual path | CLI route | GUI page? |
|---|---|---|
| `/` (root) | `/student/terminal` | yes → `/student/dashboard` |
| `/roadmaps/<rm>` | `/student/terminal?path=/roadmaps/<rm>` | **no** → falls back to dashboard |
| `/roadmaps/<rm>/<mod>` | `…?path=/roadmaps/<rm>/<mod>` | **no** → falls back |
| `/roadmaps/<rm>/<mod>/<concept>` | `…?path=/roadmaps/<rm>/<mod>/<concept>` | **no** → falls back |

CLI location rides in `?path=` on the existing `/student/terminal` route rather than in new route segments — no new page files, the URL still shows the true location (shareable, refresh-safe, back-button-correct), and when the deep GUI pages land later they can claim real segments without this having to be unpicked. `?path=` is validated through `parsePath` and rejected if malformed, same discipline as the existing `SAFE_REFERENCE` allowlist in `student/terminal/page.tsx`.

**GUI pages that actually exist today** (verified on disk — the full set GUI mode can route to): `/student/dashboard`, `/admin/dashboard`, `/admin/users`, `/admin/instructors`, `/admin/content-review`, `/instructor/*`, `/profile`, `/student/terminal`.

`?mode=cli` is **not** used — mode is a user preference, not a location, and putting it in the URL would make it a second source of truth for something that isn't location anyway.

### 1.2 Resolution: slugs vs ids

Virtual paths use **slugs** (`voip-basics`), the API uses **ids** (UUIDs). A resolver layer `frontend/lib/terminal/resolve-location.ts` maps slug→id so `cat /roadmaps/voip-basics/intro/what-is-voip` works from anywhere without a prior `cd`. Unknown slug → `cat: /roadmaps/x: No such file or directory` (real Unix error text). Existing title/id lookup in `read`/`open` stays, so old commands keep working.

> **Correction (applied).** The first draft of this section specified "a React Query cache". That was wrong, and for the same reason a hex colour in a command is wrong: it puts framework awareness inside `lib/terminal/`, which is the layer the theme guard exists to keep pure. A caching strategy that drags React into supposedly pure logic is the same category of violation as a colour, just less visible.
>
> **The resolver is therefore a plain async function over a module-level `Map`**, with no hooks and no React import, injected into commands through `CommandCtx`. It is testable the way `location.ts` is — transpile, call, assert — and the guard's promise keeps holding. React Query stays in the component layer, where a *component* may wrap this resolver if it wants request dedup.


### 1.3 The theming seam

Current state is already close. The rule to enforce and then **verify**:

> `lib/terminal/**` may not contain a hex colour, a box-drawing character, a font name, or a spacing value. It emits semantic line kinds only. `components/terminal/**` owns all of it.

Concretely:
- **Keep** `LineKind` as the contract. Add the kinds the new commands need (`table-row`, `path`, `pager-status`) rather than letting commands emit pre-drawn boxes.
- **Move** the `LOGO` ASCII art out of `commands.ts` into the theme — ✅ **done.** It is now `ThemeGlyphs.banner`, read at boot via `activeGlyphs().banner`. The guard had been passing over it only by luck: slant ASCII (`_ / | \`) falls outside the box-drawing ranges the regex tests, so the leak was un-triggered rather than absent.
- **Introduce** `frontend/components/terminal/themes/` mapping a theme id → `{ palette, glyphs, banner }`. Ship exactly one theme (`terminal`). The disabled navbar button reads from this registry's length so the stub is wired to something real, not a dead button.
  - **Correction (applied):** the first draft said `{ palette, glyphs, renderLine }`. `renderLine` is **dropped.** `LineKind`→style already has a home in `terminal-workspace.tsx`, and moving it into a data structure now — with no second theme to prove the abstraction generalises — is speculative complexity. Add it back if and when a real second theme demonstrates the need.
- **Add a lint guard**: `scripts/check-theme-separation.mjs` greps `lib/terminal/**` for `#[0-9a-f]{3,6}`, box-drawing ranges, and `font-`/`px` and exits non-zero. This is the brief's "verify the separation actually holds, not just in intent" — an assertion, not a claim.
  - **It immediately earned its keep: 39 violations on first run.** 38 were an entire dark/light palette (`lib/terminal/theme.ts`) sitting inside the command layer, one import away from the parser; the 39th was hardcoded `█`/`░` block glyphs in `learning-commands.ts`'s progress meter. The separation did **not** hold when first claimed.
  - Resolution: the palette moved to `components/terminal/themes/palette.ts`; a literals-free `lib/terminal/theme-contract.ts` now holds `ThemeGlyphs` plus `installGlyphs`/`activeGlyphs`; the meter became `ThemeGlyphs.meter(percent)`, so the theme owns cell count, fill characters and number formatting. **The dependency arrow now runs rendering → logic**, never the reverse.
  - `activeGlyphs()` throws when nothing is installed rather than returning a default, deliberately: a default would mean glyph literals back in the guarded layer, which is the exact leak. Importing the theme registry installs one.


---

## 2. Mode persistence

### 2.1 Backend (migration required — hand over, do not run)

`user_preferences` as a single JSONB column on `users`, not a column per preference — the brief says theme-swapping is coming, so this will grow.

```ts
// backend/src/migrations/<ts>-AddUserPreferences.ts
ALTER TABLE "users" ADD COLUMN "preferences" jsonb NOT NULL DEFAULT '{}'::jsonb
```

- `user.entity.ts`: `@Column({ type: 'jsonb', default: {} }) preferences: UserPreferences;`
- `UserPreferences = { uiMode?: 'gui' | 'cli'; themeId?: string; lastLocation?: string; hasSeenCliNudge?: boolean; hasSeenCliWelcome?: boolean }`
- `UpdateOwnProfileDto`: add optional validated `preferences` (nested `class-validator` DTO, not a bare object).
- `users.service.ts` `sanitizeUser()` must pass `preferences` through, and `getSelfProfile` return it.
- `frontend/lib/auth.ts` `User` interface: add `preferences?`.

> **Per your standing rule, I will write the migration but will not run it.** I'll hand you the exact command (`npm run migration:run` in `backend/`) when the code is ready.

### 2.2 Frontend

`frontend/providers/ui-mode-provider.tsx`, following the existing `theme-provider.tsx` pattern exactly:
1. Read `localStorage['sd_ui_mode']` synchronously on mount → instant, no flash.
2. Reconcile against `GET /users/me` `preferences.uiMode` when it lands (server wins on conflict — it is the cross-device truth).
3. Write both on every change: localStorage immediately, `PATCH /users/me` debounced.
4. Anti-FOUC: extend the existing blocking script in `app/layout.tsx:47` to also stamp `data-ui-mode` on `<html>`.

New accounts default to GUI (`preferences.uiMode` absent → `'gui'`).

---

## 3. Commands

### 3.1 New Unix commands (`frontend/lib/terminal/fs-commands.ts`)

| Command | Behaviour |
|---|---|
| `pwd` | print `formatPath(cwd)` |
| `ls [path]` | root→roadmaps, roadmap→modules, module→concepts; reuses existing `[x]`/`[~]`/`[ ]` status markers from the dashboard tree |
| `cd <name>` / `cd ..` / `cd` / `cd ~` | navigate; `cd` into a concept is an error (`Not a directory`), matching Unix |
| `cat <concept>` | print concept body, no pagination |
| `less <concept>` | **real pager**: space = page down, `b` = back, `q` = quit, `/` = search; status line `--More--(45%)` |
| `find <term>` | search roadmaps + concepts by name |
| `grep <term>` | search concept *content*, print `path:line: matched text` |
| `history` | session command history (already tracked in `use-terminal-session.ts`) |
| `whoami` | **exists**, extend to print path + role |
| `clear` | **exists** |
| `exit`/`logout` | **exists** — brief says these log out; currently `exit` returns to dashboard and `logout` logs out. Will make `exit` log out per the brief, keeping `dashboard` as the return-to-GUI verb. |
| `man <cmd>` | full Unix man page |

Every command accepts an absolute path argument anywhere it accepts a name — `resolvePath()` handles both, so this is one code path, not two.

### 3.2 `man` / `--help` for every command

Extend `CommandSpec` with an optional structured `man` field:

```ts
man?: {
  name: string;          // "quiz - answer a lesson's knowledge check"
  synopsis: string;      // "quiz [OPTION]... [CONCEPT]"
  description: string[]; // paragraphs
  options?: Array<{ flag: string; text: string }>;
  examples?: string[];
  seeAlso?: string[];
}
```

`man <cmd>` and `<cmd> --help` both render it through one formatter in the **renderer** (it's presentation). A command with no `man` falls back to `usage`+`summary`. **Every command in `COMMAND_LIST` gets one filled in — including `quiz`, `review`, `qa`** — and a test asserts completeness so a future command cannot ship without one.

### 3.3 Admin commands (`frontend/lib/terminal/admin-commands.ts`)

Same conventions, gated on `role === 'admin'`:

| Command | Purpose |
|---|---|
| `users [--role=R] [--search=Q]` | list users (`ls -l` style aligned columns) |
| `usermod <user> --role=R` | promote/demote (confirm prompt) |
| `userdel <user>` | approve deletion request (confirm) |
| `review-queue` | pending content reviews |
| `approve <id>` / `reject <id> [reason]` | act on a review |
| `instructors [--pending]` | applications |
| `stat` | platform analytics, ASCII meters |
| `logs [--limit=N]` | AI generation log |

Backed by existing endpoints (`/users`, `/admin/analytics/*`, `/admin/content-review`, `:id/approve-instructor`, `deletion-requests/*`). Destructive ones confirm first.

---

## 4. Mode switching UX

- **Toggle in navbar**, present on every authenticated page, absent from `(auth)` routes. `TerminalHeader` gains `[MODE: GUI|CLI]` beside the existing `[DK/LT]`.
- **Disabled theme button**: `[THEME: TERMINAL ▾]`, `disabled`, `title="Additional themes coming soon"`, `aria-disabled`. Styled as a visible stub, not hidden.
- **Switch preserves location** — free, because location lives in the URL. Switching at `/student/roadmaps/voip/intro/what-is-voip` re-renders the other mode at the same path.
- **Mid-quiz/mid-review safety**: in-flight command state lives in `use-terminal-session.ts`. Switching *away* from CLI aborts the in-flight request via the existing `runAbort` controller (the ^C path, already built) and drops the pending question. No write is half-committed, because every quiz answer is a discrete POST. Will verify explicitly.
- **First-ever CLI switch**: auto-typed welcome animation, once per account, gated on `preferences.hasSeenCliWelcome` (server-side, so it is once per *account*, not per device — the brief says "per account"). Reuses the existing boot-typing animation machinery.
- **Every later switch**: instant, plus a short contextual orientation message naming the current location, pointing at `help`/`man`, nudging `ls`.
- **First-ever login nudge**: dismissible toast via the existing `SnackbarProvider`, gated on `preferences.hasSeenCliNudge`.

---

## 5. Admin dashboard (GUI half)

Rewrite `app/admin/dashboard/page.tsx` + `app/admin/layout.tsx` against the **student dashboard's** grammar, reusing its actual CSS (`app/student/dashboard/terminal-dashboard.css`) rather than writing a parallel sheet — that is what makes "identical" verifiable rather than approximate:

- `kip-panel` boxes with `1px solid line` + `2px 2px 0` hard shadow
- Bracketed uppercase labels (`TOTAL_STUDENTS`, `#01`), `_`-joined values
- `TerminalReadout` typing animation, ASCII meters for completion bars
- `TerminalHeader` navbar (same component), sidebar deleted
- Palette strictly from `theme.ts` — **no new hex** (per the login-is-source-of-truth rule)
- Mobile-first: verify at 360 / 768 / 1280

Also converts `admin/users`, `admin/instructors`, `admin/content-review` for consistency.

---

## 6. Rebrand — KIP → source:dev

Inventory taken at HEAD. **A blind find/replace would break three things**, so this is staged:

### Safe — user-visible copy (do replace)
`app/layout.tsx:39` metadata title · `terminal-chrome.tsx:106-107` nav logo · `commands.ts:702` boot banner · `retro-homepage.tsx:89,1542` · `register/page.tsx:646,730,832,1800` · `login/page.tsx:565,647,745` · `forgot-password/page.tsx:539,619,716,1572` · `auth/callback/page.tsx:100,136` · `not-found.tsx:14,59` · `profile/page.tsx:332` · `instructor/layout.tsx` ×6 · `admin/layout.tsx` ×3 · `terminal-workspace.tsx:349` sr-only h1 · `minimal-terminal-loader.tsx:46` · `centered-terminal-loader.tsx:295` · file-header comments in `commands.ts`, `learning-commands.ts`, `output.ts`, `request.ts`, and 3 CSS files · `README.md`, `CHANGELOG.md`, `INSTRUCTOR_GUIDE.md` · backend `main.ts:57,59` Swagger title · `email.service.ts:123,152`

### ASCII logo — must be redrawn, not replaced
`commands.ts:657` `LOGO` spells `KIP` in 6-line slant. `source:dev` is 10 chars incl. a colon — the same letterform at that width would wrap on mobile, which the existing comment explicitly warns about. **Will draw a new compact banner that fits 360px** and move it into the renderer (§1.3).

### Storage keys — rename directly, no shim (approved)
No production user data to protect, so keys are renamed outright with no compatibility layer: `kip_token`→`sd_token`, `kip_user`→`sd_user`, `kip_theme`→`sd_theme`, `kip_just_logged_in`→`sd_just_logged_in` (18 sites), `kip_oauth_in_flight`→`sd_oauth_in_flight` (8 sites), `kip_dashboard_motion`→`sd_dashboard_motion`, event `kip-auth-changed`→`sd-auth-changed`. Existing sessions on dev machines will be logged out once — expected and accepted. Each key is renamed across **all** its call sites in a single edit so listener and dispatcher can never disagree; the anti-FOUC script in `app/layout.tsx` reads `sd_theme` and must change in the same pass.

### DANGEROUS — do NOT blind-replace
| Item | Why | Decision |
|---|---|---|
| `DB_DATABASE` default `knowledge_is_power` (`typeorm.config.ts:125-126`) | **renaming points the app at a non-existent database** | **Leave unchanged** (approved). Infra concern, not a code rebrand. |
| `CHANGELOG.md:78-79` GitHub URLs | real repo URL — renaming breaks the links | **Leave unchanged** (approved) |
| `package.json` `name` fields (3 files + lockfiles) | lockfile `name` must match or installs warn | Rename package.json + regenerate lockfiles |
| `kip-*` CSS classes | ~40 distinct classes across many files; mechanical but wide | Rename in one scripted pass at the very end, after all functional work, so it never tangles with a behavioural diff |

New `kip_`-equivalent keys use the `sd_` prefix.

---

## 7. Build order

1. ✅ `location.ts` + tests (pure, no UI) — the foundation everything else reads. **28/28 passing.**
2. ✅ Backend: preferences column + migration + DTO + service. Migration handed over and **run** — `users.preferences jsonb` is live. Two runtime checks still owed, tracked in §8.
3. ✅ `ui-mode-provider.tsx` + layout FOUC script. Built, typechecks, lint-clean — but **not yet executed**: nothing consumes `useUiMode()` until step 8's navbar exists.
4. ✅ Theme registry + `scripts/check-theme-separation.mjs`. Failed on first run (39 violations, see §1.3) and was reworked; palette, meter glyphs and boot mark all moved out of the command layer.
5. `fs-commands.ts` — pwd/ls/cd/cat/less/find/grep/history
6. `man` infrastructure + backfill every command
7. ~~GUI route pages re-created~~ — **dropped.** Deep content stays CLI-only; `?path=` on `/student/terminal` carries CLI location, no new page files.
8. Navbar: mode toggle + disabled theme stub
9. Welcome animation + orientation message + first-login nudge
10. Admin commands
11. Admin dashboard GUI rewrite
12. Rebrand copy pass → storage keys → CSS class pass last
13. Full verification (§8)

Steps 1–4 are load-bearing; everything after depends on them. **Checked back in after step 4**; 5–13 approved to proceed.

### Out of scope for this branch

- `backend/src/modules/quiz/quiz.service.spec.ts:368,378,388` — 3 pre-existing `TS2571` (*object is of type 'unknown'*) errors. Predate this branch and are unrelated to CLI mode. **Deliberately left out** so this diff stays about one thing; fix in its own pass.


---

## 8. Verification

Tests extend `frontend/lib/terminal/commands.test.mjs` (node:test, already in place).

### Owed from step 2 — gate on step 8, do not defer further

These two are the *only* things in this plan verified by reading rather than by running. Both are invisible to `tsc`: if the backend silently drops `preferences`, everything still compiles, the browser still works off localStorage, and cross-device persistence is simply absent. The failure mode is silence, which is exactly why they are written down here with an owner-step rather than left as a good intention.

- [ ] **`GET /users/me` returns `preferences` over the wire.** Believed fine by construction — `sanitizeUser()` spreads the whole entity and deletes only `passwordHash`, so a new column passes through automatically — but never observed in a response.
- [ ] **`PATCH /users/me` round-trips a preference.** Send `{preferences:{uiMode:'cli'}}`, confirm the response carries it back merged (not replacing sibling keys), then confirm a fresh `GET` still has it.

**Step 8 is the checkpoint** because that is when the navbar toggle first makes the provider actually run. Both boxes get ticked there, in the browser's network tab, before step 8 is called done — not carried forward again.


**Automated**
- `location.ts` round-trip: `parsePath(formatPath(l)) === l` for every shape
- `resolvePath`: `..` from each depth, `~`, bare `cd`, absolute from anywhere, `..` at root is a no-op, rejects traversal past root
- `hasGuiPage` false for roadmap/module/concept, true for root
- **Lossy projection never writes back**: CLI→GUI at a concept leaves `lastLocation` at that concept; GUI→CLI restores it exactly. This is the single most important test in the suite — it is the drift the brief is about.
- `?path=` rejects malformed/traversal input the way `SAFE_REFERENCE` does
- Every `COMMAND_LIST` entry (incl. `quiz`/`review`/`qa`) has a `man` with NAME/SYNOPSIS/DESCRIPTION; `--help` and `man x` produce identical output
- Equivalence: `cat /roadmaps/a/b/c` from root ≡ `cd`-then-`cat` — same emitted lines
- Error text matches Unix (`No such file or directory`, `Not a directory`)
- `check-theme-separation.mjs` passes — no hex/box-glyph/font in `lib/terminal/**`
- Rebrand: zero `KIP`/`Knowledge Is Power` outside the documented exception list; zero surviving `kip_`/`kip-auth-changed` identifiers
- `npx tsc --noEmit` and `npm run lint` clean

**Manual (browser, per your responsive rule — 360 / 768 / 1280)**
- Switch mode mid-read at a concept → GUI lands on the dashboard, switching back returns to that exact concept
- Switch mid-quiz → no crash, no half-committed answer, location preserved
- First CLI switch animates once; second switch is instant + prints orientation
- Fresh account defaults to GUI; nudge toast appears once after first login
- Theme button visible, disabled, obviously a stub
- No GUI chrome in CLI mode beyond the navbar
- Admin dashboard side-by-side against student dashboard — same panels, shadows, type scale
- `less` pagination: space advances, `q` quits
- Browser back/forward across `?path=` changes behaves sanely

---

## 9. Resolved decisions

1. ~~Storage-key shim~~ → **rename directly, no shim.** Approved.
2. ~~`exit` semantics~~ → **`exit`/`logout` both log out; `dashboard` is the GUI return verb.** Approved.
3. ~~Re-create deleted GUI routes~~ → **no.** Deep content is CLI-only this phase; GUI gets a lossy fallback to the nearest real page, location preserved underneath.
4. ~~Repo/db rename~~ → **leave `DB_DATABASE` and GitHub URLs unchanged.** Approved.
