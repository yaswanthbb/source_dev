# Graph Report - knowledge_is_power  (2026-09-12)

## Corpus Check
- 249 files · ~239,680 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1772 nodes · 4215 edges · 149 communities (77 shown, 72 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a274c589`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Roles
- Module
- useTheme
- ReviewController
- ConceptsService
- GamificationController
- RoadmapsService
- UsersService
- ai-generate.service.ts
- RegisterDto
- assignments.module.ts
- commands.ts
- Added
- McqQuestion
- Concept
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- qa.controller.ts
- instructor-analytics.service.ts
- collectCoverageFrom
- CreateQuestionDto
- api-client.ts
- compilerOptions
- instructor-analytics.controller.ts
- quiz.controller.ts
- auth.ts
- dependencies
- edit/page.tsx
- AdminContentReviewController
- QuizService
- scripts
- devDependencies
- getUser
- StudentDashboardPage
- dependencies
- Content Authoring Flow
- jest
- auth.controller.ts
- AppController
- analytics.service.ts
- User
- Next.js Frontend Application
- frontend/package.json
- auth.module.ts
- CurrentUser
- student/dashboard/page.tsx
- exclude
- eslint-plugin-prettier
- GamificationService
- nest-cli.json
- user.entity.ts
- ReviewService
- minimal-terminal-loader.tsx
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
- admin/dashboard/page.tsx
- todayIn
- GetActivityQueryDto
- auth.service.ts
- Roadmap
- [roadmapId]/page.tsx
- factories.ts
- ProgressService
- backend/package.json
- timezone.ts
- users.service.ts
- devDependencies
- AddOAuthColumns1787300000000
- globals
- ResetPasswordDto
- @nestjs/cli
- axios
- @nestjs/passport
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
- lucide-react
- roadmaps.controller.ts
- typescript-eslint
- PasswordResetOtp
- frontend/eslint.config.mjs
- next.config.ts
- eslint-config-prettier
- react-hook-form
- react-markdown
- remark-gfm
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- tailwind.config.ts
- Application Icon
- Application Logo
- review.controller.ts
- JwtAuthGuard
- class-transformer
- @nestjs/platform-express
- eslint
- @types/bcrypt
- @types/passport-github2
- @types/passport-google-oauth20
- LinkOAuthDto
- @nestjs/swagger
- passport
- dependencies
- passport-github2
- image.ts
- .attachPrerequisite
- passport-jwt
- pg
- typeorm
- @eslint/eslintrc
- @nestjs/schematics
- @nestjs/testing
- Patch
- ApiProperty
- IsEmail
- AddQaAnswerAiSupport1787500000000
- MinLength
- IsInt
- Min
- Type
- Query
- AiGenerateService
- AddAiGenerationJobs1787600000000
- AddAiJobRetryAndAck1787700000000

## God Nodes (most connected - your core abstractions)
1. `User` - 160 edges
2. `CurrentUser` - 60 edges
3. `Concept` - 59 edges
4. `BaseEntity` - 46 edges
5. `McqQuestion` - 40 edges
6. `Module` - 39 edges
7. `AiGenerateService` - 38 edges
8. `UsersService` - 38 edges
9. `useSnackbar()` - 35 edges
10. `Roadmap` - 33 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `CreateConceptPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/instructor/concepts/new/page.tsx → frontend/providers/snackbar-provider.tsx
- `RegisterPage()` --calls--> `detectTimezone()`  [EXTRACTED]
  frontend/app/(auth)/register/page.tsx → frontend/lib/timezone.ts
- `CallbackHandler()` --calls--> `syncTimezoneForNewAccount()`  [EXTRACTED]
  frontend/app/auth/callback/page.tsx → frontend/lib/timezone.ts
- `StudentDashboardPage()` --calls--> `clearAuth()`  [EXTRACTED]
  frontend/app/student/dashboard/page.tsx → frontend/lib/auth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (149 total, 72 thin omitted)

### Community 0 - "Roles"
Cohesion: 0.16
Nodes (15): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+7 more)

### Community 1 - "Module"
Cohesion: 0.15
Nodes (18): AppModule, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, Module, Column (+10 more)

### Community 2 - "useTheme"
Cohesion: 0.10
Nodes (25): CallbackHandler(), emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, LoginPage(), LoginStage (+17 more)

### Community 3 - "ReviewController"
Cohesion: 0.20
Nodes (11): ReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+3 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (32): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags (+24 more)

### Community 5 - "GamificationController"
Cohesion: 0.24
Nodes (9): GamificationController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+1 more)

### Community 7 - "UsersService"
Cohesion: 0.11
Nodes (6): JwtPayload, JwtStrategy, Injectable, Injectable, InjectRepository, UsersService

### Community 8 - "ai-generate.service.ts"
Cohesion: 0.09
Nodes (41): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, ParsedMcqOption, ParsedMcqQuestion, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), buildModuleConceptsUserPrompt() (+33 more)

### Community 9 - "RegisterDto"
Cohesion: 0.13
Nodes (14): ApiProperty, IsIanaTimezone(), RegisterDto, ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, ApiPropertyOptional (+6 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "commands.ts"
Cohesion: 0.08
Nodes (26): applyInstructor, clear, COMMAND_LIST, CommandCtx, COMMANDS, CommandSpec, deleteAccount, DeletionRequest (+18 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "McqQuestion"
Cohesion: 0.18
Nodes (17): InjectRepository, McqAttempt, Column, Entity, JoinColumn, ManyToOne, McqOption, Column (+9 more)

### Community 14 - "Concept"
Cohesion: 0.13
Nodes (23): ConceptReviewStatus, InjectRepository, InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne (+15 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.10
Nodes (27): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+19 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.12
Nodes (18): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+10 more)

### Community 18 - "qa.controller.ts"
Cohesion: 0.07
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+23 more)

### Community 19 - "instructor-analytics.service.ts"
Cohesion: 0.24
Nodes (11): InstructorStatus, UserRole, makeUser(), slugify(), MostMissedOption, InstructorProfile, Column, Entity (+3 more)

### Community 20 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !**/*.spec.ts, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, **/*.(t|j)s

### Community 21 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

### Community 22 - "api-client.ts"
Cohesion: 0.07
Nodes (39): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+31 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "instructor-analytics.controller.ts"
Cohesion: 0.07
Nodes (30): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+22 more)

### Community 25 - "quiz.controller.ts"
Cohesion: 0.13
Nodes (14): SubmitAttemptDto, ApiProperty, IsUUID, IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto (+6 more)

### Community 26 - "auth.ts"
Cohesion: 0.11
Nodes (29): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), BasicInfoFormData, basicInfoSchema (+21 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.10
Nodes (22): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+14 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.14
Nodes (15): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+7 more)

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "getUser"
Cohesion: 0.11
Nodes (18): InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, inter, metadata, outfit, rubik (+10 more)

### Community 34 - "StudentDashboardPage"
Cohesion: 0.22
Nodes (13): badgeTag(), ordinal(), pad(), plural(), stableNumber(), StudentDashboardPage(), bootLines(), completeCommand() (+5 more)

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
Cohesion: 0.19
Nodes (9): ApiProperty, IsEmail, IsNotEmpty, VerifyOtpDto, GitHubAuthGuard, Injectable, GoogleAuthGuard, Injectable (+1 more)

### Community 39 - "AppController"
Cohesion: 0.23
Nodes (8): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable, Public()

### Community 40 - "analytics.service.ts"
Cohesion: 0.24
Nodes (8): ProgressStatus, InjectRepository, Column, Entity, JoinColumn, ManyToOne, Unique, UserConceptProgress

### Community 41 - "User"
Cohesion: 0.13
Nodes (17): RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+9 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "auth.module.ts"
Cohesion: 0.17
Nodes (7): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable, EmailModule, UsersModule

### Community 45 - "CurrentUser"
Cohesion: 0.26
Nodes (13): CurrentUser, QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+5 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.11
Nodes (16): ACTIVITY_SCALE, ActivityDay, BadgeDef, DARK, EarnedBadgeItem, GamificationData, LIGHT, MONTHS (+8 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 49 - "GamificationService"
Cohesion: 0.20
Nodes (4): GamificationService, Injectable, InjectRepository, InjectRepository

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "user.entity.ts"
Cohesion: 0.10
Nodes (25): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, typeOrmAsyncConfig, Answer, Column (+17 more)

### Community 52 - "ReviewService"
Cohesion: 0.29
Nodes (3): ReviewService, Injectable, InjectRepository

### Community 53 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 68 - "todayIn"
Cohesion: 0.58
Nodes (5): addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn()

### Community 69 - "GetActivityQueryDto"
Cohesion: 0.25
Nodes (7): GetActivityQueryDto, ApiPropertyOptional, IsOptional, IsInt, Max, Min, Type

### Community 70 - "auth.service.ts"
Cohesion: 0.16
Nodes (10): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString (+2 more)

### Community 71 - "Roadmap"
Cohesion: 0.26
Nodes (10): createMockQueryBuilder(), createMockRepository(), MockRepository, NOW, Roadmap, Column, Entity, JoinColumn (+2 more)

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "factories.ts"
Cohesion: 0.09
Nodes (36): ConceptDifficulty, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeConcept(), makeOption(), makeProgress() (+28 more)

### Community 74 - "ProgressService"
Cohesion: 0.16
Nodes (13): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+5 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 76 - "timezone.ts"
Cohesion: 0.52
Nodes (6): detectTimezone(), formatClock(), formatDate(), safeZone(), syncTimezoneForNewAccount(), zoneAbbrev()

### Community 77 - "users.service.ts"
Cohesion: 0.08
Nodes (30): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, ChangePasswordDto, ApiProperty, IsNotEmpty, IsString (+22 more)

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 98 - "roadmaps.controller.ts"
Cohesion: 0.07
Nodes (29): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min, CreateModuleDto (+21 more)

### Community 102 - "PasswordResetOtp"
Cohesion: 0.33
Nodes (6): PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne

### Community 116 - "review.controller.ts"
Cohesion: 0.40
Nodes (4): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID

### Community 117 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 124 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 129 - "image.ts"
Cohesion: 0.40
Nodes (5): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), avatar()

### Community 130 - ".attachPrerequisite"
Cohesion: 0.40
Nodes (3): AddModulePrerequisiteDto, ApiProperty, IsUUID

### Community 146 - "AiGenerateService"
Cohesion: 0.10
Nodes (17): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+9 more)

## Knowledge Gaps
- **360 isolated node(s):** `ParsedMcqOption`, `ParsedMcqQuestion`, `RegisterStage`, `EarnedBadgeItem`, `GamificationData` (+355 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Roles`, `Module`, `.attachPrerequisite`, `ConceptsService`, `RoadmapsService`, `UsersService`, `ai-generate.service.ts`, `RegisterDto`, `assignments.module.ts`, `McqQuestion`, `Concept`, `qa.controller.ts`, `instructor-analytics.service.ts`, `instructor-analytics.controller.ts`, `quiz.controller.ts`, `AdminContentReviewController`, `auth.controller.ts`, `analytics.service.ts`, `auth.module.ts`, `CurrentUser`, `user.entity.ts`, `auth.service.ts`, `Roadmap`, `factories.ts`, `users.service.ts`, `roadmaps.controller.ts`, `PasswordResetOtp`, `review.controller.ts`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `Roles`, `roadmaps.controller.ts`, `.attachPrerequisite`, `ConceptsService`, `auth.controller.ts`, `ai-generate.service.ts`, `User`, `RegisterDto`, `users.service.ts`, `Concept`, `qa.controller.ts`, `instructor-analytics.service.ts`, `review.controller.ts`, `instructor-analytics.controller.ts`, `quiz.controller.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `AiGenerateService` connect `AiGenerateService` to `Module`, `Roadmap`, `ai-generate.service.ts`, `instructor-analytics.service.ts`, `user.entity.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `ParsedMcqOption`, `ParsedMcqQuestion`, `RegisterStage` to the rest of the system?**
  _360 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.10483870967741936 - nodes in this community are weakly interconnected._
- **Should `ConceptsService` be split into smaller, more focused modules?**
  _Cohesion score 0.06471631205673758 - nodes in this community are weakly interconnected._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._