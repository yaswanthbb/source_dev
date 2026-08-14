import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateQaQuestionDto {
  @IsString()
  @IsNotEmpty()
  body: string;
}
