# Provider keys — checkpoint 17

Date: 2026-10-19. Route: `/developer/keys`. User approved checkpoint 16 and requested the next page. Follow the orange Connection Workshop master; reuse GUI shell, feedback, scoped authoring controls, and reduced-motion styles. Provider names are text, not invented brand marks. Original finite vector key/check illustration.

## Scope and contracts

- Server route renders a client appearance selector. GUI uses current account metadata; classic is the previous page unchanged except its named export. The wrapper provides a same-page return-to-GUI control without changing learner location. Generation links now open this GUI.
- Existing endpoints only: GET `/users/me`, `/ai-keys`, `/ai-providers`, `/ai-generate/quota`; explicit POST `ai-providers/:provider/models/lookup`; explicit GET `ai-providers/:provider/models?keyId=...`; one POST `/ai-keys`, PATCH `/ai-keys/:id`, or DELETE `/ai-keys/:id` per save/removal.
- At most two keys, first auto-default, new key cap 20/day, integer cap 1–50; label up to 120 characters; optional default model. Explicit default selection and clearing are supported. Clearing/removing a default does not promote another stored key: new requests use shared NVIDIA when configured. Caps do not reset usage, reserve capacity, limit provider spending, or promise a price. Admin bypass is not described as free.
- Metadata parsing is shared with generation settings. Malformed/duplicate/foreign-provider metadata fails closed; only metadata projections enter query state. Quota loads independently: a missing shared provider configuration does not block managing keys. No mount-time provider/model lookup, generation, or account write.

## Secret handling and writes

- New key input is masked, autocomplete off, and kept only in the mounted form while editing. It is never put in query keys/data, mutation caches, URLs, browser storage, notices, or logs. No reveal/copy control. Clear discards it; every save attempt clears it; unmount/private-access failure discards the form. Labels and cap edits are retained on ordinary errors.
- Native initially unchecked consent names the provider contact, verification/model metadata, optional encrypted account storage, first-key default behavior, and possible future generation charges. Key/provider/model changes, save attempts, rechecks, or changed stored metadata reset permission. The saved-settings fingerprint gates consent synchronously before effects run. Provider/model lookup is explicit, does not save, and never starts generation. Selecting a model requires renewed consent.
- Pre-save lookup must return a live verified catalog bound to the current provider and saved settings; secret edits discard that catalog. Stored-key catalogs are tied to the exact current key/settings; live versus curated fallback is shown. Model saving verifies again server-side; provider default clears an override. No invented catalog or prices.
- Direct promise handlers keep plaintext out of React Query mutation state. API errors are mapped to fixed safe messages; Axios config/response/request objects and provider error bodies are not retained. Model and mutation paths recheck current account/role, complete owned metadata, target key, and the saved fingerprint before dispatch.
- One write, no automatic retries or optimistic updates. Strict acknowledgement projection plus a fresh matching saved list determines success, including unchanged keys and default side effects. Full secret is never returned. Definite refusals remain errors. Transport/408/5xx or invalid acknowledgement/readback outcomes pause writes as uncertain. Explicit successful metadata recheck is required; failed checks stay locked. Recheck warns that an earlier request may still finish.
- Native removal confirmation names the key and exact default/fallback impact, warns that re-adding needs the original secret, and explains active-job blocking and that the provider credential is not revoked. Cancel receives initial focus; Escape returns focus. The frozen fingerprint disables stale confirmation synchronously.

## Validation and verification

- 375 tests across the established 17 frontend files, including 21 new provider-key cases. Metadata projection, caps/labels/models, timed read-only entry, independent quota failure, private-account/contract hiding, explicit key-bound lookup/live requirement, error sanitization, first/second create, all edit/default actions, preflight drift, uncertain responses, exact saved readback, selected removal/in-use refusal, native form, same-tick deduplication, synchronous consent/deletion binding, successful/failed recovery, and classic mode continuity.
- Frontend typecheck, touched-file lint, theme-separation guard, diff check, classic comparison, and fixture-free production webpack build. Existing unused test variable and multiple-lockfile warnings remain.
- Labelled actual-component local-state sample: desktop, 375px phone, 768px tablet, 812px landscape; light/dark; linked validation, masked sample entry, renewed consent, local model/default/cap/save/removal state, two-key cap, native modal cancellation/focus, independent quota/empty/admin/loading/uncertain/pending states, recovery and navigation Escape. No real credential, provider/model request, account change, generation, billing or database operation ran.
- Sample route/server/tabs removed and viewport reset after QA. No backend, schema, dependency, migration, staging, commit or push work.

## Manual checks and limits

Signed-in authorization/persistence, real provider verification/model availability/billing, active-worker deletion blocking, timezone/day boundaries, multi-tab/default/account/key races, reload/GUI–CLI persistence, and OS reduced motion remain manual. Existing encryption is server-side AES-256-GCM; this change does not rotate or validate its configuration. Backend writes lack atomic version checks; frontend preflight/readback cannot guarantee isolation, exactly-once delivery, secret memory erasure, or cancellation of an in-flight request. Removing a key does not revoke the credential with its provider.

Stop for visual review. Checkpoint 18 (public articles) has not started.
