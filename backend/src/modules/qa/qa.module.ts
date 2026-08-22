import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { Concept } from '../content/entities/concept.entity';
import { InstructorProfile } from '../users/entities/instructor-profile.entity';
import { AiGenerateModule } from '../ai-generate/ai-generate.module';
import { QaService } from './qa.service';
import { QaController } from './qa.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Answer, Concept, InstructorProfile]),
    AiGenerateModule,
  ],

  controllers: [QaController],
  providers: [QaService],
  exports: [QaService, TypeOrmModule],
})
export class QaModule {}
