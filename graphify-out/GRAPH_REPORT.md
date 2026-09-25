# Graph Report - knowledge_is_power  (2026-09-25)

## Corpus Check
- 291 files · ~266,042 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2345 nodes · 5331 edges · 200 communities (93 shown, 107 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 149 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `577b2e84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AuthService
- Concept
- centered-terminal-loader.tsx
- typeorm.config.ts
- ConceptsService
- ReviewService
- prompts.ts
- UsersService
- User
- AiKeysService
- assignments.module.ts
- commands.ts
- Added
- McqQuestion
- terminal-workspace.tsx
- analytics.service.spec.ts
- compilerOptions
- AuthController
- QaService
- ChangePasswordDto
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
- ai-generate.service.ts
- RoadmapsService
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
- instructor/layout.tsx
- minimal-terminal-loader.tsx
- ApiBearerAuth
- GetActivityQueryDto
- source:dev — Master Plan
- [roadmapId]/page.tsx
- OAuthProfile
- ProgressService
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
- auth.service.ts
- useTheme
- CreateConceptDto
- location.test.mjs
- AddUserPreferences1787800000000
- notifications.service.ts
- axios
- RoleCollapseToDeveloper1787900000000
- QaDiscussionModel1787910000000
- quiz.controller.ts
- @nestjs/swagger
- Assignment
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
- UpdateOwnProfileDto
- 2. QA discussion (§12)
- .checkRateLimit
- ai-generate.controller.ts
- @nestjs/typeorm
- nodemailer
- ApiPropertyOptional
- IsOptional
- AGENTS.md
- AddAiGenerationJobs1787600000000
- IsString
- Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing
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
- PasswordResetOtp
- 6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run
- Delete
- VerifyOtpDto
- InjectRepository
- AppModule
- Notifications1787960000000
- AiByokKeys1787940000000
- 0. Setup — three users
- 3. Analytics (retargeted, §1)
- AiKeyDefaultModel1787950000000
- UpdateConceptDto
- IsArray
- IsNotEmpty
- PublishingWorkflow1787920000000
- PublishedEditModel1787930000000
- IsUUID
- 4. AI-generate guard (§1)
- Module

## God Nodes (most connected - your core abstractions)
1. `User` - 140 edges
2. `Concept` - 53 edges
3. `RoadmapsService` - 43 edges
4. `AiGenerateService` - 40 edges
5. `McqQuestion` - 40 edges
6. `BaseEntity` - 38 edges
7. `UserRole` - 36 edges
8. `CurrentUser` - 32 edges
9. `UsersService` - 31 edges
10. `ModuleConcept` - 30 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `ModuleConcept` --inherits--> `BaseEntity`  [EXTRACTED]
  backend/src/modules/content/entities/module-concept.entity.ts → backend/src/common/entities/base.entity.ts
- `ModuleConcept` --references--> `Module`  [EXTRACTED]
  backend/src/modules/content/entities/module-concept.entity.ts → backend/src/modules/content/entities/module.entity.ts
- `Module` --references--> `Roadmap`  [EXTRACTED]
  backend/src/modules/content/entities/module.entity.ts → backend/src/modules/content/entities/roadmap.entity.ts
- `Module` --references--> `OriginLabel`  [EXTRACTED]
  backend/src/modules/content/entities/module.entity.ts → backend/src/modules/content/utils/origin-label.util.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (200 total, 107 thin omitted)

### Community 0 - "AuthService"
Cohesion: 0.15
Nodes (10): AuthService, Injectable, RegisterDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional (+2 more)

### Community 1 - "Concept"
Cohesion: 0.10
Nodes (39): ConceptReviewStatus, RoadmapReviewStatus, RoadmapUnpublishStatus, ContentModule, Module, Concept, Column, Entity (+31 more)

### Community 2 - "centered-terminal-loader.tsx"
Cohesion: 0.14
Nodes (21): CallbackHandler(), LoginPage(), LoginStage, RegisterPage(), RegisterStage, CenteredTerminalLoader(), CenteredTerminalLoaderProps, LogEntry (+13 more)

### Community 3 - "typeorm.config.ts"
Cohesion: 0.14
Nodes (18): dataSourceOptions, entities, AiGenerationLog, Column, Entity, JoinColumn, ManyToOne, Answer (+10 more)

### Community 4 - "ConceptsService"
Cohesion: 0.08
Nodes (23): boundedLevenshtein(), hasSignificantContentChange(), slugify(), ConceptsController, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse (+15 more)

### Community 5 - "ReviewService"
Cohesion: 0.12
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 6 - "prompts.ts"
Cohesion: 0.28
Nodes (7): buildQaAnswerUserPrompt(), buildRoadmapModulesUserPrompt(), CONCEPT_CONTENT_SYSTEM_PROMPT, CONCEPT_MCQ_SYSTEM_PROMPT, MODULE_CONCEPTS_SYSTEM_PROMPT, QA_ANSWER_SYSTEM_PROMPT, ROADMAP_MODULES_SYSTEM_PROMPT

### Community 7 - "UsersService"
Cohesion: 0.07
Nodes (26): JwtStrategy, Injectable, GetUsersQueryDto, ApiPropertyOptional, IsOptional, IsString, ApiBearerAuth, ApiOperation (+18 more)

### Community 8 - "User"
Cohesion: 0.10
Nodes (30): UserRole, Roles(), ROLES_KEY, RolesGuard, Injectable, JwtPayload, DeveloperAnalyticsService, DeveloperConceptAnalytics (+22 more)

### Community 9 - "AiKeysService"
Cohesion: 0.12
Nodes (19): AiKeysController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+11 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.16
Nodes (10): AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, SubmissionsController, Controller, SubmissionsService (+2 more)

### Community 11 - "commands.ts"
Cohesion: 0.05
Nodes (57): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), avatar(), BootLine, BootStep, catalogue() (+49 more)

### Community 12 - "Added"
Cohesion: 0.13
Nodes (14): [1.0.0] - 2026-08-27, Accounts & authentication, Added, AI-assisted authoring, Analytics, Changed, Changelog, Developer experience (+6 more)

### Community 13 - "McqQuestion"
Cohesion: 0.10
Nodes (29): BaseEntity, CreateDateColumn, UpdateDateColumn, makeAttempt(), McqAttempt, Column, Entity, JoinColumn (+21 more)

### Community 14 - "terminal-workspace.tsx"
Cohesion: 0.07
Nodes (26): openingCommand(), StudentTerminalPage(), CodeBlock(), DOC_HEADINGS, FetchBlock(), HIGHLIGHT_KEYWORDS, highlightCode(), Line() (+18 more)

### Community 15 - "analytics.service.spec.ts"
Cohesion: 0.20
Nodes (14): ProgressStatus, makeConcept(), makeUser(), createMockQueryBuilder(), createMockRepository(), MockQueryBuilder, MockRepository, NOW (+6 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.18
Nodes (13): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+5 more)

### Community 18 - "QaService"
Cohesion: 0.07
Nodes (32): ApiProperty, CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsOptional (+24 more)

### Community 19 - "ChangePasswordDto"
Cohesion: 0.40
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 20 - "learning-commands.ts"
Cohesion: 0.06
Nodes (54): allThreads(), askerIdOf(), askerOf(), askQuestion(), AttemptResult, body(), catalog(), clearLearningCache() (+46 more)

### Community 22 - "api-client.ts"
Cohesion: 0.09
Nodes (33): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+25 more)

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
Cohesion: 0.13
Nodes (23): AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, InstructorAppShellLayout(), RootPage(), StudentAppShellLayout() (+15 more)

### Community 27 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, bcrypt, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+17 more)

### Community 28 - "app.module.ts"
Cohesion: 0.08
Nodes (28): typeOrmAsyncConfig, AiGenerateModule, Module, AnalyticsModule, Module, AnalyticsService, ConceptAnalytics, DeveloperAnalytics (+20 more)

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
Nodes (39): CommandCtx, CommandSpec, cat, cd, closeConcept(), contentOf(), FS_COMMANDS, history (+31 more)

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
Cohesion: 0.14
Nodes (13): LinkOAuthDto, ApiProperty, IsIn, IsNotEmpty, IsString, LoginDto, ApiProperty, IsEmail (+5 more)

### Community 39 - "Public"
Cohesion: 0.23
Nodes (8): AppController, ApiOperation, ApiTags, Controller, Get, AppService, Injectable, Public()

### Community 40 - "ai-generate.service.ts"
Cohesion: 0.10
Nodes (30): AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, AiProvider, AiQuotaStatus, AiQuotaTier, ParsedMcqOption, ParsedMcqQuestion (+22 more)

### Community 41 - "RoadmapsService"
Cohesion: 0.05
Nodes (39): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+31 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "output.ts"
Cohesion: 0.22
Nodes (13): CommandHelp, FetchReport, FetchRow, HelpRow, history, LineKind, LineSegment, segmentsOf() (+5 more)

### Community 45 - "CurrentUser"
Cohesion: 0.26
Nodes (13): CurrentUser, QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+5 more)

### Community 46 - "student/dashboard/page.tsx"
Cohesion: 0.09
Nodes (25): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+17 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, **/*spec.ts, dist, test, ./tsconfig.json

### Community 48 - "DeveloperAnalyticsController"
Cohesion: 0.23
Nodes (10): DeveloperAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+2 more)

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
Cohesion: 0.11
Nodes (27): Console(), chunkEnd(), pageRows(), PagerState, PendingQuestion, PendingSelect, sleep(), SuggestRow (+19 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 67 - "instructor/layout.tsx"
Cohesion: 0.12
Nodes (19): ADMIN_NAV_ITEMS, FullUser, INSTRUCTOR_NAV_ITEMS, BasicInfoFormData, basicInfoSchema, ChangePasswordFormData, changePasswordSchema, ProfilePage() (+11 more)

### Community 68 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 70 - "GetActivityQueryDto"
Cohesion: 0.12
Nodes (15): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+7 more)

### Community 71 - "source:dev — Master Plan"
Cohesion: 0.10
Nodes (19): 0. Vision, 10. Updated build order (revised 2026-09-21 — backend-first, frontend-last), 11. Decision log (memory for future sessions/agents), 12. QA discussion model (revised 2026-09-21, supersedes §1 author-only draft), 1. Roles — collapsed from three to two, 2. Content ownership & reuse, 3. Publishing / review workflow, 4. Content labeling (AI-generated vs hand-written vs partial) (+11 more)

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "OAuthProfile"
Cohesion: 0.20
Nodes (5): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable

### Community 74 - "ProgressService"
Cohesion: 0.16
Nodes (11): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+3 more)

### Community 75 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 77 - "AiGenerateService"
Cohesion: 0.14
Nodes (5): AiGenerateService, Injectable, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), buildModuleConceptsUserPrompt()

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "AiProviderKey"
Cohesion: 0.12
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
Cohesion: 0.22
Nodes (13): CreateAiKeyDto, LookupModelsDto, ApiProperty, ApiPropertyOptional, IsEnum, IsOptional, IsString, UpdateAiKeyDto (+5 more)

### Community 87 - "auth.service.ts"
Cohesion: 0.13
Nodes (11): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, ResetPasswordDto, ApiProperty, IsNotEmpty, IsString (+3 more)

### Community 88 - "useTheme"
Cohesion: 0.15
Nodes (12): emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, TerminalHeader(), TerminalSurface(), Theme (+4 more)

### Community 89 - "CreateConceptDto"
Cohesion: 0.29
Nodes (7): CreateConceptDto, ApiProperty, ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString

### Community 90 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 92 - "notifications.service.ts"
Cohesion: 0.07
Nodes (31): ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags, NotificationType, InjectRepository, AiJobPayload (+23 more)

### Community 96 - "quiz.controller.ts"
Cohesion: 0.13
Nodes (14): SubmitAttemptDto, ApiProperty, IsUUID, IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto (+6 more)

### Community 98 - "Assignment"
Cohesion: 0.17
Nodes (12): AiConfidence, SubmissionStatus, Assignment, Column, Entity, JoinColumn, ManyToOne, Submission (+4 more)

### Community 117 - "factories.ts"
Cohesion: 0.09
Nodes (36): ConceptDifficulty, XpSource, FIXED_DATE, makeBadge(), makeOption(), makeProgress(), makeQuestion(), makeReviewItem() (+28 more)

### Community 127 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, dotenv, dotenv

### Community 136 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 143 - "UpdateOwnProfileDto"
Cohesion: 0.13
Nodes (15): IsIanaTimezone(), ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, Type, ValidateNested, UpdateOwnProfileDto (+7 more)

### Community 144 - "2. QA discussion (§12)"
Cohesion: 0.18
Nodes (11): 2.10 Answer edit/delete by author, 2.1 Post a public discussion question (as B), 2.2 Ask AI — private answer (as B), 2.3 Old target value rejected, 2.4 Discussion list — AI privacy per viewer, 2.5 Any developer can answer — author/admin auto-verified (as A answers B's question), 2.6 Verify — for other developers' answers, 2.7 AI answers cannot be verified (+3 more)

### Community 145 - ".checkRateLimit"
Cohesion: 0.56
Nodes (5): addCivilDays(), civilDateIn(), relativeDayIn(), resolveZone(), todayIn()

### Community 146 - "ai-generate.controller.ts"
Cohesion: 0.11
Nodes (32): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+24 more)

### Community 154 - "Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing"
Cohesion: 0.22
Nodes (8): 5.1 Developer can check quota, 5. AI-generate guard (§1), 7.1 Bell badge + list + filter, 7.2 Author decisions carry reasons, 7.3 Read state, 7.4 Moderation + AI jobs, 7. Notifications (§7) — needs migration run, Backend manual tests — §1 roles + §12 QA discussion + §2 ownership + §3 publishing

### Community 181 - "PasswordResetOtp"
Cohesion: 0.25
Nodes (7): InjectRepository, PasswordResetOtp, Column, Entity, Index, JoinColumn, ManyToOne

### Community 182 - "6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run"
Cohesion: 0.25
Nodes (8): 6.1 Store keys (max 2, first auto-default), 6.2 Default + cap, 6.2b Model dropdown flow (pre-save lookup + per-key default), 6.3 Providers + live models, 6.4 Free tier is 5/day, own key uses its bucket, 6.5 gemini without a key is rejected, 6.6 In-use deletion lock, 6. BYOK (§5) — needs `AI_KEYS_ENCRYPTION_SECRET` set + migration run

### Community 184 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, Matches, VerifyOtpDto

### Community 189 - "0. Setup — three users"
Cohesion: 0.50
Nodes (4): 0.1 Register developer A (future content author), 0.2 Register developer B (other developer), 0.3 Promote yourself to admin (no seed exists — do it in SQL), 0. Setup — three users

### Community 190 - "3. Analytics (retargeted, §1)"
Cohesion: 0.50
Nodes (4): 3.1 Admin overview — developer counts, 3.2 Admin per-developer table (renamed route), 3.3 Developer my-analytics (renamed route, no approval check), 3. Analytics (retargeted, §1)

### Community 192 - "UpdateConceptDto"
Cohesion: 0.33
Nodes (6): ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString, UpdateConceptDto

### Community 198 - "4. AI-generate guard (§1)"
Cohesion: 0.67
Nodes (3): 4.1 Labels on reads, 4.2 Reader filters, 4. AI-generate guard (§1)

## Knowledge Gaps
- **484 isolated node(s):** `ParsedMcqOption`, `ParsedMcqQuestion`, `AiQuotaTier`, `ResolvedAiCredentials`, `AiQuotaStatus` (+479 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **107 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `AuthService`, `Concept`, `typeorm.config.ts`, `ReviewService`, `UsersService`, `McqQuestion`, `analytics.service.spec.ts`, `AuthController`, `ai-generate.controller.ts`, `QaService`, `app.module.ts`, `auth.controller.ts`, `ai-generate.service.ts`, `CurrentUser`, `DeveloperAnalyticsController`, `roadmaps.controller.ts`, `PasswordResetOtp`, `GetActivityQueryDto`, `ProgressService`, `auth.service.ts`, `notifications.service.ts`, `quiz.controller.ts`, `Assignment`, `QuizService`, `factories.ts`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `Concept` connect `Concept` to `Assignment`, `typeorm.config.ts`, `ConceptsService`, `ai-generate.service.ts`, `User`, `McqQuestion`, `analytics.service.spec.ts`, `QaService`, `factories.ts`, `app.module.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `ConceptsController` connect `ConceptsService` to `User`, `Concept`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `ParsedMcqOption`, `ParsedMcqQuestion`, `AiQuotaTier` to the rest of the system?**
  _484 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Concept` be split into smaller, more focused modules?**
  _Cohesion score 0.10461718293395675 - nodes in this community are weakly interconnected._
- **Should `centered-terminal-loader.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14245014245014245 - nodes in this community are weakly interconnected._
- **Should `typeorm.config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13666666666666666 - nodes in this community are weakly interconnected._