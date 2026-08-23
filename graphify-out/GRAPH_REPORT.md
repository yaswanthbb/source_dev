# Graph Report - knowledge_is_power  (2026-08-23)

## Corpus Check
- 211 files · ~186,254 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1583 nodes · 3411 edges · 154 communities (67 shown, 87 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 114 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `86f4d4b6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- ai-generate.controller.ts
- auth.controller.ts
- CurrentUser
- ConceptsService
- GamificationService
- qa.controller.ts
- analytics.service.ts
- InstructorAnalyticsController
- api-client.ts
- assignments.module.ts
- roadmaps.controller.ts
- auth.ts
- McqQuestion
- ReviewService
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- JwtAuthGuard
- ai-generate.service.ts
- user.entity.ts
- OneToMany
- useSnackbar
- compilerOptions
- AnalyticsController
- ReviewItem
- User
- dependencies
- edit/page.tsx
- AdminContentReviewController
- [roadmapId]/page.tsx
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
- auth.module.ts
- CreateQuestionDto
- quiz.controller.ts
- exclude
- eslint-plugin-prettier
- ResetPasswordDto
- nest-cli.json
- backend/package.json
- Concept
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
- ProgressService
- RejectConceptDto
- @nestjs/passport
- admin-content-review.controller.ts
- User
- AuthService
- pg
- RegisterDto
- CreateModuleDto
- devDependencies
- AddOAuthColumns1787300000000
- globals
- users.service.ts
- @nestjs/cli
- LoginDto
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
- concept.entity.ts
- ApiProperty
- ApiPropertyOptional
- Req
- Res
- IsEnum
- MaxLength
- Query
- Column
- Entity
- IsNotEmpty
- IsOptional
- IsString
- JoinColumn
- ManyToOne

## God Nodes (most connected - your core abstractions)
1. `User` - 110 edges
2. `Concept` - 49 edges
3. `CurrentUser` - 47 edges
4. `BaseEntity` - 41 edges
5. `useSnackbar()` - 37 edges
6. `UsersService` - 36 edges
7. `McqQuestion` - 34 edges
8. `Module` - 31 edges
9. `Roadmap` - 27 edges
10. `UserConceptProgress` - 26 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `ConceptSyllabusSidebarProps` --references--> `User`  [EXTRACTED]
  frontend/components/concept-syllabus-sidebar.tsx → frontend/lib/auth.ts
- `StudentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/student/review/page.tsx → frontend/providers/snackbar-provider.tsx
- `AdminUsersDirectoryPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/admin/users/page.tsx → frontend/providers/snackbar-provider.tsx
- `InstructorDashboardPage()` --calls--> `getUser()`  [EXTRACTED]
  frontend/app/instructor/dashboard/page.tsx → frontend/lib/auth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (154 total, 87 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.07
Nodes (27): JwtPayload, JwtStrategy, Injectable, ApiPropertyOptional, IsOptional, IsString, UpdateInstructorBioDto, ApiBearerAuth (+19 more)

### Community 1 - "ai-generate.controller.ts"
Cohesion: 0.08
Nodes (40): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+32 more)

### Community 2 - "auth.controller.ts"
Cohesion: 0.10
Nodes (18): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LinkOAuthDto, ApiProperty, IsNotEmpty, IsString (+10 more)

### Community 3 - "CurrentUser"
Cohesion: 0.26
Nodes (13): CurrentUser, QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+5 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (34): ApiQuery, ConceptDifficulty, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+26 more)

### Community 5 - "GamificationService"
Cohesion: 0.10
Nodes (17): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+9 more)

### Community 6 - "qa.controller.ts"
Cohesion: 0.07
Nodes (30): ApiProperty, CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsNotEmpty (+22 more)

### Community 7 - "analytics.service.ts"
Cohesion: 0.09
Nodes (32): ProgressStatus, XpSource, InjectRepository, Badge, Column, Entity, Streak, Column (+24 more)

### Community 8 - "InstructorAnalyticsController"
Cohesion: 0.10
Nodes (19): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, AppController, AppService, Injectable, InstructorAnalyticsController (+11 more)

### Community 9 - "api-client.ts"
Cohesion: 0.16
Nodes (10): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, AnswerResult, DueReviewItem, ReviewOption, ReviewQuestion (+2 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (17): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Submission (+9 more)

### Community 11 - "roadmaps.controller.ts"
Cohesion: 0.07
Nodes (27): AddModulePrerequisiteDto, ApiProperty, IsUUID, AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional (+19 more)

### Community 12 - "auth.ts"
Cohesion: 0.17
Nodes (16): ADMIN_NAV_ITEMS, AdminAppShellLayout(), INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), NAV_ITEMS, StudentAppShellLayout(), LogoutConfirmationModal() (+8 more)

### Community 13 - "McqQuestion"
Cohesion: 0.18
Nodes (17): McqAttempt, Column, Entity, JoinColumn, ManyToOne, McqOption, Column, Entity (+9 more)

### Community 14 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.13
Nodes (21): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+13 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.21
Nodes (15): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+7 more)

### Community 18 - "JwtAuthGuard"
Cohesion: 0.29
Nodes (4): IS_PUBLIC_KEY, Public(), JwtAuthGuard, Injectable

### Community 19 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (42): AppModule, typeOrmAsyncConfig, AiGenerateModule, ParsedMcqOption, ParsedMcqQuestion, AnalyticsModule, AssignmentsModule, ContentModule (+34 more)

### Community 20 - "user.entity.ts"
Cohesion: 0.09
Nodes (28): BaseEntity, CreateDateColumn, UpdateDateColumn, AiGenerationType, dataSourceOptions, entities, AiGenerationLog, Column (+20 more)

### Community 22 - "useSnackbar"
Cohesion: 0.08
Nodes (31): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+23 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (14): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+6 more)

### Community 25 - "ReviewItem"
Cohesion: 0.25
Nodes (7): ReviewItem, Column, Entity, JoinColumn, ManyToOne, Unique, InjectRepository

### Community 26 - "User"
Cohesion: 0.14
Nodes (20): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, FullUser (+12 more)

### Community 27 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, bcrypt, class-transformer, class-validator, @nestjs/common, @nestjs/config, @nestjs/jwt, @nestjs/platform-express (+15 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.16
Nodes (14): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+6 more)

### Community 30 - "[roadmapId]/page.tsx"
Cohesion: 0.19
Nodes (12): CreateRoadmapPage(), ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiGenerateButton() (+4 more)

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
Cohesion: 0.20
Nodes (10): InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, ConceptSummary, InstructorQaPage(), QaAnswer, QaQuestion (+2 more)

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

### Community 44 - "auth.module.ts"
Cohesion: 0.14
Nodes (10): AuthModule, OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable, EmailModule, EmailService (+2 more)

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

### Community 52 - "Concept"
Cohesion: 0.18
Nodes (8): InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne, InjectRepository, InjectRepository

### Community 53 - "PasswordResetOtp"
Cohesion: 0.33
Nodes (6): PasswordResetOtp, Column, Entity, JoinColumn, ManyToOne, Index

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 69 - "ProgressService"
Cohesion: 0.17
Nodes (11): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+3 more)

### Community 70 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 72 - "admin-content-review.controller.ts"
Cohesion: 0.38
Nodes (5): UserRole, Roles(), ROLES_KEY, RolesGuard, Injectable

### Community 73 - "User"
Cohesion: 0.22
Nodes (6): QuizService, Injectable, Column, Entity, OneToOne, User

### Community 74 - "AuthService"
Cohesion: 0.20
Nodes (3): AuthService, Injectable, InjectRepository

### Community 76 - "RegisterDto"
Cohesion: 0.29
Nodes (6): RegisterDto, ApiProperty, IsEmail, IsNotEmpty, IsString, MinLength

### Community 77 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/eslintrc, @eslint/js, @nestjs/schematics, @nestjs/testing, @eslint/eslintrc, @eslint/js, @nestjs/schematics (+1 more)

### Community 81 - "users.service.ts"
Cohesion: 0.09
Nodes (25): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, ChangePasswordDto, ApiProperty, IsNotEmpty, IsString (+17 more)

### Community 83 - "LoginDto"
Cohesion: 0.40
Nodes (4): LoginDto, ApiProperty, IsEmail, IsString

### Community 141 - "concept.entity.ts"
Cohesion: 0.16
Nodes (15): ConceptReviewStatus, InstructorStatus, slugify(), MostMissedOption, Answer, Column, Entity, JoinColumn (+7 more)

## Knowledge Gaps
- **304 isolated node(s):** `UserDirectoryItem`, `DeletionRequestItem`, `InstructorOverview`, `InstructorConceptMetric`, `InstructorQuizQuestionMetric` (+299 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **87 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `ai-generate.controller.ts`, `auth.controller.ts`, `CurrentUser`, `ConceptsService`, `GamificationService`, `qa.controller.ts`, `analytics.service.ts`, `assignments.module.ts`, `roadmaps.controller.ts`, `concept.entity.ts`, `McqQuestion`, `ReviewService`, `ai-generate.service.ts`, `user.entity.ts`, `ReviewItem`, `auth.module.ts`, `quiz.controller.ts`, `PasswordResetOtp`, `ProgressService`, `admin-content-review.controller.ts`, `users.service.ts`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `ai-generate.controller.ts`, `ConceptsService`, `analytics.service.ts`, `admin-content-review.controller.ts`, `concept.entity.ts`, `McqQuestion`, `ai-generate.service.ts`, `user.entity.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `ai-generate.controller.ts`, `auth.controller.ts`, `ConceptsService`, `GamificationService`, `ProgressService`, `qa.controller.ts`, `admin-content-review.controller.ts`, `roadmaps.controller.ts`, `quiz.controller.ts`, `ReviewService`, `users.service.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `UserDirectoryItem`, `DeletionRequestItem`, `InstructorOverview` to the rest of the system?**
  _304 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.06771929824561404 - nodes in this community are weakly interconnected._
- **Should `ai-generate.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0773405698778833 - nodes in this community are weakly interconnected._
- **Should `auth.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10144927536231885 - nodes in this community are weakly interconnected._