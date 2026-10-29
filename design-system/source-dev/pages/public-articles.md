# Public articles — checkpoint 18

Date: 2026-10-20. Route: `/articles`. User approved provider keys and continued to the next checkpoint. Article reader `/articles/[id]` remains checkpoint 19 and is unchanged.

## Presentation

The approved Connection Workshop master remains authoritative: orange, warm paper, Inter/Space Grotesk, Lucide, shared GUI tokens, accessible native controls, and scoped light/dark styles. Original finite notebook/pen vector motif, editorial two-column cards with one-column phone layout, real author/date/plain-text previews, contextual counts and a small writing-workspace invitation. No fabricated featured articles, topics, popularity, reading times or inventory. Writing links use the existing `/developer/articles` route; the previous `/developer/articles/new` link pointed to no route.

`PublicReadingShell` provides public home/articles/workspace/login links, theme and appearance controls, a phone disclosure with Escape/focus return, a skip link and footer. Guest reading has no account gate. Appearance changes use the existing provider with navigation disabled and never change learner location. The classic composition/palette is retained, with shared validated data, explicit error/loading/search-empty feedback, pagination and a return-to-GUI button.

Both public surfaces render HTML. Scoped selectors use the existing before-paint `html[data-ui-mode]` flag to expose one appearance to sighted and assistive-technology users; content does not wait for the appearance provider to become ready. No global palette override or homepage redesign.

## Public reads and metadata

- The server page awaits plain query parameters and calls only the existing anonymous `GET /articles?search=...`. It forwards no account headers, cookies or tokens. `credentials: omit`, a 12-second abort signal, fixed safe errors, and `cache: no-store` replace the previous 60-second cache so a retry makes a fresh read.
- Backend title matching and newest-first order are preserved. The backend still returns the full matching array. Pagination is a server-side presentation slice of that response, 12 summaries per page; this is not a new paginated API.
- Single title search, at most 200 characters, and a positive safe whole page number. Repeated/invalid parameters never reach the API. Search is encoded as data, including existing wildcard semantics. New search resets pagination. Out-of-range positive pages clamp to the actual last page; counts come from the returned rows.
- Strict metadata parsing rejects duplicate/unsafe IDs, blank/oversized titles, malformed dates, or invalid author/text contracts. Client props contain only ID, title, author display name, creation timestamp and short preview for the selected page. Full article bodies, account objects/email/credentials, slugs and curriculum-link metadata are not serialized into listing props.
- Plain-text previews inspect at most the first 64,000 source characters and display at most 220 Unicode characters plus an ellipsis. Common Markdown/HTML/code/media formatting is removed; text is React-escaped, never rendered as HTML or fetched as remote media. This is a best-effort preview, not the reader/Markdown implementation. Missing/deleted author names have an honest fallback; creation dates display in UTC.
- HTTP/network/JSON/contract failures are distinct from empty or no-match results. Retry preserves the query. Route loading has contextual feedback and static placeholders without invented progress or artificial delay. No mount-time generation, provider lookup, account or content mutation.

## Navigation and focus

Native GET search forms and native pagination anchors preserve shareable query URLs. Their result-heading fragments work with a guarded hydration focus step: only explicit known result anchors, after appearance readiness and non-loading content, schedule one animation-frame focus/instant scroll to the visible GUI or classic heading. Cleanup cancels stale frames. Ordinary entry, loading and unrelated anchors do not move focus. This avoids browser/framework scroll resets and the appearance-provider CSS timing race.

Cards link to the existing reader by validated ID with prefetch disabled; no reader implementation changed. Search clear, empty-state recovery, login/register, and authoring destinations are existing routes. Native controls, visible focus, wrapping metadata and titles, accurate count status, disabled first/last pager states, and reduced-motion CSS are implemented.

## Verification

- 392 tests across the established 17 frontend files, including 17 new article checks: parameter/navigation safety, summary projection, malformed contracts, escaped previews/media, exact order/count/page clamping, anonymous timed fresh GET, failure versus empty, invalid-query no-read, server/client plain props, native search/cards/links, distinct UI states, safe escaping, appearance continuity, both pagers, menu Escape and guarded result-anchor focus.
- Frontend typecheck, touched lint, theme guard, diff check and fixture-free production webpack build. The pre-existing unused test variable warning and multiple-lockfile build warning remain. A sandbox process-stream restriction required permitted outside-sandbox verification; no configuration workaround or dependency change.
- Labelled actual-component sample used local data only: 1280px desktop, 375px phone, 768px tablet, 812px landscape; light/dark; title search, page reset, actual range counts, first/last paging, focus after GUI/classic native navigation, reload appearance persistence, menu Escape/focus, long/unbroken names/titles, deleted authors, empty/no-match/loading/unavailable states and writing/reader link targets. No overflow or app console warnings/errors observed. No real article API/account/provider/progress/publication/billing action ran in browser QA.
- Full-page local sample review image saved as `source-dev-public-articles.jpg` in this chat’s visualization artifacts. Temporary sample/server/tabs removed; viewport reset. Checkpoint 17 changes remain intact and local.

## Manual checks and limits

Real service availability/title matching/deletion freshness, signed-in preference synchronization, live reader/authoring transitions, large-library response size, screen-reader behavior and OS reduced motion remain manual. No backend pagination, Markdown reader, article publishing/editing/moderation, schema or dependency work. No migration, staging, commit or push. Stop for visual review before checkpoint 19.
