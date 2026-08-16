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
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { ApplyInstructorDto } from './dto/apply-instructor.dto';
import { RequestDeletionDto } from './dto/request-deletion.dto';

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

  @Post('apply-instructor')
  @ApiOperation({
    summary: 'Student requests/applies to be promoted to instructor',
  })
  @ApiResponse({
    status: 201,
    description: 'Instructor application submitted for admin review.',
  })
  @ApiResponse({
    status: 400,
    description: 'Already instructor/admin or application already pending.',
  })
  async applyForInstructor(
    @CurrentUser() user: User,
    @Body() dto: ApplyInstructorDto,
  ) {
    return this.usersService.applyForInstructor(user.id, dto);
  }

  @Get('instructor-applications')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'List all instructor applicants and approved instructors (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor applications and approved instructors retrieved.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async getInstructorApplications() {
    return this.usersService.getAllInstructorsAndApplicants();
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
  @ApiOperation({
    summary: 'Directly promote a user to instructor role (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User promoted directly to instructor with approved status.',
  })
  async promoteToInstructor(
    @Param('id') id: string,
    @CurrentUser() adminUser: User,
  ) {
    return this.usersService.promoteToInstructor(id, adminUser.id);
  }

  @Patch(':id/demote-to-student')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Demote/degrade an instructor back to student role (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User degraded to student role.',
  })
  async demoteToStudent(@Param('id') id: string) {
    return this.usersService.demoteToStudent(id);
  }

  @Patch(':id/degrade-to-student')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Alias for degrading an instructor to student role (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User degraded to student role.',
  })
  async degradeToStudent(@Param('id') id: string) {
    return this.usersService.demoteToStudent(id);
  }

  @Patch(':id/approve-instructor')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Approve a pending instructor application and set role to instructor (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor application approved and role updated.',
  })
  async approveInstructor(@Param('id') id: string) {
    return this.usersService.approveInstructor(id);
  }

  @Patch(':id/reject-instructor')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reject a pending instructor application (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor application rejected.',
  })
  async rejectInstructor(@Param('id') id: string) {
    return this.usersService.rejectInstructor(id);
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
