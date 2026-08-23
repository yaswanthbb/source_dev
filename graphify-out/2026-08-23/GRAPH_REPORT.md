# Graph Report - knowledge_is_power  (2026-08-23)

## Corpus Check
- 211 files · ~185,986 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1581 nodes · 3406 edges · 159 communities (73 shown, 86 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 114 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad7dddee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UsersService
- CurrentUser
- auth.controller.ts
- QuizService
- ConceptsService
- GamificationController
- qa.controller.ts
- analytics.service.ts
- InstructorAnalyticsController
- GamificationService
- assignments.module.ts
- roadmaps.service.ts
- api-client.ts
- McqQuestion
- ReviewService
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- JwtAuthGuard
- ai-generate.service.ts
- User
- OneToMany
- useSnackbar
- compilerOptions
- AnalyticsController
- GetActivityQueryDto
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
- student/dashboard/page.tsx
- AppService
- apiClient
- RoadmapsService
- Next.js Frontend Application
- frontend/package.json
- OAuthProfile
- Streak
- LinkOAuthDto
- exclude
- eslint-plugin-prettier
- ResetPasswordDto
- nest-cli.json
- backend/package.json
- Concept
- PasswordResetOtp
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
- ProgressService
- RejectConceptDto
- @nestjs/passport
- @nestjs/platform-express
- AttachConceptDto
- UserBadge
- pg
- RegisterDto
- CreateModuleDto
- devDependencies
- AddOAuthColumns1787300000000
- globals
- instructor-analytics.service.ts
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
- ChangePasswordDto
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
- qa.service.ts
- RequestDeletionDto
- UpdateOwnProfileDto
- AddModulePrerequisiteDto
- ApiProperty
- ApiPropertyOptional
- Req
- Res
- IsEnum
- MaxLength
- Query
- Column
- Entity
- IsNotEmpty
- IsOptional
- IsString
- JoinColumn
- ManyToOne

## God Nodes (most connected - your core abstractions)
1. `User` - 110 edges
2. `Concept` - 49 edges
3. `CurrentUser` - 47 edges
4. `BaseEntity` - 41 edges
5. `useSnackbar()` - 37 edges
6. `UsersService` - 36 edges
7. `McqQuestion` - 34 edges
8. `Module` - 31 edges
9. `Roadmap` - 27 edges
10. `UserConceptProgress` - 26 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `ConceptSyllabusSidebarProps` --references--> `User`  [EXTRACTED]
  frontend/components/concept-syllabus-sidebar.tsx → frontend/lib/auth.ts
- `Assignment` --references--> `Concept`  [EXTRACTED]
  backend/src/modules/assignments/entities/assignment.entity.ts → backend/src/modules/content/entities/concept.entity.ts
- `ModuleConcept` --references--> `Concept`  [EXTRACTED]
  backend/src/modules/content/entities/module-concept.entity.ts → backend/src/modules/content/entities/concept.entity.ts
- `UserConceptProgress` --references--> `Concept`  [EXTRACTED]
  backend/src/modules/progress/entities/user-concept-progress.entity.ts → backend/src/modules/content/entities/concept.entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (159 total, 86 thin omitted)

### Community 0 - "UsersService"
Cohesion: 0.08
Nodes (26): JwtStrategy, Injectable, ApiPropertyOptional, IsOptional, IsString, UpdateInstructorBioDto, ApiBearerAuth, ApiOperation (+18 more)

### Community 1 - "CurrentUser"
Cohesion: 0.08
Nodes (41): AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+33 more)

### Community 2 - "auth.controller.ts"
Cohesion: 0.38
Nodes (4): GitHubAuthGuard, Injectable, GoogleAuthGuard, Injectable

### Community 3 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (34): ApiQuery, boundedLevenshtein(), hasSignificantContentChange(), InjectRepository, ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+26 more)

### Community 5 - "GamificationController"
Cohesion: 0.21
Nodes (8): GamificationController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Query

### Community 6 - "qa.controller.ts"
Cohesion: 0.07
Nodes (31): ApiProperty, CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiPropertyOptional, IsNotEmpty (+23 more)

### Community 7 - "analytics.service.ts"
Cohesion: 0.14
Nodes (19): ProgressStatus, XpSource, AnalyticsModule, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, InjectRepository (+11 more)

### Community 8 - "InstructorAnalyticsController"
Cohesion: 0.15
Nodes (13): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, InstructorAnalyticsController, InstructorAnalyticsService, Controller, CurrentUser (+5 more)

### Community 9 - "GamificationService"
Cohesion: 0.21
Nodes (6): Badge, Column, Entity, GamificationService, Injectable, InjectRepository

### Community 10 - "assignments.module.ts"
Cohesion: 0.10
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "roadmaps.service.ts"
Cohesion: 0.16
Nodes (12): slugify(), CreateRoadmapDto, IsNotEmpty, IsOptional, IsString, IsInt, Min, UpdateModuleConceptDto (+4 more)

### Community 12 - "api-client.ts"
Cohesion: 0.15
Nodes (21): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), NAV_ITEMS, StudentAppShellLayout() (+13 more)

### Community 13 - "McqQuestion"
Cohesion: 0.13
Nodes (14): McqQuestion, Column, Entity, JoinColumn, ManyToOne, OneToMany, InjectRepository, ReviewItem (+6 more)

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
Cohesion: 0.10
Nodes (20): AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+12 more)

### Community 18 - "JwtAuthGuard"
Cohesion: 0.29
Nodes (4): IS_PUBLIC_KEY, Public(), JwtAuthGuard, Injectable

### Community 19 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (39): AppModule, typeOrmAsyncConfig, AiGenerateModule, ParsedMcqOption, ParsedMcqQuestion, AssignmentsModule, ContentModule, ModuleConcept (+31 more)

### Community 20 - "User"
Cohesion: 0.09
Nodes (34): BaseEntity, CreateDateColumn, UpdateDateColumn, AiGenerationType, dataSourceOptions, entities, AiGenerationLog, Column (+26 more)

### Community 22 - "useSnackbar"
Cohesion: 0.07
Nodes (34): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+26 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.18
Nodes (10): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+2 more)

### Community 25 - "GetActivityQueryDto"
Cohesion: 0.25
Nodes (7): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, Max

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
Cohesion: 0.16
Nodes (14): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+6 more)

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

### Community 38 - "student/dashboard/page.tsx"
Cohesion: 0.12
Nodes (18): Badge, BADGE_IMAGE_MAP, BADGE_NAME_MAP, DIFF_COLORS, EarnedBadgeItem, GamificationData, getBadgeImage(), Roadmap (+10 more)

### Community 39 - "AppService"
Cohesion: 0.29
Nodes (5): AppController, Controller, Get, AppService, Injectable

### Community 40 - "apiClient"
Cohesion: 0.12
Nodes (13): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics, EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData (+5 more)

### Community 41 - "RoadmapsService"
Cohesion: 0.12
Nodes (17): RoadmapsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+9 more)

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "OAuthProfile"
Cohesion: 0.20
Nodes (5): OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable

### Community 45 - "Streak"
Cohesion: 0.25
Nodes (8): Streak, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn

### Community 46 - "LinkOAuthDto"
Cohesion: 0.33
Nodes (5): LinkOAuthDto, ApiProperty, IsNotEmpty, IsString, IsIn

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
Cohesion: 0.23
Nodes (8): ConceptDifficulty, ConceptReviewStatus, Concept, Column, Entity, JoinColumn, ManyToOne, InjectRepository

### Community 53 - "PasswordResetOtp"
Cohesion: 0.33
Nodes (6): PasswordResetOtp, Column, Entity, JoinColumn, ManyToOne, Index

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 68 - "UpdateModuleDto"
Cohesion: 0.33
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 69 - "ProgressService"
Cohesion: 0.18
Nodes (11): ProgressController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Param (+3 more)

### Community 70 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 73 - "AttachConceptDto"
Cohesion: 0.29
Nodes (7): AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Min

### Community 74 - "UserBadge"
Cohesion: 0.33
Nodes (6): CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UserBadge

### Community 76 - "RegisterDto"
Cohesion: 0.29
Nodes (6): RegisterDto, ApiProperty, IsEmail, IsNotEmpty, IsString, MinLength

### Community 77 - "CreateModuleDto"
Cohesion: 0.40
Nodes (5): CreateModuleDto, IsInt, IsNotEmpty, IsString, Min

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/js, jest, @types/supertest, typescript, typescript, @eslint/js, jest (+1 more)

### Community 81 - "instructor-analytics.service.ts"
Cohesion: 0.12
Nodes (19): UserRole, Roles(), ROLES_KEY, RolesGuard, Injectable, InstructorConceptAnalytics, InstructorOverviewAnalytics, InstructorQuizQuestionAnalytics (+11 more)

### Community 83 - "auth.service.ts"
Cohesion: 0.22
Nodes (8): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, LoginDto, ApiProperty, IsEmail, IsString

### Community 97 - "ChangePasswordDto"
Cohesion: 0.40
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 98 - "VerifyOtpDto"
Cohesion: 0.33
Nodes (5): ApiProperty, IsEmail, IsNotEmpty, VerifyOtpDto, Matches

### Community 141 - "qa.service.ts"
Cohesion: 0.11
Nodes (21): InstructorStatus, AuthModule, Answer, Column, Entity, JoinColumn, ManyToOne, Question (+13 more)

### Community 142 - "RequestDeletionDto"
Cohesion: 0.40
Nodes (5): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength

### Community 143 - "UpdateOwnProfileDto"
Cohesion: 0.40
Nodes (5): ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, UpdateOwnProfileDto

### Community 144 - "AddModulePrerequisiteDto"
Cohesion: 0.50
Nodes (3): AddModulePrerequisiteDto, ApiProperty, IsUUID

## Knowledge Gaps
- **302 isolated node(s):** `ParsedMcqOption`, `ParsedMcqQuestion`, `Placement`, `McqOption`, `McqQuestion` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **86 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `UsersService`, `CurrentUser`, `auth.controller.ts`, `QuizService`, `ConceptsService`, `GamificationController`, `qa.controller.ts`, `analytics.service.ts`, `assignments.module.ts`, `roadmaps.service.ts`, `qa.service.ts`, `McqQuestion`, `ReviewService`, `ai-generate.service.ts`, `Streak`, `Concept`, `PasswordResetOtp`, `ProgressService`, `UserBadge`, `instructor-analytics.service.ts`, `auth.service.ts`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `CurrentUser` to `auth.controller.ts`, `QuizService`, `ConceptsService`, `GamificationController`, `ProgressService`, `qa.controller.ts`, `analytics.service.ts`, `roadmaps.service.ts`, `ReviewService`, `instructor-analytics.service.ts`, `User`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `RoadmapsController` connect `RoadmapsService` to `roadmaps.service.ts`, `ai-generate.service.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `ParsedMcqOption`, `ParsedMcqQuestion`, `Placement` to the rest of the system?**
  _302 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UsersService` be split into smaller, more focused modules?**
  _Cohesion score 0.07577639751552795 - nodes in this community are weakly interconnected._
- **Should `CurrentUser` be split into smaller, more focused modules?**
  _Cohesion score 0.0761904761904762 - nodes in this community are weakly interconnected._
- **Should `QuizService` be split into smaller, more focused modules?**
  _Cohesion score 0.05134575569358178 - nodes in this community are weakly interconnected._