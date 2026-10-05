import {
  objectivesWithoutBloomVerb,
  parseCritique,
  parseFactcheck,
  parseOutline,
  parseResearchBrief,
} from './compiler-stages';

const SHAPE = {
  hook: 'h',
  intuition: 'i',
  definition: 'd',
  worked_example: 'w',
  faded_practice: 'f',
  retrieval_questions: 'r',
};

function outlineJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    title: 'Branches',
    objectives: ['Explain what a branch pointer is', 'Create a branch'],
    key_terms: [
      { term: 'branch', definition: 'A movable pointer to a commit.' },
    ],
    builds_on: [],
    recall_hooks: ['commits'],
    lesson_shape: SHAPE,
    difficulty: 'easy',
    research_brief: null,
    ...overrides,
  });
}

describe('compiler stage contracts (§8)', () => {
  describe('parseOutline', () => {
    it('accepts a well-formed outline including a null research_brief', () => {
      const outline = parseOutline(outlineJson());
      expect(outline.title).toBe('Branches');
      expect(outline.research_brief).toBeNull();
      expect(outline.key_terms).toHaveLength(1);
      expect(outline.difficulty).toBe('easy');
    });

    it('defaults an absent research_brief to null (RAG fills it later)', () => {
      const raw = outlineJson();
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      delete parsed['research_brief'];
      expect(parseOutline(JSON.stringify(parsed)).research_brief).toBeNull();
    });

    it('rejects garbage JSON, missing keys, and bad difficulty', () => {
      expect(() => parseOutline('not json')).toThrow();
      expect(() => parseOutline(outlineJson({ objectives: [] }))).toThrow();
      expect(() =>
        parseOutline(outlineJson({ difficulty: 'expert' })),
      ).toThrow();
      expect(() =>
        parseOutline(outlineJson({ key_terms: [{ term: 'x' }] })),
      ).toThrow();
      expect(() =>
        parseOutline(outlineJson({ lesson_shape: { hook: 'h' } })),
      ).toThrow();
      expect(() =>
        parseOutline(outlineJson({ research_brief: { sources: [] } })),
      ).toThrow();
    });
  });

  describe('objectivesWithoutBloomVerb', () => {
    it('flags objectives lacking a leading Bloom verb', () => {
      expect(
        objectivesWithoutBloomVerb([
          'Explain branching',
          'Stuff about git',
          'Create a branch',
        ]),
      ).toEqual(['Stuff about git']);
    });
  });

  describe('parseCritique', () => {
    it('accepts the rubric shape and rejects the rest', () => {
      expect(
        parseCritique(
          JSON.stringify({ blocking_issues: ['fix x'], suggestions: [] }),
        ),
      ).toEqual({ blocking_issues: ['fix x'], suggestions: [] });
      expect(() => parseCritique('garbage')).toThrow();
      expect(() =>
        parseCritique(JSON.stringify({ blocking_issues: 'fix x' })),
      ).toThrow();
    });
  });

  describe('parseFactcheck', () => {
    it('accepts the fact-check shape and rejects the rest', () => {
      expect(
        parseFactcheck(
          JSON.stringify({
            consistent: false,
            outline_drift: ['missed objective 2'],
            term_issues: [],
          }),
        ),
      ).toMatchObject({ consistent: false });
      expect(() => parseFactcheck('garbage')).toThrow();
      expect(() =>
        parseFactcheck(
          JSON.stringify({
            consistent: 'yes',
            outline_drift: [],
            term_issues: [],
          }),
        ),
      ).toThrow();
    });
  });

  describe('parseResearchBrief', () => {
    it('accepts the private-brief shape and rejects the rest', () => {
      expect(
        parseResearchBrief(
          JSON.stringify({ brief: 'Use closures.', key_points: ['a'] }),
        ),
      ).toEqual({ brief: 'Use closures.', key_points: ['a'] });
      expect(() => parseResearchBrief('garbage')).toThrow();
      expect(() =>
        parseResearchBrief(JSON.stringify({ brief: '  ', key_points: [] })),
      ).toThrow();
    });
  });
});
