import { QueryRunner } from 'typeorm';
import { EvalJudgeSeed1788100000000 } from '../../migrations/1788100000000-EvalJudgeSeed';
import { EvalAuditStorage1788110000000 } from '../../migrations/1788110000000-EvalAuditStorage';
import { EVAL_JUDGE_SYSTEM_PROMPT } from './eval-rubric';
describe('eval additive migration contracts', () => {
  test('v1 seed is byte-exact and its schema pins every dimension', async () => {
    const query = jest.fn();
    await new EvalJudgeSeed1788100000000().up({
      query,
    } as unknown as QueryRunner);
    const params = query.mock.calls[0][1];
    expect(params[0]).toBe(EVAL_JUDGE_SYSTEM_PROMPT);
    expect(
      JSON.parse(params[2]).properties.judgements.items.properties.dimensions
        .required,
    ).toEqual(['accuracy', 'clarity', 'pedagogy', 'difficultyCalibration']);
  });
  test('audit storage uses SQL partial uniqueness and full down touches only eval tables', async () => {
    const query = jest.fn(),
      runner = { query } as unknown as QueryRunner;
    const migration = new EvalAuditStorage1788110000000();
    await migration.up(runner);
    expect(query.mock.calls.map(([sql]) => sql).join('\n')).toContain(
      "WHERE status='approved'",
    );
    query.mockClear();
    await migration.down(runner);
    expect(query).toHaveBeenCalledTimes(4);
    expect(
      query.mock.calls.every(([sql]) => /^DROP TABLE eval_/.test(sql)),
    ).toBe(true);
  });
});
