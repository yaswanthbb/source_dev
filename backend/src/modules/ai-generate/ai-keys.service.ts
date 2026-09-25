import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AiProviderKey } from './entities/ai-provider-key.entity';
import { AiGenerationJob } from './entities/ai-generation-job.entity';
import { AiProvider } from '../../common/enums/ai-provider.enum';
import { AiGenerationJobStatus } from '../../common/enums/ai-generation-job.enum';
import { AiKeyCryptoService } from './ai-key-crypto.service';
import {
  AiProviderClients,
  PROVIDER_METAS,
  ProviderMeta,
  defaultModelFor,
} from './ai-provider-clients';
import {
  CreateAiKeyDto,
  UpdateAiKeyDto,
  AiKeyMetadata,
} from './dto/ai-keys.dto';

export const MAX_KEYS_PER_USER = 2;
export const OWN_KEY_MIN_LIMIT = 1;
export const OWN_KEY_MAX_LIMIT = 50;

@Injectable()
export class AiKeysService {
  constructor(
    @InjectRepository(AiProviderKey)
    private readonly keyRepository: Repository<AiProviderKey>,
    @InjectRepository(AiGenerationJob)
    private readonly jobRepository: Repository<AiGenerationJob>,
    private readonly crypto: AiKeyCryptoService,
    private readonly clients: AiProviderClients,
    private readonly configService: ConfigService,
  ) {}

  toMetadata(key: AiProviderKey): AiKeyMetadata {
    return {
      id: key.id,
      provider: key.provider,
      label: key.label,
      keyHint: key.keyHint,
      isDefault: key.isDefault,
      dailyLimit: key.dailyLimit,
      defaultModel: key.defaultModel,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    };
  }

  async listKeys(userId: string): Promise<AiKeyMetadata[]> {
    const keys = await this.keyRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    return keys.map((k) => this.toMetadata(k));
  }

  async getDefaultKey(userId: string): Promise<AiProviderKey | null> {
    return this.keyRepository.findOne({
      where: { userId, isDefault: true },
    });
  }

  /** Internal lookup by id (no ownership check — callers authorize). */
  async getKeyById(id: string): Promise<AiProviderKey | null> {
    return this.keyRepository.findOne({ where: { id } });
  }

  decryptForUse(key: AiProviderKey): string {
    return this.crypto.decrypt(key.keyCiphertext);
  }

  async createKey(
    userId: string,
    dto: CreateAiKeyDto,
  ): Promise<AiKeyMetadata> {
    const existing = await this.keyRepository.count({ where: { userId } });
    if (existing >= MAX_KEYS_PER_USER) {
      throw new BadRequestException(
        `You can store at most ${MAX_KEYS_PER_USER} provider keys. Delete one first.`,
      );
    }

    const trimmed = dto.apiKey.trim();
    // Fail fast: auth failures 400 (dead key rejected); anything else 400
    // (provider unreachable — key not stored). The live list is reused to
    // validate the caller's default-model pick below.
    let liveModels: string[];
    try {
      const listed = await this.clients.listModels(dto.provider, trimmed);
      liveModels = listed.models;
    } catch (err: unknown) {
      if (
        err instanceof HttpException &&
        err.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw err;
      }
      throw new BadRequestException(
        'The API key could not be verified against the provider.',
      );
    }

    const defaultModel = dto.defaultModel?.trim() || null;
    if (defaultModel && !liveModels.includes(defaultModel)) {
      throw new BadRequestException(
        `Unknown model "${defaultModel}" for this provider. Pick one from the live model list.`,
      );
    }

    const key = this.keyRepository.create({
      userId,
      provider: dto.provider,
      keyCiphertext: this.crypto.encrypt(trimmed),
      keyHint: trimmed.slice(-4),
      label: dto.label?.trim() || null,
      // First key becomes the default automatically.
      isDefault: existing === 0,
      dailyLimit: 20,
      defaultModel,
    });
    return this.toMetadata(await this.keyRepository.save(key));
  }

  async updateKey(
    userId: string,
    id: string,
    dto: UpdateAiKeyDto,
  ): Promise<AiKeyMetadata> {
    const key = await this.keyRepository.findOne({
      where: { id, userId },
    });
    if (!key) {
      throw new NotFoundException('API key not found.');
    }

    if (dto.label !== undefined) {
      key.label = dto.label?.trim() || null;
    }
    if (dto.defaultModel !== undefined) {
      const next = dto.defaultModel?.trim() || null;
      if (next) {
        // Validate against the live list using the stored key itself.
        const { models } = await this.clients.listModels(
          key.provider,
          this.decryptForUse(key),
        );
        if (!models.includes(next)) {
          throw new BadRequestException(
            `Unknown model "${next}" for this provider. Pick one from the live model list.`,
          );
        }
      }
      key.defaultModel = next;
    }
    if (dto.dailyLimit !== undefined) {
      key.dailyLimit = Math.min(
        OWN_KEY_MAX_LIMIT,
        Math.max(OWN_KEY_MIN_LIMIT, dto.dailyLimit),
      );
    }
    if (dto.isDefault === true && !key.isDefault) {
      await this.keyRepository.update(
        { userId },
        { isDefault: false },
      );
      key.isDefault = true;
    } else if (dto.isDefault === false) {
      key.isDefault = false;
    }

    return this.toMetadata(await this.keyRepository.save(key));
  }

  async deleteKey(userId: string, id: string): Promise<{ success: true }> {
    const key = await this.keyRepository.findOne({
      where: { id, userId },
    });
    if (!key) {
      throw new NotFoundException('API key not found.');
    }

    // A key driving a live generation job cannot be pulled mid-flight.
    const activeJobs = await this.jobRepository.count({
      where: {
        providerKeyId: id,
        status: In([
          AiGenerationJobStatus.PENDING,
          AiGenerationJobStatus.RUNNING,
        ]),
      },
    });
    if (activeJobs > 0) {
      throw new BadRequestException(
        'This key is in use by a running AI generation job and cannot be deleted until the job finishes.',
      );
    }

    await this.keyRepository.remove(key);
    return { success: true };
  }

  listProviders(): ProviderMeta[] {
    return PROVIDER_METAS;
  }

  /**
   * Pre-save dropdown source (§5): verifies a not-yet-saved key live and
   * returns its model list. The key is never stored or logged.
   */
  async lookupModels(
    provider: AiProvider,
    apiKey: string,
  ): Promise<{ models: string[]; live: boolean; defaultModel: string }> {
    const trimmed = apiKey.trim();
    try {
      const { models } = await this.clients.listModels(provider, trimmed);
      return {
        models,
        live: true,
        defaultModel: defaultModelFor(provider),
      };
    } catch (err: unknown) {
      if (
        err instanceof HttpException &&
        err.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw err;
      }
      throw new BadRequestException(
        'The API key could not be verified against the provider.',
      );
    }
  }

  async getProviderModels(
    userId: string,
    provider: AiProvider,
    keyId?: string,
  ): Promise<{ models: string[]; live: boolean; defaultModel: string }> {
    let apiKey: string | undefined;
    if (keyId) {
      const key = await this.keyRepository.findOne({
        where: { id: keyId, userId },
      });
      if (!key) {
        throw new NotFoundException('API key not found.');
      }
      if (key.provider !== provider) {
        throw new BadRequestException(
          'The key does not belong to this provider.',
        );
      }
      apiKey = this.decryptForUse(key);
    } else if (provider === AiProvider.NVIDIA) {
      apiKey = this.configService.get<string>('NVIDIA_API_KEY')?.trim() || undefined;
    }
    // Gemini without a caller key: curated fallback (live:false).

    const { models, live } = await this.clients.listModels(provider, apiKey);
    return {
      models,
      live,
      defaultModel: this.clients.configuredDefaultModel(provider),
    };
  }
}
