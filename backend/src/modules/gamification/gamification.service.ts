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

  async updateStreak(userId: string): Promise<void> {
    let streak = await this.streakRepository.findOne({ where: { userId } });
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

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

    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

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
}
