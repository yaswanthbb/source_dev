import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Article } from './entities/article.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Concept } from '../content/entities/concept.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { slugify } from '../../common/utils/slugify.util';
import {
  CreateArticleDto,
  UpdateArticleDto,
} from './dto/articles.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Roadmap)
    private readonly roadmapRepository: Repository<Roadmap>,
    @InjectRepository(Concept)
    private readonly conceptRepository: Repository<Concept>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private checkOwnership(
    ownerId: string | null,
    user: Omit<User, 'passwordHash'>,
  ): void {
    if (user.role === UserRole.ADMIN) return;
    if (ownerId && ownerId === user.id) return;
    throw new ForbiddenException(
      'You do not have permission to modify this article',
    );
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    let slug = base;
    let n = 1;
    while (await this.articleRepository.findOne({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }
    return slug;
  }

  private async resolveLinks(dto: {
    roadmapId?: string | null;
    conceptId?: string | null;
  }): Promise<{ roadmapId: string | null; conceptId: string | null }> {
    let roadmapId: string | null = null;
    let conceptId: string | null = null;
    if (dto.roadmapId !== undefined) {
      if (dto.roadmapId === null) {
        roadmapId = null;
      } else {
        const roadmap = await this.roadmapRepository.findOne({
          where: { id: dto.roadmapId },
        });
        if (!roadmap) {
          throw new BadRequestException('Linked roadmap not found.');
        }
        roadmapId = roadmap.id;
      }
    }
    if (dto.conceptId !== undefined) {
      if (dto.conceptId === null) {
        conceptId = null;
      } else {
        const concept = await this.conceptRepository.findOne({
          where: { id: dto.conceptId },
        });
        if (!concept) {
          throw new BadRequestException('Linked concept not found.');
        }
        conceptId = concept.id;
      }
    }
    return { roadmapId, conceptId };
  }

  /** Public: newest first, optional title search. No login required. */
  async findAllArticles(search?: string): Promise<Article[]> {
    if (search) {
      return this.articleRepository.find({
        where: { title: ILike(`%${search}%`) },
        relations: ['author'],
        order: { createdAt: 'DESC' },
      });
    }
    return this.articleRepository.find({
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Public: no login required. */
  async findArticleById(id: string): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  /** Any authenticated developer: publishes immediately, no review gate. */
  async createArticle(
    user: Omit<User, 'passwordHash'>,
    dto: CreateArticleDto,
  ): Promise<Article> {
    const { roadmapId, conceptId } = await this.resolveLinks(dto);
    const article = this.articleRepository.create({
      title: dto.title,
      slug: await this.generateUniqueSlug(dto.title),
      content: dto.content,
      authorId: user.id,
      roadmapId,
      conceptId,
    });
    return this.articleRepository.save(article);
  }

  async updateArticle(
    id: string,
    user: Omit<User, 'passwordHash'>,
    dto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    this.checkOwnership(article.authorId, user);

    if (dto.title && dto.title !== article.title) {
      article.title = dto.title;
      article.slug = await this.generateUniqueSlug(dto.title);
    }
    if (dto.content !== undefined) {
      article.content = dto.content;
    }
    if (dto.roadmapId !== undefined || dto.conceptId !== undefined) {
      const links = await this.resolveLinks(dto);
      if (dto.roadmapId !== undefined) article.roadmapId = links.roadmapId;
      if (dto.conceptId !== undefined) article.conceptId = links.conceptId;
    }
    return this.articleRepository.save(article);
  }

  /** Author removes their own article silently; admins go through deleteArticleAsAdmin. */
  async deleteOwnArticle(
    id: string,
    user: Omit<User, 'passwordHash'>,
  ): Promise<void> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    this.checkOwnership(article.authorId, user);
    await this.articleRepository.remove(article);
  }

  /**
   * Admin moderation delete: requires a specific reason, delivered to the
   * author through the notification system (§6 + §7 contract).
   */
  async deleteArticleAsAdmin(
    id: string,
    admin: Omit<User, 'passwordHash'>,
    reason: string,
  ): Promise<{ success: true }> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    await this.notificationsService.safeNotify(
      article.authorId && article.authorId !== admin.id
        ? article.authorId
        : null,
      NotificationType.ARTICLE_DELETED,
      {
        what: 'article',
        whatId: article.id,
        title: article.title,
        removedBy: admin.name ?? admin.id,
        removedAt: new Date().toISOString(),
        reason,
        effectiveAt: null,
      },
    );

    await this.articleRepository.remove(article);
    return { success: true };
  }
}
