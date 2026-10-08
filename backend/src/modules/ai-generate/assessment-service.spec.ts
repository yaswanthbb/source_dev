import { ConfigService } from '@nestjs/config';
import {
  AiGenerateService,
  ResolvedAiCredentials,
} from './ai-generate.service';
import { createMockRepository } from '../../common/testing/mock-repository';
import { makeUser } from '../../common/testing/factories';
import { AiProvider } from '../../common/enums/ai-provider.enum';
import {
  ASSESSMENT_DRAFT_PROMPT,
  ASSESSMENT_VERIFY_PROMPT,
  MISCONCEPTIONS_PROMPT,
} from './constants/assessment-prompts';
import { AssessmentItem } from './assessment';
import { QuizService } from '../quiz/quiz.service';
import { UserRole } from '../../common/enums/user-role.enum';

const inventory = [
  'Confusing queue order',
  'Confusing inspection and removal',
  'Confusing queue and stack',
];
const q = (): AssessmentItem => ({
  questionText: 'Which operation retrieves the earliest queued entry?',
  bloomLevel: 'Apply',
  intendedDifficulty: 'medium',
  correctRationale: 'FIFO removes oldest.',
  options: ['Dequeue', 'Push', 'Peek', 'Sort'].map((optionText, i) => ({
    optionText,
    isCorrect: i === 0,
    misconception: i ? inventory[0] : null,
    distractorRationale: i ? 'Does not remove oldest.' : null,
  })),
});

function harness(flag: string | undefined = 'true') {
  const logs = createMockRepository(),
    jobs = createMockRepository(),
    modules = createMockRepository();
  const concepts = createMockRepository(),
    placements = createMockRepository(),
    questions = createMockRepository();
  const compilations = createMockRepository(),
    cards = createMockRepository(),
    options = createMockRepository();
  questions.create.mockImplementation((entity) => ({ ...entity }));
  const config = {
    get: jest.fn((key: string) =>
      key === 'COURSE_ENGINE_ENABLED'
        ? flag
        : key === 'NVIDIA_STRONG_MODEL_ID'
          ? 'strong'
          : undefined,
    ),
  } as unknown as ConfigService;
  const user = makeUser({ id: 'owner', role: UserRole.DEVELOPER });
  concepts.findOne.mockResolvedValue({
    id: 'c1',
    authorId: user.id,
    title: 'Queues',
    content: 'FIFO',
  });
  cards.findOne.mockResolvedValue(null);
  compilations.findOne.mockResolvedValue(null);
  const contexts = { upsertCard: jest.fn() };
  const quiz = new QuizService(
    questions as any,
    options as any,
    createMockRepository() as any,
    concepts as any,
    {} as any,
    config,
  );
  const registry = {
    resolveSystem: jest.fn(async (_task, fallback) => ({
      systemTemplate: fallback,
      version: '1.0.0',
    })),
  };
  const clients = {
    configuredDefaultModel: jest.fn(() => 'fast'),
    complete: jest.fn(async (_provider, _key, _model, system) => ({
      text:
        system === MISCONCEPTIONS_PROMPT
          ? JSON.stringify({ misconceptions: inventory })
          : system === ASSESSMENT_VERIFY_PROMPT
            ? JSON.stringify({
                answerIndex: 0,
                defensibleIndexes: [0],
                nullSetCorrect: false,
                reason: 'FIFO',
              })
            : JSON.stringify({ questions: [q()] }),
      tokensIn: 10,
      tokensOut: 20,
    })),
  };
  const creds: ResolvedAiCredentials = {
    provider: AiProvider.NVIDIA,
    model: 'author-choice',
    apiKey: 'secret',
    keyId: 'k1',
    tier: 'own-key',
    limit: 20,
    unlimited: false,
  };
  const service = new AiGenerateService(
    logs as any,
    jobs as any,
    createMockRepository() as any,
    modules as any,
    concepts as any,
    placements as any,
    questions as any,
    config,
    {} as any,
    {} as any,
    quiz,
    {} as any,
    clients as any,
    {} as any,
    registry as any,
    {} as any,
    contexts as any,
    {} as any,
    compilations as any,
    cards as any,
    createMockRepository() as any,
    createMockRepository() as any,
  );
  jest.spyOn(service, 'resolveCredentials').mockResolvedValue(creds);
  const quota = jest
    .spyOn(service as any, 'checkRateLimit')
    .mockResolvedValue(undefined);
  return {
    service,
    logs,
    jobs,
    modules,
    concepts,
    placements,
    questions,
    compilations,
    cards,
    options,
    config,
    user,
    contexts,
    registry,
    clients,
    creds,
    quota,
    quiz,
  };
}

describe('assessment entry-point integration', () => {
  test('single contract, versioned prompts, strong verifier, one quota slot', async () => {
    const h = harness();
    const response = await h.service.generateSingleConceptMcqs(
      { title: 'Queues', content: 'FIFO' },
      h.user,
    );
    expect(JSON.parse(response.rawText)[0]).toMatchObject({
      bloomLevel: 'Apply',
      verificationResult: { agreed: true },
    });
    expect(h.quota).toHaveBeenCalledTimes(1);
    expect(
      h.logs.save.mock.calls.filter(([log]) => !log.internal),
    ).toHaveLength(1);
    expect(h.logs.save.mock.calls.map(([log]) => log)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          model: 'strong',
          promptVersion: '1.0.0',
          internal: true,
          tokensIn: 10,
          tokensOut: 20,
        }),
        expect.objectContaining({ model: 'author-choice', internal: false }),
      ]),
    );
    expect(h.compilations.save.mock.calls.at(-1)?.[0]).toMatchObject({
      status: 'succeeded',
      stages: expect.arrayContaining([
        expect.objectContaining({ stage: 'lint' }),
      ]),
    });
    expect(h.questions.save).not.toHaveBeenCalled();
  });
  test('failed initial provider call still charges exactly one successful retry, temperature bumps', async () => {
    const h = harness();
    const implementation = h.clients.complete.getMockImplementation()!;
    let failed = false;
    h.clients.complete.mockImplementation(async (...args) => {
      if (args[3] === ASSESSMENT_DRAFT_PROMPT && !failed) {
        failed = true;
        throw new Error('temporary outage');
      }
      return implementation(...args);
    });
    await h.service.generateSingleConceptMcqs({ title: 'Queues' }, h.user);
    expect(
      h.logs.save.mock.calls.filter(([log]) => !log.internal),
    ).toHaveLength(1);
    const calls = h.clients.complete.mock.calls.filter(
      (c) => c[3] === ASSESSMENT_DRAFT_PROMPT,
    );
    expect((calls as any)[0][5].temperature).toBe(0.3);
    expect((calls as any)[1][5].temperature).toBe(0.4);
  });
  test('scoped inventory storage is idempotent and author-only', async () => {
    const h = harness();
    h.placements.findOne.mockResolvedValue({ module: { roadmapId: 'r1' } });
    await h.service.generateSingleConceptMcqs(
      { title: 'Ignored', conceptId: 'c1' },
      h.user,
    );
    expect(h.contexts.upsertCard).toHaveBeenCalledWith('r1', 'c1', {
      misconceptions: inventory,
    });
    h.cards.findOne.mockResolvedValue({ misconceptions: inventory });
    h.contexts.upsertCard.mockClear();
    await h.service.generateSingleConceptMcqs(
      { title: 'Ignored', conceptId: 'c1' },
      h.user,
    );
    expect(h.contexts.upsertCard).not.toHaveBeenCalled();
    h.concepts.findOne.mockResolvedValue({ authorId: 'other' });
    await expect(
      h.service.generateSingleConceptMcqs(
        { title: 'Ignored', conceptId: 'c1' },
        h.user,
      ),
    ).rejects.toThrow('Concept not found');
  });
  test.each(['runModuleMcqsJob', 'retryModuleMcqsJob'])(
    '%s shares pipeline, persists metadata, one slot across the job',
    async (method) => {
      const h = harness();
      h.modules.findOne.mockResolvedValue({
        roadmapId: 'r1',
        moduleConcepts: ['c1', 'c2'].map((id) => ({
          conceptId: id,
          concept: { id, title: id, content: 'FIFO' },
        })),
      });
      const qb: any = {};
      for (const name of ['select', 'addSelect', 'where', 'groupBy'])
        qb[name] = jest.fn(() => qb);
      qb.getRawMany = jest.fn(async () => []);
      h.questions.createQueryBuilder.mockReturnValue(qb);
      const args: any[] = ['job1', 'm1', h.user, 'Module'];
      if (method.startsWith('retry')) args.push(['c1', 'c2']);
      args.push(h.creds);
      const result = await (h.service as any)[method](...args);
      expect(result).toMatchObject({ createdCount: 2, failedCount: 0 });
      expect(
        h.logs.save.mock.calls.filter(([log]) => !log.internal),
      ).toHaveLength(1);
      expect(h.quota).toHaveBeenCalledTimes(1);
      expect(h.questions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          bloomLevel: 'Apply',
          lintResult: {
            passed: true,
            checks: expect.any(Array),
            correctPosition: 1,
            semanticCheck: 'verified',
          },
        }),
      );
      expect(h.options.create).toHaveBeenCalledWith(
        expect.objectContaining({
          misconception: inventory[0],
          distractorRationale: 'Does not remove oldest.',
        }),
      );
      expect(h.jobs.update).toHaveBeenCalledWith('job1', {
        progressCurrent: 2,
      });
    },
  );
  test('learner redaction excludes all key cues; legacy author response has no new nulls', async () => {
    const h = harness();
    h.questions.find.mockResolvedValue([
      {
        id: 'q1',
        conceptId: 'c1',
        questionText: 'Q?',
        orderIndex: 1,
        correctRationale: 'secret',
        verificationResult: { answerIndex: 0 },
        lintResult: { correctPosition: 1 },
        options: [
          {
            id: 'o1',
            optionText: 'A',
            isCorrect: true,
            misconception: null,
            distractorRationale: null,
          },
          {
            id: 'o2',
            optionText: 'B',
            isCorrect: false,
            misconception: 'Wrong',
            distractorRationale: 'secret',
          },
        ],
      },
    ]);
    const result = await h.quiz.getQuestionsForConcept(
      'c1',
      makeUser({ id: 'learner' }),
    );
    expect(JSON.stringify(result)).not.toMatch(
      /secret|isCorrect|Rationale|misconception|verification|lintResult|correctPosition/,
    );
    const author = await h.quiz.getQuestionsForConcept('c1', h.user);
    expect((author[0].options as any[])[0]).not.toHaveProperty('misconception');
  });
  test.each([undefined, 'false', 'TRUE', '1'])(
    'flag=%s leaves legacy MCQ bytes and provider calls unchanged',
    async (flag) => {
      const h = harness(flag ?? '');
      const original = [
        {
          questionText: 'Q?',
          options: [
            { optionText: 'A', isCorrect: true },
            { optionText: 'B', isCorrect: false },
          ],
        },
      ];
      h.clients.complete.mockResolvedValue({
        text: JSON.stringify({ questions: original }),
        tokensIn: 1,
        tokensOut: 2,
      });
      const result = await h.service.generateSingleConceptMcqs(
        { title: 'Queues' },
        h.user,
      );
      expect(result).toEqual({ rawText: JSON.stringify(original, null, 2) });
      expect(h.clients.complete).toHaveBeenCalledTimes(1);
      expect(h.registry.resolveSystem).not.toHaveBeenCalled();
      expect(h.cards.findOne).not.toHaveBeenCalled();
      expect(h.compilations.save).not.toHaveBeenCalled();
    },
  );
  test.each(['runModuleMcqsJob', 'retryModuleMcqsJob'])(
    '%s flag off keeps legacy writes and per-concept billing',
    async (method) => {
      const h = harness('false');
      h.modules.findOne.mockResolvedValue({
        roadmapId: 'r1',
        moduleConcepts: ['c1', 'c2'].map((id) => ({
          conceptId: id,
          concept: { id, title: id, content: 'FIFO' },
        })),
      });
      const qb: any = {};
      for (const name of ['select', 'addSelect', 'where', 'groupBy'])
        qb[name] = jest.fn(() => qb);
      qb.getRawMany = jest.fn(async () => []);
      h.questions.createQueryBuilder.mockReturnValue(qb);
      const args: any[] = ['job1', 'm1', h.user, 'Module'];
      if (method.startsWith('retry')) args.push(['c1', 'c2']);
      args.push(h.creds);
      const result = await (h.service as any)[method](...args);
      expect(result.createdCount).toBe(2);
      expect(h.quota).toHaveBeenCalledTimes(2);
      expect(
        h.logs.save.mock.calls.filter(([log]) => !log.internal),
      ).toHaveLength(2);
      expect(h.questions.create.mock.calls[0][0]).toEqual({
        conceptId: 'c1',
        questionText: q().questionText,
        orderIndex: 1,
        createdById: h.user.id,
      });
      expect(h.options.create.mock.calls[0][0]).toEqual({
        questionId: undefined,
        optionText: 'Dequeue',
        isCorrect: true,
        orderIndex: 1,
      });
      expect(h.compilations.save).not.toHaveBeenCalled();
      expect(h.contexts.upsertCard).not.toHaveBeenCalled();
    },
  );
  test('author draft round-trip persists metadata only when flag on', async () => {
    for (const flag of ['true', 'false']) {
      const h = harness(flag);
      const draft = {
        ...q(),
        lintResult: { passed: true },
        verificationResult: { agreed: true },
        orderIndex: 1,
        options: q().options.map((o, i) => ({ ...o, orderIndex: i })),
      };
      await h.quiz.createQuestion('c1', h.user, draft);
      if (flag === 'true') {
        expect(h.questions.create.mock.calls[0][0]).toMatchObject({
          bloomLevel: 'Apply',
          correctRationale: 'FIFO removes oldest.',
        });
        expect(h.options.create.mock.calls[1][0]).toMatchObject({
          misconception: inventory[0],
          distractorRationale: 'Does not remove oldest.',
        });
      } else {
        expect(h.questions.create.mock.calls[0][0]).not.toHaveProperty(
          'bloomLevel',
        );
        expect(h.options.create.mock.calls[1][0]).not.toHaveProperty(
          'misconception',
        );
      }
    }
  });
});
