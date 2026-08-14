import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserConceptProgress } from './entities/user-concept-progress.entity';
import { Concept } from '../content/entities/concept.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { ConceptPrerequisite } from '../content/entities/concept-prerequisite.entity';
import { GamificationModule } from '../gamification/gamification.module';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';

@Module({
  imports: [
    GamificationModule,
    TypeOrmModule.forFeature([
      UserConceptProgress,
      Concept,
      Roadmap,
      ConceptPrerequisite,
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService, TypeOrmModule],
})
export class ProgressModule {}
