import {
  buildRoadmapModulesUserPrompt,
  buildModuleConceptsUserPrompt,
  buildConceptContentUserPrompt,
  buildConceptMcqUserPrompt,
  buildQaAnswerUserPrompt,
} from './prompts';

describe('AI prompt builders', () => {
  describe('buildRoadmapModulesUserPrompt', () => {
    it('includes the title and omits optional blocks by default', () => {
      const p = buildRoadmapModulesUserPrompt('Git');

      expect(p).toContain('Roadmap Title: "Git"');
      expect(p).toContain('up to 6 module titles');
      expect(p).not.toContain('Progression Arc');
      expect(p).not.toContain('Existing Modules Already');
    });

    it('adds the progression-arc block when a description is given', () => {
      const p = buildRoadmapModulesUserPrompt('Git', 'From zero to hero');

      expect(p).toContain('Progression Arc');
      expect(p).toContain('From zero to hero');
    });

    it('lists existing modules and pluralizes the target count', () => {
      const p = buildRoadmapModulesUserPrompt('Git', undefined, ['A', 'B'], 2);

      expect(p).toContain('Existing Modules Already in Curriculum');
      expect(p).toContain('[Module #1] "A"');
      expect(p).toContain('exactly 2 new module titles');
      expect(p).toContain('starting at Module #3');
    });

    it('uses the singular noun when only one module is requested', () => {
      const p = buildRoadmapModulesUserPrompt('Git', undefined, ['A'], 1);

      expect(p).toContain('new module title (JSON');
      expect(p).not.toContain('new module titles');
    });
  });

  describe('buildModuleConceptsUserPrompt', () => {
    it('defaults the target count to fill up to 6 slots', () => {
      const p = buildModuleConceptsUserPrompt({
        moduleTitle: 'Basics',
        moduleOrderIndex: 1,
        totalModuleCount: 3,
        siblingModules: [],
      });

      expect(p).toContain('up to 6 atomic concept titles');
    });

    it('computes the remaining top-up count from existing concepts', () => {
      const p = buildModuleConceptsUserPrompt({
        moduleTitle: 'Basics',
        moduleOrderIndex: 1,
        totalModuleCount: 3,
        siblingModules: [],
        existingConceptTitles: ['x', 'y'],
      });

      expect(p).toContain('exactly 4 new atomic concept titles');
      expect(p).toContain('starting at Concept #3');
    });

    it('emits a sibling-module scope block when siblings exist', () => {
      const p = buildModuleConceptsUserPrompt({
        moduleTitle: 'Basics',
        moduleOrderIndex: 1,
        totalModuleCount: 3,
        siblingModules: [{ title: 'Advanced', orderIndex: 2 }],
      });

      expect(p).toContain('Other Modules in this Roadmap');
      expect(p).toContain('Module #2: "Advanced"');
    });

    it('honours an explicit targetCount over the default', () => {
      const p = buildModuleConceptsUserPrompt({
        moduleTitle: 'Basics',
        moduleOrderIndex: 1,
        totalModuleCount: 3,
        siblingModules: [],
        existingConceptTitles: ['x'],
        targetCount: 2,
      });

      expect(p).toContain('exactly 2 new atomic concept titles');
    });
  });

  describe('buildConceptContentUserPrompt', () => {
    it('defaults the difficulty and omits context when none is supplied', () => {
      const p = buildConceptContentUserPrompt({ title: 'Closures' });

      expect(p).toContain('Target Concept: "Closures"');
      expect(p).toContain('Difficulty Level: medium');
      expect(p).not.toContain('Curriculum Context');
    });

    it('honours an explicit difficulty', () => {
      const p = buildConceptContentUserPrompt({
        title: 'Closures',
        difficulty: 'hard',
      });

      expect(p).toContain('Difficulty Level: hard');
    });

    it('builds a curriculum-context block from the supplied fields', () => {
      const p = buildConceptContentUserPrompt({
        title: 'Closures',
        roadmapTitle: 'JS',
        moduleTitle: 'Functions',
        siblingConceptTitles: ['Scope'],
      });

      expect(p).toContain('Curriculum Context:');
      expect(p).toContain('- Roadmap: "JS"');
      expect(p).toContain('- Module: "Functions"');
      expect(p).toContain('Sibling concepts already in this module');
      expect(p).toContain('"Scope"');
    });
  });

  describe('buildConceptMcqUserPrompt', () => {
    it('omits the article block when no content is supplied', () => {
      const p = buildConceptMcqUserPrompt('Recursion');

      expect(p).toContain('Concept Title: "Recursion"');
      expect(p).toContain('Generate 5 high-quality assessment MCQs');
      expect(p).not.toContain('Article Content');
    });

    it('caps the embedded article content at 4000 characters', () => {
      const p = buildConceptMcqUserPrompt('Recursion', 'a'.repeat(5000));

      expect(p).toContain('Article Content');
      expect(p).toContain('a'.repeat(4000));
      expect(p).not.toContain('a'.repeat(4001));
    });
  });

  describe('buildQaAnswerUserPrompt', () => {
    it('includes the concept, question, and reference block', () => {
      const p = buildQaAnswerUserPrompt('Loops', 'reference text', 'Why?');

      expect(p).toContain('Concept: "Loops"');
      expect(p).toContain('Concept Reference');
      expect(p).toContain('Student Question:');
      expect(p).toContain('Why?');
    });

    it('caps the reference content at 5000 characters', () => {
      const p = buildQaAnswerUserPrompt('Loops', 'b'.repeat(6000), 'Why?');

      expect(p).toContain('b'.repeat(5000));
      expect(p).not.toContain('b'.repeat(5001));
    });

    it('omits the reference block when there is no content', () => {
      const p = buildQaAnswerUserPrompt('Loops', '', 'Why?');

      expect(p).not.toContain('Concept Reference');
    });
  });
});
