import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';

import { AiKeysService } from './ai-keys.service';
import { AiProviderKey } from './entities/ai-provider-key.entity';
import { AiGenerationJob } from './entities/ai-generation-job.entity';
import { AiKeyCryptoService } from './ai-key-crypto.service';
import { AiProviderClients } from './ai-provider-clients';
import { AiProvider } from '../../common/enums/ai-provider.enum';
import { AiGenerationJobStatus } from '../../common/enums/ai-generation-job.enum';

import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';

describe('AiKeysService', () => {
  let service: AiKeysService;
  let keyRepo: MockRepository;
  let jobRepo: MockRepository;
  let crypto: { encrypt: jest.Mock; decrypt: jest.Mock };
  let clients: { listModels: jest.Mock; configuredDefaultModel: jest.Mock };

  beforeEach(async () => {
    crypto = { encrypt: jest.fn(), decrypt: jest.fn() };
    clients = {
      listModels: jest.fn(),
      configuredDefaultModel: jest.fn(
        (p: string) =>
          p === 'gemini' ? 'gemini-2.0-flash' : 'meta/llama-3.1-70b-instruct',
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiKeysService,
        {
          provide: getRepositoryToken(AiProviderKey),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(AiGenerationJob),
          useValue: createMockRepository(),
        },
        { provide: AiKeyCryptoService, useValue: crypto },
        { provide: AiProviderClients, useValue: clients },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(AiKeysService);
    keyRepo = module.get(getRepositoryToken(AiProviderKey));
    jobRepo = module.get(getRepositoryToken(AiGenerationJob));
  });

  afterEach(() => jest.clearAllMocks());

  const storedKey = (overrides = {}) => ({
    id: 'key-1',
    userId: 'u1',
    provider: AiProvider.NVIDIA,
    keyCiphertext: 'v1:...',
    keyHint: '1234',
    label: null,
    isDefault: false,
    dailyLimit: 20,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });

  describe('createKey', () => {
    beforeEach(() => {
      keyRepo.count.mockResolvedValue(0);
      clients.listModels.mockResolvedValue({ models: ['m1'], live: true });
      crypto.encrypt.mockReturnValue('v1:enc');
      keyRepo.save.mockImplementation(async (k: any) => ({ ...k, id: 'key-1' }));
    });

    it('stores encrypted material and returns metadata only', async () => {
      const result: any = await service.createKey('u1', {
        provider: AiProvider.NVIDIA,
        apiKey: 'nvapi-xxx1234',
      } as any);

      expect(crypto.encrypt).toHaveBeenCalledWith('nvapi-xxx1234');
      expect(result.keyHint).toBe('1234');
      expect(result).not.toHaveProperty('keyCiphertext');
      expect(result).not.toHaveProperty('apiKey');
      expect(result.isDefault).toBe(true); // first key auto-default
    });

    it('rejects a third key', async () => {
      keyRepo.count.mockResolvedValue(2);

      await expect(
        service.createKey('u1', {
          provider: AiProvider.GEMINI,
          apiKey: 'AIza-xxx',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(keyRepo.save).not.toHaveBeenCalled();
    });

    it('rejects a key the provider refuses', async () => {
      clients.listModels.mockRejectedValue(new BadRequestException('nope'));

      await expect(
        service.createKey('u1', {
          provider: AiProvider.NVIDIA,
          apiKey: 'bad-key-12345678',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(keyRepo.save).not.toHaveBeenCalled();
    });

    it('stores a validated default model pick', async () => {
      clients.listModels.mockResolvedValue({ models: ['m1', 'm2'], live: true });

      const result: any = await service.createKey('u1', {
        provider: AiProvider.NVIDIA,
        apiKey: 'nvapi-xxx1234',
        defaultModel: 'm2',
      } as any);

      expect(result.defaultModel).toBe('m2');
    });

    it('rejects an unknown default model pick', async () => {
      clients.listModels.mockResolvedValue({ models: ['m1'], live: true });

      await expect(
        service.createKey('u1', {
          provider: AiProvider.NVIDIA,
          apiKey: 'nvapi-xxx1234',
          defaultModel: 'nope',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(keyRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateKey', () => {
    it('clamps the daily cap to 1–50 with no confirmation needed', async () => {
      keyRepo.findOne.mockResolvedValue(storedKey());

      const result: any = await service.updateKey('u1', 'key-1', {
        dailyLimit: 99,
      } as any);

      expect(result.dailyLimit).toBe(50);
    });

    it('hands the default flag over, clearing the previous default', async () => {
      keyRepo.findOne.mockResolvedValue(storedKey());

      const result: any = await service.updateKey('u1', 'key-1', {
        isDefault: true,
      } as any);

      expect(keyRepo.update).toHaveBeenCalledWith(
        { userId: 'u1' },
        { isDefault: false },
      );
      expect(result.isDefault).toBe(true);
    });

    it('404s on another user\u2019s key', async () => {
      keyRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateKey('u1', 'key-2', { label: 'x' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('validates a default-model change against the live list', async () => {
      keyRepo.findOne.mockResolvedValue(storedKey());
      crypto.decrypt.mockReturnValue('plain-key');
      clients.listModels.mockResolvedValue({ models: ['m1'], live: true });

      const result: any = await service.updateKey('u1', 'key-1', {
        defaultModel: 'm1',
      } as any);

      expect(result.defaultModel).toBe('m1');

      await expect(
        service.updateKey('u1', 'key-1', { defaultModel: 'nope' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('clears the default model with null', async () => {
      keyRepo.findOne.mockResolvedValue(storedKey({ defaultModel: 'm1' }));

      const result: any = await service.updateKey('u1', 'key-1', {
        defaultModel: null,
      } as any);

      expect(result.defaultModel).toBeNull();
      expect(clients.listModels).not.toHaveBeenCalled();
    });
  });

  describe('deleteKey — in-use lock', () => {
    it('blocks deletion while a job is pending/running on the key', async () => {
      keyRepo.findOne.mockResolvedValue(storedKey());
      jobRepo.count.mockResolvedValue(1);

      await expect(service.deleteKey('u1', 'key-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(keyRepo.remove).not.toHaveBeenCalled();
    });

    it('deletes an idle key', async () => {
      keyRepo.findOne.mockResolvedValue(storedKey());
      jobRepo.count.mockResolvedValue(0);

      await expect(service.deleteKey('u1', 'key-1')).resolves.toEqual({
        success: true,
      });
      expect(keyRepo.remove).toHaveBeenCalled();
    });

    it('checks pending AND running statuses for the lock', async () => {
      keyRepo.findOne.mockResolvedValue(storedKey());
      jobRepo.count.mockResolvedValue(0);

      await service.deleteKey('u1', 'key-1');

      expect(jobRepo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            providerKeyId: 'key-1',
            status: In([
              AiGenerationJobStatus.PENDING,
              AiGenerationJobStatus.RUNNING,
            ]),
          }),
        }),
      );
    });
  });

  describe('getProviderModels', () => {
    it('uses the owned key for the matching provider', async () => {
      keyRepo.findOne.mockResolvedValue(storedKey());
      crypto.decrypt.mockReturnValue('plain-key');
      clients.listModels.mockResolvedValue({ models: ['m1'], live: true });

      const result = await service.getProviderModels(
        'u1',
        AiProvider.NVIDIA,
        'key-1',
      );

      expect(clients.listModels).toHaveBeenCalledWith(
        AiProvider.NVIDIA,
        'plain-key',
      );
      expect(result).toMatchObject({ models: ['m1'], live: true });
      expect(result.defaultModel).toBeDefined();
    });

    it('rejects a keyId from another provider', async () => {
      keyRepo.findOne.mockResolvedValue(
        storedKey({ provider: AiProvider.NVIDIA }),
      );

      await expect(
        service.getProviderModels('u1', AiProvider.GEMINI, 'key-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('falls back without a key (curated list, live:false for Gemini)', async () => {
      clients.listModels.mockResolvedValue({ models: ['g1'], live: false });

      const result = await service.getProviderModels(
        'u1',
        AiProvider.GEMINI,
      );

      expect(clients.listModels).toHaveBeenCalledWith(
        AiProvider.GEMINI,
        undefined,
      );
      expect(result.live).toBe(false);
    });
  });

  it('lists keys as metadata (never ciphertext)', async () => {
    keyRepo.find.mockResolvedValue([storedKey()]);

    const [row]: any[] = await service.listKeys('u1');

    expect(row).not.toHaveProperty('keyCiphertext');
    expect(row.keyHint).toBe('1234');
  });

  describe('lookupModels — pre-save dropdown source', () => {
    it('returns the verified live list without storing anything', async () => {
      clients.listModels.mockResolvedValue({ models: ['m1'], live: true });

      const result = await service.lookupModels(
        AiProvider.GEMINI,
        'AIza-fresh-key',
      );

      expect(result).toMatchObject({ models: ['m1'], live: true });
      expect(result.defaultModel).toBeDefined();
      expect(keyRepo.save).not.toHaveBeenCalled();
      expect(keyRepo.create).not.toHaveBeenCalled();
    });

    it('surfaces key rejection as 400', async () => {
      clients.listModels.mockRejectedValue(new BadRequestException('nope'));

      await expect(
        service.lookupModels(AiProvider.NVIDIA, 'bad-key-12345678'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
