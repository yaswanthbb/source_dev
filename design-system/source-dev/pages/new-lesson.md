# New lesson — checkpoint 14

Route: `/developer/concepts/new`, optionally with `moduleId` and `roadmapId`.
Approved orange master, Inter/Lucide, warm paper/charcoal, shared workspace shell
and persistent GUI feedback. Native controls and shared safe Markdown preview; no
new library, backend or schema. UI styling/UI/UX guidance informs writing hierarchy,
field labels, linked error summaries, responsive spacing and focus. Existing master
palette takes precedence over suggested palettes or marketing-style layouts.

## Layout and authoring

The original finite paper/connection SVG introduces a writing desk, not generated
content or progress. Main composer has title, native difficulty radios and Markdown
body; sidebar names a confirmed target module or explains unattached own lessons.
Preview is explicit and reuses `LessonMarkdown`, with headings/code/tables, skipped
HTML, inert unsafe links and separate consent to load external images. It does not
save, generate content, grade writing or call a model. Existing guarded diagram
rendering is reused without changing its protected configuration.

Desktop uses composer/sidebar; smaller screens stack. Phone writing/preview buttons
and save row wrap without shrinking fields. Controls at least 44px, semantic labels,
focus rings, character count (not a progress score), native resize/scroll, light/dark.
Finite entrance/drawing stops in reduced motion. No scroll hijacking or autosave.

Title uses the existing 200-character client limit. Body preserves exact Markdown
whitespace and keeps the existing minimum of 20 trimmed characters; no new maximum
or backend policy is invented. International titles are valid. ID-based links and
metadata do not require a nonempty legacy backend slug.

## Entry and target verification

- My content links to standalone creation. Module new-lesson links carry both exact
  IDs. Query values are plain Server-to-Client data. Duplicate, blank, unsafe or
  incomplete query values fail closed; no silent fallback to standalone creation.
- A module-only legacy URL resolves exactly one owned parent through existing list
  metadata, then reads the guarded editor context. The selected module must belong
  to that owned, available roadmap. Admins create/attach only inside their own content.
- Existing GET review normalizes elapsed unpublish dates before detail, as in the
  roadmap editor; there is no new timer, scheduler or explicit entry write.
- Source account/target failures hide private cache and form when ownership or
  contract is uncertain. Ordinary refresh failures retain writing and pause creation.
  Appearance changes stay on this route and never write learner location/progress.
  Switching views/leaving can discard unsaved writing; the UI says so.

## Creation, partial saves and recovery

Fresh account ID/role and current target tree/fingerprint precede one POST `/concepts`.
The acknowledgement must match owner, trimmed title, exact submitted body, difficulty,
new pending status, no staged draft, manual provenance and a valid ID/date. Returned
lesson/draft bodies are discarded after this comparison; saved/candidate state is
metadata only. The typed body stays locally in the form.

When a target is linked, one guarded attach follows via the existing editor helper:
fresh account/tree/lesson checks, one POST and saved-state verification. Creation and
attachment are independent, without atomicity or exactly-once claims. A failed attach
keeps the known saved lesson ID, blocks new creation and offers its lesson editor link.
Explicit fresh saved-lesson/module review can enable attachment-only retry, which
never resends create. Already attached state is reconciled by reads instead of retrying
the existing attach endpoint, which can reorder an existing placement.

If the target disappears, fresh identity and saved-lesson ownership can still confirm
the lesson. Old target metadata is hidden and attach remains unavailable, while the
owned saved lesson stays accessible. Account changes hide all private state.

Unknown create outcomes (transport/408/5xx/malformed ACK) lock creation. A successful
explicit check searches owned metadata for the original submitted title/difficulty,
even if the current local draft differs. Matches are only possible previous saves;
zero matches do not prove a request never saved. Failed checks keep the lock. The
warning explains that an earlier request may still finish and repeating can duplicate
lessons. No automatic retries, optimistic save, deletion-as-rollback or provider calls.

Confirmed saves remain on this page, with readable submitted text and a lesson editor
link. Edits elsewhere are not loaded into that local text. A deliberate Start another
lesson rechecks access and resets the fields. Linked validation focuses after commit;
saved status focuses on confirmation, and a failed recovery check has focus priority
when saved feedback is also present. Module editing/lesson editing is not added here.

## Verification

- Frontend typecheck, touched lint, theme separation, classic byte comparison, diff
  check, 317 tests across 17 files (130 learning/authoring cases, 18 new lesson cases)
  and final production webpack build without the sample route.
- Existing unused test variable and multiple-lockfile warnings remain unchanged.
  Backend unit tests/live database checks were not rerun because backend is unchanged.
- Labelled actual-component sample used only local data/state. Desktop, 375px phone,
  768px tablet, 812px landscape; light/dark; linked validation/title/body focus,
  difficulty, writing/preview retention, safe HTML/link/image behavior, local save,
  partial attach/recovery, lost target, error focus priority, submitted-text retention,
  explicit reset, loading/error/stale/pending/uncertain states and menu Escape/focus.
  No overflow or console errors observed. Latest international-slug compatibility is
  helper tested and does not change the browser presentation.
- Sample route/server/tab removed, viewport reset; user services and prior local
  changes preserved. Review image is a local sample, not a signed-in account result.

## Manual signed-in checks

1. Standalone creation as Developer/Admin: inspect exact title/body/difficulty and
   pending manual provenance, no attachment/provider/progress writes or forced redirect.
2. Owned module link and legacy module-only link; duplicate/wrong-parent/foreign IDs,
   removed target, role/session change and expired effective dates. Invalid targets
   must not silently create standalone lessons.
3. Linked create then attach: verify two distinct requests, saved lesson retained on
   attach failure, correct current placement after fresh check and attachment-only
   retry. Delete/change the target between create and attach to exercise partial save.
4. Timeout/408/5xx/incomplete ACK: check original-title candidate search, failed-check
   lock and warning about unfinished requests. Frontend guards are UX, not transaction
   isolation or a substitute for backend authorization.
5. Successful save/readable local text, deliberate fresh-access reset, GUI/classic
   route/query continuity, cross-tab edits and learner location preservation.
6. OS-level reduced motion and signed-in keyboard focus. Browser tooling did not
   expose OS media preference emulation; reduced-motion CSS is implemented/inspected.

No migration is needed. Checkpoint 15 adds GUI editing as a separate checkpoint;
saved/candidate lesson links now open that editor. See `edit-lesson.md`.
