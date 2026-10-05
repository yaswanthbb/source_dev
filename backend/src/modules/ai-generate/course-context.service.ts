import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseTerm } from './entities/course-term.entity';
import { CourseConceptCard } from './entities/course-concept-card.entity';
import { CourseConceptEdge } from './entities/course-concept-edge.entity';
import { CourseEdgeType } from '../../common/enums/course-edge-type.enum';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Module as ModuleEntity } from '../content/entities/module.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';

/**
 * §8 Phase 1 context writes. Tight by review decision: terms, per-concept
 * cards (misconceptions/sources/examples as JSONB), directed edges, and a
 * teacher-persona JSONB on the roadmap. No generation-artifacts table —
 * ai_generation_logs + jobs already cover that.
 *
 * Backfill story: the dev DB was schema-dropped and re-migrated, so no
 * legacy rows exist. `ensureContextForRoadmap` lazily seeds missing cards for
 * any roadmap (old or new), so existing content never sits on an empty context
 * by default. Wipe-and-regenerate remains acceptable on this dev DB.
 */
@Injectable()
export class CourseContextService {
  private readonly logger = new Logger(CourseContextService.name);

  constructor(
    @InjectRepository(CourseTerm)
    private readonly terms: Repository<CourseTerm>,
    @InjectRepository(CourseConceptCard)
    private readonly cards: Repository<CourseConceptCard>,
    @InjectRepository(CourseConceptEdge)
    private readonly edges: Repository<CourseConceptEdge>,
    @InjectRepository(Roadmap)
    private readonly roadmaps: Repository<Roadmap>,
    @InjectRepository(ModuleEntity)
    private readonly modules: Repository<ModuleEntity>,
    @InjectRepository(ModuleConcept)
    private readonly moduleConcepts: Repository<ModuleConcept>,
  ) {}

  /**
   * Lazy backfill: every concept attached to this roadmap gets a card row
   * (empty until distilled). Idempotent — never touches existing cards.
   */
  async ensureContextForRoadmap(
    roadmapId: string,
  ): Promise<{ cardsCreated: number }> {
    const modules = await this.modules.find({ where: { roadmapId } });
    if (modules.length === 0) return { cardsCreated: 0 };
    const moduleIds = modules.map((m) => m.id);
    const links: Array<{ conceptId: string }> = [];
    for (const moduleId of moduleIds) {
      const rows = await this.moduleConcepts.find({ where: { moduleId } });
      for (const row of rows) links.push({ conceptId: row.conceptId });
    }
    const uniqueConceptIds = [...new Set(links.map((l) => l.conceptId))];
    let created = 0;
    for (const conceptId of uniqueConceptIds) {
      const existing = await this.cards.findOne({ where: { conceptId } });
      if (existing) continue;
      await this.cards.save(
        this.cards.create({
          roadmapId,
          conceptId,
          summary: null,
          keyClaims: [],
          bloomLevel: null,
          difficultyPhase: null,
          misconceptions: [],
          sources: [],
          examples: [],
        }),
      );
      created++;
    }
    if (created > 0) {
      this.logger.log(
        `Context backfill: created ${created} card(s) for roadmap ${roadmapId}.`,
      );
    }
    return { cardsCreated: created };
  }

  async upsertTerm(
    roadmapId: string,
    term: string,
    definition: string,
    aliases: string[] = [],
    introducedInConceptId: string | null = null,
  ): Promise<CourseTerm> {
    const normalized = term.trim();
    if (!normalized || !definition.trim()) {
      throw new HttpException(
        'Term and definition must both be non-empty.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const existing = await this.terms.findOne({
      where: { roadmapId, term: normalized },
    });
    if (existing) {
      existing.definition = definition;
      existing.aliases = aliases;
      existing.introducedInConceptId = introducedInConceptId;
      return this.terms.save(existing);
    }
    return this.terms.save(
      this.terms.create({
        roadmapId,
        term: normalized,
        definition,
        aliases,
        introducedInConceptId,
      }),
    );
  }

  async upsertCard(
    roadmapId: string,
    conceptId: string,
    patch: Partial<
      Pick<
        CourseConceptCard,
        | 'summary'
        | 'keyClaims'
        | 'bloomLevel'
        | 'difficultyPhase'
        | 'misconceptions'
        | 'sources'
        | 'examples'
      >
    >,
  ): Promise<CourseConceptCard> {
    const existing = await this.cards.findOne({ where: { conceptId } });
    if (existing) {
      Object.assign(existing, patch);
      return this.cards.save(existing);
    }
    return this.cards.save(
      this.cards.create({
        roadmapId,
        conceptId,
        summary: patch.summary ?? null,
        keyClaims: patch.keyClaims ?? [],
        bloomLevel: patch.bloomLevel ?? null,
        difficultyPhase: patch.difficultyPhase ?? null,
        misconceptions: patch.misconceptions ?? [],
        sources: patch.sources ?? [],
        examples: patch.examples ?? [],
      }),
    );
  }

  /**
   * Adds a directed edge. Prerequisite/builds-on edges must stay acyclic —
   * a new edge that closes a loop is rejected with 422. Self-loops always
   * rejected. Idempotent on the unique triple (returns existing row).
   */
  async addEdge(
    roadmapId: string,
    fromConceptId: string,
    toConceptId: string,
    type: CourseEdgeType,
  ): Promise<CourseConceptEdge> {
    if (fromConceptId === toConceptId) {
      throw new HttpException(
        'A concept cannot link to itself.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const existing = await this.edges.findOne({
      where: { fromConceptId, toConceptId, type },
    });
    if (existing) return existing;
    if (
      type === CourseEdgeType.PREREQUISITE ||
      type === CourseEdgeType.BUILDS_ON
    ) {
      const closesLoop = await this.pathExists(
        roadmapId,
        toConceptId,
        fromConceptId,
      );
      if (closesLoop) {
        throw new HttpException(
          `Edge ${fromConceptId} -[${type}]-> ${toConceptId} would close a prerequisite cycle.`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }
    return this.edges.save(
      this.edges.create({ roadmapId, fromConceptId, toConceptId, type }),
    );
  }

  /** BFS over prerequisite/builds-on edges: is there a path start→goal? */
  private async pathExists(
    roadmapId: string,
    startConceptId: string,
    goalConceptId: string,
  ): Promise<boolean> {
    const rows = await this.edges.find({ where: { roadmapId } });
    const adjacency = new Map<string, string[]>();
    for (const row of rows) {
      if (
        row.type !== CourseEdgeType.PREREQUISITE &&
        row.type !== CourseEdgeType.BUILDS_ON
      ) {
        continue;
      }
      const list = adjacency.get(row.fromConceptId) ?? [];
      list.push(row.toConceptId);
      adjacency.set(row.fromConceptId, list);
    }
    const visited = new Set<string>([startConceptId]);
    const queue: string[] = [startConceptId];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      if (current === goalConceptId) return true;
      for (const next of adjacency.get(current) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
    return false;
  }

  async setPersona(
    roadmapId: string,
    persona: Record<string, unknown> | null,
  ): Promise<void> {
    await this.roadmaps.update(
      { id: roadmapId },
      { teacherPersona: persona } as unknown as Record<string, unknown>,
    );
  }
}
