import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { CourseSource } from './entities/course-source.entity';
import { CourseSourceChunk } from './entities/course-source-chunk.entity';
import { AiProviderClients } from './ai-provider-clients';
import {
  chunkText,
  cosineSimilarity,
  estimateTokens,
  htmlToText,
  parseEmbedding,
  RESEARCH_CHUNK_CHARS,
  RESEARCH_OVERLAP_CHARS,
} from './research-text.util';

/**
 * §8 research ingestion + retrieval (RAG). Lawful sources only — see
 * §11 AD-log for the copyright posture.
 */
export const RESEARCH_TOP_K = 5;

/**
 * Grounding mode, Augmented for now: the brief synthesizes retrieved sources
 * plus model knowledge. A thin corpus would starve Grounded mode (sources
 * only), so the follow-up promotes this to a setting once the corpus grows.
 */
export const RESEARCH_GROUNDING_MODE = 'augmented' as const;

/**
 * Ingestion allowlist. `license` is operator-asserted per source (remote
 * pages rarely carry machine-readable license metadata); anything outside
 * this list — including CC-BY-NC-SA and unmarked pages — is rejected.
 */
export const RESEARCH_LICENSE_ALLOWLIST = [
  'public-domain',
  'CC0',
  'CC-BY',
  'CC-BY-SA',
  'OER',
  'explicit',
] as const;

/**
 * Tiny OER seed. MDN Web Docs prose is CC-BY-SA (code samples CC0) — inside
 * the allowlist. Deliberately NOT OpenStax: their books are CC-BY-NC-SA and
 * their terms explicitly withhold permission to ingest into LLMs/AI
 * offerings, so OpenStax fails both the license list and the consent test.
 */
export const OER_SEED_SOURCE = {
  title: 'JavaScript Closures (MDN Web Docs)',
  url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures',
  license: 'CC-BY-SA',
  sourceType: 'reference',
} as const;

const INGEST_TIMEOUT_MS = 15000;
const MAX_INGEST_CHARS = 1_000_000;
const MAX_RETRIEVAL_SCAN = 500;
const MAX_QUERY_TEXTS = 8;

export interface IngestResult {
  source: CourseSource;
  skipped: boolean;
  chunks: number;
}

export interface RetrievedChunk {
  id: string;
  sourceId: string;
  content: string;
}

@Injectable()
export class CourseResearchService {
  private readonly logger = new Logger(CourseResearchService.name);

  constructor(
    @InjectRepository(CourseSource)
    private readonly sources: Repository<CourseSource>,
    @InjectRepository(CourseSourceChunk)
    private readonly chunks: Repository<CourseSourceChunk>,
    private readonly clients: AiProviderClients,
    private readonly configService: ConfigService,
  ) {}

  isLicenseAllowed(license: string): boolean {
    return (RESEARCH_LICENSE_ALLOWLIST as readonly string[]).includes(license);
  }

  /** Source lookup for provenance titles (null when removed). */
  async findSource(id: string): Promise<CourseSource | null> {
    return this.sources.findOne({ where: { id } });
  }

  /**
   * Embedding key: the caller's NVIDIA key when the generation runs on
   * NVIDIA, else the platform key. Gemini BYOK keys can't embed (NVIDIA-only
   * embedding backend), so those compilations degrade to brief=null rather
   * than failing — research is enhancement, never gate.
   */
  resolveEmbeddingKey(preferredApiKey?: string): string {
    if (preferredApiKey) return preferredApiKey;
    const platformKey = this.configService
      .get<string>('NVIDIA_API_KEY')
      ?.trim();
    if (!platformKey) {
      throw new ServiceUnavailableException(
        'Embeddings are not configured (no NVIDIA key). Research degrades to no brief.',
      );
    }
    return platformKey;
  }

  async embedTexts(apiKey: string, texts: string[]): Promise<number[][]> {
    return this.clients.embed(
      apiKey,
      this.clients.configuredEmbeddingModel(),
      texts,
    );
  }

  /**
   * URL → fetch → extract → chunk → embed → store. Idempotent: an unchanged
   * URL (same content hash) skips embedding entirely; changed content
   * replaces the chunk set. Unknown/unlicensed sources are rejected before
   * any fetch, with the reason logged.
   */
  async ingestSource(input: {
    roadmapId?: string | null;
    title: string;
    url: string;
    license: string;
    sourceType: string;
  }): Promise<IngestResult> {
    if (!this.isLicenseAllowed(input.license)) {
      this.logger.warn(
        `Ingestion rejected for ${input.url}: license "${input.license}" is outside the allowlist (${RESEARCH_LICENSE_ALLOWLIST.join(', ')}).`,
      );
      throw new BadRequestException(
        `Source license "${input.license}" is not ingestible. Allowed: ${RESEARCH_LICENSE_ALLOWLIST.join(', ')}.`,
      );
    }
    if (!input.title.trim() || !input.url.trim() || !input.sourceType.trim()) {
      throw new BadRequestException(
        'Ingestion needs a non-empty title, url, and source_type.',
      );
    }

    const text = await this.fetchText(input.url);
    const hash = createHash('sha256').update(text, 'utf8').digest('hex');

    const existing = await this.sources.findOne({
      where: { url: input.url },
    });
    if (existing && existing.contentHash === hash) {
      const count = await this.chunks.count({
        where: { sourceId: existing.id },
      });
      this.logger.log(`Ingestion skipped (unchanged): ${input.url}.`);
      return { source: existing, skipped: true, chunks: count };
    }

    const contents = chunkText(
      text,
      RESEARCH_CHUNK_CHARS,
      RESEARCH_OVERLAP_CHARS,
    );
    if (contents.length === 0) {
      throw new BadRequestException(
        `No ingestible text extracted from ${input.url}.`,
      );
    }
    const vectors = await this.embedTexts(this.resolveEmbeddingKey(), contents);

    let source: CourseSource;
    if (existing) {
      await this.chunks.delete({ sourceId: existing.id });
      existing.title = input.title;
      existing.license = input.license;
      existing.sourceType = input.sourceType;
      existing.contentHash = hash;
      existing.ingestedAt = new Date();
      if (input.roadmapId !== undefined) existing.roadmapId = input.roadmapId;
      source = await this.sources.save(existing);
    } else {
      source = await this.sources.save(
        this.sources.create({
          roadmapId: input.roadmapId ?? null,
          title: input.title,
          url: input.url,
          license: input.license,
          sourceType: input.sourceType,
          contentHash: hash,
        }),
      );
    }

    for (let i = 0; i < contents.length; i += 1) {
      await this.chunks.save(
        this.chunks.create({
          sourceId: source.id,
          chunkIndex: i,
          content: contents[i],
          embedding: JSON.stringify(vectors[i]),
          tokenCount: estimateTokens(contents[i]),
        }),
      );
    }
    this.logger.log(
      `Ingested ${input.url}: ${contents.length} chunk(s) (${input.license}).`,
    );
    return { source, skipped: false, chunks: contents.length };
  }

  /** Operator entry for the tiny OER seed (run via `npm run research:seed`). */
  async ensureSeedSource(roadmapId?: string | null): Promise<IngestResult> {
    return this.ingestSource({
      roadmapId: roadmapId ?? null,
      title: OER_SEED_SOURCE.title,
      url: OER_SEED_SOURCE.url,
      license: OER_SEED_SOURCE.license,
      sourceType: OER_SEED_SOURCE.sourceType,
    });
  }

  /**
   * Top-k chunks for an outline's key terms + objectives, scoped to the
   * roadmap plus global sources. Tries pgvector `<=>` first; any failure
   * (no extension, text-typed column) falls back to JS cosine — retrieval
   * never throws for infrastructure reasons. Empty vectors input or empty
   * corpus yields zero chunks (the compiler degrades to brief=null).
   */
  async retrieveForOutline(
    roadmapId: string,
    queries: { terms: string[]; objectives: string[] },
    apiKey: string | undefined,
    topK: number = RESEARCH_TOP_K,
  ): Promise<{ chunks: RetrievedChunk[]; sourceIds: string[] }> {
    const texts = [...queries.terms, ...queries.objectives].slice(
      0,
      MAX_QUERY_TEXTS,
    );
    if (texts.length === 0) return { chunks: [], sourceIds: [] };
    let key: string;
    try {
      key = this.resolveEmbeddingKey(apiKey);
    } catch {
      return { chunks: [], sourceIds: [] };
    }
    let vectors: number[][];
    try {
      vectors = await this.embedTexts(key, texts);
    } catch {
      return { chunks: [], sourceIds: [] };
    }

    const best = new Map<string, { chunk: RetrievedChunk; distance: number }>();
    for (const vector of vectors) {
      const ranked = await this.rankChunks(roadmapId, vector, topK);
      for (const row of ranked) {
        const prev = best.get(row.chunk.id);
        if (!prev || row.distance < prev.distance) {
          best.set(row.chunk.id, row);
        }
      }
    }
    const merged = [...best.values()]
      .sort((a, b) => a.distance - b.distance)
      .slice(0, topK);
    const chunks = merged.map((m) => m.chunk);
    return {
      chunks,
      sourceIds: [...new Set(chunks.map((c) => c.sourceId))],
    };
  }

  private async rankChunks(
    roadmapId: string,
    vector: number[],
    topK: number,
  ): Promise<Array<{ chunk: RetrievedChunk; distance: number }>> {
    const vectorLiteral = JSON.stringify(vector);
    try {
      const rows = await this.chunks.query(
        `SELECT c.id AS "id", c.content AS "content", c.source_id AS "sourceId", (c.embedding <=> $1::vector) AS distance
         FROM course_source_chunks c
         JOIN course_sources s ON s.id = c.source_id
         WHERE (s.roadmap_id = $2 OR s.roadmap_id IS NULL)
           AND c.embedding IS NOT NULL
         ORDER BY distance LIMIT $3`,
        [vectorLiteral, roadmapId, topK],
      );
      return (
        rows as Array<{
          id: string;
          content: string;
          sourceId: string;
          distance: number;
        }>
      ).map((row) => ({
        chunk: { id: row.id, content: row.content, sourceId: row.sourceId },
        distance: Number(row.distance),
      }));
    } catch {
      // No pgvector (extension missing or text-typed column): JS fallback.
      const all = await this.chunks.find({
        relations: { source: true },
        take: MAX_RETRIEVAL_SCAN,
      });
      return all
        .filter(
          (chunk) =>
            !chunk.source ||
            chunk.source.roadmapId === null ||
            chunk.source.roadmapId === roadmapId,
        )
        .map((chunk) => {
          const embedding = parseEmbedding(chunk.embedding);
          const similarity = embedding
            ? cosineSimilarity(vector, embedding)
            : -Infinity;
          return {
            chunk: {
              id: chunk.id,
              content: chunk.content,
              sourceId: chunk.sourceId,
            },
            distance: -similarity,
          };
        })
        .filter((row) => Number.isFinite(row.distance))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, topK);
    }
  }

  private async fetchText(url: string): Promise<string> {
    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        headers: { 'User-Agent': 'source-dev-research-ingest/1.0' },
        signal: AbortSignal.timeout(INGEST_TIMEOUT_MS),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new HttpException(
        `Could not fetch ${url}: ${msg}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    if (!response.ok) {
      throw new HttpException(
        `Fetch failed for ${url}: HTTP ${response.status}.`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    const contentType = response.headers.get('content-type') ?? '';
    const body = (await response.text()).slice(0, MAX_INGEST_CHARS);
    if (contentType.includes('html')) return htmlToText(body);
    if (contentType.includes('text') || contentType === '') {
      return body.replace(/[ \t]+/g, ' ').trim();
    }
    throw new BadRequestException(
      `Unsupported content type "${contentType}" for ${url} — text/HTML only.`,
    );
  }
}
