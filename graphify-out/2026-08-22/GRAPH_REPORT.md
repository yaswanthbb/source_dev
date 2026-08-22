# Graph Report - knowledge_is_power  (2026-08-22)

## Corpus Check
- 210 files · ~183,327 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1533 nodes · 3558 edges · 130 communities (68 shown, 62 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 113 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `470559f3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- User
- ai-generate.service.ts
- auth.controller.ts
- quiz.service.ts
- ConceptsService
- GetActivityQueryDto
- qa.service.ts
- analytics.service.ts
- users.service.ts
- Concept
- assignments.module.ts
- roadmaps.service.ts
- api-client.ts
- user.entity.ts
- ReviewService
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- McqQuestion
- Module
- InstructorProfile
- InstructorAnalyticsController
- useSnackbar
- compilerOptions
- AnalyticsController
- apiClient
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
- Roadmap
- Next.js Frontend Application
- frontend/package.json
- OAuthProfile
- gamification.module.ts
- admin-content-review.controller.ts
- exclude
- eslint-plugin-prettier
- .linkOAuth
- nest-cli.json
- backend/package.json
- LinkOAuthDto
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
- RoadmapsService
- .forgotPassword
- @nestjs/passport
- @nestjs/platform-express
- RejectConceptDto
- ChangePasswordDto
- pg
- ProgressController
- AttachConceptDto
- devDependencies
- AddOAuthColumns1787300000000
- globals
- jest
- @nestjs/cli
- VerifyOtpDto
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
- bcrypt
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

## God Nodes (most connected - your core abstractions)
1. `User` - 196 edges
2. `CurrentUser` - 77 edges
3. `Concept` - 54 edges
4. `BaseEntity` - 44 edges
5. `Module` - 38 edges
6. `McqQuestion` - 38 edges
7. `useSnackbar()` - 37 edges
8. `UsersService` - 36 edges
9. `Roadmap` - 30 edges
10. `ModuleConcept` - 29 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `AdminContentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/admin/content-review/page.tsx → frontend/providers/snackbar-provider.tsx
- `AiGenerationLog` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/ai-generate/entities/ai-generation-log.entity.ts → backend/src/common/entities/base.entity.ts
- `Assignment` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/assignments/entities/assignment.entity.ts → backend/src/common/entities/base.entity.ts
- `Submission` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/assignments/entities/submission.entity.ts → backend/src/common/entities/base.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (130 total, 62 thin omitted)

### Community 0 - "User"
Cohesion: 0.06
Nodes (39): AuthService, Injectable, InjectRepository, Roles(), PasswordResetOtp, Column, Entity, JoinColumn (+31 more)

### Community 1 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (44): AiGenerationType, AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+36 more)

### Community 2 - "auth.controller.ts"
Cohesion: 0.13
Nodes (14): LoginDto, ApiProperty, IsEmail, IsString, RegisterDto, ApiProperty, IsEmail, IsNotEmpty (+6 more)

### Community 3 - "quiz.service.ts"
Cohesion: 0.06
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (33): ApiQuery, ConceptDifficulty, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+25 more)

### Community 5 - "GetActivityQueryDto"
Cohesion: 0.11
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 6 - "qa.service.ts"
Cohesion: 0.08
Nodes (28): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, IsNotEmpty, IsString (+20 more)

### Community 7 - "analytics.service.ts"
Cohesion: 0.12
Nodes (17): ProgressStatus, XpSource, Column, Entity, JoinColumn, ManyToOne, XpEvent, GamificationService (+9 more)

### Community 8 - "users.service.ts"
Cohesion: 0.15
Nodes (16): InstructorStatus, ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, GetUsersQueryDto, ApiPropertyOptional, IsEnum (+8 more)

### Community 9 - "Concept"
Cohesion: 0.09
Nodes (25): ConceptReviewStatus, InjectRepository, InjectRepository, InjectRepository, Concept, Column, Entity, JoinColumn (+17 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "roadmaps.service.ts"
Cohesion: 0.09
Nodes (26): slugify(), AddModulePrerequisiteDto, ApiProperty, IsUUID, CreateModuleDto, IsInt, IsNotEmpty, IsString (+18 more)

### Community 12 - "api-client.ts"
Cohesion: 0.17
Nodes (19): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), NAV_ITEMS, StudentAppShellLayout() (+11 more)

### Community 13 - "user.entity.ts"
Cohesion: 0.16
Nodes (17): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, MostMissedOption, McqAttempt, Column (+9 more)

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
Cohesion: 0.33
Nodes (9): AuthController, ApiOperation, ApiTags, Controller, Get, Req, Res, UseGuards (+1 more)

### Community 18 - "McqQuestion"
Cohesion: 0.13
Nodes (14): McqQuestion, Column, Entity, JoinColumn, ManyToOne, OneToMany, InjectRepository, ReviewItem (+6 more)

### Community 19 - "Module"
Cohesion: 0.14
Nodes (20): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, Module (+12 more)

### Community 20 - "InstructorProfile"
Cohesion: 0.10
Nodes (20): InjectRepository, Answer, Column, Entity, JoinColumn, ManyToOne, Question, Column (+12 more)

### Community 21 - "InstructorAnalyticsController"
Cohesion: 0.15
Nodes (13): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+5 more)

### Community 22 - "useSnackbar"
Cohesion: 0.08
Nodes (32): AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage(), DeletionRequestItem, UserDirectoryItem, ConceptSummary, CreateConceptPage(), ModuleConceptItem (+24 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (14): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+6 more)

### Community 25 - "apiClient"
Cohesion: 0.15
Nodes (10): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics (+2 more)

### Community 26 - "profile/page.tsx"
Cohesion: 0.14
Nodes (18): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, BasicInfoFormData (+10 more)

### Community 27 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, class-transformer, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/jwt, @nestjs/swagger (+13 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.21
Nodes (11): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+3 more)

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
Cohesion: 0.22
Nodes (9): InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, ConceptSummary, InstructorQaPage(), QaAnswer, QaQuestion (+1 more)

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

### Community 41 - "Roadmap"
Cohesion: 0.25
Nodes (7): InjectRepository, Roadmap, Column, Entity, JoinColumn, ManyToOne, OneToMany

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "OAuthProfile"
Cohesion: 0.20
Nodes (5): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable

### Community 45 - "gamification.module.ts"
Cohesion: 0.12
Nodes (18): Badge, Column, Entity, Streak, Column, CreateDateColumn, Entity, JoinColumn (+10 more)

### Community 46 - "admin-content-review.controller.ts"
Cohesion: 0.38
Nodes (4): UserRole, ROLES_KEY, RolesGuard, Injectable

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, dist, **/*spec.ts, test, ./tsconfig.json

### Community 49 - ".linkOAuth"
Cohesion: 0.19
Nodes (10): ApiBearerAuth, ApiResponse, Body, Patch, Post, ResetPasswordDto, ApiProperty, IsNotEmpty (+2 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 52 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsNotEmpty, IsString, IsIn

### Community 53 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 68 - "CurrentUser"
Cohesion: 0.23
Nodes (14): CurrentUser, RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+6 more)

### Community 70 - ".forgotPassword"
Cohesion: 0.20
Nodes (6): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, EmailService, Injectable

### Community 73 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 74 - "ChangePasswordDto"
Cohesion: 0.29
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 76 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 77 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint-config-prettier, @eslint/js, @types/supertest, typescript, typescript, eslint-config-prettier, @eslint/js (+1 more)

### Community 83 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, VerifyOtpDto, Matches

### Community 97 - "RequestDeletionDto"
Cohesion: 0.29
Nodes (5): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength

### Community 98 - "UpdateInstructorBioDto"
Cohesion: 0.29
Nodes (5): ApiPropertyOptional, IsOptional, IsString, MaxLength, UpdateInstructorBioDto

## Knowledge Gaps
- **300 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+295 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **62 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `ai-generate.service.ts`, `auth.controller.ts`, `quiz.service.ts`, `ConceptsService`, `GetActivityQueryDto`, `qa.service.ts`, `analytics.service.ts`, `users.service.ts`, `Concept`, `assignments.module.ts`, `roadmaps.service.ts`, `user.entity.ts`, `ReviewService`, `McqQuestion`, `Module`, `InstructorProfile`, `InstructorAnalyticsController`, `AdminContentReviewController`, `Roadmap`, `gamification.module.ts`, `admin-content-review.controller.ts`, `.linkOAuth`, `CurrentUser`, `RoadmapsService`, `ProgressController`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `User`, `ai-generate.service.ts`, `auth.controller.ts`, `quiz.service.ts`, `ConceptsService`, `GetActivityQueryDto`, `qa.service.ts`, `analytics.service.ts`, `users.service.ts`, `roadmaps.service.ts`, `ProgressController`, `admin-content-review.controller.ts`, `ReviewService`, `.linkOAuth`, `InstructorAnalyticsController`, `AdminContentReviewController`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `User`, `ai-generate.service.ts`, `quiz.service.ts`, `ConceptsService`, `qa.service.ts`, `analytics.service.ts`, `Roadmap`, `assignments.module.ts`, `roadmaps.service.ts`, `user.entity.ts`, `admin-content-review.controller.ts`, `gamification.module.ts`, `McqQuestion`, `Module`, `InstructorProfile`, `AdminContentReviewController`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _300 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.05799373040752351 - nodes in this community are weakly interconnected._
- **Should `ai-generate.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07784679089026915 - nodes in this community are weakly interconnected._
- **Should `auth.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._