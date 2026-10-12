import type { QueryRunner } from 'typeorm';
import { QaQuestionPrivacy1788130000000 } from '../../migrations/1788130000000-QaQuestionPrivacy';

describe('QA privacy migration SQL contract (not a live PostgreSQL test)', () => {
  const migration = new QaQuestionPrivacy1788130000000();

  it('adds constrained persisted intent and backfills AI-backed threads without deleting content', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await migration.up({ query } as unknown as QueryRunner);
    expect(query).toHaveBeenCalledTimes(2);
    const [schema, backfill] = query.mock.calls.map(([sql]) => sql as string);
    expect(schema).toMatch(
      /"target" varchar\(16\) NOT NULL DEFAULT 'discussion'/,
    );
    expect(schema).toContain(`CHECK ("target" IN ('discussion', 'ai'))`);
    expect(backfill).toContain(`SET "target" = 'ai'`);
    expect(backfill).toContain(
      'a."question_id" = q."id" AND a."is_ai_answer" = true',
    );
    expect(schema + backfill).not.toMatch(/DELETE FROM|DROP TABLE/);
  });

  it('locks, checks and drops atomically; a private thread blocks rollback', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await migration.down({ query } as unknown as QueryRunner);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql] = query.mock.calls[0] as [string];
    expect(sql).toContain('LOCK TABLE "questions" IN ACCESS EXCLUSIVE MODE');
    expect(sql.indexOf('LOCK TABLE')).toBeLessThan(sql.indexOf('IF EXISTS'));
    expect(sql).toContain(`WHERE "target" = 'ai'`);
    expect(sql.indexOf('RAISE EXCEPTION')).toBeLessThan(
      sql.indexOf('DROP COLUMN'),
    );
    expect(sql).toMatch(/^DO \$\$ BEGIN[\s\S]+END; \$\$$/);
    expect(sql).not.toMatch(/DELETE FROM/);
  });

  it('does not swallow a failed migration or a privacy-blocked rollback', async () => {
    const query = jest.fn().mockRejectedValue(new Error('privacy guard'));
    await expect(
      migration.down({ query } as unknown as QueryRunner),
    ).rejects.toThrow('privacy guard');
    await expect(
      migration.up({ query } as unknown as QueryRunner),
    ).rejects.toThrow('privacy guard');
  });
});
