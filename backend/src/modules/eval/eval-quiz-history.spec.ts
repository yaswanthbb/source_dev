import { QuizService } from '../quiz/quiz.service';
import { createMockRepository } from '../../common/testing/mock-repository';
import {
  makeConcept,
  makeQuestion,
  makeOption,
  makeUser,
} from '../../common/testing/factories';
import { UserRole } from '../../common/enums/user-role.enum';
function harness() {
  const questions = createMockRepository(),
    options = createMockRepository(),
    attempts = createMockRepository(),
    concepts = createMockRepository();
  const user = makeUser({ id: 'author', role: UserRole.DEVELOPER });
  const concept = makeConcept({ authorId: user.id });
  const question = makeQuestion({ concept, options: [makeOption()] });
  questions.findOne.mockResolvedValue(question);
  concepts.findOne.mockResolvedValue(concept);
  return {
    service: new QuizService(
      questions as any,
      options as any,
      attempts as any,
      concepts as any,
      {} as any,
    ),
    questions,
    options,
    attempts,
    concepts,
    user,
    question,
  };
}
describe('eval version history is not invisibly rewritten by legacy quiz endpoints', () => {
  test.each(['update', 'option', 'delete'])(
    'answered question cannot %s',
    async (operation) => {
      const h = harness();
      h.attempts.count.mockResolvedValue(1);
      const action =
        operation === 'update'
          ? h.service.updateQuestion(h.question.id, h.user, {
              questionText: 'Changed',
            })
          : operation === 'option'
            ? h.service.updateOption(
                h.question.id,
                h.question.options[0].id,
                h.user,
                { optionText: 'Changed' },
              )
            : h.service.deleteQuestion(h.question.id, h.user);
      await expect(action).rejects.toThrow('immutable');
      expect(h.questions.save).not.toHaveBeenCalled();
      expect(h.questions.remove).not.toHaveBeenCalled();
      expect(h.options.save).not.toHaveBeenCalled();
    },
  );
  test('retired but unattempted parent is immutable too', async () => {
    const h = harness();
    h.question.retiredAt = new Date();
    h.attempts.count.mockResolvedValue(0);
    await expect(
      h.service.updateQuestion(h.question.id, h.user, {
        questionText: 'Changed',
      }),
    ).rejects.toThrow('immutable');
  });
  test('fresh quiz queries exclude retired versions', async () => {
    const h = harness();
    h.questions.find.mockResolvedValue([]);
    await h.service.getQuestionsForConcept(h.question.conceptId, h.user);
    expect(h.questions.find.mock.calls[0][0].where.retiredAt.type).toBe(
      'isNull',
    );
  });
});
