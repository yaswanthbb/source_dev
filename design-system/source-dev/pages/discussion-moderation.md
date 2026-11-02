# Contextual discussion moderation — checkpoint 29, completed 2026-10-30

## Scope and API audit

Graphify-first controller/service/entity and existing GUI audit. Reuse the lesson discussion route
`/developer/roadmaps/[reference]/modules/[moduleReference]/lessons/[conceptReference]/discussion`.
There is no global moderation queue or question-by-ID GET, so no duplicate admin route is invented.

| Operation | Existing service contract and GUI behavior |
| --- | --- |
| Read threads | Concept-scoped GET. Public threads follow concept access. A whole private Ask AI thread is visible only to its asker or an admin; concept authors have no privacy bypass. |
| Public reply | Any authorized developer/admin can reply. Admin/concept-author replies are verified on arrival. Private AI threads accept no human discussion replies. |
| Edit question | Asker only before any answer; admin may edit another asker's answered question. Admin copy explains that existing replies remain and AI is not regenerated. |
| Edit answer | Responder/admin may edit saved text, including admin edits of saved AI replies. Copy distinguishes text editing from another provider request. |
| Delete | Asker/admin may delete a question and its answers; responder/admin may delete an answer. Existing endpoints return void, not a fabricated success envelope. |
| Verify/unverify | Admin/concept author may verify human answers. AI answers are not verifiable. |

Question deletion cascades answers; asker deletion cascades questions. Deleted human responders may
have a nullable responder ID; the existing parser retains that contract. No restore, moderation reason,
bulk action, provider regeneration, new endpoint, schema, migration or dependency is added.

Existing backend visibility is not changed here: list/create-question/create-answer invoke shared
concept visibility, whereas the inspected edit/delete/verify methods apply their private-thread and
actor/ownership rules without explicitly invoking that shared concept predicate. The GUI rechecks
visible concept and placement before writes; this does not establish direct-endpoint visibility parity.

## Guards, saved results and recovery

- Original session is captured on mount and checked between reads, at action time and after the write.
  Auth/storage events invalidate the mounted view. Matching minimal account ID/role before and after
  content/Q&A reads rejects account drift and malformed identities. Timed/abortable reads use fixed
  safe errors. No polling, automatic retry, focus refresh or reconnect refresh is introduced.
- Cache keys include concept, actor and role. Fresh mount read is required before displaying cached
  threads. A failed first refresh cannot reveal old private data; after a successful read on this mount,
  a later transient refresh error retains drafts/view while blocking writes. A known access denial hides
  cached/private content and requires reload after invalidation.
- Fresh roadmap/placement/content/thread preflight and an expanded fingerprint cover thread/answer
  identity, ownership, public/private target, AI flag, creation dates, saved text/status and versions.
  Synchronous busy guards block overlapping refresh/actions/recovery. One explicit write only.
- Reply, question/answer edit, delete and verify/unverify require a fresh GET-only readback with matching
  saved identity/body/state or checked absence. A void DELETE is confirmed by absence, not an invented
  ACK. Saved content-author authority is checked again. Existing public/AI asks retain their validated
  acknowledgement flow; this checkpoint does not claim additional saved readback for asks.
- Every sent-write failure, including 4xx, failed ACK and failed/mismatching readback, pauses actions.
  Recovery checks are GET-only and never replay a save, deletion or paid request. Checked rows remain
  read-only until explicit “Use checked threads and resume”. Failed checks stay paused. Adoption keeps
  writing, deliberately rebases the retained editor and leaves an earlier-request warning visible.
- No atomic version-conditioned write, exactly-once outcome, cancellation, cross-tab synchronization,
  snapshot isolation or remount-persistent lock is promised. The endpoint can race a preflight; an
  earlier timed-out request may finish after a check. Another AI request may create duplicate charges.

## Design and navigation

Approved scoped orange/warm paper/charcoal discussion design is retained. Admin editing labels say
“Edit saved message”. Answered-question and saved-AI-answer notes describe the actual consequences.
Inline deletion confirmation initially focuses “Keep it”; keeping the thread returns trigger focus.
This remains an inline confirmation group, not a modal with an invented Escape/focus-trap contract.

Content review now links each actual lesson placement to its contextual discussion, explicitly labelled
“developer workspace”. Existing UUID/module/lesson resolver support was verified; no empty-placement
link is fabricated. The link wraps at phone width, has a 44px minimum target and visible focus.
An admin opening the developer discussion keeps the developer shell and full developer command set.

Admin Analytics now opens `/admin/dashboard#admin-analytics`, anchored to the existing roadmap analytics
section, with no CLI badge. All four existing analytics resources already have GUI dashboard coverage.
Explicit CLI handoffs and terminal registries remain unchanged; checkpoint 28 article work is preserved.
Evaluation and paid/serving operations remain checkpoint 30.

## Verification and limits

- 607 frontend tests across 17 files pass, including 17 added checks; final affected discussion/AI/
  navigation run: 32 passing. Mock persistence checks cover successful and surviving void deletes,
  body/owner/AI drift, malformed accounts, original-token changes, 4xx/network/readback uncertainty,
  private admin saved-AI editing, scoped cache, failed-first-refresh privacy, later transient failure,
  duplicate refresh blocking, explicit check/adoption and contextual/Analytics destinations.
- Standalone `npx tsc --noEmit --incremental false`, fixture-free `npm run build -- --webpack`, touched
  ESLint and `git diff --check` pass. No introduced lint diagnostics; one baseline unused test variable
  warning remains in the checkpoint 29 touched set. Existing multi-lockfile build warning remains.
- Labelled disposable actual-view/shell sample checked desktop, 375×812, 768×1024 and 812×375 in light
  and dark: admin answered-question/saved-AI edits, retained local draft through uncertainty/check/
  adoption, local saved feedback, private admin view without human reply/AI verification, safe Keep
  focus and trigger return, pending disabled controls, empty discussion, mobile menu/theme/Escape,
  contextual review link and Analytics destination labels. Checked geometry had no horizontal overflow.
  Browser warning/error log was empty. No real moderation/provider/AI call was made.
- Source/client contracts used mocks; UI callbacks were local. Live account/privacy/permission enforcement,
  database persistence/cascades, notifications, races/late outcomes, real contextual/hash navigation and
  preferences, screen readers and OS reduced-motion behavior remain manual acceptance checks. No real
  account/content/progress/billing/provider write, staging, commit, push, PR or publishing occurred.
- Sample route and generated dev cache removed, owned tab closed, viewport reset, light restored,
  preview server stopped and port 3211 confirmed closed. Production build contains no sample route.
- Review images: `/home/yaswanth/.codex/visualizations/2026/10/30/source-dev-discussion-audit-discussion.jpg`
  (labelled local overview) and `source-dev-discussion-audit-context.jpg` (local review entry).

Stop for visual review. Checkpoint 30 evaluation/prompt release/question quality remains unstarted.
