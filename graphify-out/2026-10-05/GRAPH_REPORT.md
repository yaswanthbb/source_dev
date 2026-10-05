# Graph Report - knowledge_is_power  (2026-10-05)

## Corpus Check
- 302 files · ~270,207 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2508 nodes · 5692 edges · 224 communities (118 shown, 106 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 157 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8d31a950`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AuthService
- ai-generate.module.ts
- api-client.ts
- Concept
- ConceptsService
- review.controller.ts
- useTheme
- UsersService
- user.entity.ts
- AiKeysController
- assignments.module.ts
- commands.ts
- Added
- McqQuestion
- index.ts
- roadmaps.service.ts
- compilerOptions
- AuthController
- qa.service.ts
- User
- learning-commands.ts
- class-transformer
- useSnackbar
- compilerOptions
- AnalyticsController
- commands.test.mjs
- auth.ts
- dependencies
- app.module.ts
- RejectConceptDto
- ai-generating-modal.tsx
- scripts
- devDependencies
- theme-provider.tsx
- fs-commands.ts
- dependencies
- 1. Roles (§1)
- jest
- auth.controller.ts
- AppController
- ai-keys.service.ts
- RoadmapsService
- Next.js Frontend Application
- frontend/package.json
- output.ts
- QuizService
- developer/dashboard/page.tsx
- exclude
- DeveloperAnalyticsController
- AttachConceptDto
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
- admin-commands.ts
- minimal-terminal-loader.tsx
- ApiBearerAuth
- GetActivityQueryDto
- source:dev — Master Plan
- ai-jobs-provider.tsx
- OAuthProfile
- ProgressController
- backend/package.json
- next.config.ts
- AiGenerateService
- devDependencies
- AddOAuthColumns1787300000000
- tailwind.config.ts
- AiKeysService
- collectCoverageFrom
- check-theme-separation.mjs
- CreateOptionDto
- CreateAiKeyDto
- @nestjs/passport
- terminal-workspace.tsx
- factories.ts
- CreateConceptDto
- location.test.mjs
- AddUserPreferences1787800000000
- notifications.service.ts
- axios
- RoleCollapseToDeveloper1787900000000
- QaDiscussionModel1787910000000
- quiz.controller.ts
- @nestjs/swagger
- admin-complete.ts
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
- ai-provider-clients.ts
- @nestjs/cli
- @nestjs/schematics
- Application Logo
- @nestjs/testing
- typeorm.config.ts
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
- UpdateOwnProfileDto
- 2. QA discussion (§12)
- ai-generate.service.ts
- AiGenerateController
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
- PasswordResetOtp
- ReviewService
- authoring.test.mjs
- askQuestion
- Notifications1787960000000
- AiByokKeys1787940000000
- 0. Setup — three users
- Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing
- AiKeyDefaultModel1787950000000
- qa-discussion.test.mjs
- IsArray
- IsNotEmpty
- PublishingWorkflow1787920000000
- PublishedEditModel1787930000000
- IsUUID
- 4. AI-generate guard (§1)
- Module
- admin-commands.test.mjs
- submission.entity.ts
- ConceptDifficulty
- AiKeyCryptoService
- SubmissionsService
- User
- printThread
- RegisterDto
- forgot-password/page.tsx
- showConcept
- ResetPasswordDto
- UpdateModuleDto
- CreateModuleDto
- RequestDeletionDto
- CreateRoadmapDto
- UpdateRoadmapDto
- GetUsersQueryDto
- AddModulePrerequisiteDto
- UpdateModuleConceptDto
- [id]/page.tsx
- app/articles/page.tsx
- cwdRoadmapId
- content-diff.ts
- ConceptDetail

## God Nodes (most connected - your core abstractions)
1. `User` - 143 edges
2. `Concept` - 57 edges
3. `RoadmapsService` - 43 edges
4. `useTheme()` - 41 edges
5. `McqQuestion` - 40 edges
6. `AiGenerateService` - 40 edges
7. `BaseEntity` - 39 edges
8. `UserRole` - 39 edges
9. `CurrentUser` - 33 edges
10. `UsersService` - 31 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `LoginPage()` --calls--> `useTheme()`  [EXTRACTED]
  frontend/app/(auth)/login/page.tsx → frontend/providers/theme-provider.tsx
- `RegisterPage()` --calls--> `useTheme()`  [EXTRACTED]
  frontend/app/(auth)/register/page.tsx → frontend/providers/theme-provider.tsx
- `AdminContentReviewPage()` --calls--> `useTheme()`  [EXTRACTED]
  frontend/app/admin/content-review/page.tsx → frontend/providers/theme-provider.tsx
- `AdminDashboardPage()` --calls--> `useTerminalMotion()`  [EXTRACTED]
  frontend/app/admin/dashboard/page.tsx → frontend/app/developer/dashboard/terminal-motion.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (224 total, 106 thin omitted)

### Community 1 - "ai-generate.module.ts"
Cohesion: 0.08
Nodes (34): AiGenerateModule, Module, ContentModule, Module, ModuleConcept, Column, Entity, JoinColumn (+26 more)

### Community 2 - "api-client.ts"
Cohesion: 0.12
Nodes (23): CallbackHandler(), LoginPage(), LoginStage, RegisterPage(), RegisterStage, AiQuotaBadgeProps, CenteredTerminalLoader(), CenteredTerminalLoaderProps (+15 more)

### Community 3 - "Concept"
Cohesion: 0.13
Nodes (28): ProgressStatus, AnalyticsService, Injectable, InjectRepository, Concept, Column, Entity, JoinColumn (+20 more)

### Community 4 - "ConceptsService"
Cohesion: 0.09
Nodes (22): boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags (+14 more)

### Community 5 - "review.controller.ts"
Cohesion: 0.14
Nodes (14): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+6 more)

### Community 6 - "useTheme"
Cohesion: 0.11
Nodes (26): ArticleDetail, DEV_ROUTES, EditArticlePage(), ConceptDetail, DEV_ROUTES, DIFFICULTIES, EditConceptPage(), DEV_ROUTES (+18 more)

### Community 7 - "UsersService"
Cohesion: 0.12
Nodes (17): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser, Delete (+9 more)

### Community 8 - "user.entity.ts"
Cohesion: 0.23
Nodes (10): UserRole, CurrentUser, IS_PUBLIC_KEY, Roles(), ROLES_KEY, JwtAuthGuard, Injectable, RolesGuard (+2 more)

### Community 9 - "AiKeysController"
Cohesion: 0.17
Nodes (15): AiKeysController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+7 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.20
Nodes (10): AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment, Column, Entity (+2 more)

### Community 11 - "commands.ts"
Cohesion: 0.05
Nodes (60): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), avatar(), BellItem, BootLine, bootLines() (+52 more)

### Community 12 - "Added"
Cohesion: 0.13
Nodes (14): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changed, Changelog, Developer experience (+6 more)

### Community 13 - "McqQuestion"
Cohesion: 0.10
Nodes (28): BaseEntity, CreateDateColumn, UpdateDateColumn, McqAttempt, Column, Entity, JoinColumn, ManyToOne (+20 more)

### Community 14 - "index.ts"
Cohesion: 0.17
Nodes (11): BANNER, BannerLine, BannerTone, DEFAULT_THEME_ID, TERMINAL, ThemeDefinition, THEMES, DARK (+3 more)

### Community 15 - "roadmaps.service.ts"
Cohesion: 0.18
Nodes (15): ConceptReviewStatus, RoadmapReviewStatus, RoadmapUnpublishStatus, slugify(), conceptOriginLabel(), LeafOriginLabel, parseOriginLabel(), rollupOriginLabel() (+7 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.22
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "qa.service.ts"
Cohesion: 0.08
Nodes (31): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsOptional, IsString (+23 more)

### Community 19 - "User"
Cohesion: 0.08
Nodes (23): JwtPayload, JwtStrategy, Injectable, DeveloperAnalyticsService, Injectable, InjectRepository, ChangePasswordDto, ApiProperty (+15 more)

### Community 20 - "learning-commands.ts"
Cohesion: 0.05
Nodes (36): article, articles, ArticleSummary, attach, AttemptResult, AUTHOR_COMMANDS, complete, conceptNew (+28 more)

### Community 22 - "useSnackbar"
Cohesion: 0.09
Nodes (26): AdminContentReviewPage(), McqQuestion, PendingConcept, Placement, ReviewModule, ReviewStatus, RoadmapRow, AdminUsersDirectoryPage() (+18 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.13
Nodes (13): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Roles (+5 more)

### Community 25 - "commands.test.mjs"
Cohesion: 0.16
Nodes (9): attemptOrFail(), catalogOrFail(), CATALOGUE, commands, __dirname, EXTERNAL, fail(), { installGlyphs } (+1 more)

### Community 26 - "auth.ts"
Cohesion: 0.12
Nodes (23): ADMIN_NAV_ITEMS, AdminAppShellLayout(), DeveloperAppShellLayout(), RootPage(), BasicInfoFormData, basicInfoSchema, ChangePasswordFormData, changePasswordSchema (+15 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "app.module.ts"
Cohesion: 0.13
Nodes (14): AppModule, Module, typeOrmAsyncConfig, AnalyticsModule, Module, ArticlesModule, Module, AssignmentsModule (+6 more)

### Community 29 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 30 - "ai-generating-modal.tsx"
Cohesion: 0.33
Nodes (4): AiGeneratingModalProps, AiGenerationContextType, CONTEXT_MESSAGES, CONTEXT_TITLES

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "theme-provider.tsx"
Cohesion: 0.15
Nodes (11): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), Theme (+3 more)

### Community 34 - "fs-commands.ts"
Cohesion: 0.08
Nodes (39): cat, cd, closeConcept(), contentOf(), FS_COMMANDS, history, isDirectory(), less (+31 more)

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
Cohesion: 0.09
Nodes (22): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty (+14 more)

### Community 39 - "AppController"
Cohesion: 0.23
Nodes (7): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 40 - "ai-keys.service.ts"
Cohesion: 0.16
Nodes (15): AiGenerationJobStatus, AiGenerationJobType, AiProvider, MAX_KEYS_PER_USER, OWN_KEY_MAX_LIMIT, OWN_KEY_MIN_LIMIT, ProviderMeta, AiGenerationJob (+7 more)

### Community 41 - "RoadmapsService"
Cohesion: 0.06
Nodes (35): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+27 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "output.ts"
Cohesion: 0.26
Nodes (11): CommandHelp, FetchReport, FetchRow, HelpRow, history, LineKind, LineSegment, Sink (+3 more)

### Community 45 - "QuizService"
Cohesion: 0.14
Nodes (14): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+6 more)

### Community 46 - "developer/dashboard/page.tsx"
Cohesion: 0.09
Nodes (26): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), DeveloperDashboardPage(), EarnedBadgeItem, GamificationData, MONTHS (+18 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 48 - "DeveloperAnalyticsController"
Cohesion: 0.19
Nodes (13): DeveloperAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+5 more)

### Community 49 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "location.ts"
Cohesion: 0.11
Nodes (32): UserPreferences, CommandCtx, ADMIN_TERMINAL_ROUTE, basename(), ChildKind, deserializeLocation(), formatPath(), fromCliParam() (+24 more)

### Community 52 - "fs-commands.test.mjs"
Cohesion: 0.09
Nodes (20): BY_NAME, CONCEPTS, DETAIL, __dirname, failOnce, FS, GLYPHS, L (+12 more)

### Community 53 - "use-terminal-session.ts"
Cohesion: 0.12
Nodes (26): Console(), chunkEnd(), pageRows(), PagerState, PendingQuestion, PendingSelect, sleep(), SuggestRow (+18 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "admin-commands.ts"
Cohesion: 0.06
Nodes (32): analytics, article, ArticleItem, articles, dashboard, deletion, DeletionRequest, deletions (+24 more)

### Community 68 - "minimal-terminal-loader.tsx"
Cohesion: 0.23
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 70 - "GetActivityQueryDto"
Cohesion: 0.13
Nodes (14): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+6 more)

### Community 71 - "source:dev — Master Plan"
Cohesion: 0.10
Nodes (19): 0. Vision, 10. Updated build order (revised 2026-09-21 — backend-first, frontend-last), 11. Decision log (memory for future sessions/agents), 12. QA discussion model (revised 2026-09-21, supersedes §1 author-only draft), 1. Roles — collapsed from three to two, 2. Content ownership & reuse, 3. Publishing / review workflow, 4. Content labeling (AI-generated vs hand-written vs partial) (+11 more)

### Community 72 - "ai-jobs-provider.tsx"
Cohesion: 0.14
Nodes (20): AiJobResultModal(), AiJobResultModalProps, JOB_TYPE_NOUN, AiJobResultsBanner(), jobSummaryLine(), jobVisual(), AiJobsIndicator(), JOB_TYPE_LABELS (+12 more)

### Community 73 - "OAuthProfile"
Cohesion: 0.20
Nodes (5): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable

### Community 74 - "ProgressController"
Cohesion: 0.19
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 77 - "AiGenerateService"
Cohesion: 0.11
Nodes (13): AiGenerateService, Injectable, InjectRepository, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), buildModuleConceptsUserPrompt(), buildQaAnswerUserPrompt(), buildRoadmapModulesUserPrompt() (+5 more)

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "AiKeysService"
Cohesion: 0.18
Nodes (9): AiKeysService, Injectable, AiKeyMetadata, AiProviderKey, Column, Entity, Index, JoinColumn (+1 more)

### Community 82 - "collectCoverageFrom"
Cohesion: 0.25
Nodes (8): collectCoverageFrom, !common/testing/**, !config/**, !main.ts, !migrations/**, !**/*.module.ts, !**/*.spec.ts, **/*.(t|j)s

### Community 83 - "check-theme-separation.mjs"
Cohesion: 0.25
Nodes (5): __dirname, GUARDED, ROOT, RULES, violations

### Community 84 - "CreateOptionDto"
Cohesion: 0.25
Nodes (7): CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min

### Community 85 - "CreateAiKeyDto"
Cohesion: 0.21
Nodes (13): CreateAiKeyDto, LookupModelsDto, ApiProperty, ApiPropertyOptional, IsEnum, IsOptional, IsString, UpdateAiKeyDto (+5 more)

### Community 87 - "terminal-workspace.tsx"
Cohesion: 0.10
Nodes (19): AdminTerminalPage(), openingCommand(), DeveloperTerminalPage(), openingCommand(), CodeBlock(), DOC_HEADINGS, FetchBlock(), HIGHLIGHT_KEYWORDS (+11 more)

### Community 88 - "factories.ts"
Cohesion: 0.20
Nodes (17): FIXED_DATE, makeAttempt(), makeBadge(), makeConcept(), makeOption(), makeProgress(), makeQuestion(), makeReviewItem() (+9 more)

### Community 89 - "CreateConceptDto"
Cohesion: 0.29
Nodes (7): CreateConceptDto, ApiProperty, ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString

### Community 90 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 92 - "notifications.service.ts"
Cohesion: 0.07
Nodes (37): ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags, NotificationType, ArticlesController, ArticlesService (+29 more)

### Community 96 - "quiz.controller.ts"
Cohesion: 0.08
Nodes (24): ArrayMinSize, CreateQuestionDto, ApiProperty, IsArray, IsInt, IsNotEmpty, IsString, Min (+16 more)

### Community 98 - "admin-complete.ts"
Cohesion: 0.13
Nodes (12): ArticleRef, completeAdminValues(), ID_COMMANDS, JobRef, KeyRef, matchWhole(), PendingConcept, quoteValue() (+4 more)

### Community 112 - "ai-provider-clients.ts"
Cohesion: 0.21
Nodes (10): AiProviderClients, CompletionOptions, CURATED_MODELS, curatedModelsFor(), defaultModelFor(), invalidKeyError(), isAuthFailure(), PROVIDER_METAS (+2 more)

### Community 117 - "typeorm.config.ts"
Cohesion: 0.10
Nodes (28): XpSource, dataSourceOptions, entities, Badge, Column, Entity, Streak, Column (+20 more)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 136 - "admin/dashboard/page.tsx"
Cohesion: 0.22
Nodes (10): ADMIN_ROUTES, AdminDashboardPage(), ConceptAnalytics, DeveloperAnalytics, fmtDay(), NotificationItem, OverviewAnalytics, pad() (+2 more)

### Community 143 - "UpdateOwnProfileDto"
Cohesion: 0.13
Nodes (15): IsIanaTimezone(), ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, Type, ValidateNested, UpdateOwnProfileDto (+7 more)

### Community 144 - "2. QA discussion (§12)"
Cohesion: 0.18
Nodes (11): 2.10 Answer edit/delete by author, 2.1 Post a public discussion question (as B), 2.2 Ask AI — private answer (as B), 2.3 Old target value rejected, 2.4 Discussion list — AI privacy per viewer, 2.5 Any developer can answer — author/admin auto-verified (as A answers B's question), 2.6 Verify — for other developers' answers, 2.7 AI answers cannot be verified (+3 more)

### Community 145 - "ai-generate.service.ts"
Cohesion: 0.17
Nodes (16): AiGenerationType, addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn(), AiQuotaStatus, AiQuotaTier (+8 more)

### Community 146 - "AiGenerateController"
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

### Community 183 - "PasswordResetOtp"
Cohesion: 0.13
Nodes (10): InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne, EmailModule (+2 more)

### Community 184 - "ReviewService"
Cohesion: 0.21
Nodes (5): ProgressService, Injectable, InjectRepository, ReviewService, Injectable

### Community 185 - "authoring.test.mjs"
Cohesion: 0.13
Nodes (10): calls, commands, CON, DB, __dirname, EXTERNAL, { installGlyphs }, loaded (+2 more)

### Community 186 - "askQuestion"
Cohesion: 0.18
Nodes (13): allThreads(), askerIdOf(), askQuestion(), canVerifyHere(), conceptList(), findConceptId(), locateThread(), pickDifficulty() (+5 more)

### Community 189 - "0. Setup — three users"
Cohesion: 0.50
Nodes (4): 0.1 Register developer A (future content author), 0.2 Register developer B (other developer), 0.3 Promote yourself to admin (no seed exists — do it in SQL), 0. Setup — three users

### Community 190 - "Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing"
Cohesion: 0.25
Nodes (7): 3.1 Admin overview — developer counts, 3.2 Admin per-developer table (renamed route), 3.3 Developer my-analytics (renamed route, no approval check), 3. Analytics (retargeted, §1), 5.1 Developer can check quota, 5. AI-generate guard (§1), Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing

### Community 192 - "qa-discussion.test.mjs"
Cohesion: 0.15
Nodes (8): calls, commands, DEV, __dirname, EXTERNAL, { installGlyphs }, loaded, THREAD

### Community 198 - "4. AI-generate guard (§1)"
Cohesion: 0.50
Nodes (4): 4.1 Labels on reads, 4.2 Reader filters, 4.3 Shell browsers (as `B` in `/developer/terminal`), 4. AI-generate guard (§1)

### Community 200 - "admin-commands.test.mjs"
Cohesion: 0.17
Nodes (7): admin, ADMIN_LIST, commands, __dirname, EXTERNAL, { installGlyphs }, loaded

### Community 201 - "submission.entity.ts"
Cohesion: 0.29
Nodes (7): AiConfidence, SubmissionStatus, Submission, Column, Entity, JoinColumn, ManyToOne

### Community 202 - "ConceptDifficulty"
Cohesion: 0.27
Nodes (7): ConceptDifficulty, ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString, UpdateConceptDto

### Community 203 - "AiKeyCryptoService"
Cohesion: 0.22
Nodes (3): AiKeyCryptoService, Injectable, InjectRepository

### Community 204 - "SubmissionsService"
Cohesion: 0.28
Nodes (5): SubmissionsController, Controller, SubmissionsService, Injectable, InjectRepository

### Community 205 - "User"
Cohesion: 0.28
Nodes (6): ProfileActionsMenu(), ProfileActionsMenuProps, DeletionRequestInfo, RequestDeletionModal(), RequestDeletionModalProps, User

### Community 206 - "printThread"
Cohesion: 0.25
Nodes (9): askerOf(), body(), detail(), entry(), heading(), plural(), printThread(), renderThread() (+1 more)

### Community 207 - "RegisterDto"
Cohesion: 0.25
Nodes (8): RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength

### Community 208 - "forgot-password/page.tsx"
Cohesion: 0.29
Nodes (5): emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep

### Community 209 - "showConcept"
Cohesion: 0.25
Nodes (8): clearLearningCache(), nextConcept(), progressFor(), rememberSections(), sectionsOf(), showConcept(), unlocked(), setCurrentConcept()

### Community 210 - "ResetPasswordDto"
Cohesion: 0.29
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 211 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 212 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 213 - "RequestDeletionDto"
Cohesion: 0.33
Nodes (5): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength

### Community 214 - "CreateRoadmapDto"
Cohesion: 0.40
Nodes (4): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString

### Community 215 - "UpdateRoadmapDto"
Cohesion: 0.40
Nodes (4): IsNotEmpty, IsOptional, IsString, UpdateRoadmapDto

### Community 216 - "GetUsersQueryDto"
Cohesion: 0.40
Nodes (5): GetUsersQueryDto, ApiPropertyOptional, IsOptional, IsString, IsEnum

### Community 217 - "AddModulePrerequisiteDto"
Cohesion: 0.50
Nodes (3): AddModulePrerequisiteDto, ApiProperty, IsUUID

### Community 218 - "UpdateModuleConceptDto"
Cohesion: 0.50
Nodes (3): IsInt, Min, UpdateModuleConceptDto

### Community 219 - "[id]/page.tsx"
Cohesion: 0.67
Nodes (3): ArticleDetail, getArticle(), PublicArticlePage()

### Community 220 - "app/articles/page.tsx"
Cohesion: 0.67
Nodes (3): ArticleRow, getArticles(), PublicArticlesPage()

### Community 221 - "cwdRoadmapId"
Cohesion: 0.50
Nodes (4): catalog(), cwdModuleId(), cwdRoadmapId(), findRoadmap()

## Knowledge Gaps
- **567 isolated node(s):** `0.1 Register developer A (future content author)`, `0.2 Register developer B (other developer)`, `0.3 Promote yourself to admin (no seed exists — do it in SQL)`, `1.1 Profile has no instructor baggage`, `1.2 Old instructor endpoints are gone (all as `ADMIN`)` (+562 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **106 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `AuthService`, `ai-generate.module.ts`, `Concept`, `review.controller.ts`, `UsersService`, `user.entity.ts`, `assignments.module.ts`, `McqQuestion`, `roadmaps.service.ts`, `ai-generate.service.ts`, `AuthController`, `qa.service.ts`, `auth.controller.ts`, `ai-keys.service.ts`, `QuizService`, `DeveloperAnalyticsController`, `PasswordResetOtp`, `GetActivityQueryDto`, `submission.entity.ts`, `ProgressController`, `factories.ts`, `notifications.service.ts`, `quiz.controller.ts`, `typeorm.config.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `ai-generate.module.ts`, `ConceptsService`, `user.entity.ts`, `assignments.module.ts`, `McqQuestion`, `roadmaps.service.ts`, `ai-generate.service.ts`, `qa.service.ts`, `typeorm.config.ts`, `factories.ts`, `ReviewService`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `RoadmapsController` connect `RoadmapsService` to `user.entity.ts`, `ai-generate.module.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `0.1 Register developer A (future content author)`, `0.2 Register developer B (other developer)`, `0.3 Promote yourself to admin (no seed exists — do it in SQL)` to the rest of the system?**
  _567 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai-generate.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08048780487804878 - nodes in this community are weakly interconnected._
- **Should `api-client.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12096774193548387 - nodes in this community are weakly interconnected._
- **Should `Concept` be split into smaller, more focused modules?**
  _Cohesion score 0.12727272727272726 - nodes in this community are weakly interconnected._