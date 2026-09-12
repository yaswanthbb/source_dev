# Graph Report - knowledge_is_power  (2026-09-12)

## Corpus Check
- 243 files · ~253,215 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1691 nodes · 4199 edges · 142 communities (77 shown, 65 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b7aeba24`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Roles
- Module
- profile/page.tsx
- .answerReviewItem
- ConceptsController
- GetActivityQueryDto
- Roadmap
- UsersService
- InstructorAnalyticsController
- hasSignificantContentChange
- assignments.module.ts
- AuthService
- Added
- McqQuestion
- UserConceptProgress
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- QaController
- UserRole
- collectCoverageFrom
- User
- useSnackbar
- compilerOptions
- AnalyticsController
- user.entity.ts
- auth.ts
- dependencies
- edit/page.tsx
- AdminContentReviewController
- ReviewItem
- scripts
- devDependencies
- app/layout.tsx
- CreateQuestionDto
- dependencies
- Content Authoring Flow
- jest
- auth.controller.ts
- AppController
- forgot-password/page.tsx
- CurrentUser
- Next.js Frontend Application
- frontend/package.json
- auth.module.ts
- QuizService
- student/dashboard/page.tsx
- exclude
- eslint-plugin-prettier
- ai-generate.controller.ts
- nest-cli.json
- Answer
- Concept
- instructor/layout.tsx
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
- quiz.controller.ts
- qa.service.ts
- PasswordResetOtp
- InstructorProfile
- [roadmapId]/page.tsx
- factories.ts
- ProgressController
- backend/package.json
- UpdateModuleDto
- users.service.ts
- devDependencies
- AddOAuthColumns1787300000000
- globals
- ReviewService
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
- QaService
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
- CreateQaQuestionDto
- AccountDeletionRequest
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
- ChangePasswordDto
- RequestDeletionDto
- passport-jwt
- pg
- typeorm
- @eslint/eslintrc
- @nestjs/schematics
- @nestjs/testing
- RejectConceptDto
- AddQaAnswerAiSupport1787500000000
- ai-generate.service.ts
- AddAiGenerationJobs1787600000000
- AddAiJobRetryAndAck1787700000000

## God Nodes (most connected - your core abstractions)
1. `User` - 218 edges
2. `CurrentUser` - 80 edges
3. `Concept` - 63 edges
4. `BaseEntity` - 46 edges
5. `McqQuestion` - 45 edges
6. `Module` - 40 edges
7. `AiGenerateService` - 38 edges
8. `UsersService` - 38 edges
9. `useSnackbar()` - 37 edges
10. `Roadmap` - 35 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `ConceptSyllabusSidebarProps` --references--> `User`  [EXTRACTED]
  frontend/components/concept-syllabus-sidebar.tsx → frontend/lib/auth.ts
- `StudentDashboardPage()` --calls--> `useTheme()`  [EXTRACTED]
  frontend/app/student/dashboard/page.tsx → frontend/providers/theme-provider.tsx
- `StudentAppShellLayout()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/student/layout.tsx → frontend/providers/snackbar-provider.tsx
- `RetroHomepage()` --calls--> `useTheme()`  [EXTRACTED]
  frontend/components/home/retro-homepage.tsx → frontend/providers/theme-provider.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (142 total, 65 thin omitted)

### Community 0 - "Roles"
Cohesion: 0.15
Nodes (15): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+7 more)

### Community 1 - "Module"
Cohesion: 0.15
Nodes (19): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, Module (+11 more)

### Community 2 - "profile/page.tsx"
Cohesion: 0.10
Nodes (28): CallbackHandler(), LoginPage(), LoginStage, RegisterPage(), RegisterStage, BasicInfoFormData, basicInfoSchema, ChangePasswordFormData (+20 more)

### Community 3 - ".answerReviewItem"
Cohesion: 0.20
Nodes (10): ReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+2 more)

### Community 4 - "ConceptsController"
Cohesion: 0.07
Nodes (28): ApiQuery, ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+20 more)

### Community 5 - "GetActivityQueryDto"
Cohesion: 0.12
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 6 - "Roadmap"
Cohesion: 0.14
Nodes (9): Roadmap, Column, Entity, JoinColumn, ManyToOne, OneToMany, RoadmapsService, Injectable (+1 more)

### Community 7 - "UsersService"
Cohesion: 0.14
Nodes (5): JwtPayload, JwtStrategy, Injectable, Injectable, UsersService

### Community 8 - "InstructorAnalyticsController"
Cohesion: 0.15
Nodes (13): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+5 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "McqQuestion"
Cohesion: 0.16
Nodes (19): MostMissedOption, InjectRepository, McqAttempt, Column, Entity, JoinColumn, ManyToOne, McqOption (+11 more)

### Community 14 - "UserConceptProgress"
Cohesion: 0.12
Nodes (16): ConceptReviewStatus, ProgressStatus, makeConcept(), makeProgress(), AnalyticsService, Injectable, InjectRepository, Column (+8 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.10
Nodes (26): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+18 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "QaController"
Cohesion: 0.25
Nodes (12): QaController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 19 - "UserRole"
Cohesion: 0.38
Nodes (4): UserRole, ROLES_KEY, RolesGuard, Injectable

### Community 20 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !**/*.spec.ts, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, **/*.(t|j)s

### Community 21 - "User"
Cohesion: 0.13
Nodes (22): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+14 more)

### Community 22 - "useSnackbar"
Cohesion: 0.06
Nodes (45): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+37 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (12): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+4 more)

### Community 25 - "user.entity.ts"
Cohesion: 0.13
Nodes (21): BaseEntity, CreateDateColumn, UpdateDateColumn, slugify(), dataSourceOptions, entities, ModuleConcept, Column (+13 more)

### Community 26 - "auth.ts"
Cohesion: 0.17
Nodes (19): AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, InstructorAppShellLayout(), RootPage(), StudentAppShellLayout() (+11 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.21
Nodes (11): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+3 more)

### Community 30 - "ReviewItem"
Cohesion: 0.25
Nodes (7): ReviewItem, Column, Entity, JoinColumn, ManyToOne, Unique, InjectRepository

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), SnackbarProvider()

### Community 34 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

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
Cohesion: 0.08
Nodes (28): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString (+20 more)

### Community 39 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 40 - "forgot-password/page.tsx"
Cohesion: 0.20
Nodes (8): EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData, otpStepSchema, PasswordStepFormData, passwordStepSchema, ResetStep

### Community 41 - "CurrentUser"
Cohesion: 0.23
Nodes (14): CurrentUser, RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+6 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "auth.module.ts"
Cohesion: 0.13
Nodes (9): IS_PUBLIC_KEY, JwtAuthGuard, Injectable, OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable (+1 more)

### Community 45 - "QuizService"
Cohesion: 0.14
Nodes (14): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+6 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.14
Nodes (16): BadgeDef, badgeTag(), DARK, EarnedBadgeItem, GamificationData, LIGHT, pad(), plural() (+8 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 49 - "ai-generate.controller.ts"
Cohesion: 0.35
Nodes (13): AcknowledgeJobsDto, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto, GenerateRoadmapModulesDto, ApiProperty, ApiPropertyOptional (+5 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "Answer"
Cohesion: 0.18
Nodes (12): Answer, Column, Entity, JoinColumn, ManyToOne, Question, Column, Entity (+4 more)

### Community 52 - "Concept"
Cohesion: 0.15
Nodes (10): InjectRepository, InjectRepository, ConceptsService, Injectable, InjectRepository, Concept, Column, Entity (+2 more)

### Community 53 - "instructor/layout.tsx"
Cohesion: 0.13
Nodes (14): ADMIN_NAV_ITEMS, FullUser, INSTRUCTOR_NAV_ITEMS, NAV_ITEMS, MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES (+6 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 68 - "quiz.controller.ts"
Cohesion: 0.13
Nodes (14): SubmitAttemptDto, ApiProperty, IsUUID, IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto (+6 more)

### Community 69 - "qa.service.ts"
Cohesion: 0.21
Nodes (10): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, IsNotEmpty, IsString, UpdateAnswerDto, IsNotEmpty (+2 more)

### Community 70 - "PasswordResetOtp"
Cohesion: 0.13
Nodes (10): InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne, EmailModule (+2 more)

### Community 71 - "InstructorProfile"
Cohesion: 0.26
Nodes (12): InstructorStatus, makeUser(), createMockRepository(), MockQueryBuilder, MockRepository, NOW, InstructorProfile, Column (+4 more)

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "factories.ts"
Cohesion: 0.08
Nodes (37): ConceptDifficulty, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeOption(), makeQuestion(), makeReviewItem() (+29 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 76 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 77 - "users.service.ts"
Cohesion: 0.10
Nodes (20): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, GetUsersQueryDto, ApiPropertyOptional, IsEnum, IsOptional (+12 more)

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "ReviewService"
Cohesion: 0.23
Nodes (6): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewService, Injectable

### Community 98 - "roadmaps.controller.ts"
Cohesion: 0.07
Nodes (26): AddModulePrerequisiteDto, ApiProperty, IsUUID, AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional (+18 more)

### Community 116 - "CreateQaQuestionDto"
Cohesion: 0.25
Nodes (7): CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn, IsNotEmpty, IsOptional, IsString

### Community 117 - "AccountDeletionRequest"
Cohesion: 0.29
Nodes (6): AccountDeletionRequest, Column, Entity, JoinColumn, ManyToOne, InjectRepository

### Community 124 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 129 - "ChangePasswordDto"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 130 - "RequestDeletionDto"
Cohesion: 0.33
Nodes (5): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength

### Community 137 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.10
Nodes (24): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, AiGenerateService, ParsedMcqOption, ParsedMcqQuestion, Injectable, buildConceptContentUserPrompt() (+16 more)

## Knowledge Gaps
- **337 isolated node(s):** `LoginStage`, `RegisterStage`, `EarnedBadgeItem`, `GamificationData`, `UserConceptProgress` (+332 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **65 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Roles`, `.answerReviewItem`, `ConceptsController`, `GetActivityQueryDto`, `Roadmap`, `UsersService`, `InstructorAnalyticsController`, `assignments.module.ts`, `AuthService`, `McqQuestion`, `UserConceptProgress`, `AuthController`, `ai-generate.service.ts`, `UserRole`, `QaController`, `user.entity.ts`, `AdminContentReviewController`, `ReviewItem`, `auth.controller.ts`, `CurrentUser`, `auth.module.ts`, `QuizService`, `ai-generate.controller.ts`, `Answer`, `Concept`, `quiz.controller.ts`, `qa.service.ts`, `PasswordResetOtp`, `InstructorProfile`, `factories.ts`, `ProgressController`, `users.service.ts`, `roadmaps.controller.ts`, `QaService`, `CreateQaQuestionDto`, `AccountDeletionRequest`?**
  _High betweenness centrality (0.220) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `Roles`, `.answerReviewItem`, `ConceptsController`, `GetActivityQueryDto`, `InstructorAnalyticsController`, `UserConceptProgress`, `AuthController`, `QaController`, `UserRole`, `User`, `AdminContentReviewController`, `auth.controller.ts`, `QuizService`, `ai-generate.controller.ts`, `quiz.controller.ts`, `qa.service.ts`, `factories.ts`, `ProgressController`, `users.service.ts`, `roadmaps.controller.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `CreateQuestionDto` connect `CreateQuestionDto` to `McqQuestion`, `quiz.controller.ts`, `QuizService`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `LoginStage`, `RegisterStage`, `EarnedBadgeItem` to the rest of the system?**
  _337 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Roles` be split into smaller, more focused modules?**
  _Cohesion score 0.14709851551956815 - nodes in this community are weakly interconnected._
- **Should `Module` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Should `profile/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10158730158730159 - nodes in this community are weakly interconnected._