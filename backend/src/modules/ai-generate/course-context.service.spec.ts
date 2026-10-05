import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpException } from '@nestjs/common';
import { CourseContextService } from './course-context.service';
import { CourseTerm } from './entities/course-term.entity';
import { CourseConceptCard } from './entities/course-concept-card.entity';
import { CourseConceptEdge } from './entities/course-concept-edge.entity';
import { CourseEdgeType } from '../../common/enums/course-edge-type.enum';
import { Roadmap } from '../content/entities/roadmap.entity';
import { Module as ModuleEntity } from '../content/entities/module.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import {
  createMockRepository,
  MockRepository,
} from '../../common/testing/mock-repository';

describe('CourseContextService (§8 Phase 1)', () => {
  let service: CourseContextService;
  let terms: MockRepository;
  let cards: MockRepository;
  let edges: MockRepository;
  let modules: MockRepository;
  let moduleConcepts: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseContextService,
        { provide: getRepositoryToken(CourseTerm), useValue: createMockRepository() },
        { provide: getRepositoryToken(CourseConceptCard), useValue: createMockRepository() },
        { provide: getRepositoryToken(CourseConceptEdge), useValue: createMockRepository() },
        { provide: getRepositoryToken(Roadmap), useValue: createMockRepository() },
        { provide: getRepositoryToken(ModuleEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(ModuleConcept), useValue: createMockRepository() },
      ],
    }).compile();
    service = module.get(CourseContextService);
    terms = module.get(getRepositoryToken(CourseTerm));
    cards = module.get(getRepositoryToken(CourseConceptCard));
    edges = module.get(getRepositoryToken(CourseConceptEdge));
    modules = module.get(getRepositoryToken(ModuleEntity));
    moduleConcepts = module.get(getRepositoryToken(ModuleConcept));
  });

  afterEach(() => jest.clearAllMocks());

  it('ensureContextForRoadmap creates cards only for concepts missing one', async () => {
    modules.find.mockResolvedValue([{ id: 'm1' }]);
    moduleConcepts.find.mockResolvedValue([
      { conceptId: 'c1' },
      { conceptId: 'c2' },
      { conceptId: 'c1' },
    ]);
    cards.findOne.mockImplementation(async ({ where }: any) =>
      where.conceptId === 'c1' ? { conceptId: 'c1' } : null,
    );

    await expect(
      service.ensureContextForRoadmap('r1'),
    ).resolves.toEqual({ cardsCreated: 1 });
    expect(cards.save).toHaveBeenCalledTimes(1);
  });

  it('ensureContextForRoadmap is a no-op for roadmaps with no modules', async () => {
    modules.find.mockResolvedValue([]);
    await expect(service.ensureContextForRoadmap('r1')).resolves.toEqual({
      cardsCreated: 0,
    });
    expect(cards.save).not.toHaveBeenCalled();
  });

  it('upsertTerm rejects empty term or definition', async () => {
    await expect(service.upsertTerm('r1', '  ', 'def')).rejects.toBeInstanceOf(
      HttpException,
    );
    await expect(service.upsertTerm('r1', 'term', '  ')).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(terms.save).not.toHaveBeenCalled();
  });

  it('addEdge rejects self-loops', async () => {
    await expect(
      service.addEdge('r1', 'c1', 'c1', CourseEdgeType.PREREQUISITE),
    ).rejects.toBeInstanceOf(HttpException);
    expect(edges.save).not.toHaveBeenCalled();
  });

  it('addEdge returns the existing row on the unique triple', async () => {
    const row = { id: 'e1' };
    edges.findOne.mockResolvedValue(row);
    await expect(
      service.addEdge('r1', 'c1', 'c2', CourseEdgeType.RELATED_TO),
    ).resolves.toBe(row);
    expect(edges.save).not.toHaveBeenCalled();
  });

  it('addEdge rejects a prerequisite edge that closes a cycle', async () => {
    edges.findOne.mockResolvedValue(null);
    // Existing path c2 -> c1; adding c1 -> c2 would loop.
    edges.find.mockResolvedValue([
      { fromConceptId: 'c2', toConceptId: 'c1', type: CourseEdgeType.PREREQUISITE },
    ]);
    await expect(
      service.addEdge('r1', 'c1', 'c2', CourseEdgeType.PREREQUISITE),
    ).rejects.toBeInstanceOf(HttpException);
    expect(edges.save).not.toHaveBeenCalled();
  });

  it('addEdge allows a non-cyclic prerequisite edge', async () => {
    edges.findOne.mockResolvedValue(null);
    edges.find.mockResolvedValue([
      { fromConceptId: 'c0', toConceptId: 'c1', type: CourseEdgeType.PREREQUISITE },
    ]);
    await service.addEdge('r1', 'c1', 'c2', CourseEdgeType.PREREQUISITE);
    expect(edges.save).toHaveBeenCalledTimes(1);
  });

  it('addEdge skips cycle checks for non-ordering edge types', async () => {
    edges.findOne.mockResolvedValue(null);
    await service.addEdge('r1', 'c1', 'c2', CourseEdgeType.RELATED_TO);
    expect(edges.find).not.toHaveBeenCalled();
    expect(edges.save).toHaveBeenCalledTimes(1);
  });
});
