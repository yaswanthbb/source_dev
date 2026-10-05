import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AiPromptRegistry } from './ai-prompt-registry.service';
import { AiPromptVersion } from './entities/ai-prompt-version.entity';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import { AiPromptStatus } from '../../common/enums/ai-prompt-status.enum';

import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';

describe('AiPromptRegistry', () => {
  let service: AiPromptRegistry;
  let promptRepo: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiPromptRegistry,
        {
          provide: getRepositoryToken(AiPromptVersion),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(AiPromptRegistry);
    promptRepo = module.get(getRepositoryToken(AiPromptVersion));
  });

  afterEach(() => jest.clearAllMocks());

  const productionRow = (overrides = {}) => ({
    id: 'p1',
    task: AiGenerationType.CONCEPT_CONTENT,
    version: '1.0.0',
    systemTemplate: 'Be excellent.',
    status: AiPromptStatus.PRODUCTION,
    ...overrides,
  });

  describe('getProduction', () => {
    it('returns the production row for the task', async () => {
      promptRepo.findOne.mockResolvedValue(productionRow());

      const result = await service.getProduction(
        AiGenerationType.CONCEPT_CONTENT,
      );

      expect(result?.version).toBe('1.0.0');
      expect(promptRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            task: AiGenerationType.CONCEPT_CONTENT,
            status: AiPromptStatus.PRODUCTION,
          },
        }),
      );
    });

    it('returns null when nothing is released', async () => {
      promptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getProduction(AiGenerationType.QA_ANSWER),
      ).resolves.toBeNull();
    });
  });

  describe('resolveSystem', () => {
    it('reads through to the registry when a production row exists', async () => {
      promptRepo.findOne.mockResolvedValue(productionRow());

      await expect(
        service.resolveSystem(AiGenerationType.CONCEPT_CONTENT, 'legacy'),
      ).resolves.toEqual({
        version: '1.0.0',
        systemTemplate: 'Be excellent.',
        fromRegistry: true,
      });
    });

    it('falls back to the legacy constant otherwise (zero behavior change)', async () => {
      promptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resolveSystem(AiGenerationType.CONCEPT_CONTENT, 'legacy'),
      ).resolves.toEqual({
        version: 'legacy-static',
        systemTemplate: 'legacy',
        fromRegistry: false,
      });
    });
  });

  describe('renderSystem', () => {
    it('interpolates {{vars}} and leaves unknown placeholders intact', () => {
      expect(
        service.renderSystem('Hello {{name}}, v{{v}} and {{missing}}.', {
          name: 'Ada',
          v: '2',
        }),
      ).toBe('Hello Ada, v2 and {{missing}}.');
    });

    it('leaves variable-free v1 templates untouched', () => {
      const plain = 'No variables here.';
      expect(service.renderSystem(plain)).toBe(plain);
    });
  });
});
