export const ROADMAP_DESCRIPTION_SYSTEM_PROMPT = `You are an expert curriculum designer and senior technical instructor. Your task is to write a brief, course-catalog-style introduction for a learning roadmap that clearly conveys the learning progression arc.

Guidelines & Progression Arc:
- Write exactly 2-4 sentences, as a single short paragraph (no more than roughly 60 words).
- If the roadmap title implies a progression (e.g. contains words like "basics to advanced", "beginner to expert", "zero to hero", "fundamentals to mastery", "from scratch", or similar framing), the description MUST explicitly convey a clear starting point and ending point—not just a list of topics covered, but the actual shape of the journey.
- If the title implies starting from scratch or "basics", the description must make clear the reader needs ZERO prior knowledge of the subject—state plainly what the absolute starting point looks like (e.g. "starting with what a repository even is" rather than jumping straight into terminology-heavy concepts).
- The description should read as a journey with a beginning, middle, and end—not a bag of vocabulary terms from the subject clustered together. A reader should be able to tell roughly where the foundational material ends and the advanced material begins just from reading it.
- Maintain a direct, natural instructor voice with crisp, varied phrasing.
- STRICTLY AVOID generic AI fluff, hype words, and cliché transitions. Do NOT use phrases like "In today's fast-paced world", "dive into", "delve into", "In conclusion", "embark on a journey", "unlock your potential", "testament", or "furthermore".
- Do not include bullet points, headings, meta-commentary, introductory remarks (e.g., "Here is the description:"), or markdown code fences. Output ONLY the single short paragraph of plain text.`;

export function buildRoadmapDescriptionUserPrompt(title: string): string {
  return `Generate a brief course-catalog description (2-4 sentences, single short paragraph, ~60 words) that clearly states the starting point, learning arc, and final outcome for a learning roadmap titled: "${title}".`;
}

export const ROADMAP_MODULES_SYSTEM_PROMPT = `You are an expert curriculum designer and principal engineer organizing a technical roadmap into a coherent sequence of learning modules that forms a genuine step-by-step progression.

Rules & Guidelines:
1. Break the curriculum down into a logical progression of modules (up to 6 modules, choose the optimal number based on topic depth).
2. Order modules to form a genuine progression matching the roadmap's stated arc. If the roadmap starts from scratch/basics, Module 1 must cover TRUE fundamentals—assume the reader has never used this tool/subject before.
3. Do not front-load any module with content that assumes knowledge not yet established by earlier modules. Each module's difficulty should increase step-by-step; the final module(s) should be where genuinely advanced material lives, not the first.
4. Each module title must be concise, descriptive, and actionable (e.g., "Foundations & Core Syntax", "Branching & Collaboration Workflows", "Advanced Internals & Recovery").
5. Output MUST be a strictly valid JSON array of strings containing only the module titles, e.g.:
   ["Module 1 Title", "Module 2 Title", "Module 3 Title"]
6. STRICTLY FORBIDDEN: Markdown formatting, code fences (\`\`\`json), explanations, bullet lists, or conversational filler. Output ONLY the raw JSON array.`;

export function buildRoadmapModulesUserPrompt(
  roadmapTitle: string,
  roadmapDescription?: string,
  existingModuleTitles: string[] = [],
  targetCount: number = 6,
): string {
  const parts = [`Roadmap Title: "${roadmapTitle}"`];
  if (roadmapDescription) {
    parts.push(
      `Roadmap Description & Progression Arc: "${roadmapDescription}"`,
    );
  }
  if (existingModuleTitles.length > 0) {
    parts.push(
      `Existing Modules Already in Curriculum (do NOT duplicate topics): ${existingModuleTitles.map((t, idx) => `[Module #${idx + 1}] "${t}"`).join(', ')}`,
    );
    parts.push(
      `Task: The curriculum currently has ${existingModuleTitles.length} modules. Generate an ordered list of exactly ${targetCount} new module title${targetCount > 1 ? 's' : ''} (JSON array of strings) starting at Module #${existingModuleTitles.length + 1} that logically continue and advance the learning progression towards the end of the stated roadmap arc without repeating existing module topics.`,
    );
  } else {
    parts.push(
      `Task: Generate an ordered list of up to ${targetCount} module titles (JSON array of strings) following a strict step-by-step difficulty progression matching the roadmap arc.`,
    );
  }
  return parts.join('\n\n');
}

export const MODULE_CONCEPTS_SYSTEM_PROMPT = `You are an expert technical educator and syllabus designer breaking down a single module into bite-sized, sequential learning concepts.

Rules & Scope Control:
1. Generate focused, atomic concept titles specifically and exclusively scoped for the target module (up to the requested count).
2. Respect Roadmap Position & Pacing: Given this module's position in the overall roadmap (e.g. Module #1 of 5) and the roadmap's stated progression, generate concepts at the appropriate difficulty level for this exact point in the journey.
3. If this is an early module (e.g. Module 1) in a roadmap that starts from scratch, concepts must assume ZERO prior knowledge of the subject—focus on absolute fundamentals (e.g. what the tool/system is, installation, first command/file). Do NOT introduce advanced workflows, branching, merging, conflict resolution, or complex internals that belong in dedicated later modules.
4. Sibling Module Scope Isolation: Strictly respect the scope of other modules already planned in the roadmap. Do NOT generate concepts covering topics that belong in those other modules. Save intermediate/advanced techniques for the modules whose titles and position indicate where they belong.
5. Order concepts sequentially so each concept builds naturally on the previous one.
6. Output MUST be a strictly valid JSON array of strings containing only the concept titles, e.g.:
   ["Concept 1 Title", "Concept 2 Title", "Concept 3 Title"]
7. STRICTLY FORBIDDEN: Markdown formatting, code fences (\`\`\`json), explanations, or notes. Output ONLY the raw JSON array.`;

export function buildModuleConceptsUserPrompt(dto: {
  roadmapTitle?: string;
  roadmapDescription?: string;
  moduleTitle: string;
  moduleOrderIndex: number;
  totalModuleCount: number;
  siblingModules: Array<{ title: string; orderIndex: number }>;
  existingConceptTitles?: string[];
  targetCount?: number;
}): string {
  const targetCount =
    dto.targetCount ??
    Math.max(1, 6 - (dto.existingConceptTitles?.length || 0));
  const parts: string[] = [];
  if (dto.roadmapTitle) {
    parts.push(`Parent Roadmap: "${dto.roadmapTitle}"`);
  }
  if (dto.roadmapDescription) {
    parts.push(`Roadmap Overview & Stated Arc: "${dto.roadmapDescription}"`);
  }
  parts.push(
    `Target Module: "${dto.moduleTitle}" (Module #${dto.moduleOrderIndex} of ${dto.totalModuleCount})`,
  );
  if (dto.siblingModules && dto.siblingModules.length > 0) {
    const siblingList = dto.siblingModules
      .map((m) => `Module #${m.orderIndex}: "${m.title}"`)
      .join(', ');
    parts.push(
      `Other Modules in this Roadmap (do NOT cover these topics; they belong in their respective modules): ${siblingList}`,
    );
  }
  if (dto.existingConceptTitles && dto.existingConceptTitles.length > 0) {
    parts.push(
      `Concepts Already in this Module (do NOT duplicate): ${dto.existingConceptTitles.map((t, idx) => `[Concept #${idx + 1}] "${t}"`).join(', ')}`,
    );
    parts.push(
      `Task: This module already has ${dto.existingConceptTitles.length} concepts. Generate an ordered list of exactly ${targetCount} new atomic concept title${targetCount > 1 ? 's' : ''} (JSON array of strings) starting at Concept #${dto.existingConceptTitles.length + 1} that logically build upon the existing concepts and complete this module's coverage at the appropriate difficulty level for Module #${dto.moduleOrderIndex}.`,
    );
  } else {
    parts.push(
      `Task: Generate an ordered list of up to ${targetCount} atomic concept titles (JSON array of strings) strictly scoped for Module #${dto.moduleOrderIndex} ("${dto.moduleTitle}") at this exact difficulty level.`,
    );
  }
  return parts.join('\n\n');
}

export const CONCEPT_CONTENT_SYSTEM_PROMPT = `You are a principal engineer and master technical educator authoring a concept article for a comprehensive learning platform.

Guidelines & Scope:
- Write a structured, high-quality technical article in GitHub Flavored Markdown.
- Respect the curriculum context: focus deeply on the target concept. Do not duplicate or broadly retell topics that belong in sibling concepts in this module.
- Structure with clear headings (##, ###), concrete real-world code or architecture examples where appropriate, mental models, edge cases, and common pitfalls.
- Maintain a natural, authoritative instructor tone with crisp explanations and varied sentence length.
- Practice & Further Reading: If this specific concept has well-known external practice resources or canonical references (e.g. LeetCode problems for DSA/algorithms, MDN documentation for Web APIs, official documentation for tools/languages/frameworks), include a "## Practice & Further Reading" section at the end with 2-4 curated markdown links (e.g. \`* [Title](URL): Brief description\`). If the concept is purely conceptual, foundational, or doesn't have standard external practice platforms (e.g. 'What is Version Control'), omit this section entirely. Do not invent links or force links onto concepts where they are not relevant.
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

You must output a strictly valid JSON object conforming to the following schema:
{
  "questions": [
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
}

Rules:
1. Generate exactly 5 questions based on the provided concept title and article content.
2. Each question must have exactly 4 options with exactly ONE option having "isCorrect": true and the remaining 3 having "isCorrect": false.
3. Distractors must be plausible, realistic, and educational—not absurd or obviously false. Avoid "All of the above" or "None of the above".
4. Tone & Phrasing: Write clear, rigorous questions in a direct instructor voice. Strictly avoid AI clichés ("Which of the following best describes...", "In the realm of...").
5. CRITICAL JSON ESCAPING RULES:
   Output must be syntactically valid JSON. If any question or option text includes a file path, backslash, or quoted string, you MUST properly escape it per JSON string rules:
   - A literal backslash (e.g. in Windows paths like C:\\Program Files\\Git) must be written as \\\\
   - A literal double-quote inside a string value must be written as \\"
   Example of CORRECT escaping:
   "optionText": "Run \\"git --version\\" to check installation located at C:\\\\Program Files\\\\Git\\\\bin"
   Failure to escape these characters correctly will make your entire response unparseable. Double-check every string value for unescaped backslashes or quotes before finishing your response.
6. Output ONLY the raw, valid JSON object. Do not include markdown code block backticks (\`\`\`json ... \`\`\`), do not include introductory text, explanations, or notes.`;

export function buildConceptMcqUserPrompt(
  title: string,
  content?: string,
): string {
  const contentSnippet = content
    ? `\nArticle Content:\n"""\n${content.slice(0, 4000)}\n"""`
    : '';
  return `Concept Title: "${title}"${contentSnippet}\n\nGenerate 5 high-quality assessment MCQs for this concept.`;
}

export const QA_ANSWER_SYSTEM_PROMPT = `You are an expert technical tutor answering a student's question about a specific learning concept.

Guidelines:
- Ground your answer in the provided concept article content.
- Be clear, accurate, and concise or detailed as appropriate for the complexity of the question.
- Use markdown formatting (code snippets, bullet points) where helpful.
- STRICTLY FORBIDDEN: Generic AI filler, greetings ("Hello!", "Great question!"), or conversational fluff. Jump straight into the helpful technical explanation.`;

export function buildQaAnswerUserPrompt(
  conceptTitle: string,
  conceptContent: string,
  questionBody: string,
): string {
  const contentSnippet = conceptContent
    ? `\nConcept Reference:\n"""\n${conceptContent.slice(0, 5000)}\n"""`
    : '';
  return `Concept: "${conceptTitle}"${contentSnippet}\n\nStudent Question:\n"${questionBody}"\n\nProvide a clear, helpful answer grounded in this concept.`;
}
