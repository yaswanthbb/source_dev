# Login — source:dev GUI

Checkpoint 2, 2026-10-08. Uses the approved orange connection-workshop identity. UI-styling
guidance informed native accessible controls; UI/UX guidance informed minimal form hierarchy,
password-manager support and focusable error summaries. Generic palette and marketing-layout
search suggestions were not adopted: the approved project tokens and auth task take precedence.

## Composition and ownership

- `GuiAuthShell` owns the brand/header, warm illustrative learning-loop panel, responsive form
  column and footer. Form comes first on phones; the loop is decorative, never account progress.
- Shared GUI tokens own light/dark colors. Auth CSS owns layout, control sizing and finite motion.
  No global recoloring of CLI or unfinished routes. Existing Inter/Space Grotesk and SVG mark reused.
- `GuiFeedback` is the reusable feedback panel: icon, title, explanation and optional dismissal.
  Errors use warm red as a semantic exception; success/info/loading use the orange identity.
- The route selects GUI or the preserved `CliLogin` only after appearance preference is ready.
  Preference loading has an explicit status instead of a blank view; switching stays on `/login`.

## Feedback and recovery

| State | Treatment |
| --- | --- |
| Invalid field | Inline explanation, `aria-invalid` and associated description; validate on blur |
| Invalid submit | Focusable alert with links that focus each invalid field; preserve input |
| Pending request | Announced loading, disabled controls, synchronous duplicate guard; Cancel sign-in |
| Connection/timeout | Persistent recovery message; retained inputs; no fabricated progress |
| Credentials/social account | Clear credential failure or actionable existing backend guidance |
| Rate limit/server error | Wait/retry guidance; server traces are not exposed |
| Blocked session storage | Distinct browser-storage instruction; attempt partial-session cleanup |
| Success | Clear password, announce signed-in status, open role-specific workspace; manual fallback link |
| OAuth return | Explain incomplete provider sign-in and unlock the form; clear password |

Native labels and autocomplete support password managers and paste. Password visibility is optional.
Primary controls and dismissal/visibility buttons have at least 44px hit areas. Focus remains visible.
Success/info/loading use `role=status`; errors use `role=alert`. Motion stops under reduced-motion;
workspace navigation skips the short success transition. Pending requests abort on unmount.

## Scope and verification

Existing Nest login and OAuth endpoints, auth persistence/events, session marker and developer/admin
routes are reused. Register, password recovery and OAuth callback visual redesigns are later checkpoints.
No packages, backend changes, migrations, staging, commits or pushes.

Typecheck, new-code lint, nine Node test files, theme guard and production build passed. Existing
CLI render-time ref lint errors/OAuth location warning and multiple-lockfile build warning are recorded,
not repaired as part of this GUI task. Browser checks include responsive light/dark, mode persistence,
validation/focus, password visibility, intentionally rejected API sign-in and production rendering.
Successful account sign-in, full external provider consent and OS reduced-motion remain manual checks.
