# Ask AI question privacy — 2026-10-11

## Contract

Questions persist `target: discussion | ai` (default `discussion`). Discussion remains
public to viewers of the visible concept. An AI thread's **question and all replies**
are visible only to its asker and admins, not to the concept author merely by virtue
of authorship. List responses include `target`. Known private question/answer IDs
return 404 to everyone else on edit/delete/reply/verify/unverify routes. Ownership,
answered-question edit locks and public verified-answer ordering still apply.

Privacy is saved before provider credential checks, quota checks or generation. A
failed request can therefore leave an unanswered **private** question. There is no
automatic retry, provider call on a read, or automatic conversion to discussion.
Private AI threads do not accept new human discussion replies, even from admins;
legacy human replies remain readable by the asker/admin and are not deleted.

The CLI labels private threads, explains the admin exception and removes public
reply actions. The GUI discussion checkpoint remains to be implemented separately.

## User-operated rollout

1. Stop the old backend first. Do not serve the old code during/after migration:
   old versions ignore persisted privacy and can expose private question bodies.
2. From `backend`, with your usual DB environment, run:

   ```sh
   npm run typeorm:migration:run
   ```

3. Start/restart the new backend. For a compiled deployment, rebuild it before
   restarting. The existing TypeORM configuration discovers the new versioned
   migration `QaQuestionPrivacy1788130000000`; no old migration was amended.
4. Run manual guide section 2.4 and 2.4a with asker, another developer/concept author
   and admin. Check an unanswered failed AI request as well as a successful one.

Do not use schema synchronization or stamp/skip the migration. The new code needs
the column; do not run it against an unmigrated database.

## Historical limit and conservative audit

The migration marks every question with an existing AI answer private, preserving
question/answer text and other metadata. **Old failed AI requests with no saved AI
answer cannot be distinguished from public questions**, because the old code never
stored their target. The migration does not guess or hide all public discussion.
Already disclosed content cannot be retroactively undisclosed.

An operator can inspect candidate metadata (not a definitive list of AI requests):

```sql
SELECT q.id, q.concept_id, q.asker_id, q.created_at
FROM questions q
WHERE q.target = 'discussion'
  AND NOT EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id)
ORDER BY q.created_at;
```

Confirm intent with the asker or trusted evidence before marking a candidate
`target = 'ai'`. This audit and any resulting DB writes are user-operated; they have
not been performed here. New failed requests are protected without an audit.

## Rollback and verification limits

The down migration atomically locks the questions table and refuses to drop the
privacy column if any private thread exists. It never deletes content to make
rollback possible. Do not run old application code while private threads remain;
retain the privacy-aware backend rather than bypassing this guard.

Automated coverage includes persisted-before-generation failures, whole-thread
filtering, known-ID guards, author/admin separation, public ownership/ordering,
effective roadmap visibility and migration SQL contracts. SQL contract mocks are
not a live PostgreSQL migration test. The live migration and signed-in API smoke
checks must be run by the user. No real provider call or live DB write was made.

Verified: backend typecheck, 56 Jest suites / 692 tests and touched-file lint;
frontend typecheck, 255 tests across 17 files, touched-file lint, theme separation
guard and production webpack build. Existing multiple-lockfile warning remains.
