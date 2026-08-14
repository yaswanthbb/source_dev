import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';
import { InstructorStatus } from '../../../common/enums/instructor-status.enum';

export class GetUsersQueryDto {
  @ApiPropertyOptional({ enum: UserRole, description: 'Filter users by role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: InstructorStatus,
    description: 'Filter instructors by profile approval status',
  })
  @IsOptional()
  @IsEnum(InstructorStatus)
  instructorStatus?: InstructorStatus;

  @ApiPropertyOptional({
    example: 'john',
    description: 'Search term for name or email (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
