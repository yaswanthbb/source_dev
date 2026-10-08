import {
  Card,
  FSRSVersion,
  Rating,
  State,
  createEmptyCard,
  fsrs,
} from 'ts-fsrs';
import { addCivilDays, civilDateIn } from '../../common/utils/timezone.util';

export type ReviewGrade = 'Again' | 'Good';
export type MemoryState = 'new' | 'learning' | 'review' | 'relearning';
export interface SchedulerCard {
  intervalDays: number;
  correctStreak: number;
  dueDate: string;
  lastReviewedAt: Date | null;
  stability?: number | null;
  difficulty?: number | null;
  reps?: number | null;
  lapses?: number | null;
  state?: MemoryState | null;
  lastGrade?: ReviewGrade | null;
  learningSteps?: number | null;
  fsrsReviewedAt?: Date | null;
}
export interface MemoryPatch {
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  state: MemoryState;
  lastGrade: ReviewGrade | null;
  learningSteps: number;
  fsrsReviewedAt: Date | null;
}
export interface ScheduleResult {
  intervalDays: number;
  correctStreak: number;
  dueDate: string;
  memory?: MemoryPatch;
  rebased?: boolean;
}
export interface ReviewScheduler {
  readonly version: string;
  schedule(
    card: SchedulerCard,
    grade: ReviewGrade,
    now: Date,
    timezone?: string | null,
  ): ScheduleResult;
}

// Both quiz and review DTOs carry only selectedOptionId: there is no timing/confidence signal.
export const gradeForAnswer = (correct: boolean): ReviewGrade =>
  correct ? 'Good' : 'Again';

export class LegacyDoublingScheduler implements ReviewScheduler {
  readonly version = 'legacy-doubling-v1';
  schedule(
    card: SchedulerCard,
    grade: ReviewGrade,
    now: Date,
    timezone?: string | null,
  ): ScheduleResult {
    const correct = grade === 'Good';
    const intervalDays = correct ? Math.min(card.intervalDays * 2, 60) : 1;
    return {
      intervalDays,
      correctStreak: correct ? card.correctStreak + 1 : 0,
      dueDate: addCivilDays(civilDateIn(timezone, now), intervalDays),
    };
  }
}

/** Matches the additive migration's deterministic seed. Existing served dates are never changed. */
export function seedLegacyMemory(card: SchedulerCard): MemoryPatch {
  const history =
    !!card.lastReviewedAt || card.correctStreak > 0 || card.intervalDays > 1;
  return {
    stability: history ? Math.max(1, card.intervalDays) : 0,
    difficulty: history ? 5 : 0,
    reps: Math.max(card.correctStreak, card.lastReviewedAt ? 1 : 0),
    lapses: card.lapses ?? 0,
    state: history ? 'review' : 'new',
    lastGrade: card.lastReviewedAt
      ? gradeForAnswer(card.correctStreak > 0)
      : null,
    learningSteps: 0,
    fsrsReviewedAt: card.lastReviewedAt,
  };
}

const stateNumbers: Record<MemoryState, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};
const stateNames: MemoryState[] = ['new', 'learning', 'review', 'relearning'];
const DAY = 86_400_000;
export class FsrsScheduler implements ReviewScheduler {
  readonly version = `ts-fsrs:${FSRSVersion}:civil-v1`;
  private readonly engine: ReturnType<typeof fsrs>;
  constructor(readonly retention = 0.9) {
    if (!Number.isFinite(retention) || retention < 0.7 || retention > 0.99)
      throw new Error('FSRS_REQUEST_RETENTION must be between 0.7 and 0.99');
    this.engine = fsrs({
      request_retention: retention,
      enable_fuzz: false,
      enable_short_term: true,
      maximum_interval: 60,
      learning_steps: ['23h'],
      relearning_steps: ['23h'],
    });
  }
  private memory(card: SchedulerCard): {
    patch: MemoryPatch;
    rebased: boolean;
  } {
    // Legacy reviews leave FSRS columns untouched. On re-enable rebase the memory estimate,
    // preserving lifetime reps/lapses, rather than attaching stale stability to a new review time.
    const stale =
      (card.lastReviewedAt?.getTime() ?? null) !==
      (card.fsrsReviewedAt?.getTime() ?? null);
    if (
      card.stability == null ||
      card.difficulty == null ||
      !card.state ||
      stale
    ) {
      const patch = seedLegacyMemory(card);
      patch.reps = Math.max(patch.reps, card.reps ?? 0);
      return { patch, rebased: true };
    }
    return {
      patch: {
        stability: card.stability,
        difficulty: card.difficulty,
        reps: card.reps ?? 0,
        lapses: card.lapses ?? 0,
        state: card.state,
        lastGrade: card.lastGrade ?? null,
        learningSteps: card.learningSteps ?? 0,
        fsrsReviewedAt: card.fsrsReviewedAt ?? null,
      },
      rebased: false,
    };
  }
  private libraryCard(
    card: SchedulerCard,
    now: Date,
  ): { card: Card; rebased: boolean } {
    const { patch, rebased } = this.memory(card);
    const due = new Date(`${card.dueDate}T12:00:00Z`);
    const lastReview =
      patch.fsrsReviewedAt ??
      (patch.state === 'new'
        ? undefined
        : new Date(due.getTime() - card.intervalDays * DAY));
    return {
      rebased,
      card: {
        ...createEmptyCard(now),
        due,
        stability: patch.stability,
        difficulty: patch.difficulty,
        reps: patch.reps,
        lapses: patch.lapses,
        state: stateNumbers[patch.state],
        learning_steps: patch.learningSteps,
        scheduled_days: card.intervalDays,
        last_review: lastReview,
      },
    };
  }
  schedule(
    card: SchedulerCard,
    grade: ReviewGrade,
    now: Date,
    timezone?: string | null,
  ): ScheduleResult {
    const input = this.libraryCard(card, now);
    const next = this.engine.next(
      input.card,
      now,
      grade === 'Good' ? Rating.Good : Rating.Again,
    ).card;
    // The product serves civil dates, not intraday sessions. Round library steps up to a civil day,
    // while retaining its learning/relearning state, stability and step cursor without reimplementing FSRS.
    const intervalDays = Math.max(
      1,
      next.scheduled_days > 0
        ? next.scheduled_days
        : Math.ceil((next.due.getTime() - now.getTime()) / DAY),
    );
    return {
      intervalDays,
      correctStreak: grade === 'Good' ? card.correctStreak + 1 : 0,
      dueDate: addCivilDays(civilDateIn(timezone, now), intervalDays),
      rebased: input.rebased,
      memory: {
        stability: next.stability,
        difficulty: next.difficulty,
        reps: next.reps,
        lapses: next.lapses,
        state: stateNames[next.state],
        lastGrade: grade,
        learningSteps: next.learning_steps,
        fsrsReviewedAt: now,
      },
    };
  }
  retrievability(card: SchedulerCard, now: Date): number {
    const value = this.engine.get_retrievability(
      this.libraryCard(card, now).card,
      now,
      false,
    );
    return Number.isFinite(value) ? value : 0;
  }
}
