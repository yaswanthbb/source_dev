import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roadmap } from './entities/roadmap.entity';
import { Module as ModuleEntity } from './entities/module.entity';
import { Concept } from './entities/concept.entity';
import { ModuleConcept } from './entities/module-concept.entity';
import { ModuleConceptPrerequisite } from './entities/module-concept-prerequisite.entity';
import { InstructorProfile } from '../users/entities/instructor-profile.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { RoadmapsService } from './roadmaps.service';
import { RoadmapsController } from './roadmaps.controller';
import { ConceptsService } from './concepts.service';
import { ConceptsController } from './concepts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Roadmap,
      ModuleEntity,
      Concept,
      ModuleConcept,
      ModuleConceptPrerequisite,
      InstructorProfile,
      McqQuestion,
    ]),
  ],
  controllers: [RoadmapsController, ConceptsController],
  providers: [RoadmapsService, ConceptsService],
  exports: [RoadmapsService, ConceptsService, TypeOrmModule],
})
export class ContentModule {}
