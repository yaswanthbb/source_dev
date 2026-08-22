# Graph Report - knowledge_is_power  (2026-08-22)

## Corpus Check
- 210 files · ~183,341 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1544 nodes · 3542 edges · 140 communities (69 shown, 71 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 113 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dd9c228e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Roles
- ai-generate.service.ts
- auth.controller.ts
- QuizService
- ConceptsService
- GamificationService
- QaController
- analytics.service.ts
- user.entity.ts
- InstructorProfile
- assignments.module.ts
- roadmaps.controller.ts
- api-client.ts
- Concept
- ReviewService
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- UsersService
- roadmaps.service.ts
- qa.service.ts
- InstructorAnalyticsController
- useSnackbar
- compilerOptions
- AnalyticsController
- admin/dashboard/page.tsx
- profile/page.tsx
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
- AppService
- forgot-password/page.tsx
- QaService
- Next.js Frontend Application
- frontend/package.json
- auth.module.ts
- typeorm.config.ts
- PasswordResetOtp
- exclude
- eslint-plugin-prettier
- ResetPasswordDto
- nest-cli.json
- backend/package.json
- UpdateModuleDto
- JwtAuthGuard
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
- CurrentUser
- User
- AuthService
- @nestjs/passport
- @nestjs/platform-express
- Streak
- ChangePasswordDto
- pg
- RegisterDto
- AttachConceptDto
- devDependencies
- AddOAuthColumns1787300000000
- globals
- UpdateOwnProfileDto
- @nestjs/cli
- .deleteUser
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
- RequestDeletionDto
- UpdateInstructorBioDto
- typescript-eslint
- frontend/eslint.config.mjs
- next.config.ts
- @nestjs/typeorm
- react-hook-form
- react-markdown
- remark-gfm
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- tailwind.config.ts
- Application Icon
- Application Logo
- rxjs
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
- @eslint/eslintrc
- @nestjs/schematics
- @nestjs/testing
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

## God Nodes (most connected - your core abstractions)
1. `User` - 188 edges
2. `CurrentUser` - 74 edges
3. `Concept` - 53 edges
4. `BaseEntity` - 44 edges
5. `Module` - 38 edges
6. `McqQuestion` - 37 edges
7. `useSnackbar()` - 37 edges
8. `UsersService` - 36 edges
9. `Roadmap` - 29 edges
10. `ModuleConcept` - 29 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `InstructorQaPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/instructor/qa/page.tsx → frontend/providers/snackbar-provider.tsx
- `PasswordResetOtp` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/auth/entities/password-reset-otp.entity.ts → backend/src/common/entities/base.entity.ts
- `PasswordResetOtp` --references--> `User`  [EXTRACTED]
  backend/src/modules/auth/entities/password-reset-otp.entity.ts → backend/src/modules/users/entities/user.entity.ts
- `AccountDeletionRequest` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/users/entities/account-deletion-request.entity.ts → backend/src/common/entities/base.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (140 total, 71 thin omitted)

### Community 0 - "Roles"
Cohesion: 0.22
Nodes (12): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+4 more)

### Community 1 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (44): AiGenerationType, AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+36 more)

### Community 2 - "auth.controller.ts"
Cohesion: 0.10
Nodes (18): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LinkOAuthDto, ApiProperty, IsNotEmpty, IsString (+10 more)

### Community 3 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (33): ApiQuery, ConceptDifficulty, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+25 more)

### Community 5 - "GamificationService"
Cohesion: 0.06
Nodes (29): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+21 more)

### Community 6 - "QaController"
Cohesion: 0.17
Nodes (16): CreateQaQuestionDto, ApiProperty, IsNotEmpty, IsString, QaController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 7 - "analytics.service.ts"
Cohesion: 0.23
Nodes (11): ProgressStatus, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, Column, Entity, JoinColumn (+3 more)

### Community 8 - "user.entity.ts"
Cohesion: 0.13
Nodes (16): InstructorStatus, UserRole, slugify(), ROLES_KEY, RolesGuard, Injectable, InstructorConceptAnalytics, InstructorOverviewAnalytics (+8 more)

### Community 9 - "InstructorProfile"
Cohesion: 0.13
Nodes (13): InjectRepository, AccountDeletionRequest, Column, Entity, JoinColumn, ManyToOne, InstructorProfile, Column (+5 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "roadmaps.controller.ts"
Cohesion: 0.09
Nodes (19): AddModulePrerequisiteDto, ApiProperty, IsUUID, CreateModuleDto, IsInt, IsNotEmpty, IsString, Min (+11 more)

### Community 12 - "api-client.ts"
Cohesion: 0.17
Nodes (19): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), NAV_ITEMS, StudentAppShellLayout() (+11 more)

### Community 13 - "Concept"
Cohesion: 0.12
Nodes (28): BaseEntity, CreateDateColumn, UpdateDateColumn, ConceptReviewStatus, InjectRepository, Concept, Column, Entity (+20 more)

### Community 14 - "ReviewService"
Cohesion: 0.12
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.11
Nodes (25): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+17 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "UsersService"
Cohesion: 0.14
Nodes (5): JwtPayload, JwtStrategy, Injectable, Injectable, UsersService

### Community 19 - "roadmaps.service.ts"
Cohesion: 0.08
Nodes (41): AppModule, typeOrmAsyncConfig, AiGenerateModule, InjectRepository, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule (+33 more)

### Community 20 - "qa.service.ts"
Cohesion: 0.15
Nodes (13): Answer, Column, Entity, JoinColumn, ManyToOne, Question, Column, Entity (+5 more)

### Community 21 - "InstructorAnalyticsController"
Cohesion: 0.15
Nodes (13): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, InstructorAnalyticsController, InstructorAnalyticsService, Controller, CurrentUser (+5 more)

### Community 22 - "useSnackbar"
Cohesion: 0.07
Nodes (37): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+29 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.18
Nodes (10): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+2 more)

### Community 25 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 26 - "profile/page.tsx"
Cohesion: 0.14
Nodes (18): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, BasicInfoFormData (+10 more)

### Community 27 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, bcrypt, class-transformer, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/jwt (+13 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.14
Nodes (15): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+7 more)

### Community 30 - "[roadmapId]/page.tsx"
Cohesion: 0.19
Nodes (12): CreateRoadmapPage(), ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiGenerateButton() (+4 more)

### Community 31 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+9 more)

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
Cohesion: 0.16
Nodes (13): Badge, BADGE_IMAGE_MAP, BADGE_NAME_MAP, DIFF_COLORS, EarnedBadgeItem, GamificationData, getBadgeImage(), Roadmap (+5 more)

### Community 39 - "AppService"
Cohesion: 0.29
Nodes (5): AppController, Controller, Get, AppService, Injectable

### Community 40 - "forgot-password/page.tsx"
Cohesion: 0.20
Nodes (8): EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData, otpStepSchema, PasswordStepFormData, passwordStepSchema, ResetStep

### Community 41 - "QaService"
Cohesion: 0.12
Nodes (12): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, IsNotEmpty, IsString, UpdateAnswerDto, IsNotEmpty (+4 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "auth.module.ts"
Cohesion: 0.16
Nodes (8): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable, EmailModule, EmailService, Injectable

### Community 45 - "typeorm.config.ts"
Cohesion: 0.09
Nodes (26): XpSource, dataSourceOptions, entities, InjectRepository, Badge, Column, Entity, CreateDateColumn (+18 more)

### Community 46 - "PasswordResetOtp"
Cohesion: 0.25
Nodes (7): InjectRepository, PasswordResetOtp, Column, Entity, JoinColumn, ManyToOne, Index

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

### Community 52 - "UpdateModuleDto"
Cohesion: 0.25
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 53 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 68 - "CurrentUser"
Cohesion: 0.23
Nodes (14): CurrentUser, RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+6 more)

### Community 69 - "User"
Cohesion: 0.20
Nodes (6): RoadmapsService, Injectable, Column, Entity, OneToOne, User

### Community 70 - "AuthService"
Cohesion: 0.15
Nodes (6): AuthService, Injectable, LoginDto, ApiProperty, IsEmail, IsString

### Community 73 - "Streak"
Cohesion: 0.25
Nodes (8): Streak, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn

### Community 74 - "ChangePasswordDto"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 76 - "RegisterDto"
Cohesion: 0.29
Nodes (6): RegisterDto, ApiProperty, IsEmail, IsNotEmpty, IsString, MinLength

### Community 77 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "UpdateOwnProfileDto"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, UpdateOwnProfileDto

### Community 97 - "RequestDeletionDto"
Cohesion: 0.16
Nodes (11): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString (+3 more)

### Community 98 - "UpdateInstructorBioDto"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsOptional, IsString, MaxLength, UpdateInstructorBioDto

## Knowledge Gaps
- **300 isolated node(s):** `MostMissedOption`, `ConceptSummary`, `QaAnswer`, `QaQuestion`, `JwtPayload` (+295 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Roles`, `ai-generate.service.ts`, `auth.controller.ts`, `QuizService`, `ConceptsService`, `GamificationService`, `QaController`, `analytics.service.ts`, `user.entity.ts`, `InstructorProfile`, `assignments.module.ts`, `roadmaps.controller.ts`, `Concept`, `ReviewService`, `AuthController`, `UsersService`, `roadmaps.service.ts`, `qa.service.ts`, `AdminContentReviewController`, `QaService`, `auth.module.ts`, `typeorm.config.ts`, `PasswordResetOtp`, `UpdateModuleDto`, `CurrentUser`, `AuthService`, `Streak`, `ChangePasswordDto`, `UpdateOwnProfileDto`, `.deleteUser`, `RequestDeletionDto`, `UpdateInstructorBioDto`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `Roles`, `ai-generate.service.ts`, `auth.controller.ts`, `QuizService`, `ConceptsService`, `GamificationService`, `QaController`, `user.entity.ts`, `roadmaps.controller.ts`, `ReviewService`, `AuthController`, `qa.service.ts`, `AdminContentReviewController`, `typeorm.config.ts`, `ChangePasswordDto`, `UpdateOwnProfileDto`, `.deleteUser`, `RequestDeletionDto`, `UpdateInstructorBioDto`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `ai-generate.service.ts`, `ConceptsService`, `User`, `GamificationService`, `analytics.service.ts`, `user.entity.ts`, `InstructorProfile`, `assignments.module.ts`, `typeorm.config.ts`, `roadmaps.service.ts`, `qa.service.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `MostMissedOption`, `ConceptSummary`, `QaAnswer` to the rest of the system?**
  _300 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai-generate.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0772635814889336 - nodes in this community are weakly interconnected._
- **Should `auth.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09666666666666666 - nodes in this community are weakly interconnected._
- **Should `QuizService` be split into smaller, more focused modules?**
  _Cohesion score 0.052429667519181586 - nodes in this community are weakly interconnected._