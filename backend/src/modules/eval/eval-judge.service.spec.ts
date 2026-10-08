import { EvalJudgeService } from './eval-judge.service';
import { EvalRun } from './entities/eval-run.entity';
import { EMPTY_EVAL_CONTEXT } from './eval-checks';
import { RUBRIC_DIMENSIONS } from './eval-rubric';
function harness(env = {}) {
  const config: any = {
    get: (key: string) =>
      (
        ({
          EVAL_ENABLED: 'true',
          EVAL_PROVIDER_API_KEY: 'SECRET',
          EVAL_JUDGE_MODEL: 'strong',
          ...env,
        }) as any
      )[key],
  };
  const registry: any = {
    resolveSystem: jest
      .fn()
      .mockResolvedValue({ version: '1.0.0', systemTemplate: 'judge' }),
  };
  const runs: any = { save: jest.fn(async (row) => row) },
    logs: any = { create: (row: any) => row, save: jest.fn() };
  const clients: any = {
    configuredDefaultModel: () => 'generator',
    complete: jest.fn().mockImplementation(async (...args: any[]) => {
      const input = JSON.parse(args[4]);
      return {
        tokensIn: 100,
        tokensOut: 80,
        text: JSON.stringify({
          judgements: input.artifacts.map((a: any) => ({
            artifactId: a.artifactId,
            rubricVersion: '1.0.0',
            dimensions: Object.fromEntries(
              RUBRIC_DIMENSIONS.map((d) => [
                d,
                {
                  score: 4,
                  evidence: ['A queue is FIFO.'],
                  failureExplanation: '',
                  suggestedRevision: '',
                  confidence: 'low',
                },
              ]),
            ),
          })),
        }),
      };
    }),
  };
  return {
    service: new EvalJudgeService(config, registry, clients, runs, logs),
    clients,
    runs,
    logs,
  };
}
const run = (id = 'a', generatorModel = 'generator') =>
  ({
    id,
    artifact: {
      kind: 'prose',
      content: 'A queue is FIFO.\nRemove the earliest entry.',
    },
    context: EMPTY_EVAL_CONTEXT,
    generatorModel,
    warnings: [],
    status: 'pending',
  }) as unknown as EvalRun;
describe('eval judge worker', () => {
  test('dimensions/artifacts batch in one internal call; seed, model and evidence recorded', async () => {
    const h = harness();
    const rows = await h.service.judgeBatch([run('a'), run('b')], 'admin');
    expect(h.clients.complete).toHaveBeenCalledTimes(1);
    expect(h.clients.complete.mock.calls[0][5]).toMatchObject({
      temperature: 0,
      seed: 42,
    });
    expect(h.logs.save.mock.calls[0][0]).toMatchObject({
      userId: 'admin',
      internal: true,
      promptVersion: '1.0.0',
      generationType: 'eval_judge',
    });
    expect(
      rows.every(
        (row) =>
          row.status === 'completed' &&
          row.judgeModel === 'strong' &&
          row.judgeResult!.dimensions.accuracy.confidence === 'low',
      ),
    ).toBe(true);
    expect(JSON.stringify(rows)).not.toContain('SECRET');
  });
  test('same-model independence warning stored, not hidden', async () => {
    const h = harness();
    expect(
      (await h.service.judgeBatch([run('a', 'strong')], 'admin'))[0].warnings,
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('JUDGE_NOT_INDEPENDENT'),
      ]),
    );
  });
  test('fabricated quote leaves a failed auditable run', async () => {
    const h = harness();
    h.clients.complete.mockResolvedValue({
      text: '{"judgements":[]}',
      tokensIn: null,
      tokensOut: null,
    });
    const [row] = await h.service.judgeBatch([run()], 'admin');
    expect(row.status).toBe('failed');
    expect(row.judgeRaw).toBe('{"judgements":[]}');
    expect(row.judgeResult).toBeNull();
  });
  test('disabled/unconfigured eval never calls providers', async () => {
    const h = harness({ EVAL_ENABLED: 'false' });
    await expect(h.service.judgeBatch([run()], 'admin')).rejects.toThrow(
      'EVAL_ENABLED',
    );
    expect(h.clients.complete).not.toHaveBeenCalled();
  });
  test('bounded batch rejects oversized work before paid calls', async () => {
    const h = harness();
    await expect(
      h.service.judgeBatch([run('a'), run('b'), run('c')], 'admin'),
    ).rejects.toThrow('bound');
    expect(h.clients.complete).not.toHaveBeenCalled();
  });
});
