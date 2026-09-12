# Graph Report - knowledge_is_power  (2026-09-12)

## Corpus Check
- 243 files · ~256,172 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1688 nodes · 4193 edges · 130 communities (67 shown, 63 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d5eaabda`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Roles
- ai-generate.service.ts
- useTheme
- ReviewService
- ConceptsService
- GamificationService
- RoadmapsService
- User
- InstructorAnalyticsController
- RegisterDto
- assignments.module.ts
- CreateModuleDto
- Added
- BaseEntity
- Concept
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- qa.controller.ts
- UserRole
- collectCoverageFrom
- CreateRoadmapDto
- useSnackbar
- compilerOptions
- AnalyticsController
- UpdateRoadmapDto
- auth.ts
- dependencies
- edit/page.tsx
- AdminContentReviewController
- UpdateModuleConceptDto
- scripts
- devDependencies
- app/layout.tsx
- dependencies
- Content Authoring Flow
- jest
- auth.controller.ts
- AppController
- CurrentUser
- Next.js Frontend Application
- frontend/package.json
- OAuthProfile
- QuizService
- student/dashboard/page.tsx
- exclude
- eslint-plugin-prettier
- nest-cli.json
- user.entity.ts
- minimal-terminal-loader.tsx
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
- ForgotPasswordDto
- factories.ts
- [roadmapId]/page.tsx
- typeorm.config.ts
- ProgressController
- backend/package.json
- UpdateModuleDto
- users.service.ts
- devDependencies
- AddOAuthColumns1787300000000
- globals
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
- AttachConceptDto
- typescript-eslint
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
- auth.module.ts
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
- passport-jwt
- pg
- typeorm
- @eslint/eslintrc
- @nestjs/schematics
- @nestjs/testing
- AddQaAnswerAiSupport1787500000000
- AiGenerateService
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
9. `Roadmap` - 35 edges
10. `useSnackbar()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `StudentDashboardPage()` --calls--> `useTheme()`  [EXTRACTED]
  frontend/app/student/dashboard/page.tsx → frontend/providers/theme-provider.tsx
- `Module` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/content/entities/module.entity.ts → backend/src/common/entities/base.entity.ts
- `EmailModule` --references--> `Module`  [EXTRACTED]
  backend/src/modules/email/email.module.ts → backend/src/modules/content/entities/module.entity.ts
- `UsersModule` --references--> `Module`  [EXTRACTED]
  backend/src/modules/users/users.module.ts → backend/src/modules/content/entities/module.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (130 total, 63 thin omitted)

### Community 0 - "Roles"
Cohesion: 0.19
Nodes (15): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+7 more)

### Community 1 - "ai-generate.service.ts"
Cohesion: 0.07
Nodes (51): AppModule, AiGenerationJobStatus, AiGenerationType, typeOrmAsyncConfig, AiGenerateModule, ParsedMcqOption, ParsedMcqQuestion, InjectRepository (+43 more)

### Community 2 - "useTheme"
Cohesion: 0.10
Nodes (26): CallbackHandler(), emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, LoginPage(), LoginStage (+18 more)

### Community 3 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (33): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), slugify(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+25 more)

### Community 5 - "GamificationService"
Cohesion: 0.10
Nodes (17): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+9 more)

### Community 7 - "User"
Cohesion: 0.09
Nodes (11): AuthService, NOW, Injectable, InjectRepository, Column, Entity, OneToOne, User (+3 more)

### Community 8 - "InstructorAnalyticsController"
Cohesion: 0.15
Nodes (13): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+5 more)

### Community 9 - "RegisterDto"
Cohesion: 0.29
Nodes (6): RegisterDto, ApiProperty, IsEmail, IsNotEmpty, IsString, MinLength

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "BaseEntity"
Cohesion: 0.09
Nodes (29): BaseEntity, CreateDateColumn, UpdateDateColumn, InjectRepository, McqAttempt, Column, Entity, JoinColumn (+21 more)

### Community 14 - "Concept"
Cohesion: 0.10
Nodes (17): InjectRepository, InjectRepository, InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne (+9 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.11
Nodes (24): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+16 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "qa.controller.ts"
Cohesion: 0.07
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+23 more)

### Community 19 - "UserRole"
Cohesion: 0.15
Nodes (16): UserRole, ROLES_KEY, RolesGuard, Injectable, AddModulePrerequisiteDto, ApiProperty, IsUUID, RejectConceptDto (+8 more)

### Community 20 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !**/*.spec.ts, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, **/*.(t|j)s

### Community 21 - "CreateRoadmapDto"
Cohesion: 0.40
Nodes (4): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString

### Community 22 - "useSnackbar"
Cohesion: 0.06
Nodes (45): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+37 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (14): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+6 more)

### Community 25 - "UpdateRoadmapDto"
Cohesion: 0.40
Nodes (4): IsNotEmpty, IsOptional, IsString, UpdateRoadmapDto

### Community 26 - "auth.ts"
Cohesion: 0.10
Nodes (33): ADMIN_NAV_ITEMS, AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, FullUser, INSTRUCTOR_NAV_ITEMS (+25 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.21
Nodes (11): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+3 more)

### Community 30 - "UpdateModuleConceptDto"
Cohesion: 0.50
Nodes (3): IsInt, Min, UpdateModuleConceptDto

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.15
Nodes (12): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), AUTH_CHANGED_EVENT, QueryProvider() (+4 more)

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
Cohesion: 0.11
Nodes (18): LoginDto, ApiProperty, IsEmail, IsString, ResetPasswordDto, ApiProperty, IsNotEmpty, IsString (+10 more)

### Community 39 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 41 - "CurrentUser"
Cohesion: 0.22
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

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.14
Nodes (16): BadgeDef, badgeTag(), DARK, EarnedBadgeItem, GamificationData, LIGHT, pad(), plural() (+8 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "user.entity.ts"
Cohesion: 0.16
Nodes (22): InstructorStatus, ProgressStatus, makeUser(), MostMissedOption, Answer, Column, Entity, JoinColumn (+14 more)

### Community 53 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 70 - "ForgotPasswordDto"
Cohesion: 0.17
Nodes (7): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, EmailModule, EmailService, Injectable

### Community 71 - "factories.ts"
Cohesion: 0.18
Nodes (18): ConceptDifficulty, ConceptReviewStatus, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeConcept(), makeOption() (+10 more)

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "typeorm.config.ts"
Cohesion: 0.10
Nodes (25): dataSourceOptions, entities, Badge, Column, Entity, Streak, Column, CreateDateColumn (+17 more)

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
Cohesion: 0.07
Nodes (25): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, ChangePasswordDto, ApiProperty, IsNotEmpty, IsString (+17 more)

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 98 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 117 - "auth.module.ts"
Cohesion: 0.09
Nodes (18): IS_PUBLIC_KEY, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne, JwtAuthGuard (+10 more)

### Community 124 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 146 - "AiGenerateService"
Cohesion: 0.06
Nodes (45): AiGenerationJobType, AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+37 more)

## Knowledge Gaps
- **334 isolated node(s):** `emailStepSchema`, `otpStepSchema`, `passwordStepSchema`, `ResetStep`, `EarnedBadgeItem` (+329 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Roles`, `ai-generate.service.ts`, `ReviewService`, `ConceptsService`, `GamificationService`, `RoadmapsService`, `InstructorAnalyticsController`, `assignments.module.ts`, `BaseEntity`, `Concept`, `AuthController`, `AiGenerateService`, `UserRole`, `qa.controller.ts`, `AdminContentReviewController`, `auth.controller.ts`, `CurrentUser`, `QuizService`, `user.entity.ts`, `factories.ts`, `typeorm.config.ts`, `ProgressController`, `users.service.ts`, `auth.module.ts`?**
  _High betweenness centrality (0.191) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `Roles`, `ReviewService`, `ConceptsService`, `GamificationService`, `auth.controller.ts`, `InstructorAnalyticsController`, `ProgressController`, `QuizService`, `Concept`, `AuthController`, `AiGenerateService`, `UserRole`, `qa.controller.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `ai-generate.service.ts`, `ConceptsService`, `factories.ts`, `User`, `typeorm.config.ts`, `assignments.module.ts`, `BaseEntity`, `user.entity.ts`, `UserRole`, `AdminContentReviewController`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `emailStepSchema`, `otpStepSchema`, `passwordStepSchema` to the rest of the system?**
  _334 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai-generate.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06659056316590563 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.09915966386554621 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._