import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerReviewItemDto {
  @ApiProperty({ description: 'ID of the selected MCQ option' })
  @IsNotEmpty()
  @IsUUID()
  selectedOptionId: string;
}
