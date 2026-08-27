import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { QaService } from './qa.service';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { Concept } from '../content/entities/concept.entity';
import { InstructorProfile } from '../users/entities/instructor-profile.entity';
import { AiGenerateService } from '../ai-generate/ai-generate.service';

import { UserRole } from '../../common/enums/user-role.enum';
import { InstructorStatus } from '../../common/enums/instructor-status.enum';

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
  let profileRepo: MockRepository;
  let aiService: { generateQaAnswer: jest.Mock };

  const student = makeUser({ role: UserRole.STUDENT }); // id: user-1
  const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });
  const instructor = makeUser({ id: 'i1', role: UserRole.INSTRUCTOR });

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
          provide: getRepositoryToken(InstructorProfile),
          useValue: createMockRepository(),
        },
        { provide: AiGenerateService, useValue: aiService },
      ],
    }).compile();

    service = module.get(QaService);
    questionRepo = module.get(getRepositoryToken(Question));
    answerRepo = module.get(getRepositoryToken(Answer));
    conceptRepo = module.get(getRepositoryToken(Concept));
    profileRepo = module.get(getRepositoryToken(InstructorProfile));
  });

  afterEach(() => jest.clearAllMocks());

  describe('createQuestion', () => {
    const dto: any = { body: 'How does this work?' };

    it('throws NotFound when the concept does not exist', async () => {
      conceptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createQuestion('c1', student, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(questionRepo.save).not.toHaveBeenCalled();
    });

    it('saves a plain question without invoking the AI when target is not "ai"', async () => {
      conceptRepo.findOne.mockResolvedValue(makeConcept({ id: 'c1' }));

      await service.createQuestion('c1', student, dto);

      expect(questionRepo.create).toHaveBeenCalledWith({
        conceptId: 'c1',
        studentId: student.id,
        body: dto.body,
      });
      expect(aiService.generateQaAnswer).not.toHaveBeenCalled();
      expect(answerRepo.save).not.toHaveBeenCalled();
    });

    it('generates and attaches an AI answer when target is "ai"', async () => {
      conceptRepo.findOne.mockResolvedValue(
        makeConcept({ id: 'c1', title: 'Loops', content: 'Loop content' }),
      );
      questionRepo.save.mockImplementation(async (q: any) => ({
        ...q,
        id: 'q-new',
      }));
      aiService.generateQaAnswer.mockResolvedValue('The AI answer.');

      const result = await service.createQuestion('c1', student, {
        body: 'Why loops?',
        target: 'ai',
      } as any);

      expect(aiService.generateQaAnswer).toHaveBeenCalledWith(
        'Loops',
        'Loop content',
        'Why loops?',
        student,
      );
      expect(answerRepo.create).toHaveBeenCalledWith({
        questionId: 'q-new',
        instructorId: null,
        body: 'The AI answer.',
        isAiAnswer: true,
      });
      expect(answerRepo.save).toHaveBeenCalledTimes(1);
      expect(result.answers).toHaveLength(1);
    });
  });

  describe('getQuestionsForConcept', () => {
    it('throws NotFound when the concept is missing', async () => {
      conceptRepo.findOne.mockResolvedValue(null);

      await expect(service.getQuestionsForConcept('c1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('flattens questions, labels AI answers, and sorts answers oldest-first', async () => {
      conceptRepo.findOne.mockResolvedValue(makeConcept({ id: 'c1' }));
      questionRepo.find.mockResolvedValue([
        {
          id: 'q1',
          conceptId: 'c1',
          studentId: 's1',
          student: { name: 'Sam' },
          body: 'Q?',
          createdAt: new Date('2026-08-01T00:00:00.000Z'),
          updatedAt: new Date('2026-08-01T00:00:00.000Z'),
          answers: [
            {
              id: 'a-late',
              questionId: 'q1',
              instructorId: 'i1',
              instructor: { name: 'Ivy' },
              isAiAnswer: false,
              body: 'human',
              createdAt: new Date('2026-08-03T00:00:00.000Z'),
              updatedAt: new Date('2026-08-03T00:00:00.000Z'),
            },
            {
              id: 'a-early',
              questionId: 'q1',
              instructorId: null,
              instructor: null,
              isAiAnswer: true,
              body: 'ai',
              createdAt: new Date('2026-08-02T00:00:00.000Z'),
              updatedAt: new Date('2026-08-02T00:00:00.000Z'),
            },
          ],
        },
      ]);

      const [q] = await service.getQuestionsForConcept('c1');

      expect(q.studentName).toBe('Sam');
      // Oldest-first: the AI answer (Aug 2) precedes the human answer (Aug 3).
      expect(q.answers.map((a: any) => a.id)).toEqual(['a-early', 'a-late']);
      expect(q.answers[0].instructorName).toBe('AI Assistant');
      expect(q.answers[0].isAiAnswer).toBe(true);
      expect(q.answers[1].instructorName).toBe('Ivy');
    });
  });

  describe('updateQuestion', () => {
    const dto: any = { body: 'edited' };

    it('throws NotFound for a missing question', async () => {
      questionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateQuestion('q1', student, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids a user who does not own the question', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        studentId: 'someone-else',
        answers: [],
      });

      await expect(
        service.updateQuestion('q1', student, dto),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('locks editing once an answer exists', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        studentId: student.id,
        answers: [{ id: 'a1' }],
      });

      await expect(
        service.updateQuestion('q1', student, dto),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(questionRepo.save).not.toHaveBeenCalled();
    });

    it('lets an admin edit even after it has been answered', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        studentId: 'someone-else',
        answers: [{ id: 'a1' }],
      });

      await service.updateQuestion('q1', admin, dto);

      expect(questionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'edited' }),
      );
    });

    it('updates the body for the owner when unanswered', async () => {
      questionRepo.findOne.mockResolvedValue({
        id: 'q1',
        studentId: student.id,
        answers: [],
      });

      await service.updateQuestion('q1', student, dto);

      expect(questionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'edited' }),
      );
    });
  });

  describe('createAnswer — approved-content-creator guard', () => {
    const dto: any = { body: 'Here is the answer.' };

    it('throws NotFound for a missing question', async () => {
      questionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createAnswer('q1', admin, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids a student from answering', async () => {
      questionRepo.findOne.mockResolvedValue({ id: 'q1' });

      await expect(
        service.createAnswer('q1', student, dto),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids an instructor whose profile is not approved', async () => {
      questionRepo.findOne.mockResolvedValue({ id: 'q1' });
      profileRepo.findOne.mockResolvedValue({
        status: InstructorStatus.PENDING,
      });

      await expect(
        service.createAnswer('q1', instructor, dto),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets an approved instructor answer', async () => {
      questionRepo.findOne.mockResolvedValue({ id: 'q1' });
      profileRepo.findOne.mockResolvedValue({
        status: InstructorStatus.APPROVED,
      });

      await service.createAnswer('q1', instructor, dto);

      expect(answerRepo.create).toHaveBeenCalledWith({
        questionId: 'q1',
        instructorId: instructor.id,
        body: dto.body,
      });
      expect(answerRepo.save).toHaveBeenCalledTimes(1);
    });

    it('lets an admin answer without a profile lookup', async () => {
      questionRepo.findOne.mockResolvedValue({ id: 'q1' });

      await service.createAnswer('q1', admin, dto);

      expect(profileRepo.findOne).not.toHaveBeenCalled();
      expect(answerRepo.save).toHaveBeenCalledTimes(1);
    });
  });
});
