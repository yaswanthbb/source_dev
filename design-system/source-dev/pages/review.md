# Review queue and session — checkpoint 10

The orange master remains authoritative. Reuse Inter, Lucide, the workspace shell,
semantic feedback and scoped CSS modules; no packages or backend changes.
The UI skills informed native radio selection, visible keyboard focus, persistent
feedback, responsive hierarchy and finite/reduced motion. Generated page-style
searches were off-topic and were not adopted or persisted.

## Composition

`/developer/review` lives under the existing developer auth guard. The dashboard
and workspace sidebar link here. A quiet “Make it stick” header and original
finite recall-loop SVG lead into real due/session/difficult-question counts,
lesson-grouped overview and held-back/unavailable notes. Session order is the
server's original order, not the overview's grouping. Too-few-option questions
are disclosed and excluded from submissions, not deleted or rescheduled.

Starting opens a local frozen batch on the same route, with one question at a
time. Native radios, explicit Submit, actual correct-answer acknowledgement,
next civil date, interval and XP; no self-rating controls, estimated schedules
or local grading. Next advances only after a confirmed answer. Finish for now
returns to a freshly checked queue. Saved reviews stay on the server; leaving
or reloading does not save draft choices and does not mark unanswered items done.
The end-of-batch summary is explicitly not “all due histories cleared.”

## API and state contracts

- Abortable 12-second reads of `/review/due` and `/review/due-count`. They are
  separate server snapshots; do not manufacture reconciliation counts.
- Preserve absent legacy FSRS fields as unknown. A missing difficult-question
  count is not displayed as a measured zero. Never label the active scheduler
  as FSRS when the API doesn't identify it.
- Project only learner question/option fields. Author answer metadata is
  ignored. Validate item IDs, option IDs, counts, dates and acknowledgements.
- Fresh due-item/fingerprint/option and guarded concept preflight before
  exactly one explicit answer POST. No mount writes, optimistic grading/XP,
  automatic answer retries or automatic next question.
- Uncertain/malformed acknowledgement locks answering until an explicit
  successful queue refresh. Failed refresh keeps the lock. Reconcile only the
  original batch's remaining IDs against fresh answerable items; missing,
  removed or externally rescheduled items are not counted as confirmed answers
  and do not earn locally inferred XP. Held-back/new items aren't silently added.
- Confirmed rewards invalidate shared gamification/badge/review-count caches.
  The queue does not replace a frozen session automatically on window focus.
- Leech guidance resolves a guarded visible lesson placement on explicit click,
  using existing catalog/detail APIs and shared collision-safe VFS names.
  Read-only lookup has a total 12-second budget and aborts on unmount. No guessed
  URLs or API-supplied remediation hrefs are trusted.
- Reviews are a workspace view, not a filesystem move. Never overwrite saved
  content location. Explicit/direct CLI handoffs keep its path plus the existing
  literal `view=review`. They open the existing CLI queue; `review start` is
  still an explicit terminal action. General mode projection remains content-based.

## Existing backend boundaries

FSRS-enabled review reads/writes enforce shared visibility. The legacy path
does not apply that filter; GUI submission's guarded concept read is a UX
safeguard, not server authorization. The existing answer service checks due
state, awards XP and saves scheduling in separate non-transactional steps:
cross-tab/concurrent writes are not guaranteed exactly-once by these GUI guards.
Backend hardening requires its own approval; no migrations, flag/config changes,
purges, history resets or scheduler edits are part of this checkpoint.

## Verification and remaining signed-in QA

Actual component sample preview (explicitly labelled, no account/API writes):
1440px, 375px, 768px and 812px landscape; light/dark; native keyboard choices;
wrong/correct saved feedback, remediation, next/summary focus, finish, pending,
uncertain, loading/read-error/retry/empty/stale states; mobile menu Escape/focus;
no horizontal overflow or console errors. Final focus uses native scrolling so
off-screen messages/questions are brought into view, and disabled options do
not receive hover highlighting. Reduced-motion CSS is regression checked.

Typecheck, touched-file ESLint, theme guard, full frontend Node regressions and
fixture-free webpack production build are recorded in the rollout plan. The
temporary public fixture, preview server and browser tab are removed; viewport
reset. Existing lockfile warning remains. No user servers or Git publishing touched.

Signed-in API reads/visibility, actual rescheduling/XP, refreshing uncertain writes,
cross-tab behavior, exact live GUI/CLI handoffs and OS reduced-motion smoke remain
manual; sample UI verification is not live authenticated end-to-end testing.
