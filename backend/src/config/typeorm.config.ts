import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE_PATH || '.env' });


import { User } from '../modules/users/entities/user.entity';
import { Roadmap } from '../modules/content/entities/roadmap.entity';
import { Module as ModuleEntity } from '../modules/content/entities/module.entity';
import { Concept } from '../modules/content/entities/concept.entity';
import { ModuleConcept } from '../modules/content/entities/module-concept.entity';
import { ModuleConceptPrerequisite } from '../modules/content/entities/module-concept-prerequisite.entity';
import { UserConceptProgress } from '../modules/progress/entities/user-concept-progress.entity';
import { Assignment } from '../modules/assignments/entities/assignment.entity';
import { Submission } from '../modules/assignments/entities/submission.entity';
import { Question } from '../modules/qa/entities/question.entity';
import { Answer } from '../modules/qa/entities/answer.entity';
import { XpEvent } from '../modules/gamification/entities/xp-event.entity';
import { Streak } from '../modules/gamification/entities/streak.entity';
import { Badge } from '../modules/gamification/entities/badge.entity';
import { UserBadge } from '../modules/gamification/entities/user-badge.entity';
import { McqQuestion } from '../modules/quiz/entities/mcq-question.entity';
import { McqOption } from '../modules/quiz/entities/mcq-option.entity';
import { McqAttempt } from '../modules/quiz/entities/mcq-attempt.entity';
import { AccountDeletionRequest } from '../modules/users/entities/account-deletion-request.entity';
import { ReviewItem } from '../modules/review/entities/review-item.entity';
import { AiGenerationLog } from '../modules/ai-generate/entities/ai-generation-log.entity';
import { AiGenerationJob } from '../modules/ai-generate/entities/ai-generation-job.entity';
import { AiProviderKey } from '../modules/ai-generate/entities/ai-provider-key.entity';
import { AiPromptVersion } from '../modules/ai-generate/entities/ai-prompt-version.entity';
import { CourseSource } from '../modules/ai-generate/entities/course-source.entity';
import { CourseSourceChunk } from '../modules/ai-generate/entities/course-source-chunk.entity';
import { ConceptMedia } from '../modules/ai-generate/entities/concept-media.entity';
import { CourseTerm } from '../modules/ai-generate/entities/course-term.entity';
import { CourseConceptCard } from '../modules/ai-generate/entities/course-concept-card.entity';
import { CourseConceptEdge } from '../modules/ai-generate/entities/course-concept-edge.entity';
import { ConceptCompilation } from '../modules/ai-generate/entities/concept-compilation.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { Article } from '../modules/articles/entities/article.entity';
import { PasswordResetOtp } from '../modules/auth/entities/password-reset-otp.entity';

export const entities = [
  User,
  AccountDeletionRequest,
  Roadmap,
  ModuleEntity,
  Concept,
  ModuleConcept,
  ModuleConceptPrerequisite,
  UserConceptProgress,
  Assignment,
  Submission,
  Question,
  Answer,
  XpEvent,
  Streak,
  Badge,
  UserBadge,
  McqQuestion,
  McqOption,
  McqAttempt,
  ReviewItem,
  AiGenerationLog,
  AiGenerationJob,
  AiProviderKey,
  AiPromptVersion,
  CourseTerm,
  CourseConceptCard,
  CourseConceptEdge,
  ConceptCompilation,
  CourseSource,
  CourseSourceChunk,
  ConceptMedia,
  Notification,
  Article,
  PasswordResetOtp,
];

export const getTypeOrmConfig = (
  configService?: ConfigService,
): DataSourceOptions => {
  const databaseUrl = configService
    ? configService.get<string>('DATABASE_URL')
    : process.env.DATABASE_URL;

  const dbSsl = configService
    ? configService.get<string>('DB_SSL')
    : process.env.DB_SSL;

  const isProduction =
    (configService
      ? configService.get<string>('NODE_ENV')
      : process.env.NODE_ENV) === 'production';

  // SSL is enabled when DATABASE_URL is set (e.g. Neon), DB_SSL=true, or in production
  const useSsl =
    dbSsl === 'true' ||
    Boolean(
      databaseUrl &&
      (databaseUrl.includes('sslmode=require') ||
        databaseUrl.includes('neon.tech') ||
        dbSsl !== 'false'),
    ) ||
    (isProduction && dbSsl !== 'false');

  const sslConfig = useSsl ? { rejectUnauthorized: false } : false;

  const baseConfig: Partial<DataSourceOptions> = {
    entities,
    synchronize: false,
    migrations: configService ? [] : [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    // Each migration commits independently: Postgres forbids using new enum
    // labels in the transaction that creates them (55P04), so label-adding
    // and seed-inserting migrations must not share a transaction.
    migrationsTransactionMode: 'each',
  };

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: sslConfig,
      extra: useSsl ? { ssl: { rejectUnauthorized: false } } : undefined,
      ...baseConfig,
    } as DataSourceOptions;
  }

  return {
    type: 'postgres',
    host: configService
      ? configService.get<string>('DB_HOST', 'localhost')
      : process.env.DB_HOST || 'localhost',
    port: configService
      ? configService.get<number>('DB_PORT', 5432)
      : parseInt(process.env.DB_PORT || '5432', 10),
    username: configService
      ? configService.get<string>('DB_USERNAME', 'postgres')
      : process.env.DB_USERNAME || 'postgres',
    password: configService
      ? configService.get<string>('DB_PASSWORD', 'postgres')
      : process.env.DB_PASSWORD || 'postgres',
    database: configService
      ? configService.get<string>('DB_DATABASE', 'knowledge_is_power')
      : process.env.DB_DATABASE || 'knowledge_is_power',
    ssl: sslConfig,
    extra: useSsl ? { ssl: { rejectUnauthorized: false } } : undefined,
    ...baseConfig,
  } as DataSourceOptions;
};

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
    getTypeOrmConfig(configService),
};

const dataSourceOptions: DataSourceOptions = getTypeOrmConfig();
export default new DataSource(dataSourceOptions);
