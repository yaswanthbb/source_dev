import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { QaService } from './qa.service';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { Concept } from '../content/entities/concept.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { AiGenerateService } from '../ai-generate/ai-generate.service';

import { UserRole } from '../../common/enums/user-role.enum';
import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';
import { RoadmapReviewStatus } from '../../common/enums/roadmap-review-status.enum';

import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser, makeConcept } from '../../common/testing/factories';

describe('QaService', () => {
  let service: QaService;
  let questionRepo: MockRepository;
  let answerRepo: MockRepository;
  let conceptRepo: MockRepository;
  let moduleConceptRepo: MockRepository;
  let aiService: { generateQaAnswer: jest.Mock };

  const asker = makeUser({ role: UserRole.DEVELOPER }); // id: user-1
  const otherDeveloper = makeUser({
    id: 'developer-2',
    role: UserRole.DEVELOPER,
  });
  const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });

  beforeEach(async () => {
    aiService = { generateQaAnswer: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QaService,
        {
          provide: getRepositoryToken(Question),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Answer),
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
        { provide: AiGenerateService, useValue: aiService },
      ],
    }).compile();

    service = module.get(QaService);
    questionRepo = module.get(getRepositoryToken(Question));
    answerRepo = module.get(getRepositoryToken(Answer));
    conceptRepo = module.get(getRepositoryToken(Concept));
    moduleConceptRepo = module.get(getRepositoryToken(ModuleConcept));
    // Default: every concept sits in a published roadmap (visible).
    // Invisibility tests override this with [].
    moduleConceptRepo.find.mockResolvedValue([
      { module: { roadmap: { reviewStatus: RoadmapReviewStatus.PUBLISHED } } },
    ]);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createQuestion', () => {
    const dto: any = { body: 'How does this work?' };

    it('throws NotFound when the concept does not exist', async () => {
      conceptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createQuestion('c1', asker, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(questionRepo.save).not.toHaveBeenCalled();
    });

    it('returns 404 when the asker cannot see the concept', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({
          id: 'c1',
          authorId: 'someone-else',
          reviewStatus: ConceptReviewStatus.PENDING,
        }),
      );
      moduleConceptRepo.find.mockResolvedValue([]);

      await expect(
        service.createQuestion('c1', asker, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(questionRepo.save).not.toHaveBeenCalled();
    });

    it('saves a plain discussion question without invoking the AI', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ id: 'c1', reviewStatus: ConceptReviewStatus.APPROVED }),
      );

      await service.createQuestion('c1', asker, dto);

      expect(questionRepo.create).toHaveBeenCalledWith({
        conceptId: 'c1',
        askerId: asker.id,
        body: dto.body,
      });
      expect(aiService.generateQaAnswer).not.toHaveBeenCalled();
      expect(answerRepo.save).not.toHaveBeenCalled();
    });

    it('generates and attaches a private AI answer when target is "ai"', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({
          id: 'c1',
          title: 'Loops',
          content: 'Loop content',
          reviewStatus: ConceptReviewStatus.APPROVED,
        }),
      );
      questionRepo.save.mockImplementation(async (q: any) => ({
        ...q,
        id: 'q-new',
      }));
      aiService.generateQaAnswer.mockResolvedValue('The AI answer.');

      const result = await service.createQuestion('c1', asker, {
        body: 'Why loops?',
        target: 'ai',
      } as any);

      expect(aiService.generateQaAnswer).toHaveBeenCalledWith(
        'Loops',
        'Loop content',
        'Why loops?',
        asker,
      );
      expect(answerRepo.create).toHaveBeenCalledWith({
        questionId: 'q-new',
        responderId: null,
        body: 'The AI answer.',
        isAiAnswer: true,
      });
      expect(answerRepo.save).toHaveBeenCalledTimes(1);
      expect(result.answers).toHaveLength(1);
    });
  });

  describe('getQuestionsForConcept — discussion with private AI answers', () => {
    const discussionFixture = () => [
      {
        id: 'q1',
        conceptId: 'c1',
        askerId: 'user-1',
        asker: { name: 'Sam' },
        body: 'Q?',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        updatedAt: new Date('2026-08-01T00:00:00.000Z'),
        answers: [
          {
            id: 'a-late',
            questionId: 'q1',
            responderId: 'developer-2',
            responder: { name: 'Dev' },
            isAiAnswer: false,
            isVerified: false,
            body: 'human',
            createdAt: new Date('2026-08-03T00:00:00.000Z'),
            updatedAt: new Date('2026-08-03T00:00:00.000Z'),
          },
          {
            id: 'a-early',
            questionId: 'q1',
            responderId: null,
            responder: null,
            isAiAnswer: true,
            isVerified: false,
            body: 'ai',
            createdAt: new Date('2026-08-02T00:00:00.000Z'),
            updatedAt: new Date('2026-08-02T00:00:00.000Z'),
          },
          {
            id: 'a-verified',
            questionId: 'q1',
            responderId: 'developer-3',
            responder: { name: 'Rae' },
            isAiAnswer: false,
            isVerified: true,
            body: 'verified human',
            createdAt: new Date('2026-08-04T00:00:00.000Z'),
            updatedAt: new Date('2026-08-04T00:00:00.000Z'),
          },
        ],
      },
    ];

    it('throws NotFound when the concept is missing', async () => {
      conceptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getQuestionsForConcept('c1', asker),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('hides AI answers from developers who did not ask', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ id: 'c1', reviewStatus: ConceptReviewStatus.APPROVED }),
      );
      questionRepo.find.mockResolvedValue(discussionFixture());

      const [q] = await service.getQuestionsForConcept('c1', otherDeveloper);

      expect(q.askerName).toBe('Sam');
      // Verified first, then oldest-first; the private AI answer is excluded.
      expect(q.answers.map((a: any) => a.id)).toEqual([
        'a-verified',
        'a-late',
      ]);
      expect(q.answers[0].responderName).toBe('Rae');
      expect(q.answers[0].isVerified).toBe(true);
    });

    it('shows AI answers to the developer who asked', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ id: 'c1', reviewStatus: ConceptReviewStatus.APPROVED }),
      );
      questionRepo.find.mockResolvedValue(discussionFixture());

      const [q] = await service.getQuestionsForConcept('c1', asker);

      expect(q.answers.map((a: any) => a.id)).toEqual([
        'a-verified',
        'a-early',
        'a-late',
      ]);
      expect(q.answers[1].responderName).toBe('AI Assistant');
      expect(q.answers[1].isAiAnswer).toBe(true);
    });

    it('shows AI answers to an admin', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ id: 'c1', reviewStatus: ConceptReviewStatus.APPROVED }),
      );
      questionRepo.find.mockResolvedValue(discussionFixture());

      const [q] = await service.getQuestionsForConcept('c1', admin);

      expect(q.answers.map((a: any) => a.id)).toContain('a-early');
    });

    it('returns 404 when the viewer cannot see the concept', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({
          id: 'c1',
          authorId: 'someone-else',
          reviewStatus: ConceptReviewStatus.PENDING,
        }),
      );
      moduleConceptRepo.find.mockResolvedValue([]);

      await expect(
        service.getQuestionsForConcept('c1', otherDeveloper),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(questionRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('updateQuestion', () => {
    const dto: any = { body: 'edited' };

    it('throws NotFound for a missing question', async () => {
      questionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateQuestion('q1', asker, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids a user who does not own the question', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        askerId: 'someone-else',
        answers: [],
      });

      await expect(
        service.updateQuestion('q1', asker, dto),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('locks editing once a human answer exists', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        askerId: asker.id,
        answers: [{ id: 'a1', isAiAnswer: false }],
      });

      await expect(
        service.updateQuestion('q1', asker, dto),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(questionRepo.save).not.toHaveBeenCalled();
    });

    it('locks editing once any answer exists (human or AI)', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        askerId: asker.id,
        answers: [{ id: 'a-ai', isAiAnswer: true }],
      });

      await expect(
        service.updateQuestion('q1', asker, dto),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(questionRepo.save).not.toHaveBeenCalled();
    });

    it('lets an admin edit even after it has been answered', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        askerId: 'someone-else',
        answers: [{ id: 'a1', isAiAnswer: false }],
      });

      await service.updateQuestion('q1', admin, dto);

      expect(questionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'edited' }),
      );
    });
  });

  describe('createAnswer — open discussion', () => {
    const dto: any = { body: 'Here is the answer.' };

    it('throws NotFound for a missing question', async () => {
      questionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createAnswer('q1', otherDeveloper, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns 404 when the answerer cannot see the concept', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        concept: makeConcept({
          id: 'c1',
          authorId: 'someone-else',
          reviewStatus: ConceptReviewStatus.PENDING,
        }),
      });
      moduleConceptRepo.find.mockResolvedValue([]);

      await expect(
        service.createAnswer('q1', otherDeveloper, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(answerRepo.save).not.toHaveBeenCalled();
    });

    it('lets any developer answer a visible concept (unverified)', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        concept: makeConcept({
          id: 'c1',
          authorId: 'someone-else',
          reviewStatus: ConceptReviewStatus.APPROVED,
        }),
      });

      await service.createAnswer('q1', otherDeveloper, dto);

      expect(answerRepo.create).toHaveBeenCalledWith({
        questionId: 'q1',
        responderId: otherDeveloper.id,
        body: dto.body,
        isVerified: false,
        verifiedByUserId: null,
        verifiedAt: null,
      });
      expect(answerRepo.save).toHaveBeenCalledTimes(1);
    });

    it('auto-verifies answers from the concept author', async () => {
      const author = makeUser({ id: 'author-1', role: UserRole.DEVELOPER });
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        concept: makeConcept({
          id: 'c1',
          authorId: 'author-1',
          reviewStatus: ConceptReviewStatus.APPROVED,
        }),
      });

      await service.createAnswer('q1', author, dto);

      expect(answerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: 'q1',
          responderId: 'author-1',
          isVerified: true,
          verifiedByUserId: 'author-1',
        }),
      );
    });

    it('auto-verifies answers from an admin', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        concept: makeConcept({
          id: 'c1',
          authorId: 'someone-else',
          reviewStatus: ConceptReviewStatus.APPROVED,
        }),
      });

      await service.createAnswer('q1', admin, dto);

      expect(answerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isVerified: true,
          verifiedByUserId: admin.id,
        }),
      );
    });
  });

  describe('setAnswerVerified — author/admin only', () => {
    const answerFixture = (overrides = {}) => ({
      id: 'a1',
      questionId: 'q1',
      responderId: 'developer-2',
      isAiAnswer: false,
      isVerified: false,
      verifiedByUserId: null,
      verifiedAt: null,
      question: { id: 'q1', conceptId: 'c1' },
      ...overrides,
    });

    it('throws NotFound for a missing answer', async () => {
      answerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.setAnswerVerified('a1', admin, true),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses to verify an AI answer', async () => {
      answerRepo.findOne.mockResolvedValue(
        answerFixture({ isAiAnswer: true }),
      );

      await expect(
        service.setAnswerVerified('a1', admin, true),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets the concept author verify', async () => {
      const author = makeUser({ id: 'author-1', role: UserRole.DEVELOPER });
      answerRepo.findOne.mockResolvedValue(answerFixture());
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ id: 'c1', authorId: 'author-1' }),
      );

      await service.setAnswerVerified('a1', author, true);

      expect(answerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isVerified: true,
          verifiedByUserId: 'author-1',
        }),
      );
    });

    it('lets an admin verify without a concept lookup', async () => {
      answerRepo.findOne.mockResolvedValue(answerFixture());

      await service.setAnswerVerified('a1', admin, true);

      expect(conceptRepo.findOne).not.toHaveBeenCalled();
      expect(answerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isVerified: true }),
      );
    });

    it('forbids a developer who did not author the concept', async () => {
      answerRepo.findOne.mockResolvedValue(answerFixture());
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ id: 'c1', authorId: 'someone-else' }),
      );

      await expect(
        service.setAnswerVerified('a1', otherDeveloper, true),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('clears verification state on unverify', async () => {
      answerRepo.findOne.mockResolvedValue(
        answerFixture({ isVerified: true }),
      );

      await service.setAnswerVerified('a1', admin, false);

      expect(answerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isVerified: false,
          verifiedByUserId: null,
          verifiedAt: null,
        }),
      );
    });
  });
});
