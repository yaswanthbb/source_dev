# Graph Report - knowledge_is_power  (2026-08-25)

## Corpus Check
- 218 files · ~190,332 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1641 nodes · 3530 edges · 172 communities (71 shown, 101 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `40800e37`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- qa.service.ts
- CreateModuleDto
- CreateQuestionDto
- ConceptsService
- GamificationService
- QaService
- Concept
- AiGenerateService
- api-client.ts
- assignments.module.ts
- AttachConceptDto
- XpEvent
- typeorm.config.ts
- ReviewService
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- RegisterDto
- roadmaps.service.ts
- PasswordResetOtp
- OneToMany
- useSnackbar
- compilerOptions
- AnalyticsController
- gamification.service.ts
- student/layout.tsx
- dependencies
- edit/page.tsx
- AdminContentReviewController
- ResetPasswordDto
- scripts
- devDependencies
- app/layout.tsx
- getUser
- dependencies
- Content Authoring Flow
- jest
- JwtAuthGuard
- Controller
- forgot-password/page.tsx
- RoadmapsService
- Next.js Frontend Application
- frontend/package.json
- oauth-profile.interface.ts
- QuizController
- quiz.controller.ts
- exclude
- eslint-plugin-prettier
- auth.ts
- nest-cli.json
- backend/package.json
- UpdateModuleDto
- LinkOAuthDto
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
- auth.controller.ts
- concept.entity.ts
- RejectConceptDto
- @nestjs/passport
- [roadmapId]/page.tsx
- CreateRoadmapDto
- user.entity.ts
- pg
- UpdateRoadmapDto
- AddModulePrerequisiteDto
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
- UpdateModuleConceptDto
- dotenv
- typescript-eslint
- frontend/eslint.config.mjs
- next.config.ts
- @nestjs/swagger
- react-hook-form
- react-markdown
- remark-gfm
- postcss.config.mjs
- Five Hundred XP Badge
- Seven Day Streak Badge
- tailwind.config.ts
- Application Icon
- Application Logo
- jest
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
- @types/supertest
- typescript
- Get
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
- User
- ApiProperty
- ai-generate.service.ts
- Req
- Res
- IsEnum
- MaxLength
- Query
- AddAiGenerationJobs1787600000000
- ApiBearerAuth
- ApiOperation
- ApiResponse
- ApiTags
- Body
- Controller
- Get
- Post
- Req
- Res
- UseGuards
- Injectable
- InjectRepository
- ApiProperty
- ApiPropertyOptional
- IsArray
- IsNotEmpty
- IsOptional
- IsString
- IsUUID
- VerifyOtpDto
- AddAiJobRetryAndAck1787700000000

## God Nodes (most connected - your core abstractions)
1. `User` - 104 edges
2. `Concept` - 47 edges
3. `BaseEntity` - 42 edges
4. `useSnackbar()` - 41 edges
5. `CurrentUser` - 40 edges
6. `UsersService` - 36 edges
7. `AiGenerateService` - 36 edges
8. `McqQuestion` - 34 edges
9. `Module` - 30 edges
10. `Roadmap` - 26 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `StudentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/student/review/page.tsx → frontend/providers/snackbar-provider.tsx
- `ConceptSyllabusSidebarProps` --references--> `User`  [EXTRACTED]
  frontend/components/concept-syllabus-sidebar.tsx → frontend/lib/auth.ts
- `RootPage()` --calls--> `getToken()`  [EXTRACTED]
  frontend/app/page.tsx → frontend/lib/auth.ts
- `useHasToken()` --calls--> `getToken()`  [EXTRACTED]
  frontend/providers/session-sync.tsx → frontend/lib/auth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (172 total, 101 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.07
Nodes (26): JwtStrategy, Injectable, ApiPropertyOptional, IsOptional, IsString, UpdateInstructorBioDto, ApiBearerAuth, ApiOperation (+18 more)

### Community 1 - "qa.service.ts"
Cohesion: 0.19
Nodes (12): InstructorStatus, slugify(), AiGenerateModule, AuthModule, QaModule, InstructorProfile, Column, Entity (+4 more)

### Community 2 - "CreateModuleDto"
Cohesion: 0.33
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 3 - "CreateQuestionDto"
Cohesion: 0.12
Nodes (17): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+9 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (33): ApiQuery, ConceptDifficulty, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+25 more)

### Community 5 - "GamificationService"
Cohesion: 0.06
Nodes (26): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+18 more)

### Community 6 - "QaService"
Cohesion: 0.07
Nodes (29): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsNotEmpty, IsOptional (+21 more)

### Community 7 - "Concept"
Cohesion: 0.11
Nodes (23): ProgressStatus, AnalyticsService, Injectable, InjectRepository, Concept, Column, Entity, JoinColumn (+15 more)

### Community 8 - "AiGenerateService"
Cohesion: 0.07
Nodes (27): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, AppController, AppService, Injectable, AiGenerateController (+19 more)

### Community 9 - "api-client.ts"
Cohesion: 0.15
Nodes (11): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, AnswerResult, DueReviewItem, ReviewOption, ReviewQuestion (+3 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.11
Nodes (20): AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment, Column, Entity (+12 more)

### Community 11 - "AttachConceptDto"
Cohesion: 0.25
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 12 - "XpEvent"
Cohesion: 0.17
Nodes (13): XpSource, Column, Entity, JoinColumn, ManyToOne, XpEvent, ReviewItem, Column (+5 more)

### Community 13 - "typeorm.config.ts"
Cohesion: 0.09
Nodes (31): BaseEntity, CreateDateColumn, UpdateDateColumn, AiConfidence, SubmissionStatus, dataSourceOptions, entities, Question (+23 more)

### Community 14 - "ReviewService"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.07
Nodes (37): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+29 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.10
Nodes (21): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+13 more)

### Community 18 - "RegisterDto"
Cohesion: 0.29
Nodes (6): RegisterDto, ApiProperty, IsEmail, IsNotEmpty, IsString, MinLength

### Community 19 - "roadmaps.service.ts"
Cohesion: 0.09
Nodes (38): AppModule, typeOrmAsyncConfig, AnalyticsModule, AssignmentsModule, ContentModule, ModuleConcept, Column, Entity (+30 more)

### Community 20 - "PasswordResetOtp"
Cohesion: 0.40
Nodes (5): PasswordResetOtp, Column, Entity, JoinColumn, ManyToOne

### Community 22 - "useSnackbar"
Cohesion: 0.08
Nodes (31): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+23 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (12): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+4 more)

### Community 25 - "gamification.service.ts"
Cohesion: 0.13
Nodes (18): Badge, Column, Entity, Streak, Column, CreateDateColumn, Entity, JoinColumn (+10 more)

### Community 26 - "student/layout.tsx"
Cohesion: 0.13
Nodes (19): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), ProfilePage(), NAV_ITEMS (+11 more)

### Community 27 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, bcrypt, class-transformer, class-validator, @nestjs/common, @nestjs/config, @nestjs/jwt, @nestjs/platform-express (+15 more)

### Community 28 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 29 - "AdminContentReviewController"
Cohesion: 0.16
Nodes (14): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+6 more)

### Community 30 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (5): ResetPasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 31 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+10 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.14
Nodes (13): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), AUTH_CHANGED_EVENT, QueryProvider() (+5 more)

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

### Community 38 - "JwtAuthGuard"
Cohesion: 0.29
Nodes (4): IS_PUBLIC_KEY, Public(), JwtAuthGuard, Injectable

### Community 40 - "forgot-password/page.tsx"
Cohesion: 0.20
Nodes (8): EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData, otpStepSchema, PasswordStepFormData, passwordStepSchema, ResetStep

### Community 41 - "RoadmapsService"
Cohesion: 0.11
Nodes (17): RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+9 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "oauth-profile.interface.ts"
Cohesion: 0.20
Nodes (5): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable

### Community 45 - "QuizController"
Cohesion: 0.25
Nodes (12): QuizController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+4 more)

### Community 46 - "quiz.controller.ts"
Cohesion: 0.13
Nodes (14): SubmitAttemptDto, ApiProperty, IsUUID, IsBoolean, IsNotEmpty, IsOptional, IsString, UpdateOptionDto (+6 more)

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, dist, **/*spec.ts, test, ./tsconfig.json

### Community 49 - "auth.ts"
Cohesion: 0.12
Nodes (25): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, BasicInfoFormData (+17 more)

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 52 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 53 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsNotEmpty, IsString, IsIn

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 68 - "auth.controller.ts"
Cohesion: 0.38
Nodes (4): GitHubAuthGuard, Injectable, GoogleAuthGuard, Injectable

### Community 69 - "concept.entity.ts"
Cohesion: 0.62
Nodes (3): ConceptReviewStatus, ProgressService, Injectable

### Community 70 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 72 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 73 - "CreateRoadmapDto"
Cohesion: 0.40
Nodes (4): CreateRoadmapDto, IsNotEmpty, IsOptional, IsString

### Community 74 - "user.entity.ts"
Cohesion: 0.25
Nodes (7): UserRole, CurrentUser, Roles(), ROLES_KEY, RolesGuard, Injectable, Delete

### Community 76 - "UpdateRoadmapDto"
Cohesion: 0.40
Nodes (4): IsNotEmpty, IsOptional, IsString, UpdateRoadmapDto

### Community 77 - "AddModulePrerequisiteDto"
Cohesion: 0.50
Nodes (3): AddModulePrerequisiteDto, ApiProperty, IsUUID

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/eslintrc, @eslint/js, @nestjs/schematics, @nestjs/testing, @eslint/eslintrc, @eslint/js, @nestjs/schematics (+1 more)

### Community 81 - "users.service.ts"
Cohesion: 0.08
Nodes (30): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, ChangePasswordDto, ApiProperty, IsNotEmpty, IsString (+22 more)

### Community 83 - "auth.service.ts"
Cohesion: 0.22
Nodes (8): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString

### Community 97 - "UpdateModuleConceptDto"
Cohesion: 0.50
Nodes (3): IsInt, Min, UpdateModuleConceptDto

### Community 141 - "User"
Cohesion: 0.18
Nodes (7): JwtPayload, QuizService, Injectable, Column, Entity, OneToOne, User

### Community 146 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (39): ApiProperty, ApiPropertyOptional, AiGenerationJobStatus, AiGenerationJobType, AiGenerationType, ParsedMcqOption, ParsedMcqQuestion, buildModuleConceptsUserPrompt() (+31 more)

### Community 174 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, VerifyOtpDto, Matches

## Knowledge Gaps
- **312 isolated node(s):** `inter`, `spaceGrotesk`, `outfit`, `rubik`, `metadata` (+307 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **101 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `qa.service.ts`, `ConceptsService`, `GamificationService`, `QaService`, `Concept`, `assignments.module.ts`, `XpEvent`, `typeorm.config.ts`, `ReviewService`, `ai-generate.service.ts`, `roadmaps.service.ts`, `PasswordResetOtp`, `gamification.service.ts`, `QuizController`, `quiz.controller.ts`, `auth.controller.ts`, `concept.entity.ts`, `user.entity.ts`, `users.service.ts`, `auth.service.ts`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `user.entity.ts` to `auth.controller.ts`, `GamificationService`, `ConceptsService`, `QaService`, `QuizController`, `quiz.controller.ts`, `ReviewService`, `users.service.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `UsersService` connect `UsersService` to `auth.controller.ts`, `User`, `users.service.ts`, `AuthController`, `auth.service.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `inter`, `spaceGrotesk`, `outfit` to the rest of the system?**
  _312 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.07276995305164319 - nodes in this community are weakly interconnected._
- **Should `CreateQuestionDto` be split into smaller, more focused modules?**
  _Cohesion score 0.11695906432748537 - nodes in this community are weakly interconnected._
- **Should `ConceptsService` be split into smaller, more focused modules?**
  _Cohesion score 0.05725490196078432 - nodes in this community are weakly interconnected._