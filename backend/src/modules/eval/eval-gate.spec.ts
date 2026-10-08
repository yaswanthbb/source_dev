import { compareEvalRuns } from './eval-gate';
import { RUBRIC_DIMENSIONS } from './eval-rubric';
import { EvalRun } from './entities/eval-run.entity';
function row(extra = {}): EvalRun {
  return {
    goldenId: 'g1',
    goldenSetHash: 'set',
    status: 'completed',
    generatorModel: 'gen',
    judgeModel: 'judge',
    seed: 42,
    judgePromptHash: 'hash',
    rubricVersion: '1.0.0',
    deterministicResult: {
      passed: true,
      checks: [{ code: 'LEAK', passed: true, detail: '' }],
    },
    goldenDiff: { passed: true, differences: [] },
    judgeResult: {
      rubricVersion: '1.0.0',
      dimensions: Object.fromEntries(
        RUBRIC_DIMENSIONS.map((d) => [
          d,
          {
            score: 4,
            evidence: ['text'],
            confidence: 'medium',
            failureExplanation: '',
            suggestedRevision: '',
          },
        ]),
      ),
    },
    ...extra,
  } as unknown as EvalRun;
}
describe('eval protected promotion gate', () => {
  test('nonregressing complete same-condition cohort passes', () => {
    expect(compareEvalRuns([row()], [row()], ['g1'], 'set').passed).toBe(true);
  });
  test('deliberately worsened prompt loses deterministic and judge metrics; gate fails', () => {
    const bad = row();
    bad.deterministicResult.passed = false;
    bad.deterministicResult.checks[0].passed = false;
    bad.judgeResult!.dimensions.accuracy.score = 1;
    const result = compareEvalRuns([row()], [bad], ['g1'], 'set');
    expect(result.passed).toBe(false);
    expect(result.failures).toEqual(
      expect.arrayContaining([
        'Layer 1 pass rate regressed',
        'Judge accuracy regressed',
      ]),
    );
  });
  test('missing/failed case cannot be cherry-picked away', () => {
    expect(compareEvalRuns([row()], [], ['g1'], 'set').passed).toBe(false);
    expect(
      compareEvalRuns([row()], [row({ status: 'failed' })], ['g1'], 'set')
        .passed,
    ).toBe(false);
  });
  test('model/seed/judge/corpus changes are not a controlled comparison', () => {
    for (const extra of [
      { generatorModel: 'different' },
      { seed: 9 },
      { goldenSetHash: 'other' },
      { judgePromptHash: 'other' },
    ])
      expect(compareEvalRuns([row()], [row(extra)], ['g1'], 'set').passed).toBe(
        false,
      );
  });
  test('missing per-check result cannot hide a regression in an already-failing suite', () => {
    const a = row({
      deterministicResult: {
        passed: false,
        checks: [{ code: 'LEAK', passed: true, detail: '' }],
      },
    });
    const b = row({ deterministicResult: { passed: false, checks: [] } });
    expect(compareEvalRuns([a], [b], ['g1'], 'set').passed).toBe(false);
  });
  test('output regression is protected separately from judge means', () => {
    expect(
      compareEvalRuns(
        [row()],
        [row({ goldenDiff: { passed: false, differences: ['wrong'] } })],
        ['g1'],
        'set',
      ).passed,
    ).toBe(false);
  });
});
