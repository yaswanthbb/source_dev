# Graph Report - knowledge_is_power  (2026-08-27)

## Corpus Check
- 236 files · ~205,224 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1694 nodes · 3891 edges · 163 communities (71 shown, 92 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ff20b69`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- roadmaps.service.ts
- users.service.ts
- ReviewService
- ConceptsService
- GamificationService
- QaService
- Concept
- AiGenerateController
- api-client.ts
- assignments.module.ts
- roadmaps.controller.ts
- Added
- User
- concept.entity.ts
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- ai-generate.controller.ts
- app.module.ts
- collectCoverageFrom
- OneToMany
- useSnackbar
- compilerOptions
- AnalyticsController
- factories.ts
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
- JwtAuthGuard
- Controller
- forgot-password/page.tsx
- RoadmapsService
- Next.js Frontend Application
- frontend/package.json
- oauth-profile.interface.ts
- QuizService
- qa.service.ts
- exclude
- eslint-plugin-prettier
- auth.ts
- nest-cli.json
- VerifyOtpDto
- RequestDeletionDto
- auth.service.ts
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
- UpdateOwnProfileDto
- RejectConceptDto
- ApplyInstructorDto
- [roadmapId]/page.tsx
- GetUsersQueryDto
- CurrentUser
- backend/package.json
- ResetPasswordDto
- CreateModuleDto
- devDependencies
- AddOAuthColumns1787300000000
- globals
- ChangePasswordDto
- @nestjs/cli
- auth.controller.ts
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
- LoginDto
- @eslint/eslintrc
- typescript-eslint
- frontend/eslint.config.mjs
- next.config.ts
- @nestjs/schematics
- react-hook-form
- react-markdown
- remark-gfm
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- tailwind.config.ts
- Application Icon
- Application Logo
- @nestjs/testing
- eslint
- @types/bcrypt
- @types/passport-github2
- @types/passport-google-oauth20
- lucide-react
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
9. `Module` - 33 edges
10. `UserConceptProgress` - 31 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `StudentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/student/review/page.tsx → frontend/providers/snackbar-provider.tsx
- `exclude` --extends--> `!**/*.spec.ts`  [EXTRACTED]
  backend/tsconfig.build.json → backend/package.json
- `ModuleConcept` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/content/entities/module-concept.entity.ts → backend/src/common/entities/base.entity.ts
- `ModuleConcept` --references--> `Concept`  [EXTRACTED]
  backend/src/modules/content/entities/module-concept.entity.ts → backend/src/modules/content/entities/concept.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (163 total, 92 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.07
Nodes (26): JwtStrategy, Injectable, ApiPropertyOptional, IsOptional, IsString, UpdateInstructorBioDto, ApiBearerAuth, ApiOperation (+18 more)

### Community 1 - "roadmaps.service.ts"
Cohesion: 0.13
Nodes (22): ContentModule, ModuleConcept, Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique (+14 more)

### Community 2 - "users.service.ts"
Cohesion: 0.25
Nodes (13): InstructorStatus, makeUser(), createMockQueryBuilder(), createMockRepository(), MockRepository, MostMissedOption, DeletionRequestStatus, InstructorProfile (+5 more)

### Community 3 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 4 - "ConceptsService"
Cohesion: 0.05
Nodes (35): ApiQuery, ConceptDifficulty, boundedLevenshtein(), hasSignificantContentChange(), slugify(), ConceptsController, ApiBearerAuth, ApiOperation (+27 more)

### Community 5 - "GamificationService"
Cohesion: 0.07
Nodes (26): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+18 more)

### Community 6 - "QaService"
Cohesion: 0.09
Nodes (24): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsNotEmpty, IsOptional (+16 more)

### Community 7 - "Concept"
Cohesion: 0.13
Nodes (21): ProgressStatus, AnalyticsService, Injectable, InjectRepository, Concept, Column, Entity, JoinColumn (+13 more)

### Community 8 - "AiGenerateController"
Cohesion: 0.10
Nodes (24): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, AppController, AppService, Injectable, AiGenerateController (+16 more)

### Community 9 - "api-client.ts"
Cohesion: 0.15
Nodes (11): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, AnswerResult, DueReviewItem, ReviewOption, ReviewQuestion (+3 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "roadmaps.controller.ts"
Cohesion: 0.07
Nodes (27): AddModulePrerequisiteDto, ApiProperty, IsUUID, AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional (+19 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "User"
Cohesion: 0.07
Nodes (46): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, JwtPayload, Question, Column (+38 more)

### Community 14 - "concept.entity.ts"
Cohesion: 0.35
Nodes (4): ConceptReviewStatus, makeAttempt(), ProgressService, Injectable

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.07
Nodes (37): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+29 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.12
Nodes (18): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+10 more)

### Community 18 - "ai-generate.controller.ts"
Cohesion: 0.35
Nodes (13): ApiProperty, ApiPropertyOptional, AcknowledgeJobsDto, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto, GenerateRoadmapModulesDto (+5 more)

### Community 19 - "app.module.ts"
Cohesion: 0.13
Nodes (20): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, Module, Column (+12 more)

### Community 20 - "collectCoverageFrom"
Cohesion: 0.29
Nodes (7): collectCoverageFrom, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, **/*.(t|j)s

### Community 22 - "useSnackbar"
Cohesion: 0.08
Nodes (31): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+23 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (12): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+4 more)

### Community 25 - "factories.ts"
Cohesion: 0.10
Nodes (35): XpSource, FIXED_DATE, makeBadge(), makeConcept(), makeOption(), makeProgress(), makeQuestion(), makeReviewItem() (+27 more)

### Community 26 - "student/layout.tsx"
Cohesion: 0.13
Nodes (19): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), ProfilePage(), NAV_ITEMS (+11 more)

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
Nodes (13): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), AUTH_CHANGED_EVENT, QueryProvider() (+5 more)

### Community 34 - "getUser"
Cohesion: 0.22
Nodes (9): InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, ConceptSummary, InstructorQaPage(), QaAnswer, QaQuestion (+1 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "Content Authoring Flow"
Cohesion: 0.19
Nodes (14): Automated Achievement Badges, Concept (Lesson), Concept Prerequisites Engine, Content Authoring Flow, Curriculum Architecture & Hierarchy, Experience Points (XP) System, Gamification Engine, Instructor Studio & Analytics (+6 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$ (+3 more)

### Community 38 - "JwtAuthGuard"
Cohesion: 0.29
Nodes (4): IS_PUBLIC_KEY, Public(), JwtAuthGuard, Injectable

### Community 40 - "forgot-password/page.tsx"
Cohesion: 0.20
Nodes (8): EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData, otpStepSchema, PasswordStepFormData, passwordStepSchema, ResetStep

### Community 41 - "RoadmapsService"
Cohesion: 0.12
Nodes (17): RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+9 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "oauth-profile.interface.ts"
Cohesion: 0.20
Nodes (5): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable

### Community 45 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 46 - "qa.service.ts"
Cohesion: 0.29
Nodes (6): IsNotEmpty, IsString, UpdateAnswerDto, IsNotEmpty, IsString, UpdateQaQuestionDto

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, dist, !**/*.spec.ts, test, ./tsconfig.json

### Community 49 - "auth.ts"
Cohesion: 0.12
Nodes (25): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, BasicInfoFormData (+17 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, VerifyOtpDto, Matches

### Community 52 - "RequestDeletionDto"
Cohesion: 0.33
Nodes (5): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength

### Community 53 - "auth.service.ts"
Cohesion: 0.22
Nodes (8): NOW, PasswordResetOtp, Column, Entity, JoinColumn, ManyToOne, EmailModule, EmailService

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 69 - "UpdateOwnProfileDto"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, UpdateOwnProfileDto

### Community 70 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 71 - "ApplyInstructorDto"
Cohesion: 0.40
Nodes (4): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "GetUsersQueryDto"
Cohesion: 0.40
Nodes (5): GetUsersQueryDto, ApiPropertyOptional, IsEnum, IsOptional, IsString

### Community 74 - "CurrentUser"
Cohesion: 0.33
Nodes (6): UserRole, CurrentUser, Roles(), ROLES_KEY, RolesGuard, Injectable

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 76 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 77 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "ChangePasswordDto"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 83 - "auth.controller.ts"
Cohesion: 0.19
Nodes (9): LinkOAuthDto, ApiProperty, IsNotEmpty, IsString, GitHubAuthGuard, Injectable, GoogleAuthGuard, Injectable (+1 more)

### Community 84 - "ForgotPasswordDto"
Cohesion: 0.40
Nodes (4): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty

### Community 97 - "LoginDto"
Cohesion: 0.40
Nodes (4): LoginDto, ApiProperty, IsEmail, IsString

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (29): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, AiGenerateService, ParsedMcqOption, ParsedMcqQuestion, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt() (+21 more)

## Knowledge Gaps
- **328 isolated node(s):** `[Unreleased]`, `Accounts & authentication`, `Learning content`, `Progress & gamification`, `Quizzes & spaced repetition` (+323 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **92 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `roadmaps.service.ts`, `users.service.ts`, `ReviewService`, `ConceptsService`, `GamificationService`, `QaService`, `Concept`, `assignments.module.ts`, `roadmaps.controller.ts`, `concept.entity.ts`, `ai-generate.controller.ts`, `ai-generate.service.ts`, `app.module.ts`, `factories.ts`, `QuizService`, `qa.service.ts`, `auth.service.ts`, `CurrentUser`, `auth.controller.ts`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `roadmaps.service.ts`, `users.service.ts`, `ConceptsService`, `QaService`, `assignments.module.ts`, `CurrentUser`, `User`, `concept.entity.ts`, `qa.service.ts`, `ai-generate.service.ts`, `app.module.ts`, `factories.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `AiGenerateService` connect `ai-generate.service.ts` to `roadmaps.service.ts`, `users.service.ts`, `QaService`, `AiGenerateController`, `RoadmapsService`, `qa.service.ts`, `ai-generate.controller.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `[Unreleased]`, `Accounts & authentication`, `Learning content` to the rest of the system?**
  _328 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.07115677321156773 - nodes in this community are weakly interconnected._
- **Should `roadmaps.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13118279569892474 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._