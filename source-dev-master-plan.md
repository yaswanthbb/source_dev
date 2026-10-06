# source:dev — Master Plan
### Consolidated from every decision made across our conversations. Updated to reflect actual progress — this is the reference doc we work through one section at a time.

---

## 0. Vision

The platform is no longer school-shaped (student/teacher). It's repositioned as:

> **"Knowledge for developers, built by developers."**

Core differentiator: one-click AI-assisted course generation, without the hassle of hand-prompting an AI yourself every time you want to learn something. Popularity/growth is explicitly **not** a near-term goal — that's a later-stage concern. Right now the goal is getting the product itself right.

**Brand name: source:dev** (renamed from KIP/knowledge_is_power). **Rebrand status: essentially complete** — see §9c.

**Status of underlying data:** all current production data is test/dev data only — v1.0.0 was never used by real users. No live-data migration risk. Safe to make fully breaking schema and role changes.

**Overall sequencing (top-level, confirmed 2026-09-21):**
1. ~~Finish full CLI mode first~~ — **student side DONE** (§9b). Admin dashboard/CLI explicitly **deferred to the end** (see §9d) — no thin reskin, no admin commands until backend is done.
2. **Then** work through the full backend/architecture master plan (§1–§8) — **not yet started**. Backend-first: finish all endpoints + contracts + backend tests before any new frontend, to avoid rebuilding UI twice.
3. **Then, last**, build the frontend pass in order: **Developer frontend first, Admin frontend last** (admin reviews what developer submits, so developer shapes are the contract). This covers the new Developer authoring screens + Admin review screens + terminal restyle.

---

## 1. Roles — collapsed from three to two

**Status: ✅ BACKEND DONE 2026-09-21 (frontend deferred to frontend phase).** Deleted entirely: `InstructorProfile` entity, `InstructorStatus` enum, `POST /users/apply-instructor` (already gone), `GET /users/instructor-applications`, `PATCH /users/:id/{promote-to-instructor,demote-to-student,degrade-to-student,approve-instructor,reject-instructor}`, `PATCH /users/me/instructor-bio`. `UserRole` is now `developer`/`admin` only; migration `RoleCollapseToDeveloper` maps every existing student+instructor row to developer and drops the profiles table. New accounts register as developer. `instructor-analytics` module renamed to `developer-analytics` (`developer/my-analytics`, guard developer/admin, no approval check); admin analytics retargeted (`totalDevelopers`/`activeDevelopers`/`totalEnrolledDevelopers`, per-developer table at `admin/analytics/developers`). AI-generate guard is now developer/admin.

**Locked API contract (backend-first rule):** `GET /users/me` no longer includes `instructorProfile`. `GET /users?role=` accepts `developer`/`admin` only. Content visibility interim rule (§2/§3 will finalize): admins see all; developers see approved concepts + their own drafts (author exception in roadmaps/concepts reads).

**Old model:** Student / Instructor / Admin (with an Instructor application-and-approval flow).

**New model:**
- **Developer** — the only "regular user" role. Can read published content, write/author roadmaps and concepts, generate content with AI, keep any of it private or submit it for public review, write Articles. There is no separate "student" or "instructor" distinction anymore — everyone who registers is a Developer.
- **Admin** — strictly the platform owner (you). Sole reviewer of submitted content. No daily AI generation limit (see §5).

**To be deleted entirely (not deprecated) when this phase is tackled:**
- The `InstructorProfile` entity
- Remaining `approve/reject-instructor` endpoints and any related admin UI
- Any "pending instructor" status/badge logic

**Unauthenticated visitors** (not logged in at all): can still read public **Articles** (see §6) with no account. They cannot see Roadmaps/Modules/Concepts — that content requires a registered (Developer) account. A soft signup-nudge popup appears when a visitor scrolls to the end of a full Article (not on page load, not mid-scroll). Tone: soft nudge, not a hard paywall.

---

## 2. Content ownership & reuse

**Status: ✅ BACKEND DONE 2026-09-21.**
- Developers keep authored content private indefinitely: drafts are author-only until published (no submit requirement, no expiry).
- **Attach gate** (`POST modules/:moduleId/concepts`): a concept attaches only inside its own author's roadmap (`concept.authorId === roadmap.createdById`, strict, no admin bypass). Cross-developer reuse is a `403`.

---

## 3. Publishing / review workflow

**Status: ✅ BACKEND DONE 2026-09-21** (frontend screens deferred). Shipped: `POST roadmaps/:id/submit` (soft 3×3 warnings, resubmit re-queues rejected-only), `GET roadmaps/:id/review` (compiled response: per-module rollup with derived `approved` flags + `canPublish`), per-concept approve/reject restricted to SUBMITTED roadmaps, pending queue filtered to submitted roadmaps, `PATCH admin/content-review/roadmaps/:id/publish` (all-approved + ≥3 modules), `PATCH .../reject` (outright, back to draft with reason, concepts untouched), `PATCH .../unpublish` (takedown, approvals intact).

**Specified 2026-09-21 (locked for the §3 build):**

When a Developer wants a roadmap to go public:

1. **Private by default:** an authored concept is visible only to its author until reviewed. A pending-review concept is likewise author-only.
2. **Submit for review** happens at the **whole-roadmap level** — one action, not per-concept gating. **Submission minimums (hard, enforced on the author at submit):** at least 3 modules, each with at least 3 concepts. Submit below that is a `400`, not a warning.
3. **Admin reviews the whole roadmap**, opening each module and each concept. Admin marks each concept OK or Reject (with a reason per rejected concept), or rejects the entire roadmap outright.
4. On submission, the developer receives a single compiled response, auto-assembled from the per-concept marks.
5. **Resubmission after rejection:** only the previously-rejected concepts get re-queued for review.
6. **Module approved (derived display, no stored state):** a module counts as approved when **all** its concepts are approved. Frontend shows "module approved" instead of N concept rows; backend exposes the flag per module in the review response. There is no module approve/publish click.
7. **Roadmap publish:** explicit admin click, unlocked only when every concept is approved. Structure minimums are not re-checked at publish — submit already guarantees them.
8. ✅ **Published-content edit model (specified 2026-09-22, BACKEND DONE):**
- **Names live-editable:** roadmap/module/concept titles edit freely, no review gate, effective immediately.
- **Concept content draft/live split (published concepts only):** significant edits (existing `hasSignificantContentChange`, ≥40 edit distance) to an approved concept in a published roadmap are stored as a pending draft — readers keep seeing live until admin approves, then draft replaces live. Small edits go live instantly. New/unpublished concepts keep the simple pending→hidden→approved flow.
- **While published:** concepts attachable, never detachable by the developer; nothing directly deletable by the developer.
- **Developer unpublish:** request (from published) → admin approves/denies → on approve, 30-day fully-public countdown → then private, normal draft freedom resumes. Author may cancel a pending request.
- **Private content:** full developer freedom (attach/detach/edit/delete own, no restrictions).
- **Admin moderation deletes:** roadmaps = immediate delete (existing) or 30-day-delayed delete (visible until date, then purged via maintenance endpoint); concepts/modules = immediate direct delete. Delete-concept blocked while attached to any module (detach first). Module delete auto-detaches its concepts; roadmap delete detaches all modules.
- **Deletion notification contract (for §7, no infra yet):** payload states what was removed, who removed it, when, and a specific human reason (YouTube/Meta/Maps pattern). No appeal mechanism, no soft-delete system — hard delete + informal "contact admin" at current scale.
- **Schema notes:** roadmaps need unpublish-request state + effective date and scheduled-deletion date; concepts need pending-draft content storage.
- **History:** same rows throughout (no edition copies) — QA threads and learner progress carry over automatically.

## 4. Content labeling (AI-generated vs hand-written vs partial)

**Status: ✅ BACKEND DONE 2026-09-24** (three-state per decision; no migration — computed at read time, never stored).
- Concept: `ai` iff `isAiGenerated`, else `handwritten` (exposed as `originLabel` on concept reads).
- Module: `ai` only if every visible concept is AI; `handwritten` only if every visible concept is hand-written; `partial` on any mix; `null` when empty.
- Roadmap: same rollup one level up over non-empty modules.
- Labels compute from **visible** concepts only (hidden drafts can't skew a reader's label) and ride the existing reads (concept list/detail, roadmap list/detail, review response).
- Reader filters: `GET /concepts?label=` and `GET /roadmaps?label=` (`ai`/`handwritten`/`partial`, else `400`); unlabeled (empty) items never match a filter; concepts are never `partial`.

---

## 5. AI Generation — BYOK (Bring Your Own Key) redesign

**Status: ✅ BACKEND DONE 2026-09-24** (migration `AiByokKeys`; providers NVIDIA + Gemini; decisions 2026-09-24 below supersede the older draft).

**Why:** the platform is free, unfunded, single-dev. A shared platform API key cannot realistically support real usage at scale.

**Free tier (platform's NVIDIA key only):**
- **5 generations/day per Developer.**
- **Admin has no daily limit at all** (checks skipped, `-1` sentinel + `unlimited` flag in quota responses).
- Gemini is **BYOK-only** — no platform Gemini key.

**Bring-your-own-key:**
- A Developer stores **up to 2 keys** (any mix of NVIDIA/Gemini), first one auto-default. Label/cap editable; key material re-creatable via delete + create.
- **One default key** drives all generations (no per-call key picker). Absent default = free tier.
- **Security (non-negotiable, implemented):** AES-256-GCM envelope (`AiKeyCryptoService`), `AI_KEYS_ENCRYPTION_SECRET` 32-byte hex (production refuses to boot without it; dev uses an ephemeral key + warning), decrypted only server-side at call time, list/read endpoints return metadata only (id, provider, label, last-4 hint, default, cap, timestamps).
- **Providers:** NVIDIA NIM (OpenAI-compatible chat) + Gemini (`generateContent` REST). Model list per provider **auto-fetched live** (`GET /ai-providers/:provider/models`, optional `?keyId=`), curated fallback with `live:false`. Callers may pass `model`, validated server-side against the live list.
- Own-key quota: **separate daily bucket per key** (default cap 20, settable **1–50 freely, no confirmation step** — decided simplification of the old "are you sure" draft).
- Jobs snapshot provider+model+key at creation; detached runners rebuild from the snapshot (immune to default-key changes mid-flight).

**Key lifecycle edge cases:**
- A key driving a pending/running job is **locked from deletion** (`400` with reason).
- Deleting the default (or having none) falls back to the free tier automatically.

**Limit-hit / failure behavior:** free-tier limit, own-key limit, high traffic, or provider error — unified prompt: wait until tomorrow, or add/switch to their own key. Auth failures (401/403) instead say the key was rejected (check/replace).

---

## 6. Articles (new feature)

**Status: ✅ BACKEND DONE 2026-09-25** (migration `Articles`; `ARTICLE_DELETED` now emitted).

- **Fully public:** `GET /articles` + `GET /articles/:id` are `@Public()` — no login required. Newest-first, optional title search.
- **Hand-written by construction:** no AI-generation path exists for articles (no endpoint, no flag). Create/publish is one step, immediate, no review gate.
- **Further reading:** nullable `roadmapId`/`conceptId` links (existence-validated, `null` clears, target deletions `SET NULL`). Targets keep their own visibility rules when opened.
- **Deletion:** author deletes own silently; `DELETE /articles/admin/:id` (admin) requires a specific reason, delivered via `ARTICLE_DELETED` with the §3.8 contract payload (self-actions skipped).

---

## 7. Notifications (new, general-purpose system)

**Status: ✅ BACKEND DONE 2026-09-25** (migration `Notifications`; `ARTICLE_DELETED` defined, emitted when §6 lands).

General-purpose entity from the start: recipient + `NotificationType` enum + jsonb payload + read-state (`isRead`/`readAt`). Reader endpoints: `GET /notifications` (`?type=` filter per plan, `?unreadOnly=`), `GET /notifications/unread-count` (bell badge), `PATCH /notifications/:id/read` (owner-scoped), `POST /notifications/read-all`.

Emitted now (all via never-throwing `notify`/`safeNotify`/`notifyAdmins` so bells can't break operations):
- Submit → all admins (`roadmap_submitted`, author excluded from own fan-out).
- Publish / roadmap-reject / concept approve / concept reject → author (reasons + reviewer stamps included; self-actions skipped).
- Unpublish approved / immediate takedown / scheduled + immediate roadmap delete → author with the §3.8 deletion contract payload (what, id, title, who, when, specific reason, effective date where applicable).
- AI job terminal outcomes → requester (`ai_job_completed` on clean finish and retry finals, `ai_job_failed` on failures; no double-notify when a retry takes over).

---

## 8. AI Course-Generation Quality — the actual competitive differentiator

**Status: IN PROGRESS — Phase 0 audit done, Phase 1 slice 1 (prompt registry) building.**
Spec: `AI Course Generation R&D.html` (repo root) + the master implementation prompt below it (phases 0–9). Rule: additive migrations, adapters, and env flags over big-bang rewrites.

**Phase 0 audit (2026-10-05, verified against the tree):**
- Provider boundary: `AiGenerateService.complete(creds, system, user, options)` → `AiProviderClients` (NVIDIA NIM + Gemini drivers, live model lists + curated fallback). Credentials resolve once per op (`resolveCredentials`); jobs snapshot provider/model/keyId and rebuild them detached; retries inherit. Quota is civil-day per bucket (free 5, own-key 1–50, admin unlimited) off `ai_generation_logs`.
- Prompts: static string constants + builder fns in `ai-generate/constants/prompts.ts` (6 paths: roadmap→modules, module→concepts+content, module→MCQs, single concept content w/ link sanitize, single concept MCQs w/ JSON repair + 1 retry, QA answers private to asker). Unversioned; nothing logs prompt/model/params per call today.
- Data: Roadmap (`review_status` draft/submitted/published), Module, Concept (author, reviewStatus, isAiGenerated, `draft_content`, difficulty), ModuleConcept (+prerequisites), McqQuestion/Option/Attempt, ReviewItem (doubling intervals cap 60, civil-date due), XpEvent, AiGenerationJob (progress, result summaries, 1 auto-retry, orphan recovery on boot) + notifications on terminal outcomes.
- Missing: feature-flag infra (none — new `COURSE_ENGINE_*` env flags), cost/latency telemetry, eval harness, RAG/sources, Mermaid, FSRS lib, prompt versioning.
- Tests: backend jest colocated `*.spec.ts`; frontend `node --test lib/terminal/*.test.mjs`.

**Architecture decisions (recorded,ADRs live with the code they govern):**
- AD1: prompt registry table + immutable versions; v1 rows capture current static prompts verbatim (zero behavior change), registry reads fall back to constants when the engine flag is off.
- AD2: quota stays per top-level operation; internal pipeline stages log to a stage-artifact record for cost/observability, never to `ai_generation_logs`.
- AD3: course context is roadmap-scoped relational tables (concepts/modules/terms/edges as rows), not JSON blobs — callbacks and reuse must be joinable and validatable.

The honest question to keep asking: **why would a developer use source:dev's generator instead of just prompting ChatGPT/Claude directly themselves?** The answer has to be that the generated course is reliably, consistently better than hand-prompting — every time, not just on a good run.

Likely requirements: genuinely iterated/tested prompt engineering (versioned, not fire-and-forget), structural consistency across generated content, accuracy that holds up to developer scrutiny, possibly multi-pass/chained generation instead of one-shot, and real evaluation against standards before shipping the final prompt design.

---

## 9. Visual/UI direction — Terminal aesthetic

### 9a. Dashboard bugfix pass — ✅ DONE
MCQ duplicate-option render, QA "who should answer" validation, QA free-text garbage rejection, loading/input-lock + working Ctrl+C, streaming output animation, braille-dot spinner, TAB completion, long-lesson section jump, inline "next step" suggestions on dead-end output. All confirmed via screenshots across multiple rounds.

### 9b. Full CLI mode (student) — ✅ DONE, exceeded original scope

Built across several corrective rounds (buttons removed, help/man format fixed, numbering scoped correctly, redundant commands cut). Final command set:

**shell/** `help`, `man`, `history`, `neofetch`, `clear`, `exit`
**filesystem/** `pwd`, `ls`, `cd`, `cat`, `less`
**learn/** `continue`, `jump`, `quiz`, `complete`, `review`, `qa`, `status`
**navigate/** `dashboard`
**profile/** `whoami`, `profile`, `timezone`, `passwd`
**danger/** `deletion-status`, `delete-account`
**session/** `theme`, `logout`

**Removed from the original spec, deliberately:**
- `roadmaps`, `open`, `read` — fully redundant with `ls`/`cd`/`cat`/`less`; having two paths to the same action was rejected as a maintenance liability, not kept.
- `find`, `grep` — removed entirely (implementation, help, tests, completion support all deleted).
- `apply-instructor`, `instructor-status` — removed from CLI **and** the backend route (`POST /users/apply-instructor`) deleted outright, since the whole instructor-application concept is being deleted platform-wide in §1 anyway.

**Correction to original spec:** numbered shorthand (`cd 1`, `cat 2`, etc.) is **scoped to quiz/MCQ answers only** — `ls`/`cd`/`cat`/`less` for roadmaps and concepts stay name/path-based, no numbering. (An earlier draft assumed broader numbering; that was wrong and has been corrected.)

**Confirmed working as specified:** virtual filesystem navigation (`cd`/`ls` genuinely walks roadmap → module → concept), both step-by-step `cd` and direct path support, real `man`/`--help` on every command (compiler-enforced — impossible to ship a command without a help block), TAB-completion on **arguments** (not just command names — verified by execution, completes against real roadmap/concept names at the current location), no buttons anywhere inside the terminal window (verified via screenshot, not just source-reading), full rebrand of the visible terminal surface.

**New features added beyond the original spec** (kept after testing, genuinely well-received):
- `today` — read-only morning briefing: streak/XP, reviews due, 7-day ASCII sparkline, next unlocked lesson.
- `heatmap [days]` — GitHub-style contribution graph as text, timezone-correct.
- Suggestion menu on typing (matching commands + summaries, TAB-completed values, arrow-key navigation).
- Arrow-key picker for quiz answers, review answers, and the AI/instructor chooser (with graceful fallback to the original numbered flow for hosts that don't support it).
- Ctrl+R history search, Ctrl+S stash/restore line, idle Ctrl+C clears input.
- Syntax highlighting for code blocks inside lessons.

**Tests: 96/96 passing** (scripted flows through the new picker/menu features, plus all pre-existing suites green).

### 9c. Rebrand — ✅ essentially DONE
Frontend: all `kip-*` CSS classes → `sd-*`, all UI copy/headers/titles, storage keys (`kip_token` → `sd_token` etc.), page metadata. Backend: package name, Swagger title, email service sender display name. Local database renamed (`knowledge_is_power` → `source_dev` via `ALTER DATABASE`, done through pgAdmin). Deliberately left untouched: `CHANGELOG.md` and `CLI_MODE_IMPLEMENTATION_PLAN.md` (historical records, not rewritten — a new CHANGELOG entry documents the rename instead).

**Still outstanding:** Render's `DB_DATABASE` environment variable still points at the old name — needs updating + redeploy once you're ready (local dev is unaffected in the meantime, so this is low urgency).

### 9d. Admin dashboard (terminal style) — ⬜ IN PROGRESS (frontend phase started 2026-09-25)
Terminal parity with student, zero old design remaining: `app/admin/terminal` reusing the shared terminal shell, `lib/terminal/admin-commands.ts` (same Command pattern + tests), `admin/dashboard` rebuilt terminal-styled with GUI toggle (same default as student). Old cards deleted, not restyled. Covers all §1–§7 + §12 backend surface (review incl. drafts/countdowns/deletes, users, notifications bell, articles moderation, own BYOK keys, labels, QA verify buttons, analytics). `/instructor/*` routes + `admin/instructors` deleted outright in this phase; QA discussion UI fixes stay in developer phase.

---

## 10. Updated build order (revised 2026-09-21 — backend-first, frontend-last)

**Rule agreed 2026-09-21:** complete the whole backend first (endpoints + contracts + backend tests, one phase at a time with verification), then move to frontend once. Frontend order: Developer first, Admin last. No frontend rework loops in between — each backend phase locks its API contract before moving on.

**Backend phase (in order):**
1. ~~Dashboard bugfix pass~~ — done (§9a)
2. ~~Full CLI mode (student)~~ — done, exceeded scope (§9b)
3. ~~Rebrand pass~~ — essentially done (§9c), Render env var still pending (low urgency, local dev unaffected)
4. ✅ ~~Role collapse (§1) + QA discussion backend (§12)~~ — **backend done + manually verified**
5. ✅ ~~Content ownership (§2) + Publishing/review workflow (§3) + content labeling (§4)~~ — **backend done**
6. AI course-generation quality deep-dive (§8) — before or alongside BYOK, it's the core differentiator
7. ✅ ~~BYOK AI generation system (§5)~~ — **backend done**
8. ✅ ~~Notifications system (§7)~~ — **backend done**
9. ✅ ~~Articles feature (§6)~~ — **backend done**

**Frontend phase (only after backend above is done):**
10. Developer frontend (terminal-styled authoring screens + student→developer CLI rename/migration) — first
11. Admin dashboard + admin CLI commands (§9d) + Admin review screens — last, built once against the final Developer/Admin model and §3 workflow

## 11. Decision log (memory for future sessions/agents)

- **2026-09-21 — Backend-first, frontend-last:** user proposed completing the whole backend before any new frontend to avoid repeated rework; agreed. Each backend phase ships with locked API contract + backend tests.
- **2026-09-21 — Role collapse before admin work:** building admin CLI on the old 3-role model would be throwaway (§1 deletes `InstructorProfile`, approve/reject endpoints, approval queue). So §1 goes first, §9d goes last.
- **2026-09-21 — Frontend order Developer → Admin:** admin reviews what developer submits, so developer shapes are the contract. Admin UI is the final piece.
- **2026-09-21 — Analytics retarget (backend) / redesign (frontend):** confirmed. Backend §1 keeps both analytics systems working but retargeted: admin overview shows developers (no instructor split), per-author "my-analytics" works for any Developer (own roadmaps/concepts/questions + engagement by other developers). Dashboard redesign itself is frontend phase, not backend.
- **2026-09-21 — QA remodeled into discussion (supersedes author-only rule):** any developer who can see a concept can see its discussion and post answers; concept author + admin can mark answers verified (verified badge); Ask-AI answers are private to the asker only; ask UI offers two options: "Ask AI" (private) vs "Post in discussion" (public). Details in §12.
- **2026-09-21 — §1 backend + §12 backend shipped:** role collapse + QA discussion backend implemented, `tsc` clean, backend jest 236/242 (the 6 failures in progress/quiz/ai-generate specs are pre-existing on clean HEAD, verified via stash). Migrations `1787900000000-RoleCollapseToDeveloper` + `1787910000000-QaDiscussionModel` not yet run against a live DB (no DB in this environment) — run `typeorm:migration:run` in dev before frontend work. Frontend still references old roles/routes — intentionally untouched until frontend phase.
- **2026-09-21 — QA visibility hole fixed:** reads gated concepts but QA list/ask/answer did not — a developer could ask on a pending draft they couldn't see. Fixed in `QaService` via `checkConceptVisible` on all three entry points (404, no leak). Rule going forward: no endpoint may touch a concept's discussion without passing the visibility check.
- **2026-09-21 — §3 specified:** private-by-default concepts, whole-roadmap submit (soft 3×3 minimums), per-concept approve/reject + compiled response, resubmit rejected-only, module publish = all concepts approved + admin publish click, roadmap publish = ≥3 published modules.
- **2026-09-21 — §2+§3 backend shipped:** roadmap `review_status` lifecycle (migration `PublishingWorkflow`); submit/review/publish/reject-roadmap/unpublish endpoints; per-concept approve restricted to submitted roadmaps; module-approved is derived display only (no module click — corrected per user); attach gate enforces same-author reuse (strict, no bypass); visibility predicate extended to approved + published-roadmap placement everywhere incl. QA. Concept-approve on non-submitted work now `400`s (test-guide 1.8 flow replaced by submit-first).
- **2026-09-21 — Submit guards hardened per manual testing:** 3 modules × 3 concepts is now a hard `400` on the author at submit (was soft warnings); publish drops the module-count re-check (submit guarantees it). Rejected concepts still block publish. Deferred: published-edit → re-review → republish flow + author-delete permissions (design first).
- **2026-09-22 — Published-edit flow designed (not built):** targeted block on invariant-breaking removals (not a freeze); re-review via queue covers published placements (no resubmit needed for single-concept fixes); titles stay live; delete-concept blocked while attached; delete-module auto-detaches; delete-roadmap detaches all. Author-delete permissions still open.
- **2026-09-22 — Published-edit model backend shipped (migration `PublishedEditModel`):** concept `draft_content` staging for significant live edits (small edits live, titles always live); detach blocked on published roadmaps (append-only); unpublish request→approve/deny with 30-day public countdown (lazy expiry flip, no cron); scheduled admin deletion + purge endpoint; concept-delete blocked while attached; admin approve promotes drafts, draft-reject keeps live + reason; review queue covers published placements. Deletion-notification payload contract saved for §7 (no infra yet).
- **2026-09-24 — Draft leak fixed:** `draftContent` rode the spread entity into reader responses (`findConceptById`, `findAllConcepts`, roadmap reads). Stripped for non-author non-admin everywhere; review response carries `hasPendingDraft` instead.
- **2026-09-24 — Countdown abort added:** author-cancel and admin-deny now also work on an approved (not yet elapsed) unpublish countdown, clearing status + date. Previously nothing could stop it post-approval.
- **2026-09-24 — §4 backend shipped (no migration):** three-state origin labels computed bottom-up at read time (`origin-label.util`, unit-tested); `originLabel` on concept/roadmap/module reads + review response; `?label=` filters on both list endpoints; empties unlabeled and excluded from filtered results.
- **2026-09-24 — §5 backend shipped (migration `AiByokKeys`, providers NVIDIA + Gemini):** default-key setting (not per-call picker); per-key quota buckets (free 5/day, own-key default 20, settable 1–50 with NO confirm step — decided); Gemini BYOK-only (no platform key); caller model choice validated against live lists; AES-256-GCM custody with boot refusal in prod without secret; in-use deletion lock; jobs snapshot credentials; unified wait-or-switch messages; admin unlimited. Fixed 4 of the 6 pre-existing spec failures as drive-by (ai-generate quota specs rewritten; progress/quiz failures remain, untouched).
- **2026-09-24 — Provider error mapping hardened (from live 410):** model-gone responses (NVIDIA 404/410, Gemini 404) now name the model and point at the live list instead of the generic wait-or-switch prompt; restored pre-BYOK `NVIDIA_MODEL_ID`/`NVIDIA_API_URL` operator overrides for the default model.
- **2026-09-24 — Per-key default model + pre-save lookup:** `POST /ai-providers/:provider/models/lookup` verifies an unsaved key and returns its live list (dropdown source, never stored); keys carry a validated `defaultModel`; resolution priority is per-call model → key default → provider default.
- **2026-09-25 — §7 backend shipped (migration `Notifications`):** general-purpose entity (recipient + type enum + jsonb payload + read-state); reader endpoints with `?type=` filter, unread-count badge, owner-scoped read/read-all; emitters for submit (admins), publish/reject/approve (authors, self-actions skipped), unpublish + deletions (full §3.8 contract payload), AI job terminal outcomes (no double-notify across retries); all emission never-throwing. `ARTICLE_DELETED` reserved for §6.
- **2026-09-25 — §6 backend shipped (migration `Articles`):** public reads (no login), immediate publish, hand-written by construction (no AI path), nullable further-reading links with SET NULL semantics, author silent delete, admin reasoned delete emitting `ARTICLE_DELETED`.
- **2026-09-25 — Admin frontend Phase A done (role collapse):** `User` type developer/admin, `instructorProfile` deleted everywhere; login/register/callback redirects 2-way; `session-sync` deleted outright (roles immutable — nothing to watch); `admin/instructors` + `/instructor/*` routes deleted; admin nav + users directory de-instructored (dead promote/demote gone); profile page bio card + dead bio endpoint removed; terminal `Role` type + `guiFallback` collapsed. `tsc` clean, terminal tests 96/96. QA discussion UI + student-route rename stay in developer phase.
- **2026-09-25 — Admin frontend Phase B1+B2 done (terminal shell + commands):** role-aware registry (`role` on specs, `commandsFor`, list threaded through run/match/complete/help/man/close which is now role-aware); `TerminalWorkspace`/`useTerminalSession` accept a command list; `admin-commands.ts` (21 commands: review, roadmap, unpublish, users/user/deletions/deletion, notifications/read/read-all, articles/article, jobs/job, keys/key/quota/providers/models, overview/analytics, dashboard) each with enforced help blocks; live TAB-completion module (`admin-complete.ts`); `/admin/terminal` full-bleed inside the guarded admin layout (chrome bypassed, terminal CSS loaded). `tsc` clean, 104/104 terminal tests (new `admin-commands.test.mjs`). Remaining in B: terminal-styled admin dashboard rebuild.
- **2026-09-25 — Admin frontend Phase B3 done (terminal dashboard):** `app/admin/dashboard` rewritten terminal-styled (review-control mission band with queue alert, gauges for queue/developers/unread/XP, queue table with draft flags, roadmap tracks with new `totalEnrolledDevelopers`, developers table, top concepts, bell-feed `activity.stdout` from notifications); `TerminalHeader` takes route overrides (student defaults untouched); `/admin/terminal?view=` deep-links (review+ref, users, notify, jobs, articles, quota, overview); layout chrome bypassed for dashboard + terminal (sidebar remains only for legacy users/content-review pages). `tsc` + eslint clean, `next build` green (`/instructor/*` gone from routes). Visual screenshot pass left to manual testing (no browser tooling in this environment).
- **2026-09-25 — Admin frontend Phase C done (console wiring):** `qa verify/unverify` moderation commands (+tests, 105/105); `app/admin/content-review` rebuilt as a terminal-styled review console (queue with live/draft split view + origin labels, approve/reject with reason dialogs, submitted-roadmaps panel with per-module rollup, publish/reject/unpublish/takedown-approve-deny/schedule-delete/cancel/purge, live countdown badges). `tsc` + eslint clean, `next build` green.
- **2026-10-01 — Developer frontend D1 done (route rename):** `app/student` → `app/developer` (all paths, links, TERMINAL_ROUTE, guiFallback, dashboard maps, shell prompts `developer@source-dev`, component names); `/student/:path*` permanent redirects; `currentView` + Switch-to-Developer-View. `tsc` clean, terminal tests 105/105, `next build` green with `/developer/*` routes and no `/student/*` or `/instructor/*`. Loader `PortalType 'student'` flavor + QA command field names left for D2.
- **Developer frontend phase complete ✅:** D1 route rename, D2 QA discussion commands, D3 authoring (CLI + GUI), D4 own-BYOK-keys UI, D5 articles, D6 labels/filters, D7 notifications (shared `notifications` command with list/read/clear subcommands in both shells, header notifications menu with unread badge on all developer pages + both dashboards, `?view=notify` deep-links). Header shows `[ROLE]` pill + admin-only `[SWITCH:DEV]`/`[SWITCH:ADMIN]` view switch (dashboards and both terminals). `tsc` clean, 121/121 terminal tests, `next build` green.
- **2026-10-01 — Developer frontend D3 CLI done (authoring commands):** new `roadmap` (`new`/`edit`/`submit`/`status`), `module new`, `concept new` (difficulty picker + heredoc body, 20-char floor, create+attach in one move), context-sensitive `edit` (concept heredoc with draft-staged/live/pending reporting, module/roadmap retitle), `attach`/`detach` (same-author gate + published-tree refusal surfaced verbatim). TAB completion branches for all new verbs. Caught + fixed a real arg-parsing bug (`new` leaking into titles) via tests. New `authoring.test.mjs` (7 tests). `tsc` + eslint clean, 116/116 terminal tests, `next build` green. GUI authoring screens still open.
- **2026-10-01 — Developer frontend D3 GUI done (authoring screens):** `developer/content` (new roadmap + own list with status badges), `developer/content/[roadmapId]` (modules + lessons with status/draft flags, module create, lesson attach search, detach with confirm, submit, takedown request/withdraw, live review rollup), `developer/concepts/new` (difficulty picker, 20-char floor, optional auto-attach), `developer/concepts/[id]/edit` (title/content/difficulty, draft-vs-live save reporting, rejection display, owner/admin gate). Dashboard roadmaps panel links to authoring. `tsc` + eslint clean, `next build` green with all new routes.
- **2026-10-01 — Developer frontend D4 done (own-BYOK-keys UI):** `developer/keys` page (quota panel, provider select, key verify + live model dropdown, save with default model, metadata list with default/cap-1-50/delete + in-use error surfacing, encrypted-at-rest copy); linked from profile page. `tsc` + eslint clean, `next build` green with `/developer/keys` route.
- **2026-10-01 — Developer frontend D5 done (articles):** public `/articles` list (search, logged-out funnel with signup nudges) + `/articles/[id]` read with further-reading gate; authoring via `developer/articles` (write + own list with edit/delete) and `developer/articles/[id]/edit` (links editable/clearable, owner gate); terminal `articles` + `article read|new` commands (group `author`) with completion. `tsc` + eslint clean, 118/118 terminal tests, `next build` green.
- **2026-10-05 — §8 small batch done:** (1) log telemetry `tokens_in/out` + `latency_ms` (new migration columns; parsed from NVIDIA `usage` / Gemini `usageMetadata`, null when absent; wall-clock in `complete()`; all 9 log sites); (2a) XP source bug fixed (`ASSIGNMENT_PASSED` → `CONCEPT_COMPLETED`) + relabel SQL below for the dev DB; (2b) quota endpoint split into non-throwing `readQuota` (badge shows 0/5, no more 429) + throwing gate sharing one bucket math, tooltip copy fixed to civil midnight; (3) v1 seed integrity check on boot (sha256 vs stored rows, loud warn only); (4) registry wired into all 6 paths behind `COURSE_ENGINE_ENABLED` (default off = legacy constants), every logged call carries `promptVersion`. Drive-bys: stale timezone expectations in progress/quiz specs fixed (documented). `tsc` clean, backend 359/359 green. Migration `up` verified on real Postgres from scratch (26/26, seeds present); `down` reviewed only. Full 6-path live smoke needs provider keys — user runs via test guide.
- **2026-10-05 — §8 Phase 1 course-context checkpoint (tight schema per review):** `course_terms`, `course_concept_cards` (misconceptions/sources/examples JSONB, no side tables), `course_concept_edges` (6-type enum), `roadmaps.teacher_persona` JSONB — migration `CourseBible1787990000000` with full down. `CourseContextService` (ensure-backfill, upsert term/card, addEdge with 422 cycle guard on prerequisite/builds-on, setPersona) + `CourseContextBuilder` (bounded/budgeted/deterministic block per task: persona→target→prereqs→terms→links, drop-lowest-priority + truncate flag, never throws). Golden `*.v1.jsonl` per task + harness pinning user-prompt builders (v2 baseline). ONE path wired: `POST concept-content` accepts optional `roadmapId`/`conceptId`, appends course-context block behind `COURSE_ENGINE_ENABLED` (off/absent/throw → legacy). Backfill: dev DB was schema-dropped so wipe-and-regenerate accepted; lazy `ensureContextForRoadmap` covers any existing content. `tsc` clean, backend 382/382 green. Migration needs running on dev DB (`npm run typeorm:migration:run`); up/down verified by review only (no pg harness this round).
- **2026-10-05 — §8 rename (zero behavior):** "course bible" → "CourseContext" everywhere (`CourseContextService`, `ensureContextForRoadmap`, `[Course context — …]` header, comments, log lines, decision log). Migration file + class `CourseBible1787990000000` deliberately untouched — TypeORM tracks migrations by name, rename would break bookkeeping; historical name stays.
- **2026-10-05 — §8 per-task routing done:** code-level `TASK_ROUTES` (9 keys: 5 live paths + outline/critique/style for the compiler), fast tier = provider default (NVIDIA_MODEL_ID-aware), strong tier = `NVIDIA/GEMINI_STRONG_MODEL_ID` else default — no model-ID hardcodes. Precedence explicit > key default > task default > global; `complete()` walks a provider-pinned fallback chain on retired-model errors only (`code: MODEL_RETIRED` marker added to both 404/410 bodies) and returns the serving model, which all 9 log sites now record; MCQ loops rethrow retired instead of re-404ing. All temp/token literals replaced by `routeParams()` (flag off = legacy literals). Job starts pass their primary task key; snapshots still pin provider/key/model. `tsc` clean, backend 393/393 green (27 suites).
- **2026-10-05 — §8 compiler done:** staged pipeline (outline → draft → fact-check → critique → revise ≤2 → validate → publish) replaces single-shot generation in batch phase-2, its retry runner, and the scoped single path (unscoped single stays legacy; MCQ/QA untouched). New `ConceptCompilation` entity + `concept_compilations` table (job/title upsert, 6-entry stage trace, warnings, status) and `internal` flag on logs in one migration (`ConceptCompilations1788000000000`, full down); readQuota counts only billable rows so one slot/concept holds. All compiler LLM stages log CONCEPT_CONTENT with prompt versions; outline retries once on malformed JSON, critique/fact-check degrade to warnings, leftover blocking issues publish with `succeeded_with_warnings` — never hard-fail. Publish enriches cards/terms/BUILDS_ON edges (compounding loop). Progress scaled ×6 for compiler jobs in both finalizations. Golden `compiler_stages.v1.jsonl` pins the 5 new prompt builders. `tsc` clean, backend 406/406 green (29 suites). Run `npm run typeorm:migration:run` on dev DB; manual paths in test guide §9.
- **2026-10-05 — §8 research ingestion (RAG) done:** private research stage between outline and draft ("AI reads sources and reports to itself"). pgvector on existing Postgres, best-effort (probed via pg_available_extensions first — a failed CREATE poisons the migration transaction, so try/catch alone is insufficient; text-column fallback + JS cosine when absent — pipeline never depends on the extension). Embeddings via provider abstraction (NVIDIA, `NVIDIA_EMBEDDING_MODEL_ID`-overridable, `concept_research` fast key). Copyright posture: allowlist (public-domain/CC0/CC-BY/CC-BY-SA/OER/explicit) enforced at insert (code + DB CHECK), unknown rejected with logged reason; OpenStax explicitly excluded (CC-BY-NC-SA + LLM-ingestion prohibition in their terms) — seed is MDN Closures (CC-BY-SA) via `npm run research:seed`. Verbatim 8-gram filter on drafts (regen once, then warn); provenance (source ids) in the compilation trace; Augmented grounding as a code constant. Research/embedding work is internal (no quota). One migration (`ResearchIngestion1788010000000`, full down). `tsc` clean, backend 428/428 green (31 suites). Run the migration, then the seed, on dev DB; manual paths in test guide §10.
- **2026-10-06 — research seed ops fixes:** NIM embedding-model churn (`nv-embedqa-e5-v5` → `nv-embed-v1` → `llama-3.2-nv-embedqa-1b-v1` all 410-retired within weeks; working default is now `nvidia/nemotron-3-embed-1b`, override via `NVIDIA_EMBEDDING_MODEL_ID` — lesson: never trust a hardcoded embedding default, keep the env override). Seed script follows `ENV_FILE_PATH` like the app, self-diagnoses env presence-only, tolerates local setups (no `DATABASE_URL` required — `DB_*` fallback) and lenient-parses keys dotenv skips. Seed verified live: MDN Closures, 9 chunks, CC-BY-SA.
- **2026-10-06 — §8 media pipeline done:** `media` stage between research and draft (diagrams exist before the draft references them). Outline += `diagrams[{id, caption, kind}]` (unique ids enforced); per diagram Mermaid via `concept_diagram` fast key with strict structural compile-check (header/kind match, fence strip, delimiter balance — deterministic, CI-safe; headless-render seam documented for later) + exactly one regen with the checker message, then skip-with-warning (never fails the concept). YouTube v3 embed-by-reference (CC-filter first, ≤3, license notes; no key/API error → skip warning). Draft gets diagram inventory (`{{diagram:id}}`) + video list; validate warns both ways (dangling refs, orphan diagrams — Mayer coherence). One new table `concept_media` (migration `ConceptMedia1788020000000`, full down); media inserted at publish (single path pins to dto.conceptId when present). Internal billing, flag-gated with the compiler. AI images deliberately out. `tsc` clean, backend 443/443 green (32 suites). Run the migration on dev DB.
- **Run on dev DB:** `UPDATE "xp_events" SET "source_type" = 'concept_completed' WHERE "source_type" = 'assignment_passed';` — report back the row count.
- **2026-10-01 — Developer frontend D6 done (labels/filters):** VFS carries `originLabel` (server rollup preferred, leaf-flag fallback); `ls --label ai|handwritten|partial` filters at every level, `-l` shows `{ai|hand|partial}` tags, `cat` body stays pure with the origin line in the lesson header; TAB completes the flag and values (path completion yields to option values); GUI authoring rows show module/lesson tags. `tsc` + eslint clean, 121/121 terminal tests, `next build` green.
- **2026-10-01 — View-decides-registry fix:** developer terminal composed commands from the *user role*, so an admin in developer view got a gutted shared-only shell (no `ls`, no authoring). `/developer/terminal` now passes `commandsRole="developer"` explicitly; hook fallback is the full developer set. Rule: the view decides the registry, never the role.
- **2026-10-05 — Bug hunt:** `review show` silently opened the first prefix match (now reports ambiguity like the thread locator); removed dead `NotificationItem` interface left over from the notification-command move. Verified: `tsc` clean, eslint clean, 121/121 terminal tests, `next build` green.
- **2026-10-01 — Server/client boundary fix:** `/admin/terminal` passed composed command objects (with `run` functions) as props into the client shell → Next.js runtime error. Pages now pass only a `commandsRole` string; the registry composes client-side in `TerminalWorkspace`. Rule: functions never cross to client components.
- **2026-10-01 — Developer frontend D2 done (QA discussion commands):** `learning-commands.ts` speaks the §12 contract (asker/responder fields, verified badges, AI-private marker); ask picker offers AI-private vs public discussion with privacy copy; new `answer`/`verify`/`unverify` subcommands (backend-enforced, verify tokens only shown when eligible via concept-author check); edit lock matches backend (any answer freezes). New `qa-discussion.test.mjs` (4 tests). `tsc` clean, 109/109 terminal tests, `next build` green.
- **2026-09-21 — QA refinements from manual testing:** author/admin answers auto-verify on arrival (their own verify step would be pointless); question edit-lock applies to ANY answer (editing under an AI reply strands a stale answer); answers stay editable. Test guide `backend/write-tests-for-me.md` updated to match.
- **2026-09-21 — Working agreement:** implement strictly one feature at a time on user instruction only; test/verify each before moving on. This doc is the reference across sessions and models.

## 12. QA discussion model (revised 2026-09-21, supersedes §1 author-only draft)

- **Discussion, not gated Q&A:** anyone who can open a concept sees its discussion; any authenticated Developer (and Admin) can post a question or an answer. No approval-gate on answering.
- **Verified answers:** concept author + Admin can mark/unmark any answer verified. Verified answers carry a badge and sort first. One or many answers may be verified (no single-answer constraint unless later specified).
- **Auto-verified on arrival:** answers posted by the concept author or an Admin are `isVerified: true` from creation (they speak for the content — no second verify step needed). Everyone else's answers start unverified.
- **Edit locks:** a question becomes uneditable once it has ANY answer (human or AI — editing under an AI answer would strand a stale generated reply); answers themselves stay editable by their author/admin. Admin bypasses the question lock.
- **Ask AI is private:** "Ask AI" generates an answer visible ONLY to the developer who asked (plus Admin/author for moderation as needed — default: asker only). It never appears in the public discussion. UI copy must say this explicitly at ask time.
- **Two ask options in UI (frontend phase):** "Ask AI" (private) vs "Post in discussion" (public, other developers can answer).
- **Backend implications (§1 scope):** ✅ DONE 2026-09-21 via migration `QaDiscussionModel` + rewritten `QaService`. Removed approved-instructor gate on answering; added `isVerified` (+ `verifiedBy`/`verifiedAt`) to answers; AI-answer reads scoped to asker (+admin); added `PATCH /answers/:id/verify|unverify` (concept-author-or-admin only, AI answers not verifiable).
- **Locked API contract:** question shape uses `askerId`/`askerName`; answer shape uses `responderId`/`responderName` (+`isAiAnswer`, `isVerified`); `target` enum is `discussion`|`ai` (default `discussion`); discussion list returns verified-first ordering with AI answers filtered per viewer. Frontend phase must add the "Ask AI (private, only you see it) vs Post in discussion (public)" copy.

This doc is the reference — when we tackle each numbered piece, I'll write the actual implementation prompt(s) for it then.
