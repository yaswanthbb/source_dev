# Account recovery and provider callback — source:dev GUI

Checkpoint 4, 2026-10-09. Uses the approved orange master palette, recall-knot identity,
auth shell and shared feedback. UI-styling accessibility guidance informed native fields,
linked/focused error summaries and field/phase focus recovery. UI/UX guidance informed minimal
hierarchy, password-manager/paste support and honest request feedback. Generic alternate
marketing layouts and palettes were not adopted; the existing project design stays authoritative.

## Recovery

The actual backend is a three-step email-code flow, not an emailed reset link. Both recovery
URLs begin with an email field. The GUI shows Email → Code → Password, then a distinct success
message with a sign-in link. The left panel illustrates these same steps. Mobile puts the form
first and hides the decoration. Appearance switching stays on the route; original CLI recovery
is preserved apart from the component export and GUI-return button.

- All email responses use the same generic confirmation; never infer account existence.
- Codes use one numeric-friendly text field with `one-time-code` autocomplete. Paste can contain
  separators; normalization keeps the first six digits without truncating formatted clipboard input.
- Passwords preserve bytes, support new-password autocomplete/paste and share an optional reveal
  toggle. Existing eight-character minimum is stated; confirmation mismatch is inline and linked.
- Submit validation focuses the alert summary; links focus fields, dismissal returns to the current
  field, phase changes focus the new heading. Focus rings use the orange accent in both themes.
- Pending requests lock duplicate submissions and announce the real operation. Requests time out
  after 20 seconds; navigation aborts response handling, not a completed server operation.
- Resend uses an absolute 60-second deadline, including background elapsed time. Wrong/expired/
  consumed codes offer a new code; expired reset sessions offer restart. Unknown update outcomes
  suggest trying the new password at sign-in first. Errors never reflect server traces.
- Reset tokens and password fields stay in component memory, are cleared after completion/restart,
  and never enter URLs or browser storage. Refresh intentionally starts over. Success does not
  silently log in, claim all existing sessions were revoked or change backend security policy.

## Provider callback

Verification is shared across GUI/CLI. An isolated Axios instance reuses the configured API URL
without the workspace client's cached-token/global-401 interceptors. `/users/me` is requested
with the exact provider token before saving auth. Invalid/missing sessions stay on a recoverable
error page rather than a global redirect. New accounts alone attempt optional timezone sync.

The route captures query data once, replaces the history entry with `/auth/callback`, and removes
the optional in-flight marker. Changing query state or interface preference does not recreate the
verification request. Provider error text is not decoded twice or reflected into the UI.
Cancellation/unmount cannot save an abandoned response. Storage failure gets a distinct message
with cleanup attempted. The GUI has persistent error, real loading and verified success feedback,
then opens the role-specific workspace (short transition skipped for reduced motion). A verified
success includes a fallback link. The CLI retains its five-second terminal presentation.

## Verification and limits

A callback-only exception to the workspace client's global 401 cleanup/redirect protects this
flow from background preference requests using an expired previous session. Other routes keep
their existing guard. A regression test checks both sides of this exception.

Typecheck, touched-code lint, fourteen Node test files, theme guard and production build passed.
Unit/helper tests cover validation, contracts, generic confirmation, malformed/reset-token
responses, cooldown, cancellation, uncertain failures, explicit provider verification, timezone,
invalid profile, auth persistence/storage and role-specific success rendering. No packages/backend
changes. Existing multiple-lockfile warning remains.
The workspace API client's pre-existing internal-location assignment lint warning remains;
its callback-only guard introduces no new lint errors.

Production browser checks covered desktop/tablet/mobile/landscape, light/dark, focused validation,
unknown-email requests and resend, formatted incorrect code, recovery restart, reset alias,
appearance/reload persistence, missing/provider-error/rejected-token callback and secret-query
removal. No application console errors observed. Actual inbox delivery and successful account
password change require a user-operated test; provider consent/authenticated success and OS-level
reduced-motion also remain manual. No real credentials or account were changed.
