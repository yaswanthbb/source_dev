# Graph Report - knowledge_is_power  (2026-09-09)

## Corpus Check
- 238 files · ~210,314 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1700 nodes · 3903 edges · 169 communities (76 shown, 93 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ed8e56f1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- app.module.ts
- User
- ReviewService
- ConceptsService
- GetActivityQueryDto
- qa.service.ts
- Concept
- AiGenerateController
- api-client.ts
- assignments.module.ts
- concepts.service.ts
- Added
- typeorm.config.ts
- UserConceptProgress
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- QaController
- user.entity.ts
- collectCoverageFrom
- OneToMany
- useSnackbar
- compilerOptions
- AnalyticsController
- gamification.service.spec.ts
- student/layout.tsx
- dependencies
- edit/page.tsx
- AdminContentReviewController
- RegisterDto
- scripts
- devDependencies
- app/layout.tsx
- getUser
- dependencies
- Content Authoring Flow
- jest
- auth.controller.ts
- Controller
- forgot-password/page.tsx
- RoadmapsService
- Next.js Frontend Application
- frontend/package.json
- auth.module.ts
- QuizController
- CreateQuestionDto
- exclude
- eslint-plugin-prettier
- auth.ts
- nest-cli.json
- qa.service.spec.ts
- GenerateConceptContentDto
- QaService
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
- Injectable
- QuizService
- RejectConceptDto
- ReviewItem
- [roadmapId]/page.tsx
- factories.ts
- ProgressController
- backend/package.json
- UpdateOptionDto
- ChangePasswordDto
- devDependencies
- AddOAuthColumns1787300000000
- globals
- RequestDeletionDto
- @nestjs/cli
- UpdateInstructorBioDto
- ForgotPasswordDto
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
- UpdateOwnProfileDto
- roadmaps.service.ts
- typescript-eslint
- frontend/eslint.config.mjs
- next.config.ts
- LoginDto
- react-hook-form
- react-markdown
- remark-gfm
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- tailwind.config.ts
- Application Icon
- Application Logo
- ApplyInstructorDto
- UpdateQuestionDto
- SubmitAttemptDto
- eslint
- @types/bcrypt
- @types/passport-github2
- @types/passport-google-oauth20
- lucide-react
- dependencies
- jest
- Get
- eslint-config-prettier
- ApiBearerAuth
- ApiOperation
- ApiResponse
- ApiTags
- Controller
- Get
- UseGuards
- Injectable
- InjectRepository
- AddQaAnswerAiSupport1787500000000
- @types/supertest
- typescript
- ApiProperty
- ai-generate.service.ts
- Req
- Res
- IsEnum
- MaxLength
- Query
- AddAiGenerationJobs1787600000000
- ApiBearerAuth
- ApiOperation
- ApiResponse
- ApiTags
- Body
- Controller
- Get
- Post
- Req
- Res
- UseGuards
- Injectable
- InjectRepository
- ApiProperty
- ApiPropertyOptional
- IsArray
- IsNotEmpty
- IsOptional
- IsString
- IsUUID
- AddAiJobRetryAndAck1787700000000

## God Nodes (most connected - your core abstractions)
1. `User` - 109 edges
2. `Concept` - 57 edges
3. `BaseEntity` - 42 edges
4. `McqQuestion` - 41 edges
5. `useSnackbar()` - 41 edges
6. `CurrentUser` - 40 edges
7. `UsersService` - 38 edges
8. `AiGenerateService` - 38 edges
9. `Module` - 32 edges
10. `Roadmap` - 31 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `CreateRoadmapPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/instructor/content/new/page.tsx → frontend/providers/snackbar-provider.tsx
- `StudentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/student/review/page.tsx → frontend/providers/snackbar-provider.tsx
- `RootPage()` --calls--> `getToken()`  [EXTRACTED]
  frontend/app/page.tsx → frontend/lib/auth.ts
- `RetroHomepage()` --calls--> `useTheme()`  [EXTRACTED]
  frontend/components/home/retro-homepage.tsx → frontend/providers/theme-provider.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (169 total, 93 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.07
Nodes (21): JwtStrategy, Injectable, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+13 more)

### Community 1 - "app.module.ts"
Cohesion: 0.08
Nodes (38): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, ContentModule, ModuleConcept, Column (+30 more)

### Community 2 - "User"
Cohesion: 0.12
Nodes (23): InstructorStatus, JwtPayload, GetUsersQueryDto, ApiPropertyOptional, IsEnum, IsOptional, IsString, AccountDeletionRequest (+15 more)

### Community 3 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 4 - "ConceptsService"
Cohesion: 0.10
Nodes (18): ApiQuery, ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+10 more)

### Community 5 - "GetActivityQueryDto"
Cohesion: 0.12
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 6 - "qa.service.ts"
Cohesion: 0.14
Nodes (15): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsNotEmpty, IsOptional (+7 more)

### Community 7 - "Concept"
Cohesion: 0.22
Nodes (7): InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne, InjectRepository

### Community 8 - "AiGenerateController"
Cohesion: 0.11
Nodes (21): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, AppController, AppService, Injectable, AiGenerateController (+13 more)

### Community 9 - "api-client.ts"
Cohesion: 0.13
Nodes (13): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, CreateRoadmapPage(), AnswerResult, DueReviewItem, ReviewOption (+5 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "concepts.service.ts"
Cohesion: 0.12
Nodes (16): boundedLevenshtein(), hasSignificantContentChange(), slugify(), CreateConceptDto, ApiProperty, ApiPropertyOptional, IsEnum, IsNotEmpty (+8 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "typeorm.config.ts"
Cohesion: 0.11
Nodes (28): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, AiGenerationLog, Column, Entity (+20 more)

### Community 14 - "UserConceptProgress"
Cohesion: 0.14
Nodes (11): GamificationService, Injectable, Column, Entity, JoinColumn, ManyToOne, Unique, UserConceptProgress (+3 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.07
Nodes (37): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+29 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.19
Nodes (15): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+7 more)

### Community 18 - "QaController"
Cohesion: 0.25
Nodes (12): QaController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 19 - "user.entity.ts"
Cohesion: 0.24
Nodes (10): UserRole, CurrentUser, Roles(), ROLES_KEY, RolesGuard, Injectable, InstructorConceptAnalytics, InstructorOverviewAnalytics (+2 more)

### Community 20 - "collectCoverageFrom"
Cohesion: 0.29
Nodes (7): collectCoverageFrom, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, **/*.(t|j)s

### Community 22 - "useSnackbar"
Cohesion: 0.09
Nodes (29): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+21 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (14): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+6 more)

### Community 25 - "gamification.service.spec.ts"
Cohesion: 0.10
Nodes (28): ConceptDifficulty, makeBadge(), makeStreak(), makeUserBadge(), makeXpEvent(), Badge, Column, Entity (+20 more)

### Community 26 - "student/layout.tsx"
Cohesion: 0.12
Nodes (21): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), NAV_ITEMS, StudentAppShellLayout() (+13 more)

### Community 27 - "dependencies"
Cohesion: 0.05
Nodes (43): dependencies, bcrypt, class-transformer, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core (+35 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.16
Nodes (14): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+6 more)

### Community 30 - "RegisterDto"
Cohesion: 0.29
Nodes (6): RegisterDto, ApiProperty, IsEmail, IsNotEmpty, IsString, MinLength

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.14
Nodes (12): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), SnackbarProvider() (+4 more)

### Community 34 - "getUser"
Cohesion: 0.16
Nodes (13): InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, ConceptSummary, InstructorQaPage(), QaAnswer, QaQuestion (+5 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "Content Authoring Flow"
Cohesion: 0.19
Nodes (14): Automated Achievement Badges, Concept (Lesson), Concept Prerequisites Engine, Content Authoring Flow, Curriculum Architecture & Hierarchy, Experience Points (XP) System, Gamification Engine, Instructor Studio & Analytics (+6 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$ (+3 more)

### Community 38 - "auth.controller.ts"
Cohesion: 0.07
Nodes (23): IS_PUBLIC_KEY, Public(), LinkOAuthDto, ApiProperty, IsNotEmpty, IsString, ResetPasswordDto, ApiProperty (+15 more)

### Community 40 - "forgot-password/page.tsx"
Cohesion: 0.20
Nodes (8): EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData, otpStepSchema, PasswordStepFormData, passwordStepSchema, ResetStep

### Community 41 - "RoadmapsService"
Cohesion: 0.11
Nodes (17): RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+9 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "auth.module.ts"
Cohesion: 0.10
Nodes (16): AuthService, NOW, Injectable, InjectRepository, PasswordResetOtp, Column, Entity, JoinColumn (+8 more)

### Community 45 - "QuizController"
Cohesion: 0.21
Nodes (12): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 46 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, dist, !**/*.spec.ts, test, ./tsconfig.json

### Community 49 - "auth.ts"
Cohesion: 0.13
Nodes (23): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, BasicInfoFormData (+15 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "qa.service.spec.ts"
Cohesion: 0.16
Nodes (14): AuthModule, Answer, Column, Entity, JoinColumn, ManyToOne, Question, Column (+6 more)

### Community 52 - "GenerateConceptContentDto"
Cohesion: 0.33
Nodes (13): ApiProperty, ApiPropertyOptional, AcknowledgeJobsDto, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto, GenerateRoadmapModulesDto (+5 more)

### Community 53 - "QaService"
Cohesion: 0.22
Nodes (3): QaService, Injectable, InjectRepository

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 70 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 71 - "ReviewItem"
Cohesion: 0.25
Nodes (7): ReviewItem, Column, Entity, JoinColumn, ManyToOne, Unique, InjectRepository

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.11
Nodes (24): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+16 more)

### Community 73 - "factories.ts"
Cohesion: 0.24
Nodes (15): ConceptReviewStatus, ProgressStatus, XpSource, FIXED_DATE, makeAttempt(), makeConcept(), makeOption(), makeProgress() (+7 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 76 - "UpdateOptionDto"
Cohesion: 0.33
Nodes (5): IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto

### Community 77 - "ChangePasswordDto"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/eslintrc, @eslint/js, @nestjs/schematics, @nestjs/testing, @eslint/eslintrc, @eslint/js, @nestjs/schematics (+1 more)

### Community 81 - "RequestDeletionDto"
Cohesion: 0.33
Nodes (5): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength

### Community 83 - "UpdateInstructorBioDto"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsOptional, IsString, UpdateInstructorBioDto, MaxLength

### Community 84 - "ForgotPasswordDto"
Cohesion: 0.40
Nodes (4): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty

### Community 97 - "UpdateOwnProfileDto"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, UpdateOwnProfileDto

### Community 98 - "roadmaps.service.ts"
Cohesion: 0.07
Nodes (32): AddModulePrerequisiteDto, ApiProperty, IsUUID, AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional (+24 more)

### Community 105 - "LoginDto"
Cohesion: 0.40
Nodes (4): LoginDto, ApiProperty, IsEmail, IsString

### Community 116 - "ApplyInstructorDto"
Cohesion: 0.40
Nodes (4): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString

### Community 117 - "UpdateQuestionDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateQuestionDto

### Community 118 - "SubmitAttemptDto"
Cohesion: 0.50
Nodes (3): SubmitAttemptDto, ApiProperty, IsUUID

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.09
Nodes (24): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, AiGenerateService, ParsedMcqOption, ParsedMcqQuestion, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt() (+16 more)

## Knowledge Gaps
- **329 isolated node(s):** `JwtPayload`, `ParsedMcqOption`, `ParsedMcqQuestion`, `AttemptResponse`, `ConceptDetail` (+324 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **93 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `app.module.ts`, `ReviewService`, `ConceptsService`, `GetActivityQueryDto`, `qa.service.ts`, `Concept`, `assignments.module.ts`, `concepts.service.ts`, `typeorm.config.ts`, `UserConceptProgress`, `ai-generate.service.ts`, `user.entity.ts`, `QaController`, `gamification.service.spec.ts`, `auth.controller.ts`, `auth.module.ts`, `QuizController`, `qa.service.spec.ts`, `QuizService`, `ReviewItem`, `factories.ts`, `ProgressController`, `roadmaps.service.ts`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `AiGenerateService` connect `ai-generate.service.ts` to `app.module.ts`, `qa.service.ts`, `AiGenerateController`, `RoadmapsService`, `user.entity.ts`, `qa.service.spec.ts`, `QaService`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `user.entity.ts` to `roadmaps.service.ts`, `ReviewService`, `ConceptsService`, `GetActivityQueryDto`, `auth.controller.ts`, `qa.service.ts`, `ProgressController`, `QuizController`, `QaController`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `JwtPayload`, `ParsedMcqOption`, `ParsedMcqQuestion` to the rest of the system?**
  _329 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.07484909456740442 - nodes in this community are weakly interconnected._
- **Should `app.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08295625942684766 - nodes in this community are weakly interconnected._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.12473118279569892 - nodes in this community are weakly interconnected._