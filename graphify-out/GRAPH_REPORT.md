# Graph Report - knowledge_is_power  (2026-09-25)

## Corpus Check
- 298 files · ~268,312 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2389 nodes · 5539 edges · 195 communities (90 shown, 105 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 156 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `82e91ae3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- Concept
- useTheme
- analytics.service.ts
- ConceptsService
- ReviewService
- ai-generate.service.ts
- UsersController
- User
- AiKeysService
- assignments.module.ts
- commands.ts
- Added
- typeorm.config.ts
- index.ts
- roadmaps.service.ts
- compilerOptions
- AuthController
- qa.service.ts
- users.service.ts
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
- AppController
- ai-keys.service.ts
- RoadmapsController
- Next.js Frontend Application
- frontend/package.json
- output.ts
- CurrentUser
- student/dashboard/page.tsx
- exclude
- DeveloperAnalyticsController
- roadmaps.controller.ts
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
- RoadmapsService
- minimal-terminal-loader.tsx
- ApiBearerAuth
- GamificationController
- source:dev — Master Plan
- ai-jobs-provider.tsx
- auth.module.ts
- ProgressController
- backend/package.json
- next.config.ts
- AiGenerateService
- devDependencies
- AddOAuthColumns1787300000000
- tailwind.config.ts
- AiProviderKey
- collectCoverageFrom
- check-theme-separation.mjs
- CreateQuestionDto
- CreateAiKeyDto
- @nestjs/passport
- AdminContentReviewController
- origin-label.util.ts
- CreateConceptDto
- location.test.mjs
- AddUserPreferences1787800000000
- NotificationsService
- axios
- RoleCollapseToDeveloper1787900000000
- QaDiscussionModel1787910000000
- quiz.controller.ts
- @nestjs/swagger
- GetActivityQueryDto
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
- QuizService
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
- RegisterDto
- 2. QA discussion (§12)
- todayIn
- ai-generate.controller.ts
- @nestjs/typeorm
- nodemailer
- ApiPropertyOptional
- IsOptional
- AGENTS.md
- AddAiGenerationJobs1787600000000
- IsString
- 7. Notifications (§7) — needs migration run
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
- Articles1787970000000
- 8. Articles (§6) — needs migration run
- 6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run
- Notifications1787960000000
- AiByokKeys1787940000000
- 0. Setup — three users
- 3. Analytics (retargeted, §1)
- AiKeyDefaultModel1787950000000
- IsArray
- IsNotEmpty
- PublishingWorkflow1787920000000
- PublishedEditModel1787930000000
- IsUUID
- Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing
- Module

## God Nodes (most connected - your core abstractions)
1. `User` - 143 edges
2. `Concept` - 57 edges
3. `RoadmapsService` - 43 edges
4. `McqQuestion` - 40 edges
5. `AiGenerateService` - 40 edges
6. `BaseEntity` - 39 edges
7. `UserRole` - 39 edges
8. `CurrentUser` - 33 edges
9. `UsersService` - 31 edges
10. `ModuleConcept` - 30 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `PlacementLike` --references--> `RoadmapReviewStatus`  [EXTRACTED]
  backend/src/modules/content/utils/visibility.util.ts → backend/src/common/enums/roadmap-review-status.enum.ts
- `Assignment` --references--> `Concept`  [EXTRACTED]
  backend/src/modules/assignments/entities/assignment.entity.ts → backend/src/modules/content/entities/concept.entity.ts
- `McqQuestion` --references--> `Concept`  [EXTRACTED]
  backend/src/modules/quiz/entities/mcq-question.entity.ts → backend/src/modules/content/entities/concept.entity.ts
- `ModuleConcept` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/content/entities/module-concept.entity.ts → backend/src/common/entities/base.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (195 total, 105 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.10
Nodes (9): AuthService, Injectable, InjectRepository, JwtPayload, JwtStrategy, Injectable, Injectable, InjectRepository (+1 more)

### Community 1 - "Concept"
Cohesion: 0.09
Nodes (31): ProgressStatus, Concept, Column, Entity, JoinColumn, ManyToOne, ModuleConcept, Column (+23 more)

### Community 2 - "useTheme"
Cohesion: 0.09
Nodes (29): CallbackHandler(), emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, LoginPage(), LoginStage (+21 more)

### Community 3 - "analytics.service.ts"
Cohesion: 0.12
Nodes (20): AnalyticsModule, Module, AnalyticsService, ConceptAnalytics, DeveloperAnalytics, OverviewAnalytics, RoadmapAnalytics, Injectable (+12 more)

### Community 4 - "ConceptsService"
Cohesion: 0.09
Nodes (22): boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags (+14 more)

### Community 5 - "ReviewService"
Cohesion: 0.12
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 6 - "ai-generate.service.ts"
Cohesion: 0.18
Nodes (16): AiGenerationType, AiQuotaStatus, AiQuotaTier, ParsedMcqOption, ParsedMcqQuestion, ResolvedAiCredentials, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt() (+8 more)

### Community 7 - "UsersController"
Cohesion: 0.16
Nodes (15): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser, Delete (+7 more)

### Community 8 - "User"
Cohesion: 0.17
Nodes (18): NotificationType, UserRole, Roles(), ROLES_KEY, RolesGuard, Injectable, DeveloperConceptAnalytics, DeveloperOverviewAnalytics (+10 more)

### Community 9 - "AiKeysService"
Cohesion: 0.14
Nodes (18): AiKeysController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+10 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "commands.ts"
Cohesion: 0.05
Nodes (61): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), avatar(), bootFetch(), BootLine, bootLines() (+53 more)

### Community 12 - "Added"
Cohesion: 0.13
Nodes (14): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changed, Changelog, Developer experience (+6 more)

### Community 13 - "typeorm.config.ts"
Cohesion: 0.08
Nodes (35): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, McqAttempt, Column, Entity (+27 more)

### Community 14 - "index.ts"
Cohesion: 0.17
Nodes (11): BANNER, BannerLine, BannerTone, DEFAULT_THEME_ID, TERMINAL, ThemeDefinition, THEMES, DARK (+3 more)

### Community 15 - "roadmaps.service.ts"
Cohesion: 0.16
Nodes (21): ConceptReviewStatus, RoadmapReviewStatus, RoadmapUnpublishStatus, makeConcept(), makeUser(), createMockQueryBuilder(), createMockRepository(), MockRepository (+13 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "qa.service.ts"
Cohesion: 0.08
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsOptional, IsString (+23 more)

### Community 19 - "users.service.ts"
Cohesion: 0.13
Nodes (16): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength, GetUsersQueryDto, ApiPropertyOptional, IsOptional (+8 more)

### Community 20 - "learning-commands.ts"
Cohesion: 0.05
Nodes (58): ConceptProgressInfo, ModuleConceptItem, RoadmapDetailData, RoadmapModuleItem, RoadmapProgressData, allThreads(), askerIdOf(), askerOf() (+50 more)

### Community 22 - "api-client.ts"
Cohesion: 0.07
Nodes (41): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+33 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.17
Nodes (9): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Roles (+1 more)

### Community 25 - "commands.test.mjs"
Cohesion: 0.16
Nodes (9): attemptOrFail(), catalogOrFail(), CATALOGUE, commands, __dirname, EXTERNAL, fail(), { installGlyphs } (+1 more)

### Community 26 - "auth.ts"
Cohesion: 0.09
Nodes (35): ADMIN_NAV_ITEMS, AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, FullUser, INSTRUCTOR_NAV_ITEMS (+27 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "app.module.ts"
Cohesion: 0.08
Nodes (31): AppModule, Module, typeOrmAsyncConfig, AiGenerateModule, Module, AiGenerationLog, Column, Entity (+23 more)

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
Cohesion: 0.09
Nodes (36): CommandCtx, CommandSpec, cat, cd, contentOf(), FS_COMMANDS, history, isDirectory() (+28 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "1. Roles (§1)"
Cohesion: 0.14
Nodes (14): 1.10 Reject-roadmap and unpublish, 1.11 Draft/live split on published concepts (§3.8), 1.12 Detach blocked on published, delete-concept guard (§3.8), 1.13 Unpublish request flow + scheduled deletion (§3.8), 1.1 Profile has no instructor baggage, 1.2 Old instructor endpoints are gone (all as `ADMIN`), 1.3 Admin user list — role filter only, 1.4 Author roadmap + 3 modules + 9 concepts, attach (§2) (+6 more)

### Community 37 - "jest"
Cohesion: 0.18
Nodes (11): jest, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$ (+3 more)

### Community 38 - "auth.controller.ts"
Cohesion: 0.07
Nodes (29): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty (+21 more)

### Community 39 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 40 - "ai-keys.service.ts"
Cohesion: 0.11
Nodes (25): AiGenerationJobStatus, AiGenerationJobType, AiProvider, MAX_KEYS_PER_USER, OWN_KEY_MAX_LIMIT, OWN_KEY_MIN_LIMIT, AiProviderClients, CompletionOptions (+17 more)

### Community 41 - "RoadmapsController"
Cohesion: 0.20
Nodes (17): RoadmapsController, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags, Body, Controller (+9 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "output.ts"
Cohesion: 0.16
Nodes (20): closeConcept(), clearLearningCache(), clearHistory(), CommandHelp, FetchReport, FetchRow, HelpRow, history (+12 more)

### Community 45 - "CurrentUser"
Cohesion: 0.24
Nodes (13): CurrentUser, QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+5 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.12
Nodes (24): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+16 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 48 - "DeveloperAnalyticsController"
Cohesion: 0.15
Nodes (13): DeveloperAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+5 more)

### Community 49 - "roadmaps.controller.ts"
Cohesion: 0.06
Nodes (32): AddModulePrerequisiteDto, ApiProperty, IsUUID, AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional (+24 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "location.ts"
Cohesion: 0.11
Nodes (30): UserPreferences, ADMIN_TERMINAL_ROUTE, basename(), ChildKind, deserializeLocation(), fromCliParam(), fromSegments(), guiFallback() (+22 more)

### Community 52 - "fs-commands.test.mjs"
Cohesion: 0.09
Nodes (20): BY_NAME, CONCEPTS, DETAIL, __dirname, failOnce, FS, GLYPHS, L (+12 more)

### Community 53 - "use-terminal-session.ts"
Cohesion: 0.07
Nodes (39): openingCommand(), StudentTerminalPage(), useTerminalLogout(), CodeBlock(), Console(), DOC_HEADINGS, FetchBlock(), HIGHLIGHT_KEYWORDS (+31 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "RoadmapsService"
Cohesion: 0.11
Nodes (4): InjectRepository, RoadmapsService, Injectable, InjectRepository

### Community 68 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 70 - "GamificationController"
Cohesion: 0.23
Nodes (8): GamificationController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Query

### Community 71 - "source:dev — Master Plan"
Cohesion: 0.10
Nodes (19): 0. Vision, 10. Updated build order (revised 2026-09-21 — backend-first, frontend-last), 11. Decision log (memory for future sessions/agents), 12. QA discussion model (revised 2026-09-21, supersedes §1 author-only draft), 1. Roles — collapsed from three to two, 2. Content ownership & reuse, 3. Publishing / review workflow, 4. Content labeling (AI-generated vs hand-written vs partial) (+11 more)

### Community 72 - "ai-jobs-provider.tsx"
Cohesion: 0.13
Nodes (21): RoadmapManagementPage(), AiJobResultModal(), AiJobResultModalProps, JOB_TYPE_NOUN, AiJobResultsBanner(), jobSummaryLine(), jobVisual(), AiJobsIndicator() (+13 more)

### Community 73 - "auth.module.ts"
Cohesion: 0.09
Nodes (17): IS_PUBLIC_KEY, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne, JwtAuthGuard (+9 more)

### Community 74 - "ProgressController"
Cohesion: 0.23
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "AiProviderKey"
Cohesion: 0.11
Nodes (9): AiKeyCryptoService, Injectable, InjectRepository, AiProviderKey, Column, Entity, Index, JoinColumn (+1 more)

### Community 82 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, !**/*.spec.ts, **/*.(t|j)s

### Community 83 - "check-theme-separation.mjs"
Cohesion: 0.25
Nodes (5): __dirname, GUARDED, ROOT, RULES, violations

### Community 84 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

### Community 85 - "CreateAiKeyDto"
Cohesion: 0.23
Nodes (12): CreateAiKeyDto, LookupModelsDto, ApiProperty, ApiPropertyOptional, IsEnum, IsOptional, IsString, UpdateAiKeyDto (+4 more)

### Community 87 - "AdminContentReviewController"
Cohesion: 0.16
Nodes (14): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+6 more)

### Community 88 - "origin-label.util.ts"
Cohesion: 0.28
Nodes (7): conceptOriginLabel(), LeafOriginLabel, parseOriginLabel(), rollupOriginLabel(), VALID_LABELS, canSeeConcept(), canSeeRoadmap()

### Community 89 - "CreateConceptDto"
Cohesion: 0.29
Nodes (7): CreateConceptDto, ApiProperty, ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString

### Community 90 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 92 - "NotificationsService"
Cohesion: 0.07
Nodes (33): ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags, InjectRepository, ArticlesController, ArticlesService (+25 more)

### Community 96 - "quiz.controller.ts"
Cohesion: 0.13
Nodes (14): SubmitAttemptDto, ApiProperty, IsUUID, IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto (+6 more)

### Community 98 - "GetActivityQueryDto"
Cohesion: 0.25
Nodes (7): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, Max

### Community 117 - "factories.ts"
Cohesion: 0.08
Nodes (42): ConceptDifficulty, XpSource, FIXED_DATE, makeAttempt(), makeBadge(), makeOption(), makeProgress(), makeQuestion() (+34 more)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 136 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 143 - "RegisterDto"
Cohesion: 0.09
Nodes (23): IsIanaTimezone(), RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional, IsString (+15 more)

### Community 144 - "2. QA discussion (§12)"
Cohesion: 0.18
Nodes (11): 2.10 Answer edit/delete by author, 2.1 Post a public discussion question (as B), 2.2 Ask AI — private answer (as B), 2.3 Old target value rejected, 2.4 Discussion list — AI privacy per viewer, 2.5 Any developer can answer — author/admin auto-verified (as A answers B's question), 2.6 Verify — for other developers' answers, 2.7 AI answers cannot be verified (+3 more)

### Community 145 - "todayIn"
Cohesion: 0.58
Nodes (5): addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn()

### Community 146 - "ai-generate.controller.ts"
Cohesion: 0.11
Nodes (37): ApiProperty, ApiPropertyOptional, AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body (+29 more)

### Community 154 - "7. Notifications (§7) — needs migration run"
Cohesion: 0.40
Nodes (5): 7.1 Bell badge + list + filter, 7.2 Author decisions carry reasons, 7.3 Read state, 7.4 Moderation + AI jobs, 7. Notifications (§7) — needs migration run

### Community 181 - "8. Articles (§6) — needs migration run"
Cohesion: 0.50
Nodes (4): 8.1 Public reads, no login (drop the token and try), 8.2 Immediate publish + edit by author, 8.3 Deletion paths, 8. Articles (§6) — needs migration run

### Community 182 - "6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run"
Cohesion: 0.25
Nodes (8): 6.1 Store keys (max 2, first auto-default), 6.2 Default + cap, 6.2b Model dropdown flow (pre-save lookup + per-key default), 6.3 Providers + live models, 6.4 Free tier is 5/day, own key uses its bucket, 6.5 gemini without a key is rejected, 6.6 In-use deletion lock, 6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run

### Community 189 - "0. Setup — three users"
Cohesion: 0.50
Nodes (4): 0.1 Register developer A (future content author), 0.2 Register developer B (other developer), 0.3 Promote yourself to admin (no seed exists — do it in SQL), 0. Setup — three users

### Community 190 - "3. Analytics (retargeted, §1)"
Cohesion: 0.50
Nodes (4): 3.1 Admin overview — developer counts, 3.2 Admin per-developer table (renamed route), 3.3 Developer my-analytics (renamed route, no approval check), 3. Analytics (retargeted, §1)

### Community 198 - "Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing"
Cohesion: 0.29
Nodes (6): 4.1 Labels on reads, 4.2 Reader filters, 4. AI-generate guard (§1), 5.1 Developer can check quota, 5. AI-generate guard (§1), Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing

## Knowledge Gaps
- **487 isolated node(s):** `entities`, `dataSourceOptions`, `0.1 Register developer A (future content author)`, `0.2 Register developer B (other developer)`, `0.3 Promote yourself to admin (no seed exists — do it in SQL)` (+482 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **105 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `Concept`, `analytics.service.ts`, `ReviewService`, `ai-generate.service.ts`, `UsersController`, `assignments.module.ts`, `typeorm.config.ts`, `roadmaps.service.ts`, `AuthController`, `ai-generate.controller.ts`, `qa.service.ts`, `users.service.ts`, `auth.controller.ts`, `ai-keys.service.ts`, `CurrentUser`, `DeveloperAnalyticsController`, `roadmaps.controller.ts`, `GamificationController`, `auth.module.ts`, `ProgressController`, `quiz.controller.ts`, `QuizService`, `factories.ts`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `RoadmapsService` connect `RoadmapsService` to `Concept`, `ai-generate.service.ts`, `User`, `roadmaps.service.ts`, `roadmaps.controller.ts`, `AdminContentReviewController`, `origin-label.util.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `AiGenerateService` connect `AiGenerateService` to `RoadmapsService`, `ai-generate.service.ts`, `NotificationsService`, `roadmaps.service.ts`, `ai-generate.controller.ts`, `qa.service.ts`, `app.module.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `entities`, `dataSourceOptions`, `0.1 Register developer A (future content author)` to the rest of the system?**
  _487 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.09879032258064516 - nodes in this community are weakly interconnected._
- **Should `Concept` be split into smaller, more focused modules?**
  _Cohesion score 0.08880666049953746 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.08780487804878048 - nodes in this community are weakly interconnected._