# Graph Report - knowledge_is_power  (2026-08-29)

## Corpus Check
- 237 files · ~205,249 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1698 nodes · 3894 edges · 172 communities (78 shown, 94 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e7ca908e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersController
- typeorm.config.ts
- User
- ReviewService
- ConceptsService
- GamificationService
- qa.controller.ts
- Concept
- AiGenerateController
- api-client.ts
- assignments.module.ts
- roadmaps.service.ts
- Added
- McqQuestion
- UserConceptProgress
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- UsersService
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
- QuizController
- CreateQuestionDto
- exclude
- eslint-plugin-prettier
- auth.ts
- nest-cli.json
- VerifyOtpDto
- RequestDeletionDto
- EmailService
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
- analytics.service.spec.ts
- CurrentUser
- backend/package.json
- ResetPasswordDto
- QuizService
- devDependencies
- AddOAuthColumns1787300000000
- globals
- ChangePasswordDto
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
- .applyForInstructor
- AttachConceptDto
- typescript-eslint
- frontend/eslint.config.mjs
- next.config.ts
- UpdateInstructorBioDto
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
- UpdateQuestionDto
- PasswordResetOtp
- UpdateOptionDto
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
7. `UsersService` - 38 edges
8. `AiGenerateService` - 38 edges
9. `Module` - 32 edges
10. `Roadmap` - 31 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `StudentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/student/review/page.tsx → frontend/providers/snackbar-provider.tsx
- `exclude` --extends--> `!**/*.spec.ts`  [EXTRACTED]
  backend/tsconfig.build.json → backend/package.json
- `ModuleConcept` --references--> `Concept`  [EXTRACTED]
  backend/src/modules/content/entities/module-concept.entity.ts → backend/src/modules/content/entities/concept.entity.ts
- `ModuleConcept` --references--> `ModuleConceptPrerequisite`  [EXTRACTED]
  backend/src/modules/content/entities/module-concept.entity.ts → backend/src/modules/content/entities/module-concept-prerequisite.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (172 total, 94 thin omitted)

### Community 0 - "UsersController"
Cohesion: 0.12
Nodes (14): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Delete, Get (+6 more)

### Community 1 - "typeorm.config.ts"
Cohesion: 0.09
Nodes (33): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, ContentModule, ModuleConcept, Column (+25 more)

### Community 2 - "User"
Cohesion: 0.10
Nodes (33): InstructorStatus, UserRole, Roles(), ROLES_KEY, RolesGuard, Injectable, JwtPayload, InstructorConceptAnalytics (+25 more)

### Community 3 - "ReviewService"
Cohesion: 0.10
Nodes (17): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+9 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (34): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), slugify(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+26 more)

### Community 5 - "GamificationService"
Cohesion: 0.10
Nodes (17): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+9 more)

### Community 6 - "qa.controller.ts"
Cohesion: 0.07
Nodes (30): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsNotEmpty, IsOptional (+22 more)

### Community 7 - "Concept"
Cohesion: 0.11
Nodes (24): AnalyticsService, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, Injectable, InjectRepository, Concept (+16 more)

### Community 8 - "AiGenerateController"
Cohesion: 0.11
Nodes (20): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, AppController, AppService, Injectable, AiGenerateController (+12 more)

### Community 9 - "api-client.ts"
Cohesion: 0.15
Nodes (11): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, AnswerResult, DueReviewItem, ReviewOption, ReviewQuestion (+3 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (23): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsModule, AssignmentsService, Injectable, InjectRepository (+15 more)

### Community 11 - "roadmaps.service.ts"
Cohesion: 0.16
Nodes (12): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min, IsInt, Min, UpdateModuleConceptDto (+4 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "McqQuestion"
Cohesion: 0.14
Nodes (20): SubmitAttemptDto, ApiProperty, IsUUID, McqAttempt, Column, Entity, JoinColumn, ManyToOne (+12 more)

### Community 14 - "UserConceptProgress"
Cohesion: 0.12
Nodes (16): ModuleConceptPrerequisite, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn, Column (+8 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.07
Nodes (37): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+29 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.20
Nodes (15): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+7 more)

### Community 18 - "UsersService"
Cohesion: 0.11
Nodes (8): AuthService, Injectable, InjectRepository, JwtStrategy, Injectable, Injectable, InjectRepository, UsersService

### Community 19 - "app.module.ts"
Cohesion: 0.22
Nodes (9): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AuthModule, InstructorAnalyticsModule, ProgressModule, QaModule (+1 more)

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
Cohesion: 0.18
Nodes (8): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards

### Community 25 - "factories.ts"
Cohesion: 0.09
Nodes (38): ConceptDifficulty, ConceptReviewStatus, ProgressStatus, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeConcept() (+30 more)

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

### Community 45 - "QuizController"
Cohesion: 0.17
Nodes (12): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

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

### Community 52 - "RequestDeletionDto"
Cohesion: 0.40
Nodes (5): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength

### Community 53 - "EmailService"
Cohesion: 0.40
Nodes (3): EmailModule, EmailService, Injectable

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 69 - "UpdateOwnProfileDto"
Cohesion: 0.40
Nodes (5): ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, UpdateOwnProfileDto

### Community 70 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 71 - "ApplyInstructorDto"
Cohesion: 0.50
Nodes (4): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "analytics.service.spec.ts"
Cohesion: 0.33
Nodes (8): makeQuestion(), makeReviewItem(), makeUser(), createMockQueryBuilder(), createMockRepository(), MockQueryBuilder, MockRepository, NOW

### Community 74 - "CurrentUser"
Cohesion: 0.23
Nodes (10): CurrentUser, ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get (+2 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 76 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/eslintrc, @eslint/js, @nestjs/schematics, @nestjs/testing, @eslint/eslintrc, @eslint/js, @nestjs/schematics (+1 more)

### Community 81 - "ChangePasswordDto"
Cohesion: 0.40
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 83 - "auth.controller.ts"
Cohesion: 0.19
Nodes (9): LinkOAuthDto, ApiProperty, IsNotEmpty, IsString, GitHubAuthGuard, Injectable, GoogleAuthGuard, Injectable (+1 more)

### Community 84 - "auth.service.ts"
Cohesion: 0.22
Nodes (8): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString

### Community 98 - "AttachConceptDto"
Cohesion: 0.29
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 105 - "UpdateInstructorBioDto"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsOptional, IsString, UpdateInstructorBioDto, MaxLength

### Community 116 - "UpdateModuleDto"
Cohesion: 0.33
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 117 - "UpdateQuestionDto"
Cohesion: 0.33
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateQuestionDto

### Community 118 - "PasswordResetOtp"
Cohesion: 0.40
Nodes (5): PasswordResetOtp, Column, Entity, JoinColumn, ManyToOne

### Community 119 - "UpdateOptionDto"
Cohesion: 0.40
Nodes (5): IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto

### Community 125 - "AddModulePrerequisiteDto"
Cohesion: 0.50
Nodes (3): AddModulePrerequisiteDto, ApiProperty, IsUUID

### Community 126 - "CreateRoadmapDto"
Cohesion: 0.50
Nodes (4): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.06
Nodes (42): ApiProperty, ApiPropertyOptional, AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, AiGenerateService, ParsedMcqOption, ParsedMcqQuestion (+34 more)

## Knowledge Gaps
- **329 isolated node(s):** `name`, `version`, `description`, `author`, `private` (+324 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **94 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `typeorm.config.ts`, `ReviewService`, `ConceptsService`, `GamificationService`, `qa.controller.ts`, `Concept`, `assignments.module.ts`, `roadmaps.service.ts`, `McqQuestion`, `UserConceptProgress`, `ai-generate.service.ts`, `UsersService`, `factories.ts`, `QuizController`, `analytics.service.spec.ts`, `CurrentUser`, `QuizService`, `auth.controller.ts`, `auth.service.ts`, `PasswordResetOtp`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `UsersService` connect `UsersService` to `UsersController`, `.applyForInstructor`, `User`, `analytics.service.spec.ts`, `UpdateInstructorBioDto`, `AuthController`, `auth.controller.ts`, `auth.service.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `typeorm.config.ts`, `User`, `ConceptsService`, `qa.controller.ts`, `analytics.service.spec.ts`, `assignments.module.ts`, `roadmaps.service.ts`, `McqQuestion`, `UserConceptProgress`, `ai-generate.service.ts`, `factories.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _329 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersController` be split into smaller, more focused modules?**
  _Cohesion score 0.12439024390243902 - nodes in this community are weakly interconnected._
- **Should `typeorm.config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09131205673758866 - nodes in this community are weakly interconnected._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.10153358011634056 - nodes in this community are weakly interconnected._