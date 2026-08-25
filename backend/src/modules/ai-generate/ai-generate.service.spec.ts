import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';

import { AiGenerateService } from './ai-generate.service';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { AiGenerationJob } from './entities/ai-generation-job.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Module as ModuleEntity } from '../content/entities/module.entity';
import { Concept } from '../content/entities/concept.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { RoadmapsService } from '../content/roadmaps.service';
import { ConceptsService } from '../content/concepts.service';
import { QuizService } from '../quiz/quiz.service';

import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';

describe('AiGenerateService', () => {
  let service: AiGenerateService;
  let logRepo: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGenerateService,
        {
          provide: getRepositoryToken(AiGenerationLog),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(AiGenerationJob),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Roadmap),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ModuleEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Concept),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ModuleConcept),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(McqQuestion),
          useValue: createMockRepository(),
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: RoadmapsService, useValue: {} },
        { provide: ConceptsService, useValue: {} },
        { provide: QuizService, useValue: {} },
      ],
    }).compile();

    service = module.get(AiGenerateService);
    logRepo = module.get(getRepositoryToken(AiGenerationLog));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('cleanModelOutput', () => {
    const clean = (raw: string) => (service as any).cleanModelOutput(raw);

    it('strips a ```json fence', () => {
      expect(clean('```json\n[1,2]\n```')).toBe('[1,2]');
    });

    it('strips a bare ``` fence', () => {
      expect(clean('```\nhello\n```')).toBe('hello');
    });

    it('trims surrounding whitespace', () => {
      expect(clean('  spaced  ')).toBe('spaced');
    });

    it('leaves unfenced text untouched', () => {
      expect(clean('plain text')).toBe('plain text');
    });
  });

  describe('parseStringArray', () => {
    const parse = (raw: string) => (service as any).parseStringArray(raw);

    it('parses a clean JSON array, trimming and dropping non-strings', () => {
      expect(parse('["a", " b ", 3, ""]')).toEqual(['a', 'b']);
    });

    it('recovers an array embedded in surrounding prose', () => {
      expect(parse('Sure! ["x", "y"] done')).toEqual(['x', 'y']);
    });

    it('returns an empty array for non-array JSON', () => {
      expect(parse('{"not":"an array"}')).toEqual([]);
    });

    it('returns an empty array for unparseable garbage', () => {
      expect(parse('not json at all')).toEqual([]);
    });
  });

  describe('repairMalformedJson', () => {
    it('escapes stray backslashes so the result parses', () => {
      // Actual string contains a single backslash before "Users" (invalid escape).
      const broken = '{"title":"C:\\Users"}';
      const repaired = (service as any).repairMalformedJson(broken);

      expect(() => JSON.parse(repaired)).not.toThrow();
    });
  });

  describe('parseMcqQuestions', () => {
    const parse = (raw: string) =>
      (service as any).parseMcqQuestions(raw, 'Concept');

    it('accepts a direct array of questions', () => {
      const out = parse('[{"questionText":"q1"}]');
      expect(out).toHaveLength(1);
      expect(out[0].questionText).toBe('q1');
    });

    it('unwraps a { questions: [...] } object', () => {
      expect(parse('{"questions":[{"questionText":"q"}]}')).toHaveLength(1);
    });

    it('unwraps a { items: [...] } object', () => {
      expect(parse('{"items":[{"questionText":"q"}]}')).toHaveLength(1);
    });

    it('unwraps a { mcqs: [...] } object', () => {
      expect(parse('{"mcqs":[{"questionText":"q"}]}')).toHaveLength(1);
    });

    it('extracts JSON from a fenced block preceded by reasoning', () => {
      const raw =
        'Here is the JSON you asked for:\n```json\n{"questions":[{"questionText":"q"}]}\n```';
      expect(parse(raw)).toHaveLength(1);
    });

    it('repairs and parses malformed JSON with a stray backslash', () => {
      // Single backslash before "Temp" — invalid until repaired.
      const raw = '[{"questionText":"C:\\Temp"}]';
      const out = parse(raw);
      expect(out).toHaveLength(1);
      expect(out[0].questionText).toBe('C:\\Temp');
    });

    it('returns null when nothing parses', () => {
      jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => undefined);

      expect(parse('totally unparseable')).toBeNull();
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00.000Z'));
    });

    it('returns the remaining quota when under the daily limit', async () => {
      logRepo.count.mockResolvedValue(5);

      await expect(service.checkRateLimit('u1', 1)).resolves.toEqual({
        remaining: 15,
      });
    });

    it('throws a 429 once the daily limit is reached', async () => {
      logRepo.count.mockResolvedValue(20);

      const err = await service.checkRateLimit('u1', 1).catch((e) => e);

      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(429);
      expect((err.getResponse() as any).message).toContain(
        'Daily AI generation limit reached',
      );
    });

    it('rejects a batch that cannot fit in the remaining quota', async () => {
      logRepo.count.mockResolvedValue(18); // remaining 2

      const err = await service.checkRateLimit('u1', 3).catch((e) => e);

      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(429);
      expect((err.getResponse() as any).message).toContain('batch operation');
    });

    it('scopes the usage count to the requesting user', async () => {
      logRepo.count.mockResolvedValue(0);

      await service.checkRateLimit('u1', 1);

      expect(logRepo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'u1' }),
        }),
      );
    });
  });
});
