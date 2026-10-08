import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { AiGenerationJob } from './entities/ai-generation-job.entity';
import { AiProviderKey } from './entities/ai-provider-key.entity';
import { AiPromptVersion } from './entities/ai-prompt-version.entity';
import { CourseTerm } from './entities/course-term.entity';
import { CourseConceptCard } from './entities/course-concept-card.entity';
import { CourseConceptEdge } from './entities/course-concept-edge.entity';
import { ConceptCompilation } from './entities/concept-compilation.entity';
import { ConceptMedia } from './entities/concept-media.entity';
import { CourseSource } from './entities/course-source.entity';
import { CourseSourceChunk } from './entities/course-source-chunk.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Module as ModuleEntity } from '../content/entities/module.entity';
import { Concept } from '../content/entities/concept.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { ContentModule } from '../content/content.module';
import { QuizModule } from '../quiz/quiz.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AiGenerateService } from './ai-generate.service';
import { AiGenerateController } from './ai-generate.controller';
import { AiKeysService } from './ai-keys.service';
import { AiPromptRegistry } from './ai-prompt-registry.service';
import { CourseContextService } from './course-context.service';
import { CourseContextBuilder } from './course-context-builder.service';
import { CourseResearchService } from './course-research.service';
import { AiKeysController } from './ai-keys.controller';
import { AiKeyCryptoService } from './ai-key-crypto.service';
import { AiProviderClients } from './ai-provider-clients';
import { EvalPromptRelease } from '../eval/entities/eval-prompt-release.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiGenerationLog,
      AiGenerationJob,
      AiProviderKey,
      AiPromptVersion,
      EvalPromptRelease,
      CourseTerm,
      CourseConceptCard,
      CourseConceptEdge,
      ConceptCompilation,
      CourseSource,
      CourseSourceChunk,
      ConceptMedia,
      Roadmap,
      ModuleEntity,
      Concept,
      ModuleConcept,
      McqQuestion,
    ]),
    ConfigModule,
    ContentModule,
    QuizModule,
    NotificationsModule,
  ],
  controllers: [AiGenerateController, AiKeysController],
  providers: [
    AiGenerateService,
    AiKeysService,
    AiKeyCryptoService,
    AiProviderClients,
    AiPromptRegistry,
    CourseContextService,
    CourseContextBuilder,
    CourseResearchService,
  ],
  exports: [
    AiGenerateService,
    AiKeysService,
    CourseContextService,
    CourseContextBuilder,
    CourseResearchService,
    AiProviderClients,
    AiPromptRegistry,
  ],
})
export class AiGenerateModule {}
