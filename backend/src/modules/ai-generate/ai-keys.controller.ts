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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { AiProvider } from '../../common/enums/ai-provider.enum';
import { AiKeysService } from './ai-keys.service';
import {
  CreateAiKeyDto,
  UpdateAiKeyDto,
  AiKeyMetadata,
  LookupModelsDto,
} from './dto/ai-keys.dto';

@ApiTags('AI Provider Keys (BYOK)')
@ApiBearerAuth('bearer-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DEVELOPER, UserRole.ADMIN)
@Controller()
export class AiKeysController {
  constructor(private readonly aiKeysService: AiKeysService) {}

  @Post('ai-keys')
  @ApiOperation({
    summary:
      'Store one of your own provider API keys (max 2, encrypted at rest, never returned)',
  })
  @ApiResponse({ status: 201, description: 'Key stored (metadata only).' })
  @ApiResponse({
    status: 400,
    description: 'Key limit reached or key rejected by the provider.',
  })
  async createKey(
    @CurrentUser() user: User,
    @Body() dto: CreateAiKeyDto,
  ): Promise<AiKeyMetadata> {
    return this.aiKeysService.createKey(user.id, dto);
  }

  @Get('ai-keys')
  @ApiOperation({
    summary: 'List your stored provider keys (metadata only, never secrets)',
  })
  @ApiResponse({ status: 200, description: 'Key metadata list.' })
  async listKeys(@CurrentUser() user: User): Promise<AiKeyMetadata[]> {
    return this.aiKeysService.listKeys(user.id);
  }

  @Patch('ai-keys/:id')
  @ApiOperation({
    summary:
      'Update key label, daily cap (1–50), or mark as the default key',
  })
  @ApiResponse({ status: 200, description: 'Key metadata updated.' })
  @ApiResponse({ status: 404, description: 'Key not found.' })
  async updateKey(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateAiKeyDto,
  ): Promise<AiKeyMetadata> {
    return this.aiKeysService.updateKey(user.id, id, dto);
  }

  @Delete('ai-keys/:id')
  @ApiOperation({
    summary:
      'Delete a stored key (blocked while a generation job is using it; usage falls back to the free tier)',
  })
  @ApiResponse({ status: 200, description: 'Key deleted.' })
  @ApiResponse({
    status: 400,
    description: 'Key is in use by a running generation job.',
  })
  async deleteKey(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    return this.aiKeysService.deleteKey(user.id, id);
  }

  @Get('ai-providers')
  @ApiOperation({ summary: 'List supported AI providers and their defaults' })
  @ApiResponse({ status: 200, description: 'Provider metadata.' })
  async listProviders() {
    return this.aiKeysService.listProviders();
  }

  @Get('ai-providers/:provider/models')
  @ApiOperation({
    summary:
      'Live model list for a provider (auto-fetched; curated fallback when unreachable)',
  })
  @ApiResponse({ status: 200, description: 'Model list with liveness flag.' })
  async listModels(
    @CurrentUser() user: User,
    @Param('provider') provider: string,
    @Query('keyId') keyId?: string,
  ) {
    if (provider !== AiProvider.NVIDIA && provider !== AiProvider.GEMINI) {
      throw new BadRequestException(
        'Unknown provider. Expected nvidia or gemini.',
      );
    }
    return this.aiKeysService.getProviderModels(user.id, provider, keyId);
  }

  @Post('ai-providers/:provider/models/lookup')
  @ApiOperation({
    summary:
      'Pre-save dropdown source: verify a not-yet-saved key and list its models (key never stored)',
  })
  @ApiResponse({ status: 200, description: 'Verified live model list.' })
  @ApiResponse({ status: 400, description: 'Key rejected or unreachable.' })
  async lookupModels(
    @Param('provider') provider: string,
    @Body() dto: LookupModelsDto,
  ) {
    if (provider !== AiProvider.NVIDIA && provider !== AiProvider.GEMINI) {
      throw new BadRequestException(
        'Unknown provider. Expected nvidia or gemini.',
      );
    }
    return this.aiKeysService.lookupModels(provider, dto.apiKey);
  }
}
