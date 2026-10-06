# Graph Report - knowledge_is_power  (2026-10-06)

## Corpus Check
- 335 files · ~302,263 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1946 nodes · 4476 edges · 207 communities (98 shown, 109 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b4f93bb7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersController
- user.entity.ts
- users.service.ts
- ReviewService
- ConceptsService
- GamificationService
- QaController
- factories.ts
- admin-commands.ts
- source:dev — Master Plan
- assignments.module.ts
- AttachConceptDto
- Added
- concept.entity.ts
- User
- api-client.ts
- compilerOptions
- AuthController
- roadmap.entity.ts
- ai-generation-job.entity.ts
- collectCoverageFrom
- auth.module.ts
- useSnackbar
- compilerOptions
- AnalyticsController
- typeorm.config.ts
- admin/layout.tsx
- dependencies
- ai-generating-modal.tsx
- AdminContentReviewController
- auth.controller.ts
- scripts
- devDependencies
- app/layout.tsx
- use-terminal-session.ts
- dependencies
- ai-generate.controller.ts
- jest
- research-text.util.ts
- ai-prompt-registry.service.ts
- forgot-password/page.tsx
- RoadmapsController
- Next.js Frontend Application
- frontend/package.json
- PasswordResetOtp
- Concept
- terminal/page.tsx
- exclude
- eslint-plugin-prettier
- auth.ts
- nest-cli.json
- content-diff.ts
- AppController
- ApiBearerAuth
- InitialSchema1786340981613
- AddMcqQuiz1786436703834
- AddConceptDifficulty1786530225075
- AddAccountDeletionRequests1786630000000
- FixModuleConceptOrderIndexes1786740000000
- RestructureModuleScopedPrerequisites1786890000000
- AddSpacedRepetitionReview1786900000000
- AddAiGenerationLog1786950000000
- ExpandAiGenerationTypes1786960000000
- AddConceptContentReview1787000000000
- AddPasswordResetOtps1787100000000
- AddUserProfilePicture1787200000000
- Five Concepts Completed Badge
- axios
- RoadmapsService
- ai-generate.service.ts
- ApiOperation
- ApiResponse
- ai-jobs-provider.tsx
- AccountDeletionRequest
- CurrentUser
- backend/package.json
- class-transformer
- @nestjs/passport
- devDependencies
- AddOAuthColumns1787300000000
- globals
- @nestjs/platform-express
- @nestjs/cli
- ai-generate.module.ts
- AuthService
- prettier
- source-map-support
- supertest
- ts-jest
- ts-loader
- ts-node
- tsconfig-paths
- @types/express
- @types/jest
- @types/node
- @types/nodemailer
- @types/passport-jwt
- CourseConceptCard
- ApiTags
- typescript-eslint
- Controller
- Get
- frontend/eslint.config.mjs
- next.config.ts
- ResearchIngestion1788010000000
- react-hook-form
- react-markdown
- remark-gfm
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- tailwind.config.ts
- UseGuards
- Application Logo
- Injectable
- 10. Research ingestion / RAG (§8) — needs migration run (`ResearchIngestion`)
- UsersService
- pg
- eslint
- @types/bcrypt
- @types/passport-github2
- @types/passport-google-oauth20
- lucide-react
- ai-provider-clients.ts
- 3. Analytics (retargeted, §1)
- dependencies
- @nestjs/jwt
- @nestjs/typeorm
- eslint-config-prettier
- passport-google-oauth20
- InjectRepository
- ApiPropertyOptional
- IsOptional
- IsString
- IsOptional
- IsString
- MaxLength
- Column
- AddQaAnswerAiSupport1787500000000
- Entity
- JoinColumn
- ManyToOne
- OneToOne
- app.module.ts
- AiGenerateService
- QuizService
- .compileConcept
- .resolveCredentials
- ApiPropertyOptional
- 1. Roles (§1)
- AddAiGenerationJobs1787600000000
- reflect-metadata
- ai-generate.service.spec.ts
- 2. QA discussion (§12)
- rxjs
- profile/page.tsx
- jest
- @types/supertest
- CourseResearchService
- typescript
- Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing
- 6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run
- Session-learned rules (hard-won, do not re-learn the hard way)
- auth.service.ts
- CourseTerm
- CourseSourceChunk
- course-compiler.spec.ts
- course-research.service.ts
- RequestDeletionDto
- .attachConceptToModule
- UpdateModuleDto
- 7. Notifications (§7) — needs migration run
- PromptRegistry1787980000000
- AddAiJobRetryAndAck1787700000000
- CourseBible1787990000000
- ConceptCompilations1788000000000
- 0. Setup — three users
- .createModule
- 8. Articles (§6) — needs migration run
- 9. Course compiler (§8) — needs migration run (`ConceptCompilations`)
- ApiBearerAuth
- ApiOperation
- ApiResponse
- ApiTags
- Body
- Controller
- Get
- Param
- Post
- UseGuards
- ApiProperty
- ApiPropertyOptional
- IsArray
- IsNotEmpty
- IsOptional
- IsString
- IsUUID
- OneToMany
- research-seed.ts
- ResetPasswordDto
- .updateRoadmap
- .updateModuleConceptOrder
- ConceptMedia
- CreateRoadmapDto
- ConceptMedia1788020000000

## God Nodes (most connected - your core abstractions)
1. `User` - 175 edges
2. `CurrentUser` - 66 edges
3. `Concept` - 65 edges
4. `AiGenerateService` - 54 edges
5. `BaseEntity` - 50 edges
6. `Roadmap` - 44 edges
7. `McqQuestion` - 41 edges
8. `Module` - 40 edges
9. `UsersService` - 38 edges
10. `ModuleConcept` - 34 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `AppModule` --references--> `Module`  [EXTRACTED]
  backend/src/app.module.ts → backend/src/modules/content/entities/module.entity.ts
- `AnalyticsModule` --references--> `Module`  [EXTRACTED]
  backend/src/modules/analytics/analytics.module.ts → backend/src/modules/content/entities/module.entity.ts
- `AuthModule` --references--> `Module`  [EXTRACTED]
  backend/src/modules/auth/auth.module.ts → backend/src/modules/content/entities/module.entity.ts
- `ModuleConcept` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/content/entities/module-concept.entity.ts → backend/src/common/entities/base.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (207 total, 109 thin omitted)

### Community 0 - "UsersController"
Cohesion: 0.20
Nodes (13): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Delete, Get (+5 more)

### Community 1 - "user.entity.ts"
Cohesion: 0.12
Nodes (20): UserRole, slugify(), ROLES_KEY, RolesGuard, Injectable, ModuleConcept, Column, Entity (+12 more)

### Community 2 - "users.service.ts"
Cohesion: 0.12
Nodes (16): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength, GetUsersQueryDto, ApiPropertyOptional, IsEnum (+8 more)

### Community 3 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (33): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags (+25 more)

### Community 5 - "GamificationService"
Cohesion: 0.10
Nodes (17): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+9 more)

### Community 6 - "QaController"
Cohesion: 0.13
Nodes (19): CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn, IsNotEmpty, IsOptional, IsString, QaController (+11 more)

### Community 7 - "factories.ts"
Cohesion: 0.08
Nodes (46): ConceptDifficulty, ProgressStatus, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeConcept(), makeOption() (+38 more)

### Community 8 - "admin-commands.ts"
Cohesion: 0.06
Nodes (32): ADMIN_COMMANDS, analytics, article, ArticleItem, articles, dashboard, deletion, DeletionRequest (+24 more)

### Community 9 - "source:dev — Master Plan"
Cohesion: 0.10
Nodes (19): 0. Vision, 10. Updated build order (revised 2026-09-21 — backend-first, frontend-last), 11. Decision log (memory for future sessions/agents), 12. QA discussion model (revised 2026-09-21, supersedes §1 author-only draft), 1. Roles — collapsed from three to two, 2. Content ownership & reuse, 3. Publishing / review workflow, 4. Content labeling (AI-generated vs hand-written vs partial) (+11 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (18): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsModule, AssignmentsService, Injectable, InjectRepository (+10 more)

### Community 11 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "concept.entity.ts"
Cohesion: 0.16
Nodes (19): ConceptReviewStatus, makeUser(), McqAttempt, Column, Entity, JoinColumn, ManyToOne, McqOption (+11 more)

### Community 14 - "User"
Cohesion: 0.09
Nodes (28): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, IsNotEmpty, IsString, UpdateAnswerDto, IsNotEmpty (+20 more)

### Community 15 - "api-client.ts"
Cohesion: 0.11
Nodes (11): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, AiQuotaBadgeProps, apiClient, ConceptProgressInfo, ModuleConceptItem (+3 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "roadmap.entity.ts"
Cohesion: 0.23
Nodes (11): CourseEdgeType, CourseContextBudget, CourseContextResult, CourseContextScope, DEFAULT_BUDGET, CourseConceptEdge, Column, Entity (+3 more)

### Community 19 - "ai-generation-job.entity.ts"
Cohesion: 0.23
Nodes (10): AiGenerationJobStatus, AiGenerationJobType, AiGenerationJob, AiGenerationJobFailedItem, AiGenerationJobResultSummary, Column, Entity, Index (+2 more)

### Community 20 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, !**/*.spec.ts, **/*.(t|j)s

### Community 21 - "auth.module.ts"
Cohesion: 0.12
Nodes (10): AuthModule, IS_PUBLIC_KEY, JwtAuthGuard, Injectable, OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy (+2 more)

### Community 22 - "useSnackbar"
Cohesion: 0.11
Nodes (19): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminUsersDirectoryPage(), DeletionRequestItem, UserDirectoryItem (+11 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.18
Nodes (8): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards

### Community 25 - "typeorm.config.ts"
Cohesion: 0.12
Nodes (18): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, Assignment, Column, Entity (+10 more)

### Community 26 - "admin/layout.tsx"
Cohesion: 0.24
Nodes (7): ADMIN_NAV_ITEMS, AdminAppShellLayout(), LogoutConfirmationModal(), LogoutConfirmationModalProps, ProfileActionsMenu(), clearAuth(), clearUser()

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/swagger (+17 more)

### Community 28 - "ai-generating-modal.tsx"
Cohesion: 0.33
Nodes (4): AiGeneratingModalProps, AiGenerationContextType, CONTEXT_MESSAGES, CONTEXT_TITLES

### Community 29 - "AdminContentReviewController"
Cohesion: 0.14
Nodes (15): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+7 more)

### Community 30 - "auth.controller.ts"
Cohesion: 0.09
Nodes (20): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString, RegisterDto, ApiProperty, IsEmail (+12 more)

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, build, format, lint, research:seed, start, start:debug, start:dev (+11 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.22
Nodes (7): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider()

### Community 34 - "use-terminal-session.ts"
Cohesion: 0.15
Nodes (16): chunkEnd(), pageRows(), PagerState, PendingQuestion, PendingSelect, sleep(), SuggestMenu, SuggestRow (+8 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "ai-generate.controller.ts"
Cohesion: 0.12
Nodes (29): ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiResponse, ApiTags, AiGenerateController, AcknowledgeJobsDto (+21 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$ (+3 more)

### Community 38 - "research-text.util.ts"
Cohesion: 0.17
Nodes (12): chunkText(), cosineSimilarity(), estimateTokens(), htmlToText(), ngramSet(), normalizeForOverlap(), parseEmbedding(), RESEARCH_OVERLAP_CHARS (+4 more)

### Community 39 - "ai-prompt-registry.service.ts"
Cohesion: 0.19
Nodes (10): AiGenerationType, AiPromptStatus, AiPromptRegistry, ResolvedPrompt, Injectable, InjectRepository, AiPromptVersion, Column (+2 more)

### Community 40 - "forgot-password/page.tsx"
Cohesion: 0.20
Nodes (8): EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData, otpStepSchema, PasswordStepFormData, passwordStepSchema, ResetStep

### Community 41 - "RoadmapsController"
Cohesion: 0.17
Nodes (10): RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Delete, Get (+2 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "PasswordResetOtp"
Cohesion: 0.25
Nodes (7): InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne

### Community 45 - "Concept"
Cohesion: 0.16
Nodes (13): AnalyticsService, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, Injectable, InjectRepository, InjectRepository (+5 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 49 - "auth.ts"
Cohesion: 0.19
Nodes (14): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, ProfileActionsMenuProps (+6 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 52 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 69 - "ai-generate.service.ts"
Cohesion: 0.16
Nodes (29): AiQuotaStatus, AiQuotaTier, ParsedMcqOption, ParsedMcqQuestion, ResolvedAiCredentials, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), buildCritiqueUserPrompt() (+21 more)

### Community 72 - "ai-jobs-provider.tsx"
Cohesion: 0.14
Nodes (20): AiJobResultModal(), AiJobResultModalProps, JOB_TYPE_NOUN, AiJobResultsBanner(), jobSummaryLine(), jobVisual(), AiJobsIndicator(), JOB_TYPE_LABELS (+12 more)

### Community 73 - "AccountDeletionRequest"
Cohesion: 0.29
Nodes (6): AccountDeletionRequest, Column, Entity, JoinColumn, ManyToOne, InjectRepository

### Community 74 - "CurrentUser"
Cohesion: 0.20
Nodes (10): CurrentUser, ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get (+2 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/eslintrc, @eslint/js, @nestjs/schematics, @nestjs/testing, @eslint/eslintrc, @eslint/js, @nestjs/schematics (+1 more)

### Community 83 - "ai-generate.module.ts"
Cohesion: 0.15
Nodes (14): ContentModule, Module, Column, Entity, JoinColumn, ManyToOne, OneToMany, Roadmap (+6 more)

### Community 97 - "CourseConceptCard"
Cohesion: 0.14
Nodes (9): CourseContextService, Injectable, InjectRepository, CourseConceptCard, Column, Entity, JoinColumn, ManyToOne (+1 more)

### Community 117 - "10. Research ingestion / RAG (§8) — needs migration run (`ResearchIngestion`)"
Cohesion: 0.50
Nodes (4): 10.1 Seed lands in the corpus, 10.2 License gate, 10.3 Brief flows into scoped compiles, 10. Research ingestion / RAG (§8) — needs migration run (`ResearchIngestion`)

### Community 118 - "UsersService"
Cohesion: 0.13
Nodes (5): JwtPayload, JwtStrategy, Injectable, Injectable, UsersService

### Community 125 - "ai-provider-clients.ts"
Cohesion: 0.16
Nodes (14): AiProviderClients, CompletionOptions, CompletionResult, CURATED_MODELS, curatedModelsFor(), defaultEmbeddingModel(), defaultModelFor(), invalidKeyError() (+6 more)

### Community 126 - "3. Analytics (retargeted, §1)"
Cohesion: 0.50
Nodes (4): 3.1 Admin overview — developer counts, 3.2 Admin per-developer table (renamed route), 3.3 Developer my-analytics (renamed route, no approval check), 3. Analytics (retargeted, §1)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 145 - "app.module.ts"
Cohesion: 0.20
Nodes (9): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, GamificationModule, ProgressModule, QaModule, ReviewModule (+1 more)

### Community 146 - "AiGenerateService"
Cohesion: 0.22
Nodes (3): AiGenerateService, Injectable, isModelRetiredError()

### Community 147 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 148 - ".compileConcept"
Cohesion: 0.10
Nodes (26): asStringArray(), ConceptKeyTerm, ConceptLessonShape, ConceptOutline, CritiqueResult, DIFFICULTIES, extractDiagramRefs(), FactcheckResult (+18 more)

### Community 149 - ".resolveCredentials"
Cohesion: 0.23
Nodes (8): COURSE_TASK_KEYS, CourseTaskKey, isCourseTaskKey(), resolveTierModel(), TASK_ROUTES, TaskModelTier, TaskRoute, taskRouteFor()

### Community 151 - "1. Roles (§1)"
Cohesion: 0.14
Nodes (14): 1.10 Reject-roadmap and unpublish, 1.11 Draft/live split on published concepts (§3.8), 1.12 Detach blocked on published, delete-concept guard (§3.8), 1.13 Unpublish request flow + scheduled deletion (§3.8), 1.1 Profile has no instructor baggage, 1.2 Old instructor endpoints are gone (all as `ADMIN`), 1.3 Admin user list — role filter only, 1.4 Author roadmap + 3 modules + 9 concepts, attach (§2) (+6 more)

### Community 154 - "ai-generate.service.spec.ts"
Cohesion: 0.15
Nodes (11): AiGenerationLog, Column, Entity, JoinColumn, ManyToOne, ConceptCompilation, Column, Entity (+3 more)

### Community 155 - "2. QA discussion (§12)"
Cohesion: 0.18
Nodes (11): 2.10 Answer edit/delete by author, 2.1 Post a public discussion question (as B), 2.2 Ask AI — private answer (as B), 2.3 Old target value rejected, 2.4 Discussion list — AI privacy per viewer, 2.5 Any developer can answer — author/admin auto-verified (as A answers B's question), 2.6 Verify — for other developers' answers, 2.7 AI answers cannot be verified (+3 more)

### Community 157 - "profile/page.tsx"
Cohesion: 0.24
Nodes (8): RootPage(), BasicInfoFormData, basicInfoSchema, ChangePasswordFormData, changePasswordSchema, ProfilePage(), TIMEZONE_OPTIONS, getToken()

### Community 160 - "CourseResearchService"
Cohesion: 0.20
Nodes (4): InjectRepository, CourseResearchService, Injectable, InjectRepository

### Community 162 - "Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing"
Cohesion: 0.25
Nodes (7): 4.1 Labels on reads, 4.2 Reader filters, 4.3 Shell browsers (as `B` in `/developer/terminal`), 4. AI-generate guard (§1), 5.1 Developer can check quota, 5. AI-generate guard (§1), Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing

### Community 163 - "6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run"
Cohesion: 0.25
Nodes (8): 6.1 Store keys (max 2, first auto-default), 6.2 Default + cap, 6.2b Model dropdown flow (pre-save lookup + per-key default), 6.3 Providers + live models, 6.4 Free tier is 5/day, own key uses its bucket, 6.5 gemini without a key is rejected, 6.6 In-use deletion lock, 6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run

### Community 164 - "Session-learned rules (hard-won, do not re-learn the hard way)"
Cohesion: 0.29
Nodes (6): Backend conventions (NestJS + TypeORM, no cron/scheduler), Next.js server/client boundary, Session-learned rules (hard-won, do not re-learn the hard way), Terminal registry, User preferences, Verification bar

### Community 165 - "auth.service.ts"
Cohesion: 0.13
Nodes (12): NOW, ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail (+4 more)

### Community 166 - "CourseTerm"
Cohesion: 0.18
Nodes (9): CourseContextBuilder, Injectable, InjectRepository, CourseTerm, Column, Entity, JoinColumn, ManyToOne (+1 more)

### Community 167 - "CourseSourceChunk"
Cohesion: 0.17
Nodes (12): CourseSourceChunk, Column, Entity, JoinColumn, ManyToOne, CourseSource, Column, Entity (+4 more)

### Community 168 - "course-compiler.spec.ts"
Cohesion: 0.27
Nodes (4): createMockQueryBuilder(), createMockRepository(), MockRepository, OUTLINE

### Community 169 - "course-research.service.ts"
Cohesion: 0.22
Nodes (8): IngestResult, OER_SEED_SOURCE, RESEARCH_GROUNDING_MODE, RESEARCH_LICENSE_ALLOWLIST, RESEARCH_TOP_K, RetrievedChunk, VideoResult, RESEARCH_CHUNK_CHARS

### Community 170 - "RequestDeletionDto"
Cohesion: 0.22
Nodes (7): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength, Body, Post

### Community 171 - ".attachConceptToModule"
Cohesion: 0.28
Nodes (5): AddModulePrerequisiteDto, ApiProperty, IsUUID, Body, Post

### Community 172 - "UpdateModuleDto"
Cohesion: 0.25
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 173 - "7. Notifications (§7) — needs migration run"
Cohesion: 0.40
Nodes (5): 7.1 Bell badge + list + filter, 7.2 Author decisions carry reasons, 7.3 Read state, 7.4 Moderation + AI jobs, 7. Notifications (§7) — needs migration run

### Community 178 - "0. Setup — three users"
Cohesion: 0.50
Nodes (4): 0.1 Register developer A (future content author), 0.2 Register developer B (other developer), 0.3 Promote yourself to admin (no seed exists — do it in SQL), 0. Setup — three users

### Community 179 - ".createModule"
Cohesion: 0.29
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 180 - "8. Articles (§6) — needs migration run"
Cohesion: 0.50
Nodes (4): 8.1 Public reads, no login (drop the token and try), 8.2 Immediate publish + edit by author, 8.3 Deletion paths, 8. Articles (§6) — needs migration run

### Community 181 - "9. Course compiler (§8) — needs migration run (`ConceptCompilations`)"
Cohesion: 0.50
Nodes (4): 9.1 Single-shot path runs the pipeline, 9.2 Batch module-concepts job compiles per concept, 9.3 Internal stages cost no quota, 9. Course compiler (§8) — needs migration run (`ConceptCompilations`)

### Community 200 - "research-seed.ts"
Cohesion: 0.43
Nodes (5): getTypeOrmConfig(), ensureVarFromFiles(), loadEnv(), main(), REQUIRED_ENV

### Community 201 - "ResetPasswordDto"
Cohesion: 0.29
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 202 - ".updateRoadmap"
Cohesion: 0.29
Nodes (5): IsNotEmpty, IsOptional, IsString, UpdateRoadmapDto, Patch

### Community 203 - ".updateModuleConceptOrder"
Cohesion: 0.40
Nodes (3): IsInt, Min, UpdateModuleConceptDto

### Community 204 - "ConceptMedia"
Cohesion: 0.40
Nodes (5): ConceptMedia, Column, Entity, JoinColumn, ManyToOne

### Community 205 - "CreateRoadmapDto"
Cohesion: 0.40
Nodes (4): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString

## Knowledge Gaps
- **414 isolated node(s):** `entities`, `dataSourceOptions`, `ParsedMcqOption`, `ParsedMcqQuestion`, `AiQuotaTier` (+409 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **109 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersController`, `user.entity.ts`, `users.service.ts`, `ReviewService`, `ConceptsService`, `GamificationService`, `QaController`, `factories.ts`, `assignments.module.ts`, `concept.entity.ts`, `AuthController`, `roadmap.entity.ts`, `ai-generation-job.entity.ts`, `QuizService`, `auth.module.ts`, `typeorm.config.ts`, `AdminContentReviewController`, `auth.controller.ts`, `ai-generate.controller.ts`, `auth.service.ts`, `RoadmapsController`, `RequestDeletionDto`, `.attachConceptToModule`, `PasswordResetOtp`, `Concept`, `UpdateModuleDto`, `.createModule`, `RoadmapsService`, `ai-generate.service.ts`, `AccountDeletionRequest`, `.updateRoadmap`, `.updateModuleConceptOrder`, `CurrentUser`, `AuthService`, `UsersService`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `AiGenerateService` connect `AiGenerateService` to `CourseResearchService`, `ai-generate.controller.ts`, `ai-generate.service.ts`, `course-compiler.spec.ts`, `User`, `ai-generate.module.ts`, `.compileConcept`, `.resolveCredentials`, `ai-generate.service.spec.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `UsersController`, `user.entity.ts`, `users.service.ts`, `ReviewService`, `ConceptsService`, `GamificationService`, `QaController`, `factories.ts`, `User`, `AuthController`, `QuizService`, `AdminContentReviewController`, `auth.controller.ts`, `ai-generate.controller.ts`, `RoadmapsController`, `RequestDeletionDto`, `.attachConceptToModule`, `UpdateModuleDto`, `.createModule`, `.updateRoadmap`, `.updateModuleConceptOrder`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `entities`, `dataSourceOptions`, `ParsedMcqOption` to the rest of the system?**
  _414 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `user.entity.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11829268292682926 - nodes in this community are weakly interconnected._
- **Should `users.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._