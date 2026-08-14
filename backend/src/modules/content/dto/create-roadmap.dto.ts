import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoadmapDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
