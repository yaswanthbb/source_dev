# Graph Report - knowledge_is_power  (2026-09-24)

## Corpus Check
- 273 files · ~255,822 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2163 nodes · 4897 edges · 200 communities (86 shown, 114 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 127 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0f1a3a13`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- User
- ai-generate.service.ts
- useTheme
- user.entity.ts
- ConceptsController
- ReviewService
- ConceptsService
- UsersController
- roadmaps.controller.ts
- UpdateOwnProfileDto
- assignments.module.ts
- commands.ts
- Added
- McqQuestion
- terminal-workspace.tsx
- analytics.service.spec.ts
- compilerOptions
- AuthController
- QaService
- AiGenerateController
- learning-commands.ts
- class-transformer
- api-client.ts
- compilerOptions
- AnalyticsController
- commands.test.mjs
- auth.ts
- dependencies
- app.module.ts
- RejectConceptDto
- edit/page.tsx
- scripts
- devDependencies
- app/layout.tsx
- fs-commands.ts
- dependencies
- 1. Roles (§1)
- jest
- auth.controller.ts
- Public
- Concept
- RoadmapsService
- Next.js Frontend Application
- frontend/package.json
- output.ts
- CurrentUser
- student/dashboard/page.tsx
- exclude
- DeveloperAnalyticsController
- UpdateModuleDto
- nest-cli.json
- location.ts
- fs-commands.test.mjs
- use-terminal-session.ts
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
- AttachConceptDto
- instructor/layout.tsx
- ApiBearerAuth
- resolve-location.ts
- source:dev — Master Plan
- [roadmapId]/page.tsx
- PasswordResetOtp
- ProgressController
- backend/package.json
- next.config.ts
- CreateQuestionDto
- devDependencies
- AddOAuthColumns1787300000000
- tailwind.config.ts
- AuthService
- collectCoverageFrom
- check-theme-separation.mjs
- CreateModuleDto
- OAuthProfile
- @nestjs/passport
- quiz.controller.ts
- auth.module.ts
- CreateConceptDto
- location.test.mjs
- AddUserPreferences1787800000000
- ai-generate.controller.ts
- axios
- RoleCollapseToDeveloper1787900000000
- QaDiscussionModel1787910000000
- hasSignificantContentChange
- @nestjs/swagger
- index.ts
- passport-github2
- passport-jwt
- pg
- lucide-react
- frontend/eslint.config.mjs
- typeorm
- eslint
- @eslint/eslintrc
- eslint-plugin-prettier
- globals
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- ApiBearerAuth
- @nestjs/cli
- @nestjs/schematics
- Application Logo
- @nestjs/testing
- factories.ts
- prettier
- source-map-support
- supertest
- ts-jest
- ts-loader
- ts-node
- tsconfig-paths
- @types/bcrypt
- @types/express
- dependencies
- @types/jest
- @types/node
- @types/nodemailer
- @types/passport-github2
- @types/passport-google-oauth20
- @types/passport-jwt
- typescript-eslint
- admin/dashboard/page.tsx
- react-hook-form
- react-markdown
- remark-gfm
- AddQaAnswerAiSupport1787500000000
- eslint-config-prettier
- users.service.ts
- ApiOperation
- ApiResponse
- AiGenerateService
- @nestjs/typeorm
- nodemailer
- ApiPropertyOptional
- IsOptional
- AGENTS.md
- AddAiGenerationJobs1787600000000
- IsString
- ApiTags
- ApiOperation
- ApiResponse
- ApiTags
- Controller
- Get
- UseGuards
- Injectable
- InjectRepository
- ApiProperty
- Query
- IsIn
- IsNotEmpty
- OneToMany
- IsEnum
- ApiPropertyOptional
- IsOptional
- IsString
- MaxLength
- Column
- Entity
- AddAiJobRetryAndAck1787700000000
- JoinColumn
- ManyToOne
- OneToOne
- OneToOne
- Body
- Controller
- CurrentUser
- Delete
- Get
- InjectRepository
- Param
- Patch
- QuizService
- Roles
- UseGuards
- prompts.ts
- UpdateConceptDto
- CreateRoadmapDto
- UpdateRoadmapDto
- PublishingWorkflow1787920000000
- PublishedEditModel1787930000000
- OneToMany
- Post
- Module

## God Nodes (most connected - your core abstractions)
1. `User` - 167 edges
2. `Concept` - 59 edges
3. `Roadmap` - 46 edges
4. `RoadmapsService` - 44 edges
5. `McqQuestion` - 41 edges
6. `BaseEntity` - 39 edges
7. `AiGenerateService` - 36 edges
8. `CurrentUser` - 35 edges
9. `UsersService` - 31 edges
10. `ModuleConcept` - 31 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `Roadmap` --references--> `RoadmapReviewStatus`  [EXTRACTED]
  backend/src/modules/content/entities/roadmap.entity.ts → backend/src/common/enums/roadmap-review-status.enum.ts
- `PlacementLike` --references--> `RoadmapReviewStatus`  [EXTRACTED]
  backend/src/modules/content/utils/visibility.util.ts → backend/src/common/enums/roadmap-review-status.enum.ts
- `Assignment` --references--> `Concept`  [EXTRACTED]
  backend/src/modules/assignments/entities/assignment.entity.ts → backend/src/modules/content/entities/concept.entity.ts
- `ModuleConcept` --references--> `Concept`  [EXTRACTED]
  backend/src/modules/content/entities/module-concept.entity.ts → backend/src/modules/content/entities/concept.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (200 total, 114 thin omitted)

### Community 0 - "User"
Cohesion: 0.12
Nodes (8): JwtStrategy, Injectable, Column, Entity, User, Injectable, InjectRepository, UsersService

### Community 1 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (41): AiGenerationJobStatus, AiGenerationType, RoadmapUnpublishStatus, AiGenerateModule, ParsedMcqOption, ParsedMcqQuestion, InjectRepository, AiGenerationJob (+33 more)

### Community 2 - "useTheme"
Cohesion: 0.09
Nodes (29): CallbackHandler(), emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, LoginPage(), LoginStage (+21 more)

### Community 3 - "user.entity.ts"
Cohesion: 0.18
Nodes (13): MostMissedOption, Answer, Column, Entity, JoinColumn, ManyToOne, Question, Column (+5 more)

### Community 4 - "ConceptsController"
Cohesion: 0.14
Nodes (15): ApiQuery, ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+7 more)

### Community 5 - "ReviewService"
Cohesion: 0.05
Nodes (38): addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn(), GetActivityQueryDto, ApiPropertyOptional, IsInt (+30 more)

### Community 6 - "ConceptsService"
Cohesion: 0.15
Nodes (6): slugify(), ConceptsService, Injectable, InjectRepository, canSeeConcept(), canSeeRoadmap()

### Community 7 - "UsersController"
Cohesion: 0.20
Nodes (16): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser, Delete (+8 more)

### Community 8 - "roadmaps.controller.ts"
Cohesion: 0.18
Nodes (10): Roles(), ROLES_KEY, RolesGuard, Injectable, AddModulePrerequisiteDto, ApiProperty, IsUUID, IsInt (+2 more)

### Community 9 - "UpdateOwnProfileDto"
Cohesion: 0.13
Nodes (15): IsIanaTimezone(), ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, Type, ValidateNested, UpdateOwnProfileDto (+7 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "commands.ts"
Cohesion: 0.05
Nodes (58): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), avatar(), BootLine, bootLines(), BootStep (+50 more)

### Community 12 - "Added"
Cohesion: 0.13
Nodes (14): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changed, Changelog, Developer experience (+6 more)

### Community 13 - "McqQuestion"
Cohesion: 0.15
Nodes (21): BaseEntity, CreateDateColumn, UpdateDateColumn, McqAttempt, Column, Entity, JoinColumn, ManyToOne (+13 more)

### Community 14 - "terminal-workspace.tsx"
Cohesion: 0.12
Nodes (15): openingCommand(), StudentTerminalPage(), CodeBlock(), DOC_HEADINGS, FetchBlock(), HIGHLIGHT_KEYWORDS, highlightCode(), Line() (+7 more)

### Community 15 - "analytics.service.spec.ts"
Cohesion: 0.28
Nodes (12): ConceptReviewStatus, RoadmapReviewStatus, UserRole, makeConcept(), makeUser(), createMockQueryBuilder(), createMockRepository(), MockRepository (+4 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.18
Nodes (13): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+5 more)

### Community 18 - "QaService"
Cohesion: 0.07
Nodes (33): ApiProperty, CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsOptional (+25 more)

### Community 19 - "AiGenerateController"
Cohesion: 0.18
Nodes (14): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+6 more)

### Community 20 - "learning-commands.ts"
Cohesion: 0.06
Nodes (53): allThreads(), askerIdOf(), askerOf(), askQuestion(), AttemptResult, body(), catalog(), clearLearningCache() (+45 more)

### Community 22 - "api-client.ts"
Cohesion: 0.08
Nodes (36): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+28 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.12
Nodes (16): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Roles (+8 more)

### Community 25 - "commands.test.mjs"
Cohesion: 0.16
Nodes (9): attemptOrFail(), catalogOrFail(), CATALOGUE, commands, __dirname, EXTERNAL, fail(), { installGlyphs } (+1 more)

### Community 26 - "auth.ts"
Cohesion: 0.15
Nodes (20): AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, InstructorAppShellLayout(), RootPage(), StudentAppShellLayout() (+12 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "app.module.ts"
Cohesion: 0.13
Nodes (13): AppModule, Module, typeOrmAsyncConfig, AnalyticsModule, Module, AssignmentsModule, AuthModule, DeveloperAnalyticsModule (+5 more)

### Community 29 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 30 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), SnackbarProvider()

### Community 34 - "fs-commands.ts"
Cohesion: 0.10
Nodes (21): CommandCtx, CommandSpec, cat, cd, closeConcept(), contentOf(), FS_COMMANDS, history (+13 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "1. Roles (§1)"
Cohesion: 0.05
Nodes (36): 0.1 Register developer A (future content author), 0.2 Register developer B (other developer), 0.3 Promote yourself to admin (no seed exists — do it in SQL), 0. Setup — three users, 1.10 Reject-roadmap and unpublish, 1.11 Draft/live split on published concepts (§3.8), 1.12 Detach blocked on published, delete-concept guard (§3.8), 1.13 Unpublish request flow + scheduled deletion (§3.8) (+28 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$ (+3 more)

### Community 38 - "auth.controller.ts"
Cohesion: 0.08
Nodes (27): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty (+19 more)

### Community 39 - "Public"
Cohesion: 0.23
Nodes (8): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable, Public()

### Community 40 - "Concept"
Cohesion: 0.10
Nodes (25): ProgressStatus, Concept, Column, Entity, JoinColumn, ManyToOne, ModuleConceptPrerequisite, CreateDateColumn (+17 more)

### Community 41 - "RoadmapsService"
Cohesion: 0.06
Nodes (32): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+24 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "output.ts"
Cohesion: 0.21
Nodes (14): clearHistory(), CommandHelp, FetchReport, FetchRow, HelpRow, history, LineKind, LineSegment (+6 more)

### Community 45 - "CurrentUser"
Cohesion: 0.26
Nodes (13): CurrentUser, QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+5 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.11
Nodes (25): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+17 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 48 - "DeveloperAnalyticsController"
Cohesion: 0.13
Nodes (16): DeveloperAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+8 more)

### Community 49 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "location.ts"
Cohesion: 0.11
Nodes (31): UserPreferences, targetOf(), ADMIN_TERMINAL_ROUTE, ChildKind, deserializeLocation(), formatPath(), fromCliParam(), fromSegments() (+23 more)

### Community 52 - "fs-commands.test.mjs"
Cohesion: 0.09
Nodes (20): BY_NAME, CONCEPTS, DETAIL, __dirname, failOnce, FS, GLYPHS, L (+12 more)

### Community 53 - "use-terminal-session.ts"
Cohesion: 0.13
Nodes (25): Console(), chunkEnd(), pageRows(), PagerState, PendingQuestion, PendingSelect, sleep(), SuggestRow (+17 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 68 - "instructor/layout.tsx"
Cohesion: 0.09
Nodes (21): ADMIN_NAV_ITEMS, FullUser, INSTRUCTOR_NAV_ITEMS, BasicInfoFormData, basicInfoSchema, ChangePasswordFormData, changePasswordSchema, ProfilePage() (+13 more)

### Community 70 - "resolve-location.ts"
Cohesion: 0.11
Nodes (25): ConceptProgressInfo, ModuleConceptItem, RoadmapDetailData, RoadmapModuleItem, RoadmapProgressData, api, isAbortError(), cache (+17 more)

### Community 71 - "source:dev — Master Plan"
Cohesion: 0.10
Nodes (19): 0. Vision, 10. Updated build order (revised 2026-09-21 — backend-first, frontend-last), 11. Decision log (memory for future sessions/agents), 12. QA discussion model (revised 2026-09-21, supersedes §1 author-only draft), 1. Roles — collapsed from three to two, 2. Content ownership & reuse, 3. Publishing / review workflow, 4. Content labeling (AI-generated vs hand-written vs partial) (+11 more)

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "PasswordResetOtp"
Cohesion: 0.13
Nodes (10): InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne, EmailModule (+2 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 77 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "AuthService"
Cohesion: 0.15
Nodes (10): AuthService, Injectable, RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional (+2 more)

### Community 82 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, !**/*.spec.ts, **/*.(t|j)s

### Community 83 - "check-theme-separation.mjs"
Cohesion: 0.25
Nodes (5): __dirname, GUARDED, ROOT, RULES, violations

### Community 84 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 85 - "OAuthProfile"
Cohesion: 0.20
Nodes (5): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable

### Community 87 - "quiz.controller.ts"
Cohesion: 0.13
Nodes (14): SubmitAttemptDto, ApiProperty, IsUUID, IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto (+6 more)

### Community 88 - "auth.module.ts"
Cohesion: 0.12
Nodes (12): IS_PUBLIC_KEY, JwtAuthGuard, Injectable, JwtPayload, AccountDeletionRequest, DeletionRequestStatus, Column, Entity (+4 more)

### Community 89 - "CreateConceptDto"
Cohesion: 0.29
Nodes (7): CreateConceptDto, ApiProperty, ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString

### Community 90 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 92 - "ai-generate.controller.ts"
Cohesion: 0.35
Nodes (13): AcknowledgeJobsDto, GenerateConceptContentDto, GenerateConceptMcqsDto, GenerateModuleConceptsDto, GenerateModuleMcqsDto, GenerateRoadmapModulesDto, ApiProperty, ApiPropertyOptional (+5 more)

### Community 98 - "index.ts"
Cohesion: 0.17
Nodes (11): BANNER, BannerLine, BannerTone, DEFAULT_THEME_ID, TERMINAL, ThemeDefinition, THEMES, DARK (+3 more)

### Community 117 - "factories.ts"
Cohesion: 0.07
Nodes (44): ConceptDifficulty, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeOption(), makeProgress(), makeQuestion() (+36 more)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 136 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 143 - "users.service.ts"
Cohesion: 0.15
Nodes (15): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength, GetUsersQueryDto, ApiPropertyOptional, IsOptional (+7 more)

### Community 146 - "AiGenerateService"
Cohesion: 0.22
Nodes (6): AiGenerationJobType, AiGenerateService, Injectable, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), AiGenerationJobResultSummary

### Community 191 - "prompts.ts"
Cohesion: 0.27
Nodes (8): buildModuleConceptsUserPrompt(), buildQaAnswerUserPrompt(), buildRoadmapModulesUserPrompt(), CONCEPT_CONTENT_SYSTEM_PROMPT, CONCEPT_MCQ_SYSTEM_PROMPT, MODULE_CONCEPTS_SYSTEM_PROMPT, QA_ANSWER_SYSTEM_PROMPT, ROADMAP_MODULES_SYSTEM_PROMPT

### Community 192 - "UpdateConceptDto"
Cohesion: 0.33
Nodes (6): ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString, UpdateConceptDto

### Community 193 - "CreateRoadmapDto"
Cohesion: 0.40
Nodes (4): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString

### Community 194 - "UpdateRoadmapDto"
Cohesion: 0.40
Nodes (4): IsNotEmpty, IsOptional, IsString, UpdateRoadmapDto

## Knowledge Gaps
- **461 isolated node(s):** `FIXED_DATE`, `Actor`, `ConceptLike`, `0.1 Register developer A (future content author)`, `0.2 Register developer B (other developer)` (+456 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **114 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `ai-generate.service.ts`, `user.entity.ts`, `ConceptsController`, `ReviewService`, `UsersController`, `roadmaps.controller.ts`, `assignments.module.ts`, `McqQuestion`, `analytics.service.spec.ts`, `users.service.ts`, `AuthController`, `AiGenerateService`, `AiGenerateController`, `QaService`, `AnalyticsController`, `auth.controller.ts`, `Concept`, `CurrentUser`, `DeveloperAnalyticsController`, `QuizService`, `PasswordResetOtp`, `ProgressController`, `AuthService`, `quiz.controller.ts`, `auth.module.ts`, `ai-generate.controller.ts`, `factories.ts`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `ai-generate.service.ts`, `user.entity.ts`, `ConceptsService`, `RoadmapsService`, `assignments.module.ts`, `McqQuestion`, `analytics.service.spec.ts`, `QaService`, `factories.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `AnalyticsController` connect `AnalyticsController` to `roadmaps.controller.ts`, `user.entity.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `FIXED_DATE`, `Actor`, `ConceptLike` to the rest of the system?**
  _461 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.1206896551724138 - nodes in this community are weakly interconnected._
- **Should `ai-generate.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08148148148148149 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.08780487804878048 - nodes in this community are weakly interconnected._