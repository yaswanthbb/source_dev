import { EvalRun } from './entities/eval-run.entity';
import { RUBRIC_DIMENSIONS, RUBRIC_VERSION } from './eval-rubric';
export function compareEvalRuns(
  baseline: EvalRun[],
  candidate: EvalRun[],
  expectedIds: string[],
  setHash: string,
) {
  const failures: string[] = [];
  const validate = (rows: EvalRun[], name: string) => {
    if (
      !expectedIds.length ||
      rows.length !== expectedIds.length ||
      new Set(rows.map((r) => r.goldenId)).size !== rows.length ||
      rows.some(
        (r) =>
          !r.goldenId ||
          !expectedIds.includes(r.goldenId) ||
          r.goldenSetHash !== setHash ||
          r.status !== 'completed' ||
          !r.judgeResult ||
          r.rubricVersion !== RUBRIC_VERSION,
      )
    )
      failures.push(
        `${name}: incomplete/failed/mismatched golden cohort or judge evidence`,
      );
  };
  validate(baseline, 'baseline');
  validate(candidate, 'candidate');
  const all = [...baseline, ...candidate];
  if (
    new Set(
      all.map(
        (r) =>
          `${r.generatorModel}|${r.judgeModel}|${r.seed}|${r.judgeSeed}|${r.judgePromptHash}|${r.rubricVersion}`,
      ),
    ).size !== 1
  )
    failures.push('Generator/judge/model/prompt/rubric/seed conditions differ');
  const summarize = (rows: EvalRun[]) => ({
    n: rows.length,
    layer1PassRate: rows.length
      ? rows.filter((r) => r.deterministicResult.passed).length / rows.length
      : 0,
    goldenPassRate: rows.length
      ? rows.filter((r) => r.goldenDiff?.passed).length / rows.length
      : 0,
    checks: Object.fromEntries(
      [
        ...new Set(
          rows.flatMap((r) => r.deterministicResult.checks.map((c) => c.code)),
        ),
      ]
        .sort()
        .map((code) => {
          const observations = rows.flatMap((r) =>
            r.deterministicResult.checks.filter((c) => c.code === code),
          );
          return [
            code,
            observations.filter((c) => c.passed).length / observations.length,
          ];
        }),
    ),
    judgeScores: Object.fromEntries(
      RUBRIC_DIMENSIONS.map((d) => [
        d,
        rows.length
          ? rows.reduce(
              (s, r) => s + (r.judgeResult?.dimensions[d].score ?? 0),
              0,
            ) / rows.length
          : 0,
      ]),
    ),
  });
  const a = summarize(baseline),
    b = summarize(candidate);
  if (b.layer1PassRate < a.layer1PassRate)
    failures.push('Layer 1 pass rate regressed');
  if (b.goldenPassRate < a.goldenPassRate)
    failures.push('Golden output pass rate regressed');
  for (const [code, rate] of Object.entries(a.checks))
    if ((b.checks[code] ?? -1) < rate)
      failures.push(`Protected check ${code} regressed`);
  for (const dimension of RUBRIC_DIMENSIONS)
    if (b.judgeScores[dimension] < a.judgeScores[dimension])
      failures.push(`Judge ${dimension} regressed`);
  return {
    passed: !failures.length,
    failures,
    baseline: a,
    candidate: b,
    delta: {
      layer1PassRate: b.layer1PassRate - a.layer1PassRate,
      goldenPassRate: b.goldenPassRate - a.goldenPassRate,
      judgeScores: Object.fromEntries(
        RUBRIC_DIMENSIONS.map((d) => [d, b.judgeScores[d] - a.judgeScores[d]]),
      ),
    },
  };
}
