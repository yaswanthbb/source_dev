# Graph Report - workspace  (2026-09-15)

## Corpus Check
- 256 files · ~217,182 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1863 nodes · 4999 edges · 102 communities (79 shown, 23 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a95a40bb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Roles
- roadmaps.service.ts
- auth.ts
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
- CreateOptionDto
- api-client.ts
- compilerOptions
- AnalyticsController
- commands.test.mjs
- react
- dependencies
- jwt-auth.guard.ts
- AdminContentReviewController
- AiGenerationLog
- scripts
- devDependencies
- snackbar-provider.tsx
- askQuestion
- dependencies
- Content Authoring Flow
- jest
- auth.controller.ts
- app.controller.ts
- analytics.service.ts
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
- user.entity.ts
- ReviewItem
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
- LoginDto
- RequestDeletionDto
- [roadmapId]/page.tsx
- factories.ts
- ProgressController
- backend/package.json
- CreateRoadmapDto
- @nestjs/common
- devDependencies
- AddOAuthColumns1787300000000
- UpdateRoadmapDto
- DeletionRequestStatus
- resolveIndex
- navigate
- UpdateModuleDto
- terminal-workspace.tsx
- PasswordResetOtp
- frontend/eslint.config.mjs
- frontend/package.json
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- Application Logo
- gamification.module.ts
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
- `AiGenerationJob` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/ai-generate/entities/ai-generation-job.entity.ts → backend/src/common/entities/base.entity.ts
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

## Communities (102 total, 23 thin omitted)

### Community 0 - "Roles"
Cohesion: 0.22
Nodes (12): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Delete, Get (+4 more)

### Community 1 - "roadmaps.service.ts"
Cohesion: 0.10
Nodes (33): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, ModuleConcept (+25 more)

### Community 2 - "auth.ts"
Cohesion: 0.09
Nodes (34): CallbackHandler(), LoginPage(), LoginStage, RegisterPage(), RegisterStage, RootPage(), BasicInfoFormData, basicInfoSchema (+26 more)

### Community 3 - "ReviewService"
Cohesion: 0.09
Nodes (21): addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn(), AnswerReviewItemDto, ApiProperty, IsNotEmpty (+13 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (33): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), slugify(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+25 more)

### Community 5 - "AiGenerateService"
Cohesion: 0.27
Nodes (3): AiGenerateService, Injectable, AiGenerationJobResultSummary

### Community 6 - "User"
Cohesion: 0.08
Nodes (17): IsInt, Min, UpdateModuleConceptDto, Roadmap, Column, Entity, JoinColumn, ManyToOne (+9 more)

### Community 7 - "UsersService"
Cohesion: 0.12
Nodes (5): JwtStrategy, Injectable, Injectable, InjectRepository, UsersService

### Community 8 - "ai-generate.service.ts"
Cohesion: 0.13
Nodes (22): AiGenerationJobStatus, COMPLETED, FAILED, PENDING, RUNNING, AiGenerationJobType, MODULE_CONCEPTS, MODULE_MCQS (+14 more)

### Community 9 - "class-validator"
Cohesion: 0.11
Nodes (18): IsIanaTimezone(), RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional, IsString (+10 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.07
Nodes (27): AiConfidence, HIGH, LOW, SubmissionStatus, AUTO_GRADED, FLAGGED_FOR_REVIEW, REVIEWED, AssignmentsController (+19 more)

### Community 11 - "commands.ts"
Cohesion: 0.05
Nodes (72): useTerminalLogout(), Console(), PendingQuestion, sleep(), useTerminalSession(), View, AVATAR_ACCEPT, AVATAR_MIME (+64 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "Concept"
Cohesion: 0.11
Nodes (29): ConceptReviewStatus, APPROVED, PENDING, REJECTED, InjectRepository, InjectRepository, Concept, Column (+21 more)

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
Cohesion: 0.16
Nodes (16): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+8 more)

### Community 18 - "QaService"
Cohesion: 0.07
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+23 more)

### Community 19 - "GetActivityQueryDto"
Cohesion: 0.12
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 20 - "learning-commands.ts"
Cohesion: 0.07
Nodes (27): CommandCtx, AttemptResult, complete, ConceptDetail, ConceptSummary, continueLearning, jump, LEARNING_COMMANDS (+19 more)

### Community 21 - "CreateOptionDto"
Cohesion: 0.22
Nodes (8): CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min, class-transformer

### Community 22 - "api-client.ts"
Cohesion: 0.05
Nodes (56): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics (+48 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.18
Nodes (8): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards

### Community 25 - "commands.test.mjs"
Cohesion: 0.20
Nodes (6): askable, __dirname, harness(), load(), roadmaps, student

### Community 26 - "react"
Cohesion: 0.08
Nodes (29): ADMIN_NAV_ITEMS, AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, FullUser, INSTRUCTOR_NAV_ITEMS (+21 more)

### Community 27 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, bcrypt, class-transformer, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core (+14 more)

### Community 28 - "jwt-auth.guard.ts"
Cohesion: 0.24
Nodes (4): IS_PUBLIC_KEY, JwtAuthGuard, Injectable, @nestjs/core

### Community 29 - "AdminContentReviewController"
Cohesion: 0.14
Nodes (15): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+7 more)

### Community 30 - "AiGenerationLog"
Cohesion: 0.14
Nodes (12): AiGenerationType, CONCEPT_CONTENT, CONCEPT_MCQS, MODULE_CONCEPTS, QA_ANSWER, ROADMAP_MODULES, InjectRepository, AiGenerationLog (+4 more)

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 33 - "snackbar-provider.tsx"
Cohesion: 0.12
Nodes (15): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), SnackbarContext, SnackbarContextValue (+7 more)

### Community 34 - "askQuestion"
Cohesion: 0.27
Nodes (10): allThreads(), askerIdOf(), askQuestion(), conceptList(), findConceptId(), plural(), remember(), status (+2 more)

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
Cohesion: 0.10
Nodes (19): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString, ResetPasswordDto, ApiProperty, IsNotEmpty (+11 more)

### Community 39 - "app.controller.ts"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 40 - "analytics.service.ts"
Cohesion: 0.10
Nodes (28): ProgressStatus, COMPLETED, IN_PROGRESS, NOT_STARTED, XpSource, ASSIGNMENT_PASSED, CONCEPT_COMPLETED, REVIEW_CORRECT (+20 more)

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
Nodes (14): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable, JwtPayload, EmailModule, @nestjs/config (+6 more)

### Community 45 - "QuizService"
Cohesion: 0.06
Nodes (38): ArrayMinSize, CreateQuestionDto, ApiProperty, IsArray, IsInt, IsNotEmpty, IsString, Min (+30 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.13
Nodes (23): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+15 more)

### Community 47 - "tsconfig.build.json"
Cohesion: 0.50
Nodes (3): exclude, extends, ./tsconfig.json

### Community 48 - "GetUsersQueryDto"
Cohesion: 0.29
Nodes (6): GetUsersQueryDto, ApiPropertyOptional, IsEnum, IsOptional, IsString, Query

### Community 49 - "AttachConceptDto"
Cohesion: 0.29
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "user.entity.ts"
Cohesion: 0.12
Nodes (24): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, Answer, Column, Entity (+16 more)

### Community 52 - "ReviewItem"
Cohesion: 0.25
Nodes (7): ReviewItem, Column, Entity, JoinColumn, ManyToOne, Unique, InjectRepository

### Community 53 - "printThread"
Cohesion: 0.29
Nodes (8): askerOf(), body(), detail(), entry(), heading(), printThread(), renderThread(), shortDate()

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "ChangePasswordDto"
Cohesion: 0.33
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 68 - "showConcept"
Cohesion: 0.33
Nodes (6): nextConcept(), progressFor(), rememberSections(), sectionsOf(), showConcept(), unlocked()

### Community 69 - "InstructorAnalyticsController"
Cohesion: 0.19
Nodes (10): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+2 more)

### Community 70 - "LoginDto"
Cohesion: 0.40
Nodes (4): LoginDto, ApiProperty, IsEmail, IsString

### Community 71 - "RequestDeletionDto"
Cohesion: 0.16
Nodes (11): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString (+3 more)

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "factories.ts"
Cohesion: 0.12
Nodes (34): ConceptDifficulty, EASY, HARD, MEDIUM, InstructorStatus, APPROVED, PENDING, REJECTED (+26 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.05
Nodes (38): author, description, dotenv, eslint, @types/node, typescript, name, private (+30 more)

### Community 76 - "CreateRoadmapDto"
Cohesion: 0.40
Nodes (4): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString

### Community 77 - "@nestjs/common"
Cohesion: 0.15
Nodes (13): UserRole, ADMIN, INSTRUCTOR, STUDENT, ROLES_KEY, RolesGuard, Injectable, InstructorConceptAnalytics (+5 more)

### Community 78 - "devDependencies"
Cohesion: 0.07
Nodes (29): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, jest (+21 more)

### Community 80 - "UpdateRoadmapDto"
Cohesion: 0.40
Nodes (4): IsNotEmpty, IsOptional, IsString, UpdateRoadmapDto

### Community 81 - "DeletionRequestStatus"
Cohesion: 0.50
Nodes (4): DeletionRequestStatus, APPROVED, PENDING, REJECTED

### Community 82 - "resolveIndex"
Cohesion: 0.50
Nodes (4): catalog(), findRoadmap(), locateThread(), resolveIndex()

### Community 98 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 101 - "terminal-workspace.tsx"
Cohesion: 0.09
Nodes (19): emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, openingCommand(), StudentTerminalPage(), SHORTCUTS (+11 more)

### Community 102 - "PasswordResetOtp"
Cohesion: 0.11
Nodes (13): InjectRepository, ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, PasswordResetOtp, Column, Entity (+5 more)

### Community 104 - "frontend/package.json"
Cohesion: 0.11
Nodes (16): nextConfig, eslint, @types/node, typescript, name, private, version, config (+8 more)

### Community 117 - "gamification.module.ts"
Cohesion: 0.10
Nodes (21): Badge, Column, Entity, Streak, Column, CreateDateColumn, Entity, JoinColumn (+13 more)

### Community 124 - ".updateInstructorBio"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsOptional, IsString, MaxLength, UpdateInstructorBioDto

### Community 127 - "package.json"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 129 - "UpdateOwnProfileDto"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, UpdateOwnProfileDto

### Community 146 - "AiGenerationJob"
Cohesion: 0.14
Nodes (18): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+10 more)

## Knowledge Gaps
- **423 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+418 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 852 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Roles`, `roadmaps.service.ts`, `UpdateOwnProfileDto`, `ReviewService`, `ConceptsService`, `AiGenerateService`, `UsersService`, `ai-generate.service.ts`, `assignments.module.ts`, `Concept`, `ai-generate.controller.ts`, `AuthController`, `AiGenerationJob`, `GetActivityQueryDto`, `QaService`, `AdminContentReviewController`, `AiGenerationLog`, `auth.controller.ts`, `analytics.service.ts`, `CurrentUser`, `auth.module.ts`, `QuizService`, `GetUsersQueryDto`, `user.entity.ts`, `ReviewItem`, `ChangePasswordDto`, `InstructorAnalyticsController`, `RequestDeletionDto`, `factories.ts`, `ProgressController`, `@nestjs/common`, `PasswordResetOtp`, `gamification.module.ts`, `.updateInstructorBio`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `typeorm` connect `user.entity.ts` to `roadmaps.service.ts`, `ai-generate.service.ts`, `assignments.module.ts`, `AddQaAnswerAiSupport1787500000000`, `Concept`, `AddAiGenerationJobs1787600000000`, `analytics.service.ts`, `auth.module.ts`, `AddAiJobRetryAndAck1787700000000`, `InitialSchema1786340981613`, `AddMcqQuiz1786436703834`, `AddConceptDifficulty1786530225075`, `AddAccountDeletionRequests1786630000000`, `FixModuleConceptOrderIndexes1786740000000`, `RestructureModuleScopedPrerequisites1786890000000`, `AddSpacedRepetitionReview1786900000000`, `AddAiGenerationLog1786950000000`, `ExpandAiGenerationTypes1786960000000`, `AddConceptContentReview1787000000000`, `AddPasswordResetOtps1787100000000`, `AddUserProfilePicture1787200000000`, `factories.ts`, `backend/package.json`, `@nestjs/common`, `AddOAuthColumns1787300000000`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `@nestjs/common` connect `@nestjs/common` to `roadmaps.service.ts`, `auth.controller.ts`, `app.controller.ts`, `ai-generate.service.ts`, `factories.ts`, `analytics.service.ts`, `backend/package.json`, `assignments.module.ts`, `auth.module.ts`, `ai-generate.controller.ts`, `Concept`, `QuizService`, `gamification.module.ts`, `jwt-auth.guard.ts`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _423 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `roadmaps.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.0931174089068826 - nodes in this community are weakly interconnected._