# Graph Report - knowledge_is_power  (2026-09-21)

## Corpus Check
- 266 files · ~248,932 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2103 nodes · 4746 edges · 191 communities (82 shown, 109 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 115 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f95704f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- user.entity.ts
- useTheme
- progress.service.spec.ts
- ConceptsService
- GetActivityQueryDto
- User
- UsersController
- roadmaps.controller.ts
- RegisterDto
- assignments.module.ts
- commands.ts
- Added
- Concept
- terminal-workspace.tsx
- concept.entity.ts
- compilerOptions
- AuthController
- QaService
- AiGenerateController
- learning-commands.ts
- class-transformer
- api-client.ts
- compilerOptions
- AnalyticsController
- commands.test.mjs
- auth.ts
- dependencies
- app.module.ts
- AdminContentReviewController
- edit/page.tsx
- scripts
- devDependencies
- app/layout.tsx
- fs-commands.ts
- dependencies
- 2. QA discussion (§12)
- jest
- auth.controller.ts
- AppController
- UserConceptProgress
- CurrentUser
- Next.js Frontend Application
- frontend/package.json
- output.ts
- QuizService
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
- PasswordResetOtp
- ProgressController
- backend/package.json
- next.config.ts
- LinkOAuthDto
- devDependencies
- AddOAuthColumns1787300000000
- tailwind.config.ts
- AuthService
- collectCoverageFrom
- check-theme-separation.mjs
- CreateModuleDto
- OAuthProfile
- @nestjs/passport
- .answerReviewItem
- auth.module.ts
- CreateConceptDto
- location.test.mjs
- AddUserPreferences1787800000000
- profile/page.tsx
- axios
- RoleCollapseToDeveloper1787900000000
- QaDiscussionModel1787910000000
- hasSignificantContentChange
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
- Post
- Roles
- UseGuards

## God Nodes (most connected - your core abstractions)
1. `User` - 216 edges
2. `Concept` - 54 edges
3. `CurrentUser` - 50 edges
4. `McqQuestion` - 42 edges
5. `BaseEntity` - 41 edges
6. `AiGenerateService` - 36 edges
7. `UsersService` - 31 edges
8. `Module` - 30 edges
9. `UserConceptProgress` - 30 edges
10. `UserRole` - 29 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `GetUsersQueryDto` --references--> `UserRole`  [EXTRACTED]
  backend/src/modules/users/dto/get-users-query.dto.ts → backend/src/common/enums/user-role.enum.ts
- `User` --references--> `UserRole`  [EXTRACTED]
  backend/src/modules/users/entities/user.entity.ts → backend/src/common/enums/user-role.enum.ts
- `Answer` --references--> `User`  [EXTRACTED]
  backend/src/modules/qa/entities/answer.entity.ts → backend/src/modules/users/entities/user.entity.ts
- `Question` --references--> `User`  [EXTRACTED]
  backend/src/modules/qa/entities/question.entity.ts → backend/src/modules/users/entities/user.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (191 total, 109 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.16
Nodes (6): JwtPayload, JwtStrategy, Injectable, Injectable, InjectRepository, UsersService

### Community 1 - "user.entity.ts"
Cohesion: 0.08
Nodes (41): BaseEntity, CreateDateColumn, UpdateDateColumn, AiGenerationType, dataSourceOptions, entities, InjectRepository, AiGenerationLog (+33 more)

### Community 2 - "useTheme"
Cohesion: 0.08
Nodes (31): CallbackHandler(), emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, LoginPage(), LoginStage (+23 more)

### Community 3 - "progress.service.spec.ts"
Cohesion: 0.10
Nodes (21): XpSource, makeQuestion(), MockQueryBuilder, Column, Entity, JoinColumn, ManyToOne, XpEvent (+13 more)

### Community 4 - "ConceptsService"
Cohesion: 0.10
Nodes (18): ApiQuery, ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+10 more)

### Community 5 - "GetActivityQueryDto"
Cohesion: 0.12
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 6 - "User"
Cohesion: 0.16
Nodes (6): RoadmapsService, Injectable, InjectRepository, Column, Entity, User

### Community 7 - "UsersController"
Cohesion: 0.15
Nodes (16): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser, Delete (+8 more)

### Community 8 - "roadmaps.controller.ts"
Cohesion: 0.11
Nodes (18): Roles(), ROLES_KEY, RolesGuard, Injectable, AddModulePrerequisiteDto, ApiProperty, IsUUID, CreateRoadmapDto (+10 more)

### Community 9 - "RegisterDto"
Cohesion: 0.09
Nodes (23): IsIanaTimezone(), RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional, IsString (+15 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (17): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Submission (+9 more)

### Community 11 - "commands.ts"
Cohesion: 0.06
Nodes (56): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), avatar(), BootLine, bootLines(), BootStep (+48 more)

### Community 12 - "Added"
Cohesion: 0.13
Nodes (14): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changed, Changelog, Developer experience (+6 more)

### Community 13 - "Concept"
Cohesion: 0.14
Nodes (23): InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne, McqAttempt, Column (+15 more)

### Community 14 - "terminal-workspace.tsx"
Cohesion: 0.07
Nodes (26): openingCommand(), StudentTerminalPage(), CodeBlock(), DOC_HEADINGS, FetchBlock(), HIGHLIGHT_KEYWORDS, highlightCode(), Line() (+18 more)

### Community 15 - "concept.entity.ts"
Cohesion: 0.14
Nodes (21): ConceptReviewStatus, UserRole, makeUser(), createMockQueryBuilder(), createMockRepository(), MockRepository, slugify(), NOW (+13 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "QaService"
Cohesion: 0.07
Nodes (32): ApiProperty, CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsOptional (+24 more)

### Community 19 - "AiGenerateController"
Cohesion: 0.19
Nodes (14): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+6 more)

### Community 20 - "learning-commands.ts"
Cohesion: 0.06
Nodes (54): allThreads(), askerIdOf(), askerOf(), askQuestion(), AttemptResult, body(), catalog(), clearLearningCache() (+46 more)

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
Cohesion: 0.11
Nodes (26): ADMIN_NAV_ITEMS, AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, FullUser, INSTRUCTOR_NAV_ITEMS (+18 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "app.module.ts"
Cohesion: 0.11
Nodes (22): AppModule, Module, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, Module, AssignmentsModule, AuthModule (+14 more)

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
Nodes (24): CommandCtx, CommandSpec, cat, cd, closeConcept(), contentOf(), FS_COMMANDS, history (+16 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "2. QA discussion (§12)"
Cohesion: 0.06
Nodes (30): 0.1 Register developer A (future content author), 0.2 Register developer B (other developer), 0.3 Promote yourself to admin (no seed exists — do it in SQL), 0. Setup — three users, 1.1 Profile has no instructor baggage, 1.2 Old instructor endpoints are gone (all as `ADMIN`), 1.3 Admin user list — role filter only, 1.4 Any developer can author content (no approval gate) (+22 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$ (+3 more)

### Community 38 - "auth.controller.ts"
Cohesion: 0.11
Nodes (17): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString (+9 more)

### Community 39 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 40 - "UserConceptProgress"
Cohesion: 0.11
Nodes (14): ProgressStatus, AnalyticsService, Injectable, InjectRepository, MostMissedOption, Column, Entity, JoinColumn (+6 more)

### Community 41 - "CurrentUser"
Cohesion: 0.25
Nodes (14): CurrentUser, RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+6 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "output.ts"
Cohesion: 0.20
Nodes (15): StudentAppShellLayout(), clearHistory(), CommandHelp, FetchReport, FetchRow, HelpRow, history, LineKind (+7 more)

### Community 45 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.11
Nodes (26): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+18 more)

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
Cohesion: 0.12
Nodes (30): UserPreferences, ADMIN_TERMINAL_ROUTE, ChildKind, deserializeLocation(), formatPath(), fromCliParam(), fromSegments(), guiFallback() (+22 more)

### Community 52 - "fs-commands.test.mjs"
Cohesion: 0.09
Nodes (20): BY_NAME, CONCEPTS, DETAIL, __dirname, failOnce, FS, GLYPHS, L (+12 more)

### Community 53 - "use-terminal-session.ts"
Cohesion: 0.13
Nodes (25): Console(), chunkEnd(), pageRows(), PagerState, PendingQuestion, PendingSelect, sleep(), SuggestRow (+17 more)

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
Cohesion: 0.12
Nodes (24): ConceptProgressInfo, ModuleConceptItem, RoadmapDetailData, RoadmapModuleItem, RoadmapProgressData, api, isAbortError(), cache (+16 more)

### Community 71 - "source:dev — Master Plan"
Cohesion: 0.10
Nodes (19): 0. Vision, 10. Updated build order (revised 2026-09-21 — backend-first, frontend-last), 11. Decision log (memory for future sessions/agents), 12. QA discussion model (revised 2026-09-21, supersedes §1 author-only draft), 1. Roles — collapsed from three to two, 2. Content ownership & reuse, 3. Publishing / review workflow, 4. Content labeling (AI-generated vs hand-written vs partial) (+11 more)

### Community 72 - "ai-jobs-provider.tsx"
Cohesion: 0.13
Nodes (21): RoadmapManagementPage(), AiJobResultModal(), AiJobResultModalProps, JOB_TYPE_NOUN, AiJobResultsBanner(), jobSummaryLine(), jobVisual(), AiJobsIndicator() (+13 more)

### Community 73 - "PasswordResetOtp"
Cohesion: 0.13
Nodes (10): InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne, EmailModule (+2 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 77 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "AuthService"
Cohesion: 0.14
Nodes (7): AuthService, Injectable, ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 82 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, !**/*.spec.ts, **/*.(t|j)s

### Community 83 - "check-theme-separation.mjs"
Cohesion: 0.25
Nodes (5): __dirname, GUARDED, ROOT, RULES, violations

### Community 84 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 85 - "OAuthProfile"
Cohesion: 0.20
Nodes (5): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable

### Community 87 - ".answerReviewItem"
Cohesion: 0.20
Nodes (10): ReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+2 more)

### Community 88 - "auth.module.ts"
Cohesion: 0.25
Nodes (7): AccountDeletionRequest, Column, Entity, JoinColumn, ManyToOne, Module, UsersModule

### Community 89 - "CreateConceptDto"
Cohesion: 0.29
Nodes (7): CreateConceptDto, ApiProperty, ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString

### Community 90 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 92 - "profile/page.tsx"
Cohesion: 0.29
Nodes (6): BasicInfoFormData, basicInfoSchema, ChangePasswordFormData, changePasswordSchema, ProfilePage(), TIMEZONE_OPTIONS

### Community 98 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 117 - "factories.ts"
Cohesion: 0.08
Nodes (37): ConceptDifficulty, FIXED_DATE, makeAttempt(), makeBadge(), makeConcept(), makeOption(), makeProgress(), makeReviewItem() (+29 more)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 136 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 143 - "users.service.ts"
Cohesion: 0.14
Nodes (16): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength, GetUsersQueryDto, ApiPropertyOptional, IsOptional (+8 more)

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (42): AiGenerationJobStatus, AiGenerationJobType, addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn(), AiGenerateService (+34 more)

## Knowledge Gaps
- **453 isolated node(s):** `FIXED_DATE`, `entities`, `dataSourceOptions`, `MostMissedOption`, `UserPreferences` (+448 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **109 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `user.entity.ts`, `progress.service.spec.ts`, `ConceptsService`, `GetActivityQueryDto`, `UsersController`, `roadmaps.controller.ts`, `assignments.module.ts`, `Concept`, `concept.entity.ts`, `users.service.ts`, `AuthController`, `ai-generate.service.ts`, `AiGenerateController`, `QaService`, `AdminContentReviewController`, `auth.controller.ts`, `UserConceptProgress`, `CurrentUser`, `QuizService`, `DeveloperAnalyticsController`, `PasswordResetOtp`, `ProgressController`, `AuthService`, `.answerReviewItem`, `auth.module.ts`, `factories.ts`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `Module` connect `app.module.ts` to `user.entity.ts`, `UserConceptProgress`, `PasswordResetOtp`, `concept.entity.ts`, `ai-generate.service.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `progress.service.spec.ts`, `ConceptsService`, `GetActivityQueryDto`, `auth.controller.ts`, `roadmaps.controller.ts`, `UserConceptProgress`, `ProgressController`, `QuizService`, `concept.entity.ts`, `users.service.ts`, `AuthController`, `ai-generate.service.ts`, `QaService`, `factories.ts`, `.answerReviewItem`, `AdminContentReviewController`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `FIXED_DATE`, `entities`, `dataSourceOptions` to the rest of the system?**
  _453 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `user.entity.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07615018508725542 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.07922705314009662 - nodes in this community are weakly interconnected._
- **Should `progress.service.spec.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1006006006006006 - nodes in this community are weakly interconnected._