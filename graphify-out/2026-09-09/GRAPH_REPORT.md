# Graph Report - knowledge_is_power  (2026-09-08)

## Corpus Check
- 237 files · ~205,249 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1698 nodes · 3894 edges · 168 communities (75 shown, 93 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `09859ea2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- roadmaps.service.ts
- users.service.ts
- ReviewService
- ConceptsService
- GetActivityQueryDto
- qa.service.ts
- Concept
- AiGenerateController
- api-client.ts
- assignments.module.ts
- CreateModuleDto
- Added
- typeorm.config.ts
- concept.entity.ts
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- AuthService
- user.entity.ts
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
- User
- CreateQuestionDto
- exclude
- eslint-plugin-prettier
- auth.ts
- nest-cli.json
- VerifyOtpDto
- InstructorAnalyticsController
- InstructorAnalyticsService
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
- LinkOAuthDto
- RejectConceptDto
- UpdateRoadmapDto
- [roadmapId]/page.tsx
- concepts.service.ts
- ProgressController
- backend/package.json
- ResetPasswordDto
- UpdateModuleConceptDto
- devDependencies
- AddOAuthColumns1787300000000
- globals
- @nestjs/cli
- auth.controller.ts
- auth.service.ts
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
- AttachConceptDto
- typescript-eslint
- frontend/eslint.config.mjs
- next.config.ts
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
- quiz.controller.ts
- auth.module.ts
- eslint
- @types/bcrypt
- @types/passport-github2
- @types/passport-google-oauth20
- lucide-react
- AddModulePrerequisiteDto
- CreateRoadmapDto
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
7. `AiGenerateService` - 38 edges
8. `UsersService` - 38 edges
9. `Module` - 32 edges
10. `Roadmap` - 31 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `StudentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/student/review/page.tsx → frontend/providers/snackbar-provider.tsx
- `exclude` --extends--> `!**/*.spec.ts`  [EXTRACTED]
  backend/tsconfig.build.json → backend/package.json
- `AiGenerationLog` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/ai-generate/entities/ai-generation-log.entity.ts → backend/src/common/entities/base.entity.ts
- `Assignment` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/assignments/entities/assignment.entity.ts → backend/src/common/entities/base.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (168 total, 93 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.08
Nodes (24): ApiPropertyOptional, IsOptional, IsString, UpdateInstructorBioDto, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags (+16 more)

### Community 1 - "roadmaps.service.ts"
Cohesion: 0.08
Nodes (41): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, ModuleConcept (+33 more)

### Community 2 - "users.service.ts"
Cohesion: 0.08
Nodes (30): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, ChangePasswordDto, ApiProperty, IsNotEmpty, IsString (+22 more)

### Community 3 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (33): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags (+25 more)

### Community 5 - "GetActivityQueryDto"
Cohesion: 0.12
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 6 - "qa.service.ts"
Cohesion: 0.06
Nodes (43): ApiProperty, ApiPropertyOptional, AcknowledgeJobsDto, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto, GenerateRoadmapModulesDto (+35 more)

### Community 7 - "Concept"
Cohesion: 0.13
Nodes (20): ProgressStatus, InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne, InjectRepository (+12 more)

### Community 8 - "AiGenerateController"
Cohesion: 0.26
Nodes (12): ApiOperation, ApiResponse, AiGenerateController, InstructorConceptAnalytics, InstructorOverviewAnalytics, InstructorQuizQuestionAnalytics, Body, CurrentUser (+4 more)

### Community 9 - "api-client.ts"
Cohesion: 0.15
Nodes (11): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, AnswerResult, DueReviewItem, ReviewOption, ReviewQuestion (+3 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "typeorm.config.ts"
Cohesion: 0.08
Nodes (36): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, Question, Column, Entity (+28 more)

### Community 14 - "concept.entity.ts"
Cohesion: 0.31
Nodes (4): ConceptReviewStatus, makeAttempt(), ProgressService, Injectable

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.07
Nodes (37): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+29 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.19
Nodes (15): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+7 more)

### Community 18 - "AuthService"
Cohesion: 0.13
Nodes (6): AuthService, Injectable, InjectRepository, EmailModule, EmailService, Injectable

### Community 19 - "user.entity.ts"
Cohesion: 0.34
Nodes (6): UserRole, CurrentUser, Roles(), ROLES_KEY, RolesGuard, Injectable

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
Nodes (38): ConceptDifficulty, XpSource, FIXED_DATE, makeBadge(), makeConcept(), makeOption(), makeProgress(), makeQuestion() (+30 more)

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
Cohesion: 0.11
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

### Community 45 - "User"
Cohesion: 0.12
Nodes (21): SubmitAttemptDto, ApiProperty, IsUUID, QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags (+13 more)

### Community 46 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

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

### Community 52 - "InstructorAnalyticsController"
Cohesion: 0.16
Nodes (9): ApiBearerAuth, ApiTags, AppController, AppService, Injectable, InstructorAnalyticsController, Controller, Roles (+1 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 69 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsNotEmpty, IsString, IsIn

### Community 70 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 71 - "UpdateRoadmapDto"
Cohesion: 0.40
Nodes (4): IsNotEmpty, IsOptional, IsString, UpdateRoadmapDto

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "concepts.service.ts"
Cohesion: 0.25
Nodes (12): InstructorStatus, makeUser(), createMockQueryBuilder(), createMockRepository(), MockRepository, slugify(), InstructorProfile, Column (+4 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 76 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 77 - "UpdateModuleConceptDto"
Cohesion: 0.50
Nodes (3): IsInt, Min, UpdateModuleConceptDto

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/eslintrc, @eslint/js, @nestjs/schematics, @nestjs/testing, @eslint/eslintrc, @eslint/js, @nestjs/schematics (+1 more)

### Community 83 - "auth.controller.ts"
Cohesion: 0.38
Nodes (4): GitHubAuthGuard, Injectable, GoogleAuthGuard, Injectable

### Community 84 - "auth.service.ts"
Cohesion: 0.22
Nodes (8): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString

### Community 98 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 116 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 117 - "quiz.controller.ts"
Cohesion: 0.16
Nodes (11): IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto, IsInt, IsNotEmpty, IsOptional (+3 more)

### Community 118 - "auth.module.ts"
Cohesion: 0.15
Nodes (10): NOW, PasswordResetOtp, Column, Entity, JoinColumn, ManyToOne, JwtPayload, JwtStrategy (+2 more)

### Community 125 - "AddModulePrerequisiteDto"
Cohesion: 0.50
Nodes (3): AddModulePrerequisiteDto, ApiProperty, IsUUID

### Community 126 - "CreateRoadmapDto"
Cohesion: 0.40
Nodes (4): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (29): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, AiGenerateService, ParsedMcqOption, ParsedMcqQuestion, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt() (+21 more)

## Knowledge Gaps
- **329 isolated node(s):** `name`, `version`, `description`, `author`, `private` (+324 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **93 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `roadmaps.service.ts`, `users.service.ts`, `ReviewService`, `ConceptsService`, `GetActivityQueryDto`, `qa.service.ts`, `Concept`, `assignments.module.ts`, `typeorm.config.ts`, `concept.entity.ts`, `ai-generate.service.ts`, `user.entity.ts`, `factories.ts`, `concepts.service.ts`, `ProgressController`, `auth.controller.ts`, `auth.service.ts`, `quiz.controller.ts`, `auth.module.ts`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `AiGenerateService` connect `ai-generate.service.ts` to `roadmaps.service.ts`, `qa.service.ts`, `RoadmapsService`, `concepts.service.ts`, `AuthService`, `user.entity.ts`, `InstructorAnalyticsService`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `UsersService` connect `UsersService` to `users.service.ts`, `concepts.service.ts`, `AuthController`, `AuthService`, `auth.controller.ts`, `auth.service.ts`, `auth.module.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _329 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.08298368298368299 - nodes in this community are weakly interconnected._
- **Should `roadmaps.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08007013442431327 - nodes in this community are weakly interconnected._
- **Should `users.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._