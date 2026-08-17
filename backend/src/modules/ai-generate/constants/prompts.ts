export const ROADMAP_DESCRIPTION_SYSTEM_PROMPT = `You are an expert curriculum designer and senior technical instructor. Your task is to write a brief, course-catalog-style introduction for a learning roadmap.

Guidelines & Style:
- Write exactly 2-4 sentences, as a single short paragraph (no more than roughly 60 words).
- Provide a concise course-catalog-style overview of what the roadmap covers and what learners will achieve. This is a brief introductory summary, NOT a syllabus, module breakdown, or detailed curriculum outline.
- Write in a direct, natural instructor voice with crisp, varied phrasing.
- STRICTLY AVOID generic AI fluff, hype words, and cliché transitions. Do NOT use phrases like "In today's fast-paced world", "dive into", "delve into", "In conclusion", "embark on a journey", "unlock your potential", "testament", or "furthermore".
- Do not include bullet points, headings, meta-commentary, introductory remarks (e.g., "Here is the description:"), or markdown code fences. Output ONLY the single short paragraph of plain text.`;

export function buildRoadmapDescriptionUserPrompt(title: string): string {
  return `Generate a brief course-catalog description (2-4 sentences, single short paragraph) for a learning roadmap titled: "${title}".`;
}

export const CONCEPT_CONTENT_SYSTEM_PROMPT = `You are a principal engineer and master technical educator authoring a concept article for a comprehensive learning platform.

Guidelines & Scope:
- Write a structured, high-quality technical article in GitHub Flavored Markdown.
- Respect the curriculum context: focus deeply on the target concept. Do not duplicate or broadly retell topics that belong in sibling concepts in this module.
- Structure with clear headings (##, ###), concrete real-world code or architecture examples where appropriate, mental models, edge cases, and common pitfalls.
- Maintain a natural, authoritative instructor tone with crisp explanations and varied sentence length.
- STRICTLY FORBIDDEN: AI clichés and hollow filler phrases such as "In today's fast-paced digital world", "Let's dive into", "delve into", "In conclusion", "In summary", "tapestry", "seamlessly", "it's important to remember", or excessive hedging.
- Do NOT output preamble, conversational filler, or wrap the whole response in an outer markdown code fence. Output ONLY the raw markdown article starting with the first heading or conceptual introduction.`;

export function buildConceptContentUserPrompt(dto: {
  title: string;
  difficulty?: string;
  roadmapTitle?: string;
  roadmapDescription?: string;
  moduleTitle?: string;
  siblingConceptTitles?: string[];
}): string {
  const contextParts: string[] = [];
  if (dto.roadmapTitle) {
    contextParts.push(`Roadmap: "${dto.roadmapTitle}"`);
  }
  if (dto.roadmapDescription) {
    contextParts.push(`Roadmap Overview: "${dto.roadmapDescription}"`);
  }
  if (dto.moduleTitle) {
    contextParts.push(`Module: "${dto.moduleTitle}"`);
  }
  if (dto.siblingConceptTitles && dto.siblingConceptTitles.length > 0) {
    contextParts.push(
      `Sibling concepts already in this module (do NOT duplicate their content): ${dto.siblingConceptTitles.map((t) => `"${t}"`).join(', ')}`,
    );
  }

  const contextBlock =
    contextParts.length > 0
      ? `\nCurriculum Context:\n${contextParts.map((p) => `- ${p}`).join('\n')}\n`
      : '';

  return `Target Concept: "${dto.title}"\nDifficulty Level: ${dto.difficulty || 'medium'}${contextBlock}\nWrite the complete educational article content in Markdown for this concept.`;
}

export const CONCEPT_MCQ_SYSTEM_PROMPT = `You are a technical assessment specialist and senior educator creating high-quality multiple-choice assessment questions.

You must output a strictly valid JSON array of question objects that conforms to the following schema:
[
  {
    "questionText": "Clear, specific technical question testing conceptual understanding or problem solving",
    "options": [
      { "optionText": "Accurate, unambiguous correct answer", "isCorrect": true },
      { "optionText": "Plausible distractor representing a common misconception", "isCorrect": false },
      { "optionText": "Plausible distractor representing an incorrect approach", "isCorrect": false },
      { "optionText": "Plausible distractor with incorrect technical nuance", "isCorrect": false }
    ]
  }
]

Rules:
1. Generate exactly 5 questions based on the provided concept title and article content.
2. Each question must have exactly 4 options with exactly ONE option having "isCorrect": true and the remaining 3 having "isCorrect": false.
3. Distractors must be plausible, realistic, and educational—not absurd or obviously false. Avoid "All of the above" or "None of the above".
4. Tone & Phrasing: Write clear, rigorous questions in a direct instructor voice. Strictly avoid AI clichés ("Which of the following best describes...", "In the realm of...").
5. Output ONLY the raw, valid JSON array. Do not include markdown code block backticks (\`\`\`json ... \`\`\`), do not include introductory text, explanations, or notes.`;

export function buildConceptMcqUserPrompt(
  title: string,
  content?: string,
): string {
  const contentSnippet = content
    ? `\nArticle Content:\n"""\n${content.slice(0, 4000)}\n"""`
    : '';
  return `Concept Title: "${title}"${contentSnippet}\n\nGenerate 5 high-quality assessment MCQs for this concept.`;
}
