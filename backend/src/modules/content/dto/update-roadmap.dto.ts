import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRoadmapDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
