import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from './entities/user.entity';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';

@ApiTags('Users')
@ApiBearerAuth('bearer-auth')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary:
      'Get current user profile (includes instructorProfile if applicable)',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  async getSelfProfile(@CurrentUser() user: User) {
    return this.usersService.getSelfProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile (name, timezone)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  async updateSelfProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateOwnProfileDto,
  ) {
    return this.usersService.updateSelfProfile(user.id, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List and filter users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Filtered user list retrieved.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async findUsers(@Query() query: GetUsersQueryDto) {
    return this.usersService.findUsers(query);
  }

  @Patch(':id/promote-to-instructor')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Promote a user to instructor role (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User promoted to instructor with pending profile.',
  })
  async promoteToInstructor(
    @Param('id') id: string,
    @CurrentUser() adminUser: User,
  ) {
    return this.usersService.promoteToInstructor(id, adminUser.id);
  }

  @Patch(':id/approve-instructor')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Approve a pending instructor application (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Instructor application approved.' })
  async approveInstructor(@Param('id') id: string) {
    return this.usersService.approveInstructor(id);
  }

  @Patch(':id/reject-instructor')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reject a pending instructor application (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Instructor application rejected.' })
  async rejectInstructor(@Param('id') id: string) {
    return this.usersService.rejectInstructor(id);
  }
}
