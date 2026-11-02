# Edit lesson — checkpoint 15

Route: `/developer/concepts/[id]/edit`. Uses the approved Connection Workshop
orange master, Inter/Lucide, warm paper and charcoal, shared GUI shell/feedback and
the existing author/admin APIs. UI styling/UI/UX guidance informed native forms,
confirmation/focus, safe comparison, responsive hierarchy and reduced motion.

## Writing and comparison

The original two-page connection SVG introduces refinement. A checked lesson
identity shows actual review/origin/pending-draft state. The main desk separates
lesson details from body text; a sidebar explains saves and lists returned module/
roadmap placement names. Placements do not establish publication or editing rights
to those roadmaps. No placement links bypass owned-roadmap authoring guards.

Opening uses `draftContent ?? content`, so even an empty staged draft is shown.
Checking updates the reference and metadata without overwriting local fields.
Explicit **Use checked version** confirms discarding unsaved text, then resets title,
difficulty and the draft-first body. Ordinary failures retain the form; access or
contract failures hide it. Leaving/changing appearance can lose unsaved writing,
and there is no autosave. Existing 200-character title client limit is preserved;
update bodies require nonblank text without imposing creation’s 20-character rule.
Raw Markdown whitespace is sent unchanged; international titles are accepted.

Write/Preview renders local text explicitly. Separate native disclosures compare
the checked saved body and pending draft. All three use `LessonMarkdown` with unique
prefixes, skipped HTML, inert unsafe links, consent-gated external images, shared code
copy/tables and protected lazy Mermaid. No alternate renderer, execution or paid call.
Text matching either checked body or draft needs no repeat body save; this still
works after a details save while an older draft remains separate.

Desktop desk/sidebar stacks at the established smaller-screen breakpoint. Native
labels, difficulty radios, focused linked validation, 44px controls, wrapping save
rows and preview affordances, keyboard outline and light/dark shared tokens.
Entrances/line drawing/transitions stop for reduced motion. Short landscape dialogs
scroll within the viewport; no scroll hijacking.

## Existing save semantics

The backend `updateConcept` stages significant changes to approved concepts with
published placements and returns before applying difficulty. This frontend therefore
uses **independent user-chosen saves**, never a combined or automatically chained PATCH:

- Details sends only trimmed title and difficulty. The server applies these immediately,
  including on in-use lessons, while body/draft/review/origin remain unchanged.
- Body sends only exact content. A native modal describes the existing 40-character
  bounded edit-distance threshold relative to saved body. Significant live edits
  replace the staged draft; other significant edits update content, reset pending
  and clear rejection. Small edits update content and keep existing review/draft.
  The server determines publication-dependent staging; the UI does not infer it
  from placement names. It never claims all approved lessons are public/live.

Body confirmations default focus to **Keep writing**, trap focus natively and return
on Escape. Checked-reference changes dismiss old confirmations. Saved feedback focuses
after the modal closes, including an immediately resolved save. A successful manual
check focuses its new feedback ahead of prior saved status; failed checks retain the
error and lock. No success is inferred from a click or merely a 2xx response.

## Guarded reads, writes and recovery

Entry is abortable/timed GET account then GET lesson. Parser requires safe matching
ID, owner or admin, valid core fields/dates/review/difficulty/origin and complete unique
placement metadata. Body/draft are needed only for this permission-checked editor;
unrelated entity/media/account fields are excluded. Admins may edit foreign and
unlinked-author lessons as allowed by the existing endpoint, with explicit UI notice.

Save validates the selected section, freshly checks unchanged account ID/role and
lesson/updatedAt/placements fingerprint, sends one 12-second PATCH, validates exact
branch acknowledgement, then rechecks account and lesson. Readback core fields must
match the acknowledgement. Saved metadata/body updates the editor cache and relevant
content/roadmap/concept caches are invalidated. Other local fields remain untouched.

Same-tick busy guard and disabled stale/pending/error states prevent accidental
repetition. Automatic write retries, optimistic changes, regeneration, approval,
publish and progress/location writes are absent. Transport/408/5xx/malformed ACK or
failed/mismatched readback are uncertain; explicit successful checking is required
before another save. Failed checks never unlock. Identity/permission/contract failures
hide cached private text. A read cannot prove request identity/cancel outstanding
writes: the recovery warning explicitly says an earlier request may still finish.
Preflight cannot close the server’s check/write race; there is no versioned atomic
PATCH or exactly-once claim. Backend behavior is unchanged.

## Route and connected pages

Server route awaits params and passes only the ID. GUI/classic switches stay on the
edit route; no learner location is overwritten. Classic implementation is preserved
exactly except export and plain ID input. My content stays active for lesson-edit
routes. New lesson saved/candidate links, module lesson links and library/editor
copy now identify GUI editing accurately. Each authoring checkpoint remains separate.

## Verification and manual checks

- 332 tests across 17 established frontend files, including 145 learning/authoring
  cases and 15 edit-specific regressions: strict ownership/metadata, empty draft,
  update validation, abort/timeout/read-only entry, all preflight conflicts, separated
  payloads, staged/direct/pending results, strict ACK, uncertainty/readback failure,
  retained fields/explicit replacement, matching live text, hidden private cache,
  duplicate/stale/mode guards and failed/successful recovery.
- Typecheck, touched lint, theme guard, classic byte comparison, diff check and final
  production webpack build without sample route. Existing test variable warning and
  multiple-lockfile notice remain. A sandbox-only Next TypeScript subprocess failure
  cleared outside the sandbox without config or dependency changes.
- Actual-component production sample uses labelled local data/state only. Desktop,
  375px phone, 768px tablet, 812px landscape; light/dark; native fields/validation,
  body-preview safety, independent local saves, draft comparison, retained fields on
  check, confirmed reset, immediate-result/modal focus, checked feedback priority,
  pending/refusal/uncertain/check-failure/admin/no-placement and mobile menu Escape.
  No horizontal overflow or app console errors. Sample removed, server/tabs closed,
  viewport reset. Review image is a local sample, not authenticated API evidence.

Still verify in a signed-in session:

1. Own Developer/Admin lesson, foreign and unlinked-author Admin lesson, non-owner,
   deleted lesson, malformed responses and session/role changes. Hidden text must not
   reappear until fresh editing access succeeds.
2. Large published rewrite stages draft and keeps content, small edit updates content
   while keeping older draft, large unpublished/rejected edit resets pending/rejection.
   Details alone persist even when body has unsaved changes; body alone keeps details.
3. Draft-first/empty draft, exact Markdown whitespace, native validation, comparison,
   deliberate replacement and retained local fields during rechecks/network errors.
4. Cross-tab edits/review/placements/timestamp changes, timeout/408/5xx/bad ACK and
   post-save read failures. No repeated automatic PATCH; failed checks keep pause and
   successful check warns about earlier outstanding requests.
5. GUI/classic route and ID continuity, new-lesson/module links, unchanged learner
   location, signed-in keyboard focus and OS reduced-motion preference. Browser tools
   did not expose OS media-preference emulation; reduced-motion CSS is implemented.

No migration, backend, package or provider work. Stop for visual review before
checkpoint 16, AI generation/jobs.
