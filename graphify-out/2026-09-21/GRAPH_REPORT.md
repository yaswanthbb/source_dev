# Graph Report - knowledge_is_power  (2026-09-20)

## Corpus Check
- 265 files · ~244,633 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2031 nodes · 4848 edges · 160 communities (78 shown, 82 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `40e39b72`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- concept.entity.ts
- useTheme
- ReviewService
- ConceptsController
- GetActivityQueryDto
- User
- ApiBearerAuth
- roadmaps.controller.ts
- RegisterDto
- assignments.module.ts
- commands.ts
- Added
- factories.ts
- terminal-workspace.tsx
- Concept
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
- Module
- AdminContentReviewController
- edit/page.tsx
- scripts
- devDependencies
- app/layout.tsx
- fs-commands.ts
- dependencies
- ai-generate.service.ts
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
- ai-generate.controller.ts
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
- InstructorAnalyticsController
- use-roadmap-progress.ts
- ConceptsService
- [roadmapId]/page.tsx
- AuthService
- ProgressController
- backend/package.json
- next.config.ts
- LinkOAuthDto
- devDependencies
- AddOAuthColumns1787300000000
- tailwind.config.ts
- ResetPasswordDto
- collectCoverageFrom
- check-theme-separation.mjs
- CreateModuleDto
- GitHubStrategy
- @nestjs/passport
- ChangePasswordDto
- location.test.mjs
- AddUserPreferences1787800000000
- axios
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
- admin/dashboard/page.tsx
- react-hook-form
- react-markdown
- remark-gfm
- AddQaAnswerAiSupport1787500000000
- eslint-config-prettier
- user.entity.ts
- AiGenerateService
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
- `Token()` --calls--> `getTheme()`  [EXTRACTED]
  frontend/components/terminal/terminal-workspace.tsx → frontend/components/terminal/themes/index.ts
- `FetchBlock()` --calls--> `getTheme()`  [EXTRACTED]
  frontend/components/terminal/terminal-workspace.tsx → frontend/components/terminal/themes/index.ts
- `Console()` --calls--> `getTheme()`  [EXTRACTED]
  frontend/components/terminal/terminal-workspace.tsx → frontend/components/terminal/themes/index.ts
- `useTerminalSession()` --calls--> `bootSequence()`  [EXTRACTED]
  frontend/components/terminal/use-terminal-session.ts → frontend/lib/terminal/commands.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (160 total, 82 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.08
Nodes (22): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, JwtPayload, JwtStrategy, Injectable, UsersController (+14 more)

### Community 1 - "concept.entity.ts"
Cohesion: 0.14
Nodes (23): ConceptReviewStatus, ModuleConcept, Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique (+15 more)

### Community 2 - "useTheme"
Cohesion: 0.08
Nodes (29): CallbackHandler(), emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, LoginPage(), LoginStage (+21 more)

### Community 3 - "ReviewService"
Cohesion: 0.10
Nodes (21): addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn(), AnswerReviewItemDto, ApiProperty, IsNotEmpty (+13 more)

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
Nodes (28): Roles(), ROLES_KEY, RolesGuard, Injectable, AddModulePrerequisiteDto, ApiProperty, IsUUID, CreateRoadmapDto (+20 more)

### Community 9 - "RegisterDto"
Cohesion: 0.09
Nodes (23): IsIanaTimezone(), RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional, IsString (+15 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.07
Nodes (29): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+21 more)

### Community 11 - "commands.ts"
Cohesion: 0.05
Nodes (59): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), avatar(), bootFetch(), BootLine, bootLines() (+51 more)

### Community 12 - "Added"
Cohesion: 0.13
Nodes (14): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changed, Changelog, Developer experience (+6 more)

### Community 13 - "factories.ts"
Cohesion: 0.10
Nodes (37): FIXED_DATE, makeAttempt(), makeConcept(), makeOption(), makeProgress(), makeQuestion(), makeReviewItem(), makeUser() (+29 more)

### Community 14 - "terminal-workspace.tsx"
Cohesion: 0.07
Nodes (26): openingCommand(), StudentTerminalPage(), CodeBlock(), DOC_HEADINGS, FetchBlock(), HIGHLIGHT_KEYWORDS, highlightCode(), Line() (+18 more)

### Community 15 - "Concept"
Cohesion: 0.12
Nodes (20): InjectRepository, InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne, InjectRepository (+12 more)

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
Nodes (18): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+10 more)

### Community 20 - "learning-commands.ts"
Cohesion: 0.06
Nodes (54): allThreads(), askerIdOf(), askerOf(), askQuestion(), AttemptResult, body(), catalog(), clearLearningCache() (+46 more)

### Community 22 - "api-client.ts"
Cohesion: 0.08
Nodes (36): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+28 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (12): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+4 more)

### Community 25 - "commands.test.mjs"
Cohesion: 0.16
Nodes (9): attemptOrFail(), catalogOrFail(), CATALOGUE, commands, __dirname, EXTERNAL, fail(), { installGlyphs } (+1 more)

### Community 26 - "auth.ts"
Cohesion: 0.09
Nodes (35): ADMIN_NAV_ITEMS, AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, FullUser, INSTRUCTOR_NAV_ITEMS (+27 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "Module"
Cohesion: 0.15
Nodes (19): AppModule, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, Module, Column (+11 more)

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
Nodes (39): CommandCtx, CommandSpec, cat, cd, closeConcept(), contentOf(), FS_COMMANDS, history (+31 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "ai-generate.service.ts"
Cohesion: 0.13
Nodes (17): BaseEntity, CreateDateColumn, UpdateDateColumn, AiGenerationJobStatus, AiGenerationType, dataSourceOptions, entities, typeOrmAsyncConfig (+9 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$ (+3 more)

### Community 38 - "auth.controller.ts"
Cohesion: 0.10
Nodes (14): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, GitHubAuthGuard, Injectable, GoogleAuthGuard, Injectable (+6 more)

### Community 39 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 40 - "UserConceptProgress"
Cohesion: 0.16
Nodes (11): ProgressStatus, AnalyticsService, Injectable, Column, Entity, JoinColumn, ManyToOne, Unique (+3 more)

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
Cohesion: 0.19
Nodes (16): clearHistory(), CommandHelp, FetchReport, FetchRow, HelpRow, history, LineKind, LineSegment (+8 more)

### Community 45 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.12
Nodes (24): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+16 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 48 - "ai-generate.controller.ts"
Cohesion: 0.35
Nodes (13): AcknowledgeJobsDto, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto, GenerateRoadmapModulesDto, ApiProperty, ApiPropertyOptional (+5 more)

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
Cohesion: 0.11
Nodes (26): useTerminalLogout(), Console(), chunkEnd(), pageRows(), PagerState, PendingQuestion, PendingSelect, sleep() (+18 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 68 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 69 - "InstructorAnalyticsController"
Cohesion: 0.15
Nodes (13): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+5 more)

### Community 70 - "use-roadmap-progress.ts"
Cohesion: 0.25
Nodes (5): ConceptProgressInfo, ModuleConceptItem, RoadmapDetailData, RoadmapModuleItem, RoadmapProgressData

### Community 71 - "ConceptsService"
Cohesion: 0.18
Nodes (5): slugify(), InjectRepository, ConceptsService, Injectable, InjectRepository

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "AuthService"
Cohesion: 0.14
Nodes (11): AuthService, Injectable, LoginDto, ApiProperty, IsEmail, IsString, ApiProperty, IsEmail (+3 more)

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

### Community 81 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 82 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, !**/*.spec.ts, **/*.(t|j)s

### Community 83 - "check-theme-separation.mjs"
Cohesion: 0.25
Nodes (5): __dirname, GUARDED, ROOT, RULES, violations

### Community 84 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 88 - "ChangePasswordDto"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 90 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 98 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 117 - "gamification.service.ts"
Cohesion: 0.09
Nodes (31): ConceptDifficulty, XpSource, makeBadge(), makeStreak(), makeUserBadge(), makeXpEvent(), Badge, Column (+23 more)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 136 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 143 - "user.entity.ts"
Cohesion: 0.16
Nodes (21): InstructorStatus, UserRole, MostMissedOption, GetUsersQueryDto, ApiPropertyOptional, IsEnum, IsOptional, IsString (+13 more)

### Community 146 - "AiGenerateService"
Cohesion: 0.15
Nodes (14): AiGenerationJobType, AiGenerateService, Injectable, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), buildModuleConceptsUserPrompt(), buildQaAnswerUserPrompt(), buildRoadmapModulesUserPrompt() (+6 more)

## Knowledge Gaps
- **412 isolated node(s):** `HIGHLIGHT_KEYWORDS`, `DOC_HEADINGS`, `SWATCHES`, `PendingSelect`, `SuggestRow` (+407 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **82 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `concept.entity.ts`, `ReviewService`, `ConceptsController`, `GetActivityQueryDto`, `roadmaps.controller.ts`, `assignments.module.ts`, `factories.ts`, `Concept`, `user.entity.ts`, `AuthController`, `AiGenerateService`, `AiGenerationJob`, `qa.controller.ts`, `AdminContentReviewController`, `ai-generate.service.ts`, `auth.controller.ts`, `UserConceptProgress`, `CurrentUser`, `QuizService`, `ai-generate.controller.ts`, `InstructorAnalyticsController`, `ConceptsService`, `ProgressController`, `gamification.service.ts`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `UsersController` connect `UsersService` to `roadmaps.controller.ts`, `user.entity.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `concept.entity.ts`, `ReviewService`, `ConceptsController`, `GetActivityQueryDto`, `auth.controller.ts`, `InstructorAnalyticsController`, `roadmaps.controller.ts`, `ProgressController`, `QuizService`, `ai-generate.controller.ts`, `AuthController`, `qa.controller.ts`, `AiGenerationJob`, `gamification.service.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `HIGHLIGHT_KEYWORDS`, `DOC_HEADINGS`, `SWATCHES` to the rest of the system?**
  _412 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.07682177348551361 - nodes in this community are weakly interconnected._
- **Should `concept.entity.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14102564102564102 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.08305647840531562 - nodes in this community are weakly interconnected._