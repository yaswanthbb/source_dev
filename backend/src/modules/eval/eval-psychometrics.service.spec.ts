import { EvalPsychometricsService } from './eval-psychometrics.service';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { McqOption } from '../quiz/entities/mcq-option.entity';
import { Concept } from '../content/entities/concept.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { ConceptReviewStatus } from '../../common/enums/concept-review-status.enum';
const author = { id: 'author', role: UserRole.DEVELOPER };
const parent: any = {
  id: 'old',
  conceptId: 'concept',
  versionNumber: 1,
  predecessorId: null,
  retiredAt: null,
  orderIndex: 2,
  questionText: 'Original stem',
  concept: { id: 'concept', authorId: 'author' },
  options: [{ id: 'old-option', orderIndex: 0, isCorrect: true }],
};
const dto: any = {
  questionText: 'Replacement stem',
  orderIndex: 999,
  lintResult: { invented: true },
  verificationResult: { agreed: true },
  options: [
    { optionText: 'Key', isCorrect: true, orderIndex: 0 },
    { optionText: 'Distractor', isCorrect: false, orderIndex: 1 },
  ],
};
function harness() {
  const questions: any = {
    findOne: jest.fn().mockResolvedValue({ ...parent }),
    find: jest.fn().mockResolvedValue([parent]),
  };
  const attempts: any = {
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const manager: any = {
    findOne: jest.fn(async (entity: any) =>
      entity === McqQuestion ? { ...parent } : parent.concept,
    ),
    create: jest.fn((_entity, values) => ({ ...values })),
    save: jest.fn(async (entity, values) =>
      entity === McqQuestion
        ? { ...values, id: 'new' }
        : values.map((v: any, i: number) => ({ ...v, id: `new-option-${i}` })),
    ),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const db: any = {
    transaction: jest.fn(async (callback) => callback(manager)),
  };
  const events: any = { emit: jest.fn() };
  return {
    service: new EvalPsychometricsService(questions, attempts, db, events),
    questions,
    attempts,
    manager,
    db,
    events,
  };
}
describe('psychometric read authorization and versioned replacements', () => {
  test('linked replacement keeps original question, options and attempts and resets review', async () => {
    const h = harness();
    const next = await h.service.replace(
      'old',
      author,
      dto,
      'Clarify the stem',
    );
    expect(next).toMatchObject({
      id: 'new',
      predecessorId: 'old',
      versionNumber: 2,
      orderIndex: 2,
      questionText: 'Replacement stem',
      verificationResult: null,
      lintResult: null,
    });
    expect(next.options.every((o) => o.questionId === 'new')).toBe(true);
    expect(h.manager.update).toHaveBeenCalledWith(McqQuestion, 'old', {
      retiredAt: expect.any(Date),
    });
    expect(h.manager.update).toHaveBeenCalledWith(
      Concept,
      'concept',
      expect.objectContaining({ reviewStatus: ConceptReviewStatus.PENDING }),
    );
    expect(h.manager.delete).not.toHaveBeenCalled();
    expect(h.attempts.save).not.toHaveBeenCalled();
    expect(h.attempts.delete).not.toHaveBeenCalled();
    expect(
      h.manager.save.mock.calls.filter(([entity]: any) => entity === McqOption),
    ).toHaveLength(1);
    expect(parent.questionText).toBe('Original stem');
    expect(parent.options[0].id).toBe('old-option');
    expect(h.events.emit).toHaveBeenCalledWith({
      type: 'artifact_versioned',
      artifactId: 'new',
      version: '2',
      predecessorId: 'old',
    });
  });
  test('authorization, invalid keys and already-retired parents fail without replacement writes', async () => {
    const h = harness();
    await expect(
      h.service.replace(
        'old',
        { id: 'other', role: UserRole.DEVELOPER },
        dto,
        'reason',
      ),
    ).rejects.toThrow('author or admin');
    await expect(
      h.service.replace(
        'old',
        author,
        { ...dto, options: [dto.options[0], dto.options[0]] },
        'reason',
      ),
    ).rejects.toThrow('exactly one key');
    h.manager.findOne.mockImplementation(async (entity: any) =>
      entity === McqQuestion
        ? { ...parent, retiredAt: new Date() }
        : parent.concept,
    );
    await expect(
      h.service.replace('old', author, dto, 'reason'),
    ).rejects.toThrow('already-retired');
    expect(h.manager.save).not.toHaveBeenCalled();
    expect(h.events.emit).not.toHaveBeenCalled();
  });
  test('aggregate excludes target relatives and retired rest items; contains no learner identifiers', async () => {
    const h = harness();
    h.questions.find.mockResolvedValue([
      { ...parent, retiredAt: new Date() },
      { ...parent, id: 'successor', predecessorId: 'old' },
      { ...parent, id: 'rest-old', retiredAt: new Date() },
      { ...parent, id: 'rest-new', predecessorId: 'rest-old' },
      { ...parent, id: 'rest-two' },
    ]);
    h.attempts.find.mockResolvedValue([
      {
        id: 'a',
        questionId: 'old',
        studentId: 'SECRET_LEARNER',
        selectedOptionId: 'old-option',
        isCorrect: true,
        attemptNumber: 1,
        createdAt: new Date(),
      },
    ]);
    const stats = await h.service.stats('old', author);
    expect(stats.cohortQuestionIds).toEqual(['old', 'rest-new', 'rest-two']);
    expect(stats).toMatchObject({
      n: 1,
      insufficient_data: true,
      difficultyIndex: 1,
      versionNumber: 1,
    });
    expect(JSON.stringify(stats)).not.toContain('SECRET_LEARNER');
    expect(h.attempts.find.mock.calls[0][0].where.questionId.value).toEqual([
      'old',
      'rest-new',
      'rest-two',
    ]);
  });
  test('another developer cannot read analytics, while admin can', async () => {
    const h = harness();
    await expect(
      h.service.stats('old', { id: 'other', role: UserRole.DEVELOPER }),
    ).rejects.toThrow('author or admin');
    expect(h.attempts.find).not.toHaveBeenCalled();
    await expect(
      h.service.stats('old', { id: 'admin', role: UserRole.ADMIN }),
    ).resolves.toMatchObject({ n: 0 });
  });
});
