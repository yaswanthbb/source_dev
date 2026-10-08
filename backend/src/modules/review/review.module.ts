import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewItem } from './entities/review-item.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { XpEvent } from '../gamification/entities/xp-event.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ConfigModule } from '@nestjs/config';
import { ModuleConcept } from '../content/entities/module-concept.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ReviewItem, McqQuestion, XpEvent, ModuleConcept]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
