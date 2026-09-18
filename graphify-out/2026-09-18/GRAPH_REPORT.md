# Graph Report - knowledge_is_power  (2026-09-17)

## Corpus Check
- 269 files · ~249,920 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2043 nodes · 4934 edges · 149 communities (84 shown, 65 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `533692ee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- roadmaps.service.ts
- auth.ts
- ReviewService
- ConceptsService
- GetActivityQueryDto
- RoadmapsService
- Roles
- AttachConceptDto
- UpdateOwnProfileDto
- assignments.module.ts
- commands.ts
- Added
- User
- terminal-workspace.tsx
- source:dev — Full CLI Mode + Rebrand — Implementation Plan
- compilerOptions
- AuthController
- qa.controller.ts
- CreateQuestionDto
- learning-commands.ts
- class-transformer
- useSnackbar
- compilerOptions
- AnalyticsController
- commands.test.mjs
- instructor/layout.tsx
- dependencies
- output.ts
- AdminContentReviewController
- api-client.ts
- scripts
- devDependencies
- app/layout.tsx
- fs-commands.ts
- dependencies
- Content Authoring Flow
- jest
- auth.controller.ts
- AppController
- Concept
- CurrentUser
- Next.js Frontend Application
- frontend/package.json
- auth.module.ts
- QuizController
- student/dashboard/page.tsx
- exclude
- ForgotPasswordDto
- roadmaps.controller.ts
- nest-cli.json
- UpdateQuestionDto
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
- users.service.ts
- minimal-terminal-loader.tsx
- InstructorAnalyticsController
- PasswordResetOtp
- getUser
- [roadmapId]/page.tsx
- InstructorProfile
- ProgressController
- backend/package.json
- next.config.ts
- RegisterDto
- devDependencies
- AddOAuthColumns1787300000000
- tailwind.config.ts
- ReviewItem
- collectCoverageFrom
- check-theme-separation.mjs
- Commands
- UpdateModuleDto
- eslint-config-prettier
- ResetPasswordDto
- ChangePasswordDto
- CreateModuleDto
- location.test.mjs
- AddUserPreferences1787800000000
- forgot-password/page.tsx
- axios
- GetUsersQueryDto
- .applyForInstructor
- @nestjs/platform-express
- @nestjs/swagger
- JwtAuthGuard
- passport-github2
- passport-jwt
- pg
- nodemailer
- frontend/eslint.config.mjs
- typeorm
- eslint
- @eslint/eslintrc
- eslint-plugin-prettier
- globals
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- passport-google-oauth20
- @nestjs/cli
- @nestjs/schematics
- Application Logo
- @nestjs/testing
- gamification.service.ts
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
- @hookform/resolvers
- react-hook-form
- react-markdown
- remark-gfm
- AddQaAnswerAiSupport1787500000000
- factories.ts
- AuthService
- ai-generate.service.ts
- AccountDeletionRequest
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
- `CreateConceptPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/instructor/concepts/new/page.tsx → frontend/providers/snackbar-provider.tsx
- `FullUser` --inherits--> `User`  [EXTRACTED]
  frontend/app/instructor/layout.tsx → frontend/lib/auth.ts
- `ProfileActionsMenuProps` --references--> `User`  [EXTRACTED]
  frontend/components/profile-actions-menu.tsx → frontend/lib/auth.ts
- `AiGenerationJob` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/ai-generate/entities/ai-generation-job.entity.ts → backend/src/common/entities/base.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (149 total, 65 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.11
Nodes (4): JwtStrategy, Injectable, Injectable, UsersService

### Community 1 - "roadmaps.service.ts"
Cohesion: 0.10
Nodes (28): AppModule, typeOrmAsyncConfig, AiGenerateModule, InjectRepository, AnalyticsModule, InjectRepository, AssignmentsModule, AuthModule (+20 more)

### Community 2 - "auth.ts"
Cohesion: 0.10
Nodes (33): CallbackHandler(), LoginPage(), LoginStage, RegisterPage(), RegisterStage, RootPage(), BasicInfoFormData, basicInfoSchema (+25 more)

### Community 3 - "ReviewService"
Cohesion: 0.14
Nodes (12): ReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+4 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (33): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), slugify(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+25 more)

### Community 5 - "GetActivityQueryDto"
Cohesion: 0.12
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 7 - "Roles"
Cohesion: 0.23
Nodes (13): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Delete, Get (+5 more)

### Community 8 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 9 - "UpdateOwnProfileDto"
Cohesion: 0.12
Nodes (15): IsIanaTimezone(), ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, Type, ValidateNested, UpdateOwnProfileDto (+7 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "commands.ts"
Cohesion: 0.07
Nodes (38): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), applyInstructor, ARG_INDEX, avatar(), bootFetch() (+30 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "User"
Cohesion: 0.08
Nodes (34): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, JwtPayload, SubmitAttemptDto, ApiProperty (+26 more)

### Community 14 - "terminal-workspace.tsx"
Cohesion: 0.10
Nodes (21): openingCommand(), StudentTerminalPage(), SHORTCUTS, TerminalCommandBar(), TerminalHeader(), TerminalSurface(), DOC_HEADINGS, FetchBlock() (+13 more)

### Community 15 - "source:dev — Full CLI Mode + Rebrand — Implementation Plan"
Cohesion: 0.07
Nodes (27): 0. What already exists (verified against HEAD `a95a40b`), 1.1 The single source of truth, 1.1a Deep content is CLI-only — location is total, GUI rendering is partial, 1.2 Resolution: slugs vs ids, 1.3 The theming seam, 1. Architecture: one location, two renderers, 2.1 Backend (migration required — hand over, do not run), 2.2 Frontend (+19 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "qa.controller.ts"
Cohesion: 0.08
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+23 more)

### Community 19 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

### Community 20 - "learning-commands.ts"
Cohesion: 0.06
Nodes (55): allThreads(), askerIdOf(), askerOf(), askQuestion(), AttemptResult, bar(), body(), catalog() (+47 more)

### Community 22 - "useSnackbar"
Cohesion: 0.11
Nodes (21): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+13 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (14): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+6 more)

### Community 25 - "commands.test.mjs"
Cohesion: 0.18
Nodes (5): askable, __dirname, harness(), roadmaps, student

### Community 26 - "instructor/layout.tsx"
Cohesion: 0.13
Nodes (16): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), LogoutConfirmationModal(), LogoutConfirmationModalProps, ProfileActionsMenu() (+8 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "output.ts"
Cohesion: 0.13
Nodes (23): useTerminalLogout(), TerminalIO, TerminalLine, clearLearningCache(), clearHistory(), clearListings(), FetchReport, FetchRow (+15 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.14
Nodes (15): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+7 more)

### Community 30 - "api-client.ts"
Cohesion: 0.08
Nodes (29): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption (+21 more)

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.14
Nodes (12): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), SnackbarProvider() (+4 more)

### Community 34 - "fs-commands.ts"
Cohesion: 0.05
Nodes (70): UserPreferences, CommandCtx, CommandSpec, cat, cd, childOf(), contentOf(), find (+62 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, lucide-react, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "Content Authoring Flow"
Cohesion: 0.19
Nodes (14): Automated Achievement Badges, Concept (Lesson), Concept Prerequisites Engine, Content Authoring Flow, Curriculum Architecture & Hierarchy, Experience Points (XP) System, Gamification Engine, Instructor Studio & Analytics (+6 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ts (+3 more)

### Community 38 - "auth.controller.ts"
Cohesion: 0.13
Nodes (13): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString, LoginDto, ApiProperty, IsEmail (+5 more)

### Community 39 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 40 - "Concept"
Cohesion: 0.08
Nodes (34): ConceptReviewStatus, ProgressStatus, InjectRepository, InjectRepository, Concept, Column, Entity, JoinColumn (+26 more)

### Community 41 - "CurrentUser"
Cohesion: 0.25
Nodes (14): CurrentUser, RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+6 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "auth.module.ts"
Cohesion: 0.16
Nodes (8): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable, EmailModule, EmailService, Injectable

### Community 45 - "QuizController"
Cohesion: 0.23
Nodes (12): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.08
Nodes (31): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+23 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 48 - "ForgotPasswordDto"
Cohesion: 0.29
Nodes (4): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty

### Community 49 - "roadmaps.controller.ts"
Cohesion: 0.10
Nodes (17): ROLES_KEY, RolesGuard, Injectable, AddModulePrerequisiteDto, ApiProperty, IsUUID, CreateRoadmapDto, IsNotEmpty (+9 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "UpdateQuestionDto"
Cohesion: 0.16
Nodes (11): IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto, IsInt, IsNotEmpty, IsOptional (+3 more)

### Community 52 - "fs-commands.test.mjs"
Cohesion: 0.10
Nodes (18): BY_NAME, CONCEPTS, DETAIL, __dirname, failOnce, FS, GLYPHS, L (+10 more)

### Community 53 - "use-terminal-session.ts"
Cohesion: 0.12
Nodes (28): Console(), chunkEnd(), pageRows(), PagerState, PendingQuestion, sleep(), useTerminalSession(), View (+20 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "users.service.ts"
Cohesion: 0.13
Nodes (15): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString (+7 more)

### Community 68 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 69 - "InstructorAnalyticsController"
Cohesion: 0.15
Nodes (13): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+5 more)

### Community 70 - "PasswordResetOtp"
Cohesion: 0.25
Nodes (7): InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne

### Community 71 - "getUser"
Cohesion: 0.22
Nodes (9): InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, ConceptSummary, InstructorQaPage(), QaAnswer, QaQuestion (+1 more)

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "InstructorProfile"
Cohesion: 0.13
Nodes (20): InstructorStatus, InjectRepository, Answer, Column, Entity, JoinColumn, ManyToOne, Question (+12 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 77 - "RegisterDto"
Cohesion: 0.25
Nodes (8): RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "ReviewItem"
Cohesion: 0.25
Nodes (7): ReviewItem, Column, Entity, JoinColumn, ManyToOne, Unique, InjectRepository

### Community 82 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !**/*.spec.ts, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, **/*.(t|j)s

### Community 83 - "check-theme-separation.mjs"
Cohesion: 0.25
Nodes (5): __dirname, GUARDED, ROOT, RULES, violations

### Community 84 - "Commands"
Cohesion: 0.33
Nodes (5): Commands, commands ran:, frontend, root, to run

### Community 85 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 87 - "ResetPasswordDto"
Cohesion: 0.29
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 88 - "ChangePasswordDto"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 89 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 90 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 92 - "forgot-password/page.tsx"
Cohesion: 0.29
Nodes (5): emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep

### Community 94 - "GetUsersQueryDto"
Cohesion: 0.40
Nodes (5): GetUsersQueryDto, ApiPropertyOptional, IsEnum, IsOptional, IsString

### Community 98 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 117 - "gamification.service.ts"
Cohesion: 0.08
Nodes (31): ConceptDifficulty, XpSource, Badge, Column, Entity, Streak, Column, CreateDateColumn (+23 more)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 143 - "factories.ts"
Cohesion: 0.21
Nodes (18): UserRole, FIXED_DATE, makeAttempt(), makeBadge(), makeConcept(), makeOption(), makeProgress(), makeQuestion() (+10 more)

### Community 145 - "AuthService"
Cohesion: 0.20
Nodes (7): AuthService, Injectable, ApiProperty, IsEmail, IsNotEmpty, Matches, VerifyOtpDto

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.05
Nodes (60): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn() (+52 more)

### Community 149 - "AccountDeletionRequest"
Cohesion: 0.29
Nodes (6): AccountDeletionRequest, Column, Entity, JoinColumn, ManyToOne, InjectRepository

## Knowledge Gaps
- **434 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+429 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **65 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `roadmaps.service.ts`, `ReviewService`, `ConceptsService`, `GetActivityQueryDto`, `RoadmapsService`, `Roles`, `UpdateOwnProfileDto`, `assignments.module.ts`, `factories.ts`, `AuthController`, `ai-generate.service.ts`, `qa.controller.ts`, `AccountDeletionRequest`, `AdminContentReviewController`, `auth.controller.ts`, `Concept`, `CurrentUser`, `auth.module.ts`, `QuizController`, `roadmaps.controller.ts`, `users.service.ts`, `InstructorAnalyticsController`, `PasswordResetOtp`, `InstructorProfile`, `ProgressController`, `ReviewItem`, `ChangePasswordDto`, `.applyForInstructor`, `gamification.service.ts`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `ReviewService`, `ConceptsService`, `GetActivityQueryDto`, `Roles`, `UpdateOwnProfileDto`, `User`, `AuthController`, `ai-generate.service.ts`, `qa.controller.ts`, `AdminContentReviewController`, `auth.controller.ts`, `Concept`, `QuizController`, `roadmaps.controller.ts`, `users.service.ts`, `InstructorAnalyticsController`, `ProgressController`, `ChangePasswordDto`, `.applyForInstructor`, `gamification.service.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `roadmaps.service.ts`, `ConceptsService`, `InstructorProfile`, `assignments.module.ts`, `User`, `factories.ts`, `ai-generate.service.ts`, `gamification.service.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _434 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._
- **Should `roadmaps.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10188261351052048 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1014799154334038 - nodes in this community are weakly interconnected._