import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { ChangePasswordDto } from './dto/change-password.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { RequestDeletionDto } from './dto/request-deletion.dto';

@ApiTags('Users')
@ApiBearerAuth('bearer-auth')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  async getSelfProfile(@CurrentUser() user: User) {
    return this.usersService.getSelfProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile (name, timezone, profilePicture)',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  async updateSelfProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateOwnProfileDto,
  ) {
    return this.usersService.updateSelfProfile(user.id, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change current user account password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect.' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List and filter users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Filtered user list retrieved.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async findUsers(@Query() query: GetUsersQueryDto) {
    return this.usersService.findUsers(query);
  }

  @Post('request-deletion')
  @ApiOperation({ summary: 'User submits an account deletion request' })
  @ApiResponse({
    status: 201,
    description: 'Account deletion request submitted.',
  })
  async requestAccountDeletion(
    @CurrentUser() user: User,
    @Body() dto: RequestDeletionDto,
  ) {
    return this.usersService.requestAccountDeletion(user.id, dto);
  }

  @Get('me/deletion-request')
  @ApiOperation({ summary: 'Get current user account deletion request status' })
  @ApiResponse({
    status: 200,
    description: 'Account deletion request retrieved.',
  })
  async getMyDeletionRequest(@CurrentUser() user: User) {
    return this.usersService.getMyDeletionRequest(user.id);
  }

  @Get('deletion-requests')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all account deletion requests (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of account deletion requests.',
  })
  async getAllDeletionRequests() {
    return this.usersService.getAllDeletionRequests();
  }

  @Patch('deletion-requests/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Approve account deletion and delete user (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Deletion request approved and user deleted.',
  })
  async approveDeletionRequest(
    @Param('id') id: string,
    @CurrentUser() adminUser: User,
  ) {
    return this.usersService.approveDeletionRequest(id, adminUser.id);
  }

  @Patch('deletion-requests/:id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject account deletion request (Admin only)' })
  @ApiResponse({ status: 200, description: 'Deletion request rejected.' })
  async rejectDeletionRequest(
    @Param('id') id: string,
    @CurrentUser() adminUser: User,
  ) {
    return this.usersService.rejectDeletionRequest(id, adminUser.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Directly delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  async deleteUser(@Param('id') id: string, @CurrentUser() adminUser: User) {
    return this.usersService.deleteUser(id, adminUser.id);
  }
}
