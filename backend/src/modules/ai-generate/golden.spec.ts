import * as fs from 'fs';
import * as path from 'path';
import {
  buildRoadmapModulesUserPrompt,
  buildModuleConceptsUserPrompt,
  buildConceptContentUserPrompt,
  buildConceptMcqUserPrompt,
  buildQaAnswerUserPrompt,
  buildOutlineUserPrompt,
  buildDraftUserPrompt,
  buildFactcheckUserPrompt,
  buildCritiqueUserPrompt,
  buildReviseUserPrompt,
  buildResearchBriefUserPrompt,
} from './constants/prompts';

interface GoldenCase {
  task: string;
  promptVersion: string;
  input: any;
  expectContains: string[];
}

function render(task: string, input: any): string {
  switch (task) {
    case 'roadmap_modules':
      return buildRoadmapModulesUserPrompt(
        input.roadmapTitle,
        input.roadmapDescription,
        input.existingModuleTitles ?? [],
        input.targetCount ?? 6,
      );
    case 'module_concepts':
      return buildModuleConceptsUserPrompt({
        roadmapTitle: input.roadmapTitle,
        roadmapDescription: input.roadmapDescription,
        moduleTitle: input.moduleTitle,
        moduleOrderIndex: input.moduleOrderIndex,
        totalModuleCount: input.totalModuleCount,
        siblingModules: input.siblingModules ?? [],
        existingConceptTitles: input.existingConceptTitles,
        targetCount: input.targetCount,
      });
    case 'concept_content':
      return buildConceptContentUserPrompt(input);
    case 'concept_mcqs':
      return buildConceptMcqUserPrompt(input.title, input.content);
    case 'qa_answer':
      return buildQaAnswerUserPrompt(
        input.conceptTitle,
        input.conceptContent,
        input.questionBody,
      );
    case 'concept_outline':
      return buildOutlineUserPrompt(input);
    case 'concept_draft':
      return buildDraftUserPrompt(input);
    case 'concept_factcheck':
      return buildFactcheckUserPrompt(input);
    case 'concept_critique':
      return buildCritiqueUserPrompt(input);
    case 'concept_revise':
      return buildReviseUserPrompt(input);
    case 'concept_research':
      return buildResearchBriefUserPrompt(input);
    default:
      throw new Error(`unknown golden task: ${task}`);
  }
}

describe('golden baselines (§8 Phase 1: v2 has something to beat)', () => {
  const dir = path.join(__dirname, 'golden');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.v1.jsonl'))
    .sort();

  it('ships one golden file per versioned task', () => {
    expect(files).toEqual([
      'compiler_stages.v1.jsonl',
      'concept_content.v1.jsonl',
      'concept_mcqs.v1.jsonl',
      'module_concepts.v1.jsonl',
      'qa_answer.v1.jsonl',
      'roadmap_modules.v1.jsonl',
    ]);
  });

  for (const file of files) {
    it(`${file}: every case renders and contains its pins`, () => {
      const lines = fs
        .readFileSync(path.join(dir, file), 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        const c = JSON.parse(line) as GoldenCase;
        expect(c.promptVersion).toBe('1.0.0');
        expect(Array.isArray(c.expectContains)).toBe(true);
        expect(c.expectContains.length).toBeGreaterThan(0);
        const rendered = render(c.task, c.input);
        for (const pin of c.expectContains) {
          expect(rendered).toContain(pin);
        }
      }
    });
  }
});
