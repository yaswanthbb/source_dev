import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  ContentDecisionPayload,
  DeletionPayload,
  AiJobPayload,
} from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';

export type NotificationPayload =
  | ContentDecisionPayload
  | DeletionPayload
  | AiJobPayload
  | Record<string, unknown>;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** Core primitive: one row for one recipient. Fire-and-forget safe. */
  async notify(
    userId: string,
    type: NotificationType,
    payload: NotificationPayload,
  ): Promise<Notification> {
    return this.notificationRepository.save(
      this.notificationRepository.create({
        userId,
        type,
        payload: { ...(payload as Record<string, unknown>) },
      }),
    );
  }

  /** Fan-out to every admin (review queue arrivals). Never throws. */
  async notifyAdmins(
    type: NotificationType,
    payload: NotificationPayload,
    excludeUserId?: string,
  ): Promise<void> {
    try {
      const admins = await this.userRepository.find({
        where: { role: UserRole.ADMIN },
        select: { id: true },
      });
      for (const admin of admins) {
        if (admin.id === excludeUserId) continue;
        await this.notify(admin.id, type, payload);
      }
    } catch {
      // Notifications must never break the operation that triggered them.
    }
  }

  async safeNotify(
    userId: string | null | undefined,
    type: NotificationType,
    payload: NotificationPayload,
  ): Promise<void> {
    if (!userId) return;
    try {
      await this.notify(userId, type, payload);
    } catch {
      // Notifications must never break the operation that triggered them.
    }
  }

  async listNotifications(
    userId: string,
    opts?: { type?: NotificationType; unreadOnly?: boolean },
  ): Promise<Notification[]> {
    const where: Record<string, unknown> = { userId };
    if (opts?.type) where.type = opts.type;
    if (opts?.unreadOnly) where.isRead = false;
    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async unreadCount(userId: string): Promise<{ unread: number }> {
    const unread = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
    return { unread };
  }

  async markRead(userId: string, id: string): Promise<Notification | null> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) return null;
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }
    return notification;
  }

  async markAllRead(userId: string): Promise<{ marked: number }> {
    const unread = await this.notificationRepository.find({
      where: { userId, isRead: false },
      select: { id: true },
    });
    if (unread.length === 0) return { marked: 0 };
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return { marked: unread.length };
  }
}
