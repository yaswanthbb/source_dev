import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { ArticlesService } from './articles.service';
import { Article } from './entities/article.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Concept } from '../content/entities/concept.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';

import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';
import { makeUser } from '../../common/testing/factories';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let articleRepo: MockRepository;
  let roadmapRepo: MockRepository;
  let conceptRepo: MockRepository;
  let notifications: { safeNotify: jest.Mock };

  const author = makeUser({ id: 'author-1', role: UserRole.DEVELOPER });
  const other = makeUser({ id: 'dev-2', role: UserRole.DEVELOPER });
  const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });

  const article = (overrides = {}) => ({
    id: 'a1',
    title: ' closures ',
    slug: 'closures',
    content: 'Hand-written body.',
    authorId: 'author-1',
    roadmapId: null,
    conceptId: null,
    ...overrides,
  });

  beforeEach(async () => {
    notifications = { safeNotify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: getRepositoryToken(Article),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Roadmap),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Concept),
          useValue: createMockRepository(),
        },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(ArticlesService);
    articleRepo = module.get(getRepositoryToken(Article));
    roadmapRepo = module.get(getRepositoryToken(Roadmap));
    conceptRepo = module.get(getRepositoryToken(Concept));
  });

  afterEach(() => jest.clearAllMocks());

  describe('createArticle — immediate publish, no gate', () => {
    it('publishes with a slug and optional links', async () => {
      articleRepo.findOne.mockResolvedValue(null); // slug free
      roadmapRepo.findOne.mockResolvedValue({ id: 'r1' });
      conceptRepo.findOne.mockResolvedValue({ id: 'c1' });

      await service.createArticle(author, {
        title: 'Closures',
        content: 'Body.',
        roadmapId: 'r1',
        conceptId: 'c1',
      } as any);

      expect(articleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'closures',
          authorId: 'author-1',
          roadmapId: 'r1',
          conceptId: 'c1',
        }),
      );
      expect(articleRepo.save).toHaveBeenCalledTimes(1);
    });

    it('rejects links to missing targets', async () => {
      roadmapRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createArticle(author, {
          title: 'T',
          content: 'B',
          roadmapId: 'missing',
        } as any),
      ).rejects.toThrow('Linked roadmap not found.');
    });
  });

  describe('updateArticle — author/admin only', () => {
    it('forbids strangers', async () => {
      articleRepo.findOne.mockResolvedValue(article());

      await expect(
        service.updateArticle('a1', other, { title: 'Hijack' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('re-slugs on title change', async () => {
      articleRepo.findOne.mockResolvedValue(article());
      articleRepo.findOne.mockResolvedValueOnce(article()).mockResolvedValueOnce(null);

      const result: any = await service.updateArticle('a1', author, {
        title: 'New Title',
      } as any);

      expect(result.slug).toBe('new-title');
    });
  });

  describe('deletion paths', () => {
    it('author deletes silently (no notification)', async () => {
      articleRepo.findOne.mockResolvedValue(article());

      await service.deleteOwnArticle('a1', author);

      expect(articleRepo.remove).toHaveBeenCalled();
      expect(notifications.safeNotify).not.toHaveBeenCalled();
    });

    it('admin delete requires the reason to reach the author', async () => {
      articleRepo.findOne.mockResolvedValue(article());

      await service.deleteArticleAsAdmin('a1', admin, 'Plagiarised.');

      expect(notifications.safeNotify).toHaveBeenCalledWith(
        'author-1',
        NotificationType.ARTICLE_DELETED,
        expect.objectContaining({
          what: 'article',
          whatId: 'a1',
          removedBy: 'Test User',
          reason: 'Plagiarised.',
        }),
      );
      expect(articleRepo.remove).toHaveBeenCalled();
    });

    it('admin deleting own article skips self-notify', async () => {
      articleRepo.findOne.mockResolvedValue(article({ authorId: 'admin-1' }));

      await service.deleteArticleAsAdmin('a1', admin, 'Dup.');

      expect(notifications.safeNotify).toHaveBeenCalledWith(
        null,
        expect.anything(),
        expect.anything(),
      );
    });

    it('404s on missing articles', async () => {
      articleRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteArticleAsAdmin('missing', admin, 'x'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
