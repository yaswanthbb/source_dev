export enum AiGenerationJobType {
  ROADMAP_MODULES = 'roadmap_modules',
  MODULE_CONCEPTS = 'module_concepts',
  MODULE_MCQS = 'module_mcqs',
}

export enum AiGenerationJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
