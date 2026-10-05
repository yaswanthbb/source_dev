# Graph Report - knowledge_is_power  (2026-09-18)

## Corpus Check
- 269 files · ~250,567 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2054 nodes · 4959 edges · 146 communities (81 shown, 65 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `533692ee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- User
- roadmaps.service.ts
- useTheme
- ReviewService
- ConceptsService
- gamification.controller.ts
- RoadmapsService
- Roles
- AttachConceptDto
- RegisterDto
- assignments.module.ts
- commands.ts
- Added
- Concept
- terminal-workspace.tsx
- source:dev — Full CLI Mode + Rebrand — Implementation Plan
- compilerOptions
- AuthController
- qa.controller.ts
- getToken
- learning-commands.ts
- class-transformer
- api-client.ts
- compilerOptions
- AnalyticsController
- commands.test.mjs
- auth.ts
- dependencies
- output.ts
- AdminContentReviewController
- edit/page.tsx
- scripts
- devDependencies
- app/layout.tsx
- fs-commands.ts
- dependencies
- Content Authoring Flow
- jest
- auth.controller.ts
- AppController
- UserConceptProgress
- CurrentUser
- Next.js Frontend Application
- frontend/package.json
- EmailService
- QuizService
- student/dashboard/page.tsx
- exclude
- resolve-location.ts
- roadmaps.controller.ts
- nest-cli.json
- ui-mode-provider.tsx
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
- UpdateInstructorBioDto
- minimal-terminal-loader.tsx
- InstructorAnalyticsController
- PasswordResetOtp
- location.ts
- [roadmapId]/page.tsx
- typeorm.config.ts
- ProgressController
- backend/package.json
- next.config.ts
- use-roadmap-progress.ts
- devDependencies
- AddOAuthColumns1787300000000
- tailwind.config.ts
- LinkOAuthDto
- collectCoverageFrom
- check-theme-separation.mjs
- Commands
- GoogleStrategy
- @nestjs/passport
- passport
- ChangePasswordDto
- CreateModuleDto
- location.test.mjs
- AddUserPreferences1787800000000
- jest
- axios
- GetUsersQueryDto
- RequestDeletionDto
- @nestjs/platform-express
- @nestjs/swagger
- JwtAuthGuard
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
- react-hook-form
- react-markdown
- remark-gfm
- AddQaAnswerAiSupport1787500000000
- user.entity.ts
- VerifyOtpDto
- ai-generate.service.ts
- AGENTS.md
- AddAiGenerationJobs1787600000000
- AddAiJobRetryAndAck1787700000000

## God Nodes (most connected - your core abstractions)
1. `User` - 218 edges
2. `CurrentUser` - 80 edges
3. `Concept` - 63 edges
4. `BaseEntity` - 46 edges
5. `McqQuestion` - 45 edges
6. `Module` - 40 edges
7. `AiGenerateService` - 38 edges
8. `UsersService` - 38 edges
9. `Roadmap` - 35 edges
10. `ModuleConcept` - 33 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `AiGenerationJob` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/ai-generate/entities/ai-generation-job.entity.ts → backend/src/common/entities/base.entity.ts
- `AiGenerationLog` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/ai-generate/entities/ai-generation-log.entity.ts → backend/src/common/entities/base.entity.ts
- `Assignment` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/assignments/entities/assignment.entity.ts → backend/src/common/entities/base.entity.ts
- `Submission` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/assignments/entities/submission.entity.ts → backend/src/common/entities/base.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (146 total, 65 thin omitted)

### Community 0 - "User"
Cohesion: 0.09
Nodes (13): AuthService, Injectable, InjectRepository, JwtPayload, JwtStrategy, Injectable, Column, Entity (+5 more)

### Community 1 - "roadmaps.service.ts"
Cohesion: 0.08
Nodes (41): AppModule, AiGenerateModule, InjectRepository, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, ModuleConcept (+33 more)

### Community 2 - "useTheme"
Cohesion: 0.10
Nodes (26): CallbackHandler(), emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, LoginPage(), LoginStage (+18 more)

### Community 3 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (32): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags (+24 more)

### Community 5 - "gamification.controller.ts"
Cohesion: 0.13
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 7 - "Roles"
Cohesion: 0.19
Nodes (15): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+7 more)

### Community 8 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 9 - "RegisterDto"
Cohesion: 0.09
Nodes (23): IsIanaTimezone(), RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional, IsString (+15 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "commands.ts"
Cohesion: 0.05
Nodes (58): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), applyInstructor, ARG_INDEX, avatar(), bootFetch() (+50 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "Concept"
Cohesion: 0.12
Nodes (27): ConceptReviewStatus, InjectRepository, InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne (+19 more)

### Community 14 - "terminal-workspace.tsx"
Cohesion: 0.10
Nodes (23): openingCommand(), StudentTerminalPage(), TerminalHeader(), TerminalSurface(), Console(), DOC_HEADINGS, FetchBlock(), RunIndicator() (+15 more)

### Community 15 - "source:dev — Full CLI Mode + Rebrand — Implementation Plan"
Cohesion: 0.07
Nodes (28): 0. What already exists (verified against HEAD `a95a40b`), 1.1 The single source of truth, 1.1a Deep content is CLI-only — location is total, GUI rendering is partial, 1.2 Resolution: slugs vs ids, 1.3 The theming seam, 1. Architecture: one location, two renderers, 2.1 Backend (migration required — hand over, do not run), 2.2 Frontend (+20 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "qa.controller.ts"
Cohesion: 0.07
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+23 more)

### Community 19 - "getToken"
Cohesion: 0.16
Nodes (14): RootPage(), BasicInfoFormData, basicInfoSchema, ChangePasswordFormData, changePasswordSchema, ProfilePage(), TIMEZONE_OPTIONS, StudentAppShellLayout() (+6 more)

### Community 20 - "learning-commands.ts"
Cohesion: 0.06
Nodes (53): allThreads(), askerIdOf(), askerOf(), askQuestion(), AttemptResult, body(), catalog(), complete (+45 more)

### Community 22 - "api-client.ts"
Cohesion: 0.07
Nodes (36): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics (+28 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (12): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+4 more)

### Community 25 - "commands.test.mjs"
Cohesion: 0.18
Nodes (5): commands, __dirname, EXTERNAL, { installGlyphs }, loaded

### Community 26 - "auth.ts"
Cohesion: 0.12
Nodes (25): ADMIN_NAV_ITEMS, AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, FullUser, INSTRUCTOR_NAV_ITEMS (+17 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "output.ts"
Cohesion: 0.15
Nodes (21): useTerminalLogout(), TerminalIO, TerminalLine, clearLearningCache(), clearHistory(), clearListings(), FetchReport, FetchRow (+13 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.14
Nodes (15): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+7 more)

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
Nodes (25): CommandCtx, cat, cd, childOf(), contentOf(), find, Found, FS_COMMANDS (+17 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "Content Authoring Flow"
Cohesion: 0.19
Nodes (14): Automated Achievement Badges, Concept (Lesson), Concept Prerequisites Engine, Content Authoring Flow, Curriculum Architecture & Hierarchy, Experience Points (XP) System, Gamification Engine, Instructor Studio & Analytics (+6 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ts (+3 more)

### Community 38 - "auth.controller.ts"
Cohesion: 0.09
Nodes (20): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString (+12 more)

### Community 39 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 40 - "UserConceptProgress"
Cohesion: 0.14
Nodes (10): InjectRepository, Column, Entity, JoinColumn, ManyToOne, Unique, UserConceptProgress, ProgressService (+2 more)

### Community 41 - "CurrentUser"
Cohesion: 0.25
Nodes (14): CurrentUser, RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+6 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "EmailService"
Cohesion: 0.29
Nodes (3): EmailModule, EmailService, Injectable

### Community 45 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.12
Nodes (24): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+16 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 48 - "resolve-location.ts"
Cohesion: 0.22
Nodes (17): cache, cached(), ConceptContent, conceptEntries(), ConceptStatus, detailOf(), listChildren(), moduleEntries() (+9 more)

### Community 49 - "roadmaps.controller.ts"
Cohesion: 0.07
Nodes (27): ROLES_KEY, RolesGuard, Injectable, AddModulePrerequisiteDto, ApiProperty, IsUUID, CreateRoadmapDto, IsNotEmpty (+19 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "ui-mode-provider.tsx"
Cohesion: 0.18
Nodes (16): UserPreferences, formatPath(), guiFallback(), PATH_PARAM, Role, ROOT, sameLocation(), serializeLocation() (+8 more)

### Community 52 - "fs-commands.test.mjs"
Cohesion: 0.10
Nodes (18): BY_NAME, CONCEPTS, DETAIL, __dirname, failOnce, FS, GLYPHS, L (+10 more)

### Community 53 - "use-terminal-session.ts"
Cohesion: 0.14
Nodes (19): candidateOf(), chunkEnd(), pageRows(), PagerState, PendingQuestion, sleep(), useTerminalSession(), AskOptions (+11 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "UpdateInstructorBioDto"
Cohesion: 0.29
Nodes (5): ApiPropertyOptional, IsOptional, IsString, MaxLength, UpdateInstructorBioDto

### Community 68 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 69 - "InstructorAnalyticsController"
Cohesion: 0.15
Nodes (13): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+5 more)

### Community 70 - "PasswordResetOtp"
Cohesion: 0.33
Nodes (6): PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne

### Community 71 - "location.ts"
Cohesion: 0.21
Nodes (13): ADMIN_TERMINAL_ROUTE, basename(), ChildKind, deserializeLocation(), fromCliParam(), fromSegments(), isValidSegment(), isWithin() (+5 more)

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "typeorm.config.ts"
Cohesion: 0.09
Nodes (26): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, typeOrmAsyncConfig, Answer, Column (+18 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 77 - "use-roadmap-progress.ts"
Cohesion: 0.22
Nodes (6): ConceptProgressInfo, ModuleConceptItem, RoadmapDetailData, RoadmapModuleItem, RoadmapProgressData, useAllRoadmapsProgress()

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint-config-prettier, @eslint/js, @types/supertest, typescript, typescript, eslint-config-prettier, @eslint/js (+1 more)

### Community 81 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString

### Community 82 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !**/*.spec.ts, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, **/*.(t|j)s

### Community 83 - "check-theme-separation.mjs"
Cohesion: 0.25
Nodes (5): __dirname, GUARDED, ROOT, RULES, violations

### Community 84 - "Commands"
Cohesion: 0.33
Nodes (5): Commands, commands ran:, frontend, root, to run

### Community 88 - "ChangePasswordDto"
Cohesion: 0.29
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 89 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 90 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 94 - "GetUsersQueryDto"
Cohesion: 0.40
Nodes (5): GetUsersQueryDto, ApiPropertyOptional, IsEnum, IsOptional, IsString

### Community 95 - "RequestDeletionDto"
Cohesion: 0.29
Nodes (5): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength

### Community 98 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 117 - "factories.ts"
Cohesion: 0.08
Nodes (42): ConceptDifficulty, ProgressStatus, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeConcept(), makeOption() (+34 more)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 143 - "user.entity.ts"
Cohesion: 0.16
Nodes (21): InstructorStatus, UserRole, makeUser(), createMockQueryBuilder(), createMockRepository(), MockRepository, slugify(), NOW (+13 more)

### Community 145 - "VerifyOtpDto"
Cohesion: 0.29
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, Matches, VerifyOtpDto

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.05
Nodes (60): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn() (+52 more)

## Knowledge Gaps
- **438 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+433 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **65 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `roadmaps.service.ts`, `ReviewService`, `ConceptsService`, `gamification.controller.ts`, `RoadmapsService`, `Roles`, `assignments.module.ts`, `Concept`, `user.entity.ts`, `AuthController`, `ai-generate.service.ts`, `qa.controller.ts`, `AdminContentReviewController`, `auth.controller.ts`, `UserConceptProgress`, `CurrentUser`, `QuizService`, `roadmaps.controller.ts`, `InstructorAnalyticsController`, `PasswordResetOtp`, `typeorm.config.ts`, `ProgressController`, `factories.ts`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `ReviewService`, `ConceptsService`, `gamification.controller.ts`, `auth.controller.ts`, `InstructorAnalyticsController`, `UserConceptProgress`, `Roles`, `ProgressController`, `Concept`, `QuizService`, `AuthController`, `ai-generate.service.ts`, `roadmaps.controller.ts`, `qa.controller.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `CreateQuestionDto` connect `QuizService` to `Concept`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _438 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.08562367864693446 - nodes in this community are weakly interconnected._
- **Should `roadmaps.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07831677381648158 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.10084033613445378 - nodes in this community are weakly interconnected._