# Graph Report - knowledge_is_power  (2026-09-13)

## Corpus Check
- 250 files · ~240,197 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1775 nodes · 4220 edges · 147 communities (75 shown, 72 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1970d636`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Roles
- roadmaps.service.ts
- useTheme
- ReviewService
- ConceptsService
- AiGenerateService
- RoadmapsService
- UsersService
- ai-generate.service.ts
- RegisterDto
- assignments.module.ts
- commands.ts
- Added
- concept.entity.ts
- ai-generate.controller.ts
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- qa.controller.ts
- analytics.service.spec.ts
- collectCoverageFrom
- CreateQuestionDto
- api-client.ts
- compilerOptions
- instructor-analytics.controller.ts
- quiz.controller.ts
- auth.ts
- dependencies
- edit/page.tsx
- AdminContentReviewController
- QuizService
- scripts
- devDependencies
- getUser
- StudentDashboardPage
- dependencies
- Content Authoring Flow
- jest
- auth.controller.ts
- AppController
- Concept
- User
- Next.js Frontend Application
- frontend/package.json
- auth.module.ts
- QuizController
- student/dashboard/page.tsx
- exclude
- eslint-plugin-prettier
- AttachConceptDto
- nest-cli.json
- user.entity.ts
- jwt.strategy.ts
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
- todayIn
- AiGenerationLog
- auth.service.ts
- .applyForInstructor
- [roadmapId]/page.tsx
- factories.ts
- ProgressController
- backend/package.json
- timezone.ts
- users.service.ts
- devDependencies
- AddOAuthColumns1787300000000
- globals
- ResetPasswordDto
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
- PasswordResetOtp
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
- review.controller.ts
- JwtAuthGuard
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
- Patch
- ApiProperty
- IsEmail
- AddQaAnswerAiSupport1787500000000
- MinLength
- IsInt
- Min
- Type
- Query
- AiGenerateController
- AddAiGenerationJobs1787600000000
- AddAiJobRetryAndAck1787700000000

## God Nodes (most connected - your core abstractions)
1. `User` - 160 edges
2. `CurrentUser` - 60 edges
3. `Concept` - 59 edges
4. `BaseEntity` - 46 edges
5. `McqQuestion` - 40 edges
6. `Module` - 39 edges
7. `AiGenerateService` - 38 edges
8. `UsersService` - 38 edges
9. `useSnackbar()` - 35 edges
10. `Roadmap` - 33 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `CreateConceptPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/instructor/concepts/new/page.tsx → frontend/providers/snackbar-provider.tsx
- `StudentDashboardPage()` --calls--> `useTerminalMotion()`  [EXTRACTED]
  frontend/app/student/dashboard/page.tsx → frontend/app/student/dashboard/terminal-motion.tsx
- `StudentDashboardPage()` --calls--> `clearAuth()`  [EXTRACTED]
  frontend/app/student/dashboard/page.tsx → frontend/lib/auth.ts
- `StudentDashboardPage()` --calls--> `useAllRoadmapsProgress()`  [EXTRACTED]
  frontend/app/student/dashboard/page.tsx → frontend/lib/hooks/use-roadmap-progress.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (147 total, 72 thin omitted)

### Community 0 - "Roles"
Cohesion: 0.22
Nodes (13): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Delete, Get (+5 more)

### Community 1 - "roadmaps.service.ts"
Cohesion: 0.09
Nodes (39): AppModule, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, ModuleConcept, Column (+31 more)

### Community 2 - "useTheme"
Cohesion: 0.10
Nodes (25): CallbackHandler(), emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, LoginPage(), LoginStage (+17 more)

### Community 3 - "ReviewService"
Cohesion: 0.05
Nodes (34): GetActivityQueryDto, ApiPropertyOptional, IsOptional, GamificationController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags (+26 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (32): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags (+24 more)

### Community 5 - "AiGenerateService"
Cohesion: 0.21
Nodes (3): AiGenerateService, Injectable, InjectRepository

### Community 7 - "UsersService"
Cohesion: 0.09
Nodes (6): AuthService, Injectable, InjectRepository, Injectable, InjectRepository, UsersService

### Community 8 - "ai-generate.service.ts"
Cohesion: 0.13
Nodes (23): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, ParsedMcqOption, ParsedMcqQuestion, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), buildModuleConceptsUserPrompt() (+15 more)

### Community 9 - "RegisterDto"
Cohesion: 0.13
Nodes (14): ApiProperty, IsIanaTimezone(), RegisterDto, ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, ApiPropertyOptional (+6 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "commands.ts"
Cohesion: 0.08
Nodes (31): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), applyInstructor, avatar(), clear, COMMAND_LIST (+23 more)

### Community 12 - "Added"
Cohesion: 0.14
Nodes (13): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changelog, Developer experience, Learning content (+5 more)

### Community 13 - "concept.entity.ts"
Cohesion: 0.18
Nodes (19): ConceptReviewStatus, ProgressService, Injectable, McqAttempt, Column, Entity, JoinColumn, ManyToOne (+11 more)

### Community 14 - "ai-generate.controller.ts"
Cohesion: 0.35
Nodes (13): AcknowledgeJobsDto, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto, GenerateRoadmapModulesDto, ApiProperty, ApiPropertyOptional (+5 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.10
Nodes (27): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+19 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.17
Nodes (15): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+7 more)

### Community 18 - "qa.controller.ts"
Cohesion: 0.07
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, ApiPropertyOptional, IsIn (+23 more)

### Community 19 - "analytics.service.spec.ts"
Cohesion: 0.23
Nodes (10): ConceptDifficulty, InstructorStatus, UserRole, makeConcept(), makeUser(), createMockQueryBuilder(), createMockRepository(), MockRepository (+2 more)

### Community 20 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !**/*.spec.ts, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, **/*.(t|j)s

### Community 21 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

### Community 22 - "api-client.ts"
Cohesion: 0.07
Nodes (39): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+31 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "instructor-analytics.controller.ts"
Cohesion: 0.07
Nodes (30): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+22 more)

### Community 25 - "quiz.controller.ts"
Cohesion: 0.13
Nodes (14): SubmitAttemptDto, ApiProperty, IsUUID, IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto (+6 more)

### Community 26 - "auth.ts"
Cohesion: 0.11
Nodes (29): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), BasicInfoFormData, basicInfoSchema (+21 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.10
Nodes (22): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+14 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.14
Nodes (15): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+7 more)

### Community 30 - "QuizService"
Cohesion: 0.27
Nodes (3): QuizService, Injectable, InjectRepository

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "getUser"
Cohesion: 0.11
Nodes (18): InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, inter, metadata, outfit, rubik (+10 more)

### Community 34 - "StudentDashboardPage"
Cohesion: 0.22
Nodes (13): badgeTag(), ordinal(), pad(), plural(), stableNumber(), StudentDashboardPage(), bootLines(), completeCommand() (+5 more)

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
Cohesion: 0.19
Nodes (9): ApiProperty, IsEmail, IsNotEmpty, VerifyOtpDto, GitHubAuthGuard, Injectable, GoogleAuthGuard, Injectable (+1 more)

### Community 39 - "AppController"
Cohesion: 0.23
Nodes (8): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable, Public()

### Community 40 - "Concept"
Cohesion: 0.14
Nodes (17): ProgressStatus, InjectRepository, InjectRepository, InjectRepository, Concept, Column, Entity, JoinColumn (+9 more)

### Community 41 - "User"
Cohesion: 0.17
Nodes (18): CurrentUser, RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+10 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "auth.module.ts"
Cohesion: 0.17
Nodes (7): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable, EmailModule, UsersModule

### Community 45 - "QuizController"
Cohesion: 0.19
Nodes (12): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.10
Nodes (18): ACTIVITY_SCALE, ActivityDay, BadgeDef, DARK, EarnedBadgeItem, GamificationData, LIGHT, MONTHS (+10 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 49 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "user.entity.ts"
Cohesion: 0.12
Nodes (25): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, typeOrmAsyncConfig, Answer, Column (+17 more)

### Community 52 - "jwt.strategy.ts"
Cohesion: 0.33
Nodes (3): JwtPayload, JwtStrategy, Injectable

### Community 53 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 68 - "todayIn"
Cohesion: 0.68
Nodes (5): addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn()

### Community 69 - "AiGenerationLog"
Cohesion: 0.40
Nodes (5): AiGenerationLog, Column, Entity, JoinColumn, ManyToOne

### Community 70 - "auth.service.ts"
Cohesion: 0.16
Nodes (10): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString (+2 more)

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "factories.ts"
Cohesion: 0.08
Nodes (40): XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeOption(), makeProgress(), makeQuestion(), makeReviewItem() (+32 more)

### Community 74 - "ProgressController"
Cohesion: 0.20
Nodes (10): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+2 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 76 - "timezone.ts"
Cohesion: 0.52
Nodes (6): detectTimezone(), formatClock(), formatDate(), safeZone(), syncTimezoneForNewAccount(), zoneAbbrev()

### Community 77 - "users.service.ts"
Cohesion: 0.08
Nodes (30): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, ChangePasswordDto, ApiProperty, IsNotEmpty, IsString (+22 more)

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 98 - "roadmaps.controller.ts"
Cohesion: 0.07
Nodes (25): AddModulePrerequisiteDto, ApiProperty, IsUUID, CreateModuleDto, IsInt, IsNotEmpty, IsString, Min (+17 more)

### Community 102 - "PasswordResetOtp"
Cohesion: 0.33
Nodes (6): PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne

### Community 116 - "review.controller.ts"
Cohesion: 0.40
Nodes (4): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID

### Community 117 - "JwtAuthGuard"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 124 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 146 - "AiGenerateController"
Cohesion: 0.18
Nodes (14): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+6 more)

## Knowledge Gaps
- **361 isolated node(s):** `EarnedBadgeItem`, `GamificationData`, `UserConceptProgress`, `Roadmap`, `BadgeDef` (+356 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `Roles`, `roadmaps.service.ts`, `ConceptsService`, `RoadmapsService`, `ai-generate.service.ts`, `RegisterDto`, `assignments.module.ts`, `concept.entity.ts`, `ai-generate.controller.ts`, `qa.controller.ts`, `analytics.service.spec.ts`, `instructor-analytics.controller.ts`, `quiz.controller.ts`, `AdminContentReviewController`, `auth.controller.ts`, `Concept`, `auth.module.ts`, `QuizController`, `user.entity.ts`, `jwt.strategy.ts`, `AiGenerationLog`, `auth.service.ts`, `.applyForInstructor`, `factories.ts`, `users.service.ts`, `roadmaps.controller.ts`, `PasswordResetOtp`, `review.controller.ts`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `QuizService` connect `QuizService` to `roadmaps.service.ts`, `AiGenerateService`, `ai-generate.service.ts`, `QuizController`, `concept.entity.ts`, `quiz.controller.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `User` to `Roles`, `roadmaps.controller.ts`, `ConceptsService`, `auth.controller.ts`, `.applyForInstructor`, `RegisterDto`, `concept.entity.ts`, `ai-generate.controller.ts`, `QuizController`, `users.service.ts`, `qa.controller.ts`, `analytics.service.spec.ts`, `review.controller.ts`, `instructor-analytics.controller.ts`, `quiz.controller.ts`, `AdminContentReviewController`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `EarnedBadgeItem`, `GamificationData`, `UserConceptProgress` to the rest of the system?**
  _361 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `roadmaps.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08944793850454227 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.10483870967741936 - nodes in this community are weakly interconnected._
- **Should `ReviewService` be split into smaller, more focused modules?**
  _Cohesion score 0.05026300409117475 - nodes in this community are weakly interconnected._