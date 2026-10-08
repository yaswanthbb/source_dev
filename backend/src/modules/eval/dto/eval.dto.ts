import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
  IsIn,
  IsObject,
} from 'class-validator';
import { AiGenerationType } from '../../../common/enums/ai-generation-type.enum';
import { CreateQuestionDto } from '../../quiz/dto/create-question.dto';
import type { EvalExpertReview } from '../entities/eval-expert-review.entity';
export class EvalVersionDto {
  @IsEnum(AiGenerationType) task: AiGenerationType;
  @IsString() @IsNotEmpty() @MaxLength(32) version: string;
}
export class EvalCandidateDto extends EvalVersionDto {
  @IsString() @IsNotEmpty() @MaxLength(30000) systemTemplate: string;
  @IsString() @IsNotEmpty() @MaxLength(2000) changelog: string;
}
export class EvalCompareDto {
  @IsEnum(AiGenerationType) task: AiGenerationType;
  @IsString() @IsNotEmpty() @MaxLength(32) baselineVersion: string;
  @IsString() @IsNotEmpty() @MaxLength(32) candidateVersion: string;
}
export class EvalCompilationDto {
  @IsOptional() @IsBoolean() judge?: boolean;
}
export class EvalExpertReviewDto {
  @IsIn(['approve', 'edit', 'reject']) decision: EvalExpertReview['decision'];
  @IsArray()
  @ArrayMaxSize(6)
  @IsIn(
    ['accuracy', 'clarity', 'pedagogy', 'difficulty', 'evidence', 'other'],
    { each: true },
  )
  reasonCodes: string[];
  @IsString() @IsNotEmpty() @MaxLength(2000) reason: string;
  @IsObject() scores: EvalExpertReview['scores'];
  @IsOptional() @IsString() @MaxLength(60000) proposedRevision?: string;
}
export class EvalReplacementDto extends CreateQuestionDto {
  @IsString() @IsNotEmpty() @MaxLength(1000) reason: string;
}
