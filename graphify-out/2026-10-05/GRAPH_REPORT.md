# Graph Report - knowledge_is_power  (2026-10-05)

## Corpus Check
- 302 files · ~270,337 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1587 nodes · 3671 edges · 149 communities (64 shown, 85 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 114 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `77610518`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersController
- concept.entity.ts
- users.service.ts
- ReviewService
- User
- gamification.controller.ts
- QaService
- concepts.service.ts
- admin-commands.ts
- source:dev — Master Plan
- assignments.module.ts
- CreateModuleDto
- Added
- user.entity.ts
- UserConceptProgress
- api-client.ts
- compilerOptions
- AuthController
- PasswordResetOtp
- roadmaps.controller.ts
- collectCoverageFrom
- analytics.service.spec.ts
- useSnackbar
- compilerOptions
- AnalyticsController
- factories.ts
- auth.ts
- dependencies
- ai-generating-modal.tsx
- AdminContentReviewController
- auth.controller.ts
- scripts
- devDependencies
- app/layout.tsx
- use-terminal-session.ts
- dependencies
- RejectConceptDto
- jest
- JwtAuthGuard
- .deleteUser
- forgot-password/page.tsx
- CurrentUser
- Next.js Frontend Application
- frontend/package.json
- auth.module.ts
- QuizService
- terminal/page.tsx
- exclude
- eslint-plugin-prettier
- login/page.tsx
- nest-cli.json
- content-diff.ts
- AppController
- ApiBearerAuth
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
- ApiOperation
- ApiResponse
- ai-jobs-provider.tsx
- Concept
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
- ApiTags
- typescript-eslint
- Controller
- Get
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
- UseGuards
- Application Logo
- Injectable
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
- InjectRepository
- ApiPropertyOptional
- IsOptional
- IsString
- IsOptional
- IsString
- MaxLength
- Column
- AddQaAnswerAiSupport1787500000000
- Entity
- JoinColumn
- ManyToOne
- OneToOne
- ai-generate.service.ts
- ApiPropertyOptional
- AddAiGenerationJobs1787600000000
- AddAiJobRetryAndAck1787700000000

## God Nodes (most connected - your core abstractions)
1. `User` - 204 edges
2. `CurrentUser` - 76 edges
3. `Concept` - 59 edges
4. `BaseEntity` - 44 edges
5. `McqQuestion` - 41 edges
6. `Module` - 39 edges
7. `UsersService` - 38 edges
8. `AiGenerateService` - 38 edges
9. `ModuleConcept` - 33 edges
10. `Roadmap` - 31 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `useTerminalSession()` --calls--> `useTheme()`  [EXTRACTED]
  frontend/components/terminal/use-terminal-session.ts → frontend/providers/theme-provider.tsx
- `Module` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/content/entities/module.entity.ts → backend/src/common/entities/base.entity.ts
- `EmailModule` --references--> `Module`  [EXTRACTED]
  backend/src/modules/email/email.module.ts → backend/src/modules/content/entities/module.entity.ts
- `UsersModule` --references--> `Module`  [EXTRACTED]
  backend/src/modules/users/users.module.ts → backend/src/modules/content/entities/module.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (149 total, 85 thin omitted)

### Community 0 - "UsersController"
Cohesion: 0.20
Nodes (14): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 1 - "concept.entity.ts"
Cohesion: 0.09
Nodes (40): AppModule, typeOrmAsyncConfig, AiGenerateModule, InjectRepository, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule (+32 more)

### Community 2 - "users.service.ts"
Cohesion: 0.10
Nodes (21): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength, GetUsersQueryDto, ApiPropertyOptional, IsEnum (+13 more)

### Community 3 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 4 - "User"
Cohesion: 0.11
Nodes (21): ApiQuery, ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+13 more)

### Community 5 - "gamification.controller.ts"
Cohesion: 0.12
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 6 - "QaService"
Cohesion: 0.09
Nodes (25): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+17 more)

### Community 7 - "concepts.service.ts"
Cohesion: 0.13
Nodes (16): boundedLevenshtein(), hasSignificantContentChange(), slugify(), CreateConceptDto, ApiProperty, ApiPropertyOptional, IsEnum, IsNotEmpty (+8 more)

### Community 8 - "admin-commands.ts"
Cohesion: 0.06
Nodes (32): ADMIN_COMMANDS, analytics, article, ArticleItem, articles, dashboard, deletion, DeletionRequest (+24 more)

### Community 9 - "source:dev — Master Plan"
Cohesion: 0.10
Nodes (19): 0. Vision, 10. Updated build order (revised 2026-09-21 — backend-first, frontend-last), 11. Decision log (memory for future sessions/agents), 12. QA discussion model (revised 2026-09-21, supersedes §1 author-only draft), 1. Roles — collapsed from three to two, 2. Content ownership & reuse, 3. Publishing / review workflow, 4. Content labeling (AI-generated vs hand-written vs partial) (+11 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "user.entity.ts"
Cohesion: 0.10
Nodes (30): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, McqAttempt, Column, Entity (+22 more)

### Community 14 - "UserConceptProgress"
Cohesion: 0.14
Nodes (9): Column, Entity, JoinColumn, ManyToOne, Unique, UserConceptProgress, ProgressService, Injectable (+1 more)

### Community 15 - "api-client.ts"
Cohesion: 0.12
Nodes (11): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, AiQuotaBadgeProps, apiClient, ConceptProgressInfo, ModuleConceptItem (+3 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "PasswordResetOtp"
Cohesion: 0.33
Nodes (6): PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne

### Community 19 - "roadmaps.controller.ts"
Cohesion: 0.38
Nodes (4): UserRole, ROLES_KEY, RolesGuard, Injectable

### Community 20 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !**/*.spec.ts, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, **/*.(t|j)s

### Community 21 - "analytics.service.spec.ts"
Cohesion: 0.29
Nodes (10): makeConcept(), makeOption(), makeQuestion(), makeReviewItem(), makeUser(), createMockQueryBuilder(), createMockRepository(), MockQueryBuilder (+2 more)

### Community 22 - "useSnackbar"
Cohesion: 0.11
Nodes (19): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminUsersDirectoryPage(), DeletionRequestItem, UserDirectoryItem (+11 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (14): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+6 more)

### Community 25 - "factories.ts"
Cohesion: 0.10
Nodes (36): ConceptDifficulty, ConceptReviewStatus, ProgressStatus, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeProgress() (+28 more)

### Community 26 - "auth.ts"
Cohesion: 0.12
Nodes (20): ADMIN_NAV_ITEMS, AdminAppShellLayout(), RootPage(), BasicInfoFormData, basicInfoSchema, ChangePasswordFormData, changePasswordSchema, ProfilePage() (+12 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "ai-generating-modal.tsx"
Cohesion: 0.33
Nodes (4): AiGeneratingModalProps, AiGenerationContextType, CONTEXT_MESSAGES, CONTEXT_TITLES

### Community 29 - "AdminContentReviewController"
Cohesion: 0.21
Nodes (11): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+3 more)

### Community 30 - "auth.controller.ts"
Cohesion: 0.09
Nodes (23): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString (+15 more)

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.15
Nodes (11): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), Theme (+3 more)

### Community 34 - "use-terminal-session.ts"
Cohesion: 0.27
Nodes (9): chunkEnd(), pageRows(), PagerState, PendingQuestion, PendingSelect, sleep(), SuggestMenu, SuggestRow (+1 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ts (+3 more)

### Community 38 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 40 - "forgot-password/page.tsx"
Cohesion: 0.20
Nodes (8): EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData, otpStepSchema, PasswordStepFormData, passwordStepSchema, ResetStep

### Community 41 - "CurrentUser"
Cohesion: 0.06
Nodes (40): CurrentUser, AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min (+32 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "auth.module.ts"
Cohesion: 0.13
Nodes (9): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable, EmailModule, EmailService, Injectable (+1 more)

### Community 45 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 49 - "login/page.tsx"
Cohesion: 0.22
Nodes (12): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, ThemeToggle() (+4 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 52 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 68 - "AccountDeletionRequest"
Cohesion: 0.29
Nodes (6): AccountDeletionRequest, Column, Entity, JoinColumn, ManyToOne, InjectRepository

### Community 69 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString

### Community 72 - "ai-jobs-provider.tsx"
Cohesion: 0.14
Nodes (20): AiJobResultModal(), AiJobResultModalProps, JOB_TYPE_NOUN, AiJobResultsBanner(), jobSummaryLine(), jobVisual(), AiJobsIndicator(), JOB_TYPE_LABELS (+12 more)

### Community 73 - "Concept"
Cohesion: 0.09
Nodes (26): InjectRepository, InjectRepository, InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne (+18 more)

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
Cohesion: 0.13
Nodes (7): AuthService, Injectable, ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 118 - "UsersService"
Cohesion: 0.11
Nodes (6): InjectRepository, JwtPayload, JwtStrategy, Injectable, Injectable, UsersService

### Community 125 - "AddModulePrerequisiteDto"
Cohesion: 0.50
Nodes (3): AddModulePrerequisiteDto, ApiProperty, IsUUID

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.06
Nodes (55): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags (+47 more)

## Knowledge Gaps
- **319 isolated node(s):** `PendingQuestion`, `PendingSelect`, `SuggestRow`, `SuggestMenu`, `PagerState` (+314 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **85 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersController`, `concept.entity.ts`, `users.service.ts`, `ReviewService`, `gamification.controller.ts`, `QaService`, `concepts.service.ts`, `assignments.module.ts`, `user.entity.ts`, `UserConceptProgress`, `AuthController`, `ai-generate.service.ts`, `roadmaps.controller.ts`, `PasswordResetOtp`, `analytics.service.spec.ts`, `factories.ts`, `AdminContentReviewController`, `auth.controller.ts`, `.deleteUser`, `CurrentUser`, `auth.module.ts`, `QuizService`, `AccountDeletionRequest`, `Concept`, `ProgressController`, `AuthService`, `UsersService`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `UsersController`, `users.service.ts`, `ReviewService`, `User`, `gamification.controller.ts`, `QaService`, `concepts.service.ts`, `.deleteUser`, `Concept`, `ProgressController`, `QuizService`, `UserConceptProgress`, `AuthController`, `ai-generate.service.ts`, `roadmaps.controller.ts`, `AdminContentReviewController`, `auth.controller.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `ModuleConceptPrerequisite` connect `concept.entity.ts` to `CurrentUser`, `user.entity.ts`, `factories.ts`, `UserConceptProgress`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `PendingQuestion`, `PendingSelect`, `SuggestRow` to the rest of the system?**
  _319 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `concept.entity.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08649912331969609 - nodes in this community are weakly interconnected._
- **Should `users.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09852216748768473 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._