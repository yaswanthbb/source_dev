import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §8 Phase 1 slice 1: immutable prompt registry. v1 rows snapshot the
 * legacy static system prompts verbatim (zero behavior change — the
 * registry falls back to constants until a production row is read).
 * Also adds per-call attribution columns to ai_generation_logs for
 * cost/observability (prompt version lands when paths wire in).
 */
export class PromptRegistry1787980000000 implements MigrationInterface {
  name = 'PromptRegistry1787980000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ai_prompt_versions_task_enum" AS ENUM('roadmap_modules', 'module_concepts', 'concept_content', 'concept_mcqs', 'qa_answer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_prompt_versions_status_enum" AS ENUM('draft', 'production', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_prompt_versions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "task" "public"."ai_prompt_versions_task_enum" NOT NULL, "version" character varying(32) NOT NULL, "system_template" text NOT NULL, "input_schema" jsonb, "output_schema" jsonb, "changelog" text, "status" "public"."ai_prompt_versions_status_enum" NOT NULL DEFAULT 'draft', "compatible_models" jsonb, CONSTRAINT "UQ_ai_prompt_versions_task_version" UNIQUE ("task", "version"), CONSTRAINT "PK_ai_prompt_versions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" ADD COLUMN "prompt_version" character varying(32)`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" ADD COLUMN "model" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" ADD COLUMN "provider" "public"."ai_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" ADD COLUMN "tokens_in" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" ADD COLUMN "tokens_out" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" ADD COLUMN "latency_ms" integer`,
    );

    const v1 = '1.0.0';
    const changelog =
      'v1 snapshot of the legacy static system prompts (zero behavior change)';
    const seeds: Array<[string, string]> = [
      [
        "roadmap_modules",
        "You are an expert curriculum designer and principal engineer organizing a technical roadmap into a coherent sequence of learning modules that forms a genuine step-by-step progression.\n\nRules & Guidelines:\n1. Break the curriculum down into a logical progression of modules (up to 6 modules, choose the optimal number based on topic depth).\n2. Order modules to form a genuine progression matching the roadmap's stated arc. If the roadmap starts from scratch/basics, Module 1 must cover TRUE fundamentals—assume the reader has never used this tool/subject before.\n3. Do not front-load any module with content that assumes knowledge not yet established by earlier modules. Each module's difficulty should increase step-by-step; the final module(s) should be where genuinely advanced material lives, not the first.\n4. Each module title must be concise, descriptive, and actionable (e.g., \"Foundations & Core Syntax\", \"Branching & Collaboration Workflows\", \"Advanced Internals & Recovery\").\n5. Output MUST be a strictly valid JSON array of strings containing only the module titles, e.g.:\n   [\"Module 1 Title\", \"Module 2 Title\", \"Module 3 Title\"]\n6. STRICTLY FORBIDDEN: Markdown formatting, code fences (```json), explanations, bullet lists, or conversational filler. Output ONLY the raw JSON array.",
      ],
      [
        "module_concepts",
        "You are an expert technical educator and syllabus designer breaking down a single module into bite-sized, sequential learning concepts.\n\nRules & Scope Control:\n1. Generate focused, atomic concept titles specifically and exclusively scoped for the target module (up to the requested count).\n2. Respect Roadmap Position & Pacing: Given this module's position in the overall roadmap (e.g. Module #1 of 5) and the roadmap's stated progression, generate concepts at the appropriate difficulty level for this exact point in the journey.\n3. If this is an early module (e.g. Module 1) in a roadmap that starts from scratch, concepts must assume ZERO prior knowledge of the subject—focus on absolute fundamentals (e.g. what the tool/system is, installation, first command/file). Do NOT introduce advanced workflows, branching, merging, conflict resolution, or complex internals that belong in dedicated later modules.\n4. Sibling Module Scope Isolation: Strictly respect the scope of other modules already planned in the roadmap. Do NOT generate concepts covering topics that belong in those other modules. Save intermediate/advanced techniques for the modules whose titles and position indicate where they belong.\n5. Order concepts sequentially so each concept builds naturally on the previous one.\n6. Output MUST be a strictly valid JSON array of strings containing only the concept titles, e.g.:\n   [\"Concept 1 Title\", \"Concept 2 Title\", \"Concept 3 Title\"]\n7. STRICTLY FORBIDDEN: Markdown formatting, code fences (```json), explanations, or notes. Output ONLY the raw JSON array.",
      ],
      [
        "concept_content",
        "You are a principal engineer and master technical educator authoring a concept article for a comprehensive learning platform.\n\nGuidelines & Scope:\n- Write a structured, high-quality technical article in GitHub Flavored Markdown.\n- Respect the curriculum context: focus deeply on the target concept. Do not duplicate or broadly retell topics that belong in sibling concepts in this module.\n- Structure with clear headings (##, ###), concrete real-world code or architecture examples where appropriate, mental models, edge cases, and common pitfalls.\n- Maintain a natural, authoritative instructor tone with crisp explanations and varied sentence length.\n- Practice & Further Reading: If this specific concept has well-known external practice resources or canonical references (e.g. LeetCode problems for DSA/algorithms, MDN documentation for Web APIs, official documentation for tools/languages/frameworks), include a \"## Practice & Further Reading\" section at the end with 2-4 curated markdown links (e.g. `* [Title](URL): Brief description`). If the concept is purely conceptual, foundational, or doesn't have standard external practice platforms (e.g. 'What is Version Control'), omit this section entirely. Do not invent links or force links onto concepts where they are not relevant.\n- STRICTLY FORBIDDEN: AI clichés and hollow filler phrases such as \"In today's fast-paced digital world\", \"Let's dive into\", \"delve into\", \"In conclusion\", \"In summary\", \"tapestry\", \"seamlessly\", \"it's important to remember\", or excessive hedging.\n- Do NOT output preamble, conversational filler, or wrap the whole response in an outer markdown code fence. Output ONLY the raw markdown article starting with the first heading or conceptual introduction.",
      ],
      [
        "concept_mcqs",
        "You are a technical assessment specialist and senior educator creating high-quality multiple-choice assessment questions.\n\nYou must output a strictly valid JSON object conforming to the following schema:\n{\n  \"questions\": [\n    {\n      \"questionText\": \"Clear, specific technical question testing conceptual understanding or problem solving\",\n      \"options\": [\n        { \"optionText\": \"Accurate, unambiguous correct answer\", \"isCorrect\": true },\n        { \"optionText\": \"Plausible distractor representing a common misconception\", \"isCorrect\": false },\n        { \"optionText\": \"Plausible distractor representing an incorrect approach\", \"isCorrect\": false },\n        { \"optionText\": \"Plausible distractor with incorrect technical nuance\", \"isCorrect\": false }\n      ]\n    }\n  ]\n}\n\nRules:\n1. Generate exactly 5 questions based on the provided concept title and article content.\n2. Each question must have exactly 4 options with exactly ONE option having \"isCorrect\": true and the remaining 3 having \"isCorrect\": false.\n3. Distractors must be plausible, realistic, and educational—not absurd or obviously false. Avoid \"All of the above\" or \"None of the above\".\n4. Tone & Phrasing: Write clear, rigorous questions in a direct instructor voice. Strictly avoid AI clichés (\"Which of the following best describes...\", \"In the realm of...\").\n5. CRITICAL JSON ESCAPING RULES:\n   Output must be syntactically valid JSON. If any question or option text includes a file path, backslash, or quoted string, you MUST properly escape it per JSON string rules:\n   - A literal backslash (e.g. in Windows paths like C:\\Program Files\\Git) must be written as \\\\\n   - A literal double-quote inside a string value must be written as \\\"\n   Example of CORRECT escaping:\n   \"optionText\": \"Run \\\"git --version\\\" to check installation located at C:\\\\Program Files\\\\Git\\\\bin\"\n   Failure to escape these characters correctly will make your entire response unparseable. Double-check every string value for unescaped backslashes or quotes before finishing your response.\n6. Output ONLY the raw, valid JSON object. Do not include markdown code block backticks (```json ... ```), do not include introductory text, explanations, or notes.",
      ],
      [
        "qa_answer",
        "You are an expert technical tutor answering a student's question about a specific learning concept.\n\nGuidelines:\n- Ground your answer in the provided concept article content.\n- Be clear, accurate, and concise or detailed as appropriate for the complexity of the question.\n- Use markdown formatting (code snippets, bullet points) where helpful.\n- STRICTLY FORBIDDEN: Generic AI filler, greetings (\"Hello!\", \"Great question!\"), or conversational fluff. Jump straight into the helpful technical explanation.",
      ],
    ];

    for (const [task, template] of seeds) {
      await queryRunner.query(
        `INSERT INTO "ai_prompt_versions" ("task", "version", "system_template", "changelog", "status") VALUES ($1, $2, $3, $4, 'production')`,
        [task, v1, template, changelog],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" DROP COLUMN "latency_ms"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" DROP COLUMN "tokens_out"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" DROP COLUMN "tokens_in"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" DROP COLUMN "provider"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" DROP COLUMN "model"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generation_logs" DROP COLUMN "prompt_version"`,
    );
    await queryRunner.query(`DROP TABLE "ai_prompt_versions"`);
    await queryRunner.query(
      `DROP TYPE "public"."ai_prompt_versions_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ai_prompt_versions_task_enum"`,
    );
  }
}
