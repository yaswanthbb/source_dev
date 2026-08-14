import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { XpEvent } from './entities/xp-event.entity';
import { Streak } from './entities/streak.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { Concept } from '../content/entities/concept.entity';
import { UserConceptProgress } from '../progress/entities/user-concept-progress.entity';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      XpEvent,
      Streak,
      Badge,
      UserBadge,
      Concept,
      UserConceptProgress,
    ]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService, TypeOrmModule],
})
export class GamificationModule {}
