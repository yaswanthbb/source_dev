import {
  pointBiserial,
  questionPsychometrics,
  MetricAttempt,
  MetricQuestion,
} from './eval-psychometrics';
const q: MetricQuestion = {
  id: 'q',
  options: [
    { id: 'key', orderIndex: 0, isCorrect: true },
    { id: 'd', orderIndex: 1, isCorrect: false },
  ],
};
const cohort = [q, { ...q, id: 'a' }, { ...q, id: 'b' }];
function data(n = 40, reversed = false): MetricAttempt[] {
  return Array.from({ length: n }, (_, i) =>
    ['q', 'a', 'b'].map((questionId) => ({
      id: `${i}-${questionId}`,
      questionId,
      studentId: `s${i}`,
      selectedOptionId: i >= n / 2 ? 'key' : 'd',
      isCorrect: questionId === 'q' && reversed ? i < n / 2 : i >= n / 2,
      attemptNumber: 1,
      createdAt: new Date('2026-10-08'),
    })),
  ).flat();
}
describe('eval psychometric math', () => {
  test('point-biserial matches published SciPy reference example', () => {
    expect(
      pointBiserial([0, 0, 0, 1, 1, 1, 1], [0, 1, 2, 3, 4, 5, 6]),
    ).toBeCloseTo(0.8660254037844386, 12);
  });
  test('known high/low cohort yields p=.5, D=1, corrected r=1 and distractor rates', () => {
    const s = questionPsychometrics(q, cohort, data());
    expect(s).toMatchObject({
      n: 40,
      difficultyIndex: 0.5,
      discriminationIndex: 1,
      pointBiserial: 1,
      insufficient_data: false,
    });
    expect(s.distractorSelectionRates[0].rate).toBe(0.5);
    expect(s.answerPositionDistribution.map((o) => o.selected)).toEqual([
      20, 20,
    ]);
  });
  test('negative discrimination and correlation flag review without rewriting', () => {
    const s = questionPsychometrics(q, cohort, data(40, true));
    expect(s.discriminationIndex).toBe(-1);
    expect(s.pointBiserial).toBe(-1);
    expect(s.weakItem).toBe(true);
  });
  test('small sample reports descriptive p but no spurious correlation/discrimination or weak-item verdict', () => {
    const s = questionPsychometrics(q, cohort, data(4));
    expect(s).toMatchObject({
      n: 4,
      insufficient_data: true,
      discriminationIndex: null,
      pointBiserial: null,
      weakItem: false,
    });
  });
  test('retries are not additional learners and do not inflate difficulty', () => {
    const attempts = data();
    attempts.push({
      ...attempts[0],
      id: 'retry',
      attemptNumber: 2,
      isCorrect: true,
      selectedOptionId: 'key',
    });
    expect(questionPsychometrics(q, cohort, attempts).n).toBe(40);
    expect(questionPsychometrics(q, cohort, attempts).difficultyIndex).toBe(
      0.5,
    );
  });
  test('incomplete rest cohort, a single question and no score variation return null', () => {
    expect(
      questionPsychometrics(
        q,
        cohort,
        data().filter((a) => a.questionId === 'q'),
      ).pointBiserial,
    ).toBeNull();
    expect(questionPsychometrics(q, [q], data()).insufficient_data).toBe(true);
    expect(pointBiserial([1, 1, 1], [0, 1, 2])).toBeNull();
  });
  test('ties never arbitrarily allocate upper/lower groups', () => {
    const attempts = data().map((a) =>
      a.questionId === 'q' ? a : { ...a, isCorrect: true },
    );
    const s = questionPsychometrics(q, cohort, attempts);
    expect(s.discriminationIndex).toBeNull();
    expect(s.reasons).toContain('TIED_OR_INSUFFICIENT_GROUPS');
  });
  test('zero sample is guarded and never returns NaN or Infinity or learner IDs', () => {
    const s = questionPsychometrics(q, cohort, []);
    expect(s.n).toBe(0);
    expect(s.difficultyIndex).toBeNull();
    expect(JSON.stringify(s)).not.toMatch(/studentId|NaN|Infinity/);
  });
});
