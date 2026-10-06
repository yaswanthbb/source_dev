import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AiGenerateService } from './ai-generate.service';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { AiGenerationJob } from './entities/ai-generation-job.entity';
import { ConceptCompilation } from './entities/concept-compilation.entity';
import { ConceptMedia } from './entities/concept-media.entity';
import { CourseConceptCard } from './entities/course-concept-card.entity';
import { CourseTerm } from './entities/course-term.entity';
import { AiPromptVersion } from './entities/ai-prompt-version.entity';
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
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import { AiPromptStatus } from '../../common/enums/ai-prompt-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser } from '../../common/testing/factories';

/**
 * Stage-distinct prompt wiring, tested UNMOCKED at the seam that was broken:
 * the real AiPromptRegistry (backed by a stub repository holding one row
 * per stage task) serves AiGenerateService.compileConcept. The only stubs
 * are I/O boundaries (provider clients, DB repos, sibling services).
 * If any stage regresses to systemFor(CONCEPT_CONTENT, ...), its fired
 * system prompt won't match its task's template and the test fails.
 */
describe('stage-distinct prompts (unmocked registry integration)', () => {
  let service: AiGenerateService;
  let logRepo: MockRepository;
  let clients: {
    complete: jest.Mock;
    configuredDefaultModel: jest.Mock;
    listModels: jest.Mock;
  };

  const STAGE_TASKS = [
    AiGenerationType.CONCEPT_OUTLINE,
    AiGenerationType.CONCEPT_DRAFT,
    AiGenerationType.CONCEPT_FACTCHECK,
    AiGenerationType.CONCEPT_CRITIQUE,
    AiGenerationType.CONCEPT_REVISE,
  ] as const;

  // Deliberately NOT '1.0.0': keeps the boot seed-integrity check silent
  // (it only compares stored v1 rows) while proving version flow per stage.
  const STAGE_VERSION = '9.9.9-stage';
  const templateFor = (task: string) => `STAGE-TEMPLATE-FOR-${task}`;

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

  function systemPrompts(): string[] {
    return clients.complete.mock.calls.map((call) => String(call[3]));
  }

  function promptFor(userMarker: string): string {
    const call = clients.complete.mock.calls.find((c) =>
      String(c[4]).includes(userMarker),
    );
    expect(call).toBeDefined();
    return String(call[3]);
  }

  beforeEach(async () => {
    const rows = STAGE_TASKS.map((task) => ({
      task,
      version: STAGE_VERSION,
      systemTemplate: templateFor(task),
      status: AiPromptStatus.PRODUCTION,
    }));
    const promptVersionRepo = createMockRepository();
    promptVersionRepo.findOne.mockImplementation(async (opts: any) => {
      const where = opts?.where ?? {};
      return (
        rows.find((row) =>
          Object.entries(where).every(
            ([key, value]) => (row as any)[key] === value,
          ),
        ) ?? null
      );
    });

    clients = {
      complete: jest.fn(async () => ({
        text: 'fallback',
        tokensIn: 1,
        tokensOut: 2,
      })),
      configuredDefaultModel: jest.fn(() => 'strong-m'),
      listModels: jest.fn(async () => ({ models: ['strong-m'], live: false })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGenerateService,
        { provide: getRepositoryToken(AiGenerationLog), useValue: createMockRepository() },
        { provide: getRepositoryToken(AiGenerationJob), useValue: createMockRepository() },
        { provide: getRepositoryToken(Roadmap), useValue: createMockRepository() },
        { provide: getRepositoryToken(ModuleEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(Concept), useValue: createMockRepository() },
        { provide: getRepositoryToken(ModuleConcept), useValue: createMockRepository() },
        { provide: getRepositoryToken(McqQuestion), useValue: createMockRepository() },
        { provide: getRepositoryToken(ConceptCompilation), useValue: createMockRepository() },
        { provide: getRepositoryToken(ConceptMedia), useValue: createMockRepository() },
        { provide: getRepositoryToken(CourseConceptCard), useValue: createMockRepository() },
        { provide: getRepositoryToken(CourseTerm), useValue: createMockRepository() },
        // Real registry — the seam under test. Only the repository is a stub.
        AiPromptRegistry,
        { provide: getRepositoryToken(AiPromptVersion), useValue: promptVersionRepo },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'COURSE_ENGINE_ENABLED') return 'true';
              if (key === 'NVIDIA_API_KEY') return 'platform-key';
              return undefined;
            },
          },
        },
        { provide: RoadmapsService, useValue: {} },
        { provide: ConceptsService, useValue: {} },
        { provide: QuizService, useValue: {} },
        {
          provide: AiKeysService,
          useValue: { getDefaultKey: jest.fn(), getKeyById: jest.fn(), decryptForUse: jest.fn() },
        },
        { provide: AiProviderClients, useValue: clients },
        { provide: NotificationsService, useValue: { notify: jest.fn(), safeNotify: jest.fn() } },
        {
          provide: CourseContextBuilder,
          useValue: {
            build: jest.fn(async () => ({
              block: '',
              stats: { termsUsed: 0, cardsUsed: 0, edgesUsed: 0, chars: 0, truncated: false },
            })),
          },
        },
        {
          provide: CourseContextService,
          useValue: { upsertTerm: jest.fn(), upsertCard: jest.fn(), addEdge: jest.fn() },
        },
        {
          provide: CourseResearchService,
          useValue: {
            retrieveForOutline: jest.fn(async () => ({ chunks: [], sourceIds: [] })),
            findSource: jest.fn(async () => null),
            searchVideos: jest.fn(async () => []),
          },
        },
      ],
    }).compile();

    service = module.get(AiGenerateService);
    logRepo = module.get(getRepositoryToken(AiGenerationLog));
    const compilationRepo: MockRepository = module.get(
      getRepositoryToken(ConceptCompilation),
    );
    compilationRepo.findOne.mockResolvedValue(null);
    const cardRepo: MockRepository = module.get(
      getRepositoryToken(CourseConceptCard),
    );
    cardRepo.find.mockResolvedValue([]);
    cardRepo.findOne.mockResolvedValue(null);
    const termRepo: MockRepository = module.get(getRepositoryToken(CourseTerm));
    termRepo.find.mockResolvedValue([]);
    const moduleRepo: MockRepository = module.get(
      getRepositoryToken(ModuleEntity),
    );
    moduleRepo.find.mockResolvedValue([]);
    const moduleConceptRepo: MockRepository = module.get(
      getRepositoryToken(ModuleConcept),
    );
    moduleConceptRepo.find.mockResolvedValue([]);

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
        const prompt = String(userPrompt);
        if (prompt.includes('Produce the outline JSON')) {
          return text(outline);
        }
        if (prompt.includes('Approved Outline (realize every section)')) {
          return text('# Branches\n\nDraft body.');
        }
        if (prompt.includes('fact-check JSON')) {
          return text({ consistent: true, outline_drift: [], term_issues: [] });
        }
        if (prompt.includes('critique JSON')) {
          return text({ blocking_issues: ['tighten the example'], suggestions: [] });
        }
        if (prompt.includes('Must-fix')) {
          return text('# Branches\n\nRevised body.');
        }
        return text('fallback');
      },
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('each compiler stage fires its own task template (not shared content)', async () => {
    await service.compileConcept({
      jobId: 'job-1',
      title: 'Branches',
      difficulty: 'easy',
      roadmapId: 'r1',
      siblingTitles: [],
      publishConcept: false,
      user: developer,
      creds,
    } as any);

    // One blocking issue forces the revise path, so all five fire.
    expect(promptFor('Produce the outline JSON')).toContain(
      templateFor(AiGenerationType.CONCEPT_OUTLINE),
    );
    expect(promptFor('Approved Outline (realize every section)')).toContain(
      templateFor(AiGenerationType.CONCEPT_DRAFT),
    );
    expect(promptFor('fact-check JSON')).toContain(
      templateFor(AiGenerationType.CONCEPT_FACTCHECK),
    );
    expect(promptFor('critique JSON')).toContain(
      templateFor(AiGenerationType.CONCEPT_CRITIQUE),
    );
    expect(promptFor('Must-fix')).toContain(
      templateFor(AiGenerationType.CONCEPT_REVISE),
    );
    // No stage fell back to the shared static constant.
    for (const fired of systemPrompts()) {
      expect(fired).not.toContain('principal engineer and master technical educator');
    }
  });

  it('every logged call carries its stage row version', async () => {
    await service.compileConcept({
      jobId: 'job-1',
      title: 'Branches',
      difficulty: 'easy',
      roadmapId: 'r1',
      siblingTitles: [],
      publishConcept: false,
      user: developer,
      creds,
    } as any);

    expect(logRepo.save).toHaveBeenCalled();
    for (const call of logRepo.save.mock.calls) {
      expect(call[0].promptVersion).toBe(STAGE_VERSION);
    }
  });
});
