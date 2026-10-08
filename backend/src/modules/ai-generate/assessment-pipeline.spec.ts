import { AssessmentPipeline, AssessmentTrace } from './assessment-pipeline';
import { AssessmentItem, parseAssessment } from './assessment';

const question = (
  bloomLevel: AssessmentItem['bloomLevel'] = 'Apply',
): AssessmentItem => ({
  questionText: 'Which operation retrieves the earliest queued entry?',
  bloomLevel,
  intendedDifficulty: 'medium',
  correctRationale: 'FIFO removes the oldest item.',
  options: ['Dequeue', 'Push', 'Peek', 'Sort'].map((optionText, i) => ({
    optionText,
    isCorrect: i === 0,
    misconception: i ? 'Confusing order and inspection' : null,
    distractorRationale: i ? 'Does not remove the oldest entry.' : null,
  })),
});
describe('unified assessment pipeline (mock provider)', () => {
  const input = {
    title: 'Queues',
    content: 'A FIFO queue dequeues its oldest entry.',
    misconceptions: ['Confusing order and inspection'],
    target: 40,
  };
  const agreement = {
    answerIndex: 0,
    defensibleIndexes: [0],
    nullSetCorrect: false,
    reason: 'FIFO',
  };
  const deps = () => ({
    draft: jest.fn(
      async (_request: string, _internal: boolean, _attempt: number) =>
        JSON.stringify({ questions: [question()] }),
    ),
    verify: jest.fn(async (_request: string) => JSON.stringify(agreement)),
    parse: (raw: string) => JSON.parse(raw).questions,
    isTerminalError: () => false,
  });
  let trace: AssessmentTrace;
  beforeEach(() => {
    trace = { stages: [], warnings: [] };
  });
  test('every item verified and linted; verifier cannot see draft key or rationales', async () => {
    const d = deps();
    const result = await new AssessmentPipeline().run(input, d, trace);
    expect(result[0].lintResult?.passed).toBe(true);
    expect(result[0].verificationResult?.agreed).toBe(true);
    const payload = d.verify.mock.calls[0][0];
    expect(payload).not.toMatch(/isCorrect|Rationale|misconception/);
    expect(trace.warnings).toEqual([]);
  });
  test('low Bloom replaces weakest once and verifies replacements', async () => {
    const d = deps();
    d.draft
      .mockResolvedValueOnce(
        JSON.stringify({
          questions: Array.from({ length: 5 }, () => question('Remember')),
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({ questions: [question(), question()] }),
      );
    const result = await new AssessmentPipeline().run(input, d, trace);
    expect(result).toHaveLength(5);
    expect(d.draft).toHaveBeenCalledTimes(2);
    expect(d.draft.mock.calls[1][1]).toBe(true);
    expect(d.verify).toHaveBeenCalledTimes(7);
    expect(
      trace.stages.find((s) => s.stage === 'bloom-audit-final'),
    ).toMatchObject({ ok: true });
  });
  test('revision remains low: one attempt then explicit warning', async () => {
    const d = deps();
    d.draft.mockResolvedValue(
      JSON.stringify({ questions: [question('Remember')] }),
    );
    await new AssessmentPipeline().run(input, d, trace);
    expect(d.draft).toHaveBeenCalledTimes(2);
    expect(trace.warnings).toContain(
      'BLOOM_BELOW_TARGET: published after one revision attempt',
    );
  });
  test('flawed two-true / longest-correct draft caught; conflict repair once then retains original key', async () => {
    const d = deps();
    const q = question();
    q.options[0].optionText =
      'Remove the oldest element by advancing the head pointer to its next position';
    d.draft.mockResolvedValue(JSON.stringify({ questions: [q] }));
    d.verify.mockResolvedValue(
      JSON.stringify({ ...agreement, defensibleIndexes: [0, 1] }),
    );
    const [result] = await new AssessmentPipeline().run(input, d, trace);
    expect(result.lintResult).toMatchObject({
      passed: false,
      checks: expect.arrayContaining([
        { code: 'SINGLE_CORRECT', passed: false },
        { code: 'LENGTH_OUTLIER', passed: false },
      ]),
    });
    expect(result.verificationResult?.retainedDraftKey).toBe(true);
    expect(d.draft).toHaveBeenCalledTimes(2);
    expect(d.verify).toHaveBeenCalledTimes(2);
    expect(trace.warnings.join(' ')).toMatch(/ANSWER_KEY_CONFLICT/);
  });
  test('agreement after repair accepted and relinted', async () => {
    const d = deps();
    d.verify.mockResolvedValueOnce(
      JSON.stringify({ ...agreement, answerIndex: 1, defensibleIndexes: [1] }),
    );
    const [q] = await new AssessmentPipeline().run(input, d, trace);
    expect(q.verificationResult).toMatchObject({
      agreed: true,
      repairAttempted: true,
      retainedDraftKey: false,
    });
  });
  test('verification outage is a warning, never hard failure', async () => {
    const d = deps();
    d.verify.mockRejectedValue(new Error('offline'));
    const [q] = await new AssessmentPipeline().run(input, d, trace);
    expect(q.lintResult?.semanticCheck).toBe('unavailable');
    expect(trace.warnings).toContain('ANSWER_VERIFICATION_UNAVAILABLE');
  });
  test('draft parsing retries once with increased attempt and internal quota', async () => {
    const d = deps();
    d.draft.mockResolvedValueOnce('{bad json');
    await new AssessmentPipeline().run(input, d, trace);
    expect(d.draft.mock.calls.map((c) => c.slice(1))).toEqual([
      [false, 1],
      [true, 2],
    ]);
  });
  test('mapping is checked against actual inventory', async () => {
    const d = deps();
    const q = question();
    q.options[1].misconception = 'invented';
    d.draft.mockResolvedValue(JSON.stringify({ questions: [q] }));
    const [result] = await new AssessmentPipeline().run(input, d, trace);
    expect(result.lintResult?.checks).toContainEqual({
      code: 'DISTRACTOR_MAPPING',
      passed: false,
    });
  });
  test('typed parser rejects missing Bloom, rationale, malformed options and multi-key items', () => {
    for (const patch of [
      { bloomLevel: 'Fake' },
      { correctRationale: '' },
      { options: [null, {}] },
    ])
      expect(parseAssessment([{ ...question(), ...patch }])).toBeNull();
    expect(parseAssessment([question()])).toHaveLength(1);
  });
});
