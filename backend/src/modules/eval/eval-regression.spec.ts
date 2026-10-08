import {
  loadEvalGoldens,
  loadPromptContracts,
  renderGoldenInput,
  diffGolden,
  STATIC_SYSTEMS,
  artifactFromOutput,
  goldenSetHash,
} from './eval-goldens';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import { evaluateArtifact } from './eval-checks';
describe('eval golden regression (offline contract/reference replay, no paid calls)', () => {
  const rows = loadEvalGoldens();
  test('every versioned production prompt task has an output golden', () => {
    expect(
      [...new Set(rows.map((r) => r.registryTask ?? r.task))].sort(),
    ).toEqual(Object.values(AiGenerationType).sort());
  });
  test('every original input has an output regression reference, including observed historic media task aliases', () => {
    const referenced = new Set(rows.map((r) => r.sourceInput));
    for (const contract of loadPromptContracts())
      expect(referenced.has(contract.id)).toBe(true);
  });
  test('every existing append-only golden input still renders all original pins', () => {
    for (const row of loadPromptContracts())
      for (const pin of row.expectContains)
        expect(renderGoldenInput(row.task, row.input)).toContain(pin);
  });
  for (const row of rows)
    test(`${row.task}/${row.id}: production builder + reference output diff`, () => {
      expect(
        STATIC_SYSTEMS[(row.registryTask ?? row.task) as AiGenerationType],
      ).toBeTruthy();
      expect(renderGoldenInput(row.task, row.input!)).toBeTruthy();
      const raw =
        typeof row.expected === 'string'
          ? row.expected
          : JSON.stringify(row.expected);
      const { output } = artifactFromOutput(row, raw);
      expect(diffGolden(row, output)).toEqual({
        passed: true,
        differences: [],
      });
    });
  test('prose paraphrase can satisfy semantic anchors; reversal fails with a readable diff', () => {
    const row = rows.find((r) => r.id === 'lesson-branch')!;
    expect(diffGolden(row, 'A branch is a reference to a commit.').passed).toBe(
      true,
    );
    expect(diffGolden(row, 'A branch is not a pointer.').differences).toEqual(
      expect.arrayContaining([expect.stringContaining('claim')]),
    );
  });
  test('structured diff ignores object-key order but not changed values', () => {
    const row = rows.find((r) => r.id === 'factcheck-consistent')!;
    expect(
      diffGolden(row, { term_issues: [], outline_drift: [], consistent: true })
        .passed,
    ).toBe(true);
    expect(
      diffGolden(row, { consistent: false, outline_drift: [], term_issues: [] })
        .passed,
    ).toBe(false);
  });
  test('deliberately worsened prompt output fails deterministic and semantic regression', async () => {
    const row = rows.find((r) => r.id === 'lesson-branch')!;
    const bad = 'Let me plan the response. A branch is not a pointer.';
    expect(diffGolden(row, bad).passed).toBe(false);
    expect(
      (await evaluateArtifact(artifactFromOutput(row, bad).artifact)).passed,
    ).toBe(false);
  });
  test('corpus fingerprint changes if a reference or input changes', () => {
    expect(goldenSetHash(rows)).not.toBe(
      goldenSetHash(rows.map((r, i) => (i === 0 ? { ...r, expected: [] } : r))),
    );
  });
});
