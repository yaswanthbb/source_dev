import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('bearer-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DEVELOPER, UserRole.ADMIN)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List your notifications, newest first (filterable by type)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by notification type',
  })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    description: 'Only unread (true/false)',
  })
  @ApiResponse({ status: 200, description: 'Notification list.' })
  async list(
    @CurrentUser() user: User,
    @Query('type') type?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    let parsedType: NotificationType | undefined;
    if (type !== undefined) {
      const values = Object.values(NotificationType) as string[];
      if (!values.includes(type)) {
        throw new BadRequestException(
          `Unknown notification type. Expected one of: ${values.join(', ')}.`,
        );
      }
      parsedType = type as NotificationType;
    }
    return this.notificationsService.listNotifications(user.id, {
      type: parsedType,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Count your unread notifications (bell badge)' })
  @ApiResponse({ status: 200, description: 'Unread count.' })
  async unreadCount(@CurrentUser() user: User) {
    return this.notificationsService.unreadCount(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification read' })
  @ApiResponse({ status: 200, description: 'Notification marked read.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  async markRead(@CurrentUser() user: User, @Param('id') id: string) {
    const notification = await this.notificationsService.markRead(
      user.id,
      id,
    );
    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }
    return notification;
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all your notifications read' })
  @ApiResponse({ status: 200, description: 'Count marked.' })
  async markAllRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllRead(user.id);
  }
}
