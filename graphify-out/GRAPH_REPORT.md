# Graph Report - knowledge_is_power  (2026-09-15)

## Corpus Check
- 256 files · ~217,182 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1863 nodes · 4986 edges · 100 communities (75 shown, 25 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `caaf13b9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Roles
- Module
- react
- ReviewService
- ConceptsService
- AiGenerateService
- User
- UsersService
- ai-generate.service.ts
- class-validator
- assignments.module.ts
- commands.ts
- Added
- Concept
- ai-generate.controller.ts
- use-roadmap-progress.ts
- compilerOptions
- AuthController
- QaService
- GetActivityQueryDto
- learning-commands.ts
- RequestDeletionDto
- api-client.ts
- compilerOptions
- AnalyticsController
- commands.test.mjs
- auth.ts
- dependencies
- jwt-auth.guard.ts
- AdminContentReviewController
- AiGenerationLog
- scripts
- devDependencies
- app/layout.tsx
- askQuestion
- dependencies
- Content Authoring Flow
- jest
- auth.controller.ts
- app.controller.ts
- UserConceptProgress
- CurrentUser
- Next.js Frontend Application
- scripts
- auth.module.ts
- QuizService
- student/dashboard/page.tsx
- tsconfig.build.json
- GetUsersQueryDto
- AttachConceptDto
- nest-cli.json
- Answer
- LinkOAuthDto
- printThread
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
- ChangePasswordDto
- showConcept
- InstructorAnalyticsController
- hasSignificantContentChange
- .applyForInstructor
- [roadmapId]/page.tsx
- roadmaps.service.ts
- ProgressController
- backend/package.json
- next
- @nestjs/common
- devDependencies
- AddOAuthColumns1787300000000
- tailwind.config.ts
- DeletionRequestStatus
- resolveIndex
- forgot-password/page.tsx
- AuthService
- frontend/eslint.config.mjs
- frontend/package.json
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- Application Logo
- factories.ts
- .updateInstructorBio
- package.json
- UpdateOwnProfileDto
- AddQaAnswerAiSupport1787500000000
- AiGenerationJob
- AGENTS.md
- AddAiGenerationJobs1787600000000
- AddAiJobRetryAndAck1787700000000

## God Nodes (most connected - your core abstractions)
1. `User` - 218 edges
2. `CurrentUser` - 80 edges
3. `@nestjs/common` - 69 edges
4. `Concept` - 63 edges
5. `typeorm` - 58 edges
6. `react` - 52 edges
7. `BaseEntity` - 46 edges
8. `McqQuestion` - 45 edges
9. `@nestjs/typeorm` - 42 edges
10. `@nestjs/swagger` - 41 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `RoadmapManagementPage()` --calls--> `getUser()`  [EXTRACTED]
  frontend/app/instructor/content/[roadmapId]/page.tsx → frontend/lib/auth.ts
- `RoadmapManagementPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/instructor/content/[roadmapId]/page.tsx → frontend/providers/snackbar-provider.tsx
- `InstructorContentDirectoryPage()` --calls--> `getUser()`  [EXTRACTED]
  frontend/app/instructor/content/page.tsx → frontend/lib/auth.ts
- `InstructorQaPage()` --calls--> `getUser()`  [EXTRACTED]
  frontend/app/instructor/qa/page.tsx → frontend/lib/auth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (100 total, 25 thin omitted)

### Community 0 - "Roles"
Cohesion: 0.22
Nodes (12): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Delete, Get (+4 more)

### Community 1 - "Module"
Cohesion: 0.12
Nodes (23): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, Module, Column (+15 more)

### Community 2 - "react"
Cohesion: 0.07
Nodes (30): CallbackHandler(), LoginPage(), LoginStage, RegisterPage(), RegisterStage, CenteredTerminalLoader(), CenteredTerminalLoaderProps, LogEntry (+22 more)

### Community 3 - "ReviewService"
Cohesion: 0.09
Nodes (21): addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn(), AnswerReviewItemDto, ApiProperty, IsNotEmpty (+13 more)

### Community 4 - "ConceptsService"
Cohesion: 0.07
Nodes (30): ApiQuery, ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+22 more)

### Community 5 - "AiGenerateService"
Cohesion: 0.24
Nodes (3): AiGenerateService, Injectable, AiGenerationJobResultSummary

### Community 6 - "User"
Cohesion: 0.07
Nodes (24): IsInt, Min, UpdateModuleConceptDto, ModuleConcept, Column, Entity, JoinColumn, ManyToOne (+16 more)

### Community 7 - "UsersService"
Cohesion: 0.12
Nodes (5): JwtStrategy, Injectable, Injectable, InjectRepository, UsersService

### Community 8 - "ai-generate.service.ts"
Cohesion: 0.13
Nodes (22): AiGenerationJobStatus, COMPLETED, FAILED, PENDING, RUNNING, AiGenerationJobType, MODULE_CONCEPTS, MODULE_MCQS (+14 more)

### Community 9 - "class-validator"
Cohesion: 0.08
Nodes (22): IsIanaTimezone(), RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional, IsString (+14 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.07
Nodes (27): AiConfidence, HIGH, LOW, SubmissionStatus, AUTO_GRADED, FLAGGED_FOR_REVIEW, REVIEWED, AssignmentsController (+19 more)

### Community 11 - "commands.ts"
Cohesion: 0.05
Nodes (76): openingCommand(), StudentTerminalPage(), useTerminalLogout(), Console(), DOC_HEADINGS, RunIndicator(), TerminalWorkspace(), usePrefersReducedMotion() (+68 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "Concept"
Cohesion: 0.13
Nodes (31): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, ContentModule, Concept, Column (+23 more)

### Community 14 - "ai-generate.controller.ts"
Cohesion: 0.35
Nodes (13): AcknowledgeJobsDto, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto, GenerateRoadmapModulesDto, ApiProperty, ApiPropertyOptional (+5 more)

### Community 15 - "use-roadmap-progress.ts"
Cohesion: 0.22
Nodes (6): ConceptProgressInfo, ModuleConceptItem, RoadmapDetailData, RoadmapModuleItem, RoadmapProgressData, useAllRoadmapsProgress()

### Community 16 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "QaService"
Cohesion: 0.07
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+23 more)

### Community 19 - "GetActivityQueryDto"
Cohesion: 0.13
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 20 - "learning-commands.ts"
Cohesion: 0.07
Nodes (27): CommandCtx, CommandSpec, AttemptResult, complete, ConceptDetail, ConceptSummary, continueLearning, jump (+19 more)

### Community 21 - "RequestDeletionDto"
Cohesion: 0.33
Nodes (5): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength

### Community 22 - "api-client.ts"
Cohesion: 0.05
Nodes (61): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics (+53 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.18
Nodes (8): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards

### Community 25 - "commands.test.mjs"
Cohesion: 0.18
Nodes (5): askable, __dirname, harness(), roadmaps, student

### Community 26 - "auth.ts"
Cohesion: 0.08
Nodes (38): ADMIN_NAV_ITEMS, AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, FullUser, INSTRUCTOR_NAV_ITEMS (+30 more)

### Community 27 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, bcrypt, class-transformer, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core (+14 more)

### Community 28 - "jwt-auth.guard.ts"
Cohesion: 0.24
Nodes (4): IS_PUBLIC_KEY, JwtAuthGuard, Injectable, @nestjs/core

### Community 29 - "AdminContentReviewController"
Cohesion: 0.12
Nodes (16): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+8 more)

### Community 30 - "AiGenerationLog"
Cohesion: 0.14
Nodes (12): AiGenerationType, CONCEPT_CONTENT, CONCEPT_MCQS, MODULE_CONCEPTS, QA_ANSWER, ROADMAP_MODULES, InjectRepository, AiGenerationLog (+4 more)

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.16
Nodes (10): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), SnackbarProvider() (+2 more)

### Community 34 - "askQuestion"
Cohesion: 0.31
Nodes (9): allThreads(), askerIdOf(), askQuestion(), conceptList(), findConceptId(), remember(), status, threadsForConcept() (+1 more)

### Community 35 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, axios, @hookform/resolvers, lucide-react, next, react, react-dom, react-hook-form (+5 more)

### Community 36 - "Content Authoring Flow"
Cohesion: 0.19
Nodes (14): Automated Achievement Badges, Concept (Lesson), Concept Prerequisites Engine, Content Authoring Flow, Curriculum Architecture & Hierarchy, Experience Points (XP) System, Gamification Engine, Instructor Studio & Analytics (+6 more)

### Community 37 - "jest"
Cohesion: 0.22
Nodes (9): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+1 more)

### Community 38 - "auth.controller.ts"
Cohesion: 0.09
Nodes (23): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString (+15 more)

### Community 39 - "app.controller.ts"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 40 - "UserConceptProgress"
Cohesion: 0.10
Nodes (23): ConceptReviewStatus, APPROVED, PENDING, REJECTED, ProgressStatus, COMPLETED, IN_PROGRESS, NOT_STARTED (+15 more)

### Community 41 - "CurrentUser"
Cohesion: 0.25
Nodes (14): CurrentUser, RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+6 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 44 - "auth.module.ts"
Cohesion: 0.13
Nodes (13): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable, JwtPayload, EmailModule, @nestjs/config (+5 more)

### Community 45 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.11
Nodes (25): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+17 more)

### Community 47 - "tsconfig.build.json"
Cohesion: 0.50
Nodes (3): exclude, extends, ./tsconfig.json

### Community 48 - "GetUsersQueryDto"
Cohesion: 0.29
Nodes (6): GetUsersQueryDto, ApiPropertyOptional, IsEnum, IsOptional, IsString, Query

### Community 49 - "AttachConceptDto"
Cohesion: 0.09
Nodes (18): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min, CreateModuleDto (+10 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "Answer"
Cohesion: 0.12
Nodes (14): InjectRepository, InjectRepository, Answer, Column, Entity, JoinColumn, ManyToOne, Question (+6 more)

### Community 52 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString

### Community 53 - "printThread"
Cohesion: 0.29
Nodes (8): askerOf(), detail(), entry(), heading(), plural(), printThread(), renderThread(), shortDate()

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "ChangePasswordDto"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 68 - "showConcept"
Cohesion: 0.29
Nodes (7): body(), nextConcept(), progressFor(), rememberSections(), sectionsOf(), showConcept(), unlocked()

### Community 69 - "InstructorAnalyticsController"
Cohesion: 0.19
Nodes (10): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+2 more)

### Community 71 - ".applyForInstructor"
Cohesion: 0.33
Nodes (5): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, Post

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (27): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+19 more)

### Community 73 - "roadmaps.service.ts"
Cohesion: 0.16
Nodes (21): InstructorStatus, APPROVED, PENDING, REJECTED, makeConcept(), makeUser(), createMockQueryBuilder(), createMockRepository() (+13 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.05
Nodes (38): author, description, dotenv, eslint, @types/node, typescript, name, private (+30 more)

### Community 77 - "@nestjs/common"
Cohesion: 0.14
Nodes (19): UserRole, ADMIN, INSTRUCTOR, STUDENT, AnalyticsService, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics (+11 more)

### Community 78 - "devDependencies"
Cohesion: 0.07
Nodes (29): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, jest (+21 more)

### Community 81 - "DeletionRequestStatus"
Cohesion: 0.50
Nodes (4): DeletionRequestStatus, APPROVED, PENDING, REJECTED

### Community 82 - "resolveIndex"
Cohesion: 0.50
Nodes (4): catalog(), findRoadmap(), locateThread(), resolveIndex()

### Community 101 - "forgot-password/page.tsx"
Cohesion: 0.25
Nodes (6): emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, zod

### Community 102 - "AuthService"
Cohesion: 0.12
Nodes (11): AuthService, Injectable, InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn (+3 more)

### Community 104 - "frontend/package.json"
Cohesion: 0.14
Nodes (13): eslint, @types/node, typescript, name, private, version, axios, eslint-config-next (+5 more)

### Community 117 - "factories.ts"
Cohesion: 0.06
Nodes (51): ConceptDifficulty, EASY, HARD, MEDIUM, XpSource, ASSIGNMENT_PASSED, CONCEPT_COMPLETED, REVIEW_CORRECT (+43 more)

### Community 124 - ".updateInstructorBio"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsOptional, IsString, MaxLength, UpdateInstructorBioDto

### Community 127 - "package.json"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 129 - "UpdateOwnProfileDto"
Cohesion: 0.29
Nodes (6): ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, UpdateOwnProfileDto, Body

### Community 146 - "AiGenerationJob"
Cohesion: 0.15
Nodes (18): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+10 more)

## Knowledge Gaps
- **423 isolated node(s):** `OverviewAnalytics`, `RoadmapAnalytics`, `ConceptAnalytics`, `InstructorAnalytics`, `PageProps` (+418 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Roles`, `Module`, `UpdateOwnProfileDto`, `ReviewService`, `ConceptsService`, `AiGenerateService`, `UsersService`, `ai-generate.service.ts`, `assignments.module.ts`, `Concept`, `ai-generate.controller.ts`, `AuthController`, `AiGenerationJob`, `GetActivityQueryDto`, `QaService`, `RequestDeletionDto`, `AdminContentReviewController`, `AiGenerationLog`, `auth.controller.ts`, `UserConceptProgress`, `CurrentUser`, `auth.module.ts`, `QuizService`, `GetUsersQueryDto`, `Answer`, `ChangePasswordDto`, `InstructorAnalyticsController`, `.applyForInstructor`, `roadmaps.service.ts`, `ProgressController`, `@nestjs/common`, `AuthService`, `factories.ts`, `.updateInstructorBio`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `typeorm` connect `Concept` to `ai-generate.service.ts`, `assignments.module.ts`, `AddQaAnswerAiSupport1787500000000`, `AddAiGenerationJobs1787600000000`, `auth.controller.ts`, `UserConceptProgress`, `AddAiJobRetryAndAck1787700000000`, `InitialSchema1786340981613`, `AddMcqQuiz1786436703834`, `AddConceptDifficulty1786530225075`, `AddAccountDeletionRequests1786630000000`, `FixModuleConceptOrderIndexes1786740000000`, `RestructureModuleScopedPrerequisites1786890000000`, `AddSpacedRepetitionReview1786900000000`, `AddAiGenerationLog1786950000000`, `ExpandAiGenerationTypes1786960000000`, `AddConceptContentReview1787000000000`, `AddPasswordResetOtps1787100000000`, `AddUserProfilePicture1787200000000`, `roadmaps.service.ts`, `backend/package.json`, `@nestjs/common`, `AddOAuthColumns1787300000000`, `factories.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `@nestjs/common` connect `@nestjs/common` to `Module`, `auth.controller.ts`, `app.controller.ts`, `ai-generate.service.ts`, `roadmaps.service.ts`, `assignments.module.ts`, `backend/package.json`, `auth.module.ts`, `Concept`, `ai-generate.controller.ts`, `UserConceptProgress`, `QuizService`, `factories.ts`, `jwt-auth.guard.ts`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `OverviewAnalytics`, `RoadmapAnalytics`, `ConceptAnalytics` to the rest of the system?**
  _423 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Module` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07239819004524888 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.0931174089068826 - nodes in this community are weakly interconnected._