export function buildAssessmentUserPrompt(
  context: {
    title: string;
    content: string;
    misconceptions: string[];
    targetPercent: number;
  },
  request: unknown,
): string {
  return JSON.stringify({ ...context, request });
}

export const MISCONCEPTIONS_PROMPT = `Extract 3–6 distinct common misconceptions grounded in the supplied concept.
Return only JSON: {"misconceptions":["one concise misconception", "..."]}. No learner answers or reasoning preamble.`;
export const ASSESSMENT_DRAFT_PROMPT = `Create a grounded single-best-answer assessment. Return only JSON {"questions":[...]}. Each item has
questionText (a complete clear problem), bloomLevel (Remember|Understand|Apply|Analyze|Evaluate|Create), intendedDifficulty (easy|medium|hard),
correctRationale (one line), nullSetCorrect (boolean), and options [{optionText,isCorrect,misconception,distractorRationale}].
Exactly one option is correct. Correct option misconception and distractorRationale are null.
Every distractor maps to an exact supplied misconception and has a one-line rationale; when inventory is empty misconception may be null.
At least the supplied target percent must require Apply or higher, through actual scenarios rather than relabeling recall questions.
Use homogeneous independent grammatically compatible options of comparable length. Avoid negatives, all/none-of-the-above,
isolated absolute words, lexical key cues, duplicate or simultaneously defensible options. Vary correct positions.
For a repair/revision, return exactly the requested item count and address the listed issues. No chain-of-thought or preamble.`;
export const ASSESSMENT_VERIFY_PROMPT = `Answer the supplied question independently using the concept content. You are not given the author's key.
Return only JSON {"answerIndex":0,"defensibleIndexes":[0],"nullSetCorrect":false,"reason":"one-line evidence"}.
Indexes are zero based. Include EVERY defensibly correct option under the stem in defensibleIndexes, even when ambiguous.
Use answerIndex null and defensibleIndexes [] if no option is correct. nullSetCorrect is true only when a none-of-the-above
answer genuinely represents the null set. Do not guess the author's intention. No chain-of-thought.`;
