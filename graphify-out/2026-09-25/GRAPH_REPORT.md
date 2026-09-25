# Graph Report - knowledge_is_power  (2026-09-24)

## Corpus Check
- 273 files · ~256,601 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2179 nodes · 4930 edges · 201 communities (88 shown, 113 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 127 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2fc5ec45`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- roadmaps.service.ts
- useTheme
- User
- ConceptsService
- ReviewService
- qa.controller.ts
- UsersController
- roadmaps.controller.ts
- GamificationController
- assignments.module.ts
- commands.ts
- Added
- Concept
- terminal-workspace.tsx
- concept.entity.ts
- compilerOptions
- AuthController
- QaService
- gamification.controller.ts
- learning-commands.ts
- class-transformer
- api-client.ts
- compilerOptions
- AnalyticsController
- commands.test.mjs
- auth.ts
- dependencies
- app.module.ts
- RejectConceptDto
- edit/page.tsx
- scripts
- devDependencies
- app/layout.tsx
- fs-commands.ts
- dependencies
- 1. Roles (§1)
- jest
- auth.controller.ts
- AppController
- UserConceptProgress
- RoadmapsService
- Next.js Frontend Application
- frontend/package.json
- output.ts
- CurrentUser
- student/dashboard/page.tsx
- exclude
- DeveloperAnalyticsController
- UpdateModuleDto
- nest-cli.json
- location.ts
- fs-commands.test.mjs
- use-terminal-session.ts
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
- AttachConceptDto
- minimal-terminal-loader.tsx
- ApiBearerAuth
- resolve-location.ts
- source:dev — Master Plan
- ai-jobs-provider.tsx
- auth.service.spec.ts
- ProgressController
- backend/package.json
- next.config.ts
- CreateQuestionDto
- devDependencies
- AddOAuthColumns1787300000000
- tailwind.config.ts
- RegisterDto
- collectCoverageFrom
- check-theme-separation.mjs
- CreateModuleDto
- analytics.service.spec.ts
- @nestjs/passport
- UpdateQuestionDto
- JwtAuthGuard
- CreateConceptDto
- location.test.mjs
- AddUserPreferences1787800000000
- ReviewItem
- axios
- RoleCollapseToDeveloper1787900000000
- QaDiscussionModel1787910000000
- VerifyOtpDto
- @nestjs/swagger
- index.ts
- passport-github2
- passport-jwt
- pg
- lucide-react
- frontend/eslint.config.mjs
- typeorm
- eslint
- @eslint/eslintrc
- eslint-plugin-prettier
- globals
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- ApiBearerAuth
- @nestjs/cli
- @nestjs/schematics
- Application Logo
- @nestjs/testing
- factories.ts
- prettier
- source-map-support
- supertest
- ts-jest
- ts-loader
- ts-node
- tsconfig-paths
- @types/bcrypt
- @types/express
- dependencies
- @types/jest
- @types/node
- @types/nodemailer
- @types/passport-github2
- @types/passport-google-oauth20
- @types/passport-jwt
- typescript-eslint
- admin/dashboard/page.tsx
- react-hook-form
- react-markdown
- remark-gfm
- AddQaAnswerAiSupport1787500000000
- eslint-config-prettier
- users.service.ts
- ApiOperation
- ApiResponse
- ai-generate.service.ts
- @nestjs/typeorm
- nodemailer
- ApiPropertyOptional
- IsOptional
- AGENTS.md
- AddAiGenerationJobs1787600000000
- IsString
- ApiTags
- ApiOperation
- ApiResponse
- ApiTags
- Controller
- Get
- UseGuards
- Injectable
- InjectRepository
- ApiProperty
- Query
- IsIn
- IsNotEmpty
- OneToMany
- IsEnum
- ApiPropertyOptional
- IsOptional
- IsString
- MaxLength
- Column
- Entity
- AddAiJobRetryAndAck1787700000000
- JoinColumn
- ManyToOne
- OneToOne
- OneToOne
- Body
- Controller
- CurrentUser
- Delete
- Get
- InjectRepository
- Param
- Patch
- QuizService
- Roles
- UseGuards
- LinkOAuthDto
- UpdateConceptDto
- CreateRoadmapDto
- UpdateRoadmapDto
- PublishingWorkflow1787920000000
- PublishedEditModel1787930000000
- UpdateOptionDto
- ApiQuery
- Module
- Post

## God Nodes (most connected - your core abstractions)
1. `User` - 162 edges
2. `Concept` - 59 edges
3. `Roadmap` - 45 edges
4. `RoadmapsService` - 44 edges
5. `McqQuestion` - 41 edges
6. `BaseEntity` - 38 edges
7. `AiGenerateService` - 36 edges
8. `Module` - 33 edges
9. `UsersService` - 31 edges
10. `ModuleConcept` - 31 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `Assignment` --references--> `Concept`  [EXTRACTED]
  backend/src/modules/assignments/entities/assignment.entity.ts → backend/src/modules/content/entities/concept.entity.ts
- `ModuleConcept` --references--> `Concept`  [EXTRACTED]
  backend/src/modules/content/entities/module-concept.entity.ts → backend/src/modules/content/entities/concept.entity.ts
- `UserConceptProgress` --references--> `Concept`  [EXTRACTED]
  backend/src/modules/progress/entities/user-concept-progress.entity.ts → backend/src/modules/content/entities/concept.entity.ts
- `AssignmentsModule` --references--> `Module`  [EXTRACTED]
  backend/src/modules/assignments/assignments.module.ts → backend/src/modules/content/entities/module.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (201 total, 113 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.13
Nodes (5): JwtStrategy, Injectable, Injectable, InjectRepository, UsersService

### Community 1 - "roadmaps.service.ts"
Cohesion: 0.09
Nodes (34): RoadmapUnpublishStatus, AiGenerateModule, InjectRepository, ContentModule, Module, ModuleConcept, Column, Entity (+26 more)

### Community 2 - "useTheme"
Cohesion: 0.09
Nodes (29): CallbackHandler(), emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, LoginPage(), LoginStage (+21 more)

### Community 3 - "User"
Cohesion: 0.09
Nodes (34): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, AiGenerationLog, Column, Entity (+26 more)

### Community 4 - "ConceptsService"
Cohesion: 0.08
Nodes (23): boundedLevenshtein(), hasSignificantContentChange(), slugify(), ConceptsController, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse (+15 more)

### Community 5 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 6 - "qa.controller.ts"
Cohesion: 0.11
Nodes (17): ApiProperty, CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsOptional (+9 more)

### Community 7 - "UsersController"
Cohesion: 0.15
Nodes (16): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser, Delete (+8 more)

### Community 8 - "roadmaps.controller.ts"
Cohesion: 0.18
Nodes (10): Roles(), ROLES_KEY, RolesGuard, Injectable, AddModulePrerequisiteDto, ApiProperty, IsUUID, IsInt (+2 more)

### Community 9 - "GamificationController"
Cohesion: 0.21
Nodes (8): GamificationController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Query

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "commands.ts"
Cohesion: 0.05
Nodes (59): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), avatar(), bootFetch(), BootLine, bootLines() (+51 more)

### Community 12 - "Added"
Cohesion: 0.13
Nodes (14): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changed, Changelog, Developer experience (+6 more)

### Community 13 - "Concept"
Cohesion: 0.11
Nodes (26): Concept, Column, Entity, JoinColumn, ManyToOne, MostMissedOption, SubmitAttemptDto, ApiProperty (+18 more)

### Community 14 - "terminal-workspace.tsx"
Cohesion: 0.12
Nodes (15): openingCommand(), StudentTerminalPage(), CodeBlock(), DOC_HEADINGS, FetchBlock(), HIGHLIGHT_KEYWORDS, highlightCode(), Line() (+7 more)

### Community 15 - "concept.entity.ts"
Cohesion: 0.28
Nodes (12): ConceptReviewStatus, RoadmapReviewStatus, UserRole, makeConcept(), makeUser(), createMockQueryBuilder(), createMockRepository(), MockRepository (+4 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "QaService"
Cohesion: 0.13
Nodes (16): QaController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+8 more)

### Community 19 - "gamification.controller.ts"
Cohesion: 0.25
Nodes (7): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, Max

### Community 20 - "learning-commands.ts"
Cohesion: 0.06
Nodes (52): allThreads(), askerIdOf(), askerOf(), askQuestion(), AttemptResult, body(), catalog(), complete (+44 more)

### Community 22 - "api-client.ts"
Cohesion: 0.07
Nodes (41): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+33 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.13
Nodes (13): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Roles (+5 more)

### Community 25 - "commands.test.mjs"
Cohesion: 0.16
Nodes (9): attemptOrFail(), catalogOrFail(), CATALOGUE, commands, __dirname, EXTERNAL, fail(), { installGlyphs } (+1 more)

### Community 26 - "auth.ts"
Cohesion: 0.09
Nodes (35): ADMIN_NAV_ITEMS, AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, FullUser, INSTRUCTOR_NAV_ITEMS (+27 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "app.module.ts"
Cohesion: 0.14
Nodes (14): AppModule, Module, typeOrmAsyncConfig, AnalyticsModule, Module, AssignmentsModule, AuthModule, DeveloperAnalyticsModule (+6 more)

### Community 29 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 30 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), SnackbarProvider()

### Community 34 - "fs-commands.ts"
Cohesion: 0.09
Nodes (25): CommandCtx, CommandSpec, cat, cd, closeConcept(), contentOf(), FS_COMMANDS, history (+17 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "1. Roles (§1)"
Cohesion: 0.05
Nodes (39): 0.1 Register developer A (future content author), 0.2 Register developer B (other developer), 0.3 Promote yourself to admin (no seed exists — do it in SQL), 0. Setup — three users, 1.10 Reject-roadmap and unpublish, 1.11 Draft/live split on published concepts (§3.8), 1.12 Detach blocked on published, delete-concept guard (§3.8), 1.13 Unpublish request flow + scheduled deletion (§3.8) (+31 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$ (+3 more)

### Community 38 - "auth.controller.ts"
Cohesion: 0.07
Nodes (25): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString (+17 more)

### Community 39 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 40 - "UserConceptProgress"
Cohesion: 0.11
Nodes (16): ModuleConceptPrerequisite, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn, Column (+8 more)

### Community 41 - "RoadmapsService"
Cohesion: 0.06
Nodes (34): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+26 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "output.ts"
Cohesion: 0.20
Nodes (16): clearLearningCache(), clearHistory(), CommandHelp, FetchReport, FetchRow, HelpRow, history, LineKind (+8 more)

### Community 45 - "CurrentUser"
Cohesion: 0.24
Nodes (13): CurrentUser, QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+5 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.12
Nodes (24): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+16 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 48 - "DeveloperAnalyticsController"
Cohesion: 0.14
Nodes (15): DeveloperAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+7 more)

### Community 49 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "location.ts"
Cohesion: 0.11
Nodes (30): UserPreferences, ADMIN_TERMINAL_ROUTE, basename(), ChildKind, deserializeLocation(), fromCliParam(), fromSegments(), guiFallback() (+22 more)

### Community 52 - "fs-commands.test.mjs"
Cohesion: 0.09
Nodes (20): BY_NAME, CONCEPTS, DETAIL, __dirname, failOnce, FS, GLYPHS, L (+12 more)

### Community 53 - "use-terminal-session.ts"
Cohesion: 0.12
Nodes (24): useTerminalLogout(), Console(), chunkEnd(), pageRows(), PagerState, PendingQuestion, PendingSelect, sleep() (+16 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 68 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 70 - "resolve-location.ts"
Cohesion: 0.13
Nodes (23): ConceptProgressInfo, ModuleConceptItem, RoadmapDetailData, RoadmapModuleItem, RoadmapProgressData, api, isAbortError(), cache (+15 more)

### Community 71 - "source:dev — Master Plan"
Cohesion: 0.10
Nodes (19): 0. Vision, 10. Updated build order (revised 2026-09-21 — backend-first, frontend-last), 11. Decision log (memory for future sessions/agents), 12. QA discussion model (revised 2026-09-21, supersedes §1 author-only draft), 1. Roles — collapsed from three to two, 2. Content ownership & reuse, 3. Publishing / review workflow, 4. Content labeling (AI-generated vs hand-written vs partial) (+11 more)

### Community 72 - "ai-jobs-provider.tsx"
Cohesion: 0.13
Nodes (21): RoadmapManagementPage(), AiJobResultModal(), AiJobResultModalProps, JOB_TYPE_NOUN, AiJobResultsBanner(), jobSummaryLine(), jobVisual(), AiJobsIndicator() (+13 more)

### Community 73 - "auth.service.spec.ts"
Cohesion: 0.13
Nodes (12): AuthService, NOW, Injectable, InjectRepository, PasswordResetOtp, Column, Entity, Index (+4 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 77 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "RegisterDto"
Cohesion: 0.25
Nodes (8): RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength

### Community 82 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, !**/*.spec.ts, **/*.(t|j)s

### Community 83 - "check-theme-separation.mjs"
Cohesion: 0.25
Nodes (5): __dirname, GUARDED, ROOT, RULES, violations

### Community 84 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 85 - "analytics.service.spec.ts"
Cohesion: 0.57
Nodes (3): ProgressStatus, AnalyticsService, Injectable

### Community 87 - "UpdateQuestionDto"
Cohesion: 0.33
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateQuestionDto

### Community 88 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 89 - "CreateConceptDto"
Cohesion: 0.29
Nodes (7): CreateConceptDto, ApiProperty, ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString

### Community 90 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 92 - "ReviewItem"
Cohesion: 0.25
Nodes (7): ReviewItem, Column, Entity, JoinColumn, ManyToOne, Unique, InjectRepository

### Community 96 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, Matches, VerifyOtpDto

### Community 98 - "index.ts"
Cohesion: 0.17
Nodes (11): BANNER, BannerLine, BannerTone, DEFAULT_THEME_ID, TERMINAL, ThemeDefinition, THEMES, DARK (+3 more)

### Community 117 - "factories.ts"
Cohesion: 0.08
Nodes (38): ConceptDifficulty, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeOption(), makeProgress(), makeQuestion() (+30 more)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 136 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 143 - "users.service.ts"
Cohesion: 0.07
Nodes (31): IsIanaTimezone(), ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength, GetUsersQueryDto, ApiPropertyOptional (+23 more)

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.05
Nodes (57): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn() (+49 more)

### Community 191 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString

### Community 192 - "UpdateConceptDto"
Cohesion: 0.33
Nodes (6): ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString, UpdateConceptDto

### Community 193 - "CreateRoadmapDto"
Cohesion: 0.40
Nodes (4): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString

### Community 194 - "UpdateRoadmapDto"
Cohesion: 0.40
Nodes (4): IsNotEmpty, IsOptional, IsString, UpdateRoadmapDto

### Community 197 - "UpdateOptionDto"
Cohesion: 0.40
Nodes (5): IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto

## Knowledge Gaps
- **465 isolated node(s):** `LeafOriginLabel`, `VALID_LABELS`, `0.1 Register developer A (future content author)`, `0.2 Register developer B (other developer)`, `0.3 Promote yourself to admin (no seed exists — do it in SQL)` (+460 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **113 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `roadmaps.service.ts`, `ReviewService`, `qa.controller.ts`, `UsersController`, `roadmaps.controller.ts`, `GamificationController`, `assignments.module.ts`, `Concept`, `concept.entity.ts`, `users.service.ts`, `AuthController`, `ai-generate.service.ts`, `gamification.controller.ts`, `QaService`, `auth.controller.ts`, `UserConceptProgress`, `RoadmapsService`, `CurrentUser`, `DeveloperAnalyticsController`, `QuizService`, `auth.service.spec.ts`, `ProgressController`, `analytics.service.spec.ts`, `ReviewItem`, `factories.ts`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `RoadmapsService` connect `RoadmapsService` to `roadmaps.controller.ts`, `roadmaps.service.ts`, `ai-generate.service.ts`, `concept.entity.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `roadmaps.service.ts`, `User`, `ConceptsService`, `UserConceptProgress`, `RoadmapsService`, `assignments.module.ts`, `concept.entity.ts`, `ai-generate.service.ts`, `QaService`, `analytics.service.spec.ts`, `factories.ts`, `app.module.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `LeafOriginLabel`, `VALID_LABELS`, `0.1 Register developer A (future content author)` to the rest of the system?**
  _465 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Should `roadmaps.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08653061224489796 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.08780487804878048 - nodes in this community are weakly interconnected._