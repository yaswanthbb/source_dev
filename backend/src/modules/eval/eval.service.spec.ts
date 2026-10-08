import { EvalService } from './eval.service';
import { EvalJudgeService } from './eval-judge.service';
import { EvalRun } from './entities/eval-run.entity';
import { EvalComparison } from './entities/eval-comparison.entity';
import { EvalPromptRelease } from './entities/eval-prompt-release.entity';
import { AiPromptVersion } from '../ai-generate/entities/ai-prompt-version.entity';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { EVAL_JUDGE_SYSTEM_PROMPT, RUBRIC_DIMENSIONS } from './eval-rubric';
import { loadEvalGoldens, renderGoldenInput } from './eval-goldens';
const admin = { id: 'admin', role: UserRole.ADMIN };
function harness() {
  let sequence = 0;
  const repo = () => {
    const rows = new Map<string, any>();
    return {
      rows,
      create: (v: any) => ({ ...v }),
      save: jest.fn(async (v: any) => {
        v.id ??= `id-${++sequence}`;
        rows.set(v.id, v);
        return v;
      }),
      findOne: jest.fn(
        async ({ where }: any) =>
          [...rows.values()].find((r) =>
            Object.entries(where).every(([k, v]) => r[k] === v),
          ) ?? null,
      ),
      find: jest.fn(async (opts?: any) =>
        opts?.where?.id
          ? [...rows.values()].filter((r) => opts.where.id.value.includes(r.id))
          : [...rows.values()],
      ),
      update: jest.fn(async (where: any, changes: any) => {
        for (const r of rows.values())
          if (Object.entries(where).every(([k, v]) => r[k] === v))
            Object.assign(r, changes);
      }),
    };
  };
  const runs = repo(),
    prompts = repo(),
    comparisons = repo(),
    releases = repo(),
    reviews = repo(),
    compilations = repo();
  const terms = repo(),
    edges = repo(),
    placements = repo(),
    prerequisites = repo(),
    questions = repo(),
    media = repo(),
    logs = repo();
  const baseline = {
    id: 'p1',
    task: AiGenerationType.CONCEPT_CONTENT,
    version: '1.0.0',
    systemTemplate: 'BASELINE',
    status: 'production',
  };
  const candidate = {
    ...baseline,
    id: 'p2',
    version: '2.0.0',
    systemTemplate: 'CANDIDATE',
    status: 'draft',
  };
  prompts.rows.set('p1', baseline);
  prompts.rows.set('p2', candidate);
  const config: any = {
    get: (key: string) =>
      (
        ({
          EVAL_ENABLED: 'true',
          EVAL_PROVIDER_API_KEY: 'SECRET',
          EVAL_JUDGE_MODEL: 'judge',
          EVAL_GENERATOR_MODEL: 'gen',
        }) as any
      )[key],
  };
  const registry: any = {
    resolveSystem: async () => ({
      version: '1.0.0',
      systemTemplate: EVAL_JUDGE_SYSTEM_PROMPT,
    }),
  };
  const clients: any = {
    configuredDefaultModel: () => 'gen',
    complete: jest.fn(async (_provider, _key, model, system, user) => {
      if (model !== 'judge') {
        const fixture = loadEvalGoldens().find(
          (f) => renderGoldenInput(f.task, f.input!) === user,
        )!;
        // Keep structured fixtures parseable so this exercises metric regression, not missing evidence.
        return {
          text:
            system === 'WORSE' && ['lesson', 'prose'].includes(fixture.format)
              ? 'Let me plan the response. A branch is not a pointer.'
              : typeof fixture.expected === 'string'
                ? fixture.expected
                : JSON.stringify(fixture.expected),
          tokensIn: 10,
          tokensOut: 20,
        };
      }
      const input = JSON.parse(user);
      return {
        text: JSON.stringify({
          judgements: input.artifacts.map((a: any) => ({
            artifactId: a.artifactId,
            rubricVersion: '1.0.0',
            dimensions: Object.fromEntries(
              RUBRIC_DIMENSIONS.map((d) => [
                d,
                {
                  score: a.text.includes('Let me plan') ? 1 : 4,
                  evidence: [
                    a.text.includes('Let me plan')
                      ? 'A branch is not a pointer.'
                      : a.text.slice(0, 200),
                  ],
                  failureExplanation: a.text.includes('Let me plan')
                    ? 'Leaked planning and false claim.'
                    : '',
                  suggestedRevision: a.text.includes('Let me plan')
                    ? 'Remove planning and correct the definition.'
                    : '',
                  confidence: 'medium',
                },
              ]),
            ),
          })),
        }),
        tokensIn: 30,
        tokensOut: 40,
      };
    }),
  };
  const judge = new EvalJudgeService(
    config,
    registry,
    clients,
    runs as any,
    logs as any,
  );
  const repositories = new Map<any, any>([
    [EvalRun, runs],
    [EvalComparison, comparisons],
    [EvalPromptRelease, releases],
    [AiPromptVersion, prompts],
  ]);
  const manager: any = {
    findOne: (entity: any, opts: any) => repositories.get(entity).findOne(opts),
    find: (entity: any, opts: any) => repositories.get(entity).find(opts),
    update: (entity: any, where: any, values: any) =>
      repositories.get(entity).update(where, values),
    create: (_e: any, values: any) => values,
    save: (entity: any, values: any) => repositories.get(entity).save(values),
  };
  const db: any = {
    transaction: jest.fn(async (callback) => callback(manager)),
  };
  const events: any = { emit: jest.fn() };
  const service = new EvalService(
    runs as any,
    prompts as any,
    comparisons as any,
    releases as any,
    reviews as any,
    compilations as any,
    terms as any,
    edges as any,
    placements as any,
    prerequisites as any,
    questions as any,
    media as any,
    judge,
    db,
    events,
    registry,
    { snapshot: async () => ({}) } as any,
  );
  return {
    service,
    runs,
    prompts,
    comparisons,
    releases,
    reviews,
    compilations,
    terms,
    placements,
    media,
    questions,
    logs,
    clients,
    events,
    baseline,
    candidate,
  };
}
describe('eval persisted release workflow and human calibration', () => {
  test('saved compilation replays actual outline targets, term aliases and diagram IDs without model calls', async () => {
    const h = harness();
    const content =
      '## Hook\nQueues.\n## Intuition\nA line.\n## Definition\nFIFO.\n## Worked Example\nA then B.\n## Faded Practice\nRemove __.\n## Retrieval\nWhich first?\n{{diagram:d}}';
    h.compilations.rows.set('comp', {
      id: 'comp',
      roadmapId: 'roadmap',
      concept: { id: 'c1', isAiGenerated: true, title: 'Queues', content },
      stages: [
        {
          stage: 'outline',
          ok: true,
          detail: {
            conceptRefs: ['c1'],
            termRefs: ['First in first out'],
            callbackRefs: ['Queues'],
          },
        },
      ],
    });
    h.placements.rows.set('placement', {
      id: 'placement',
      conceptId: 'c1',
      concept: { title: 'Queues' },
    });
    h.terms.rows.set('term', { term: 'FIFO', aliases: ['First in first out'] });
    h.media.rows.set('media', {
      kind: 'diagram',
      payload: {
        diagramId: 'd',
        kind: 'flowchart',
        mermaid: 'flowchart TD\nA --> B',
      },
    });
    const run = await h.service.evaluateCompilation('comp', admin, false);
    expect(
      run.deterministicResult.checks.find((c) => c.code === 'CALLBACKS_EXIST')
        ?.passed,
    ).toBe(true);
    expect(
      run.deterministicResult.checks.find((c) => c.code === 'MERMAID_VALID')
        ?.passed,
    ).toBe(true);
    expect(run).toMatchObject({
      generatorModel: 'unknown-historical',
      promptVersion: 'unknown-historical',
      seed: null,
      judgeSeed: null,
    });
    expect(h.clients.complete).not.toHaveBeenCalled();
    expect(h.questions.save).not.toHaveBeenCalled();
  });
  test('shadow stores versioned auditable results and never serves/writes course questions or changes production', async () => {
    const h = harness();
    const [row] = await h.service.shadow('concept_content', '2.0.0', admin);
    expect(row).toMatchObject({
      mode: 'shadow',
      status: 'completed',
      promptVersion: '2.0.0',
      generatorModel: 'gen',
      judgeModel: 'judge',
      seed: 42,
    });
    expect(row.artifactHash).toHaveLength(64);
    expect(h.questions.save).not.toHaveBeenCalled();
    expect(h.baseline.status).toBe('production');
    expect(h.logs.save.mock.calls.every(([log]) => log.internal === true)).toBe(
      true,
    );
    expect(JSON.stringify(row)).not.toContain('SECRET');
  });
  test('same-golden comparison passes, promotion approves selection without changing production statuses, rollback revokes it', async () => {
    const h = harness();
    const comparison = await h.service.compare(
      'concept_content',
      '1.0.0',
      '2.0.0',
      admin,
    );
    expect(comparison.result.passed).toBe(true);
    const release = await h.service.promote(comparison.id, admin);
    expect(release.status).toBe('approved');
    expect(h.candidate.status).toBe('draft');
    expect(h.baseline.status).toBe('production');
    await h.service.rollback('concept_content', admin);
    expect(release.status).toBe('revoked');
  });
  test('deliberately worse prompt cannot promote even if the stored comparison summary is tampered to pass', async () => {
    const h = harness();
    h.candidate.systemTemplate = 'WORSE';
    const c = await h.service.compare(
      'concept_content',
      '1.0.0',
      '2.0.0',
      admin,
    );
    expect(c.result.passed).toBe(false);
    c.result = { passed: true };
    await expect(h.service.promote(c.id, admin)).rejects.toThrow(
      'Promotion blocked',
    );
    expect(h.releases.save).not.toHaveBeenCalled();
  });
  test('changed immutable prompt fingerprint blocks stale approval', async () => {
    const h = harness();
    const c = await h.service.compare(
      'concept_content',
      '1.0.0',
      '2.0.0',
      admin,
    );
    h.candidate.systemTemplate = 'changed';
    await expect(h.service.promote(c.id, admin)).rejects.toThrow('fingerprint');
  });
  test('changed corpus and incomplete run evidence fail closed', async () => {
    const h = harness();
    const c = await h.service.compare(
      'concept_content',
      '1.0.0',
      '2.0.0',
      admin,
    );
    c.goldenSetHash = 'stale';
    await expect(h.service.promote(c.id, admin)).rejects.toThrow(
      'corpus changed',
    );
  });
  test('non-admin cannot evaluate/read/private QA is not accepted as a saved artifact', async () => {
    const h = harness();
    const learner = { id: 'student', role: UserRole.DEVELOPER };
    await expect(
      h.service.shadow('concept_content', '2.0.0', learner),
    ).rejects.toThrow('Admin');
    await expect(h.service.run('any', learner)).rejects.toThrow('Admin');
    h.compilations.rows.set('c', {
      id: 'c',
      concept: { isAiGenerated: false, content: 'PRIVATE QA' },
    });
    await expect(
      h.service.evaluateCompilation('c', admin, true),
    ).rejects.toThrow('not available');
    expect(h.clients.complete).not.toHaveBeenCalled();
  });
  test('new candidates cannot overwrite old version expectations', async () => {
    const h = harness();
    await expect(
      h.service.createCandidate(
        'concept_content',
        '1.0.0',
        'new',
        'reason',
        admin,
      ),
    ).rejects.toThrow('immutable');
    const row = await h.service.createCandidate(
      'concept_content',
      '3.0.0',
      'new template',
      'New documented behavior',
      admin,
    );
    expect(row.status).toBe('draft');
  });
  test('expert approval/edit/rejection scores are append-only linked samples, no invented agreement metric', async () => {
    const h = harness();
    const [run] = await h.service.shadow('concept_content', '2.0.0', admin);
    const scores = {
      accuracy: 4,
      clarity: 4,
      pedagogy: 4,
      difficultyCalibration: 4,
    };
    for (const decision of ['approve', 'edit', 'reject'] as const)
      await h.service.expertReview(run.id, admin, {
        decision,
        reasonCodes: ['clarity'],
        reason: 'Observable review reason',
        scores,
        proposedRevision: decision === 'edit' ? 'Revised example' : undefined,
      });
    expect(h.reviews.rows.size).toBe(3);
    expect(
      [...h.reviews.rows.values()].every(
        (r) => r.evalRunId === run.id && r.rubricVersion === '1.0.0',
      ),
    ).toBe(true);
    await expect(
      h.service.expertReview(run.id, admin, {
        decision: 'edit',
        reasonCodes: [],
        reason: 'x',
        scores,
      }),
    ).rejects.toThrow('anchored');
  });
});
