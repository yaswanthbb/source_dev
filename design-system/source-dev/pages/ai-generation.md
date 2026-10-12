# AI generation & jobs — checkpoint 16

Route: `/developer/generate`, optionally `roadmapId`, `moduleId`, `jobId`.
Uses the approved orange Connection Workshop master, shared workspace shell/feedback,
Inter/Lucide and existing APIs. UI styling/UI/UX guidance informed native scope,
explicit consent, linked validation, status focus, responsive cards and reduced motion.
No library, provider integration, backend or schema changes.

## Scope and connected flows

This GUI covers all three existing batch jobs: ordered roadmap modules, generated
module lessons and assessment questions for eligible module lessons. Jobs persist
their outputs directly. New lessons need review; adding modules/questions to an
already published target can affect its current structure/assessments immediately.
Question jobs use saved bodies, with pending drafts kept separate; existing question
sets are skipped by the server. The UI does not invent eligibility/count/price estimates.

My content, exact owned roadmap and module editor links, and shared navigation open
the workspace. Invalid/repeated/missing-parent/foreign/unavailable linked IDs never
start an action or silently choose another module. Only a current owned selection is
used. Admins use their own content/jobs in this developer workspace; global admin
inspection remains separate. Single-lesson AI authoring stays in the existing CLI
`concept ai` flow; no terminal commands or meanings are changed.

Server passes plain normalized IDs. Selections do not alter learner location. New
workspace has no old page to replace; CLI appearance offers the GUI workspace or
the developer terminal with its exact stored path, including for admin accounts.

## Provider and consent

Account, own library, provider/default-key metadata, quota, target and jobs have
guarded reads. No API key plaintext, input, decryption or storage is added. Metadata
projection excludes unrelated entity fields. Provider follows the actual default
key or shared NVIDIA service; it cannot be switched independently of that key.
Quota is the applicable bucket in the account timezone, not a dollar price or capacity
reservation. Admin quota bypass does not imply free provider usage.

Model lookup is an explicit GET scoped to the current default key and provider;
opening the page does not contact a provider model catalog or start generation.
Live/fallback availability is labelled. Catalog IDs are trimmed, bounded and unique;
chosen override must belong to a current settings-bound catalog. Automatic keeps
key/task/provider selection server-side. Requested model snapshots are distinguished
from every model that actually served a call; configured fallbacks may be used.

Each start opens a native dialog with action/target, provider and masked default-key
hint, requested model/default behavior, exact initial quota gate, transmitted content
scope, direct persisted output, partial completion and existing server retries. The
checkbox itself names target/provider/key and quota/possible charges so context stays
next to the action in short viewports. It starts unchecked, cancellation returns focus,
and each new confirmation requires renewed consent. Published targets disclose their
immediate structure/question impact. No provider price or elapsed-time estimate.

Consent carries an immutable target/settings/intent/allowance/active-job snapshot.
Dispatch checks it synchronously, not just in an effect; a key/target/model/allowance
change cannot reuse checked consent during the render/effect gap. Effects also close
old dialogs. Linked validation points to scope, model or provider allowance as appropriate.
Model reads and writes show pending state; selections survive ordinary errors/checks.

## Start and recovery contracts

Fresh account ID/role and owned roadmap editor reuse the existing review-before-detail
normalization of effective dates. Existing metadata tree fingerprint, capacity, current
key/settings, quota, active jobs for the target and model choice precede one start POST.
No additional cron, schema transition, approval or publication endpoint.

Initial gates match backend: one remaining slot for roadmap modules/questions; module
lessons require title-list plus remaining lesson slots. Gates are not reserved capacity
and do not quantify all provider calls. The backend may retry failed items once in a
new related job, retry malformed question output, run pipeline stages or use retired-model
fallbacks. These are existing behaviors, disclosed before consent; the frontend does
not initiate automatic start retries or unsupported failed-only retries.

Acceptance ACK must return a valid ID. A fresh own saved job must match that exact ID
(case-insensitive UUID representation), request type/target/provider/default key and
explicit model override. Any valid server-selected model is reported as the requested
snapshot, not verified actual usage. Acceptance is not completion or successful publication.

Unknown transport/408/5xx, incomplete acceptance or saved-read failure/mismatch retains
any known ID and locks further writes until explicit successful checks. Failed checks
never unlock. Recovery requires new consent and warns that an earlier request may still
finish/charge; list matches cannot establish request identity and missing rows do not
cancel outstanding work. Access/identity/contract failures hide cached private data.

Frontend preflight is not transaction isolation. Existing endpoints do not pin an
expected key ID/version, reserve quota or provide idempotency/cancellation. Another tab
can change defaults/accounts between a client check and the server request. A mismatching
saved snapshot becomes unconfirmed; it cannot undo already incurred usage. These backend
limitations are not silently changed or described as an exactly-once guarantee.

## Jobs and results

Own active jobs and unread finished results are independent of generation settings.
If shared service/quota reads fail, healthy job reads/review actions remain available.
Read-only checks run every five seconds while this workspace is visible, can be paused,
and stop on errors/background/unmount. No polling request starts, acknowledges or retries
a job. Only meaningful count changes are announced; passive polls do not focus notices.
New finished IDs refresh content/roadmap/concept/target/quota caches without write actions.

Active and finished reads may overlap during completion; the later terminal row wins.
Actual reported steps are separate from final created/failed/skipped counts, with no
forced 100% or assumption a step equals a lesson. Details expose own job/target IDs,
timestamps, requested snapshots, failure reasons and retry lineage. Retry summaries
may include original successes; the frontend does not sum them again. Missing legacy
snapshots/result counts remain explicitly unknown. No cancel or invented retry buttons.
Unread results are capped at 20 and are not advertised as a complete history.

Known-ID reads verify both requester and exact ID. Admin portal remains requester-only.
Mark reviewed checks one current own finished record, sends only its selected ID and
confirms stored `acknowledgedAt` before removing a result. Already reviewed is a read-only
no-op. A zero affected-row ACK is accepted only if fresh state confirms review. Failed
ACK/readback stays unconfirmed; no optimistic dismissal or blanket acknowledgement.
The acknowledgement endpoint’s version-4 UUID constraint is mirrored. Outputs remain
saved; reviewed does not mean approved, cancelled or deleted.

## Verification

- 354 tests across the established 17 frontend files, including 167 learning/authoring
  checks and 22 generation cases. Coverage includes params/metadata/privacy, transition
  races, timed abortable entry, explicit catalog/override, capacity/quota/active/model
  gates, all three one-POST starts, preflight drift, exact job ID, ambiguous outcomes,
  scoped acknowledgement/zero-row race, native renewed consent, synchronous changed-key
  consent guard, stale/missing settings/target, foreground polling, mode/path continuity
  and read-only failed/successful recovery.
- Typecheck, touched lint, theme guard, diff check and final production webpack build
  without the sample route. Existing unused test variable and multi-lockfile warning.
- Labelled actual-component production sample uses local state only. Desktop, 375px
  phone, 768px tablet, 812px landscape; light/dark; scope/linked validation/model fallback,
  native unchecked/renewed exact-scope consent, local accepted/reviewed snapshots, status
  focus, failure details, partial counts, known-ID reads, recovery, empty/unavailable/
  quota/admin/pending/unknown states and menu Escape. No overflow or app console errors.
  Samples/server/tabs removed and viewport reset. No real account/provider/model lookup,
  paid generation, acknowledgement or progress operation used for browser verification.

## Manual signed-in checks

1. Developer/Admin own-only library/jobs; non-owner/wrong-parent/deleted target; invalid
   links; account/session/role changes; old foreign cache hidden and no entry POST.
2. Shared-service missing configuration and healthy independent job reads; free/own-key/
   admin quota, default changes, caps and exact current-key model catalog/override.
3. Explicitly authorized paid test of each batch endpoint, with quota/provider billing
   inspected by the user. Test legacy and pipeline flags, retries/fallbacks, partial output,
   saved-body versus pending-draft question input, and published target implications.
4. Same-tab duplicate clicks and multi-tab starts/default-key/account transitions before
   and during a request. Check unknown outcomes and actual requested key/model snapshots;
   frontend guards cannot close the server race or undo charges.
5. Worker completion/original auto-ack/retry lineage, current output caches, 20-result cap,
   known-ID reads, one-ID reviewed ACK, already-reviewed/zero-row races and failed readback.
   Refresh errors must preserve data and pause writes; no fake cancellation/durable-worker claim.
6. GUI/CLI exact path continuity, learner location, keyboard focus and OS reduced motion.
   Reduced-motion CSS is implemented; browser tooling did not emulate OS preferences.

No migration, backend or dependency work. Stop for review before provider-key checkpoint 17.
