# Graph Report - knowledge_is_power  (2026-09-20)

## Corpus Check
- 265 files · ~241,097 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2018 nodes · 4841 edges · 162 communities (81 shown, 81 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 119 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0d6eda81`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- roadmaps.service.ts
- useTheme
- .answerReviewItem
- ConceptsController
- GetActivityQueryDto
- User
- ApiBearerAuth
- roadmaps.controller.ts
- UpdateOwnProfileDto
- assignments.module.ts
- commands.ts
- Added
- McqQuestion
- terminal-workspace.tsx
- user.entity.ts
- compilerOptions
- AuthController
- qa.controller.ts
- AiGenerationJob
- learning-commands.ts
- class-transformer
- api-client.ts
- compilerOptions
- AnalyticsController
- commands.test.mjs
- auth.ts
- dependencies
- review.service.ts
- AdminContentReviewController
- edit/page.tsx
- scripts
- devDependencies
- app/layout.tsx
- fs-commands.ts
- dependencies
- CreateQuestionDto
- jest
- auth.controller.ts
- AppController
- UserConceptProgress
- CurrentUser
- Next.js Frontend Application
- frontend/package.json
- PasswordResetOtp
- QuizService
- student/dashboard/page.tsx
- exclude
- resolve-location.ts
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
- UpdateInstructorBioDto
- minimal-terminal-loader.tsx
- InstructorAnalyticsController
- QuizController
- Concept
- [roadmapId]/page.tsx
- RegisterDto
- ProgressController
- backend/package.json
- next.config.ts
- LinkOAuthDto
- devDependencies
- AddOAuthColumns1787300000000
- tailwind.config.ts
- RejectConceptDto
- collectCoverageFrom
- check-theme-separation.mjs
- users.controller.ts
- ForgotPasswordDto
- @nestjs/passport
- ChangePasswordDto
- location.test.mjs
- AddUserPreferences1787800000000
- axios
- RequestDeletionDto
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
- concept.entity.ts
- VerifyOtpDto
- ai-generate.service.ts
- @nestjs/typeorm
- nodemailer
- ApiPropertyOptional
- IsOptional
- AGENTS.md
- AddAiGenerationJobs1787600000000
- IsString
- ApiOperation
- ApiResponse
- ApiTags
- Body
- Controller
- Delete
- Get
- Param
- Patch
- Post
- Query
- UseGuards
- InjectRepository
- AddAiJobRetryAndAck1787700000000

## God Nodes (most connected - your core abstractions)
1. `User` - 195 edges
2. `CurrentUser` - 69 edges
3. `Concept` - 63 edges
4. `BaseEntity` - 46 edges
5. `McqQuestion` - 45 edges
6. `Module` - 40 edges
7. `AiGenerateService` - 38 edges
8. `UsersService` - 37 edges
9. `Roadmap` - 35 edges
10. `ModuleConcept` - 33 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `useTerminalSession()` --calls--> `completeCommand()`  [EXTRACTED]
  frontend/components/terminal/use-terminal-session.ts → frontend/lib/terminal/commands.ts
- `useTerminalSession()` --calls--> `resolve()`  [EXTRACTED]
  frontend/components/terminal/use-terminal-session.ts → frontend/lib/terminal/commands.ts
- `useTerminalSession()` --calls--> `runCommand()`  [EXTRACTED]
  frontend/components/terminal/use-terminal-session.ts → frontend/lib/terminal/commands.ts
- `useTerminalSession()` --calls--> `useTheme()`  [EXTRACTED]
  frontend/components/terminal/use-terminal-session.ts → frontend/providers/theme-provider.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (162 total, 81 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.08
Nodes (22): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, JwtPayload, JwtStrategy, Injectable, UsersController (+14 more)

### Community 1 - "roadmaps.service.ts"
Cohesion: 0.08
Nodes (42): AppModule, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, ModuleConcept, Column (+34 more)

### Community 2 - "useTheme"
Cohesion: 0.10
Nodes (28): CallbackHandler(), emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, LoginPage(), LoginStage (+20 more)

### Community 3 - ".answerReviewItem"
Cohesion: 0.16
Nodes (10): ReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+2 more)

### Community 4 - "ConceptsController"
Cohesion: 0.07
Nodes (28): ApiQuery, ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+20 more)

### Community 5 - "GetActivityQueryDto"
Cohesion: 0.12
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 6 - "User"
Cohesion: 0.17
Nodes (6): RoadmapsService, Injectable, Column, Entity, OneToOne, User

### Community 8 - "roadmaps.controller.ts"
Cohesion: 0.07
Nodes (26): AddModulePrerequisiteDto, ApiProperty, IsUUID, AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional (+18 more)

### Community 9 - "UpdateOwnProfileDto"
Cohesion: 0.13
Nodes (15): IsIanaTimezone(), ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, Type, ValidateNested, UpdateOwnProfileDto (+7 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "commands.ts"
Cohesion: 0.05
Nodes (59): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), avatar(), BootLine, BootStep, catalogue() (+51 more)

### Community 12 - "Added"
Cohesion: 0.13
Nodes (14): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changed, Changelog, Developer experience (+6 more)

### Community 13 - "McqQuestion"
Cohesion: 0.16
Nodes (18): InjectRepository, McqAttempt, Column, Entity, JoinColumn, ManyToOne, McqOption, Column (+10 more)

### Community 14 - "terminal-workspace.tsx"
Cohesion: 0.08
Nodes (23): openingCommand(), StudentTerminalPage(), TerminalHeader(), TerminalSurface(), DOC_HEADINGS, FetchBlock(), RunIndicator(), SWATCHES (+15 more)

### Community 15 - "user.entity.ts"
Cohesion: 0.11
Nodes (25): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, typeOrmAsyncConfig, Answer, Column (+17 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "qa.controller.ts"
Cohesion: 0.07
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+23 more)

### Community 19 - "AiGenerationJob"
Cohesion: 0.14
Nodes (19): AiGenerationJobType, AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+11 more)

### Community 20 - "learning-commands.ts"
Cohesion: 0.06
Nodes (55): closeConcept(), allThreads(), askerIdOf(), askerOf(), askQuestion(), AttemptResult, body(), catalog() (+47 more)

### Community 22 - "api-client.ts"
Cohesion: 0.09
Nodes (33): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+25 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (12): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+4 more)

### Community 25 - "commands.test.mjs"
Cohesion: 0.17
Nodes (8): catalogOrFail(), CATALOGUE, commands, __dirname, EXTERNAL, fail(), { installGlyphs }, loaded

### Community 26 - "auth.ts"
Cohesion: 0.08
Nodes (36): ADMIN_NAV_ITEMS, AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, FullUser, INSTRUCTOR_NAV_ITEMS (+28 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "review.service.ts"
Cohesion: 0.13
Nodes (14): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewItem, Column, Entity, JoinColumn (+6 more)

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
Cohesion: 0.20
Nodes (8): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), SnackbarProvider()

### Community 34 - "fs-commands.ts"
Cohesion: 0.12
Nodes (15): CommandCtx, cat, cd, FS_COMMANDS, history, isDirectory(), less, ls (+7 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$ (+3 more)

### Community 38 - "auth.controller.ts"
Cohesion: 0.10
Nodes (16): AuthService, Injectable, ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength, GitHubAuthGuard (+8 more)

### Community 39 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 40 - "UserConceptProgress"
Cohesion: 0.14
Nodes (11): ProgressStatus, AnalyticsService, Injectable, InjectRepository, MostMissedOption, Column, Entity, JoinColumn (+3 more)

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
Cohesion: 0.25
Nodes (7): InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne

### Community 45 - "QuizService"
Cohesion: 0.10
Nodes (16): SubmitAttemptDto, ApiProperty, IsUUID, IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto (+8 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.09
Nodes (29): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+21 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 48 - "resolve-location.ts"
Cohesion: 0.20
Nodes (18): api, isAbortError(), cache, cached(), ConceptContent, conceptEntries(), ConceptStatus, detailOf() (+10 more)

### Community 49 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "location.ts"
Cohesion: 0.11
Nodes (34): UserPreferences, contentOf(), targetOf(), ADMIN_TERMINAL_ROUTE, basename(), ChildKind, deserializeLocation(), formatPath() (+26 more)

### Community 52 - "fs-commands.test.mjs"
Cohesion: 0.09
Nodes (20): BY_NAME, CONCEPTS, DETAIL, __dirname, failOnce, FS, GLYPHS, L (+12 more)

### Community 53 - "use-terminal-session.ts"
Cohesion: 0.10
Nodes (39): StudentAppShellLayout(), useTerminalLogout(), Console(), candidateOf(), chunkEnd(), pageRows(), PagerState, PendingQuestion (+31 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "UpdateInstructorBioDto"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsOptional, IsString, MaxLength, UpdateInstructorBioDto

### Community 68 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 69 - "InstructorAnalyticsController"
Cohesion: 0.15
Nodes (13): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+5 more)

### Community 70 - "QuizController"
Cohesion: 0.25
Nodes (12): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 71 - "Concept"
Cohesion: 0.13
Nodes (11): slugify(), InjectRepository, InjectRepository, ConceptsService, Injectable, InjectRepository, Concept, Column (+3 more)

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "RegisterDto"
Cohesion: 0.13
Nodes (12): LoginDto, ApiProperty, IsEmail, IsString, RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail (+4 more)

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

### Community 81 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 82 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, !**/*.spec.ts, **/*.(t|j)s

### Community 83 - "check-theme-separation.mjs"
Cohesion: 0.25
Nodes (5): __dirname, GUARDED, ROOT, RULES, violations

### Community 84 - "users.controller.ts"
Cohesion: 0.35
Nodes (4): Roles(), ROLES_KEY, RolesGuard, Injectable

### Community 85 - "ForgotPasswordDto"
Cohesion: 0.18
Nodes (7): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, EmailModule, EmailService, Injectable

### Community 88 - "ChangePasswordDto"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 90 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 95 - "RequestDeletionDto"
Cohesion: 0.33
Nodes (5): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength

### Community 98 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 117 - "factories.ts"
Cohesion: 0.08
Nodes (38): ConceptDifficulty, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeOption(), makeProgress(), makeQuestion() (+30 more)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 136 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 143 - "concept.entity.ts"
Cohesion: 0.19
Nodes (21): ConceptReviewStatus, InstructorStatus, UserRole, makeConcept(), makeUser(), createMockQueryBuilder(), createMockRepository(), MockRepository (+13 more)

### Community 145 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, Matches, VerifyOtpDto

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (41): AiGenerationJobStatus, AiGenerationType, addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn(), AiGenerateService (+33 more)

## Knowledge Gaps
- **407 isolated node(s):** `PagerState`, `__dirname`, `loaded`, `EXTERNAL`, `CATALOGUE` (+402 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **81 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `roadmaps.service.ts`, `.answerReviewItem`, `ConceptsController`, `GetActivityQueryDto`, `roadmaps.controller.ts`, `assignments.module.ts`, `McqQuestion`, `user.entity.ts`, `concept.entity.ts`, `AuthController`, `ai-generate.service.ts`, `AiGenerationJob`, `qa.controller.ts`, `review.service.ts`, `AdminContentReviewController`, `auth.controller.ts`, `UserConceptProgress`, `CurrentUser`, `PasswordResetOtp`, `QuizService`, `InstructorAnalyticsController`, `QuizController`, `Concept`, `ProgressController`, `users.controller.ts`, `factories.ts`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `roadmaps.service.ts`, `.answerReviewItem`, `ConceptsController`, `GetActivityQueryDto`, `auth.controller.ts`, `InstructorAnalyticsController`, `roadmaps.controller.ts`, `QuizController`, `ProgressController`, `QuizService`, `AuthController`, `ai-generate.service.ts`, `AiGenerationJob`, `users.controller.ts`, `factories.ts`, `qa.controller.ts`, `review.service.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `UsersService` connect `UsersService` to `roadmaps.service.ts`, `auth.controller.ts`, `RegisterDto`, `PasswordResetOtp`, `concept.entity.ts`, `users.controller.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `PagerState`, `__dirname`, `loaded` to the rest of the system?**
  _407 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.07682177348551361 - nodes in this community are weakly interconnected._
- **Should `roadmaps.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07796610169491526 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.0953058321479374 - nodes in this community are weakly interconnected._