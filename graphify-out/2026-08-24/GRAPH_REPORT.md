# Graph Report - knowledge_is_power  (2026-08-24)

## Corpus Check
- 214 files · ~186,478 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1597 nodes · 3432 edges · 174 communities (71 shown, 103 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 112 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `db7b32f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- AiGenerateService
- auth.controller.ts
- CurrentUser
- ConceptsService
- gamification.service.ts
- QaService
- analytics.service.ts
- AiGenerateController
- api-client.ts
- assignments.module.ts
- roadmaps.service.ts
- app.module.ts
- User
- ReviewService
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- AppController
- Concept
- ai-generate.service.ts
- OneToMany
- useSnackbar
- compilerOptions
- AnalyticsController
- AttachConceptDto
- auth.ts
- dependencies
- edit/page.tsx
- AdminContentReviewController
- InstructorAnalyticsService
- scripts
- devDependencies
- app/layout.tsx
- getUser
- dependencies
- Content Authoring Flow
- jest
- student/dashboard/page.tsx
- Controller
- forgot-password/page.tsx
- RoadmapsService
- Next.js Frontend Application
- frontend/package.json
- oauth-profile.interface.ts
- CreateQuestionDto
- quiz.controller.ts
- exclude
- eslint-plugin-prettier
- ResetPasswordDto
- nest-cli.json
- backend/package.json
- AiGenerationJob
- PasswordResetOtp
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
- LinkOAuthDto
- ProgressController
- RejectConceptDto
- @nestjs/passport
- VerifyOtpDto
- QuizService
- UpdateModuleDto
- pg
- RegisterDto
- CreateModuleDto
- devDependencies
- AddOAuthColumns1787300000000
- globals
- instructor-analytics.service.ts
- @nestjs/cli
- auth.service.ts
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
- ChangePasswordDto
- dotenv
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
- reflect-metadata
- typeorm
- eslint
- @types/bcrypt
- @types/passport-github2
- @types/passport-google-oauth20
- lucide-react
- nodemailer
- passport-github2
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
- qa.service.ts
- RequestDeletionDto
- UpdateOwnProfileDto
- AccountDeletionRequest
- ApiProperty
- ai-generate.controller.ts
- Req
- Res
- IsEnum
- MaxLength
- Query
- AddAiGenerationJobs1787600000000
- AddModulePrerequisiteDto
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

## God Nodes (most connected - your core abstractions)
1. `User` - 104 edges
2. `Concept` - 47 edges
3. `BaseEntity` - 42 edges
4. `CurrentUser` - 40 edges
5. `useSnackbar()` - 37 edges
6. `UsersService` - 36 edges
7. `McqQuestion` - 34 edges
8. `AiGenerateService` - 30 edges
9. `Module` - 30 edges
10. `Roadmap` - 26 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `StudentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/student/review/page.tsx → frontend/providers/snackbar-provider.tsx
- `AiGenerationJob` --references--> `AiGenerationJobType`  [EXTRACTED]
  backend/src/modules/ai-generate/entities/ai-generation-job.entity.ts → backend/src/common/enums/ai-generation-job.enum.ts
- `AiGenerationJob` --references--> `AiGenerationJobStatus`  [EXTRACTED]
  backend/src/modules/ai-generate/entities/ai-generation-job.entity.ts → backend/src/common/enums/ai-generation-job.enum.ts
- `Submission` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/assignments/entities/submission.entity.ts → backend/src/common/entities/base.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (174 total, 103 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.07
Nodes (26): JwtStrategy, Injectable, ApiPropertyOptional, IsOptional, IsString, UpdateInstructorBioDto, ApiBearerAuth, ApiOperation (+18 more)

### Community 2 - "auth.controller.ts"
Cohesion: 0.38
Nodes (4): GitHubAuthGuard, Injectable, GoogleAuthGuard, Injectable

### Community 3 - "CurrentUser"
Cohesion: 0.24
Nodes (13): CurrentUser, QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+5 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (34): ApiQuery, ConceptDifficulty, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+26 more)

### Community 5 - "gamification.service.ts"
Cohesion: 0.05
Nodes (41): XpSource, GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, Badge (+33 more)

### Community 6 - "QaService"
Cohesion: 0.09
Nodes (26): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsNotEmpty, IsOptional (+18 more)

### Community 7 - "analytics.service.ts"
Cohesion: 0.13
Nodes (16): ProgressStatus, AnalyticsService, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, Injectable, InjectRepository (+8 more)

### Community 8 - "AiGenerateController"
Cohesion: 0.21
Nodes (15): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, AiGenerateController, InstructorAnalyticsController, Body, Controller (+7 more)

### Community 9 - "api-client.ts"
Cohesion: 0.15
Nodes (12): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, AnswerResult, DueReviewItem, ReviewOption, ReviewQuestion (+4 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "roadmaps.service.ts"
Cohesion: 0.18
Nodes (11): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString, IsInt, Min, UpdateModuleConceptDto, IsNotEmpty (+3 more)

### Community 12 - "app.module.ts"
Cohesion: 0.11
Nodes (22): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, JwtPayload, Module (+14 more)

### Community 13 - "User"
Cohesion: 0.13
Nodes (28): BaseEntity, CreateDateColumn, UpdateDateColumn, ConceptReviewStatus, dataSourceOptions, entities, McqAttempt, Column (+20 more)

### Community 14 - "ReviewService"
Cohesion: 0.08
Nodes (23): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewItem, Column, Entity, JoinColumn (+15 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.14
Nodes (19): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+11 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.10
Nodes (20): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+12 more)

### Community 18 - "AppController"
Cohesion: 0.17
Nodes (7): AppController, AppService, Injectable, IS_PUBLIC_KEY, Public(), JwtAuthGuard, Injectable

### Community 19 - "Concept"
Cohesion: 0.10
Nodes (28): ContentModule, Concept, Column, Entity, JoinColumn, ManyToOne, ModuleConcept, Column (+20 more)

### Community 20 - "ai-generate.service.ts"
Cohesion: 0.14
Nodes (19): AiGenerationType, ParsedMcqOption, ParsedMcqQuestion, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), buildModuleConceptsUserPrompt(), buildQaAnswerUserPrompt(), buildRoadmapModulesUserPrompt() (+11 more)

### Community 22 - "useSnackbar"
Cohesion: 0.07
Nodes (33): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+25 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.18
Nodes (8): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards

### Community 25 - "AttachConceptDto"
Cohesion: 0.29
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 26 - "auth.ts"
Cohesion: 0.09
Nodes (36): ADMIN_NAV_ITEMS, AdminAppShellLayout(), CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage() (+28 more)

### Community 27 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, bcrypt, class-transformer, class-validator, @nestjs/common, @nestjs/config, @nestjs/jwt, @nestjs/platform-express (+15 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.10
Nodes (22): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+14 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.16
Nodes (14): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+6 more)

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
Cohesion: 0.18
Nodes (11): RoadmapManagementPage(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, ConceptSummary, InstructorQaPage(), QaAnswer (+3 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "Content Authoring Flow"
Cohesion: 0.19
Nodes (14): Automated Achievement Badges, Concept (Lesson), Concept Prerequisites Engine, Content Authoring Flow, Curriculum Architecture & Hierarchy, Experience Points (XP) System, Gamification Engine, Instructor Studio & Analytics (+6 more)

### Community 37 - "jest"
Cohesion: 0.15
Nodes (13): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+5 more)

### Community 38 - "student/dashboard/page.tsx"
Cohesion: 0.12
Nodes (18): Badge, BADGE_IMAGE_MAP, BADGE_NAME_MAP, DIFF_COLORS, EarnedBadgeItem, GamificationData, getBadgeImage(), Roadmap (+10 more)

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

### Community 45 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

### Community 46 - "quiz.controller.ts"
Cohesion: 0.13
Nodes (14): SubmitAttemptDto, ApiProperty, IsUUID, IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto (+6 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, dist, **/*spec.ts, test, ./tsconfig.json

### Community 49 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 52 - "AiGenerationJob"
Cohesion: 0.20
Nodes (6): AiGenerationJob, Column, Entity, InjectRepository, JoinColumn, ManyToOne

### Community 53 - "PasswordResetOtp"
Cohesion: 0.33
Nodes (6): PasswordResetOtp, Column, Entity, JoinColumn, ManyToOne, Index

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 68 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsNotEmpty, IsString, IsIn

### Community 69 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 70 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 72 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, VerifyOtpDto, Matches

### Community 74 - "UpdateModuleDto"
Cohesion: 0.33
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 76 - "RegisterDto"
Cohesion: 0.29
Nodes (6): RegisterDto, ApiProperty, IsEmail, IsNotEmpty, IsString, MinLength

### Community 77 - "CreateModuleDto"
Cohesion: 0.40
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/eslintrc, @eslint/js, @nestjs/schematics, @nestjs/testing, @eslint/eslintrc, @eslint/js, @nestjs/schematics (+1 more)

### Community 81 - "instructor-analytics.service.ts"
Cohesion: 0.12
Nodes (19): UserRole, Roles(), ROLES_KEY, RolesGuard, Injectable, InstructorConceptAnalytics, InstructorOverviewAnalytics, InstructorQuizQuestionAnalytics (+11 more)

### Community 83 - "auth.service.ts"
Cohesion: 0.22
Nodes (8): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString

### Community 97 - "ChangePasswordDto"
Cohesion: 0.40
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 141 - "qa.service.ts"
Cohesion: 0.09
Nodes (23): InstructorStatus, slugify(), IsNotEmpty, IsString, UpdateAnswerDto, Answer, Column, Entity (+15 more)

### Community 142 - "RequestDeletionDto"
Cohesion: 0.40
Nodes (5): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength

### Community 143 - "UpdateOwnProfileDto"
Cohesion: 0.40
Nodes (5): ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, UpdateOwnProfileDto

### Community 144 - "AccountDeletionRequest"
Cohesion: 0.40
Nodes (5): AccountDeletionRequest, Column, Entity, JoinColumn, ManyToOne

### Community 146 - "ai-generate.controller.ts"
Cohesion: 0.25
Nodes (14): ApiProperty, ApiPropertyOptional, AiGenerationJobStatus, AiGenerationJobType, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto (+6 more)

### Community 153 - "AddModulePrerequisiteDto"
Cohesion: 0.50
Nodes (3): AddModulePrerequisiteDto, ApiProperty, IsUUID

## Knowledge Gaps
- **302 isolated node(s):** `entities`, `dataSourceOptions`, `ParsedMcqOption`, `ParsedMcqQuestion`, `JwtPayload` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **103 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `auth.controller.ts`, `CurrentUser`, `ConceptsService`, `gamification.service.ts`, `QaService`, `analytics.service.ts`, `assignments.module.ts`, `roadmaps.service.ts`, `app.module.ts`, `qa.service.ts`, `ReviewService`, `AccountDeletionRequest`, `ai-generate.controller.ts`, `Concept`, `ai-generate.service.ts`, `quiz.controller.ts`, `PasswordResetOtp`, `ProgressController`, `QuizService`, `instructor-analytics.service.ts`, `auth.service.ts`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `ConceptsService`, `gamification.service.ts`, `analytics.service.ts`, `assignments.module.ts`, `roadmaps.service.ts`, `app.module.ts`, `User`, `qa.service.ts`, `instructor-analytics.service.ts`, `ai-generate.service.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `AiGenerateService` connect `AiGenerateService` to `AiGenerateController`, `qa.service.ts`, `ai-generate.controller.ts`, `Concept`, `ai-generate.service.ts`, `AiGenerationJob`, `InstructorAnalyticsService`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `entities`, `dataSourceOptions`, `ParsedMcqOption` to the rest of the system?**
  _302 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.07276995305164319 - nodes in this community are weakly interconnected._
- **Should `ConceptsService` be split into smaller, more focused modules?**
  _Cohesion score 0.057329462989840346 - nodes in this community are weakly interconnected._
- **Should `gamification.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.054098360655737705 - nodes in this community are weakly interconnected._