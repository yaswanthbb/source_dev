# Graph Report - knowledge_is_power  (2026-08-21)

## Corpus Check
- 210 files · ~183,291 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1543 nodes · 3532 edges · 134 communities (63 shown, 71 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 113 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `add5605a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- User
- ai-generate.service.ts
- auth.controller.ts
- QuizService
- ConceptsService
- GamificationService
- qa.service.ts
- Concept
- users.service.ts
- roadmaps.service.ts
- assignments.module.ts
- roadmaps.controller.ts
- api-client.ts
- user.entity.ts
- ReviewService
- concepts/[id]/page.tsx
- compilerOptions
- AuthController
- McqQuestion
- Module
- InstructorProfile
- InstructorAnalyticsController
- useSnackbar
- compilerOptions
- AnalyticsController
- admin/dashboard/page.tsx
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
- forgot-password/page.tsx
- XpEvent
- Next.js Frontend Application
- frontend/package.json
- auth.module.ts
- Streak
- admin-content-review.controller.ts
- exclude
- eslint-plugin-prettier
- AuthService
- nest-cli.json
- backend/package.json
- .linkOAuth
- JwtAuthGuard
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
- RegisterDto
- UpdateModuleDto
- auth.service.ts
- @nestjs/passport
- @nestjs/platform-express
- RejectConceptDto
- ChangePasswordDto
- pg
- rxjs
- eslint-config-prettier
- devDependencies
- AddOAuthColumns1787300000000
- globals
- jest
- @nestjs/cli
- @nestjs/common
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
- @types/supertest
- typescript
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
- passport
- passport-jwt
- reflect-metadata
- typeorm
- eslint
- @types/bcrypt
- @types/passport-github2
- @types/passport-google-oauth20
- lucide-react
- ApiOperation
- ApiResponse
- ApiTags
- Body
- Controller
- Post
- Column
- Entity
- OneToOne

## God Nodes (most connected - your core abstractions)
1. `User` - 194 edges
2. `CurrentUser` - 76 edges
3. `Concept` - 54 edges
4. `BaseEntity` - 43 edges
5. `McqQuestion` - 38 edges
6. `Module` - 37 edges
7. `useSnackbar()` - 37 edges
8. `UsersService` - 36 edges
9. `Roadmap` - 30 edges
10. `ModuleConcept` - 29 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `LoginPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/(auth)/login/page.tsx → frontend/providers/snackbar-provider.tsx
- `RegisterPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/(auth)/register/page.tsx → frontend/providers/snackbar-provider.tsx
- `ProfilePage()` --calls--> `getToken()`  [EXTRACTED]
  frontend/app/profile/page.tsx → frontend/lib/auth.ts
- `ProfilePage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/profile/page.tsx → frontend/providers/snackbar-provider.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (134 total, 71 thin omitted)

### Community 0 - "User"
Cohesion: 0.05
Nodes (42): InjectRepository, CurrentUser, Roles(), JwtPayload, JwtStrategy, Injectable, RoadmapsController, ApiBearerAuth (+34 more)

### Community 1 - "ai-generate.service.ts"
Cohesion: 0.08
Nodes (42): AiGenerationType, AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+34 more)

### Community 2 - "auth.controller.ts"
Cohesion: 0.14
Nodes (13): LoginDto, ApiProperty, IsEmail, IsString, ApiProperty, IsEmail, IsNotEmpty, VerifyOtpDto (+5 more)

### Community 3 - "QuizService"
Cohesion: 0.05
Nodes (45): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+37 more)

### Community 4 - "ConceptsService"
Cohesion: 0.06
Nodes (33): ApiQuery, ConceptDifficulty, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+25 more)

### Community 5 - "GamificationService"
Cohesion: 0.07
Nodes (26): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+18 more)

### Community 6 - "qa.service.ts"
Cohesion: 0.07
Nodes (34): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, IsNotEmpty, IsString (+26 more)

### Community 7 - "Concept"
Cohesion: 0.10
Nodes (27): ConceptReviewStatus, ProgressStatus, XpSource, Concept, Column, Entity, JoinColumn, ManyToOne (+19 more)

### Community 8 - "users.service.ts"
Cohesion: 0.09
Nodes (25): ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString, GetUsersQueryDto, ApiPropertyOptional, IsEnum, IsOptional (+17 more)

### Community 9 - "roadmaps.service.ts"
Cohesion: 0.11
Nodes (25): InstructorStatus, slugify(), InjectRepository, ModuleConcept, Column, Entity, JoinColumn, ManyToOne (+17 more)

### Community 10 - "assignments.module.ts"
Cohesion: 0.09
Nodes (22): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsService, Injectable, InjectRepository, Assignment (+14 more)

### Community 11 - "roadmaps.controller.ts"
Cohesion: 0.07
Nodes (26): AddModulePrerequisiteDto, ApiProperty, IsUUID, AttachConceptDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional (+18 more)

### Community 12 - "api-client.ts"
Cohesion: 0.17
Nodes (19): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), NAV_ITEMS, StudentAppShellLayout() (+11 more)

### Community 13 - "user.entity.ts"
Cohesion: 0.19
Nodes (11): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, AccountDeletionRequest, Column, Entity (+3 more)

### Community 14 - "ReviewService"
Cohesion: 0.12
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 15 - "concepts/[id]/page.tsx"
Cohesion: 0.11
Nodes (25): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+17 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "AuthController"
Cohesion: 0.27
Nodes (12): ApiOperation, ApiResponse, ApiTags, AuthController, Body, Controller, Get, Post (+4 more)

### Community 18 - "McqQuestion"
Cohesion: 0.10
Nodes (25): InjectRepository, McqAttempt, Column, Entity, JoinColumn, ManyToOne, McqOption, Column (+17 more)

### Community 19 - "Module"
Cohesion: 0.14
Nodes (19): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AssignmentsModule, ContentModule, Module, Column (+11 more)

### Community 20 - "InstructorProfile"
Cohesion: 0.12
Nodes (14): InjectRepository, InjectRepository, Answer, Column, Entity, JoinColumn, ManyToOne, InjectRepository (+6 more)

### Community 21 - "InstructorAnalyticsController"
Cohesion: 0.15
Nodes (13): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+5 more)

### Community 22 - "useSnackbar"
Cohesion: 0.07
Nodes (37): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+29 more)

### Community 23 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "AnalyticsController"
Cohesion: 0.14
Nodes (14): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+6 more)

### Community 25 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 26 - "profile/page.tsx"
Cohesion: 0.14
Nodes (18): CallbackHandler(), LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, BasicInfoFormData (+10 more)

### Community 27 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, bcrypt, class-transformer, class-validator, dotenv, @nestjs/config, @nestjs/jwt, @nestjs/swagger (+13 more)

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
Cohesion: 0.20
Nodes (10): InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, ConceptSummary, InstructorQaPage(), QaAnswer, QaQuestion (+2 more)

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
Cohesion: 0.16
Nodes (13): Badge, BADGE_IMAGE_MAP, BADGE_NAME_MAP, DIFF_COLORS, EarnedBadgeItem, GamificationData, getBadgeImage(), Roadmap (+5 more)

### Community 39 - "AppService"
Cohesion: 0.29
Nodes (5): AppController, Controller, Get, AppService, Injectable

### Community 40 - "forgot-password/page.tsx"
Cohesion: 0.20
Nodes (8): EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData, otpStepSchema, PasswordStepFormData, passwordStepSchema, ResetStep

### Community 41 - "XpEvent"
Cohesion: 0.29
Nodes (6): InjectRepository, Column, Entity, JoinColumn, ManyToOne, XpEvent

### Community 42 - "Next.js Frontend Application"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "auth.module.ts"
Cohesion: 0.16
Nodes (8): AuthModule, OAuthProfile, GitHubStrategy, Injectable, GoogleStrategy, Injectable, EmailModule, Module

### Community 45 - "Streak"
Cohesion: 0.25
Nodes (8): Streak, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn

### Community 46 - "admin-content-review.controller.ts"
Cohesion: 0.38
Nodes (4): UserRole, ROLES_KEY, RolesGuard, Injectable

### Community 47 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, dist, **/*spec.ts, test, ./tsconfig.json

### Community 50 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "backend/package.json"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 52 - ".linkOAuth"
Cohesion: 0.20
Nodes (8): ApiBearerAuth, ApiProperty, LinkOAuthDto, CurrentUser, IsIn, IsNotEmpty, IsString, Patch

### Community 53 - "JwtAuthGuard"
Cohesion: 0.29
Nodes (4): IS_PUBLIC_KEY, Public(), JwtAuthGuard, Injectable

### Community 66 - "Five Concepts Completed Badge"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

### Community 68 - "RegisterDto"
Cohesion: 0.29
Nodes (6): RegisterDto, ApiProperty, IsEmail, IsNotEmpty, IsString, MinLength

### Community 69 - "UpdateModuleDto"
Cohesion: 0.29
Nodes (6): IsInt, IsNotEmpty, IsOptional, IsString, Min, UpdateModuleDto

### Community 70 - "auth.service.ts"
Cohesion: 0.10
Nodes (17): ForgotPasswordDto, ApiProperty, IsEmail, IsNotEmpty, ResetPasswordDto, ApiProperty, IsNotEmpty, IsString (+9 more)

### Community 73 - "RejectConceptDto"
Cohesion: 0.40
Nodes (4): RejectConceptDto, ApiProperty, IsNotEmpty, IsString

### Community 74 - "ChangePasswordDto"
Cohesion: 0.40
Nodes (5): ChangePasswordDto, ApiProperty, IsNotEmpty, IsString, MinLength

### Community 78 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @eslint/eslintrc, @eslint/js, @nestjs/schematics, @nestjs/testing, @eslint/eslintrc, @eslint/js, @nestjs/schematics (+1 more)

## Knowledge Gaps
- **300 isolated node(s):** `loginSchema`, `LoginFormData`, `registerSchema`, `RegisterFormData`, `basicInfoSchema` (+295 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `ai-generate.service.ts`, `auth.controller.ts`, `QuizService`, `ConceptsService`, `GamificationService`, `qa.service.ts`, `Concept`, `users.service.ts`, `roadmaps.service.ts`, `assignments.module.ts`, `roadmaps.controller.ts`, `user.entity.ts`, `ReviewService`, `McqQuestion`, `Module`, `InstructorProfile`, `InstructorAnalyticsController`, `AdminContentReviewController`, `XpEvent`, `auth.module.ts`, `Streak`, `admin-content-review.controller.ts`, `AuthService`, `.linkOAuth`, `auth.service.ts`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `User` to `ai-generate.service.ts`, `auth.controller.ts`, `QuizService`, `ConceptsService`, `GamificationService`, `qa.service.ts`, `Concept`, `users.service.ts`, `roadmaps.controller.ts`, `admin-content-review.controller.ts`, `ReviewService`, `McqQuestion`, `InstructorAnalyticsController`, `AdminContentReviewController`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `CreateQuestionDto` connect `QuizService` to `McqQuestion`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `loginSchema`, `LoginFormData`, `registerSchema` to the rest of the system?**
  _300 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.05165289256198347 - nodes in this community are weakly interconnected._
- **Should `ai-generate.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08165057067603161 - nodes in this community are weakly interconnected._
- **Should `auth.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._