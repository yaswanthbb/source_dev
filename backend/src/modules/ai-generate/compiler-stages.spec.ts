import {
  objectivesWithoutBloomVerb,
  parseCritique,
  parseDiagram,
  parseFactcheck,
  parseOutline,
  parseResearchBrief,
  validateMermaid,
  extractDiagramRefs,
} from './compiler-stages';
import {
  CONCEPT_DIAGRAM_SYSTEM_PROMPT,
  CONCEPT_OUTLINE_SYSTEM_PROMPT,
} from './constants/prompts';

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
    diagrams: [],
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

  describe('outline diagrams contract', () => {
    it('rejects missing diagrams, malformed entries, and duplicate ids', () => {
      const raw = outlineJson();
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      delete parsed['diagrams'];
      expect(() => parseOutline(JSON.stringify(parsed))).toThrow();
      expect(() =>
        parseOutline(
          outlineJson({ diagrams: [{ id: 'd1', caption: 'c' }] }),
        ),
      ).toThrow();
      expect(() =>
        parseOutline(
          outlineJson({
            diagrams: [
              { id: 'd1', caption: 'c1', kind: 'flowchart' },
              { id: 'd1', caption: 'c2', kind: 'sequence' },
            ],
          }),
        ),
      ).toThrow();
      expect(
        parseOutline(
          outlineJson({
            diagrams: [{ id: 'd1', caption: 'c1', kind: 'flowchart' }],
          }),
        ).diagrams,
      ).toEqual([{ id: 'd1', caption: 'c1', kind: 'flowchart' }]);
    });

    it('pins the diagrams schema in the outline system prompt (v2 baseline)', () => {
      expect(CONCEPT_OUTLINE_SYSTEM_PROMPT).toContain('"diagrams"');
      expect(CONCEPT_OUTLINE_SYSTEM_PROMPT).toContain('flowchart');
      expect(CONCEPT_DIAGRAM_SYSTEM_PROMPT).toContain('"mermaid"');
    });
  });

  describe('parseDiagram', () => {
    it('accepts mermaid JSON, strips fences, rejects the rest', () => {
      expect(
        parseDiagram(JSON.stringify({ mermaid: 'flowchart TD\n  A-->B' })),
      ).toEqual({ mermaid: 'flowchart TD\n  A-->B' });
      expect(
        parseDiagram(
          JSON.stringify({ mermaid: '```mermaid\nflowchart TD\n  A-->B\n```' }),
        ),
      ).toEqual({ mermaid: 'flowchart TD\n  A-->B' });
      expect(() => parseDiagram('garbage')).toThrow();
      expect(() => parseDiagram(JSON.stringify({ mermaid: '  ' }))).toThrow();
    });
  });

  describe('extractDiagramRefs', () => {
    it('finds {{diagram:id}} references, deduplicated', () => {
      expect(
        extractDiagramRefs(
          'See {{diagram:flow-one}} and {{diagram:flow-one}} plus {{ diagram:seq_2 }}.',
        ),
      ).toEqual(['flow-one', 'seq_2']);
      expect(extractDiagramRefs('no refs here')).toEqual([]);
    });
  });

  describe('validateMermaid', () => {
    it('accepts well-formed diagrams of the declared kind', () => {
      expect(
        validateMermaid('flowchart TD\n  A[commit] --> B[branch]', 'flowchart').ok,
      ).toBe(true);
      expect(
        validateMermaid(
          'sequenceDiagram\n  A->>B: call\n  B-->>A: return',
          'sequence',
        ).ok,
      ).toBe(true);
      expect(
        validateMermaid('mindmap\n  root((topic))\n    child', 'mindmap').ok,
      ).toBe(true);
      // Open kinds accept any recognized header.
      expect(
        validateMermaid('pie title Pets\n  "Dogs" : 5\n  "Cats" : 3', 'radial').ok,
      ).toBe(true);
    });

    it('rejects wrong headers, fences, stubs, and unbalanced delimiters', () => {
      expect(
        validateMermaid('sequenceDiagram\n  A->>B: x', 'flowchart').ok,
      ).toBe(false);
      expect(
        validateMermaid('```mermaid\nflowchart TD\n  A-->B\n```', 'flowchart').ok,
      ).toBe(false);
      expect(validateMermaid('flowchart TD', 'flowchart').ok).toBe(false);
      expect(
        validateMermaid('flowchart TD\n  A["x" --> B', 'flowchart').ok,
      ).toBe(false);
      expect(validateMermaid('just some prose', 'flowchart').ok).toBe(false);
      // Quoted label brackets must not trip the balance check.
      expect(
        validateMermaid('flowchart TD\n  A["x (y)"] --> B["z"]', 'flowchart').ok,
      ).toBe(true);
    });
  });
});
