import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import { CourseEdgeType } from '../../common/enums/course-edge-type.enum';
import { CourseTerm } from './entities/course-term.entity';
import { CourseConceptCard } from './entities/course-concept-card.entity';
import { CourseConceptEdge } from './entities/course-concept-edge.entity';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Concept } from '../content/entities/concept.entity';

export interface CourseContextScope {
  conceptId?: string;
  moduleId?: string;
  moduleTitle?: string;
}

export interface CourseContextBudget {
  maxTerms?: number;
  maxCards?: number;
  maxChars?: number;
}

export interface CourseContextResult {
  block: string;
  stats: {
    termsUsed: number;
    cardsUsed: number;
    edgesUsed: number;
    chars: number;
    truncated: boolean;
  };
}

const DEFAULT_BUDGET: Required<CourseContextBudget> = {
  maxTerms: 20,
  maxCards: 5,
  maxChars: 4000,
};

/**
 * §8 Phase 1 reader. Assembles a bounded, budgeted, deterministically-ordered
 * context block per task from the context tables. Never throws for missing
 * data — an empty context yields an empty block (caller skips it), so legacy
 * roadmaps and flag-off paths behave exactly as before.
 *
 * Determinism: terms ORDER BY term ASC; cards ORDER BY concept title ASC;
 * edges ORDER BY from title, to title, type ASC. Same rows → same block.
 * Budget: sections assemble in priority order (persona → target → prereqs →
 * terms → edges) and drop from the lowest priority until under maxChars.
 */
@Injectable()
export class CourseContextBuilder {
  constructor(
    @InjectRepository(CourseTerm)
    private readonly terms: Repository<CourseTerm>,
    @InjectRepository(CourseConceptCard)
    private readonly cards: Repository<CourseConceptCard>,
    @InjectRepository(CourseConceptEdge)
    private readonly edges: Repository<CourseConceptEdge>,
    @InjectRepository(Roadmap)
    private readonly roadmaps: Repository<Roadmap>,
    @InjectRepository(Concept)
    private readonly concepts: Repository<Concept>,
  ) {}

  async build(
    task: AiGenerationType,
    roadmapId: string,
    scope: CourseContextScope = {},
    budget: CourseContextBudget = {},
  ): Promise<CourseContextResult> {
    const cap: Required<CourseContextBudget> = { ...DEFAULT_BUDGET, ...budget };
    const empty = (truncated = false): CourseContextResult => ({
      block: '',
      stats: { termsUsed: 0, cardsUsed: 0, edgesUsed: 0, chars: 0, truncated },
    });

    const roadmap = await this.roadmaps.findOne({ where: { id: roadmapId } });
    if (!roadmap) return empty();

    // Persona section (highest priority, one line when present).
    const personaLine = this.personaLine(roadmap.teacherPersona);

    // Target card section (concept-scoped tasks only).
    let targetLine: string | null = null;
    let targetConceptId = scope.conceptId ?? null;
    if (
      (task === AiGenerationType.CONCEPT_CONTENT ||
        task === AiGenerationType.CONCEPT_MCQS ||
        task === AiGenerationType.QA_ANSWER) &&
      !targetConceptId
    ) {
      return empty();
    }
    if (targetConceptId) {
      const card = await this.cards.findOne({
        where: { conceptId: targetConceptId },
      });
      if (card?.summary) {
        const concept = await this.concepts.findOne({
          where: { id: targetConceptId },
        });
        const bloom = card.bloomLevel ? ` [${card.bloomLevel}]` : '';
        targetLine = `Target: ${concept?.title ?? targetConceptId} — ${card.summary}${bloom}`;
      }
    }

    // Prerequisite cards: depth-1 inbound PREREQUISITE/BUILDS_ON edges,
    // ordered by concept title for determinism.
    let prereqLines: string[] = [];
    let edgesUsed = 0;
    if (targetConceptId) {
      const inbound = await this.edges.find({
        where: { roadmapId, toConceptId: targetConceptId },
      });
      const relevant = inbound.filter(
        (e) =>
          e.type === CourseEdgeType.PREREQUISITE ||
          e.type === CourseEdgeType.BUILDS_ON,
      );
      edgesUsed = relevant.length;
      if (relevant.length > 0) {
        const fromIds = [...new Set(relevant.map((e) => e.fromConceptId))];
        const cards: Array<{ title: string; summary: string }> = [];
        for (const fromId of fromIds) {
          const card = await this.cards.findOne({
            where: { conceptId: fromId },
          });
          if (!card?.summary) continue;
          const concept = await this.concepts.findOne({ where: { id: fromId } });
          cards.push({
            title: concept?.title ?? fromId,
            summary: card.summary,
          });
        }
        cards.sort((a, b) => a.title.localeCompare(b.title));
        prereqLines = cards
          .slice(0, cap.maxCards)
          .map((c) => `- ${c.title}: ${c.summary}`);
      }
    }

    // Terms section: alphabetical, capped.
    const termRows = await this.terms.find({
      where: { roadmapId },
      order: { term: 'ASC' },
      take: cap.maxTerms,
    });
    const termLines = termRows.map((t) => `- ${t.term}: ${t.definition}`);

    // Outbound edge list for the target (orientation hints, capped at 10).
    let edgeLines: string[] = [];
    if (targetConceptId) {
      const related = await this.edges.find({
        where: { roadmapId },
      });
      const mine = related
        .filter(
          (e) =>
            e.fromConceptId === targetConceptId ||
            e.toConceptId === targetConceptId,
        )
        .slice(0, 10);
      if (mine.length > 0) {
        const titles = new Map<string, string>();
        for (const e of mine) {
          for (const id of [e.fromConceptId, e.toConceptId]) {
            if (!titles.has(id)) {
              const concept = await this.concepts.findOne({ where: { id } });
              titles.set(id, concept?.title ?? id);
            }
          }
        }
        edgeLines = mine
          .map((e) => ({
            text: `- ${titles.get(e.fromConceptId)} -[${e.type}]-> ${titles.get(e.toConceptId)}`,
            key: `${titles.get(e.fromConceptId)}|${titles.get(e.toConceptId)}|${e.type}`,
          }))
          .sort((a, b) => a.key.localeCompare(b.key))
          .map((e) => e.text);
      }
    }

    // Assemble in priority order; drop lowest-priority sections first.
    // Priority: persona > target > prereqs > terms > edges.
    const sections: string[] = [];
    if (personaLine) sections.push(personaLine);
    if (targetLine) sections.push(targetLine);
    const prereqSection =
      prereqLines.length > 0
        ? `Prerequisites:\n${prereqLines.join('\n')}`
        : null;
    const termsSection =
      termLines.length > 0 ? `Terms:\n${termLines.join('\n')}` : null;
    const edgesSection =
      edgeLines.length > 0 ? `Links:\n${edgeLines.join('\n')}` : null;
    if (prereqSection) sections.push(prereqSection);
    if (termsSection) sections.push(termsSection);
    if (edgesSection) sections.push(edgesSection);

    if (sections.length === (personaLine ? 1 : 0)) {
      // Persona alone is not useful context — still return it, it costs a line.
      if (sections.length === 0) return empty();
    }

    let truncated = false;
    const header = `[Course context — ${task}]`;
    const join = (parts: string[]): string =>
      `${header}\n${parts.join('\n')}`;
    let block = join(sections);
    // Drop order: edges, terms (halve), prereqs (halve), then hard truncate.
    const dropFlags: Array<() => void> = [];
    if (edgesSection) {
      dropFlags.push(() => {
        const i = sections.indexOf(edgesSection);
        if (i >= 0) sections.splice(i, 1);
      });
    }
    if (termsSection) {
      dropFlags.push(() => {
        const i = sections.indexOf(termsSection);
        if (i >= 0) {
          const kept = termLines.slice(0, Math.floor(termLines.length / 2));
          if (kept.length === 0) sections.splice(i, 1);
          else sections[i] = `Terms:\n${kept.join('\n')}`;
        }
      });
    }
    if (prereqSection) {
      dropFlags.push(() => {
        const i = sections.indexOf(prereqSection);
        if (i >= 0) {
          const kept = prereqLines.slice(0, Math.floor(prereqLines.length / 2));
          if (kept.length === 0) sections.splice(i, 1);
          else sections[i] = `Prerequisites:\n${kept.join('\n')}`;
        }
      });
    }
    for (const drop of dropFlags) {
      if (block.length <= cap.maxChars) break;
      drop();
      truncated = true;
      block = join(sections);
    }
    if (block.length > cap.maxChars) {
      block = `${block.slice(0, cap.maxChars - 20)}\n…[truncated]`;
      truncated = true;
    }

    return {
      block,
      stats: {
        termsUsed: termsSection
          ? (block.includes('Terms:') ? termLines.length : 0)
          : 0,
        cardsUsed:
          (targetLine && block.includes('Target:') ? 1 : 0) +
          (prereqSection && block.includes('Prerequisites:')
            ? prereqLines.length
            : 0),
        edgesUsed: block.includes('Links:') ? edgeLines.length : edgesUsed > 0 && block.includes('Prerequisites:') ? edgesUsed : 0,
        chars: block.length,
        truncated,
      },
    };
  }

  private personaLine(persona: Record<string, unknown> | null): string | null {
    if (!persona) return null;
    const voice =
      typeof persona['voice'] === 'string' ? persona['voice'] : null;
    const audience =
      typeof persona['audience'] === 'string' ? persona['audience'] : null;
    const detail = [voice && `voice: ${voice}`, audience && `for ${audience}`]
      .filter(Boolean)
      .join(' ');
    return detail ? `Persona: ${detail}` : 'Persona: set';
  }
}
