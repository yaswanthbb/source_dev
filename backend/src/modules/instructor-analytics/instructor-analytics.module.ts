import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstructorAnalyticsController } from './instructor-analytics.controller';
import { InstructorAnalyticsService } from './instructor-analytics.service';
import { User } from '../users/entities/user.entity';
import { InstructorProfile } from '../users/entities/instructor-profile.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Concept } from '../content/entities/concept.entity';
import { UserConceptProgress } from '../progress/entities/user-concept-progress.entity';
import { Answer } from '../qa/entities/answer.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { McqOption } from '../quiz/entities/mcq-option.entity';
import { McqAttempt } from '../quiz/entities/mcq-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      InstructorProfile,
      Roadmap,
      Concept,
      UserConceptProgress,
      Answer,
      McqQuestion,
      McqOption,
      McqAttempt,
    ]),
  ],
  controllers: [InstructorAnalyticsController],
  providers: [InstructorAnalyticsService],
  exports: [InstructorAnalyticsService],
})
export class InstructorAnalyticsModule {}
