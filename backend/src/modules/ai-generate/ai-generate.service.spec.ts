import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';

import { AiGenerateService } from './ai-generate.service';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { AiGenerationJob } from './entities/ai-generation-job.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Module as ModuleEntity } from '../content/entities/module.entity';
import { Concept } from '../content/entities/concept.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { RoadmapsService } from '../content/roadmaps.service';
import { ConceptsService } from '../content/concepts.service';
import { QuizService } from '../quiz/quiz.service';
import { AiKeysService } from './ai-keys.service';
import { AiProviderClients } from './ai-provider-clients';
import { AiPromptRegistry } from './ai-prompt-registry.service';
import { CourseContextBuilder } from './course-context-builder.service';
import { CourseContextService } from './course-context.service';
import { CourseResearchService } from './course-research.service';
import { ConceptMedia } from './entities/concept-media.entity';
import { ConceptCompilation } from './entities/concept-compilation.entity';
import { CourseConceptCard } from './entities/course-concept-card.entity';
import { CourseTerm } from './entities/course-term.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AiProvider } from '../../common/enums/ai-provider.enum';
import { UserRole } from '../../common/enums/user-role.enum';

import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser } from '../../common/testing/factories';

describe('AiGenerateService', () => {
  let service: AiGenerateService;
  let logRepo: MockRepository;
  let configGet: jest.Mock;
  let keysService: {
    getDefaultKey: jest.Mock;
    getKeyById: jest.Mock;
    decryptForUse: jest.Mock;
  };
  let clients: {
    complete: jest.Mock;
    listModels: jest.Mock;
    configuredDefaultModel: jest.Mock;
  };
  let courseContext: { build: jest.Mock };
  let courseResearch: {
    retrieveForOutline: jest.Mock;
    findSource: jest.Mock;
    searchVideos: jest.Mock;
  };

  const developer = makeUser({ id: 'dev-1', role: UserRole.DEVELOPER });
  const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });

  const freeCreds = {
    provider: AiProvider.NVIDIA,
    apiKey: 'platform-key',
    model: 'meta/llama-3.1-70b-instruct',
    keyId: null,
    tier: 'free',
    limit: 5,
    unlimited: false,
  } as const;

  beforeEach(async () => {
    configGet = jest.fn();
    keysService = {
      getDefaultKey: jest.fn(),
      getKeyById: jest.fn(),
      decryptForUse: jest.fn(),
    };
    clients = {
      complete: jest.fn(),
      listModels: jest.fn(),
      configuredDefaultModel: jest.fn(
        (p: string) =>
          p === 'gemini' ? 'gemini-2.0-flash' : 'meta/llama-3.1-70b-instruct',
      ),
    };
    courseContext = { build: jest.fn() };
    courseResearch = {
      retrieveForOutline: jest.fn(async () => ({ chunks: [], sourceIds: [] })),
      findSource: jest.fn(async () => null),
      searchVideos: jest.fn(async () => []),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGenerateService,
        {
          provide: getRepositoryToken(AiGenerationLog),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(AiGenerationJob),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Roadmap),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ModuleEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Concept),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ModuleConcept),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(McqQuestion),
          useValue: createMockRepository(),
        },
        { provide: ConfigService, useValue: { get: configGet } },
        { provide: RoadmapsService, useValue: {} },
        { provide: ConceptsService, useValue: {} },
        { provide: QuizService, useValue: {} },
        { provide: AiKeysService, useValue: keysService },
        { provide: AiProviderClients, useValue: clients },
        {
          provide: AiPromptRegistry,
          useValue: { resolveSystem: jest.fn(), getProduction: jest.fn() },
        },
        {
          provide: NotificationsService,
          useValue: { notify: jest.fn(), safeNotify: jest.fn() },
        },
        { provide: CourseContextBuilder, useValue: courseContext },
        { provide: CourseResearchService, useValue: courseResearch },
        {
          provide: CourseContextService,
          useValue: {
            upsertTerm: jest.fn(),
            upsertCard: jest.fn(),
            addEdge: jest.fn(),
            ensureContextForRoadmap: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ConceptCompilation),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(CourseConceptCard),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(CourseTerm),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ConceptMedia),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(AiGenerateService);
    logRepo = module.get(getRepositoryToken(AiGenerationLog));
    // Compiler registry reads default to empty (specs override per case).
    const compilationRepo: MockRepository = module.get(
      getRepositoryToken(ConceptCompilation),
    );
    const cardRepo: MockRepository = module.get(
      getRepositoryToken(CourseConceptCard),
    );
    const termRepo: MockRepository = module.get(getRepositoryToken(CourseTerm));
    const moduleRepo: MockRepository = module.get(
      getRepositoryToken(ModuleEntity),
    );
    const moduleConceptRepo: MockRepository = module.get(
      getRepositoryToken(ModuleConcept),
    );
    compilationRepo.findOne.mockResolvedValue(null);
    cardRepo.find.mockResolvedValue([]);
    cardRepo.findOne.mockResolvedValue(null);
    termRepo.find.mockResolvedValue([]);
    termRepo.findOne.mockResolvedValue(null);
    moduleRepo.find.mockResolvedValue([]);
    moduleConceptRepo.find.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('cleanModelOutput', () => {
    const clean = (raw: string) => (service as any).cleanModelOutput(raw);

    it('strips a ```json fence', () => {
      expect(clean('```json\n[1,2]\n```')).toBe('[1,2]');
    });

    it('strips a bare ``` fence', () => {
      expect(clean('```\nhello\n```')).toBe('hello');
    });

    it('trims surrounding whitespace', () => {
      expect(clean('  spaced  ')).toBe('spaced');
    });

    it('leaves unfenced text untouched', () => {
      expect(clean('plain text')).toBe('plain text');
    });
  });

  describe('parseStringArray', () => {
    const parse = (raw: string) => (service as any).parseStringArray(raw);

    it('parses a clean JSON array, trimming and dropping non-strings', () => {
      expect(parse('["a", " b ", 3, ""]')).toEqual(['a', 'b']);
    });

    it('recovers an array embedded in surrounding prose', () => {
      expect(parse('Sure! ["x", "y"] done')).toEqual(['x', 'y']);
    });

    it('returns an empty array for non-array JSON', () => {
      expect(parse('{"not":"an array"}')).toEqual([]);
    });

    it('returns an empty array for unparseable garbage', () => {
      expect(parse('not json at all')).toEqual([]);
    });
  });

  describe('repairMalformedJson', () => {
    it('escapes stray backslashes so the result parses', () => {
      // Actual string contains a single backslash before "Users" (invalid escape).
      const broken = '{"title":"C:\\Users"}';
      const repaired = (service as any).repairMalformedJson(broken);

      expect(() => JSON.parse(repaired)).not.toThrow();
    });
  });

  describe('parseMcqQuestions', () => {
    const parse = (raw: string) =>
      (service as any).parseMcqQuestions(raw, 'Concept');

    it('accepts a direct array of questions', () => {
      const out = parse('[{"questionText":"q1"}]');
      expect(out).toHaveLength(1);
      expect(out[0].questionText).toBe('q1');
    });

    it('unwraps a { questions: [...] } object', () => {
      expect(parse('{"questions":[{"questionText":"q"}]}')).toHaveLength(1);
    });

    it('unwraps a { items: [...] } object', () => {
      expect(parse('{"items":[{"questionText":"q"}]}')).toHaveLength(1);
    });

    it('unwraps a { mcqs: [...] } object', () => {
      expect(parse('{"mcqs":[{"questionText":"q"}]}')).toHaveLength(1);
    });

    it('extracts JSON from a fenced block preceded by reasoning', () => {
      const raw =
        'Here is the JSON you asked for:\n```json\n{"questions":[{"questionText":"q"}]}\n```';
      expect(parse(raw)).toHaveLength(1);
    });

    it('repairs and parses malformed JSON with a stray backslash', () => {
      // Single backslash before "Temp" — invalid until repaired.
      const raw = '[{"questionText":"C:\\Temp"}]';
      const out = parse(raw);
      expect(out).toHaveLength(1);
      expect(out[0].questionText).toBe('C:\\Temp');
    });

    it('returns null when nothing parses', () => {
      jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => undefined);

      expect(parse('totally unparseable')).toBeNull();
    });
  });

  describe('checkRateLimit — per-bucket quotas (§5)', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00.000Z'));
    });

    const logRows = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: `log-${i}`,
        generatedAt: new Date('2026-08-25T10:00:00.000Z'),
      }));

    it('counts the free bucket (5/day) against unkeyed logs only', async () => {
      logRepo.find.mockResolvedValue(logRows(3));

      await expect(
        service.checkRateLimit('u1', 1, 'UTC', { ...freeCreds } as any),
      ).resolves.toEqual({ remaining: 2, limit: 5, unlimited: false });
      expect(logRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'u1',
            providerKeyId: expect.anything(),
          }),
        }),
      );
    });

    it('throws a unified 429 pointing at BYOK on the free tier', async () => {
      logRepo.find.mockResolvedValue(logRows(5));

      const err = await service
        .checkRateLimit('u1', 1, 'UTC', { ...freeCreds } as any)
        .catch((e) => e);

      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(429);
      expect((err.getResponse() as any).message).toContain('own key');
    });

    it('counts each own-key bucket separately with its own cap', async () => {
      logRepo.find.mockResolvedValue(logRows(19));
      const ownCreds = {
        ...freeCreds,
        keyId: 'key-1',
        tier: 'own-key',
        limit: 20,
      };

      await expect(
        service.checkRateLimit('u1', 1, 'UTC', ownCreds as any),
      ).resolves.toEqual({ remaining: 1, limit: 20, unlimited: false });
    });

    it('points at the cap (max 50) when an own-key bucket is exhausted', async () => {
      logRepo.find.mockResolvedValue(logRows(20));
      const ownCreds = {
        ...freeCreds,
        keyId: 'key-1',
        tier: 'own-key',
        limit: 20,
      };

      const err = await service
        .checkRateLimit('u1', 1, 'UTC', ownCreds as any)
        .catch((e) => e);

      expect(err.getStatus()).toBe(429);
      expect((err.getResponse() as any).message).toContain('max 50');
    });

    it('rejects a batch that cannot fit in the remaining quota', async () => {
      logRepo.find.mockResolvedValue(logRows(4)); // remaining 1

      const err = await service
        .checkRateLimit('u1', 3, 'UTC', { ...freeCreds } as any)
        .catch((e) => e);

      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(429);
      expect((err.getResponse() as any).message).toContain('batch operation');
    });

    it('skips checks entirely for unlimited (admin) credentials', async () => {
      await expect(
        service.checkRateLimit('admin-1', 100, 'UTC', {
          ...freeCreds,
          tier: 'admin',
          unlimited: true,
        } as any),
      ).resolves.toEqual({ remaining: -1, limit: -1, unlimited: true });
      expect(logRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('resolveCredentials (§5)', () => {
    beforeEach(() => {
      configGet.mockImplementation((key: string) =>
        key === 'NVIDIA_API_KEY' ? 'platform-key' : undefined,
      );
      keysService.getDefaultKey.mockResolvedValue(null);
      clients.listModels.mockResolvedValue({ models: ['m1'], live: true });
    });

    it('resolves the free NVIDIA tier when no default key exists', async () => {
      const creds = await service.resolveCredentials(developer as any);

      expect(creds).toMatchObject({
        provider: AiProvider.NVIDIA,
        keyId: null,
        tier: 'free',
        limit: 5,
        unlimited: false,
      });
    });

    it('rejects Gemini on the free tier (BYOK-only)', async () => {
      await expect(
        service.resolveCredentials(developer as any, {
          provider: AiProvider.GEMINI,
        }),
      ).rejects.toThrow('own key only');
    });

    it('uses the default key and validates the requested model live', async () => {
      keysService.getDefaultKey.mockResolvedValue({
        id: 'key-1',
        provider: AiProvider.NVIDIA,
        dailyLimit: 20,
      });
      keysService.decryptForUse.mockReturnValue('user-key');
      clients.listModels.mockResolvedValue({ models: ['m1', 'm2'], live: true });

      const creds = await service.resolveCredentials(developer as any, {
        model: 'm2',
      });

      expect(creds).toMatchObject({
        keyId: 'key-1',
        tier: 'own-key',
        limit: 20,
        model: 'm2',
      });
      expect(clients.listModels).toHaveBeenCalledWith(
        AiProvider.NVIDIA,
        'user-key',
      );
    });

    it('rejects a provider that conflicts with the default key', async () => {
      keysService.getDefaultKey.mockResolvedValue({
        id: 'key-1',
        provider: AiProvider.NVIDIA,
        dailyLimit: 20,
      });

      await expect(
        service.resolveCredentials(developer as any, {
          provider: AiProvider.GEMINI,
        }),
      ).rejects.toThrow('does not match your default');
    });

    it('rejects an unknown model', async () => {
      keysService.getDefaultKey.mockResolvedValue({
        id: 'key-1',
        provider: AiProvider.NVIDIA,
        dailyLimit: 20,
      });
      keysService.decryptForUse.mockReturnValue('user-key');
      clients.listModels.mockResolvedValue({ models: ['m1'], live: true });

      await expect(
        service.resolveCredentials(developer as any, { model: 'nope' }),
      ).rejects.toThrow('Unknown model');
    });

    it('prefers request model, then the key default, then provider default', async () => {
      keysService.getDefaultKey.mockResolvedValue({
        id: 'key-1',
        provider: AiProvider.NVIDIA,
        dailyLimit: 20,
        defaultModel: 'key-default',
      });
      keysService.decryptForUse.mockReturnValue('user-key');
      clients.listModels.mockResolvedValue({
        models: ['key-default', 'other'],
        live: true,
      });

      const viaKey = await service.resolveCredentials(developer as any);
      expect(viaKey.model).toBe('key-default');

      const viaRequest = await service.resolveCredentials(developer as any, {
        model: 'other',
      });
      expect(viaRequest.model).toBe('other');
    });

    it('resolves admins as unlimited (default key when set)', async () => {
      keysService.getDefaultKey.mockResolvedValue({
        id: 'key-9',
        provider: AiProvider.GEMINI,
        dailyLimit: 50,
      });
      keysService.decryptForUse.mockReturnValue('admin-key');

      const creds = await service.resolveCredentials(admin as any);

      expect(creds).toMatchObject({
        provider: AiProvider.GEMINI,
        tier: 'admin',
        unlimited: true,
      });
    });

    it('fails when the platform key is missing and no default exists', async () => {
      configGet.mockReturnValue(undefined);

      await expect(
        service.resolveCredentials(developer as any),
      ).rejects.toThrow('not configured');
    });
  });

  describe('readQuota — non-throwing badge read (§8 batch item 2b)', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00.000Z'));
    });

    const logRows = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: `log-${i}`,
        generatedAt: new Date('2026-08-25T10:00:00.000Z'),
      }));

    it('returns zeros at exhaustion instead of throwing', async () => {
      logRepo.find.mockResolvedValue(logRows(5));

      await expect(
        service.readQuota('u1', 'UTC', { ...freeCreds } as any),
      ).resolves.toEqual({ remaining: 0, limit: 5, unlimited: false });
    });
  });

  describe('systemFor — COURSE_ENGINE flag (§8 batch item 4)', () => {
    let registry: { resolveSystem: jest.Mock };

    beforeEach(() => {
      registry = (service as any).promptRegistry;
      registry.resolveSystem.mockReset();
    });

    it('uses the legacy constant with the flag off (default)', async () => {
      configGet.mockReturnValue(undefined);

      await expect(
        (service as any).systemFor('concept_content', 'STATIC'),
      ).resolves.toEqual({ text: 'STATIC', version: 'legacy-static' });
      expect(registry.resolveSystem).not.toHaveBeenCalled();
    });

    it('reads the registry with the flag on', async () => {
      configGet.mockImplementation((key: string) =>
        key === 'COURSE_ENGINE_ENABLED' ? 'true' : undefined,
      );
      registry.resolveSystem.mockResolvedValue({
        version: '2.0.0',
        systemTemplate: 'REGISTRY',
        fromRegistry: true,
      });

      await expect(
        (service as any).systemFor('concept_content', 'STATIC'),
      ).resolves.toEqual({ text: 'REGISTRY', version: '2.0.0' });
    });
  });

  describe('promptVersion logging (§8 batch item 4)', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00.000Z'));
      configGet.mockImplementation((key: string) =>
        key === 'NVIDIA_API_KEY' ? 'platform-key' : undefined,
      );
      keysService.getDefaultKey.mockResolvedValue(null);
      logRepo.find.mockResolvedValue([]);
      clients.listModels.mockResolvedValue({ models: ['m'], live: false });
      clients.complete.mockResolvedValue({
        text: 'answer',
        tokensIn: 10,
        tokensOut: 20,
      });
    });

    it('logs prompt version, model, provider and telemetry on every call', async () => {
      await service.generateQaAnswer('T', 'C', 'What is this about?', developer as any);

      expect(logRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          promptVersion: 'legacy-static',
          model: 'meta/llama-3.1-70b-instruct',
          tokensIn: 10,
          tokensOut: 20,
        }),
      );
      const saved = logRepo.save.mock.calls[0][0];
      expect(typeof saved.latencyMs).toBe('number');
    });
  });

  describe('single concept content via compiler (§8 course compiler)', () => {
    const roadmapId = '11111111-1111-4111-8111-111111111111';
    const conceptId = '22222222-2222-4222-8222-222222222222';

    const outline = {
      title: 'Branches',
      objectives: ['Explain what a branch pointer is'],
      key_terms: [],
      builds_on: [],
      recall_hooks: [],
      diagrams: [],
      lesson_shape: {
        hook: 'h',
        intuition: 'i',
        definition: 'd',
        worked_example: 'w',
        faded_practice: 'f',
        retrieval_questions: 'r',
      },
      difficulty: 'easy',
      research_brief: null,
    };

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00.000Z'));
      configGet.mockImplementation((key: string) => {
        if (key === 'NVIDIA_API_KEY') return 'platform-key';
        if (key === 'COURSE_ENGINE_ENABLED') return 'true';
        return undefined;
      });
      const registry = (service as any).promptRegistry;
      registry.resolveSystem.mockResolvedValue({
        version: 'legacy-static',
        systemTemplate: 'SYS',
        fromRegistry: false,
      });
      keysService.getDefaultKey.mockResolvedValue(null);
      logRepo.find.mockResolvedValue([]);
      clients.listModels.mockResolvedValue({ models: ['m'], live: false });
      clients.complete.mockImplementation(
        async (
          _provider: string,
          _key: string,
          _model: string,
          _system: string,
          userPrompt: string,
        ) => {
          if (String(userPrompt).includes('Produce the outline JSON')) {
            return { text: JSON.stringify(outline), tokensIn: 1, tokensOut: 2 };
          }
          if (String(userPrompt).includes('fact-check JSON')) {
            return {
              text: JSON.stringify({
                consistent: true,
                outline_drift: [],
                term_issues: [],
              }),
              tokensIn: 1,
              tokensOut: 2,
            };
          }
          if (String(userPrompt).includes('critique JSON')) {
            return {
              text: JSON.stringify({ blocking_issues: [], suggestions: [] }),
              tokensIn: 1,
              tokensOut: 2,
            };
          }
          return { text: 'article', tokensIn: 1, tokensOut: 2 };
        },
      );
      courseContext.build.mockResolvedValue({ block: '', stats: {} });
    });

    function draftPrompt(): string {
      const call = clients.complete.mock.calls.find((c) =>
        String(c[4]).includes('Approved Outline (realize every section)'),
      );
      expect(call).toBeDefined();
      return String(call[4]);
    }

    it('appends the context block to the draft when flag on and roadmapId set', async () => {
      courseContext.build.mockResolvedValue({
        block: '[Course context — concept_content]\nTerms:\n- branch: pointer',
        stats: { termsUsed: 1 },
      });

      await service.generateSingleConceptContent(
        { title: 'Branches', roadmapId, conceptId } as any,
        developer as any,
      );

      expect(courseContext.build).toHaveBeenCalledWith(
        'concept_content',
        roadmapId,
        { conceptId },
      );
      expect(draftPrompt()).toContain('[Course context — concept_content]');
    });

    it('skips the builder entirely with the flag off (legacy behavior)', async () => {
      configGet.mockImplementation((key: string) =>
        key === 'NVIDIA_API_KEY' ? 'platform-key' : undefined,
      );
      const registry = (service as any).promptRegistry;
      registry.resolveSystem.mockResolvedValue({
        version: 'legacy-static',
        systemTemplate: 'SYS',
        fromRegistry: false,
      });

      await service.generateSingleConceptContent(
        { title: 'Branches', roadmapId, conceptId } as any,
        developer as any,
      );

      expect(courseContext.build).not.toHaveBeenCalled();
      const userPrompt = clients.complete.mock.calls[0][4];
      expect(userPrompt).not.toContain('[Course context');
    });

    it('drafts without the block when the builder throws (outline still carries)', async () => {
      courseContext.build.mockRejectedValue(new Error('context down'));

      await expect(
        service.generateSingleConceptContent(
          { title: 'Branches', roadmapId, conceptId } as any,
          developer as any,
        ),
      ).resolves.toEqual({ content: 'article' });
      expect(draftPrompt()).not.toContain('[Course context');
      expect(draftPrompt()).toContain('Approved Outline (realize every section)');
    });
  });

  describe('per-task model routing (§8)', () => {
    const retiredError = () =>
      new HttpException(
        {
          statusCode: 502,
          message: 'Model "old" is not available (likely retired).',
          error: 'Bad Gateway',
          code: 'MODEL_RETIRED',
        },
        502,
      );

    const flagOn = (extra: Record<string, string> = {}) => {
      configGet.mockImplementation((key: string) => {
        if (key === 'COURSE_ENGINE_ENABLED') return 'true';
        if (key === 'NVIDIA_API_KEY') return 'platform-key';
        return extra[key];
      });
    };

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00.000Z'));
      keysService.getDefaultKey.mockResolvedValue(null);
      keysService.decryptForUse.mockReturnValue('decrypted');
      logRepo.find.mockResolvedValue([]);
      clients.listModels.mockResolvedValue({ models: ['m'], live: false });
      clients.complete.mockResolvedValue({
        text: 'answer',
        tokensIn: 1,
        tokensOut: 2,
      });
    });

    it('precedence: explicit model beats key default beats task default beats global', async () => {
      flagOn({ NVIDIA_STRONG_MODEL_ID: 'strong-m' });
      clients.listModels.mockResolvedValue({
        models: ['explicit-m', 'key-default', 'strong-m'],
        live: true,
      });
      keysService.getDefaultKey.mockResolvedValue({
        id: 'k1',
        provider: 'nvidia',
        defaultModel: 'key-default',
        dailyLimit: 10,
      });

      // Explicit wins over everything.
      await expect(
        service.resolveCredentials(developer as any, {
          model: 'explicit-m',
          taskKey: 'concept_draft',
        }),
      ).resolves.toMatchObject({ model: 'explicit-m' });

      // Key default wins over the task default.
      await expect(
        service.resolveCredentials(developer as any, {
          taskKey: 'concept_draft',
        }),
      ).resolves.toMatchObject({ model: 'key-default' });

      // Task default applies with no explicit or key default.
      keysService.getDefaultKey.mockResolvedValue(null);
      await expect(
        service.resolveCredentials(developer as any, {
          taskKey: 'concept_draft',
        }),
      ).resolves.toMatchObject({ model: 'strong-m' });

      // Global default when no task key is given.
      await expect(
        service.resolveCredentials(developer as any),
      ).resolves.toMatchObject({ model: 'meta/llama-3.1-70b-instruct' });
    });

    it('flag off ignores the task key entirely (byte-identical resolution)', async () => {
      configGet.mockImplementation((key: string) =>
        key === 'NVIDIA_API_KEY' ? 'platform-key' : undefined,
      );
      await expect(
        service.resolveCredentials(developer as any, {
          taskKey: 'concept_draft',
        }),
      ).resolves.toMatchObject({ model: 'meta/llama-3.1-70b-instruct' });
      expect((service as any).routeParams('concept_draft', {
        maxTokens: 1,
        temperature: 0.1,
      })).toEqual({ maxTokens: 1, temperature: 0.1 });
    });

    it('advances the chain on a retired model and records what served', async () => {
      flagOn({ NVIDIA_STRONG_MODEL_ID: 'strong-m' });
      clients.complete
        .mockRejectedValueOnce(retiredError())
        .mockResolvedValue({ text: 'ok', tokensIn: 1, tokensOut: 2 });

      const creds = await service.resolveCredentials(developer as any, {
        taskKey: 'concept_draft',
      });
      expect(creds.model).toBe('strong-m');

      const out = await service.complete(
        creds,
        'sys',
        'user',
        { maxTokens: 10, temperature: 0 },
        'concept_draft',
      );
      expect(out.model).toBe('meta/llama-3.1-70b-instruct');
      expect(clients.complete).toHaveBeenCalledTimes(2);
      expect(clients.complete.mock.calls[0][2]).toBe('strong-m');
      expect(clients.complete.mock.calls[1][2]).toBe(
        'meta/llama-3.1-70b-instruct',
      );
    });

    it('throws immediately on non-retired errors without touching the chain', async () => {
      flagOn({ NVIDIA_STRONG_MODEL_ID: 'strong-m' });
      clients.complete.mockRejectedValue(new Error('transport down'));
      const creds = await service.resolveCredentials(developer as any, {
        taskKey: 'concept_draft',
      });
      await expect(
        service.complete(creds, 'sys', 'user', undefined, 'concept_draft'),
      ).rejects.toThrow('transport down');
      expect(clients.complete).toHaveBeenCalledTimes(1);
    });

    it('flag off makes a single attempt even on retired models', async () => {
      configGet.mockImplementation((key: string) =>
        key === 'NVIDIA_API_KEY' ? 'platform-key' : undefined,
      );
      clients.complete.mockRejectedValue(retiredError());
      const creds = await service.resolveCredentials(developer as any);
      await expect(
        service.complete(creds, 'sys', 'user', undefined, 'concept_draft'),
      ).rejects.toMatchObject({ status: 502 });
      expect(clients.complete).toHaveBeenCalledTimes(1);
    });
  });
});
