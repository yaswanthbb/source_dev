# Graph Report - knowledge_is_power  (2026-09-15)

## Corpus Check
- 269 files · ~238,032 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2034 nodes · 4913 edges · 157 communities (93 shown, 64 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
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
- ui-mode-provider.tsx
- User
- UsersService
- user.entity.ts
- UpdateOwnProfileDto
- assignments.module.ts
- commands.ts
- Added
- Concept
- terminal-workspace.tsx
- source:dev — Full CLI Mode + Rebrand — Implementation Plan
- compilerOptions
- AuthController
- qa.controller.ts
- AiGenerateService
- learning-commands.ts
- .applyForInstructor
- api-client.ts
- compilerOptions
- AnalyticsController
- commands.test.mjs
- instructor/layout.tsx
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
- Public
- roadmaps.service.ts
- CurrentUser
- Next.js Frontend Application
- frontend/package.json
- auth.module.ts
- QuizService
- student/dashboard/page.tsx
- exclude
- ForgotPasswordDto
- roadmaps.controller.ts
- nest-cli.json
- Answer
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
- AuthService
- auth.ts
- [roadmapId]/page.tsx
- analytics.service.spec.ts
- ProgressController
- backend/package.json
- next.config.ts
- concepts.controller.ts
- devDependencies
- AddOAuthColumns1787300000000
- tailwind.config.ts
- location.ts
- collectCoverageFrom
- check-theme-separation.mjs
- Commands
- UpdateModuleDto
- resolve-location.ts
- ai-generate.controller.ts
- index.ts
- prompts.ts
- location.test.mjs
- AddUserPreferences1787800000000
- forgot-password/page.tsx
- axios
- bcrypt
- use-roadmap-progress.ts
- @nestjs/platform-express
- @nestjs/swagger
- JwtAuthGuard
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
- CreateConceptDto
- react-hook-form
- react-markdown
- remark-gfm
- AddQaAnswerAiSupport1787500000000
- UpdateInstructorBioDto
- AccountDeletionRequest
- ResetPasswordDto
- VerifyOtpDto
- AiGenerationJob
- UpdateConceptDto
- admin/dashboard/page.tsx
- Location
- hasSignificantContentChange
- AGENTS.md
- AddAiGenerationJobs1787600000000
- nodemailer
- passport-google-oauth20
- @hookform/resolvers
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
- `Assignment` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/assignments/entities/assignment.entity.ts → backend/src/common/entities/base.entity.ts
- `Submission` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/assignments/entities/submission.entity.ts → backend/src/common/entities/base.entity.ts
- `PasswordResetOtp` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/auth/entities/password-reset-otp.entity.ts → backend/src/common/entities/base.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (157 total, 64 thin omitted)

### Community 0 - "Roles"
Cohesion: 0.20
Nodes (13): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Delete, Get (+5 more)

### Community 1 - "Module"
Cohesion: 0.13
Nodes (20): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, Module (+12 more)

### Community 2 - "useTheme"
Cohesion: 0.11
Nodes (26): CallbackHandler(), LoginPage(), LoginStage, RegisterPage(), RegisterStage, CenteredTerminalLoader(), CenteredTerminalLoaderProps, LogEntry (+18 more)

### Community 3 - "ReviewService"
Cohesion: 0.06
Nodes (34): addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn(), GetActivityQueryDto, ApiPropertyOptional, IsInt (+26 more)

### Community 4 - "ConceptsService"
Cohesion: 0.11
Nodes (17): ApiQuery, ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+9 more)

### Community 5 - "ui-mode-provider.tsx"
Cohesion: 0.18
Nodes (16): UserPreferences, formatPath(), guiFallback(), PATH_PARAM, Role, ROOT, sameLocation(), serializeLocation() (+8 more)

### Community 6 - "User"
Cohesion: 0.17
Nodes (6): RoadmapsService, Injectable, Column, Entity, OneToOne, User

### Community 7 - "UsersService"
Cohesion: 0.12
Nodes (5): JwtPayload, JwtStrategy, Injectable, Injectable, UsersService

### Community 8 - "user.entity.ts"
Cohesion: 0.14
Nodes (17): BaseEntity, CreateDateColumn, UpdateDateColumn, AiGenerationJobStatus, AiGenerationType, dataSourceOptions, entities, ParsedMcqOption (+9 more)

### Community 9 - "UpdateOwnProfileDto"
Cohesion: 0.13
Nodes (15): IsIanaTimezone(), ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, Type, ValidateNested, UpdateOwnProfileDto (+7 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "commands.ts"
Cohesion: 0.08
Nodes (31): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), applyInstructor, ARG_INDEX, avatar(), BootLine (+23 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "Concept"
Cohesion: 0.12
Nodes (26): ConceptReviewStatus, InjectRepository, InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne (+18 more)

### Community 14 - "terminal-workspace.tsx"
Cohesion: 0.15
Nodes (16): openingCommand(), StudentTerminalPage(), Console(), DOC_HEADINGS, RunIndicator(), TerminalWorkspace(), usePrefersReducedMotion(), getTheme() (+8 more)

### Community 15 - "source:dev — Full CLI Mode + Rebrand — Implementation Plan"
Cohesion: 0.07
Nodes (27): 0. What already exists (verified against HEAD `a95a40b`), 1.1 The single source of truth, 1.1a Deep content is CLI-only — location is total, GUI rendering is partial, 1.2 Resolution: slugs vs ids, 1.3 The theming seam, 1. Architecture: one location, two renderers, 2.1 Backend (migration required — hand over, do not run), 2.2 Frontend (+19 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.18
Nodes (13): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+5 more)

### Community 18 - "qa.controller.ts"
Cohesion: 0.07
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+23 more)

### Community 19 - "AiGenerateService"
Cohesion: 0.22
Nodes (6): AiGenerationJobType, AiGenerateService, Injectable, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), AiGenerationJobResultSummary

### Community 20 - "learning-commands.ts"
Cohesion: 0.06
Nodes (53): allThreads(), askerIdOf(), askerOf(), askQuestion(), AttemptResult, body(), catalog(), complete (+45 more)

### Community 21 - ".applyForInstructor"
Cohesion: 0.20
Nodes (6): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, Body, Post

### Community 22 - "api-client.ts"
Cohesion: 0.09
Nodes (33): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+25 more)

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
Cohesion: 0.12
Nodes (19): ADMIN_NAV_ITEMS, FullUser, INSTRUCTOR_NAV_ITEMS, BasicInfoFormData, basicInfoSchema, ChangePasswordFormData, changePasswordSchema, ProfilePage() (+11 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, class-transformer, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "output.ts"
Cohesion: 0.18
Nodes (17): TerminalIO, TerminalLine, clearHistory(), clearListings(), history, IndexItem, IndexKind, known (+9 more)

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
Cohesion: 0.10
Nodes (20): CommandSpec, cat, cd, childOf(), contentOf(), find, FS_COMMANDS, grep (+12 more)

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
Cohesion: 0.14
Nodes (13): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString, LoginDto, ApiProperty, IsEmail (+5 more)

### Community 39 - "Public"
Cohesion: 0.23
Nodes (8): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable, Public()

### Community 40 - "roadmaps.service.ts"
Cohesion: 0.10
Nodes (31): ProgressStatus, ModuleConcept, Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique (+23 more)

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

### Community 45 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.12
Nodes (24): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+16 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 48 - "ForgotPasswordDto"
Cohesion: 0.29
Nodes (4): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty

### Community 49 - "roadmaps.controller.ts"
Cohesion: 0.07
Nodes (26): AddModulePrerequisiteDto, ApiProperty, IsUUID, AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional (+18 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "Answer"
Cohesion: 0.14
Nodes (13): InjectRepository, Answer, Column, Entity, JoinColumn, ManyToOne, Question, Column (+5 more)

### Community 52 - "fs-commands.test.mjs"
Cohesion: 0.10
Nodes (18): BY_NAME, CONCEPTS, DETAIL, __dirname, failOnce, FS, GLYPHS, L (+10 more)

### Community 53 - "use-terminal-session.ts"
Cohesion: 0.13
Nodes (21): chunkEnd(), pageRows(), PagerState, PendingQuestion, sleep(), useTerminalSession(), View, AskOptions (+13 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "users.service.ts"
Cohesion: 0.13
Nodes (16): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength, GetUsersQueryDto, ApiPropertyOptional, IsEnum (+8 more)

### Community 68 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 69 - "InstructorAnalyticsController"
Cohesion: 0.15
Nodes (13): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+5 more)

### Community 70 - "AuthService"
Cohesion: 0.15
Nodes (10): AuthService, Injectable, RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional (+2 more)

### Community 71 - "auth.ts"
Cohesion: 0.13
Nodes (23): AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, InstructorAppShellLayout(), RootPage(), StudentAppShellLayout() (+15 more)

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "analytics.service.spec.ts"
Cohesion: 0.19
Nodes (17): InstructorStatus, UserRole, makeConcept(), makeUser(), createMockQueryBuilder(), createMockRepository(), MockRepository, slugify() (+9 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 77 - "concepts.controller.ts"
Cohesion: 0.33
Nodes (3): ROLES_KEY, RolesGuard, Injectable

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint-config-prettier, @eslint/js, @types/supertest, typescript, typescript, eslint-config-prettier, @eslint/js (+1 more)

### Community 81 - "location.ts"
Cohesion: 0.21
Nodes (13): targetOf(), ADMIN_TERMINAL_ROUTE, ChildKind, deserializeLocation(), fromCliParam(), fromSegments(), isValidSegment(), isWithin() (+5 more)

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

### Community 86 - "resolve-location.ts"
Cohesion: 0.26
Nodes (16): cache, cached(), ConceptContent, conceptEntries(), ConceptStatus, detailOf(), listChildren(), moduleEntries() (+8 more)

### Community 87 - "ai-generate.controller.ts"
Cohesion: 0.35
Nodes (13): AcknowledgeJobsDto, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto, GenerateRoadmapModulesDto, ApiProperty, ApiPropertyOptional (+5 more)

### Community 88 - "index.ts"
Cohesion: 0.22
Nodes (10): DEFAULT_THEME_ID, TERMINAL, ThemeDefinition, THEMES, DARK, LIGHT, bar(), activeGlyphs() (+2 more)

### Community 89 - "prompts.ts"
Cohesion: 0.27
Nodes (8): buildModuleConceptsUserPrompt(), buildQaAnswerUserPrompt(), buildRoadmapModulesUserPrompt(), CONCEPT_CONTENT_SYSTEM_PROMPT, CONCEPT_MCQ_SYSTEM_PROMPT, MODULE_CONCEPTS_SYSTEM_PROMPT, QA_ANSWER_SYSTEM_PROMPT, ROADMAP_MODULES_SYSTEM_PROMPT

### Community 90 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 92 - "forgot-password/page.tsx"
Cohesion: 0.29
Nodes (5): emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep

### Community 95 - "use-roadmap-progress.ts"
Cohesion: 0.25
Nodes (5): ConceptProgressInfo, ModuleConceptItem, RoadmapDetailData, RoadmapModuleItem, RoadmapProgressData

### Community 98 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 102 - "PasswordResetOtp"
Cohesion: 0.25
Nodes (7): InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne

### Community 117 - "factories.ts"
Cohesion: 0.06
Nodes (47): ConceptDifficulty, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeOption(), makeProgress(), makeQuestion() (+39 more)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 136 - "CreateConceptDto"
Cohesion: 0.29
Nodes (7): CreateConceptDto, ApiProperty, ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString

### Community 142 - "UpdateInstructorBioDto"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsOptional, IsString, MaxLength, UpdateInstructorBioDto

### Community 143 - "AccountDeletionRequest"
Cohesion: 0.29
Nodes (6): AccountDeletionRequest, Column, Entity, JoinColumn, ManyToOne, InjectRepository

### Community 144 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 145 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, Matches, VerifyOtpDto

### Community 146 - "AiGenerationJob"
Cohesion: 0.14
Nodes (18): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+10 more)

### Community 147 - "UpdateConceptDto"
Cohesion: 0.33
Nodes (6): ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString, UpdateConceptDto

### Community 148 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 149 - "Location"
Cohesion: 0.40
Nodes (5): CommandCtx, Found, Location, VfsEntry, UiModeContextValue

## Knowledge Gaps
- **432 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+427 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **64 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Roles`, `Module`, `ReviewService`, `ConceptsService`, `UsersService`, `user.entity.ts`, `assignments.module.ts`, `Concept`, `UpdateInstructorBioDto`, `AccountDeletionRequest`, `AuthController`, `AiGenerationJob`, `AiGenerateService`, `qa.controller.ts`, `.applyForInstructor`, `AdminContentReviewController`, `auth.controller.ts`, `roadmaps.service.ts`, `CurrentUser`, `auth.module.ts`, `QuizService`, `roadmaps.controller.ts`, `Answer`, `users.service.ts`, `InstructorAnalyticsController`, `AuthService`, `analytics.service.spec.ts`, `ProgressController`, `concepts.controller.ts`, `ai-generate.controller.ts`, `PasswordResetOtp`, `factories.ts`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `Roles`, `ReviewService`, `ConceptsService`, `Concept`, `UpdateInstructorBioDto`, `AuthController`, `AiGenerationJob`, `qa.controller.ts`, `.applyForInstructor`, `AdminContentReviewController`, `auth.controller.ts`, `roadmaps.service.ts`, `QuizService`, `roadmaps.controller.ts`, `users.service.ts`, `InstructorAnalyticsController`, `ProgressController`, `concepts.controller.ts`, `ai-generate.controller.ts`, `factories.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `Module`, `ConceptsService`, `User`, `user.entity.ts`, `roadmaps.service.ts`, `analytics.service.spec.ts`, `assignments.module.ts`, `Answer`, `factories.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _432 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Module` be split into smaller, more focused modules?**
  _Cohesion score 0.1349206349206349 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.10756302521008404 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.05875706214689266 - nodes in this community are weakly interconnected._