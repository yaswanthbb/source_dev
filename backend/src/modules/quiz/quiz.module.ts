import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { McqQuestion } from './entities/mcq-question.entity';
import { McqOption } from './entities/mcq-option.entity';
import { McqAttempt } from './entities/mcq-attempt.entity';
import { Concept } from '../content/entities/concept.entity';
import { ProgressModule } from '../progress/progress.module';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    ProgressModule,
    TypeOrmModule.forFeature([McqQuestion, McqOption, McqAttempt, Concept]),
  ],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService, TypeOrmModule],
})
export class QuizModule {}
