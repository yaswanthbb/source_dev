import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { AiGenerationJob } from './entities/ai-generation-job.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Module as ModuleEntity } from '../content/entities/module.entity';
import { Concept } from '../content/entities/concept.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { ContentModule } from '../content/content.module';
import { QuizModule } from '../quiz/quiz.module';
import { AiGenerateService } from './ai-generate.service';
import { AiGenerateController } from './ai-generate.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiGenerationLog,
      AiGenerationJob,
      Roadmap,
      ModuleEntity,
      Concept,
      ModuleConcept,
      McqQuestion,
    ]),
    ConfigModule,
    ContentModule,
    QuizModule,
  ],
  controllers: [AiGenerateController],
  providers: [AiGenerateService],
  exports: [AiGenerateService],
})
export class AiGenerateModule {}
