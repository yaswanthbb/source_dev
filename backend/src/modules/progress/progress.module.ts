import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserConceptProgress } from './entities/user-concept-progress.entity';
import { Concept } from '../content/entities/concept.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { ModuleConceptPrerequisite } from '../content/entities/module-concept-prerequisite.entity';
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
      ModuleConcept,
      ModuleConceptPrerequisite,
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService, TypeOrmModule],
})
export class ProgressModule {}
