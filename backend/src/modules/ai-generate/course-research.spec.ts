import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import {
  CourseResearchService,
  OER_SEED_SOURCE,
  RESEARCH_LICENSE_ALLOWLIST,
} from './course-research.service';
import { CourseSource } from './entities/course-source.entity';
import { CourseSourceChunk } from './entities/course-source-chunk.entity';
import { AiProviderClients } from './ai-provider-clients';
import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';
import { htmlToText } from './research-text.util';

describe('CourseResearchService (§8 RAG ingestion + retrieval)', () => {
  let service: CourseResearchService;
  let sources: MockRepository;
  let chunks: MockRepository;
  let clients: { embed: jest.Mock; configuredEmbeddingModel: jest.Mock };
  let configGet: jest.Mock;
  let fetchMock: jest.Mock;

  const html = (body: string) =>
    `<html><head><script>evil()</script></head><body>${body}</body></html>`;

  beforeEach(async () => {
    configGet = jest.fn((key: string) => {
      if (key === 'NVIDIA_API_KEY') return 'platform-key';
      return undefined;
    });
    clients = {
      embed: jest.fn(async (_key: string, _model: string, inputs: string[]) =>
        inputs.map((_, i) => [0.1 * (i + 1), 0.2]),
      ),
      configuredEmbeddingModel: jest.fn(() => 'embed-model'),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseResearchService,
        {
          provide: getRepositoryToken(CourseSource),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(CourseSourceChunk),
          useValue: createMockRepository(),
        },
        { provide: AiProviderClients, useValue: clients },
        { provide: ConfigService, useValue: { get: configGet } },
      ],
    }).compile();
    service = module.get(CourseResearchService);
    sources = module.get(getRepositoryToken(CourseSource));
    chunks = module.get(getRepositoryToken(CourseSourceChunk));
    fetchMock = jest.fn();
    (globalThis as { fetch: unknown }).fetch = fetchMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  function okHtml(body: string) {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => 'text/html' },
      text: async () => html(body),
    });
  }

  describe('license allowlist', () => {
    it('accepts the allowlisted set and rejects everything else', () => {
      for (const license of RESEARCH_LICENSE_ALLOWLIST) {
        expect(service.isLicenseAllowed(license)).toBe(true);
      }
      for (const license of ['CC-BY-NC-SA', 'all-rights-reserved', '', 'MIT']) {
        expect(service.isLicenseAllowed(license)).toBe(false);
      }
    });

    it('rejects unlicensed ingestion before any fetch, with a logged reason', async () => {
      await expect(
        service.ingestSource({
          title: 'T',
          url: 'https://example.com/x',
          license: 'all-rights-reserved',
          sourceType: 'reference',
        }),
      ).rejects.toThrow('not ingestible');
      expect(fetchMock).not.toHaveBeenCalled();
      expect(sources.save).not.toHaveBeenCalled();
    });

    it('the OER seed itself is allowlisted', () => {
      expect(service.isLicenseAllowed(OER_SEED_SOURCE.license)).toBe(true);
      expect(OER_SEED_SOURCE.url.startsWith('https://')).toBe(true);
    });
  });

  describe('ingestion', () => {
    it('chunks extracted text and stores embeddings', async () => {
      const body = `<p>${Array.from({ length: 600 }, (_, i) => `word${i}`).join(' ')}</p>`;
      okHtml(body);
      sources.findOne.mockResolvedValue(null);

      const out = await service.ingestSource({
        title: 'T',
        url: 'https://example.com/doc',
        license: 'CC-BY-SA',
        sourceType: 'reference',
      });

      expect(out.skipped).toBe(false);
      // 600 words → 400-word chunks stepping 360 → 2 chunks.
      expect(out.chunks).toBe(2);
      expect(sources.save).toHaveBeenCalledTimes(1);
      expect(chunks.save).toHaveBeenCalledTimes(2);
      expect(clients.embed).toHaveBeenCalledTimes(1);
      expect(clients.embed.mock.calls[0][1]).toBe('embed-model');
    });

    it('skips re-ingestion when the content hash is unchanged', async () => {
      okHtml('<p>stable body</p>');
      const hash = createHash('sha256')
        .update(htmlToText(html('<p>stable body</p>')), 'utf8')
        .digest('hex');
      sources.findOne.mockResolvedValue({ id: 's1', contentHash: hash });
      chunks.count.mockResolvedValue(2);

      const out = await service.ingestSource({
        title: 'T',
        url: 'https://example.com/doc',
        license: 'CC-BY',
        sourceType: 'reference',
      });

      expect(out).toMatchObject({ skipped: true, chunks: 2 });
      expect(clients.embed).not.toHaveBeenCalled();
      expect(chunks.save).not.toHaveBeenCalled();
    });

    it('replaces chunks when content changed', async () => {
      okHtml('<p>new body version two</p>');
      sources.findOne.mockResolvedValue({ id: 's1', contentHash: 'old' });

      const out = await service.ingestSource({
        title: 'T',
        url: 'https://example.com/doc',
        license: 'CC0',
        sourceType: 'reference',
      });

      expect(out.skipped).toBe(false);
      expect(chunks.delete).toHaveBeenCalledWith({ sourceId: 's1' });
      expect(chunks.save).toHaveBeenCalled();
    });
  });

  describe('retrieval', () => {
    it('returns top-k by similarity through the JS fallback (no pgvector)', async () => {
      chunks.query.mockRejectedValue(new Error('function does not exist'));
      chunks.find.mockResolvedValue([
        {
          id: 'c-far',
          content: 'far',
          sourceId: 's1',
          embedding: JSON.stringify([0, 1]),
          source: { roadmapId: null },
        },
        {
          id: 'c-near',
          content: 'near',
          sourceId: 's1',
          embedding: JSON.stringify([1, 0]),
          source: { roadmapId: null },
        },
        {
          id: 'c-mid',
          content: 'mid',
          sourceId: 's1',
          embedding: JSON.stringify([0.9, 0.1]),
          source: { roadmapId: null },
        },
      ]);
      clients.embed.mockResolvedValue([[1, 0]]);

      const out = await service.retrieveForOutline(
        'r1',
        { terms: ['branch'], objectives: [] },
        'platform-key',
        2,
      );

      expect(out.chunks.map((c) => c.id)).toEqual(['c-near', 'c-mid']);
      expect(out.sourceIds).toEqual(['s1']);
    });

    it('filters out other roadmaps’ scoped sources', async () => {
      chunks.query.mockRejectedValue(new Error('no extension'));
      chunks.find.mockResolvedValue([
        {
          id: 'c-other',
          content: 'x',
          sourceId: 's2',
          embedding: JSON.stringify([1, 0]),
          source: { roadmapId: 'r-other' },
        },
      ]);
      clients.embed.mockResolvedValue([[1, 0]]);

      const out = await service.retrieveForOutline(
        'r1',
        { terms: ['branch'], objectives: [] },
        'platform-key',
      );
      expect(out.chunks).toEqual([]);
    });

    it('degrades to empty (never throws) when embeddings fail', async () => {
      clients.embed.mockRejectedValue(new Error('no key'));
      const out = await service.retrieveForOutline(
        'r1',
        { terms: ['branch'], objectives: [] },
        undefined,
      );
      expect(out).toEqual({ chunks: [], sourceIds: [] });
    });
  });
});
