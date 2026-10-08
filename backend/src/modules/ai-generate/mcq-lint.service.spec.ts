import { AssessmentItem, auditBloom, bloomTarget } from './assessment';
import { McqLintService } from './mcq-lint.service';

export const item = (): AssessmentItem => ({
  questionText: 'Which operation retrieves the earliest queued entry?',
  bloomLevel: 'Apply',
  intendedDifficulty: 'medium',
  correctRationale: 'FIFO removes the oldest item.',
  options: ['Dequeue', 'Push', 'Peek', 'Sort'].map((optionText, i) => ({
    optionText,
    isCorrect: i === 0,
    misconception: i ? 'Confusing order and inspection' : null,
    distractorRationale: i ? 'Does not remove the oldest entry.' : null,
  })),
});
describe('NBME structural lint', () => {
  const lint = new McqLintService();
  const rule = (q: AssessmentItem, code: string, indexes?: number[]) =>
    lint.lint(q, indexes).checks.find((c) => c.code === code)!.passed;
  test('clean fixture passes every rule and records position', () => {
    expect(lint.lint(item(), [0])).toMatchObject({
      passed: true,
      correctPosition: 1,
    });
  });
  test.each([
    [
      'STEM_COMPLETE',
      (q: AssessmentItem) => {
        q.questionText = 'Queue';
      },
    ],
    [
      'NEGATIVE_EMPHASIS',
      (q: AssessmentItem) => {
        q.questionText = 'Which operation does not retrieve a queued entry?';
      },
    ],
    [
      'NO_ALL_ABOVE',
      (q: AssessmentItem) => {
        q.options[1].optionText = 'All of the above';
      },
    ],
    [
      'NULL_SET_ONLY',
      (q: AssessmentItem) => {
        q.options[1].optionText = 'None of the above';
      },
    ],
    [
      'NO_DUPLICATES',
      (q: AssessmentItem) => {
        q.options[1].optionText = '  DEQUEUE! ';
      },
    ],
    [
      'OPTIONS_INDEPENDENT',
      (q: AssessmentItem) => {
        q.options[1].optionText = 'Dequeue or push';
      },
    ],
    [
      'OPTIONS_HOMOGENEOUS',
      (q: AssessmentItem) => {
        q.options[1].optionText = '42';
      },
    ],
    [
      'GRAMMAR_COMPATIBLE',
      (q: AssessmentItem) => {
        q.questionText =
          'Select the operation that removes the earliest queued entry:';
        q.options[1].optionText = 'push';
      },
    ],
    [
      'LENGTH_OUTLIER',
      (q: AssessmentItem) => {
        q.options[0].optionText =
          'Remove the oldest element by advancing the head pointer to its next position';
      },
    ],
    [
      'ISOLATED_ABSOLUTE',
      (q: AssessmentItem) => {
        q.options[1].optionText = 'Always push';
      },
    ],
    [
      'LEXICAL_KEY_LEAK',
      (q: AssessmentItem) => {
        q.questionText =
          'Which operation implements the dequeue operation correctly?';
      },
    ],
    [
      'SINGLE_CORRECT',
      (q: AssessmentItem) => {
        q.options[1].isCorrect = true;
      },
    ],
    [
      'POSITION_RECORDED',
      (q: AssessmentItem) => {
        q.options[0].isCorrect = false;
      },
    ],
  ] as Array<[string, (q: AssessmentItem) => void]>)(
    '%s has a failing fixture',
    (code, mutate) => {
      const q = item();
      mutate(q);
      expect(rule(q, code)).toBe(false);
      expect(rule(item(), code)).toBe(true);
    },
  );
  test('emphasized negatives and genuine null-set key pass', () => {
    for (const word of ['NOT', '**except**', 'LEAST']) {
      const q = item();
      q.questionText = `Which operation is ${word} suitable for this queue?`;
      expect(rule(q, 'NEGATIVE_EMPHASIS')).toBe(true);
    }
    const q = item();
    q.options[0].optionText = 'None of the above';
    q.nullSetCorrect = true;
    expect(rule(q, 'NULL_SET_ONLY')).toBe(true);
  });
  test('two independently defensible options fail even with a single draft key', () => {
    expect(rule(item(), 'SINGLE_CORRECT', [0, 1])).toBe(false);
    expect(rule(item(), 'SINGLE_CORRECT', [0])).toBe(true);
  });
  test('missing semantic verification is explicit', () =>
    expect(lint.lint(item()).semanticCheck).toBe('unavailable'));
});
describe('Bloom audit', () => {
  test('exactly 40 percent meets target; below does not', () => {
    const qs = Array.from({ length: 5 }, item);
    qs.slice(2).forEach((q) => (q.bloomLevel = 'Remember'));
    expect(auditBloom(qs)).toMatchObject({
      percent: 40,
      passed: true,
      positions: { '1': 5 },
    });
    qs[1].bloomLevel = 'Understand';
    expect(auditBloom(qs).passed).toBe(false);
  });
  test('empty fails without NaN', () =>
    expect(auditBloom([])).toMatchObject({ percent: 0, passed: false }));
  test('configuration is bounded', () => {
    expect(bloomTarget('60')).toBe(60);
    expect(bloomTarget('0')).toBe(0);
    for (const v of [undefined, '', 'bad', -1, 101])
      expect(bloomTarget(v)).toBe(40);
  });
});
