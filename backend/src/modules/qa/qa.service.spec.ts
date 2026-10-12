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
import { RoadmapUnpublishStatus } from '../../common/enums/roadmap-unpublish-status.enum';

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
    const dto = { body: 'How does this work?' };

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
        target: 'discussion',
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
      questionRepo.save.mockImplementation((q: Question) =>
        Promise.resolve({
          ...q,
          id: 'q-new',
        }),
      );
      aiService.generateQaAnswer.mockResolvedValue('The AI answer.');

      const result = await service.createQuestion('c1', asker, {
        body: 'Why loops?',
        target: 'ai',
      });

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
      expect(result.target).toBe('ai');
      expect(questionRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
        aiService.generateQaAnswer.mock.invocationCallOrder[0],
      );
    });

    it.each(['provider failure', 'quota exceeded'])(
      'persists private intent before %s and never retries generation',
      async (message) => {
        conceptRepo.findOne.mockResolvedValue(
          makeConcept({ id: 'c1', reviewStatus: ConceptReviewStatus.APPROVED }),
        );
        aiService.generateQaAnswer.mockRejectedValue(new Error(message));
        await expect(
          service.createQuestion('c1', asker, {
            body: 'Private text',
            target: 'ai',
          }),
        ).rejects.toThrow(message);
        expect(questionRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({ target: 'ai', body: 'Private text' }),
        );
        expect(questionRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
          aiService.generateQaAnswer.mock.invocationCallOrder[0],
        );
        expect(aiService.generateQaAnswer).toHaveBeenCalledTimes(1);
        expect(answerRepo.save).not.toHaveBeenCalled();
      },
    );

    it('does not invoke AI if persisting private intent fails', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ id: 'c1', reviewStatus: ConceptReviewStatus.APPROVED }),
      );
      questionRepo.save.mockRejectedValue(new Error('save failed'));
      await expect(
        service.createQuestion('c1', asker, {
          body: 'Private text',
          target: 'ai',
        }),
      ).rejects.toThrow('save failed');
      expect(aiService.generateQaAnswer).not.toHaveBeenCalled();
    });

    it('keeps the question private if storing a generated reply fails', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ id: 'c1', reviewStatus: ConceptReviewStatus.APPROVED }),
      );
      aiService.generateQaAnswer.mockResolvedValue('Generated reply');
      answerRepo.save.mockRejectedValue(new Error('reply save failed'));
      await expect(
        service.createQuestion('c1', asker, {
          body: 'Private text',
          target: 'ai',
        }),
      ).rejects.toThrow('reply save failed');
      expect(questionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ target: 'ai' }),
      );
      expect(aiService.generateQaAnswer).toHaveBeenCalledTimes(1);
      expect(answerRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('getQuestionsForConcept — discussion with private AI answers', () => {
    const discussionFixture = () => [
      {
        id: 'q1',
        conceptId: 'c1',
        askerId: 'user-1',
        target: 'discussion',
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
      expect(q.answers.map((a) => a.id)).toEqual(['a-verified', 'a-late']);
      expect(q.answers[0].responderName).toBe('Rae');
      expect(q.answers[0].isVerified).toBe(true);
    });

    it('shows AI answers to the developer who asked', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ id: 'c1', reviewStatus: ConceptReviewStatus.APPROVED }),
      );
      questionRepo.find.mockResolvedValue(discussionFixture());

      const [q] = await service.getQuestionsForConcept('c1', asker);

      expect(q.answers.map((a) => a.id)).toEqual([
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

      expect(q.answers.map((a) => a.id)).toContain('a-early');
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
    const dto = { body: 'edited' };

    it('throws NotFound for a missing question', async () => {
      questionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateQuestion('q1', asker, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids a user who does not own the question', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        target: 'discussion',
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
        target: 'discussion',
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
        target: 'ai',
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
        target: 'discussion',
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
    const dto = { body: 'Here is the answer.' };

    it('throws NotFound for a missing question', async () => {
      questionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createAnswer('q1', otherDeveloper, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns 404 when the answerer cannot see the concept', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        target: 'discussion',
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
        target: 'discussion',
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
        target: 'discussion',
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
        target: 'discussion',
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
      question: { id: 'q1', conceptId: 'c1', target: 'discussion' },
      ...overrides,
    });

    it('throws NotFound for a missing answer', async () => {
      answerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.setAnswerVerified('a1', admin, true),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses to verify an AI answer', async () => {
      answerRepo.findOne.mockResolvedValue(answerFixture({ isAiAnswer: true }));

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
      answerRepo.findOne.mockResolvedValue(answerFixture({ isVerified: true }));

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

  describe('whole-thread privacy', () => {
    const privateQuestion = (overrides = {}) => ({
      id: 'private-q',
      conceptId: 'c1',
      target: 'ai',
      askerId: asker.id,
      body: 'Private question text',
      createdAt: new Date('2026-08-01T00:00:00Z'),
      updatedAt: new Date('2026-08-01T00:00:00Z'),
      answers: [],
      ...overrides,
    });

    beforeEach(() => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({
          id: 'c1',
          authorId: otherDeveloper.id,
          reviewStatus: ConceptReviewStatus.APPROVED,
        }),
      );
    });

    it.each([undefined, otherDeveloper])(
      'hides even an unanswered private question from %s',
      async (viewer) => {
        questionRepo.find.mockResolvedValue([
          privateQuestion(),
          privateQuestion({
            id: 'public-q',
            target: 'discussion',
            body: 'Public text',
          }),
        ]);
        const result = await service.getQuestionsForConcept('c1', viewer);
        expect(result.map((q) => q.id)).toEqual(['public-q']);
        expect(JSON.stringify(result)).not.toContain('Private question text');
        expect(result[0].target).toBe('discussion');
        expect(questionRepo.find).toHaveBeenCalledWith(
          expect.objectContaining({
            where: viewer
              ? [
                  { conceptId: 'c1', target: 'discussion' },
                  { conceptId: 'c1', target: 'ai', askerId: viewer.id },
                ]
              : [{ conceptId: 'c1', target: 'discussion' }],
          }),
        );
      },
    );

    it.each([asker, admin])(
      'lets the asker or admin read the complete private thread: %s',
      async (viewer) => {
        questionRepo.find.mockResolvedValue([
          privateQuestion({
            answers: [
              {
                id: 'private-a',
                body: 'Private reply',
                isAiAnswer: true,
                createdAt: new Date('2026-08-02T00:00:00Z'),
              },
            ],
          }),
        ]);
        const [q] = await service.getQuestionsForConcept('c1', viewer);
        expect(q.body).toBe('Private question text');
        expect(q.target).toBe('ai');
        expect(q.answers[0].body).toBe('Private reply');
      },
    );

    it.each([undefined, 'unexpected'])(
      'fails closed for a missing or unknown target: %s',
      async (target) => {
        questionRepo.find.mockResolvedValue([privateQuestion({ target })]);
        expect(await service.getQuestionsForConcept('c1', admin)).toEqual([]);
      },
    );

    it.each(['update', 'delete', 'answer'])(
      'returns 404 for a known private question ID on %s, even to the concept author',
      async (action) => {
        questionRepo.findOne.mockResolvedValue(privateQuestion());
        const operation =
          action === 'update'
            ? service.updateQuestion('private-q', otherDeveloper, {
                body: 'Changed',
              })
            : action === 'delete'
              ? service.deleteQuestion('private-q', otherDeveloper)
              : service.createAnswer('private-q', otherDeveloper, {
                  body: 'Reply',
                });
        await expect(operation).rejects.toBeInstanceOf(NotFoundException);
        expect(questionRepo.save).not.toHaveBeenCalled();
        expect(questionRepo.remove).not.toHaveBeenCalled();
        expect(answerRepo.save).not.toHaveBeenCalled();
      },
    );

    it.each(['update', 'delete', 'verify', 'unverify'])(
      'returns 404 for a known private answer ID on %s, even to its legacy responder/concept author',
      async (action) => {
        answerRepo.findOne.mockResolvedValue({
          id: 'private-a',
          responderId: otherDeveloper.id,
          isAiAnswer: false,
          question: privateQuestion(),
        });
        const operation =
          action === 'update'
            ? service.updateAnswer('private-a', otherDeveloper, {
                body: 'Changed',
              })
            : action === 'delete'
              ? service.deleteAnswer('private-a', otherDeveloper)
              : service.setAnswerVerified(
                  'private-a',
                  otherDeveloper,
                  action === 'verify',
                );
        await expect(operation).rejects.toBeInstanceOf(NotFoundException);
        expect(answerRepo.findOne).toHaveBeenCalledWith({
          where: { id: 'private-a' },
          relations: ['question'],
        });
        expect(answerRepo.save).not.toHaveBeenCalled();
        expect(answerRepo.remove).not.toHaveBeenCalled();
      },
    );

    it.each([asker, admin])(
      'allows private question maintenance without changing its target: %s',
      async (viewer) => {
        questionRepo.findOne.mockResolvedValue(privateQuestion());
        const edited = await service.updateQuestion('private-q', viewer, {
          body: 'Changed',
        });
        expect(edited.target).toBe('ai');
        await service.deleteQuestion('private-q', viewer);
        expect(questionRepo.remove).toHaveBeenCalledTimes(1);
      },
    );

    it('does not reclassify a private question through an extra update DTO field', async () => {
      questionRepo.findOne.mockResolvedValue(privateQuestion());
      const dto = { body: 'Changed', target: 'discussion' };
      const edited = await service.updateQuestion('private-q', asker, dto);
      expect(edited.target).toBe('ai');
    });

    it.each([asker, admin])(
      'does not accept human discussion replies on an AI thread: %s',
      async (viewer) => {
        questionRepo.findOne.mockResolvedValue(privateQuestion());
        await expect(
          service.createAnswer('private-q', viewer, { body: 'Reply' }),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(answerRepo.save).not.toHaveBeenCalled();
      },
    );

    it.each(['update', 'delete'])(
      'preserves public answer ownership rules on %s',
      async (action) => {
        answerRepo.findOne.mockResolvedValue({
          id: 'public-a',
          responderId: asker.id,
          question: privateQuestion({ target: 'discussion' }),
        });
        const run = (viewer: typeof asker) =>
          action === 'update'
            ? service.updateAnswer('public-a', viewer, { body: 'Changed' })
            : service.deleteAnswer('public-a', viewer);
        await expect(run(otherDeveloper)).rejects.toBeInstanceOf(
          ForbiddenException,
        );
        await run(asker);
        await run(admin);
        expect(
          action === 'update' ? answerRepo.save : answerRepo.remove,
        ).toHaveBeenCalledTimes(2);
      },
    );

    it('lets admins maintain private replies', async () => {
      answerRepo.findOne.mockResolvedValue({
        id: 'private-a',
        responderId: null,
        isAiAnswer: true,
        question: privateQuestion(),
      });
      await service.updateAnswer('private-a', admin, { body: 'Changed' });
      await service.deleteAnswer('private-a', admin);
      expect(answerRepo.save).toHaveBeenCalledTimes(1);
      expect(answerRepo.remove).toHaveBeenCalledTimes(1);
    });

    it('does not expose unpublished concept discussion through an anonymous service call', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({
          authorId: asker.id,
          reviewStatus: ConceptReviewStatus.PENDING,
        }),
      );
      await expect(service.getQuestionsForConcept('c1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(questionRepo.find).not.toHaveBeenCalled();
    });

    it.each(['unpublish', 'delete'])(
      'honors effective roadmap %s dates before listing, asking or answering',
      async (action) => {
        const concept = makeConcept({
          id: 'c1',
          authorId: 'third-user',
          reviewStatus: ConceptReviewStatus.APPROVED,
        });
        conceptRepo.findOne.mockResolvedValue(concept);
        moduleConceptRepo.find.mockResolvedValue([
          {
            module: {
              roadmap: {
                reviewStatus: RoadmapReviewStatus.PUBLISHED,
                ...(action === 'unpublish'
                  ? {
                      unpublishStatus: RoadmapUnpublishStatus.APPROVED,
                      unpublishEffectiveAt: new Date(0),
                    }
                  : { deleteEffectiveAt: new Date(0) }),
              },
            },
          },
        ]);
        questionRepo.findOne.mockResolvedValue(
          privateQuestion({
            target: 'discussion',
            concept,
          }),
        );
        await expect(
          service.getQuestionsForConcept('c1', asker),
        ).rejects.toBeInstanceOf(NotFoundException);
        await expect(
          service.createQuestion('c1', asker, {
            body: 'Question',
            target: 'ai',
          }),
        ).rejects.toBeInstanceOf(NotFoundException);
        await expect(
          service.createAnswer('private-q', asker, { body: 'Reply' }),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(questionRepo.find).not.toHaveBeenCalled();
        expect(questionRepo.save).not.toHaveBeenCalled();
        expect(answerRepo.save).not.toHaveBeenCalled();
        expect(aiService.generateQaAnswer).not.toHaveBeenCalled();
      },
    );
  });
});
