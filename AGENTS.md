# User preferences

- Always use the Graphify CLI first when reading, searching, or exploring the codebase, and when answering questions about the codebase. Use its results to guide targeted file reads; use text search only to fill gaps Graphify cannot answer.

# Session-learned rules (hard-won, do not re-learn the hard way)

## Next.js server/client boundary
- Never pass objects containing functions as props from a Server Component to a Client Component (e.g. composed command registries with `run` handlers). Pass plain data (like a role string) and compose client-side. This fails at runtime, not at `tsc` time.
- Stale `.next` type cache causes phantom `tsc` errors referencing deleted routes. Fix: `rm -rf .next`, re-run `tsc`. Always suspect the cache before the code when errors cite non-existent files.

## Terminal registry
- The shell view decides the command registry, never the user role. An admin in the developer shell must get the full developer set.
- Retired command names (`read`, `open`, `find`, `grep`, `apply-instructor`, …) must never be reused for new meanings. A test pins the graveyard list — check `commands.test.mjs` before naming a command.
- `help`/`man`/completion resolve against the active shell's list, passed explicitly. Default-list fallbacks leak the wrong shell's commands.

## Backend conventions (NestJS + TypeORM, no cron/scheduler)
- There is no cron. Time-based transitions (unpublish countdowns, scheduled deletions) use effective-date columns evaluated lazily: visibility predicates treat expired rows as flipped, and write paths normalize them. Purge via explicit maintenance endpoints.
- Never amend a migration that already ran on dev DBs. Each schema change gets its own new migration file.
- Partial unique indexes (e.g. one default key per user) go in the migration SQL. The `@Unique` decorator cannot express `WHERE` and will wrongly constrain all rows.
- Soft guards (warnings) belong at submit/creation time on the author side; publish/approve endpoints check review state only. Keep `canPublish`-style read flags mirroring the exact publish requirements or the UI button will disagree with the endpoint.
- Notification emission must never throw: wrap in try/catch or safe helpers so bells can't break the operation that triggered them.
- Visibility is a single shared predicate (approved + published placement, author/admin bypass) enforced on reads AND writes (list/ask/answer). Any new endpoint touching concept content must pass it.
- Secrets: AES-256-GCM envelope, decrypt only server-side at call time, metadata-only API responses. Production refuses to boot without the master secret.

## Verification bar
- Backend: `npx tsc --noEmit` + `npx jest` (unit specs colocated `*.spec.ts`). Pre-existing failures live in progress/quiz specs — verify against clean HEAD via `git stash` before attributing.
- Frontend: `npx tsc --noEmit` + `node --test lib/terminal/*.test.mjs` + `npx eslint` on touched files + `npm run build` for route-level issues. Contract tests auto-cover new commands in the registry; update pinned lists (learn-group membership, graveyard names) deliberately, never silently.
- The manual API test guide lives at `backend/write-tests-for-me.md`. The plan of record is `source-dev-master-plan.md` (§11 decision log is cross-session memory — append, don't rewrite).

