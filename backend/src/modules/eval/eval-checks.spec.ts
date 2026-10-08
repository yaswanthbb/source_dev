import {
  evaluateArtifact,
  EMPTY_EVAL_CONTEXT,
  EvalArtifact,
  EvalContext,
} from './eval-checks';
const lesson: EvalArtifact = {
  kind: 'lesson',
  content:
    '## Hook\nWhy learn queues?\n## Intuition\nA waiting line.\n## Definition\nFIFO.\n## Worked Example\nA then B.\n## Faded Practice\nRemove __ first.\n## Retrieval\nWhich entry leaves?',
};
const context: EvalContext = {
  ...EMPTY_EVAL_CONTEXT,
  concepts: [{ id: 'c1', title: 'Queues' }],
  placements: ['c1'],
  terms: ['FIFO'],
};
function item(position = 0) {
  const texts = ['Dequeue', 'Push', 'Peek', 'Sort'];
  return {
    questionText: 'Which operation retrieves the earliest queued entry?',
    bloomLevel: 'Apply',
    intendedDifficulty: 'medium',
    correctRationale: 'FIFO removes the oldest entry.',
    options: texts.map((optionText, i) => ({
      optionText,
      isCorrect: i === position,
      misconception: i === position ? null : 'Confused operation',
      distractorRationale:
        i === position
          ? null
          : 'This operation does not remove the oldest entry.',
    })),
    verificationResult: {
      agreed: true,
      final: {
        answerIndex: position,
        defensibleIndexes: [position],
        reason: 'Recorded independent evidence.',
      },
    },
  };
}
async function check(code: string, artifact: EvalArtifact, ctx = context) {
  return (await evaluateArtifact(artifact, ctx)).checks.find(
    (c) => c.code === code,
  )!;
}
describe('eval Layer 1 deterministic checks', () => {
  test('complete lesson passes without side effects', async () => {
    expect((await evaluateArtifact(lesson, context)).passed).toBe(true);
  });
  test('required structure missing fails', async () => {
    expect(
      (
        await check('LESSON_STRUCTURE', {
          ...lesson,
          content: '## Hook\nOnly a hook.',
        })
      ).passed,
    ).toBe(false);
  });
  test('leakage fails', async () => {
    expect(
      (
        await check('NO_REASONING_LEAK', {
          ...lesson,
          content: lesson.content + '\nLet me plan the response.',
        })
      ).passed,
    ).toBe(false);
  });
  test('links use sanitizer with recorded resolution and no HTTP', async () => {
    const a = {
      ...lesson,
      content: lesson.content + '\n[docs](https://example.org)',
    };
    expect((await check('LINKS_VALID', a)).passed).toBe(false);
    expect(
      (
        await check('LINKS_VALID', a, {
          ...context,
          links: { 'https://example.org': true },
        })
      ).passed,
    ).toBe(true);
  });
  test('unsafe link fails even though original sanitizer only recognizes http', async () => {
    expect(
      (
        await check('LINKS_VALID', {
          ...lesson,
          content: lesson.content + '\n[x](javascript:evil)',
        })
      ).passed,
    ).toBe(false);
  });
  test('explicit concept/term callbacks resolve, unknown callbacks fail', async () => {
    const a = {
      ...lesson,
      content: lesson.content + '\n{{concept:c1}} {{term:fifo}}',
    };
    expect((await check('CALLBACKS_EXIST', a)).passed).toBe(true);
    expect(
      (await check('CALLBACKS_EXIST', { ...a, conceptRefs: ['absent'] }))
        .passed,
    ).toBe(false);
  });
  test('duplicate placement or normalized concept title fails', async () => {
    expect(
      (
        await check('NO_DUPLICATE_CONCEPTS', lesson, {
          ...context,
          placements: ['c1', 'c1'],
        })
      ).passed,
    ).toBe(false);
    expect(
      (
        await check('NO_DUPLICATE_CONCEPTS', lesson, {
          ...context,
          concepts: [...context.concepts, { id: 'c2', title: 'queues!' }],
        })
      ).passed,
    ).toBe(false);
  });
  test('declared natural-language recall hooks resolve only to recorded titles or terms', async () => {
    expect(
      (
        await check('CALLBACKS_EXIST', {
          ...lesson,
          callbackRefs: ['queues', 'fifo'],
        })
      ).passed,
    ).toBe(true);
    expect(
      (
        await check('CALLBACKS_EXIST', {
          ...lesson,
          callbackRefs: ['Imaginary concept'],
        })
      ).passed,
    ).toBe(false);
  });
  test('mixed prerequisite/builds-on cycle fails but unrelated reverse links do not', async () => {
    const edges = [
      { from: 'a', to: 'b', type: 'prerequisite' },
      { from: 'b', to: 'a', type: 'builds_on' },
    ];
    expect(
      (await check('NO_DEPENDENCY_CYCLES', lesson, { ...context, edges }))
        .passed,
    ).toBe(false);
    edges[1].type = 'related_to';
    expect(
      (await check('NO_DEPENDENCY_CYCLES', lesson, { ...context, edges }))
        .passed,
    ).toBe(true);
  });
  test('Mermaid structure and missing references fail independently', async () => {
    expect(
      (
        await check('MERMAID_VALID', {
          ...lesson,
          diagrams: [
            { id: 'd', kind: 'flowchart', mermaid: 'flowchart TD\nA --> B' },
          ],
        })
      ).passed,
    ).toBe(true);
    expect(
      (
        await check('MERMAID_VALID', {
          ...lesson,
          diagrams: [{ id: 'd', kind: 'flowchart', mermaid: 'broken' }],
        })
      ).passed,
    ).toBe(false);
    expect(
      (
        await check('MERMAID_VALID', {
          ...lesson,
          content: lesson.content + '\n{{diagram:missing}}',
        })
      ).passed,
    ).toBe(false);
  });
  test('balanced verified MCQ set passes', async () => {
    expect(
      (
        await evaluateArtifact({
          kind: 'mcq_set',
          mcqs: [item(0), item(1), item(2), item(3)],
        })
      ).passed,
    ).toBe(true);
  });
  test('malformed or multiply keyed items fail schema', async () => {
    const q = item();
    q.options[1].isCorrect = true;
    expect(
      (await check('MCQ_SCHEMA', { kind: 'mcq_set', mcqs: [q] })).passed,
    ).toBe(false);
  });
  test('NBME lint failure is surfaced', async () => {
    const q = item();
    q.options[1].optionText = 'All of the above';
    expect(
      (await check('NBME_LINT', { kind: 'mcq_set', mcqs: [q] })).passed,
    ).toBe(false);
  });
  test('missing/conflicting verifier evidence cannot be passed as a defensible key', async () => {
    const q: any = item();
    q.verificationResult = null;
    expect(
      (await check('DEFENSIBLE_KEY', { kind: 'mcq_set', mcqs: [q] })).passed,
    ).toBe(false);
    q.verificationResult = {
      agreed: true,
      final: { answerIndex: 1, defensibleIndexes: [1], reason: 'Mismatch' },
    };
    expect(
      (await check('DEFENSIBLE_KEY', { kind: 'mcq_set', mcqs: [q] })).passed,
    ).toBe(false);
  });
  test('Bloom target and position imbalance fail', async () => {
    const q = { ...item(), bloomLevel: 'Remember' };
    expect(
      (await check('BLOOM_TARGET', { kind: 'mcq_set', mcqs: [q] })).passed,
    ).toBe(false);
    expect(
      (
        await check('KEY_POSITIONS_BALANCED', {
          kind: 'mcq_set',
          mcqs: [item(), item()],
        })
      ).passed,
    ).toBe(false);
  });
  test('compilation requires successful stages', async () => {
    const a: EvalArtifact = {
      ...lesson,
      kind: 'compilation',
      mcqs: [item(0), item(1), item(2), item(3)],
    };
    expect((await check('COMPILATION_STAGES', a)).passed).toBe(false);
    a.stages = [
      'outline',
      'draft',
      'fact-check',
      'critique-revise',
      'validate',
      'publish',
    ].map((stage) => ({ stage, ok: true }));
    expect((await evaluateArtifact(a, context)).passed).toBe(true);
  });
  test('empty structured output fails', async () => {
    expect((await evaluateArtifact({ kind: 'structured' })).passed).toBe(false);
    expect(
      (await evaluateArtifact({ kind: 'structured', structured: [] })).passed,
    ).toBe(true);
  });
});
