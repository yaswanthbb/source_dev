/**
 * A TypeORM Repository where every method we use in the app is a jest mock.
 * Wire it into a testing module with:
 *   { provide: getRepositoryToken(Entity), useValue: createMockRepository() }
 *
 * The methods are declared required (not `Partial`) so specs can call
 * `.mockResolvedValue(...)` on them without tripping `strictNullChecks`.
 */
export interface MockRepository {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneBy: jest.Mock;
  findAndCount: jest.Mock;
  count: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  remove: jest.Mock;
  createQueryBuilder: jest.Mock;
}

/**
 * Builds a mocked repository. `create` and `remove` echo their argument back by
 * default (so a spec can read the entity that was constructed), and `save`
 * resolves to whatever it was handed. Override any method per-test with
 * `.mockResolvedValue(...)` / `.mockImplementation(...)`.
 */
export function createMockRepository(): MockRepository {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    create: jest.fn((entity) => entity),
    save: jest.fn((entity) => entity),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn((entity) => entity),
    createQueryBuilder: jest.fn(),
  };
}

export interface MockQueryBuilder {
  select: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orWhere: jest.Mock;
  groupBy: jest.Mock;
  addGroupBy: jest.Mock;
  having: jest.Mock;
  andHaving: jest.Mock;
  orHaving: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  leftJoin: jest.Mock;
  leftJoinAndSelect: jest.Mock;
  innerJoin: jest.Mock;
  innerJoinAndSelect: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  from: jest.Mock;
  into: jest.Mock;
  values: jest.Mock;
  returning: jest.Mock;
  orIgnore: jest.Mock;
  onConflict: jest.Mock;
  set: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  take: jest.Mock;
  skip: jest.Mock;
  getRawOne: jest.Mock;
  getRawMany: jest.Mock;
  getMany: jest.Mock;
  getOne: jest.Mock;
  getCount: jest.Mock;
  getManyAndCount: jest.Mock;
  execute: jest.Mock;
}

/**
 * Builds a chainable query-builder mock for the raw-SQL paths (XP `SUM`, the
 * heatmap `TO_CHAR` grouping, the review `insert().orIgnore()`). Every builder
 * method returns the same object so calls can be chained; the terminal methods
 * resolve to the values supplied in `result`.
 */
export function createMockQueryBuilder(
  result: {
    raw?: unknown;
    rawMany?: unknown[];
    many?: unknown[];
    one?: unknown;
    count?: number;
    manyAndCount?: [unknown[], number];
    execute?: unknown;
  } = {},
): MockQueryBuilder {
  const qb = {} as MockQueryBuilder;
  const chain = () => qb;

  qb.select = jest.fn(chain);
  qb.addSelect = jest.fn(chain);
  qb.where = jest.fn(chain);
  qb.andWhere = jest.fn(chain);
  qb.orWhere = jest.fn(chain);
  qb.groupBy = jest.fn(chain);
  qb.addGroupBy = jest.fn(chain);
  qb.having = jest.fn(chain);
  qb.andHaving = jest.fn(chain);
  qb.orHaving = jest.fn(chain);
  qb.orderBy = jest.fn(chain);
  qb.addOrderBy = jest.fn(chain);
  qb.leftJoin = jest.fn(chain);
  qb.leftJoinAndSelect = jest.fn(chain);
  qb.innerJoin = jest.fn(chain);
  qb.innerJoinAndSelect = jest.fn(chain);
  qb.insert = jest.fn(chain);
  qb.update = jest.fn(chain);
  qb.delete = jest.fn(chain);
  qb.from = jest.fn(chain);
  qb.into = jest.fn(chain);
  qb.values = jest.fn(chain);
  qb.returning = jest.fn(chain);
  qb.orIgnore = jest.fn(chain);
  qb.onConflict = jest.fn(chain);
  qb.set = jest.fn(chain);
  qb.limit = jest.fn(chain);
  qb.offset = jest.fn(chain);
  qb.take = jest.fn(chain);
  qb.skip = jest.fn(chain);

  qb.getRawOne = jest.fn().mockResolvedValue(result.raw);
  qb.getRawMany = jest.fn().mockResolvedValue(result.rawMany ?? []);
  qb.getMany = jest.fn().mockResolvedValue(result.many ?? []);
  qb.getOne = jest.fn().mockResolvedValue(result.one);
  qb.getCount = jest.fn().mockResolvedValue(result.count ?? 0);
  qb.getManyAndCount = jest
    .fn()
    .mockResolvedValue(result.manyAndCount ?? [result.many ?? [], 0]);
  qb.execute = jest.fn().mockResolvedValue(result.execute);

  return qb;
}
