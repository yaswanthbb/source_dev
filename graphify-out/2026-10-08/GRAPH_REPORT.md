# Graph Report - knowledge_is_power  (2026-10-08)

## Corpus Check
- 350 files · ~313,094 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2114 nodes · 4813 edges · 215 communities (100 shown, 115 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5e1c677f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersController
- Concept
- users.service.ts
- ReviewService
- ConceptsController
- GetActivityQueryDto
- factories.ts
- User
- admin-commands.ts
- source:dev — Master Plan
- assignments.module.ts
- AttachConceptDto
- Added
- typeorm.config.ts
- qa.service.ts
- api-client.ts
- compilerOptions
- AuthController
- course-compiler.spec.ts
- AiGenerationJob
- collectCoverageFrom
- auth.module.ts
- useSnackbar
- compilerOptions
- AnalyticsController
- McqQuestion
- auth.ts
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
- learning-commands.ts
- stage-prompts.spec.ts
- forgot-password/page.tsx
- CurrentUser
- Next.js Frontend Application
- frontend/package.json
- compiler-stages.ts
- analytics.service.spec.ts
- terminal/page.tsx
- exclude
- eslint-plugin-prettier
- register/page.tsx
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
- ai-provider-clients.ts
- ai-generate.service.ts
- ApiOperation
- ApiResponse
- ai-jobs-provider.tsx
- authoring.test.mjs
- ProgressController
- backend/package.json
- class-transformer
- @nestjs/passport
- devDependencies
- AddOAuthColumns1787300000000
- globals
- @nestjs/platform-express
- @nestjs/cli
- CourseResearchService
- auth.service.ts
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
- assessment.ts
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
- Module
- AiGenerateService
- CreateQuestionDto
- VerifyOtpDto
- assessment-service.spec.ts
- ApiPropertyOptional
- 1. Roles (§1)
- AddAiGenerationJobs1787600000000
- reflect-metadata
- QuizController
- 2. QA discussion (§12)
- rxjs
- profile/page.tsx
- jest
- @types/supertest
- QaController
- typescript
- Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing
- 6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run
- Session-learned rules (hard-won, do not re-learn the hard way)
- AuthService
- askQuestion
- CourseSourceChunk
- use-roadmap-progress.ts
- StagePromptTasks1788030000000
- RequestDeletionDto
- UserRole
- UpdateModuleDto
- 7. Notifications (§7) — needs migration run
- PromptRegistry1787980000000
- AddAiJobRetryAndAck1787700000000
- CourseBible1787990000000
- ConceptCompilations1788000000000
- 0. Setup — three users
- StagePromptSeeds1788040000000
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
- OAuthProfile
- ApiPropertyOptional
- .githubAuthCallback
- ResetPasswordDto
- CreateModuleDto
- Assessment factory rollout and verification
- IsUUID
- OneToMany
- printThread
- ApiProperty
- research-seed.ts
- showConcept
- IsBoolean
- Type
- ConceptMedia1788020000000
- cwdRoadmapId
- OneToMany
- Injectable
- InjectRepository
- IsArray
- IsNotEmpty
- IsOptional
- IsString

## God Nodes (most connected - your core abstractions)
1. `User` - 166 edges
2. `CurrentUser` - 66 edges
3. `Concept` - 64 edges
4. `AiGenerateService` - 57 edges
5. `BaseEntity` - 48 edges
6. `Roadmap` - 45 edges
7. `McqQuestion` - 40 edges
8. `Module` - 40 edges
9. `UsersService` - 38 edges
10. `ModuleConcept` - 35 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `harness()` --calls--> `makeUser()`  [EXTRACTED]
  backend/src/modules/ai-generate/assessment-service.spec.ts → backend/src/common/testing/factories.ts
- `harness()` --calls--> `createMockRepository()`  [EXTRACTED]
  backend/src/modules/ai-generate/assessment-service.spec.ts → backend/src/common/testing/mock-repository.ts
- `render()` --calls--> `buildAssessmentUserPrompt()`  [EXTRACTED]
  backend/src/modules/ai-generate/golden.spec.ts → backend/src/modules/ai-generate/constants/assessment-prompts.ts
- `ReviewItem` --references--> `McqQuestion`  [EXTRACTED]
  backend/src/modules/review/entities/review-item.entity.ts → backend/src/modules/quiz/entities/mcq-question.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (215 total, 115 thin omitted)

### Community 0 - "UsersController"
Cohesion: 0.20
Nodes (14): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+6 more)

### Community 1 - "Concept"
Cohesion: 0.12
Nodes (25): ConceptReviewStatus, InjectRepository, ConceptsService, Injectable, InjectRepository, Concept, Column, Entity (+17 more)

### Community 2 - "users.service.ts"
Cohesion: 0.13
Nodes (16): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength, GetUsersQueryDto, ApiPropertyOptional, IsEnum (+8 more)

### Community 3 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 4 - "ConceptsController"
Cohesion: 0.06
Nodes (31): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), slugify(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+23 more)

### Community 5 - "GetActivityQueryDto"
Cohesion: 0.12
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 6 - "factories.ts"
Cohesion: 0.07
Nodes (43): ConceptDifficulty, XpSource, FIXED_DATE, makeBadge(), makeOption(), makeQuestion(), makeReviewItem(), makeStreak() (+35 more)

### Community 7 - "User"
Cohesion: 0.13
Nodes (8): RoadmapsService, Injectable, QaService, Injectable, Column, Entity, OneToOne, User

### Community 8 - "admin-commands.ts"
Cohesion: 0.06
Nodes (32): ADMIN_COMMANDS, analytics, article, ArticleItem, articles, dashboard, deletion, DeletionRequest (+24 more)

### Community 9 - "source:dev — Master Plan"
Cohesion: 0.10
Nodes (19): 0. Vision, 10. Updated build order (revised 2026-09-21 — backend-first, frontend-last), 11. Decision log (memory for future sessions/agents), 12. QA discussion model (revised 2026-09-21, supersedes §1 author-only draft), 1. Roles — collapsed from three to two, 2. Content ownership & reuse, 3. Publishing / review workflow, 4. Content labeling (AI-generated vs hand-written vs partial) (+11 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "typeorm.config.ts"
Cohesion: 0.14
Nodes (18): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, Answer, Column, Entity (+10 more)

### Community 14 - "qa.service.ts"
Cohesion: 0.13
Nodes (17): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+9 more)

### Community 15 - "api-client.ts"
Cohesion: 0.14
Nodes (10): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, LoginFormData, loginSchema, AiQuotaBadgeProps, DeletionRequestInfo (+2 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.26
Nodes (9): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Patch (+1 more)

### Community 18 - "course-compiler.spec.ts"
Cohesion: 0.07
Nodes (41): CourseEdgeType, OUTLINE, CourseContextBudget, CourseContextBuilder, CourseContextResult, CourseContextScope, DEFAULT_BUDGET, Injectable (+33 more)

### Community 19 - "AiGenerationJob"
Cohesion: 0.25
Nodes (8): AiGenerationJobStatus, AiGenerationJobType, AiGenerationJob, Column, Entity, Index, JoinColumn, ManyToOne

### Community 20 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, !**/*.spec.ts, **/*.(t|j)s

### Community 21 - "auth.module.ts"
Cohesion: 0.14
Nodes (10): JwtPayload, JwtStrategy, Injectable, AccountDeletionRequest, Column, Entity, JoinColumn, ManyToOne (+2 more)

### Community 22 - "useSnackbar"
Cohesion: 0.13
Nodes (16): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminUsersDirectoryPage(), DeletionRequestItem, UserDirectoryItem (+8 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (12): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+4 more)

### Community 25 - "McqQuestion"
Cohesion: 0.09
Nodes (21): InjectRepository, McqAttempt, Column, Entity, JoinColumn, ManyToOne, McqOption, Column (+13 more)

### Community 26 - "auth.ts"
Cohesion: 0.17
Nodes (13): ADMIN_NAV_ITEMS, AdminAppShellLayout(), LogoutConfirmationModal(), LogoutConfirmationModalProps, ProfileActionsMenu(), ProfileActionsMenuProps, RequestDeletionModal(), AUTH_CHANGED_EVENT (+5 more)

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
Cohesion: 0.14
Nodes (13): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString, LoginDto, ApiProperty, IsEmail (+5 more)

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
Cohesion: 0.10
Nodes (32): ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiResponse, ApiTags, AiGenerateController, AcknowledgeJobsDto, AiGenerationOptions (+24 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$ (+3 more)

### Community 38 - "learning-commands.ts"
Cohesion: 0.05
Nodes (38): article, articles, ArticleSummary, attach, AttemptResult, AUTHOR_COMMANDS, complete, ConceptDetail (+30 more)

### Community 39 - "stage-prompts.spec.ts"
Cohesion: 0.10
Nodes (19): AiGenerationType, AiPromptStatus, AiPromptRegistry, Injectable, InjectRepository, AiGenerationLog, Column, Entity (+11 more)

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

### Community 44 - "compiler-stages.ts"
Cohesion: 0.10
Nodes (29): asStringArray(), ConceptKeyTerm, ConceptLessonShape, ConceptOutline, CritiqueResult, DIFFICULTIES, extractDiagramRefs(), FactcheckResult (+21 more)

### Community 45 - "analytics.service.spec.ts"
Cohesion: 0.14
Nodes (20): ProgressStatus, makeAttempt(), makeConcept(), makeProgress(), makeUser(), createMockQueryBuilder(), createMockRepository(), MockRepository (+12 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 49 - "register/page.tsx"
Cohesion: 0.33
Nodes (7): CallbackHandler(), LoginPage(), RegisterFormData, RegisterPage(), registerSchema, setToken(), setUser()

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 52 - "Public"
Cohesion: 0.23
Nodes (8): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable, Public()

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 68 - "ai-provider-clients.ts"
Cohesion: 0.16
Nodes (14): AiProviderClients, CompletionOptions, CompletionResult, CURATED_MODELS, curatedModelsFor(), defaultEmbeddingModel(), defaultModelFor(), invalidKeyError() (+6 more)

### Community 69 - "ai-generate.service.ts"
Cohesion: 0.15
Nodes (31): AiQuotaStatus, AiQuotaTier, ParsedMcqOption, ParsedMcqQuestion, ResolvedPrompt, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), buildCritiqueUserPrompt() (+23 more)

### Community 72 - "ai-jobs-provider.tsx"
Cohesion: 0.14
Nodes (20): AiJobResultModal(), AiJobResultModalProps, JOB_TYPE_NOUN, AiJobResultsBanner(), jobSummaryLine(), jobVisual(), AiJobsIndicator(), JOB_TYPE_LABELS (+12 more)

### Community 73 - "authoring.test.mjs"
Cohesion: 0.13
Nodes (10): calls, commands, CON, DB, __dirname, EXTERNAL, { installGlyphs }, loaded (+2 more)

### Community 74 - "ProgressController"
Cohesion: 0.19
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/eslintrc, @eslint/js, @nestjs/schematics, @nestjs/testing, @eslint/eslintrc, @eslint/js, @nestjs/schematics (+1 more)

### Community 83 - "CourseResearchService"
Cohesion: 0.22
Nodes (3): CourseResearchService, Injectable, InjectRepository

### Community 84 - "auth.service.ts"
Cohesion: 0.11
Nodes (15): NOW, InjectRepository, ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, PasswordResetOtp, Column (+7 more)

### Community 97 - "assessment.ts"
Cohesion: 0.15
Nodes (18): AssessmentItem, AssessmentOption, auditBloom(), BLOOM_LEVELS, BloomLevel, bloomTarget(), DEFAULT_BLOOM_TARGET_PERCENT, parseAssessment() (+10 more)

### Community 117 - "10. Research ingestion / RAG (§8) — needs migration run (`ResearchIngestion`)"
Cohesion: 0.50
Nodes (4): 10.1 Seed lands in the corpus, 10.2 License gate, 10.3 Brief flows into scoped compiles, 10. Research ingestion / RAG (§8) — needs migration run (`ResearchIngestion`)

### Community 125 - "course-research.service.ts"
Cohesion: 0.13
Nodes (20): IngestResult, OER_SEED_SOURCE, RESEARCH_GROUNDING_MODE, RESEARCH_LICENSE_ALLOWLIST, RESEARCH_TOP_K, RetrievedChunk, VideoResult, chunkText() (+12 more)

### Community 126 - "3. Analytics (retargeted, §1)"
Cohesion: 0.50
Nodes (4): 3.1 Admin overview — developer counts, 3.2 Admin per-developer table (renamed route), 3.3 Developer my-analytics (renamed route, no approval check), 3. Analytics (retargeted, §1)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 145 - "Module"
Cohesion: 0.14
Nodes (19): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, Module (+11 more)

### Community 146 - "AiGenerateService"
Cohesion: 0.11
Nodes (11): AiGenerateService, Injectable, isModelRetiredError(), COURSE_TASK_KEYS, CourseTaskKey, isCourseTaskKey(), resolveTierModel(), TASK_ROUTES (+3 more)

### Community 147 - "CreateQuestionDto"
Cohesion: 0.06
Nodes (35): ArrayMinSize, CreateOptionDto, ApiProperty, IsInt, IsNotEmpty, IsOptional, IsString, Min (+27 more)

### Community 148 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, VerifyOtpDto, Matches

### Community 149 - "assessment-service.spec.ts"
Cohesion: 0.13
Nodes (10): AssessmentColumns1788050000000, AssessmentPromptTasks1788060000000, AssessmentPromptSeeds1788070000000, ResolvedAiCredentials, harness(), inventory, q(), ASSESSMENT_DRAFT_PROMPT (+2 more)

### Community 151 - "1. Roles (§1)"
Cohesion: 0.14
Nodes (14): 1.10 Reject-roadmap and unpublish, 1.11 Draft/live split on published concepts (§3.8), 1.12 Detach blocked on published, delete-concept guard (§3.8), 1.13 Unpublish request flow + scheduled deletion (§3.8), 1.1 Profile has no instructor baggage, 1.2 Old instructor endpoints are gone (all as `ADMIN`), 1.3 Admin user list — role filter only, 1.4 Author roadmap + 3 modules + 9 concepts, attach (§2) (+6 more)

### Community 154 - "QuizController"
Cohesion: 0.19
Nodes (12): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 155 - "2. QA discussion (§12)"
Cohesion: 0.18
Nodes (11): 2.10 Answer edit/delete by author, 2.1 Post a public discussion question (as B), 2.2 Ask AI — private answer (as B), 2.3 Old target value rejected, 2.4 Discussion list — AI privacy per viewer, 2.5 Any developer can answer — author/admin auto-verified (as A answers B's question), 2.6 Verify — for other developers' answers, 2.7 AI answers cannot be verified (+3 more)

### Community 157 - "profile/page.tsx"
Cohesion: 0.24
Nodes (8): RootPage(), BasicInfoFormData, basicInfoSchema, ChangePasswordFormData, changePasswordSchema, ProfilePage(), TIMEZONE_OPTIONS, getToken()

### Community 160 - "QaController"
Cohesion: 0.21
Nodes (12): QaController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 162 - "Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing"
Cohesion: 0.25
Nodes (7): 4.1 Labels on reads, 4.2 Reader filters, 4.3 Shell browsers (as `B` in `/developer/terminal`), 4. AI-generate guard (§1), 5.1 Developer can check quota, 5. AI-generate guard (§1), Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing

### Community 163 - "6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run"
Cohesion: 0.25
Nodes (8): 6.1 Store keys (max 2, first auto-default), 6.2 Default + cap, 6.2b Model dropdown flow (pre-save lookup + per-key default), 6.3 Providers + live models, 6.4 Free tier is 5/day, own key uses its bucket, 6.5 gemini without a key is rejected, 6.6 In-use deletion lock, 6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run

### Community 164 - "Session-learned rules (hard-won, do not re-learn the hard way)"
Cohesion: 0.25
Nodes (7): Backend conventions (NestJS + TypeORM, no cron/scheduler), Backend env debugging, Next.js server/client boundary, Session-learned rules (hard-won, do not re-learn the hard way), Terminal registry, User preferences, Verification bar

### Community 165 - "AuthService"
Cohesion: 0.17
Nodes (8): AuthService, Injectable, RegisterDto, ApiProperty, IsEmail, IsNotEmpty, IsString, MinLength

### Community 166 - "askQuestion"
Cohesion: 0.20
Nodes (12): allThreads(), askerIdOf(), askQuestion(), canVerifyHere(), conceptList(), findConceptId(), locateThread(), pickDifficulty() (+4 more)

### Community 167 - "CourseSourceChunk"
Cohesion: 0.18
Nodes (11): CourseSourceChunk, Column, Entity, JoinColumn, ManyToOne, CourseSource, Column, Entity (+3 more)

### Community 168 - "use-roadmap-progress.ts"
Cohesion: 0.22
Nodes (5): ConceptProgressInfo, ModuleConceptItem, RoadmapDetailData, RoadmapModuleItem, RoadmapProgressData

### Community 170 - "RequestDeletionDto"
Cohesion: 0.29
Nodes (6): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength, Post

### Community 171 - "UserRole"
Cohesion: 0.11
Nodes (18): UserRole, ROLES_KEY, RolesGuard, Injectable, AddModulePrerequisiteDto, ApiProperty, IsUUID, CreateRoadmapDto (+10 more)

### Community 172 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

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

### Community 192 - "OAuthProfile"
Cohesion: 0.20
Nodes (5): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable

### Community 194 - ".githubAuthCallback"
Cohesion: 0.43
Nodes (4): Get, UseGuards, Req, Res

### Community 195 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 196 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 197 - "Assessment factory rollout and verification"
Cohesion: 0.40
Nodes (4): Assessment factory rollout and verification, Behavioral contracts, Checks and manual smoke test, Migrations

### Community 200 - "printThread"
Cohesion: 0.25
Nodes (9): askerOf(), body(), detail(), entry(), heading(), plural(), printThread(), renderThread() (+1 more)

### Community 202 - "research-seed.ts"
Cohesion: 0.53
Nodes (5): getTypeOrmConfig(), ensureVarFromFiles(), loadEnv(), main(), REQUIRED_ENV

### Community 203 - "showConcept"
Cohesion: 0.33
Nodes (6): nextConcept(), progressFor(), rememberSections(), sectionsOf(), showConcept(), unlocked()

### Community 207 - "cwdRoadmapId"
Cohesion: 0.50
Nodes (4): catalog(), cwdModuleId(), cwdRoadmapId(), findRoadmap()

## Knowledge Gaps
- **470 isolated node(s):** `Migrations`, `Behavioral contracts`, `Checks and manual smoke test`, `ParsedMcqOption`, `ParsedMcqQuestion` (+465 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **115 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersController`, `Concept`, `users.service.ts`, `ReviewService`, `ConceptsController`, `GetActivityQueryDto`, `factories.ts`, `assignments.module.ts`, `typeorm.config.ts`, `qa.service.ts`, `AuthController`, `AiGenerateService`, `AiGenerationJob`, `course-compiler.spec.ts`, `auth.module.ts`, `CreateQuestionDto`, `McqQuestion`, `QuizController`, `AdminContentReviewController`, `auth.controller.ts`, `QaController`, `ai-generate.controller.ts`, `AuthService`, `CurrentUser`, `RequestDeletionDto`, `UserRole`, `analytics.service.spec.ts`, `ai-generate.service.ts`, `ProgressController`, `auth.service.ts`, `UsersService`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `AiGenerateService` connect `AiGenerateService` to `ai-generate.controller.ts`, `ai-generate.service.ts`, `stage-prompts.spec.ts`, `typeorm.config.ts`, `qa.service.ts`, `analytics.service.spec.ts`, `course-compiler.spec.ts`, `assessment-service.spec.ts`, `McqQuestion`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `AiGenerateController` connect `ai-generate.controller.ts` to `course-compiler.spec.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `Migrations`, `Behavioral contracts`, `Checks and manual smoke test` to the rest of the system?**
  _470 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Concept` be split into smaller, more focused modules?**
  _Cohesion score 0.11923076923076924 - nodes in this community are weakly interconnected._
- **Should `users.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12648221343873517 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._