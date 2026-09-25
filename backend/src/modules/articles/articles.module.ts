import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Concept } from '../content/entities/concept.entity';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Roadmap, Concept]),
    NotificationsModule,
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
