# Graph Report - knowledge_is_power  (2026-08-22)

## Corpus Check
- 211 files · ~185,687 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1563 nodes · 3522 edges · 149 communities (67 shown, 82 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 114 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0ed5b63b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- ai-generate.service.ts
- auth.controller.ts
- quiz.controller.ts
- ConceptsService
- GamificationService
- qa.service.ts
- analytics.service.ts
- admin-content-review.controller.ts
- QuizService
- assignments.module.ts
- roadmaps.controller.ts
- api-client.ts
- McqQuestion
- ReviewService
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- AuthService
- Module
- user.entity.ts
- User
- useSnackbar
- compilerOptions
- AnalyticsController
- profile/page.tsx
- dependencies
- edit/page.tsx
- AdminContentReviewController
- [roadmapId]/page.tsx
- scripts
- devDependencies
- app/layout.tsx
- getUser
- dependencies
- Content Authoring Flow
- jest
- apiClient
- AppService
- forgot-password/page.tsx
- CurrentUser
- Next.js Frontend Application
- frontend/package.json
- OAuthProfile
- gamification.service.ts
- AiGenerateController
- exclude
- eslint-plugin-prettier
- ResetPasswordDto
- nest-cli.json
- backend/package.json
- Concept
- QaController
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
- UpdateModuleDto
- ProgressController
- RejectConceptDto
- @nestjs/passport
- @nestjs/platform-express
- AttachConceptDto
- Injectable
- pg
- RegisterDto
- XpEvent
- devDependencies
- AddOAuthColumns1787300000000
- globals
- users.service.ts
- @nestjs/cli
- auth.service.ts
- @nestjs/core
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
- InjectRepository
- VerifyOtpDto
- typescript-eslint
- frontend/eslint.config.mjs
- next.config.ts
- @nestjs/typeorm
- react-hook-form
- react-markdown
- remark-gfm
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- tailwind.config.ts
- Application Icon
- Application Logo
- rxjs
- passport-jwt
- reflect-metadata
- typeorm
- eslint
- @types/bcrypt
- @types/passport-github2
- @types/passport-google-oauth20
- lucide-react
- nodemailer
- passport-github2
- @eslint/eslintrc
- @nestjs/schematics
- @nestjs/testing
- eslint-config-prettier
- ApiBearerAuth
- ApiOperation
- ApiResponse
- ApiTags
- Controller
- Get
- UseGuards
- Injectable
- InjectRepository
- AddQaAnswerAiSupport1787500000000
- Column
- Entity
- JoinColumn
- ManyToOne
- ApiProperty
- IsNotEmpty
- IsString
- Injectable
- InjectRepository

## God Nodes (most connected - your core abstractions)
1. `User` - 174 edges
2. `CurrentUser` - 74 edges
3. `Concept` - 50 edges
4. `BaseEntity` - 43 edges
5. `useSnackbar()` - 37 edges
6. `UsersService` - 36 edges
7. `McqQuestion` - 36 edges
8. `Module` - 35 edges
9. `Roadmap` - 28 edges
10. `ModuleConcept` - 28 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `ConceptSyllabusSidebarProps` --references--> `User`  [EXTRACTED]
  frontend/components/concept-syllabus-sidebar.tsx → frontend/lib/auth.ts
- `EditConceptPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/instructor/concepts/[id]/edit/page.tsx → frontend/providers/snackbar-provider.tsx
- `InstructorQaPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/instructor/qa/page.tsx → frontend/providers/snackbar-provider.tsx
- `ConceptReadingPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/student/concepts/[id]/page.tsx → frontend/providers/snackbar-provider.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (149 total, 82 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.06
Nodes (35): Roles(), JwtPayload, JwtStrategy, Injectable, ChangePasswordDto, ApiProperty, IsNotEmpty, IsString (+27 more)

### Community 1 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (35): AiGenerationType, AiGenerateService, buildConceptContentUserPrompt(), buildConceptMcqUserPrompt(), buildModuleConceptsUserPrompt(), buildQaAnswerUserPrompt(), buildRoadmapDescriptionUserPrompt(), buildRoadmapModulesUserPrompt() (+27 more)

### Community 2 - "auth.controller.ts"
Cohesion: 0.19
Nodes (9): LinkOAuthDto, ApiProperty, IsNotEmpty, IsString, GitHubAuthGuard, Injectable, GoogleAuthGuard, Injectable (+1 more)

### Community 3 - "quiz.controller.ts"
Cohesion: 0.06
Nodes (31): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+23 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (33): ApiQuery, ConceptDifficulty, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+25 more)

### Community 5 - "GamificationService"
Cohesion: 0.10
Nodes (17): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+9 more)

### Community 6 - "qa.service.ts"
Cohesion: 0.05
Nodes (33): ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiResponse, ApiTags, InstructorAnalyticsController, InstructorAnalyticsService (+25 more)

### Community 7 - "analytics.service.ts"
Cohesion: 0.17
Nodes (14): ProgressStatus, InjectRepository, MostMissedOption, Column, Entity, JoinColumn, ManyToOne, Unique (+6 more)

### Community 8 - "admin-content-review.controller.ts"
Cohesion: 0.38
Nodes (4): UserRole, ROLES_KEY, RolesGuard, Injectable

### Community 9 - "QuizService"
Cohesion: 0.14
Nodes (14): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+6 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "roadmaps.controller.ts"
Cohesion: 0.10
Nodes (19): AddModulePrerequisiteDto, ApiProperty, IsUUID, CreateModuleDto, IsInt, IsNotEmpty, IsString, Min (+11 more)

### Community 12 - "api-client.ts"
Cohesion: 0.15
Nodes (21): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), NAV_ITEMS, StudentAppShellLayout() (+13 more)

### Community 13 - "McqQuestion"
Cohesion: 0.16
Nodes (19): ConceptReviewStatus, McqAttempt, Column, Entity, JoinColumn, ManyToOne, McqOption, Column (+11 more)

### Community 14 - "ReviewService"
Cohesion: 0.12
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.13
Nodes (21): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+13 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.19
Nodes (14): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+6 more)

### Community 18 - "AuthService"
Cohesion: 0.20
Nodes (6): AuthService, Injectable, LoginDto, ApiProperty, IsEmail, IsString

### Community 19 - "Module"
Cohesion: 0.11
Nodes (22): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, AuthModule, ContentModule, Module (+14 more)

### Community 20 - "user.entity.ts"
Cohesion: 0.14
Nodes (18): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, Question, Column, Entity (+10 more)

### Community 21 - "User"
Cohesion: 0.14
Nodes (12): Roadmap, Column, Entity, JoinColumn, ManyToOne, OneToMany, RoadmapsService, Injectable (+4 more)

### Community 22 - "useSnackbar"
Cohesion: 0.07
Nodes (34): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+26 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (14): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+6 more)

### Community 26 - "profile/page.tsx"
Cohesion: 0.14
Nodes (18): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, BasicInfoFormData (+10 more)

### Community 27 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, bcrypt, class-transformer, class-validator, dotenv, @nestjs/common, @nestjs/config, @nestjs/jwt (+13 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.21
Nodes (11): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+3 more)

### Community 30 - "[roadmapId]/page.tsx"
Cohesion: 0.19
Nodes (12): CreateRoadmapPage(), ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiGenerateButton() (+4 more)

### Community 31 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+9 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.14
Nodes (12): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), SnackbarProvider() (+4 more)

### Community 34 - "getUser"
Cohesion: 0.22
Nodes (9): InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, ConceptSummary, InstructorQaPage(), QaAnswer, QaQuestion (+1 more)

### Community 35 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @hookform/resolvers, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "Content Authoring Flow"
Cohesion: 0.19
Nodes (14): Automated Achievement Badges, Concept (Lesson), Concept Prerequisites Engine, Content Authoring Flow, Curriculum Architecture & Hierarchy, Experience Points (XP) System, Gamification Engine, Instructor Studio & Analytics (+6 more)

### Community 37 - "jest"
Cohesion: 0.15
Nodes (13): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+5 more)

### Community 38 - "apiClient"
Cohesion: 0.09
Nodes (23): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, Badge, BADGE_IMAGE_MAP, BADGE_NAME_MAP, DIFF_COLORS (+15 more)

### Community 39 - "AppService"
Cohesion: 0.29
Nodes (5): AppController, Controller, Get, AppService, Injectable

### Community 40 - "forgot-password/page.tsx"
Cohesion: 0.20
Nodes (8): EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData, otpStepSchema, PasswordStepFormData, passwordStepSchema, ResetStep

### Community 41 - "CurrentUser"
Cohesion: 0.25
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

### Community 45 - "gamification.service.ts"
Cohesion: 0.13
Nodes (18): Badge, Column, Entity, Streak, Column, CreateDateColumn, Entity, JoinColumn (+10 more)

### Community 46 - "AiGenerateController"
Cohesion: 0.24
Nodes (13): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+5 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, dist, **/*spec.ts, test, ./tsconfig.json

### Community 49 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 52 - "Concept"
Cohesion: 0.08
Nodes (31): slugify(), InjectRepository, InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne (+23 more)

### Community 53 - "QaController"
Cohesion: 0.25
Nodes (12): QaController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 68 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 69 - "ProgressController"
Cohesion: 0.19
Nodes (9): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+1 more)

### Community 70 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 73 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 76 - "RegisterDto"
Cohesion: 0.29
Nodes (6): RegisterDto, ApiProperty, IsEmail, IsNotEmpty, IsString, MinLength

### Community 77 - "XpEvent"
Cohesion: 0.16
Nodes (13): XpSource, Column, Entity, JoinColumn, ManyToOne, XpEvent, ReviewItem, Column (+5 more)

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "users.service.ts"
Cohesion: 0.13
Nodes (16): InstructorStatus, ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, GetUsersQueryDto, ApiPropertyOptional, IsEnum (+8 more)

### Community 83 - "auth.service.ts"
Cohesion: 0.12
Nodes (13): InjectRepository, ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, PasswordResetOtp, Column, Entity (+5 more)

### Community 98 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, VerifyOtpDto, Matches

## Knowledge Gaps
- **300 isolated node(s):** `PageProps`, `ConceptAppearsIn`, `ConceptDetail`, `McqOption`, `McqQuestion` (+295 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **82 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `ai-generate.service.ts`, `auth.controller.ts`, `quiz.controller.ts`, `ConceptsService`, `GamificationService`, `qa.service.ts`, `analytics.service.ts`, `admin-content-review.controller.ts`, `QuizService`, `assignments.module.ts`, `roadmaps.controller.ts`, `McqQuestion`, `ReviewService`, `AuthController`, `AuthService`, `Module`, `user.entity.ts`, `AdminContentReviewController`, `CurrentUser`, `gamification.service.ts`, `AiGenerateController`, `Concept`, `QaController`, `ProgressController`, `XpEvent`, `users.service.ts`, `auth.service.ts`?**
  _High betweenness centrality (0.183) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `UsersService`, `ai-generate.service.ts`, `auth.controller.ts`, `quiz.controller.ts`, `ConceptsService`, `GamificationService`, `qa.service.ts`, `admin-content-review.controller.ts`, `QuizService`, `roadmaps.controller.ts`, `ReviewService`, `AuthController`, `Module`, `AdminContentReviewController`, `AiGenerateController`, `QaController`, `ProgressController`, `XpEvent`, `users.service.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `UserBadge` connect `gamification.service.ts` to `user.entity.ts`, `User`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `PageProps`, `ConceptAppearsIn`, `ConceptDetail` to the rest of the system?**
  _300 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.05802469135802469 - nodes in this community are weakly interconnected._
- **Should `ai-generate.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07759562841530054 - nodes in this community are weakly interconnected._
- **Should `quiz.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06306306306306306 - nodes in this community are weakly interconnected._