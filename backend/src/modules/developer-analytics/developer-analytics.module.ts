import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Concept } from '../content/entities/concept.entity';
import { UserConceptProgress } from '../progress/entities/user-concept-progress.entity';
import { Answer } from '../qa/entities/answer.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { McqAttempt } from '../quiz/entities/mcq-attempt.entity';
import { DeveloperAnalyticsService } from './developer-analytics.service';
import { DeveloperAnalyticsController } from './developer-analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Roadmap,
      Concept,
      UserConceptProgress,
      Answer,
      McqQuestion,
      McqAttempt,
    ]),
  ],
  controllers: [DeveloperAnalyticsController],
  providers: [DeveloperAnalyticsService],
  exports: [DeveloperAnalyticsService, TypeOrmModule],
})
export class DeveloperAnalyticsModule {}
