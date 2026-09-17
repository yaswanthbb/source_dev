# Graph Report - knowledge_is_power  (2026-09-15)

## Corpus Check
- 265 files · ~228,872 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1956 nodes · 4719 edges · 146 communities (82 shown, 64 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4826ed1b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Roles
- Module
- useTheme
- ReviewService
- ConceptsService
- location.ts
- User
- UsersService
- auth.ts
- RegisterDto
- assignments.module.ts
- commands.ts
- Added
- user.entity.ts
- terminal-workspace.tsx
- source:dev — Full CLI Mode + Rebrand — Implementation Plan
- compilerOptions
- AuthController
- qa.controller.ts
- gamification.controller.ts
- learning-commands.ts
- RequestDeletionDto
- api-client.ts
- compilerOptions
- AnalyticsController
- commands.test.mjs
- instructor/layout.tsx
- dependencies
- use-terminal-session.ts
- AdminContentReviewController
- edit/page.tsx
- scripts
- devDependencies
- app/layout.tsx
- CreateQuestionDto
- dependencies
- Content Authoring Flow
- jest
- auth.controller.ts
- Public
- Concept
- RoadmapsController
- Next.js Frontend Application
- frontend/package.json
- auth.module.ts
- QuizController
- student/dashboard/page.tsx
- exclude
- auth.service.ts
- AttachConceptDto
- nest-cli.json
- UserConceptProgress
- quiz.controller.ts
- useTerminalSession
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
- users.service.ts
- minimal-terminal-loader.tsx
- InstructorAnalyticsController
- AuthService
- getUser
- ai-jobs-provider.tsx
- InstructorProfile
- ProgressController
- backend/package.json
- next.config.ts
- CurrentUser
- devDependencies
- AddOAuthColumns1787300000000
- tailwind.config.ts
- QuizService
- collectCoverageFrom
- check-theme-separation.mjs
- Batch 1 — verify steps 1–4
- UpdateModuleDto
- CreateModuleDto
- CreateRoadmapDto
- RejectConceptDto
- UpdateRoadmapDto
- location.test.mjs
- AddUserPreferences1787800000000
- UpdateModuleConceptDto
- axios
- bcrypt
- class-transformer
- @nestjs/platform-express
- @nestjs/swagger
- passport
- passport-github2
- passport-jwt
- pg
- PasswordResetOtp
- frontend/eslint.config.mjs
- typeorm
- eslint
- @eslint/eslintrc
- eslint-plugin-prettier
- globals
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- jest
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
- lucide-react
- react-hook-form
- react-markdown
- remark-gfm
- AddQaAnswerAiSupport1787500000000
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
- `FullUser` --inherits--> `User`  [EXTRACTED]
  frontend/app/instructor/layout.tsx → frontend/lib/auth.ts
- `ProfileActionsMenuProps` --references--> `User`  [EXTRACTED]
  frontend/components/profile-actions-menu.tsx → frontend/lib/auth.ts
- `AiGenerationJob` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/ai-generate/entities/ai-generation-job.entity.ts → backend/src/common/entities/base.entity.ts
- `AiGenerationLog` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/ai-generate/entities/ai-generation-log.entity.ts → backend/src/common/entities/base.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (146 total, 64 thin omitted)

### Community 0 - "Roles"
Cohesion: 0.22
Nodes (13): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Delete, Get (+5 more)

### Community 1 - "Module"
Cohesion: 0.14
Nodes (20): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, Module (+12 more)

### Community 2 - "useTheme"
Cohesion: 0.11
Nodes (21): emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, RootPage(), RetroHomepage(), CenteredTerminalLoader() (+13 more)

### Community 3 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (32): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags (+24 more)

### Community 5 - "location.ts"
Cohesion: 0.11
Nodes (31): ADMIN_TERMINAL_ROUTE, basename(), ChildKind, deserializeLocation(), formatPath(), fromCliParam(), fromSegments(), guiFallback() (+23 more)

### Community 6 - "User"
Cohesion: 0.17
Nodes (6): RoadmapsService, Injectable, Column, Entity, OneToOne, User

### Community 7 - "UsersService"
Cohesion: 0.11
Nodes (5): JwtPayload, JwtStrategy, Injectable, Injectable, UsersService

### Community 8 - "auth.ts"
Cohesion: 0.14
Nodes (22): CallbackHandler(), LoginPage(), LoginStage, RegisterPage(), RegisterStage, BasicInfoFormData, basicInfoSchema, ChangePasswordFormData (+14 more)

### Community 9 - "RegisterDto"
Cohesion: 0.09
Nodes (23): IsIanaTimezone(), RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional, IsString (+15 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "commands.ts"
Cohesion: 0.07
Nodes (37): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), applyInstructor, ARG_INDEX, avatar(), BootLine (+29 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "user.entity.ts"
Cohesion: 0.12
Nodes (24): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, McqAttempt, Column, Entity (+16 more)

### Community 14 - "terminal-workspace.tsx"
Cohesion: 0.10
Nodes (17): openingCommand(), StudentTerminalPage(), SHORTCUTS, TerminalCommandBar(), TerminalHeader(), TerminalSurface(), DOC_HEADINGS, RunIndicator() (+9 more)

### Community 15 - "source:dev — Full CLI Mode + Rebrand — Implementation Plan"
Cohesion: 0.08
Nodes (25): 0. What already exists (verified against HEAD `a95a40b`), 1.1 The single source of truth, 1.1a Deep content is CLI-only — location is total, GUI rendering is partial, 1.2 Resolution: slugs vs ids, 1.3 The theming seam, 1. Architecture: one location, two renderers, 2.1 Backend (migration required — hand over, do not run), 2.2 Frontend (+17 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.18
Nodes (13): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+5 more)

### Community 18 - "qa.controller.ts"
Cohesion: 0.07
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+23 more)

### Community 19 - "gamification.controller.ts"
Cohesion: 0.13
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 20 - "learning-commands.ts"
Cohesion: 0.06
Nodes (54): allThreads(), askerIdOf(), askerOf(), askQuestion(), AttemptResult, body(), catalog(), complete (+46 more)

### Community 21 - "RequestDeletionDto"
Cohesion: 0.24
Nodes (7): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength, Body, Post

### Community 22 - "api-client.ts"
Cohesion: 0.07
Nodes (38): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics (+30 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (12): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+4 more)

### Community 25 - "commands.test.mjs"
Cohesion: 0.18
Nodes (5): askable, __dirname, harness(), roadmaps, student

### Community 26 - "instructor/layout.tsx"
Cohesion: 0.13
Nodes (16): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), LogoutConfirmationModal(), LogoutConfirmationModalProps, ProfileActionsMenu() (+8 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt, @nestjs/passport (+17 more)

### Community 28 - "use-terminal-session.ts"
Cohesion: 0.16
Nodes (19): useTerminalLogout(), PendingQuestion, View, AskOptions, CommandAborted, TerminalIO, TerminalLine, clearLearningCache() (+11 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.21
Nodes (11): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+3 more)

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
Cohesion: 0.16
Nodes (11): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), DASHBOARD_BY_ROLE (+3 more)

### Community 34 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

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
Cohesion: 0.13
Nodes (14): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString, ResetPasswordDto, ApiProperty, IsNotEmpty (+6 more)

### Community 39 - "Public"
Cohesion: 0.23
Nodes (8): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable, Public()

### Community 40 - "Concept"
Cohesion: 0.10
Nodes (33): ConceptReviewStatus, InjectRepository, InjectRepository, InjectRepository, Concept, Column, Entity, JoinColumn (+25 more)

### Community 41 - "RoadmapsController"
Cohesion: 0.23
Nodes (13): RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+5 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "auth.module.ts"
Cohesion: 0.13
Nodes (9): IS_PUBLIC_KEY, JwtAuthGuard, Injectable, OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable (+1 more)

### Community 45 - "QuizController"
Cohesion: 0.19
Nodes (12): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.09
Nodes (26): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+18 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 48 - "auth.service.ts"
Cohesion: 0.14
Nodes (11): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, ApiProperty, IsEmail, IsNotEmpty, Matches (+3 more)

### Community 49 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "UserConceptProgress"
Cohesion: 0.16
Nodes (10): ProgressStatus, AnalyticsService, Injectable, InjectRepository, Column, Entity, JoinColumn, ManyToOne (+2 more)

### Community 52 - "quiz.controller.ts"
Cohesion: 0.13
Nodes (14): SubmitAttemptDto, ApiProperty, IsUUID, IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto (+6 more)

### Community 53 - "useTerminalSession"
Cohesion: 0.18
Nodes (16): Console(), sleep(), useTerminalSession(), completeCommand(), completions(), matchCommands(), matchingPhrases(), resolve() (+8 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "users.service.ts"
Cohesion: 0.10
Nodes (20): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, ChangePasswordDto, ApiProperty, IsNotEmpty, IsString (+12 more)

### Community 68 - "minimal-terminal-loader.tsx"
Cohesion: 0.16
Nodes (7): StudentAppShellLayout(), MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES, AUTH_CHANGED_EVENT

### Community 69 - "InstructorAnalyticsController"
Cohesion: 0.15
Nodes (13): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+5 more)

### Community 70 - "AuthService"
Cohesion: 0.20
Nodes (6): AuthService, Injectable, LoginDto, ApiProperty, IsEmail, IsString

### Community 71 - "getUser"
Cohesion: 0.22
Nodes (9): InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, ConceptSummary, InstructorQaPage(), QaAnswer, QaQuestion (+1 more)

### Community 72 - "ai-jobs-provider.tsx"
Cohesion: 0.13
Nodes (21): RoadmapManagementPage(), AiJobResultModal(), AiJobResultModalProps, JOB_TYPE_NOUN, AiJobResultsBanner(), jobSummaryLine(), jobVisual(), AiJobsIndicator() (+13 more)

### Community 73 - "InstructorProfile"
Cohesion: 0.09
Nodes (29): InstructorStatus, makeUser(), slugify(), MostMissedOption, InjectRepository, Answer, Column, Entity (+21 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 77 - "CurrentUser"
Cohesion: 0.28
Nodes (8): UserRole, CurrentUser, ROLES_KEY, RolesGuard, Injectable, AddModulePrerequisiteDto, ApiProperty, IsUUID

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint-config-prettier, @eslint/js, @types/supertest, typescript, typescript, eslint-config-prettier, @eslint/js (+1 more)

### Community 82 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !**/*.spec.ts, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, **/*.(t|j)s

### Community 83 - "check-theme-separation.mjs"
Cohesion: 0.25
Nodes (5): __dirname, GUARDED, ROOT, RULES, violations

### Community 84 - "Batch 1 — verify steps 1–4"
Cohesion: 0.25
Nodes (7): 1.1 Location tests — `frontend/` — PENDING, 1.2 Theme separation guard — `frontend/` — PENDING, 1.3 Typecheck — `frontend/` — PENDING, 1.4 Typecheck — `backend/` — PENDING, backend/, Batch 1 — verify steps 1–4, Commands for Yaswanth to run

### Community 85 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 86 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 87 - "CreateRoadmapDto"
Cohesion: 0.40
Nodes (4): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString

### Community 88 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 89 - "UpdateRoadmapDto"
Cohesion: 0.40
Nodes (4): IsNotEmpty, IsOptional, IsString, UpdateRoadmapDto

### Community 90 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 92 - "UpdateModuleConceptDto"
Cohesion: 0.50
Nodes (3): IsInt, Min, UpdateModuleConceptDto

### Community 102 - "PasswordResetOtp"
Cohesion: 0.25
Nodes (7): InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne

### Community 117 - "factories.ts"
Cohesion: 0.07
Nodes (50): ConceptDifficulty, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeConcept(), makeOption(), makeProgress() (+42 more)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.05
Nodes (60): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn() (+52 more)

## Knowledge Gaps
- **408 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+403 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **64 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Roles`, `ReviewService`, `ConceptsService`, `UsersService`, `assignments.module.ts`, `user.entity.ts`, `AuthController`, `ai-generate.service.ts`, `gamification.controller.ts`, `qa.controller.ts`, `RequestDeletionDto`, `AdminContentReviewController`, `auth.controller.ts`, `Concept`, `RoadmapsController`, `auth.module.ts`, `QuizController`, `auth.service.ts`, `UserConceptProgress`, `quiz.controller.ts`, `users.service.ts`, `InstructorAnalyticsController`, `AuthService`, `InstructorProfile`, `ProgressController`, `CurrentUser`, `QuizService`, `PasswordResetOtp`, `factories.ts`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `Roles`, `ReviewService`, `ConceptsService`, `InstructorAnalyticsController`, `auth.controller.ts`, `users.service.ts`, `Concept`, `RoadmapsController`, `ProgressController`, `QuizController`, `AuthController`, `ai-generate.service.ts`, `gamification.controller.ts`, `qa.controller.ts`, `quiz.controller.ts`, `RequestDeletionDto`, `AdminContentReviewController`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `Module`, `ConceptsService`, `User`, `InstructorProfile`, `assignments.module.ts`, `user.entity.ts`, `CurrentUser`, `ai-generate.service.ts`, `UserConceptProgress`, `factories.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _408 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Module` be split into smaller, more focused modules?**
  _Cohesion score 0.14245014245014245 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.10846560846560846 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._