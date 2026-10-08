import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AiGenerateModule } from '../ai-generate/ai-generate.module';
import { AiPromptVersion } from '../ai-generate/entities/ai-prompt-version.entity';
import { AiGenerationLog } from '../ai-generate/entities/ai-generation-log.entity';
import { ConceptCompilation } from '../ai-generate/entities/concept-compilation.entity';
import { CourseTerm } from '../ai-generate/entities/course-term.entity';
import { CourseConceptEdge } from '../ai-generate/entities/course-concept-edge.entity';
import { ConceptMedia } from '../ai-generate/entities/concept-media.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { ModuleConceptPrerequisite } from '../content/entities/module-concept-prerequisite.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { McqOption } from '../quiz/entities/mcq-option.entity';
import { McqAttempt } from '../quiz/entities/mcq-attempt.entity';
import { EvalRun } from './entities/eval-run.entity';
import { EvalComparison } from './entities/eval-comparison.entity';
import { EvalPromptRelease } from './entities/eval-prompt-release.entity';
import { EvalExpertReview } from './entities/eval-expert-review.entity';
import { EvalService } from './eval.service';
import { EvalJudgeService } from './eval-judge.service';
import { EvalPsychometricsService } from './eval-psychometrics.service';
import { EvalEvents } from './eval-events';
import { EvalLinksService } from './eval-links.service';
import { EvalController, EvalQuestionController } from './eval.controller';
@Module({
  imports: [
    ConfigModule,
    AiGenerateModule,
    TypeOrmModule.forFeature([
      EvalRun,
      EvalComparison,
      EvalPromptRelease,
      EvalExpertReview,
      AiPromptVersion,
      AiGenerationLog,
      ConceptCompilation,
      CourseTerm,
      CourseConceptEdge,
      ConceptMedia,
      ModuleConcept,
      ModuleConceptPrerequisite,
      McqQuestion,
      McqOption,
      McqAttempt,
    ]),
  ],
  providers: [
    EvalService,
    EvalJudgeService,
    EvalPsychometricsService,
    EvalEvents,
    EvalLinksService,
  ],
  controllers: [EvalController, EvalQuestionController],
  exports: [EvalService, EvalEvents],
})
export class EvalModule {}
