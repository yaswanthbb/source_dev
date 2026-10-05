import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AiGenerateService } from './ai-generate.service';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { AiGenerationJob } from './entities/ai-generation-job.entity';
import { ConceptCompilation } from './entities/concept-compilation.entity';
import { CourseConceptCard } from './entities/course-concept-card.entity';
import { CourseTerm } from './entities/course-term.entity';
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
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser } from '../../common/testing/factories';

const OUTLINE = {
  title: 'Branches',
  objectives: ['Explain what a branch pointer is', 'Create a branch'],
  key_terms: [{ term: 'branch', definition: 'A movable pointer to a commit.' }],
  builds_on: [],
  recall_hooks: [],
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

describe('ConceptCompiler (§8 course compiler)', () => {
  let service: AiGenerateService;
  let logRepo: MockRepository;
  let compilationRepo: MockRepository;
  let cardRepo: MockRepository;
  let termRepo: MockRepository;
  let configGet: jest.Mock;
  let clients: { complete: jest.Mock; configuredDefaultModel: jest.Mock };
  let registry: { resolveSystem: jest.Mock };
  let contexts: {
    upsertTerm: jest.Mock;
    upsertCard: jest.Mock;
    addEdge: jest.Mock;
  };
  let conceptsService: { createConcept: jest.Mock };
  let roadmapsService: { attachConceptToModule: jest.Mock };
  let contextBuilder: { build: jest.Mock };
  let research: { retrieveForOutline: jest.Mock; findSource: jest.Mock };

  const developer = makeUser({ id: 'dev-1', role: UserRole.DEVELOPER });
  const creds = {
    provider: 'nvidia',
    apiKey: 'platform-key',
    model: 'strong-m',
    keyId: null,
    tier: 'free',
    limit: 5,
    unlimited: false,
  } as any;

  const baseInput = {
    jobId: 'job-1',
    title: 'Branches',
    difficulty: 'easy',
    roadmapId: 'r1',
    roadmapTitle: 'Git',
    moduleTitle: 'Branching',
    siblingTitles: [],
    publishConcept: true,
    moduleId: 'm1',
    user: developer,
    creds,
  } as any;

  function stagePayloads(
    overrides: {
      outline?: unknown;
      draft?: string;
      factcheck?: unknown;
      critique?: unknown;
      revise?: string;
      brief?: unknown;
    } = {},
  ) {
    const outline =
      overrides.outline !== undefined ? overrides.outline : OUTLINE;
    const draft = overrides.draft ?? '# Branches\n\nContent here.';
    const factcheck = overrides.factcheck ?? {
      consistent: true,
      outline_drift: [],
      term_issues: [],
    };
    const critique = overrides.critique ?? {
      blocking_issues: [],
      suggestions: ['add an example'],
    };
    const revise = overrides.revise ?? '# Branches\n\nRevised content.';
    const brief = overrides.brief ?? {
      brief: 'Branches are movable pointers.',
      key_points: ['pointer'],
    };
    clients.complete.mockImplementation(
      async (
        _provider: string,
        _key: string,
        _model: string,
        _system: string,
        userPrompt: string,
      ) => {
        const text = (payload: unknown) => ({
          text: typeof payload === 'string' ? payload : JSON.stringify(payload),
          tokensIn: 1,
          tokensOut: 2,
        });
        if (userPrompt.includes('Produce the outline JSON')) {
          return text(
            typeof outline === 'string' ? outline : JSON.stringify(outline),
          );
        }
        if (userPrompt.includes('Approved Outline (realize every section)')) {
          return text(draft);
        }
        if (userPrompt.includes('fact-check JSON')) return text(factcheck);
        if (userPrompt.includes('brief JSON')) return text(brief);
        if (userPrompt.includes('critique JSON')) return text(critique);
        if (userPrompt.includes('Must-fix')) return text(revise);
        return text('fallback');
      },
    );
  }

  beforeEach(async () => {
    configGet = jest.fn((key: string) => {
      if (key === 'COURSE_ENGINE_ENABLED') return 'true';
      if (key === 'NVIDIA_API_KEY') return 'platform-key';
      return undefined;
    });
    clients = {
      complete: jest.fn(),
      configuredDefaultModel: jest.fn(() => 'meta/llama-3.1-70b-instruct'),
    };
    registry = {
      resolveSystem: jest.fn(async (_task: string, fallback: string) => ({
        version: 'v-test',
        systemTemplate: fallback,
        fromRegistry: false,
      })),
    };
    contexts = {
      upsertTerm: jest.fn(async () => ({})),
      upsertCard: jest.fn(async () => ({})),
      addEdge: jest.fn(async () => ({})),
    };
    conceptsService = { createConcept: jest.fn(async () => ({ id: 'c-new' })) };
    roadmapsService = { attachConceptToModule: jest.fn(async () => ({})) };
    contextBuilder = {
      build: jest.fn(async () => ({
        block: '',
        stats: {
          termsUsed: 0,
          cardsUsed: 0,
          edgesUsed: 0,
          chars: 0,
          truncated: false,
        },
      })),
    };
    research = {
      retrieveForOutline: jest.fn(async () => ({ chunks: [], sourceIds: [] })),
      findSource: jest.fn(async () => null),
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
        { provide: ConfigService, useValue: { get: configGet } },
        { provide: RoadmapsService, useValue: roadmapsService },
        { provide: ConceptsService, useValue: conceptsService },
        { provide: QuizService, useValue: {} },
        {
          provide: AiKeysService,
          useValue: {
            getDefaultKey: jest.fn(),
            getKeyById: jest.fn(),
            decryptForUse: jest.fn(),
          },
        },
        { provide: AiProviderClients, useValue: clients },
        { provide: AiPromptRegistry, useValue: registry },
        {
          provide: NotificationsService,
          useValue: { notify: jest.fn(), safeNotify: jest.fn() },
        },
        { provide: CourseContextBuilder, useValue: contextBuilder },
        { provide: CourseContextService, useValue: contexts },
        { provide: CourseResearchService, useValue: research },
      ],
    }).compile();

    service = module.get(AiGenerateService);
    logRepo = module.get(getRepositoryToken(AiGenerationLog));
    compilationRepo = module.get(getRepositoryToken(ConceptCompilation));
    cardRepo = module.get(getRepositoryToken(CourseConceptCard));
    termRepo = module.get(getRepositoryToken(CourseTerm));
    const moduleRepo: MockRepository = module.get(
      getRepositoryToken(ModuleEntity),
    );
    const moduleConceptRepo: MockRepository = module.get(
      getRepositoryToken(ModuleConcept),
    );
    moduleRepo.find.mockResolvedValue([]);
    moduleConceptRepo.find.mockResolvedValue([]);

    compilationRepo.findOne.mockResolvedValue(null);
    cardRepo.find.mockResolvedValue([]);
    cardRepo.findOne.mockResolvedValue(null);
    termRepo.find.mockResolvedValue([
      { term: 'branch', definition: 'A movable pointer to a commit.' },
    ]);
    termRepo.findOne.mockResolvedValue(null);
  });

  afterEach(() => jest.clearAllMocks());

  function billableLogs() {
    return logRepo.save.mock.calls.filter((call) => call[0].internal !== true);
  }

  it('compiles cleanly: publishes, enriches the registry, bills one slot', async () => {
    stagePayloads();
    const out = await service.compileConcept(baseInput);

    expect(out.content).toContain('# Branches');
    expect(out.warnings).toEqual([]);
    expect(out.conceptId).toBe('c-new');
    expect(conceptsService.createConcept).toHaveBeenCalledTimes(1);
    expect(roadmapsService.attachConceptToModule).toHaveBeenCalledTimes(1);
    // Compounding loop: terms registered, card upserted.
    expect(contexts.upsertTerm).toHaveBeenCalledWith(
      'r1',
      'branch',
      'A movable pointer to a commit.',
    );
    expect(contexts.upsertCard).toHaveBeenCalledWith(
      'r1',
      'c-new',
      expect.objectContaining({ keyClaims: OUTLINE.objectives }),
    );
    // Quota: exactly one non-internal log (the draft).
    expect(billableLogs()).toHaveLength(1);
    expect(logRepo.save).toHaveBeenCalled();
    // Compilation trace persisted as succeeded.
    const lastSave =
      compilationRepo.save.mock.calls[
        compilationRepo.save.mock.calls.length - 1
      ][0];
    expect(lastSave.status).toBe('succeeded');
    expect(lastSave.stages.map((s: any) => s.stage)).toEqual([
      'outline',
      'research',
      'draft',
      'fact-check',
      'critique-revise',
      'validate',
      'publish',
    ]);
  });

  it('caps the critique→revise loop at 2 and publishes with warnings', async () => {
    stagePayloads({
      critique: { blocking_issues: ['fix the example'], suggestions: [] },
    });
    const out = await service.compileConcept(baseInput);

    const reviseCalls = clients.complete.mock.calls.filter((call) =>
      String(call[4]).includes('Must-fix'),
    );
    const critiqueCalls = clients.complete.mock.calls.filter((call) =>
      String(call[4]).includes('critique JSON'),
    );
    expect(reviseCalls).toHaveLength(2);
    expect(critiqueCalls).toHaveLength(3);
    expect(
      out.warnings.some((w) => w.includes('Unresolved blocking issue')),
    ).toBe(true);
    expect(out.conceptId).toBe('c-new');
    const lastSave =
      compilationRepo.save.mock.calls[
        compilationRepo.save.mock.calls.length - 1
      ][0];
    expect(lastSave.status).toBe('succeeded_with_warnings');
  });

  it('fails the concept when the outline references unknown builds_on ids', async () => {
    stagePayloads({
      outline: { ...OUTLINE, builds_on: ['ghost-id'] },
    });
    await expect(service.compileConcept(baseInput)).rejects.toThrow(
      'unknown concept id "ghost-id"',
    );
    const lastSave =
      compilationRepo.save.mock.calls[
        compilationRepo.save.mock.calls.length - 1
      ][0];
    expect(lastSave.status).toBe('failed');
    expect(conceptsService.createConcept).not.toHaveBeenCalled();
  });

  it('retries a malformed outline once, then fails', async () => {
    stagePayloads({ outline: 'not json at all' });
    await expect(service.compileConcept(baseInput)).rejects.toThrow();
    const outlineCalls = clients.complete.mock.calls.filter((call) =>
      String(call[4]).includes('Produce the outline JSON'),
    );
    expect(outlineCalls).toHaveLength(2);
  });

  it('re-runs update the same compilation row (retry idempotency)', async () => {
    stagePayloads();
    compilationRepo.findOne.mockResolvedValue({
      id: 'comp-1',
      jobId: 'job-1',
      title: 'Branches',
      status: 'failed',
      stages: [],
      warnings: [],
    });
    await service.compileConcept(baseInput);
    const saves = compilationRepo.save.mock.calls.map((call) => call[0]);
    expect(saves.length).toBeGreaterThan(0);
    for (const saved of saves) {
      expect(saved.id).toBe('comp-1');
    }
    expect(saves[saves.length - 1].status).toBe('succeeded');
  });

  it('flag off keeps the legacy single-shot shape (one call, {content})', async () => {
    configGet.mockImplementation((key: string) =>
      key === 'NVIDIA_API_KEY' ? 'platform-key' : undefined,
    );
    const keysService = (service as any).keysService;
    keysService.getDefaultKey.mockResolvedValue(null);
    logRepo.find.mockResolvedValue([]);
    clients.complete.mockResolvedValue({
      text: 'legacy article',
      tokensIn: 1,
      tokensOut: 2,
    });

    const out = await service.generateSingleConceptContent(
      { title: 'Branches' },
      developer,
    );
    expect(out).toEqual({ content: 'legacy article' });
    expect(clients.complete).toHaveBeenCalledTimes(1);
    const userPrompt = clients.complete.mock.calls[0][4];
    expect(userPrompt).not.toContain('Produce the outline JSON');
  });

  describe('research stage', () => {
    const chunk = (content: string) => ({
      id: `chunk-${content.length}`,
      sourceId: 's-mdn',
      content,
    });

    function draftOf(callIndex: number): string {
      const calls = clients.complete.mock.calls.filter((call) =>
        String(call[4]).includes('Approved Outline (realize every section)'),
      );
      return String(calls[callIndex][4]);
    }

    it('feeds the brief into draft + fact-check and records provenance', async () => {
      stagePayloads();
      research.retrieveForOutline.mockResolvedValue({
        chunks: [
          chunk('A closure bundles a function with its lexical environment.'),
        ],
        sourceIds: ['s-mdn'],
      });
      research.findSource.mockResolvedValue({ title: 'MDN Closures' });

      const out = await service.compileConcept(baseInput);

      expect(out.warnings).toEqual([]);
      expect(draftOf(0)).toContain('Branches are movable pointers.');
      const factcheckCall = clients.complete.mock.calls.find((call) =>
        String(call[4]).includes('fact-check JSON'),
      );
      expect(String(factcheckCall[4])).toContain(
        'Branches are movable pointers.',
      );
      const lastSave =
        compilationRepo.save.mock.calls[
          compilationRepo.save.mock.calls.length - 1
        ][0];
      const researchTrace = lastSave.stages.find(
        (s: any) => s.stage === 'research',
      );
      expect(researchTrace.ok).toBe(true);
      expect(researchTrace.detail.sourceIds).toEqual(['s-mdn']);
      expect(researchTrace.detail.mode).toBe('augmented');
    });

    it('degrades gracefully when retrieval fails (brief null, pipeline completes)', async () => {
      stagePayloads();
      research.retrieveForOutline.mockRejectedValue(
        new Error('embeddings down'),
      );

      const out = await service.compileConcept(baseInput);

      expect(out.content).toContain('# Branches');
      expect(out.warnings.some((w) => w.includes('Research unavailable'))).toBe(
        true,
      );
      expect(draftOf(0)).not.toContain('Private Research Brief');
      const lastSave =
        compilationRepo.save.mock.calls[
          compilationRepo.save.mock.calls.length - 1
        ][0];
      expect(lastSave.status).toBe('succeeded_with_warnings');
    });

    it('verbatim overlap warns and regenerates exactly once', async () => {
      const lifted = Array.from({ length: 30 }, (_, i) => `lifted${i}`).join(
        ' ',
      );
      const filler = Array.from({ length: 400 }, (_, i) => `filler${i}`).join(
        ' ',
      );
      stagePayloads({ draft: `# Branches\n\n${filler} ${lifted}` });
      research.retrieveForOutline.mockResolvedValue({
        chunks: [chunk(`intro ${lifted} outro`)],
        sourceIds: ['s-mdn'],
      });

      const out = await service.compileConcept(baseInput);

      expect(out.warnings.some((w) => w.includes('Verbatim overlap'))).toBe(
        true,
      );
      const regenCalls = clients.complete.mock.calls.filter((call) =>
        String(call[4]).includes('Paraphrase passages'),
      );
      expect(regenCalls).toHaveLength(1);
      // The regenerated (clean) draft is what publishes.
      expect(out.content).toContain('# Branches');
    });

    it('research telemetry is internal — the draft keeps the single slot', async () => {
      stagePayloads();
      research.retrieveForOutline.mockResolvedValue({
        chunks: [chunk('Some grounded fact about branches.')],
        sourceIds: ['s-mdn'],
      });

      await service.compileConcept(baseInput);

      const metas = logRepo.save.mock.calls.map((call) => call[0]);
      expect(metas.length).toBeGreaterThan(1);
      const billable = metas.filter((m) => m.internal !== true);
      expect(billable).toHaveLength(1);
    });
  });
});
