import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XpEvent } from './entities/xp-event.entity';
import { Streak } from './entities/streak.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { Concept } from '../content/entities/concept.entity';
import { UserConceptProgress } from '../progress/entities/user-concept-progress.entity';
import { ConceptDifficulty } from '../../common/enums/concept-difficulty.enum';
import { XpSource } from '../../common/enums/xp-source.enum';
import { ProgressStatus } from '../../common/enums/progress-status.enum';
import {
  addCivilDays,
  civilDateIn,
  resolveZone,
  todayIn,
} from '../../common/utils/timezone.util';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(XpEvent)
    private readonly xpEventRepository: Repository<XpEvent>,
    @InjectRepository(Streak)
    private readonly streakRepository: Repository<Streak>,
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(Concept)
    private readonly conceptRepository: Repository<Concept>,
    @InjectRepository(UserConceptProgress)
    private readonly userConceptProgressRepository: Repository<UserConceptProgress>,
  ) {}

  async awardXpForConceptCompletion(
    userId: string,
    conceptId: string,
    sourceType: XpSource,
  ): Promise<void> {
    const concept = await this.conceptRepository.findOne({
      where: { id: conceptId },
    });
    if (!concept) {
      return;
    }

    let xpAmount = 20;
    if (concept.difficulty === ConceptDifficulty.EASY) {
      xpAmount = 10;
    } else if (concept.difficulty === ConceptDifficulty.HARD) {
      xpAmount = 35;
    }

    const existingEvent = await this.xpEventRepository.findOne({
      where: { userId, sourceId: conceptId },
    });
    if (existingEvent) {
      return;
    }

    const xpEvent = this.xpEventRepository.create({
      userId,
      sourceType,
      sourceId: conceptId,
      xpAmount,
    });
    await this.xpEventRepository.save(xpEvent);
  }

  /**
   * Advance the user's streak for "today" in *their* timezone.
   *
   * The day boundary has to be the user's local midnight. On UTC boundaries a
   * user in Asia/Kolkata studying at 01:00 local gets credited to the previous
   * day — so two consecutive evenings could collapse into one streak day, and
   * a genuinely skipped day could still look consecutive.
   */
  async updateStreak(userId: string, timezone?: string | null): Promise<void> {
    let streak = await this.streakRepository.findOne({ where: { userId } });
    const todayStr = todayIn(timezone);

    if (!streak) {
      streak = this.streakRepository.create({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: todayStr,
      });
      await this.streakRepository.save(streak);
      return;
    }

    const lastDateStr = streak.lastActivityDate || null;

    if (lastDateStr === todayStr) {
      return;
    }

    const yesterdayStr = addCivilDays(todayStr, -1);

    if (lastDateStr === yesterdayStr) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }

    streak.lastActivityDate = todayStr;
    streak.longestStreak = Math.max(
      streak.longestStreak || 0,
      streak.currentStreak,
    );
    await this.streakRepository.save(streak);
  }

  async checkAndAwardBadges(userId: string): Promise<void> {
    const allBadges = await this.badgeRepository.find();
    if (allBadges.length === 0) {
      return;
    }

    const userBadges = await this.userBadgeRepository.find({
      where: { userId },
    });
    const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

    const completedConceptsCount =
      await this.userConceptProgressRepository.count({
        where: { userId, status: ProgressStatus.COMPLETED },
      });

    const streak = await this.streakRepository.findOne({ where: { userId } });
    const currentStreak = streak ? streak.currentStreak : 0;

    const xpResult =
      (await this.xpEventRepository
        .createQueryBuilder('xp')
        .select('SUM(xp.xp_amount)', 'sum')
        .where('xp.user_id = :userId', { userId })
        .getRawOne<{ sum?: string }>()) ?? {};

    const totalXp = parseInt(xpResult.sum || '0', 10);

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) {
        continue;
      }

      let isEligible = false;
      switch (badge.criteriaKey) {
        case 'first_concept':
          isEligible = completedConceptsCount >= 1;
          break;
        case 'five_concepts':
          isEligible = completedConceptsCount >= 5;
          break;
        case 'twenty_concepts':
          isEligible = completedConceptsCount >= 20;
          break;
        case 'three_day_streak':
          isEligible = currentStreak >= 3;
          break;
        case 'seven_day_streak':
          isEligible = currentStreak >= 7;
          break;
        case 'hundred_xp':
          isEligible = totalXp >= 100;
          break;
        case 'five_hundred_xp':
          isEligible = totalXp >= 500;
          break;
      }

      if (isEligible) {
        const userBadge = this.userBadgeRepository.create({
          userId,
          badgeId: badge.id,
        });
        await this.userBadgeRepository.save(userBadge);
      }
    }
  }

  async getSelfGamification(userId: string): Promise<Record<string, unknown>> {
    const xpResult =
      (await this.xpEventRepository
        .createQueryBuilder('xp')
        .select('SUM(xp.xp_amount)', 'sum')
        .where('xp.user_id = :userId', { userId })
        .getRawOne<{ sum?: string }>()) ?? {};

    const totalXp = parseInt(xpResult.sum || '0', 10);
    const streak = await this.streakRepository.findOne({ where: { userId } });

    const userBadges = await this.userBadgeRepository.find({
      where: { userId },
      relations: ['badge'],
      order: { earnedAt: 'DESC' },
    });

    const earnedBadges = userBadges.map((ub) => ({
      id: ub.badge?.id,
      name: ub.badge?.name,
      description: ub.badge?.description,
      criteriaKey: ub.badge?.criteriaKey,
      earnedAt: ub.earnedAt,
    }));

    return {
      totalXp,
      currentStreak: streak ? streak.currentStreak : 0,
      longestStreak: streak ? streak.longestStreak : 0,
      lastActivityDate: streak ? streak.lastActivityDate : null,
      earnedBadges,
    };
  }

  async getAllBadges(): Promise<Badge[]> {
    return this.badgeRepository.find({ order: { createdAt: 'ASC' } });
  }

  async getActivityHeatmap(
    userId: string,
    days: number = 14,
    timezone?: string | null,
  ): Promise<Array<{ date: string; active: boolean; xp: number }>> {
    const numDays = Math.min(Math.max(days || 14, 1), 371);
    const zone = resolveZone(timezone);

    // Build the window from the user's civil "today" backwards. One extra day
    // of slack on the lower bound so no row is missed at the edge, whichever
    // side of UTC the zone sits on.
    const todayStr = todayIn(zone);
    const firstDayStr = addCivilDays(todayStr, -(numDays - 1));
    const startDate = new Date(`${addCivilDays(firstDayStr, -1)}T00:00:00Z`);

    // Bucketed in JS rather than with `AT TIME ZONE`, so this uses exactly the
    // same zone logic as the streak — Postgres and Node carry their own tzdata
    // and a stale one on either side would silently split the two apart.
    // One user's events over at most a year: a few hundred rows on an indexed
    // (user_id, created_at) scan, so this stays cheap.
    const rows = await this.xpEventRepository
      .createQueryBuilder('xp')
      .select('xp.created_at', 'createdAt')
      .addSelect('xp.xp_amount', 'xpAmount')
      .where('xp.user_id = :userId', { userId })
      .andWhere('xp.created_at >= :startDate', { startDate })
      .getRawMany<{ createdAt: Date | string; xpAmount: number | string }>();

    // XP earned per day, not a row count: XP is what every source here has in
    // common (concepts, assignments and reviews all award it), so one number
    // describes the day without claiming it was any particular kind of work.
    const xpByDate = new Map<string, number>();
    for (const r of rows) {
      const dateStr = civilDateIn(zone, new Date(r.createdAt));
      const amount = Number(r.xpAmount) || 0;
      xpByDate.set(dateStr, (xpByDate.get(dateStr) ?? 0) + amount);
    }

    const result: Array<{ date: string; active: boolean; xp: number }> = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const dateStr = addCivilDays(todayStr, -i);
      const xp = xpByDate.get(dateStr) ?? 0;
      result.push({ date: dateStr, active: xp > 0, xp });
    }

    return result;
  }
}
