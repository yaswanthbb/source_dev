import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @Min(0)
  orderIndex: number;
}
