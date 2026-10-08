/** Corrected item-rest classical statistics; no inferred outcomes, learner text or identifiers in output. */
export interface MetricQuestion {
  id: string;
  options: Array<{ id: string; orderIndex: number; isCorrect: boolean }>;
}
export interface MetricAttempt {
  id: string;
  questionId: string;
  studentId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  attemptNumber: number;
  createdAt: Date;
}
export function pointBiserial(binary: number[], rest: number[]): number | null {
  if (
    binary.length < 3 ||
    binary.length !== rest.length ||
    [...binary, ...rest].some((n) => !Number.isFinite(n))
  )
    return null;
  const mean = (values: number[]) =>
    values.reduce((a, b) => a + b, 0) / values.length;
  const x = mean(binary),
    y = mean(rest);
  const xx = binary.reduce((s, v) => s + (v - x) ** 2, 0),
    yy = rest.reduce((s, v) => s + (v - y) ** 2, 0);
  if (!xx || !yy) return null;
  return Math.max(
    -1,
    Math.min(
      1,
      binary.reduce((s, v, i) => s + (v - x) * (rest[i] - y), 0) /
        Math.sqrt(xx * yy),
    ),
  );
}
export function questionPsychometrics(
  question: MetricQuestion,
  cohort: MetricQuestion[],
  attempts: MetricAttempt[],
  minimumN = 20,
) {
  if (!Number.isInteger(minimumN) || minimumN < 20)
    throw new Error('Psychometric minimum sample must be an integer >=20');
  // First attempt per learner/version only: retries do not pretend to be independent observations.
  const first = new Map<string, MetricAttempt>();
  for (const a of [...attempts].sort(
    (a, b) =>
      a.attemptNumber - b.attemptNumber ||
      a.createdAt.getTime() - b.createdAt.getTime() ||
      a.id.localeCompare(b.id),
  )) {
    const key = `${a.studentId}:${a.questionId}`;
    if (!first.has(key)) first.set(key, a);
  }
  const sample = [...first.values()].filter(
    (a) => a.questionId === question.id,
  );
  const n = sample.length,
    insufficient = n < minimumN;
  const difficultyIndex = n
    ? sample.filter((a) => a.isCorrect).length / n
    : null;
  const options = [...question.options].sort(
    (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
  );
  const selectionRates = options.map((o, index) => {
    const selected = sample.filter((a) => a.selectedOptionId === o.id).length;
    return {
      optionId: o.id,
      position: index + 1,
      isKey: o.isCorrect,
      selected,
      rate: n ? selected / n : null,
    };
  });
  const restIds = [...new Set(cohort.map((q) => q.id))].filter(
    (id) => id !== question.id,
  );
  const complete =
    restIds.length >= 2
      ? sample.flatMap((a) => {
          const rest = restIds.map((id) => first.get(`${a.studentId}:${id}`));
          return rest.every(Boolean)
            ? [
                {
                  correct: Number(a.isCorrect),
                  rest: rest.filter((r) => r!.isCorrect).length,
                },
              ]
            : [];
        })
      : [];
  const correlationN = complete.length;
  const reasons: string[] = [];
  if (insufficient) reasons.push('INSUFFICIENT_LEARNERS');
  if (restIds.length < 2) reasons.push('INSUFFICIENT_REST_ITEMS');
  if (correlationN < minimumN) reasons.push('INSUFFICIENT_COMPLETE_COHORT');
  const correlation =
    !insufficient && correlationN >= minimumN
      ? pointBiserial(
          complete.map((r) => r.correct),
          complete.map((r) => r.rest),
        )
      : null;
  if (!insufficient && correlationN >= minimumN && correlation === null)
    reasons.push('NO_SCORE_VARIATION');
  const sorted = [...complete].sort((a, b) => a.rest - b.rest);
  const k = Math.max(1, Math.floor(correlationN * 0.27));
  const lowCut = sorted[k - 1]?.rest,
    highCut = sorted[sorted.length - k]?.rest;
  // Include boundary ties rather than arbitrarily splitting equal abilities by learner ID.
  const lower = sorted.filter((r) => r.rest <= lowCut),
    upper = sorted.filter((r) => r.rest >= highCut);
  const groupsValid =
    !insufficient &&
    correlationN >= minimumN &&
    lowCut < highCut &&
    lower.length >= 3 &&
    upper.length >= 3;
  const discriminationIndex = groupsValid
    ? upper.reduce((s, r) => s + r.correct, 0) / upper.length -
      lower.reduce((s, r) => s + r.correct, 0) / lower.length
    : null;
  if (!insufficient && correlationN >= minimumN && !groupsValid)
    reasons.push('TIED_OR_INSUFFICIENT_GROUPS');
  const flags: string[] = [];
  if (!insufficient) {
    if (
      difficultyIndex !== null &&
      (difficultyIndex < 0.2 || difficultyIndex > 0.9)
    )
      flags.push('EXTREME_DIFFICULTY');
    if (discriminationIndex !== null && discriminationIndex < 0.2)
      flags.push('LOW_DISCRIMINATION');
    if (correlation !== null && correlation < 0.2)
      flags.push('LOW_POINT_BISERIAL');
    if (
      selectionRates.some((o) => !o.isKey && o.rate !== null && o.rate < 0.05)
    )
      flags.push('UNSELECTED_DISTRACTOR');
  }
  return {
    questionId: question.id,
    n,
    insufficient_data:
      insufficient || correlationN < minimumN || correlation === null,
    minimumN,
    difficultyIndex,
    discriminationIndex,
    pointBiserial: correlation,
    correlationN,
    groups: {
      fraction: 0.27,
      lowerN: groupsValid ? lower.length : 0,
      upperN: groupsValid ? upper.length : 0,
      tiesIncluded: true,
    },
    distractorSelectionRates: selectionRates.filter((o) => !o.isKey),
    answerPositionDistribution: selectionRates,
    correctPositions: selectionRates
      .filter((o) => o.isKey)
      .map((o) => o.position),
    weakItem: !!flags.length,
    flags,
    reasons,
    methodVersion: 'first-attempt-item-rest-v1',
  };
}
