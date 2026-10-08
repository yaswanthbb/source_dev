export enum AiGenerationType {
  ROADMAP_MODULES = 'roadmap_modules',
  MODULE_CONCEPTS = 'module_concepts',
  CONCEPT_CONTENT = 'concept_content',
  CONCEPT_MCQS = 'concept_mcqs',
  QA_ANSWER = 'qa_answer',
  // §8 compiler stage-distinct prompt tasks. These resolve prompts only —
  // log generation_type stays CONCEPT_CONTENT for quota/analytics identity.
  CONCEPT_OUTLINE = 'concept_outline',
  CONCEPT_DRAFT = 'concept_draft',
  CONCEPT_FACTCHECK = 'concept_factcheck',
  CONCEPT_CRITIQUE = 'concept_critique',
  CONCEPT_REVISE = 'concept_revise',
  CONCEPT_MISCONCEPTIONS = 'concept_misconceptions',
  CONCEPT_MCQ_DRAFT = 'concept_mcq_draft',
  CONCEPT_MCQ_VERIFY = 'concept_mcq_verify',
}
