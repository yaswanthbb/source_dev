import type { MigrationInterface, QueryRunner } from 'typeorm';

// Immutable v1 snapshots: do not import mutable runtime prompts into a migration.
export class AssessmentPromptSeeds1788070000000 implements MigrationInterface {
  name = 'AssessmentPromptSeeds1788070000000';
  async up(runner: QueryRunner): Promise<void> {
    const seeds = [
      [
        'concept_misconceptions',
        `Extract 3–6 distinct common misconceptions grounded in the supplied concept.
Return only JSON: {"misconceptions":["one concise misconception", "..."]}. No learner answers or reasoning preamble.`,
      ],
      [
        'concept_mcq_draft',
        `Create a grounded single-best-answer assessment. Return only JSON {"questions":[...]}. Each item has
questionText (a complete clear problem), bloomLevel (Remember|Understand|Apply|Analyze|Evaluate|Create), intendedDifficulty (easy|medium|hard),
correctRationale (one line), nullSetCorrect (boolean), and options [{optionText,isCorrect,misconception,distractorRationale}].
Exactly one option is correct. Correct option misconception and distractorRationale are null.
Every distractor maps to an exact supplied misconception and has a one-line rationale; when inventory is empty misconception may be null.
At least the supplied target percent must require Apply or higher, through actual scenarios rather than relabeling recall questions.
Use homogeneous independent grammatically compatible options of comparable length. Avoid negatives, all/none-of-the-above,
isolated absolute words, lexical key cues, duplicate or simultaneously defensible options. Vary correct positions.
For a repair/revision, return exactly the requested item count and address the listed issues. No chain-of-thought or preamble.`,
      ],
      [
        'concept_mcq_verify',
        `Answer the supplied question independently using the concept content. You are not given the author's key.
Return only JSON {"answerIndex":0,"defensibleIndexes":[0],"nullSetCorrect":false,"reason":"one-line evidence"}.
Indexes are zero based. Include EVERY defensibly correct option under the stem in defensibleIndexes, even when ambiguous.
Use answerIndex null and defensibleIndexes [] if no option is correct. nullSetCorrect is true only when a none-of-the-above
answer genuinely represents the null set. Do not guess the author's intention. No chain-of-thought.`,
      ],
    ];
    for (const [task, template] of seeds)
      await runner.query(
        `INSERT INTO ai_prompt_versions (task, version, system_template, changelog, status) VALUES ($1, '1.0.0', $2, 'Assessment factory v1', 'production')`,
        [task, template],
      );
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `DELETE FROM ai_prompt_versions WHERE version = '1.0.0' AND task IN ('concept_misconceptions','concept_mcq_draft','concept_mcq_verify')`,
    );
  }
}
