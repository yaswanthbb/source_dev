import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
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
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { ArticlesService } from './articles.service';
import {
  CreateArticleDto,
  UpdateArticleDto,
  DeleteArticleDto,
} from './dto/articles.dto';

@ApiTags('Articles')
@ApiBearerAuth('bearer-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List public articles, newest first (no login required)',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Article list.' })
  async findAll(@Query('search') search?: string) {
    return this.articlesService.findAllArticles(search);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Read a public article (no login required)' })
  @ApiResponse({ status: 200, description: 'Article detail.' })
  @ApiResponse({ status: 404, description: 'Article not found.' })
  async findOne(@Param('id') id: string) {
    return this.articlesService.findArticleById(id);
  }

  @Post()
  @Roles(UserRole.DEVELOPER, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Publish a hand-written article immediately (no review gate)',
  })
  @ApiResponse({ status: 201, description: 'Article published.' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateArticleDto,
  ) {
    return this.articlesService.createArticle(user, dto);
  }

  @Patch(':id')
  @Roles(UserRole.DEVELOPER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Edit an article (author / admin)' })
  @ApiResponse({ status: 200, description: 'Article updated.' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articlesService.updateArticle(id, user, dto);
  }

  @Delete(':id')
  @Roles(UserRole.DEVELOPER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete your own article' })
  @ApiResponse({ status: 200, description: 'Article deleted.' })
  @HttpCode(HttpStatus.OK)
  async deleteOwn(@Param('id') id: string, @CurrentUser() user: User) {
    await this.articlesService.deleteOwnArticle(id, user);
    return { success: true };
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Admin moderation delete (requires a reason, delivered to the author)',
  })
  @ApiResponse({ status: 200, description: 'Article deleted, author notified.' })
  @HttpCode(HttpStatus.OK)
  async deleteAsAdmin(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body() dto: DeleteArticleDto,
  ) {
    return this.articlesService.deleteArticleAsAdmin(id, admin, dto.reason);
  }
}
