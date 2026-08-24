# Graph Report - knowledge_is_power  (2026-08-24)

## Corpus Check
- 217 files · ~189,841 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1635 nodes · 3507 edges · 167 communities (66 shown, 101 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `003045bc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- analytics.service.ts
- CreateModuleDto
- QuizService
- ConceptsService
- GamificationService
- CurrentUser
- Answer
- AiGenerateService
- admin/dashboard/page.tsx
- assignments.module.ts
- roadmaps.controller.ts
- ReviewItem
- McqQuestion
- ReviewService
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- api-client.ts
- Concept
- auth.module.ts
- OneToMany
- useSnackbar
- compilerOptions
- AnalyticsController
- gamification.service.ts
- auth.ts
- dependencies
- edit/page.tsx
- AdminContentReviewController
- ResetPasswordDto
- scripts
- devDependencies
- app/layout.tsx
- getUser
- dependencies
- Content Authoring Flow
- jest
- Controller
- forgot-password/page.tsx
- RoadmapsService
- Next.js Frontend Application
- frontend/package.json
- oauth-profile.interface.ts
- exclude
- eslint-plugin-prettier
- profile/page.tsx
- nest-cli.json
- backend/package.json
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
- auth.controller.ts
- UserConceptProgress
- RejectConceptDto
- @nestjs/passport
- [roadmapId]/page.tsx
- admin-content-review.controller.ts
- pg
- RegisterDto
- app.module.ts
- devDependencies
- AddOAuthColumns1787300000000
- globals
- users.service.ts
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
- User
- JwtAuthGuard
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
- VerifyOtpDto
- AddAiJobRetryAndAck1787700000000

## God Nodes (most connected - your core abstractions)
1. `User` - 104 edges
2. `Concept` - 47 edges
3. `BaseEntity` - 42 edges
4. `CurrentUser` - 40 edges
5. `useSnackbar()` - 39 edges
6. `UsersService` - 36 edges
7. `AiGenerateService` - 36 edges
8. `McqQuestion` - 34 edges
9. `Module` - 30 edges
10. `Roadmap` - 26 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `CreateConceptPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/instructor/concepts/new/page.tsx → frontend/providers/snackbar-provider.tsx
- `AiJobResultModalProps` --references--> `AiGenerationJob`  [EXTRACTED]
  frontend/components/ai-job-result-modal.tsx → frontend/providers/ai-jobs-provider.tsx
- `AiJobsProvider()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/providers/ai-jobs-provider.tsx → frontend/providers/snackbar-provider.tsx
- `AdminContentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/admin/content-review/page.tsx → frontend/providers/snackbar-provider.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (167 total, 101 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.06
Nodes (30): AuthService, Injectable, InjectRepository, JwtPayload, JwtStrategy, Injectable, ApiPropertyOptional, IsOptional (+22 more)

### Community 1 - "analytics.service.ts"
Cohesion: 0.24
Nodes (9): InstructorStatus, ProgressStatus, MostMissedOption, InstructorProfile, Column, Entity, JoinColumn, ManyToOne (+1 more)

### Community 2 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 3 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (34): ApiQuery, ConceptDifficulty, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+26 more)

### Community 5 - "GamificationService"
Cohesion: 0.10
Nodes (17): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+9 more)

### Community 6 - "CurrentUser"
Cohesion: 0.06
Nodes (40): CurrentUser, ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get (+32 more)

### Community 7 - "Answer"
Cohesion: 0.29
Nodes (6): InjectRepository, Answer, Column, Entity, JoinColumn, ManyToOne

### Community 8 - "AiGenerateService"
Cohesion: 0.07
Nodes (27): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, AppController, AppService, Injectable, AiGenerateController (+19 more)

### Community 9 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (17): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Submission (+9 more)

### Community 11 - "roadmaps.controller.ts"
Cohesion: 0.07
Nodes (27): AddModulePrerequisiteDto, ApiProperty, IsUUID, AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional (+19 more)

### Community 12 - "ReviewItem"
Cohesion: 0.25
Nodes (7): ReviewItem, Column, Entity, JoinColumn, ManyToOne, Unique, InjectRepository

### Community 13 - "McqQuestion"
Cohesion: 0.15
Nodes (17): McqAttempt, Column, Entity, JoinColumn, ManyToOne, McqOption, Column, Entity (+9 more)

### Community 14 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.07
Nodes (37): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+29 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.19
Nodes (15): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+7 more)

### Community 18 - "api-client.ts"
Cohesion: 0.25
Nodes (7): ConceptSummary, CreateConceptPage(), ModuleConceptItem, RoadmapData, RoadmapModuleItem, AiQuotaBadge(), AiQuotaBadgeProps

### Community 19 - "Concept"
Cohesion: 0.11
Nodes (29): ConceptReviewStatus, slugify(), ContentModule, Concept, Column, Entity, JoinColumn, ManyToOne (+21 more)

### Community 20 - "auth.module.ts"
Cohesion: 0.38
Nodes (3): EmailModule, EmailService, Injectable

### Community 22 - "useSnackbar"
Cohesion: 0.07
Nodes (33): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+25 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (14): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+6 more)

### Community 25 - "gamification.service.ts"
Cohesion: 0.10
Nodes (24): XpSource, Badge, Column, Entity, Streak, Column, CreateDateColumn, Entity (+16 more)

### Community 26 - "auth.ts"
Cohesion: 0.16
Nodes (20): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), NAV_ITEMS, StudentAppShellLayout() (+12 more)

### Community 27 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, bcrypt, class-transformer, class-validator, @nestjs/common, @nestjs/config, @nestjs/jwt, @nestjs/platform-express (+15 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.16
Nodes (14): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+6 more)

### Community 30 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

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

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, dist, **/*spec.ts, test, ./tsconfig.json

### Community 49 - "profile/page.tsx"
Cohesion: 0.14
Nodes (18): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, BasicInfoFormData (+10 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 53 - "PasswordResetOtp"
Cohesion: 0.40
Nodes (5): PasswordResetOtp, Column, Entity, JoinColumn, ManyToOne

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 68 - "auth.controller.ts"
Cohesion: 0.19
Nodes (9): LinkOAuthDto, ApiProperty, IsNotEmpty, IsString, GitHubAuthGuard, Injectable, GoogleAuthGuard, Injectable (+1 more)

### Community 69 - "UserConceptProgress"
Cohesion: 0.18
Nodes (9): Column, Entity, JoinColumn, ManyToOne, Unique, UserConceptProgress, ProgressService, Injectable (+1 more)

### Community 70 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 74 - "admin-content-review.controller.ts"
Cohesion: 0.38
Nodes (5): UserRole, Roles(), ROLES_KEY, RolesGuard, Injectable

### Community 76 - "RegisterDto"
Cohesion: 0.29
Nodes (6): RegisterDto, ApiProperty, IsEmail, IsNotEmpty, IsString, MinLength

### Community 77 - "app.module.ts"
Cohesion: 0.13
Nodes (20): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, Module, Column (+12 more)

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/eslintrc, @eslint/js, @nestjs/schematics, @nestjs/testing, @eslint/eslintrc, @eslint/js, @nestjs/schematics (+1 more)

### Community 81 - "users.service.ts"
Cohesion: 0.09
Nodes (25): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, ChangePasswordDto, ApiProperty, IsNotEmpty, IsString (+17 more)

### Community 83 - "auth.service.ts"
Cohesion: 0.22
Nodes (8): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString

### Community 141 - "User"
Cohesion: 0.12
Nodes (26): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, Assignment, Column, Entity (+18 more)

### Community 142 - "JwtAuthGuard"
Cohesion: 0.29
Nodes (4): IS_PUBLIC_KEY, Public(), JwtAuthGuard, Injectable

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.09
Nodes (39): ApiProperty, ApiPropertyOptional, AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, ParsedMcqOption, ParsedMcqQuestion, buildModuleConceptsUserPrompt() (+31 more)

### Community 174 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, VerifyOtpDto, Matches

## Knowledge Gaps
- **311 isolated node(s):** `JOB_TYPE_NOUN`, `AiGenerationJobStatus`, `AiGenerationJobFailedItem`, `AiGenerationJobResultSummary`, `AiJobsContextValue` (+306 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **101 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `analytics.service.ts`, `QuizService`, `ConceptsService`, `GamificationService`, `CurrentUser`, `Answer`, `assignments.module.ts`, `roadmaps.controller.ts`, `ReviewItem`, `McqQuestion`, `ReviewService`, `ai-generate.service.ts`, `Concept`, `auth.module.ts`, `gamification.service.ts`, `PasswordResetOtp`, `auth.controller.ts`, `UserConceptProgress`, `admin-content-review.controller.ts`, `app.module.ts`, `users.service.ts`, `auth.service.ts`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `QuizService`, `ConceptsService`, `auth.controller.ts`, `GamificationService`, `UserConceptProgress`, `admin-content-review.controller.ts`, `roadmaps.controller.ts`, `McqQuestion`, `ReviewService`, `users.service.ts`, `ai-generate.service.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `analytics.service.ts`, `ConceptsService`, `UserConceptProgress`, `CurrentUser`, `Answer`, `admin-content-review.controller.ts`, `app.module.ts`, `User`, `McqQuestion`, `ai-generate.service.ts`, `gamification.service.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `JOB_TYPE_NOUN`, `AiGenerationJobStatus`, `AiGenerationJobFailedItem` to the rest of the system?**
  _311 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.05880665519219736 - nodes in this community are weakly interconnected._
- **Should `QuizService` be split into smaller, more focused modules?**
  _Cohesion score 0.052884615384615384 - nodes in this community are weakly interconnected._
- **Should `ConceptsService` be split into smaller, more focused modules?**
  _Cohesion score 0.057329462989840346 - nodes in this community are weakly interconnected._