# Article reader — checkpoint 19

Date: 2026-10-21. Route: `/articles/[id]`. User continued from the public listing. Checkpoint 20, own article authoring, remains unstarted.

## Reading layout

The existing Connection Workshop master remains authoritative: warm paper/charcoal, orange, Inter/Space Grotesk, Lucide, scoped GUI tokens and native controls. Shared public header/footer with a reader-specific skip label and correct navigation semantics (Articles is a parent destination, not the current page). Large wrapping title, real author/UTC publication and later-update dates, a small decorative rule, bounded reading measure and a collapsible section outline. The outline becomes an inline disclosure on smaller screens; wide tables/code scroll within the reading column. Article-only rules restore Markdown bullet and decimal markers after Tailwind preflight. No fabricated summaries, reading times, category/popularity/review badges or completion controls.

Classic reader JSX matches HEAD after replacing raw author/link objects with the projected display name/link-presence fields. Its terminal palette, literal Markdown body and existing further-reading/sign-in composition remain intact. Both surfaces render public HTML; the existing before-paint appearance selector exposes one surface. Same-page appearance changes never alter learner location or navigate away. A visible return-to-GUI button remains available in classic mode.

## Reads, privacy and recovery

- Server route awaits the ID and performs one existing anonymous `GET /articles/:id`. No forwarded cookies/account headers; explicit omitted credentials, Accept JSON, no-store and a 12-second abort. Invalid IDs make no API read. Only a real 404 or invalid identifier invokes the route's custom not-found boundary. HTTP/transport/timeout/JSON/contract failures show unavailable feedback with a native fresh-read retry, rather than claiming the article was deleted.
- Strict validation covers matching ID, title/author/date contracts, required string body and safe optional link IDs. Only ID, title, author display name, timestamps, Markdown and a boolean curriculum-link presence cross to client components. No raw user object, email/credentials, author ID, slug, roadmap/concept IDs or linked draft titles are serialized as reader props.
- Distinct route loading, missing, unavailable, deleted-author and blank-body states. No account gate for public reading. Existing optional curriculum links keep their explicit sign-in invitation; no private curriculum lookup or visibility bypass. This checkpoint does not add a signed-in link resolver.

## Markdown and media

Reuses the lesson Markdown renderer and position-based section IDs with an article prefix. Headings, emphasis, links, lists, tables, code/copy feedback and locally rendered protected Mermaid diagrams work in GUI appearance. Raw HTML is skipped; unsafe URLs stay inert; external links announce a new tab and use noopener/noreferrer. External images remain explicit opt-in with host disclosure and failure/retry feedback. Diagrams are sanitized by the existing renderer and displayed as inert data-URL images. No arbitrary remote image loads on entry. An optional Article/ Lesson label changes table, diagram and fallback-image descriptions while preserving lesson defaults. No new packages or renderer safety-policy changes.

## Verification

- 402 established frontend tests across 17 files pass, including 10 new reader cases for projection/contracts, anonymous timed fresh reads, missing versus unavailable, route/serializable props, real safe Markdown and matching sample section IDs, metadata/blank states, linked-curriculum privacy, recovery and appearance continuity. Existing lesson/media and public-listing tests continue to pass.
- Standalone TypeScript, touched-file ESLint, theme-separation guard, classic JSX comparison, diff check and final fixture-free production webpack build pass. The existing unused test-variable warning and multiple-lockfile build warning remain.
- Labelled local-only actual-component sample: desktop, 375px phone, 768px tablet and 812px landscape; light/dark; native section jumps and matching targets, code-copy feedback, locally rendered diagram, opt-in image/failed local-image retry, menu Escape/focus, classic reload/return, loading/unavailable/missing/blank/deleted-author states and long unbroken titles/names/code/tables. No GUI horizontal overflow. Final list markers checked at phone and desktop widths. Final ready document had no browser warning/error logs.
- Actual `/articles/not%21valid` route checked the custom not-found boundary and noindex metadata without a backend read. Real API behavior is covered only by mocked request/response checks here, not live service smoke.
- Review capture: `source-dev-article-reader.jpg` in this chat's visualization artifacts (labelled sample, desktop viewport). Temporary sample route/server/tabs removed, viewport restored, port 3211 no longer listening. Existing local checkpoints 17–18 preserved.

## Manual limits

Live article API availability/content/deletion freshness, signed-in preference sync, real authoring/list/reader transitions, authenticated curriculum destinations, real external image delivery, screen-reader smoke and OS reduced-motion checks remain manual. No article/account/content/progress write, provider call, billing, backend/schema/dependency/migration or Git publishing operation. All changes remain local. Stop for visual review before checkpoint 20.
