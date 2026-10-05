# Graph Report - knowledge_is_power  (2026-10-05)

## Corpus Check
- 332 files · ~298,234 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1918 nodes · 4416 edges · 192 communities (84 shown, 108 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 133 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `290c3e30`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersController
- Module
- user.entity.ts
- ReviewService
- ConceptsService
- GetActivityQueryDto
- qa.service.ts
- factories.ts
- admin-commands.ts
- source:dev — Master Plan
- assignments.module.ts
- roadmaps.controller.ts
- Added
- typeorm.config.ts
- Concept
- api-client.ts
- compilerOptions
- AuthController
- ai-generate.module.ts
- ai-generation-job.entity.ts
- collectCoverageFrom
- OAuthProfile
- useSnackbar
- compilerOptions
- AnalyticsController
- gamification.service.ts
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
- AiGenerateController
- jest
- SubmitAttemptDto
- ai-prompt-registry.service.ts
- forgot-password/page.tsx
- CurrentUser
- Next.js Frontend Application
- frontend/package.json
- PasswordResetOtp
- CreateQuestionDto
- terminal/page.tsx
- exclude
- eslint-plugin-prettier
- auth.ts
- nest-cli.json
- content-diff.ts
- Public
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
- User
- ai-generate.service.ts
- ApiOperation
- ApiResponse
- ai-jobs-provider.tsx
- AccountDeletionRequest
- ProgressService
- backend/package.json
- class-transformer
- @nestjs/passport
- devDependencies
- AddOAuthColumns1787300000000
- globals
- @nestjs/platform-express
- @nestjs/cli
- LinkOAuthDto
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
- UpdateOptionDto
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
- course-research.service.ts
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
- UpdateQuestionDto
- AiGenerateService
- QuizController
- compiler-stages.ts
- .resolveCredentials
- ApiPropertyOptional
- 1. Roles (§1)
- AddAiGenerationJobs1787600000000
- reflect-metadata
- QuizService
- 2. QA discussion (§12)
- rxjs
- profile/page.tsx
- jest
- @types/supertest
- ChangePasswordDto
- typescript
- Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing
- 6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run
- Session-learned rules (hard-won, do not re-learn the hard way)
- .forgotPassword
- 7. Notifications (§7) — needs migration run
- PromptRegistry1787980000000
- AddAiJobRetryAndAck1787700000000
- CourseBible1787990000000
- ConceptCompilations1788000000000
- 0. Setup — three users
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

## God Nodes (most connected - your core abstractions)
1. `User` - 175 edges
2. `CurrentUser` - 66 edges
3. `Concept` - 64 edges
4. `AiGenerateService` - 54 edges
5. `BaseEntity` - 49 edges
6. `Roadmap` - 44 edges
7. `McqQuestion` - 41 edges
8. `Module` - 40 edges
9. `UsersService` - 38 edges
10. `ModuleConcept` - 34 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `IngestResult` --references--> `CourseSource`  [EXTRACTED]
  backend/src/modules/ai-generate/course-research.service.ts → backend/src/modules/ai-generate/entities/course-source.entity.ts
- `AssignmentsModule` --references--> `Module`  [EXTRACTED]
  backend/src/modules/assignments/assignments.module.ts → backend/src/modules/content/entities/module.entity.ts
- `Module` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/content/entities/module.entity.ts → backend/src/common/entities/base.entity.ts
- `Module` --references--> `Roadmap`  [EXTRACTED]
  backend/src/modules/content/entities/module.entity.ts → backend/src/modules/content/entities/roadmap.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (192 total, 108 thin omitted)

### Community 0 - "UsersController"
Cohesion: 0.19
Nodes (15): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+7 more)

### Community 1 - "Module"
Cohesion: 0.08
Nodes (34): AppModule, slugify(), typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AuthModule, ContentModule, ModuleConcept (+26 more)

### Community 2 - "user.entity.ts"
Cohesion: 0.11
Nodes (19): UserRole, ROLES_KEY, JwtAuthGuard, Injectable, RolesGuard, Injectable, JwtPayload, GetUsersQueryDto (+11 more)

### Community 3 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (33): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags (+25 more)

### Community 5 - "GetActivityQueryDto"
Cohesion: 0.12
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 6 - "qa.service.ts"
Cohesion: 0.08
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+23 more)

### Community 7 - "factories.ts"
Cohesion: 0.15
Nodes (25): ConceptDifficulty, ConceptReviewStatus, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeConcept(), makeOption() (+17 more)

### Community 8 - "admin-commands.ts"
Cohesion: 0.06
Nodes (32): ADMIN_COMMANDS, analytics, article, ArticleItem, articles, dashboard, deletion, DeletionRequest (+24 more)

### Community 9 - "source:dev — Master Plan"
Cohesion: 0.10
Nodes (19): 0. Vision, 10. Updated build order (revised 2026-09-21 — backend-first, frontend-last), 11. Decision log (memory for future sessions/agents), 12. QA discussion model (revised 2026-09-21, supersedes §1 author-only draft), 1. Roles — collapsed from three to two, 2. Content ownership & reuse, 3. Publishing / review workflow, 4. Content labeling (AI-generated vs hand-written vs partial) (+11 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (23): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsModule, AssignmentsService, Injectable, InjectRepository (+15 more)

### Community 11 - "roadmaps.controller.ts"
Cohesion: 0.06
Nodes (32): AddModulePrerequisiteDto, ApiProperty, IsUUID, AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional (+24 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "typeorm.config.ts"
Cohesion: 0.10
Nodes (30): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, McqAttempt, Column, Entity (+22 more)

### Community 14 - "Concept"
Cohesion: 0.09
Nodes (28): ProgressStatus, AnalyticsService, Injectable, InjectRepository, InjectRepository, Concept, Column, Entity (+20 more)

### Community 15 - "api-client.ts"
Cohesion: 0.11
Nodes (11): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, AiQuotaBadgeProps, apiClient, ConceptProgressInfo, ModuleConceptItem (+3 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.18
Nodes (13): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+5 more)

### Community 18 - "ai-generate.module.ts"
Cohesion: 0.07
Nodes (46): CourseEdgeType, OUTLINE, CourseContextBudget, CourseContextBuilder, CourseContextResult, CourseContextScope, DEFAULT_BUDGET, Injectable (+38 more)

### Community 19 - "ai-generation-job.entity.ts"
Cohesion: 0.23
Nodes (10): AiGenerationJobStatus, AiGenerationJobType, AiGenerationJob, AiGenerationJobFailedItem, AiGenerationJobResultSummary, Column, Entity, Index (+2 more)

### Community 20 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, !**/*.spec.ts, **/*.(t|j)s

### Community 21 - "OAuthProfile"
Cohesion: 0.20
Nodes (5): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable

### Community 22 - "useSnackbar"
Cohesion: 0.11
Nodes (19): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminUsersDirectoryPage(), DeletionRequestItem, UserDirectoryItem (+11 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (12): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+4 more)

### Community 25 - "gamification.service.ts"
Cohesion: 0.12
Nodes (20): Badge, Column, Entity, Streak, Column, CreateDateColumn, Entity, JoinColumn (+12 more)

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
Nodes (24): LoginDto, ApiProperty, IsEmail, IsString, RegisterDto, ApiProperty, IsEmail, IsNotEmpty (+16 more)

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

### Community 36 - "AiGenerateController"
Cohesion: 0.13
Nodes (29): ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiResponse, ApiTags, AiGenerateController, AcknowledgeJobsDto (+21 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$ (+3 more)

### Community 38 - "SubmitAttemptDto"
Cohesion: 0.29
Nodes (3): SubmitAttemptDto, ApiProperty, IsUUID

### Community 39 - "ai-prompt-registry.service.ts"
Cohesion: 0.14
Nodes (15): AiGenerationType, AiPromptStatus, AiPromptRegistry, ResolvedPrompt, Injectable, InjectRepository, CONCEPT_CONTENT_SYSTEM_PROMPT, CONCEPT_MCQ_SYSTEM_PROMPT (+7 more)

### Community 40 - "forgot-password/page.tsx"
Cohesion: 0.20
Nodes (8): EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData, otpStepSchema, PasswordStepFormData, passwordStepSchema, ResetStep

### Community 41 - "CurrentUser"
Cohesion: 0.25
Nodes (14): CurrentUser, RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+6 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "PasswordResetOtp"
Cohesion: 0.14
Nodes (10): InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne, EmailModule (+2 more)

### Community 45 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 49 - "auth.ts"
Cohesion: 0.19
Nodes (14): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, ProfileActionsMenuProps (+6 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 52 - "Public"
Cohesion: 0.19
Nodes (9): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable, IS_PUBLIC_KEY (+1 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 68 - "User"
Cohesion: 0.17
Nodes (6): RoadmapsService, Injectable, Column, Entity, OneToOne, User

### Community 69 - "ai-generate.service.ts"
Cohesion: 0.19
Nodes (24): AiQuotaStatus, AiQuotaTier, ParsedMcqOption, ParsedMcqQuestion, ResolvedAiCredentials, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), buildCritiqueUserPrompt() (+16 more)

### Community 72 - "ai-jobs-provider.tsx"
Cohesion: 0.14
Nodes (20): AiJobResultModal(), AiJobResultModalProps, JOB_TYPE_NOUN, AiJobResultsBanner(), jobSummaryLine(), jobVisual(), AiJobsIndicator(), JOB_TYPE_LABELS (+12 more)

### Community 73 - "AccountDeletionRequest"
Cohesion: 0.29
Nodes (6): AccountDeletionRequest, Column, Entity, JoinColumn, ManyToOne, InjectRepository

### Community 74 - "ProgressService"
Cohesion: 0.13
Nodes (12): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+4 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/eslintrc, @eslint/js, @nestjs/schematics, @nestjs/testing, @eslint/eslintrc, @eslint/js, @nestjs/schematics (+1 more)

### Community 83 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString

### Community 97 - "UpdateOptionDto"
Cohesion: 0.33
Nodes (5): IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto

### Community 117 - "10. Research ingestion / RAG (§8) — needs migration run (`ResearchIngestion`)"
Cohesion: 0.50
Nodes (4): 10.1 Seed lands in the corpus, 10.2 License gate, 10.3 Brief flows into scoped compiles, 10. Research ingestion / RAG (§8) — needs migration run (`ResearchIngestion`)

### Community 118 - "UsersService"
Cohesion: 0.09
Nodes (9): JwtStrategy, Injectable, RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength, Injectable (+1 more)

### Community 125 - "course-research.service.ts"
Cohesion: 0.05
Nodes (51): getTypeOrmConfig(), InjectRepository, AiProviderClients, CompletionOptions, CompletionResult, CURATED_MODELS, curatedModelsFor(), defaultEmbeddingModel() (+43 more)

### Community 126 - "3. Analytics (retargeted, §1)"
Cohesion: 0.50
Nodes (4): 3.1 Admin overview — developer counts, 3.2 Admin per-developer table (renamed route), 3.3 Developer my-analytics (renamed route, no approval check), 3. Analytics (retargeted, §1)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 145 - "UpdateQuestionDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateQuestionDto

### Community 146 - "AiGenerateService"
Cohesion: 0.17
Nodes (3): AiGenerateService, Injectable, isModelRetiredError()

### Community 147 - "QuizController"
Cohesion: 0.21
Nodes (12): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 148 - "compiler-stages.ts"
Cohesion: 0.18
Nodes (16): asStringArray(), ConceptKeyTerm, ConceptLessonShape, ConceptOutline, CritiqueResult, DIFFICULTIES, FactcheckResult, LESSON_SHAPE_KEYS (+8 more)

### Community 149 - ".resolveCredentials"
Cohesion: 0.24
Nodes (8): COURSE_TASK_KEYS, CourseTaskKey, isCourseTaskKey(), resolveTierModel(), TASK_ROUTES, TaskModelTier, TaskRoute, taskRouteFor()

### Community 151 - "1. Roles (§1)"
Cohesion: 0.14
Nodes (14): 1.10 Reject-roadmap and unpublish, 1.11 Draft/live split on published concepts (§3.8), 1.12 Detach blocked on published, delete-concept guard (§3.8), 1.13 Unpublish request flow + scheduled deletion (§3.8), 1.1 Profile has no instructor baggage, 1.2 Old instructor endpoints are gone (all as `ADMIN`), 1.3 Admin user list — role filter only, 1.4 Author roadmap + 3 modules + 9 concepts, attach (§2) (+6 more)

### Community 155 - "2. QA discussion (§12)"
Cohesion: 0.18
Nodes (11): 2.10 Answer edit/delete by author, 2.1 Post a public discussion question (as B), 2.2 Ask AI — private answer (as B), 2.3 Old target value rejected, 2.4 Discussion list — AI privacy per viewer, 2.5 Any developer can answer — author/admin auto-verified (as A answers B's question), 2.6 Verify — for other developers' answers, 2.7 AI answers cannot be verified (+3 more)

### Community 157 - "profile/page.tsx"
Cohesion: 0.24
Nodes (8): RootPage(), BasicInfoFormData, basicInfoSchema, ChangePasswordFormData, changePasswordSchema, ProfilePage(), TIMEZONE_OPTIONS, getToken()

### Community 160 - "ChangePasswordDto"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 162 - "Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing"
Cohesion: 0.25
Nodes (7): 4.1 Labels on reads, 4.2 Reader filters, 4.3 Shell browsers (as `B` in `/developer/terminal`), 4. AI-generate guard (§1), 5.1 Developer can check quota, 5. AI-generate guard (§1), Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing

### Community 163 - "6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run"
Cohesion: 0.25
Nodes (8): 6.1 Store keys (max 2, first auto-default), 6.2 Default + cap, 6.2b Model dropdown flow (pre-save lookup + per-key default), 6.3 Providers + live models, 6.4 Free tier is 5/day, own key uses its bucket, 6.5 gemini without a key is rejected, 6.6 In-use deletion lock, 6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run

### Community 164 - "Session-learned rules (hard-won, do not re-learn the hard way)"
Cohesion: 0.29
Nodes (6): Backend conventions (NestJS + TypeORM, no cron/scheduler), Next.js server/client boundary, Session-learned rules (hard-won, do not re-learn the hard way), Terminal registry, User preferences, Verification bar

### Community 165 - ".forgotPassword"
Cohesion: 0.33
Nodes (4): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty

### Community 173 - "7. Notifications (§7) — needs migration run"
Cohesion: 0.40
Nodes (5): 7.1 Bell badge + list + filter, 7.2 Author decisions carry reasons, 7.3 Read state, 7.4 Moderation + AI jobs, 7. Notifications (§7) — needs migration run

### Community 178 - "0. Setup — three users"
Cohesion: 0.50
Nodes (4): 0.1 Register developer A (future content author), 0.2 Register developer B (other developer), 0.3 Promote yourself to admin (no seed exists — do it in SQL), 0. Setup — three users

### Community 180 - "8. Articles (§6) — needs migration run"
Cohesion: 0.50
Nodes (4): 8.1 Public reads, no login (drop the token and try), 8.2 Immediate publish + edit by author, 8.3 Deletion paths, 8. Articles (§6) — needs migration run

### Community 181 - "9. Course compiler (§8) — needs migration run (`ConceptCompilations`)"
Cohesion: 0.50
Nodes (4): 9.1 Single-shot path runs the pipeline, 9.2 Batch module-concepts job compiles per concept, 9.3 Internal stages cost no quota, 9. Course compiler (§8) — needs migration run (`ConceptCompilations`)

## Knowledge Gaps
- **407 isolated node(s):** `name`, `version`, `description`, `author`, `private` (+402 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **108 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersController`, `Module`, `user.entity.ts`, `ReviewService`, `ConceptsService`, `GetActivityQueryDto`, `qa.service.ts`, `factories.ts`, `assignments.module.ts`, `roadmaps.controller.ts`, `typeorm.config.ts`, `Concept`, `AuthController`, `ai-generate.module.ts`, `ai-generation-job.entity.ts`, `QuizController`, `gamification.service.ts`, `QuizService`, `AdminContentReviewController`, `auth.controller.ts`, `SubmitAttemptDto`, `CurrentUser`, `PasswordResetOtp`, `ai-generate.service.ts`, `AccountDeletionRequest`, `ProgressService`, `AuthService`, `UsersService`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Why does `AiGenerateService` connect `AiGenerateService` to `user.entity.ts`, `AiGenerateController`, `ai-generate.service.ts`, `User`, `qa.service.ts`, `factories.ts`, `Concept`, `ai-generate.module.ts`, `.resolveCredentials`, `course-research.service.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `Module`, `user.entity.ts`, `ConceptsService`, `ai-generate.service.ts`, `User`, `factories.ts`, `qa.service.ts`, `assignments.module.ts`, `typeorm.config.ts`, `ai-generate.module.ts`, `gamification.service.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _407 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Module` be split into smaller, more focused modules?**
  _Cohesion score 0.0815686274509804 - nodes in this community are weakly interconnected._
- **Should `user.entity.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10545790934320073 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._