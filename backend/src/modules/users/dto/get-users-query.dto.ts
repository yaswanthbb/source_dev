import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

export class GetUsersQueryDto {
  @ApiPropertyOptional({ enum: UserRole, description: 'Filter users by role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    example: 'john',
    description: 'Search term for name or email (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
