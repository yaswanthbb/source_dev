import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  questionText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
