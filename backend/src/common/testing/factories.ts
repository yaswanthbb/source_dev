import { ConceptDifficulty } from '../enums/concept-difficulty.enum';
import { ConceptReviewStatus } from '../enums/concept-review-status.enum';
import { ProgressStatus } from '../enums/progress-status.enum';
import { UserRole } from '../enums/user-role.enum';
import { XpSource } from '../enums/xp-source.enum';

import { User } from '../../modules/users/entities/user.entity';
import { Concept } from '../../modules/content/entities/concept.entity';
import { UserConceptProgress } from '../../modules/progress/entities/user-concept-progress.entity';
import { Streak } from '../../modules/gamification/entities/streak.entity';
import { Badge } from '../../modules/gamification/entities/badge.entity';
import { UserBadge } from '../../modules/gamification/entities/user-badge.entity';
import { XpEvent } from '../../modules/gamification/entities/xp-event.entity';
import { ReviewItem } from '../../modules/review/entities/review-item.entity';
import { McqQuestion } from '../../modules/quiz/entities/mcq-question.entity';
import { McqOption } from '../../modules/quiz/entities/mcq-option.entity';
import { McqAttempt } from '../../modules/quiz/entities/mcq-attempt.entity';

/**
 * Fixture builders for unit tests. Each returns a plain object shaped like the
 * entity (typed via a cast so specs get autocomplete) with sensible defaults
 * that callers override per-test. Dates are fixed, not `new Date()`, so nothing
 * here depends on the wall clock.
 */

const FIXED_DATE = new Date('2026-01-01T00:00:00.000Z');

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@test.dev',
    name: 'Test User',
    role: UserRole.STUDENT,
    passwordHash: 'hashed-password',
    authProvider: null,
    authProviderId: null,
    profilePicture: null,
    timezone: 'UTC',
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  } as unknown as User;
}

export function makeConcept(overrides: Partial<Concept> = {}): Concept {
  return {
    id: 'concept-1',
    title: 'Test Concept',
    slug: 'test-concept',
    content: 'Original concept content.',
    difficulty: ConceptDifficulty.MEDIUM,
    reviewStatus: ConceptReviewStatus.PENDING,
    isAiGenerated: false,
    rejectionReason: null,
    reviewedByUserId: null,
    reviewedAt: null,
    authorId: 'author-1',
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  } as unknown as Concept;
}

export function makeProgress(
  overrides: Partial<UserConceptProgress> = {},
): UserConceptProgress {
  return {
    id: 'progress-1',
    userId: 'user-1',
    conceptId: 'concept-1',
    status: ProgressStatus.COMPLETED,
    completedAt: FIXED_DATE,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  } as unknown as UserConceptProgress;
}

export function makeStreak(overrides: Partial<Streak> = {}): Streak {
  return {
    id: 'streak-1',
    userId: 'user-1',
    currentStreak: 1,
    longestStreak: 1,
    lastActivityDate: '2026-08-24',
    ...overrides,
  } as unknown as Streak;
}

export function makeBadge(overrides: Partial<Badge> = {}): Badge {
  return {
    id: 'badge-1',
    name: 'Test Badge',
    description: 'A test badge',
    criteriaKey: 'first_concept',
    createdAt: FIXED_DATE,
    ...overrides,
  } as unknown as Badge;
}

export function makeUserBadge(overrides: Partial<UserBadge> = {}): UserBadge {
  return {
    id: 'user-badge-1',
    userId: 'user-1',
    badgeId: 'badge-1',
    earnedAt: FIXED_DATE,
    ...overrides,
  } as unknown as UserBadge;
}

export function makeXpEvent(overrides: Partial<XpEvent> = {}): XpEvent {
  return {
    id: 'xp-1',
    userId: 'user-1',
    sourceType: XpSource.ASSIGNMENT_PASSED,
    sourceId: 'concept-1',
    xpAmount: 20,
    createdAt: FIXED_DATE,
    ...overrides,
  } as unknown as XpEvent;
}

export function makeOption(overrides: Partial<McqOption> = {}): McqOption {
  return {
    id: 'option-1',
    questionId: 'question-1',
    optionText: 'An option',
    isCorrect: false,
    orderIndex: 1,
    ...overrides,
  } as unknown as McqOption;
}

export function makeQuestion(
  overrides: Partial<McqQuestion> = {},
): McqQuestion {
  return {
    id: 'question-1',
    conceptId: 'concept-1',
    questionText: 'What is the answer?',
    orderIndex: 1,
    createdById: 'author-1',
    options: [],
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  } as unknown as McqQuestion;
}

export function makeAttempt(overrides: Partial<McqAttempt> = {}): McqAttempt {
  return {
    id: 'attempt-1',
    questionId: 'question-1',
    studentId: 'user-1',
    selectedOptionId: 'option-1',
    isCorrect: false,
    attemptNumber: 1,
    createdAt: FIXED_DATE,
    ...overrides,
  } as unknown as McqAttempt;
}

export function makeReviewItem(
  overrides: Partial<ReviewItem> = {},
): ReviewItem {
  return {
    id: 'review-1',
    userId: 'user-1',
    mcqQuestionId: 'question-1',
    intervalDays: 1,
    correctStreak: 0,
    dueDate: '2026-08-25',
    lastReviewedAt: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  } as unknown as ReviewItem;
}
