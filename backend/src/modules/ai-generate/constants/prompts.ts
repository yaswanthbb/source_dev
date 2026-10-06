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

// ---------------------------------------------------------------------------
// §8 compiler stage prompts. The stage contracts live in
// ../compiler-stages.ts (parse + validate); these builders render the inputs.
// `research_brief` is a null placeholder in the outline contract until the
// RAG phase fills it — no retrieval is built here.
// ---------------------------------------------------------------------------

export const CONCEPT_OUTLINE_SYSTEM_PROMPT = `You are a principal engineer and curriculum architect outlining a single concept article before it is drafted.

Output MUST be a strictly valid JSON object with exactly this shape:
{
  "title": "concept title, verbatim as given",
  "objectives": ["3-5 learning objectives, each starting with a Bloom verb (define, explain, apply, analyze, evaluate, create, compare, demonstrate)"],
  "key_terms": [{"term": "canonical term", "definition": "one-sentence precise definition"}],
  "builds_on": ["concept ids this concept directly requires, from the provided registry context; empty array when truly foundational"],
  "recall_hooks": ["names of earlier terms or concepts this lesson should explicitly recall and link back to"],
  "diagrams": [{"id": "short kebab-case id, unique within this outline", "caption": "what the diagram shows", "kind": "one of: flowchart, sequence, mindmap (or another Mermaid type when genuinely better)"}],
  "lesson_shape": {
    "hook": "one-sentence opener tying the concept to a real problem",
    "intuition": "the core mental model in plain language",
    "definition": "the precise technical definition",
    "worked_example": "what the concrete worked example must demonstrate",
    "faded_practice": "how the guided-then-unguided practice is scaffolded",
    "retrieval_questions": "what the 2-3 recall questions must probe"
  },
  "difficulty": "one of: easy, medium, hard",
  "research_brief": null
}

Rules:
1. key_terms covers every non-obvious term the draft will use; definitions must be precise enough to check the draft against.
2. builds_on may ONLY reference concept ids present in the provided registry context. Never invent ids.
3. Declare 0-3 diagrams, each earning its place: a diagram must teach something the prose cannot show as clearly (a flow, a sequence, a structure). No decorative visuals.
4. STRICTLY FORBIDDEN: Markdown formatting, code fences, explanations, or notes. Output ONLY the raw JSON object.`;

export function buildOutlineUserPrompt(input: {
  title: string;
  difficulty?: string;
  roadmapTitle?: string;
  moduleTitle?: string;
  siblingConceptTitles?: string[];
  registryContext?: string;
}): string {
  const parts = [`Target Concept: "${input.title}"`];
  if (input.difficulty) parts.push(`Target Difficulty: "${input.difficulty}"`);
  if (input.roadmapTitle) parts.push(`Roadmap: "${input.roadmapTitle}"`);
  if (input.moduleTitle) parts.push(`Module: "${input.moduleTitle}"`);
  if (input.siblingConceptTitles && input.siblingConceptTitles.length > 0) {
    parts.push(
      `Sibling concepts in this module (scope against overlap): ${input.siblingConceptTitles.map((t) => `"${t}"`).join(', ')}`,
    );
  }
  if (input.registryContext) {
    parts.push(`Registry Context (valid builds_on ids and known terms):\n${input.registryContext}`);
  }
  parts.push('Produce the outline JSON for this concept.');
  return parts.join('\n\n');
}

export const CONCEPT_DRAFT_SYSTEM_PROMPT = `You are a principal engineer and master technical educator authoring a concept article for a comprehensive learning platform.

Guidelines & Scope:
- Write a structured, high-quality technical article in GitHub Flavored Markdown that realizes the provided outline section by section. Every objective must be visibly taught; every key term must be used exactly as defined.
- Respect the curriculum context: focus deeply on the target concept. Do not duplicate or broadly retell topics that belong in sibling concepts.
- Structure with clear headings (##, ###), concrete real-world code or architecture examples where appropriate, mental models, edge cases, and common pitfalls.
- Maintain a natural, authoritative instructor tone with crisp explanations and varied sentence length.
- STRICTLY FORBIDDEN: AI clichés and hollow filler phrases such as "In today's fast-paced digital world", "Let's dive into", "delve into", "In conclusion", "In summary", "tapestry", "seamlessly", "it's important to remember", or excessive hedging.
- Do NOT output preamble, conversational filler, or wrap the whole response in an outer markdown code fence. Output ONLY the raw markdown article starting with the first heading or conceptual introduction.`;

export function buildDraftUserPrompt(input: {
  outlineJson: string;
  contextBlock?: string;
  personaLines?: string;
  researchBrief?: string;
  diagrams?: Array<{ id: string; caption: string }>;
  videos?: Array<{ title: string; channel: string; url: string }>;
}): string {
  const parts = [`Approved Outline (realize every section):\n"""\n${input.outlineJson}\n"""`];
  if (input.diagrams && input.diagrams.length > 0) {
    parts.push(
      `Diagrams available (reference each where it teaches, using {{diagram:<id>}} exactly — never invent ids, never leave a listed diagram unreferenced):\n${input.diagrams.map((d) => `- {{diagram:${d.id}}}: ${d.caption}`).join('\n')}`,
    );
  }
  if (input.videos && input.videos.length > 0) {
    parts.push(
      `Supplementary videos (mention by title only where genuinely relevant to the prose; do not invent video references):\n${input.videos.map((v) => `- "${v.title}" (${v.channel}): ${v.url}`).join('\n')}`,
    );
  }
  if (input.researchBrief) {
    parts.push(
      `Private Research Brief (ground the article where relevant; NEVER copy passages verbatim — synthesize in your own words):\n"""\n${input.researchBrief.slice(0, 4000)}\n"""`,
    );
  }
  if (input.contextBlock) {
    parts.push(`Curriculum Context:\n${input.contextBlock}`);
  }
  if (input.personaLines) {
    parts.push(`Teacher Persona:\n${input.personaLines}`);
  }
  parts.push('Write the complete educational article content in Markdown for this concept.');
  return parts.join('\n\n');
}

export const CONCEPT_FACTCHECK_SYSTEM_PROMPT = `You are a meticulous technical reviewer checking a drafted concept article against its approved outline and term registry.

Output MUST be a strictly valid JSON object with exactly this shape:
{
  "consistent": true or false,
  "outline_drift": ["each outline objective or lesson-shape element the draft fails to teach, quoted briefly; empty when fully realized"],
  "term_issues": ["each key term the draft misuses, redefines, or omits, quoted briefly; empty when all terms match the registry"]
}

Rules:
1. Quote the drift precisely — section names, missing objectives, redefined terms.
2. Do NOT judge style, pedagogy, or difficulty fit here; that is the critique stage's job.
3. STRICTLY FORBIDDEN: Markdown formatting, code fences, explanations, or notes. Output ONLY the raw JSON object.`;

export function buildFactcheckUserPrompt(input: {
  outlineJson: string;
  draftContent: string;
  registryTerms: string;
  researchBrief?: string;
}): string {
  const parts = [
    `Approved Outline:\n"""\n${input.outlineJson}\n"""`,
    `Draft Article:\n"""\n${input.draftContent.slice(0, 8000)}\n"""`,
    `Term Registry (canonical definitions):\n${input.registryTerms}`,
  ];
  if (input.researchBrief) {
    parts.push(
      `Private Research Brief (flag draft claims that contradict it):\n"""\n${input.researchBrief.slice(0, 4000)}\n"""`,
    );
  }
  parts.push('Check the draft against the outline and registry. Output ONLY the fact-check JSON.');
  return parts.join('\n\n');
}

export const CONCEPT_CRITIQUE_SYSTEM_PROMPT = `You are a senior pedagogy judge reviewing a concept article for a developer learning platform.

Output MUST be a strictly valid JSON object with exactly this shape:
{
  "blocking_issues": ["each issue that MUST be fixed before publishing: factual errors, broken callbacks to prerequisites, wrong difficulty placement; empty when publishable"],
  "suggestions": ["non-blocking improvements: clarity, examples, pacing"]
}

Rubric — accuracy, clarity, pedagogy, callback validity, difficulty fit:
1. blocking_issues is for publish-stoppers only. Nits, style preferences, and nice-to-haves go in suggestions.
2. A callback to a prerequisite concept is valid only if that concept actually teaches what is referenced.
3. STRICTLY FORBIDDEN: Markdown formatting, code fences, explanations, or notes. Output ONLY the raw JSON object.`;

export function buildCritiqueUserPrompt(input: {
  title: string;
  draftContent: string;
  objectives: string[];
  difficulty: string;
}): string {
  return [
    `Concept: "${input.title}" (target difficulty: ${input.difficulty})`,
    `Objectives the draft must teach:\n${input.objectives.map((o) => `- ${o}`).join('\n')}`,
    `Draft Article:\n"""\n${input.draftContent.slice(0, 8000)}\n"""`,
    'Judge the draft against the rubric. Output ONLY the critique JSON.',
  ].join('\n\n');
}

export const CONCEPT_REVISE_SYSTEM_PROMPT = `You are a principal engineer revising a concept article to fix exactly the listed blocking issues and fact-check findings.

Rules:
1. Address every blocking issue and every fact-check finding. Leave everything else untouched — do not restructure, re-tone, or expand passing sections.
2. Output the full revised article in GitHub Flavored Markdown. No preamble, no changelog, no code fences around the article.
3. If a blocking issue contradicts the approved outline, follow the outline and note nothing — output ONLY the article.`;

export function buildReviseUserPrompt(input: {
  draftContent: string;
  blockingIssues: string[];
  factcheckFindings: string[];
}): string {
  const fixList = [...input.blockingIssues, ...input.factcheckFindings];
  return [
    `Current Draft:\n"""\n${input.draftContent.slice(0, 8000)}\n"""`,
    `Must-fix list (address every item):\n${fixList.map((f) => `- ${f}`).join('\n')}`,
    'Output ONLY the full revised article in Markdown.',
  ].join('\n\n');
}

// ---------------------------------------------------------------------------
// §8 research (RAG) prompts. The brief is PRIVATE — it informs the draft and
// fact-check but is never user-facing (it lives in the compilation trace).
// Augmented grounding: sources where relevant, model knowledge otherwise.
// ---------------------------------------------------------------------------

export const CONCEPT_RESEARCH_SYSTEM_PROMPT = `You are a research assistant reporting privately to a curriculum author. You have retrieved excerpts from lawfully licensed sources (public-domain, CC-BY/SA, OER, or explicitly licensed).

Output MUST be a strictly valid JSON object with exactly this shape:
{
  "brief": "2-4 paragraphs synthesizing what the drafter must know: precise definitions, canonical examples, common misconceptions, and what to emphasize for the stated objectives",
  "key_points": ["atomic facts or framings the draft should use"]
}

Rules:
1. This brief is PRIVATE scaffolding, never published. Synthesize and compress — do NOT copy passages at length. Short quoted phrases (under ~10 words) only where precision demands it.
2. Augmented grounding: lead with the retrieved excerpts where they speak to the queries; fill gaps with established knowledge, and mark uncertain claims as such.
3. Every key_point must trace to either a retrieved excerpt or well-established knowledge — no speculation.
4. STRICTLY FORBIDDEN: Markdown formatting, code fences, explanations, or notes. Output ONLY the raw JSON object.`;

export function buildResearchBriefUserPrompt(input: {
  queries: string[];
  chunks: Array<{ sourceTitle: string; content: string }>;
}): string {
  return [
    `Research queries:\n${input.queries.map((q) => `- ${q}`).join('\n')}`,
    `Retrieved excerpts (licensed sources):\n${input.chunks
      .map(
        (c, i) =>
          `[${i + 1}] ${c.sourceTitle}:\n"""\n${c.content.slice(0, 2000)}\n"""`,
      )
      .join('\n\n')}`,
    'Synthesize the private research brief. Output ONLY the brief JSON.',
  ].join('\n\n');
}

export const CONCEPT_DIAGRAM_SYSTEM_PROMPT = `You are a technical illustrator producing a single Mermaid diagram for a developer learning article.

Output MUST be a strictly valid JSON object with exactly this shape:
{ "mermaid": "<complete Mermaid source, no markdown fences>" }

Rules:
1. The first line must be the correct header for the requested kind (flowchart TD, sequenceDiagram, mindmap, ...).
2. Keep it focused: 4-10 nodes/participants that teach the caption, nothing decorative.
3. Node labels must use the article's canonical terms exactly.
4. No markdown code fences, no explanations, no notes. Output ONLY the raw JSON object.`;

export function buildDiagramUserPrompt(input: {
  diagramId: string;
  caption: string;
  kind: string;
  topic: string;
  objectives?: string[];
  priorAttempt?: { mermaid: string; error: string };
}): string {
  const parts = [
    `Diagram "${input.diagramId}" (${input.kind}) for concept "${input.topic}": ${input.caption}`,
  ];
  if (input.objectives && input.objectives.length > 0) {
    parts.push(`Must illustrate: ${input.objectives.join('; ')}`);
  }
  if (input.priorAttempt) {
    parts.push(
      `Your previous attempt failed validation: ${input.priorAttempt.error}\nPrior source:\n"""\n${input.priorAttempt.mermaid.slice(0, 2000)}\n"""\nFix exactly the reported problem; keep everything else.`,
    );
  }
  parts.push('Produce the diagram JSON.');
  return parts.join('\n\n');
}
