import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContentModule } from './modules/content/content.module';
import { ProgressModule } from './modules/progress/progress.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { QaModule } from './modules/qa/qa.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DeveloperAnalyticsModule } from './modules/developer-analytics/developer-analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { ReviewModule } from './modules/review/review.module';
import { AiGenerateModule } from './modules/ai-generate/ai-generate.module';
import { EvalModule } from './modules/eval/eval.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.ENV_FILE_PATH || '.env',
    }),

    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    AuthModule,
    UsersModule,
    ContentModule,
    ProgressModule,
    QuizModule,
    AssignmentsModule,
    QaModule,
    GamificationModule,
    AnalyticsModule,
    DeveloperAnalyticsModule,
    NotificationsModule,
    ArticlesModule,
    ReviewModule,
    AiGenerateModule,
    EvalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
