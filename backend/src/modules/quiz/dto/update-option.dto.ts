import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOptionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  optionText?: string;

  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
}
