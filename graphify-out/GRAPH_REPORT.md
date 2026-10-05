# Graph Report - knowledge_is_power  (2026-10-05)

## Corpus Check
- 237 files · ~205,249 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1666 nodes · 4142 edges · 139 communities (76 shown, 63 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cb4c2cff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Roles
- Module
- RequestDeletionDto
- ReviewService
- ConceptsController
- GamificationService
- qa.controller.ts
- Concept
- AiGenerationJob
- admin/dashboard/page.tsx
- assignments.module.ts
- User
- Added
- factories.ts
- typeorm.config.ts
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- PasswordResetOtp
- user.entity.ts
- collectCoverageFrom
- student/dashboard/page.tsx
- useSnackbar
- compilerOptions
- AnalyticsController
- UserConceptProgress
- auth.ts
- dependencies
- edit/page.tsx
- AdminContentReviewController
- auth.controller.ts
- scripts
- devDependencies
- app/layout.tsx
- UsersController
- dependencies
- Content Authoring Flow
- jest
- JwtAuthGuard
- Streak
- forgot-password/page.tsx
- CurrentUser
- Next.js Frontend Application
- frontend/package.json
- OAuthProfile
- QuizService
- ChangePasswordDto
- exclude
- eslint-plugin-prettier
- profile/page.tsx
- nest-cli.json
- UpdateOwnProfileDto
- AppController
- InstructorAnalyticsController
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
- AccountDeletionRequest
- LinkOAuthDto
- hasSignificantContentChange
- UpdateRoadmapDto
- [roadmapId]/page.tsx
- InstructorProfile
- ProgressController
- backend/package.json
- class-transformer
- @nestjs/passport
- devDependencies
- AddOAuthColumns1787300000000
- globals
- @nestjs/platform-express
- @nestjs/cli
- @nestjs/swagger
- AuthService
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
- AttachConceptDto
- typescript-eslint
- frontend/eslint.config.mjs
- next.config.ts
- passport-github2
- react-hook-form
- react-markdown
- remark-gfm
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- tailwind.config.ts
- Application Icon
- Application Logo
- UpdateModuleDto
- passport-jwt
- UsersService
- pg
- eslint
- @types/bcrypt
- @types/passport-github2
- @types/passport-google-oauth20
- lucide-react
- AddModulePrerequisiteDto
- typeorm
- dependencies
- @eslint/eslintrc
- @nestjs/schematics
- eslint-config-prettier
- @nestjs/testing
- AddQaAnswerAiSupport1787500000000
- AiGenerateService
- UpdateInstructorBioDto
- GetUsersQueryDto
- AddAiGenerationJobs1787600000000
- GenerateConceptContentDto
- AddAiJobRetryAndAck1787700000000

## God Nodes (most connected - your core abstractions)
1. `User` - 218 edges
2. `CurrentUser` - 80 edges
3. `Concept` - 63 edges
4. `BaseEntity` - 46 edges
5. `McqQuestion` - 45 edges
6. `useSnackbar()` - 41 edges
7. `Module` - 40 edges
8. `AiGenerateService` - 38 edges
9. `UsersService` - 38 edges
10. `Roadmap` - 35 edges

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

## Communities (139 total, 63 thin omitted)

### Community 0 - "Roles"
Cohesion: 0.23
Nodes (6): Roles(), ApiOperation, ApiResponse, Delete, Param, Patch

### Community 1 - "Module"
Cohesion: 0.09
Nodes (32): AppModule, AiGenerateModule, AnalyticsModule, AnalyticsService, Injectable, InjectRepository, AssignmentsModule, AuthModule (+24 more)

### Community 2 - "RequestDeletionDto"
Cohesion: 0.16
Nodes (11): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString (+3 more)

### Community 3 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 4 - "ConceptsController"
Cohesion: 0.07
Nodes (28): ApiQuery, ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+20 more)

### Community 5 - "GamificationService"
Cohesion: 0.10
Nodes (17): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+9 more)

### Community 6 - "qa.controller.ts"
Cohesion: 0.07
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+23 more)

### Community 7 - "Concept"
Cohesion: 0.07
Nodes (28): ConceptDifficulty, slugify(), InjectRepository, InjectRepository, ConceptsService, Injectable, InjectRepository, Concept (+20 more)

### Community 8 - "AiGenerationJob"
Cohesion: 0.14
Nodes (18): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+10 more)

### Community 9 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "User"
Cohesion: 0.11
Nodes (14): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min, IsInt, Min, UpdateModuleConceptDto (+6 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "factories.ts"
Cohesion: 0.13
Nodes (30): ConceptReviewStatus, FIXED_DATE, makeAttempt(), makeConcept(), makeOption(), makeQuestion(), makeReviewItem(), makeUser() (+22 more)

### Community 14 - "typeorm.config.ts"
Cohesion: 0.10
Nodes (23): BaseEntity, CreateDateColumn, UpdateDateColumn, AiGenerationJobStatus, AiGenerationType, dataSourceOptions, entities, typeOrmAsyncConfig (+15 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.11
Nodes (25): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+17 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "PasswordResetOtp"
Cohesion: 0.13
Nodes (10): InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne, EmailModule (+2 more)

### Community 19 - "user.entity.ts"
Cohesion: 0.17
Nodes (10): UserRole, ROLES_KEY, RolesGuard, Injectable, JwtPayload, InstructorConceptAnalytics, InstructorOverviewAnalytics, InstructorQuizQuestionAnalytics (+2 more)

### Community 20 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !**/*.spec.ts, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, **/*.(t|j)s

### Community 21 - "student/dashboard/page.tsx"
Cohesion: 0.16
Nodes (13): Badge, BADGE_IMAGE_MAP, BADGE_NAME_MAP, DIFF_COLORS, EarnedBadgeItem, GamificationData, getBadgeImage(), Roadmap (+5 more)

### Community 22 - "useSnackbar"
Cohesion: 0.07
Nodes (42): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+34 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (12): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+4 more)

### Community 25 - "UserConceptProgress"
Cohesion: 0.10
Nodes (27): ProgressStatus, XpSource, makeBadge(), makeProgress(), makeStreak(), makeUserBadge(), makeXpEvent(), Badge (+19 more)

### Community 26 - "auth.ts"
Cohesion: 0.10
Nodes (31): ADMIN_NAV_ITEMS, AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, FullUser, INSTRUCTOR_NAV_ITEMS (+23 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.14
Nodes (15): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+7 more)

### Community 30 - "auth.controller.ts"
Cohesion: 0.09
Nodes (24): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, RegisterDto, ApiProperty, IsEmail, IsNotEmpty (+16 more)

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.18
Nodes (9): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), SnackbarProvider() (+1 more)

### Community 34 - "UsersController"
Cohesion: 0.18
Nodes (6): ApiBearerAuth, ApiTags, Controller, Get, UseGuards, UsersController

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "Content Authoring Flow"
Cohesion: 0.19
Nodes (14): Automated Achievement Badges, Concept (Lesson), Concept Prerequisites Engine, Content Authoring Flow, Curriculum Architecture & Hierarchy, Experience Points (XP) System, Gamification Engine, Instructor Studio & Analytics (+6 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ts (+3 more)

### Community 38 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 39 - "Streak"
Cohesion: 0.25
Nodes (8): Streak, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn

### Community 40 - "forgot-password/page.tsx"
Cohesion: 0.20
Nodes (8): EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData, otpStepSchema, PasswordStepFormData, passwordStepSchema, ResetStep

### Community 41 - "CurrentUser"
Cohesion: 0.25
Nodes (14): CurrentUser, RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+6 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "OAuthProfile"
Cohesion: 0.20
Nodes (5): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable

### Community 45 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 46 - "ChangePasswordDto"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 49 - "profile/page.tsx"
Cohesion: 0.12
Nodes (21): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, BasicInfoFormData (+13 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "UpdateOwnProfileDto"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, UpdateOwnProfileDto

### Community 52 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 53 - "InstructorAnalyticsController"
Cohesion: 0.13
Nodes (14): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString, InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse (+6 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 68 - "AccountDeletionRequest"
Cohesion: 0.29
Nodes (6): AccountDeletionRequest, Column, Entity, JoinColumn, ManyToOne, InjectRepository

### Community 69 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString

### Community 71 - "UpdateRoadmapDto"
Cohesion: 0.40
Nodes (4): IsNotEmpty, IsOptional, IsString, UpdateRoadmapDto

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "InstructorProfile"
Cohesion: 0.14
Nodes (20): InstructorStatus, InjectRepository, Answer, Column, Entity, JoinColumn, ManyToOne, Question (+12 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 84 - "AuthService"
Cohesion: 0.18
Nodes (6): AuthService, Injectable, LoginDto, ApiProperty, IsEmail, IsString

### Community 98 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 116 - "UpdateModuleDto"
Cohesion: 0.25
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 118 - "UsersService"
Cohesion: 0.18
Nodes (4): JwtStrategy, Injectable, Injectable, UsersService

### Community 125 - "AddModulePrerequisiteDto"
Cohesion: 0.50
Nodes (3): AddModulePrerequisiteDto, ApiProperty, IsUUID

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 146 - "AiGenerateService"
Cohesion: 0.15
Nodes (14): AiGenerationJobType, AiGenerateService, Injectable, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), buildModuleConceptsUserPrompt(), buildQaAnswerUserPrompt(), buildRoadmapModulesUserPrompt() (+6 more)

### Community 150 - "UpdateInstructorBioDto"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsOptional, IsString, MaxLength, UpdateInstructorBioDto

### Community 151 - "GetUsersQueryDto"
Cohesion: 0.29
Nodes (6): GetUsersQueryDto, ApiPropertyOptional, IsEnum, IsOptional, IsString, Query

### Community 167 - "GenerateConceptContentDto"
Cohesion: 0.33
Nodes (13): AcknowledgeJobsDto, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto, GenerateRoadmapModulesDto, ApiProperty, ApiPropertyOptional (+5 more)

## Knowledge Gaps
- **329 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+324 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Roles`, `Module`, `RequestDeletionDto`, `ReviewService`, `ConceptsController`, `GamificationService`, `qa.controller.ts`, `Concept`, `AiGenerationJob`, `assignments.module.ts`, `factories.ts`, `typeorm.config.ts`, `AuthController`, `AiGenerateService`, `user.entity.ts`, `PasswordResetOtp`, `UpdateInstructorBioDto`, `GetUsersQueryDto`, `UserConceptProgress`, `AdminContentReviewController`, `auth.controller.ts`, `UsersController`, `Streak`, `CurrentUser`, `QuizService`, `ChangePasswordDto`, `UpdateOwnProfileDto`, `InstructorAnalyticsController`, `AccountDeletionRequest`, `InstructorProfile`, `ProgressController`, `UpdateModuleDto`, `UsersService`?**
  _High betweenness centrality (0.189) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `Roles`, `RequestDeletionDto`, `ReviewService`, `ConceptsController`, `GamificationService`, `qa.controller.ts`, `UsersController`, `AiGenerationJob`, `ProgressController`, `QuizService`, `ChangePasswordDto`, `AuthController`, `user.entity.ts`, `UpdateOwnProfileDto`, `InstructorAnalyticsController`, `UpdateInstructorBioDto`, `AdminContentReviewController`, `auth.controller.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `Submission` connect `assignments.module.ts` to `User`, `typeorm.config.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _329 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Module` be split into smaller, more focused modules?**
  _Cohesion score 0.0927536231884058 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._
- **Should `ConceptsController` be split into smaller, more focused modules?**
  _Cohesion score 0.0746031746031746 - nodes in this community are weakly interconnected._