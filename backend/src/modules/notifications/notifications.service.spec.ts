import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';

import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser } from '../../common/testing/factories';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepo: MockRepository;
  let userRepo: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
    notificationRepo = module.get(getRepositoryToken(Notification));
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  const row = (overrides = {}) => ({
    id: 'n1',
    userId: 'u1',
    type: NotificationType.ROADMAP_PUBLISHED,
    payload: { roadmapId: 'r1' },
    isRead: false,
    readAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });

  describe('notify / safeNotify', () => {
    it('creates one row for one recipient', async () => {
      await service.notify('u1', NotificationType.ROADMAP_PUBLISHED, {
        roadmapId: 'r1',
      });

      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          type: NotificationType.ROADMAP_PUBLISHED,
        }),
      );
      expect(notificationRepo.save).toHaveBeenCalledTimes(1);
    });

    it('fans out to every admin except the excluded user', async () => {
      userRepo.find.mockResolvedValue([
        makeUser({ id: 'a1', role: UserRole.ADMIN }),
        makeUser({ id: 'a2', role: UserRole.ADMIN }),
      ]);

      await service.notifyAdmins(
        NotificationType.ROADMAP_SUBMITTED,
        { roadmapId: 'r1' },
        'a1',
      );

      expect(notificationRepo.create).toHaveBeenCalledTimes(1);
      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'a2' }),
      );
    });

    it('safeNotify swallows failures and skips empty recipients', async () => {
      await service.safeNotify(null, NotificationType.ROADMAP_PUBLISHED, {});
      await service.safeNotify(undefined, NotificationType.ROADMAP_PUBLISHED, {});
      expect(notificationRepo.create).not.toHaveBeenCalled();

      notificationRepo.save.mockRejectedValueOnce(new Error('db down'));
      await expect(
        service.safeNotify('u1', NotificationType.ROADMAP_PUBLISHED, {}),
      ).resolves.toBeUndefined();
    });
  });

  describe('reads', () => {
    it('lists newest-first with optional type + unread filters', async () => {
      notificationRepo.find.mockResolvedValue([row()]);

      await service.listNotifications('u1', {
        type: NotificationType.AI_JOB_COMPLETED,
        unreadOnly: true,
      });

      expect(notificationRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'u1',
            type: NotificationType.AI_JOB_COMPLETED,
            isRead: false,
          },
          order: { createdAt: 'DESC' },
        }),
      );
    });

    it('counts unread for the bell badge', async () => {
      notificationRepo.count.mockResolvedValue(3);

      await expect(service.unreadCount('u1')).resolves.toEqual({ unread: 3 });
      expect(notificationRepo.count).toHaveBeenCalledWith({
        where: { userId: 'u1', isRead: false },
      });
    });

    it('marks one read, scoped to the owner', async () => {
      notificationRepo.findOne.mockResolvedValue(row());

      const result: any = await service.markRead('u1', 'n1');

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeInstanceOf(Date);
      expect(notificationRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'n1', userId: 'u1' },
      });
    });

    it('returns null for another user\u2019s notification', async () => {
      notificationRepo.findOne.mockResolvedValue(null);

      await expect(service.markRead('u1', 'n2')).resolves.toBeNull();
      expect(notificationRepo.save).not.toHaveBeenCalled();
    });

    it('marks all read and reports the count', async () => {
      notificationRepo.find.mockResolvedValue([row(), row({ id: 'n2' })]);

      await expect(service.markAllRead('u1')).resolves.toEqual({ marked: 2 });
      expect(notificationRepo.update).toHaveBeenCalledWith(
        { userId: 'u1', isRead: false },
        expect.objectContaining({ isRead: true }),
      );
    });
  });
});
