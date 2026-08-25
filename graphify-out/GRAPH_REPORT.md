# Graph Report - knowledge_is_power  (2026-08-25)

## Corpus Check
- 235 files · ~204,724 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1680 nodes · 3878 edges · 167 communities (68 shown, 99 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `610673bf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- UserConceptProgress
- concept.entity.ts
- CreateQuestionDto
- ConceptsService
- ReviewService
- qa.service.ts
- Concept
- AiGenerateController
- api-client.ts
- assignments.module.ts
- roadmaps.controller.ts
- ReviewItem
- user.entity.ts
- CurrentUser
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
- backend/package.json
- JwtAuthGuard
- Controller
- forgot-password/page.tsx
- RoadmapsService
- Next.js Frontend Application
- frontend/package.json
- auth.module.ts
- QuizController
- quiz.controller.ts
- exclude
- eslint-plugin-prettier
- auth.ts
- nest-cli.json
- VerifyOtpDto
- RequestDeletionDto
- AuthService
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
- users.controller.ts
- moduleFileExtensions
- class-transformer
- @nestjs/jwt
- devDependencies
- AddOAuthColumns1787300000000
- globals
- ChangePasswordDto
- @nestjs/cli
- auth.controller.ts
- @nestjs/core
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
- passport
- passport-google-oauth20
- typescript-eslint
- frontend/eslint.config.mjs
- next.config.ts
- @nestjs/swagger
- react-hook-form
- react-markdown
- remark-gfm
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- tailwind.config.ts
- Application Icon
- Application Logo
- jest
- passport-jwt
- eslint
- @types/bcrypt
- @types/passport-github2
- @types/passport-google-oauth20
- lucide-react
- @types/supertest
- typescript
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
- User
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
7. `AiGenerateService` - 38 edges
8. `UsersService` - 38 edges
9. `Module` - 33 edges
10. `Roadmap` - 31 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `StudentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/student/review/page.tsx → frontend/providers/snackbar-provider.tsx
- `exclude` --extends--> `!**/*.spec.ts`  [EXTRACTED]
  backend/tsconfig.build.json → backend/package.json
- `GetUsersQueryDto` --references--> `InstructorStatus`  [EXTRACTED]
  backend/src/modules/users/dto/get-users-query.dto.ts → backend/src/common/enums/instructor-status.enum.ts
- `ModuleConcept` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/content/entities/module-concept.entity.ts → backend/src/common/entities/base.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (167 total, 99 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.07
Nodes (27): JwtPayload, JwtStrategy, Injectable, ApiPropertyOptional, IsOptional, IsString, UpdateInstructorBioDto, ApiBearerAuth (+19 more)

### Community 1 - "UserConceptProgress"
Cohesion: 0.11
Nodes (25): ProgressStatus, XpSource, ModuleConcept, Column, Entity, JoinColumn, ManyToOne, OneToMany (+17 more)

### Community 2 - "concept.entity.ts"
Cohesion: 0.21
Nodes (17): ConceptReviewStatus, InstructorStatus, UserRole, makeConcept(), makeUser(), createMockQueryBuilder(), createMockRepository(), MockQueryBuilder (+9 more)

### Community 3 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (34): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), slugify(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+26 more)

### Community 5 - "ReviewService"
Cohesion: 0.05
Nodes (33): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+25 more)

### Community 6 - "qa.service.ts"
Cohesion: 0.08
Nodes (30): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsNotEmpty, IsOptional (+22 more)

### Community 7 - "Concept"
Cohesion: 0.08
Nodes (24): InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne, Roadmap, Column (+16 more)

### Community 8 - "AiGenerateController"
Cohesion: 0.11
Nodes (20): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, AppController, AppService, Injectable, AiGenerateController (+12 more)

### Community 9 - "api-client.ts"
Cohesion: 0.15
Nodes (11): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, AnswerResult, DueReviewItem, ReviewOption, ReviewQuestion (+3 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "roadmaps.controller.ts"
Cohesion: 0.06
Nodes (32): AddModulePrerequisiteDto, ApiProperty, IsUUID, AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional (+24 more)

### Community 12 - "ReviewItem"
Cohesion: 0.25
Nodes (7): ReviewItem, Column, Entity, JoinColumn, ManyToOne, Unique, InjectRepository

### Community 13 - "user.entity.ts"
Cohesion: 0.13
Nodes (24): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, MostMissedOption, McqAttempt, Column (+16 more)

### Community 14 - "CurrentUser"
Cohesion: 0.23
Nodes (10): CurrentUser, ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get (+2 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.07
Nodes (37): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+29 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.17
Nodes (15): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+7 more)

### Community 18 - "ai-generate.controller.ts"
Cohesion: 0.35
Nodes (13): ApiProperty, ApiPropertyOptional, AcknowledgeJobsDto, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto, GenerateRoadmapModulesDto (+5 more)

### Community 19 - "app.module.ts"
Cohesion: 0.13
Nodes (21): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, Module (+13 more)

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
Nodes (14): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+6 more)

### Community 25 - "factories.ts"
Cohesion: 0.08
Nodes (34): ConceptDifficulty, FIXED_DATE, makeAttempt(), makeBadge(), makeOption(), makeProgress(), makeQuestion(), makeReviewItem() (+26 more)

### Community 26 - "student/layout.tsx"
Cohesion: 0.13
Nodes (19): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), ProfilePage(), NAV_ITEMS (+11 more)

### Community 27 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/passport, @nestjs/platform-express (+21 more)

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

### Community 37 - "backend/package.json"
Cohesion: 0.15
Nodes (12): author, description, jest, coverageDirectory, rootDir, testEnvironment, testRegex, transform (+4 more)

### Community 38 - "JwtAuthGuard"
Cohesion: 0.29
Nodes (4): IS_PUBLIC_KEY, Public(), JwtAuthGuard, Injectable

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
Cohesion: 0.15
Nodes (9): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy (+1 more)

### Community 45 - "QuizController"
Cohesion: 0.23
Nodes (12): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 46 - "quiz.controller.ts"
Cohesion: 0.13
Nodes (14): SubmitAttemptDto, ApiProperty, IsUUID, IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto (+6 more)

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

### Community 53 - "AuthService"
Cohesion: 0.18
Nodes (6): AuthService, Injectable, InjectRepository, EmailModule, EmailService, Injectable

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

### Community 74 - "users.controller.ts"
Cohesion: 0.25
Nodes (7): Roles(), ROLES_KEY, RolesGuard, Injectable, InstructorConceptAnalytics, InstructorOverviewAnalytics, InstructorQuizQuestionAnalytics

### Community 75 - "moduleFileExtensions"
Cohesion: 0.50
Nodes (4): moduleFileExtensions, js, json, ts

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/eslintrc, @eslint/js, @nestjs/schematics, @nestjs/testing, @eslint/eslintrc, @eslint/js, @nestjs/schematics (+1 more)

### Community 81 - "ChangePasswordDto"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 83 - "auth.controller.ts"
Cohesion: 0.10
Nodes (18): LinkOAuthDto, ApiProperty, IsNotEmpty, IsString, LoginDto, ApiProperty, IsEmail, IsString (+10 more)

### Community 141 - "User"
Cohesion: 0.13
Nodes (16): PasswordResetOtp, Column, Entity, JoinColumn, ManyToOne, QuizService, Injectable, AccountDeletionRequest (+8 more)

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (29): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, AiGenerateService, ParsedMcqOption, ParsedMcqQuestion, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt() (+21 more)

## Knowledge Gaps
- **318 isolated node(s):** `name`, `version`, `description`, `author`, `private` (+313 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **99 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `UserConceptProgress`, `concept.entity.ts`, `ConceptsService`, `ReviewService`, `qa.service.ts`, `Concept`, `assignments.module.ts`, `roadmaps.controller.ts`, `ReviewItem`, `user.entity.ts`, `CurrentUser`, `ai-generate.controller.ts`, `ai-generate.service.ts`, `app.module.ts`, `factories.ts`, `auth.module.ts`, `QuizController`, `quiz.controller.ts`, `users.controller.ts`, `auth.controller.ts`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `UsersService` connect `UsersService` to `concept.entity.ts`, `users.controller.ts`, `auth.module.ts`, `auth.controller.ts`, `app.module.ts`, `AuthService`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `UsersController` connect `UsersService` to `users.controller.ts`, `app.module.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _318 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.06630211893369788 - nodes in this community are weakly interconnected._
- **Should `UserConceptProgress` be split into smaller, more focused modules?**
  _Cohesion score 0.11153846153846154 - nodes in this community are weakly interconnected._
- **Should `CreateQuestionDto` be split into smaller, more focused modules?**
  _Cohesion score 0.11695906432748537 - nodes in this community are weakly interconnected._