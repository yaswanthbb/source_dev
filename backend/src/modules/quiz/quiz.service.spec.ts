import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { QuizService } from './quiz.service';
import { McqQuestion } from './entities/mcq-question.entity';
import { McqOption } from './entities/mcq-option.entity';
import { McqAttempt } from './entities/mcq-attempt.entity';
import { Concept } from '../content/entities/concept.entity';
import { ProgressService } from '../progress/progress.service';

import { UserRole } from '../../common/enums/user-role.enum';
import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';

import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';
import {
  makeUser,
  makeConcept,
  makeQuestion,
  makeOption,
  makeAttempt,
} from '../../common/testing/factories';

describe('QuizService', () => {
  let service: QuizService;
  let questionRepo: MockRepository;
  let optionRepo: MockRepository;
  let attemptRepo: MockRepository;
  let conceptRepo: MockRepository;
  let progressService: { markConceptCompletedFromAssignment: jest.Mock };

  const owner = makeUser({ id: 'author-1', role: UserRole.DEVELOPER });
  const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });
  const otherDeveloper = makeUser({
    id: 'developer-2',
    role: UserRole.DEVELOPER,
  });

  beforeEach(async () => {
    progressService = { markConceptCompletedFromAssignment: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: getRepositoryToken(McqQuestion),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(McqOption),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(McqAttempt),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Concept),
          useValue: createMockRepository(),
        },
        { provide: ProgressService, useValue: progressService },
      ],
    }).compile();

    service = module.get(QuizService);
    questionRepo = module.get(getRepositoryToken(McqQuestion));
    optionRepo = module.get(getRepositoryToken(McqOption));
    attemptRepo = module.get(getRepositoryToken(McqAttempt));
    conceptRepo = module.get(getRepositoryToken(Concept));
  });

  afterEach(() => jest.clearAllMocks());

  describe('createQuestion', () => {
    const validDto: any = {
      questionText: 'Q?',
      orderIndex: 1,
      options: [
        { optionText: 'A', isCorrect: true, orderIndex: 1 },
        { optionText: 'B', isCorrect: false, orderIndex: 2 },
      ],
    };

    it('throws NotFound when the concept does not exist', async () => {
      conceptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createQuestion('missing', owner, validDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids a non-owner, non-admin author', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ authorId: 'someone-else' }),
      );

      await expect(
        service.createQuestion('concept-1', otherDeveloper, validDto),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects fewer than two options', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ authorId: 'author-1' }),
      );

      await expect(
        service.createQuestion('concept-1', owner, {
          ...validDto,
          options: [{ optionText: 'A', isCorrect: true, orderIndex: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when there is not exactly one correct option', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ authorId: 'author-1' }),
      );

      await expect(
        service.createQuestion('concept-1', owner, {
          ...validDto,
          options: [
            { optionText: 'A', isCorrect: true, orderIndex: 1 },
            { optionText: 'B', isCorrect: true, orderIndex: 2 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates the question + options and resets the concept to PENDING review', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ authorId: 'author-1' }),
      );
      questionRepo.save.mockImplementation((q) => ({ ...q, id: 'question-1' }));
      optionRepo.save.mockImplementation((opts) => opts);

      await service.createQuestion('concept-1', owner, validDto);

      expect(questionRepo.save).toHaveBeenCalledTimes(1);
      expect(optionRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ optionText: 'A', isCorrect: true }),
          expect.objectContaining({ optionText: 'B', isCorrect: false }),
        ]),
      );
      expect(conceptRepo.update).toHaveBeenCalledWith(
        'concept-1',
        expect.objectContaining({
          reviewStatus: ConceptReviewStatus.PENDING,
          rejectionReason: null,
          reviewedByUserId: null,
          reviewedAt: null,
        }),
      );
    });

    it('lets an admin author a question for a concept they do not own', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ authorId: 'someone-else' }),
      );
      questionRepo.save.mockImplementation((q) => ({ ...q, id: 'question-1' }));
      optionRepo.save.mockImplementation((opts) => opts);

      await expect(
        service.createQuestion('concept-1', admin, validDto),
      ).resolves.toBeDefined();
    });
  });

  describe('updateOption', () => {
    it('unsets sibling correct options when marking a new one correct', async () => {
      const opt1 = makeOption({ id: 'o1', isCorrect: true, orderIndex: 1 });
      const opt2 = makeOption({ id: 'o2', isCorrect: false, orderIndex: 2 });
      questionRepo.findOne.mockResolvedValue(
        makeQuestion({
          concept: makeConcept({ authorId: 'author-1' }),
          options: [opt1, opt2],
        }),
      );
      optionRepo.findOne.mockResolvedValue(opt2);

      const result = await service.updateOption('question-1', 'o2', owner, {
        isCorrect: true,
      } as any);

      expect(optionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'o1', isCorrect: false }),
      );
      expect(result.isCorrect).toBe(true);
    });

    it('refuses to clear the only correct option', async () => {
      const only = makeOption({ id: 'o1', isCorrect: true, orderIndex: 1 });
      questionRepo.findOne.mockResolvedValue(
        makeQuestion({
          concept: makeConcept({ authorId: 'author-1' }),
          options: [only, makeOption({ id: 'o2', isCorrect: false })],
        }),
      );
      optionRepo.findOne.mockResolvedValue(only);

      await expect(
        service.updateOption('question-1', 'o1', owner, {
          isCorrect: false,
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates the option text without touching correctness', async () => {
      const opt = makeOption({ id: 'o1', isCorrect: false, optionText: 'old' });
      questionRepo.findOne.mockResolvedValue(
        makeQuestion({
          concept: makeConcept({ authorId: 'author-1' }),
          options: [opt, makeOption({ id: 'o2', isCorrect: true })],
        }),
      );
      optionRepo.findOne.mockResolvedValue(opt);

      const result = await service.updateOption('question-1', 'o1', owner, {
        optionText: 'new',
      } as any);

      expect(result.optionText).toBe('new');
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('submitAttempt', () => {
    const correct = makeOption({ id: 'c', isCorrect: true });
    const wrong = makeOption({ id: 'w', isCorrect: false });

    const questionWithOptions = () =>
      makeQuestion({
        id: 'question-1',
        conceptId: 'concept-1',
        options: [correct, wrong],
        concept: makeConcept({ authorId: 'author-1' }),
      });

    it('rejects a fourth attempt', async () => {
      questionRepo.findOne.mockResolvedValue(questionWithOptions());
      attemptRepo.find.mockResolvedValue([
        makeAttempt({ attemptNumber: 1 }),
        makeAttempt({ attemptNumber: 2 }),
        makeAttempt({ attemptNumber: 3 }),
      ]);

      await expect(
        service.submitAttempt('question-1', otherDeveloper, {
          selectedOptionId: 'w',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects re-answering an already-correct question', async () => {
      questionRepo.findOne.mockResolvedValue(questionWithOptions());
      attemptRepo.find.mockResolvedValue([
        makeAttempt({ attemptNumber: 1, isCorrect: true }),
      ]);

      await expect(
        service.submitAttempt('question-1', otherDeveloper, {
          selectedOptionId: 'c',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound for an option that is not on the question', async () => {
      questionRepo.findOne.mockResolvedValue(questionWithOptions());
      attemptRepo.find.mockResolvedValue([]);

      await expect(
        service.submitAttempt('question-1', otherDeveloper, {
          selectedOptionId: 'nope',
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('grades a correct first answer and reveals the correct option', async () => {
      questionRepo.findOne.mockResolvedValue(questionWithOptions());
      attemptRepo.find.mockResolvedValue([]);
      questionRepo.find.mockResolvedValue([]); // completion check: skip

      const result = await service.submitAttempt('question-1', otherDeveloper, {
        selectedOptionId: 'c',
      } as any);

      expect(result).toMatchObject({
        isCorrect: true,
        attemptNumber: 1,
        attemptsRemaining: 2,
        correctOptionId: 'c',
      });
    });

    it('hides the answer on a wrong non-final attempt', async () => {
      questionRepo.findOne.mockResolvedValue(questionWithOptions());
      attemptRepo.find.mockResolvedValue([]);
      questionRepo.find.mockResolvedValue([]);

      const result = await service.submitAttempt('question-1', otherDeveloper, {
        selectedOptionId: 'w',
      } as any);

      expect(result.isCorrect).toBe(false);
      expect(result.attemptsRemaining).toBe(2);
      expect(result.correctOptionId).toBeUndefined();
    });

    it('reveals the answer once the final attempt is spent', async () => {
      questionRepo.findOne.mockResolvedValue(questionWithOptions());
      attemptRepo.find.mockResolvedValue([
        makeAttempt({ attemptNumber: 1 }),
        makeAttempt({ attemptNumber: 2 }),
      ]);
      questionRepo.find.mockResolvedValue([]);

      const result = await service.submitAttempt('question-1', otherDeveloper, {
        selectedOptionId: 'w',
      } as any);

      expect(result.attemptNumber).toBe(3);
      expect(result.attemptsRemaining).toBe(0);
      expect(result.correctOptionId).toBe('c');
    });

    it('completes the concept when every question is resolved', async () => {
      questionRepo.findOne.mockResolvedValue(questionWithOptions());
      // first find() = existing attempts for this question; second = completion sweep
      attemptRepo.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          makeAttempt({ questionId: 'question-1', isCorrect: true }),
        ]);
      questionRepo.find.mockResolvedValue([makeQuestion({ id: 'question-1' })]);

      await service.submitAttempt('question-1', otherDeveloper, {
        selectedOptionId: 'c',
      } as any);

      // Drive-by fix (2026-10-05): pre-existing stale expectation — the
      // service passes the caller's timezone through; the test predates it.
      expect(
        progressService.markConceptCompletedFromAssignment,
      ).toHaveBeenCalledWith('developer-2', 'concept-1', 'UTC');
    });
  });

  describe('getQuestionsForConcept', () => {
    beforeEach(() => {
      questionRepo.find.mockResolvedValue([
        makeQuestion({
          options: [makeOption({ id: 'o1', isCorrect: true, orderIndex: 1 })],
        }),
      ]);
    });

    it('strips isCorrect from options for non-authors', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ authorId: 'author-1' }),
      );

      const result = await service.getQuestionsForConcept('concept-1', otherDeveloper);

      expect((result[0].options as unknown[])[0]).not.toHaveProperty(
        'isCorrect',
      );
    });

    it('retains isCorrect for the author', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ authorId: 'author-1' }),
      );

      const result = await service.getQuestionsForConcept('concept-1', owner);

      expect((result[0].options as unknown[])[0]).toHaveProperty(
        'isCorrect',
        true,
      );
    });

    it('retains isCorrect for an admin', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ authorId: 'someone-else' }),
      );

      const result = await service.getQuestionsForConcept('concept-1', admin);

      expect((result[0].options as unknown[])[0]).toHaveProperty(
        'isCorrect',
        true,
      );
    });

    it('throws NotFound when the concept is missing', async () => {
      conceptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getQuestionsForConcept('missing', otherDeveloper),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
