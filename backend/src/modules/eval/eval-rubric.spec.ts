import { EVAL_RUBRIC, RUBRIC_DIMENSIONS, parseJudgeBatch } from './eval-rubric';
function output() {
  return {
    judgements: [
      {
        artifactId: 'a',
        rubricVersion: '1.0.0',
        dimensions: Object.fromEntries(
          RUBRIC_DIMENSIONS.map((d) => [
            d,
            {
              score: 4,
              evidence: ['A queue is FIFO.'],
              failureExplanation: '',
              suggestedRevision: '',
              confidence: 'medium',
            },
          ]),
        ),
      },
    ],
  };
}
const artifacts = new Map([
  ['a', 'A queue is FIFO. The first entry is removed.'],
]);
describe('eval anchored judge schema', () => {
  test('every dimension has five concrete anchors', () => {
    for (const d of RUBRIC_DIMENSIONS) expect(EVAL_RUBRIC[d]).toHaveLength(5);
  });
  test('valid exact quotes and stated confidence retained without a synthetic probability', () => {
    expect(
      parseJudgeBatch(JSON.stringify(output()), artifacts).get('a')!.dimensions
        .accuracy.confidence,
    ).toBe('medium');
  });
  test.each(['not JSON', '{}', '{"judgements":[]}'])(
    'malformed result rejected: %s',
    (raw) => {
      expect(() => parseJudgeBatch(raw, artifacts)).toThrow();
    },
  );
  test('missing or fabricated quotes flagged', () => {
    const result: any = output();
    result.judgements[0].dimensions.accuracy.evidence = [];
    expect(() => parseJudgeBatch(JSON.stringify(result), artifacts)).toThrow(
      'JUDGE_EVIDENCE',
    );
    result.judgements[0].dimensions.accuracy.evidence = ['fabricated'];
    expect(() => parseJudgeBatch(JSON.stringify(result), artifacts)).toThrow(
      'JUDGE_EVIDENCE',
    );
  });
  test('scores must be integer 1..5 and every anchored dimension required', () => {
    const result: any = output();
    result.judgements[0].dimensions.clarity.score = 3.5;
    expect(() => parseJudgeBatch(JSON.stringify(result), artifacts)).toThrow(
      'JUDGE_SCHEMA',
    );
    delete result.judgements[0].dimensions.clarity;
    expect(() => parseJudgeBatch(JSON.stringify(result), artifacts)).toThrow(
      'JUDGE_SCHEMA',
    );
  });
  test('low score requires observable failure and actionable revision', () => {
    const result: any = output();
    result.judgements[0].dimensions.pedagogy.score = 2;
    expect(() => parseJudgeBatch(JSON.stringify(result), artifacts)).toThrow(
      'needs failure',
    );
  });
  test('unknown fields and cross-artifact quotes rejected', () => {
    const result: any = output();
    result.extra = true;
    expect(() => parseJudgeBatch(JSON.stringify(result), artifacts)).toThrow();
    result.extra = undefined;
    result.judgements[0].artifactId = 'b';
    expect(() => parseJudgeBatch(JSON.stringify(result), artifacts)).toThrow();
  });
});
