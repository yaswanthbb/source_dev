import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CourseContextBuilder } from './course-context-builder.service';
import { CourseTerm } from './entities/course-term.entity';
import { CourseConceptCard } from './entities/course-concept-card.entity';
import { CourseConceptEdge } from './entities/course-concept-edge.entity';
import { CourseEdgeType } from '../../common/enums/course-edge-type.enum';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Concept } from '../content/entities/concept.entity';
import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';

describe('CourseContextBuilder (§8 Phase 1)', () => {
  let builder: CourseContextBuilder;
  let terms: MockRepository;
  let cards: MockRepository;
  let edges: MockRepository;
  let roadmaps: MockRepository;
  let concepts: MockRepository;

  const roadmap = { id: 'r1', teacherPersona: { voice: 'crisp', audience: 'juniors' } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseContextBuilder,
        { provide: getRepositoryToken(CourseTerm), useValue: createMockRepository() },
        { provide: getRepositoryToken(CourseConceptCard), useValue: createMockRepository() },
        { provide: getRepositoryToken(CourseConceptEdge), useValue: createMockRepository() },
        { provide: getRepositoryToken(Roadmap), useValue: createMockRepository() },
        { provide: getRepositoryToken(Concept), useValue: createMockRepository() },
      ],
    }).compile();
    builder = module.get(CourseContextBuilder);
    terms = module.get(getRepositoryToken(CourseTerm));
    cards = module.get(getRepositoryToken(CourseConceptCard));
    edges = module.get(getRepositoryToken(CourseConceptEdge));
    roadmaps = module.get(getRepositoryToken(Roadmap));
    concepts = module.get(getRepositoryToken(Concept));
    roadmaps.findOne.mockResolvedValue(roadmap);
  });

  afterEach(() => jest.clearAllMocks());

  function seedContext() {
    terms.find.mockResolvedValue([
      { term: 'branch', definition: 'movable pointer' },
      { term: 'commit', definition: 'snapshot' },
    ]);
    edges.find.mockResolvedValue([
      { fromConceptId: 'c0', toConceptId: 'c1', type: CourseEdgeType.PREREQUISITE },
    ]);
    cards.findOne.mockImplementation(async ({ where }: any) => {
      if (where.conceptId === 'c1') {
        return { conceptId: 'c1', summary: 'Branches explained', bloomLevel: 'understand' };
      }
      if (where.conceptId === 'c0') {
        return { conceptId: 'c0', summary: 'Commits explained', bloomLevel: null };
      }
      return null;
    });
    concepts.findOne.mockImplementation(async ({ where }: any) => ({
      id: where.id,
      title: where.id === 'c1' ? 'Branches' : 'Commits',
    }));
  }

  it('returns an empty block for a missing roadmap (never throws)', async () => {
    roadmaps.findOne.mockResolvedValue(null);
    const out = await builder.build(AiGenerationType.CONCEPT_CONTENT, 'nope', {
      conceptId: 'c1',
    });
    expect(out.block).toBe('');
    expect(out.stats.chars).toBe(0);
  });

  it('returns an empty block when concept tasks lack a concept id', async () => {
    const out = await builder.build(AiGenerationType.CONCEPT_CONTENT, 'r1', {});
    expect(out.block).toBe('');
  });

  it('hydrates target + prereq + terms + persona deterministically', async () => {
    seedContext();
    const a = await builder.build(AiGenerationType.CONCEPT_CONTENT, 'r1', {
      conceptId: 'c1',
    });
    const b = await builder.build(AiGenerationType.CONCEPT_CONTENT, 'r1', {
      conceptId: 'c1',
    });
    expect(a.block).toBe(b.block);
    expect(a.block).toContain('[Course context — concept_content]');
    expect(a.block).toContain('Persona:');
    expect(a.block).toContain('Target: Branches');
    expect(a.block).toContain('Prerequisites:');
    expect(a.block).toContain('- branch: movable pointer');
    expect(a.stats.cardsUsed).toBe(2);
    expect(a.stats.termsUsed).toBe(2);
  });

  it('orders prereq cards by concept title', async () => {
    roadmaps.findOne.mockResolvedValue({ id: 'r1', teacherPersona: null });
    terms.find.mockResolvedValue([]);
    edges.find.mockResolvedValue([
      { fromConceptId: 'cb', toConceptId: 'c1', type: CourseEdgeType.BUILDS_ON },
      { fromConceptId: 'ca', toConceptId: 'c1', type: CourseEdgeType.PREREQUISITE },
    ]);
    cards.findOne.mockImplementation(async ({ where }: any) => {
      if (where.conceptId === 'c1') return { summary: 'target' };
      return { summary: `summary-${where.conceptId}` };
    });
    concepts.findOne.mockImplementation(async ({ where }: any) => ({
      id: where.id,
      title: where.id === 'c1' ? 'Target' : where.id === 'ca' ? 'Alpha' : 'Zulu',
    }));
    const out = await builder.build(AiGenerationType.CONCEPT_CONTENT, 'r1', {
      conceptId: 'c1',
    });
    const alpha = out.block.indexOf('Alpha');
    const zulu = out.block.indexOf('Zulu');
    expect(alpha).toBeGreaterThanOrEqual(0);
    expect(zulu).toBeGreaterThan(alpha);
  });

  it('respects the char budget and flags truncation', async () => {
    seedContext();
    const out = await builder.build(
      AiGenerationType.CONCEPT_CONTENT,
      'r1',
      { conceptId: 'c1' },
      { maxChars: 60 },
    );
    expect(out.block.length).toBeLessThanOrEqual(60);
    expect(out.stats.truncated).toBe(true);
  });

  it('caps terms at maxTerms', async () => {
    roadmaps.findOne.mockResolvedValue({ id: 'r1', teacherPersona: null });
    terms.find.mockImplementation(async (opts: any) =>
      Array.from({ length: opts.take }, (_, i) => ({
        term: `t${i}`,
        definition: 'd',
      })),
    );
    edges.find.mockResolvedValue([]);
    cards.findOne.mockResolvedValue(null);
    const out = await builder.build(
      AiGenerationType.ROADMAP_MODULES,
      'r1',
      {},
      { maxTerms: 3, maxChars: 100000 },
    );
    expect(terms.find).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 }),
    );
    expect(out.block).toContain('- t0: d');
  });
});
