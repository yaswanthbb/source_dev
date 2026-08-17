import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { AiGenerateService } from './ai-generate.service';
import { AiGenerateController } from './ai-generate.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AiGenerationLog]), ConfigModule],
  controllers: [AiGenerateController],
  providers: [AiGenerateService],
  exports: [AiGenerateService],
})
export class AiGenerateModule {}
