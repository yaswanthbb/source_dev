import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { AiGenerationJob } from './entities/ai-generation-job.entity';
import { AiProviderKey } from './entities/ai-provider-key.entity';
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
import { AiKeysController } from './ai-keys.controller';
import { AiKeyCryptoService } from './ai-key-crypto.service';
import { AiProviderClients } from './ai-provider-clients';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiGenerationLog,
      AiGenerationJob,
      AiProviderKey,
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
  ],
  exports: [AiGenerateService, AiKeysService],
})
export class AiGenerateModule {}
