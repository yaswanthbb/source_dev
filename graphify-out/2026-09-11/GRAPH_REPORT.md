# Graph Report - knowledge_is_power  (2026-09-11)

## Corpus Check
- 243 files · ~221,428 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1687 nodes · 4192 edges · 137 communities (74 shown, 63 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cb44d864`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Roles
- roadmaps.service.ts
- profile/page.tsx
- ReviewService
- ConceptsController
- gamification.controller.ts
- Roadmap
- UsersService
- User
- hasSignificantContentChange
- assignments.module.ts
- AuthService
- Added
- typeorm.config.ts
- UserConceptProgress
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- QaController
- user.entity.ts
- collectCoverageFrom
- AiGenerateController
- useSnackbar
- compilerOptions
- AnalyticsController
- ai-generate.service.ts
- auth.ts
- dependencies
- edit/page.tsx
- AdminContentReviewController
- XpEvent
- scripts
- devDependencies
- app/layout.tsx
- JwtAuthGuard
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
- AiGenerationJob
- exclude
- eslint-plugin-prettier
- ai-generate.controller.ts
- nest-cli.json
- qa.service.ts
- Concept
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
- RegisterDto
- AddModulePrerequisiteDto
- ForgotPasswordDto
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
- VerifyOtpDto
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
- CreateRoadmapDto
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
- UpdateRoadmapDto
- class-transformer
- @nestjs/platform-express
- eslint
- @types/bcrypt
- @types/passport-github2
- @types/passport-google-oauth20
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
9. `useSnackbar()` - 37 edges
10. `Roadmap` - 35 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `RootPage()` --calls--> `getToken()`  [EXTRACTED]
  frontend/app/page.tsx → frontend/lib/auth.ts
- `Module` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/content/entities/module.entity.ts → backend/src/common/entities/base.entity.ts
- `Module` --references--> `Roadmap`  [EXTRACTED]
  backend/src/modules/content/entities/module.entity.ts → backend/src/modules/content/entities/roadmap.entity.ts
- `EmailModule` --references--> `Module`  [EXTRACTED]
  backend/src/modules/email/email.module.ts → backend/src/modules/content/entities/module.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (137 total, 63 thin omitted)

### Community 0 - "Roles"
Cohesion: 0.19
Nodes (15): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+7 more)

### Community 1 - "roadmaps.service.ts"
Cohesion: 0.10
Nodes (33): AppModule, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, ModuleConcept, Column (+25 more)

### Community 2 - "profile/page.tsx"
Cohesion: 0.09
Nodes (30): CallbackHandler(), LoginPage(), LoginStage, RegisterPage(), RegisterStage, RootPage(), BasicInfoFormData, basicInfoSchema (+22 more)

### Community 3 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 4 - "ConceptsController"
Cohesion: 0.07
Nodes (28): ApiQuery, ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+20 more)

### Community 5 - "gamification.controller.ts"
Cohesion: 0.12
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 6 - "Roadmap"
Cohesion: 0.14
Nodes (9): Roadmap, Column, Entity, JoinColumn, ManyToOne, OneToMany, RoadmapsService, Injectable (+1 more)

### Community 7 - "UsersService"
Cohesion: 0.08
Nodes (7): InjectRepository, JwtPayload, JwtStrategy, Injectable, Injectable, InjectRepository, UsersService

### Community 8 - "User"
Cohesion: 0.15
Nodes (14): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+6 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "AuthService"
Cohesion: 0.18
Nodes (7): AuthService, Injectable, ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "typeorm.config.ts"
Cohesion: 0.12
Nodes (25): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, typeOrmAsyncConfig, InjectRepository, McqAttempt (+17 more)

### Community 14 - "UserConceptProgress"
Cohesion: 0.12
Nodes (13): InjectRepository, GamificationService, Injectable, InjectRepository, Column, Entity, JoinColumn, ManyToOne (+5 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.07
Nodes (38): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+30 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "QaController"
Cohesion: 0.12
Nodes (18): IsNotEmpty, IsString, UpdateAnswerDto, IsNotEmpty, IsString, UpdateQaQuestionDto, QaController, ApiBearerAuth (+10 more)

### Community 19 - "user.entity.ts"
Cohesion: 0.17
Nodes (15): UserRole, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, ROLES_KEY, RolesGuard, Injectable (+7 more)

### Community 20 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !**/*.spec.ts, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, **/*.(t|j)s

### Community 21 - "AiGenerateController"
Cohesion: 0.21
Nodes (12): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+4 more)

### Community 22 - "useSnackbar"
Cohesion: 0.06
Nodes (45): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+37 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.18
Nodes (10): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+2 more)

### Community 25 - "ai-generate.service.ts"
Cohesion: 0.17
Nodes (18): AiGenerationType, ParsedMcqOption, ParsedMcqQuestion, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), buildModuleConceptsUserPrompt(), buildQaAnswerUserPrompt(), buildRoadmapModulesUserPrompt() (+10 more)

### Community 26 - "auth.ts"
Cohesion: 0.13
Nodes (27): ADMIN_NAV_ITEMS, AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, FullUser, INSTRUCTOR_NAV_ITEMS (+19 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.14
Nodes (15): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+7 more)

### Community 30 - "XpEvent"
Cohesion: 0.19
Nodes (13): XpSource, Column, Entity, JoinColumn, ManyToOne, XpEvent, ReviewItem, Column (+5 more)

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), SnackbarProvider()

### Community 34 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

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
Cohesion: 0.13
Nodes (13): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString, LoginDto, ApiProperty, IsEmail (+5 more)

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
Cohesion: 0.11
Nodes (14): PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne, OAuthProfile, GitHubStrategy (+6 more)

### Community 45 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 46 - "AiGenerationJob"
Cohesion: 0.17
Nodes (9): AiGenerationJobStatus, AiGenerationJobType, AiGenerationJob, AiGenerationJobFailedItem, Column, Entity, Index, JoinColumn (+1 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 49 - "ai-generate.controller.ts"
Cohesion: 0.35
Nodes (13): AcknowledgeJobsDto, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto, GenerateRoadmapModulesDto, ApiProperty, ApiPropertyOptional (+5 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "qa.service.ts"
Cohesion: 0.09
Nodes (25): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+17 more)

### Community 52 - "Concept"
Cohesion: 0.13
Nodes (11): slugify(), InjectRepository, InjectRepository, ConceptsService, Injectable, InjectRepository, Concept, Column (+3 more)

### Community 53 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 68 - "RegisterDto"
Cohesion: 0.25
Nodes (6): RegisterDto, ApiProperty, IsEmail, IsNotEmpty, IsString, MinLength

### Community 69 - "AddModulePrerequisiteDto"
Cohesion: 0.50
Nodes (3): AddModulePrerequisiteDto, ApiProperty, IsUUID

### Community 70 - "ForgotPasswordDto"
Cohesion: 0.29
Nodes (4): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty

### Community 71 - "InstructorProfile"
Cohesion: 0.23
Nodes (12): InstructorStatus, makeUser(), createMockRepository(), MockQueryBuilder, MockRepository, NOW, InstructorProfile, Column (+4 more)

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "factories.ts"
Cohesion: 0.11
Nodes (32): ConceptDifficulty, ConceptReviewStatus, ProgressStatus, FIXED_DATE, makeAttempt(), makeBadge(), makeConcept(), makeOption() (+24 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 76 - "UpdateModuleDto"
Cohesion: 0.14
Nodes (11): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min, IsInt, IsNotEmpty, IsOptional (+3 more)

### Community 77 - "users.service.ts"
Cohesion: 0.07
Nodes (35): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, ChangePasswordDto, ApiProperty, IsNotEmpty, IsString (+27 more)

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, VerifyOtpDto, Matches

### Community 98 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 102 - "CreateRoadmapDto"
Cohesion: 0.40
Nodes (4): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString

### Community 116 - "UpdateRoadmapDto"
Cohesion: 0.40
Nodes (4): IsNotEmpty, IsOptional, IsString, UpdateRoadmapDto

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 146 - "AiGenerateService"
Cohesion: 0.24
Nodes (3): AiGenerateService, Injectable, AiGenerationJobResultSummary

## Knowledge Gaps
- **336 isolated node(s):** `RegisterStage`, `ParsedMcqOption`, `ParsedMcqQuestion`, `AttemptResponse`, `ConceptDetail` (+331 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Roles`, `roadmaps.service.ts`, `ReviewService`, `ConceptsController`, `gamification.controller.ts`, `Roadmap`, `UsersService`, `assignments.module.ts`, `typeorm.config.ts`, `UserConceptProgress`, `AuthController`, `AiGenerateService`, `user.entity.ts`, `QaController`, `AiGenerateController`, `ai-generate.service.ts`, `AdminContentReviewController`, `XpEvent`, `auth.controller.ts`, `CurrentUser`, `auth.module.ts`, `QuizService`, `AiGenerationJob`, `ai-generate.controller.ts`, `qa.service.ts`, `Concept`, `InstructorProfile`, `factories.ts`, `ProgressController`, `users.service.ts`?**
  _High betweenness centrality (0.204) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `Roles`, `ReviewService`, `ConceptsController`, `gamification.controller.ts`, `auth.controller.ts`, `User`, `ProgressController`, `QuizService`, `users.service.ts`, `ai-generate.controller.ts`, `AuthController`, `user.entity.ts`, `qa.service.ts`, `AiGenerateController`, `QaController`, `AdminContentReviewController`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Module` connect `roadmaps.service.ts` to `Roadmap`, `factories.ts`, `auth.module.ts`, `typeorm.config.ts`, `UserConceptProgress`, `user.entity.ts`, `Concept`, `ai-generate.service.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `RegisterStage`, `ParsedMcqOption`, `ParsedMcqQuestion` to the rest of the system?**
  _336 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `roadmaps.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1026827012025902 - nodes in this community are weakly interconnected._
- **Should `profile/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09102564102564102 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._