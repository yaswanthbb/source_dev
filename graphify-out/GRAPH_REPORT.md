# Graph Report - knowledge_is_power  (2026-08-21)

## Corpus Check
- 211 files · ~180,660 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1479 nodes · 3443 edges · 116 communities (59 shown, 57 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 107 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Backend Content · slugify
- Backend Ai Generate · AiGenerationType
- Backend Auth · AuthController
- Backend Quiz · CreateOptionDto
- Backend Content · ConceptDifficulty
- Backend Gamification · GetActivityQueryDto
- Backend Qa · CreateAnswerDto
- Backend Gamification · PrimaryColumn
- Backend Users · UserRole
- Backend Content · ConceptReviewStatus
- Backend Assignments · AiConfidence
- Backend Users · Roles
- Frontend UI Components · ADMIN_NAV_ITEMS
- Backend Qa · InstructorStatus
- Backend Review · AnswerReviewItemDto
- Frontend Student App · PageProps
- Core Module · compilerOptions [16]
- Backend Config · BaseEntity
- Backend Quiz · SubmitAttemptDto
- Backend Ai Generate · AppModule
- Backend Users · JwtPayload
- Backend Instructor Analytics · InstructorAnalyticsController
- Frontend Instructor App · AdminInstructorsApprovalPage
- Core Module · compilerOptions [23]
- Backend Analytics · AnalyticsController
- Frontend Admin App · AdminContentReviewPage
- Frontend Auth App · LoginFormData
- Core Module · bcrypt
- Frontend Instructor App · ConceptAppearsIn
- Backend Content · AdminContentReviewController
- Frontend Instructor App · CreateRoadmapPage
- Core Module · scripts
- Core Module · eslint [32]
- Frontend Layout.Tsx App · inter
- Frontend Instructor App · ConceptSummary
- Core Module · next
- Project Documentation · Instructor_Guide
- Core Module · jest [37]
- Frontend Student App · Badge
- Core Module · AppController
- Frontend Auth App · EmailStepFormData
- Backend Ai Generate · Roadmap
- Project Documentation · Readme
- Core Module · name
- Backend Auth · PasswordResetOtp
- Backend Review · ReviewItem
- Backend Users · RequestDeletionDto
- Core Module · exclude
- Core Module · eslint [48]
- Backend Users · AccountDeletionRequest
- Core Module · collection
- Core Module · author
- Backend Users · UpdateInstructorBioDto
- Backend Users · UpdateOwnProfileDto
- Database Migrations · InitialSchema1786340981613
- Database Migrations · AddMcqQuiz1786436703834
- Database Migrations · AddConceptDifficulty1786530225075
- Database Migrations · AddAccountDeletionRequests1786630000000
- Database Migrations · FixModuleConceptOrderIndexes1786740000000
- Database Migrations · RestructureModuleScopedPrerequisites1786890000000
- Database Migrations · AddSpacedRepetitionReview1786900000000
- Database Migrations · AddAiGenerationLog1786950000000
- Database Migrations · ExpandAiGenerationTypes1786960000000
- Database Migrations · AddConceptContentReview1787000000000
- Database Migrations · AddPasswordResetOtps1787100000000
- Database Migrations · AddUserProfilePicture1787200000000
- Frontend Static Assets · First_Concept
- Core Module · axios
- Core Module · Package [68]
- Core Module · Package [69]
- Core Module · Package [70]
- Core Module · Package [71]
- Core Module · Package [72]
- Core Module · Package [73]
- Core Module · nodemailer
- Core Module · Package [75]
- Core Module · rxjs
- Core Module · Package [77]
- Core Module · Package [78]
- Core Module · Package [79]
- Core Module · globals
- Core Module · jest [81]
- Core Module · Package [82]
- Core Module · Package [83]
- Core Module · Package [84]
- Core Module · prettier
- Core Module · Package [86]
- Core Module · supertest
- Core Module · Package [88]
- Core Module · Package [89]
- Core Module · Package [90]
- Core Module · Package [91]
- Core Module · Package [92]
- Core Module · Package [93]
- Core Module · Package [94]
- Core Module · Package [95]
- Core Module · Package [96]
- Core Module · Package [97]
- Core Module · typescript
- Core Module · Package [99]
- Core Module · eslintConfig
- Core Module · nextConfig
- Core Module · Package [105]
- Core Module · Package [106]
- Core Module · Package [107]
- Core Module · Package [108]
- Core Module · config [109]
- Frontend Static Assets · Five_Hundred_Xp
- Frontend Static Assets · Seven_Day_Streak
- Core Module · config [112]
- Frontend Icon.Png App · Icon
- Frontend Static Assets · Logo

## God Nodes (most connected - your core abstractions)
1. `User` - 191 edges
2. `CurrentUser` - 75 edges
3. `Concept` - 54 edges
4. `BaseEntity` - 44 edges
5. `Module` - 38 edges
6. `McqQuestion` - 38 edges
7. `useSnackbar()` - 37 edges
8. `UsersService` - 31 edges
9. `Roadmap` - 30 edges
10. `ModuleConcept` - 29 edges

## Surprising Connections (you probably didn't know these)
- `NestJS Backend Application` --conceptually_related_to--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `AdminContentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/admin/content-review/page.tsx → frontend/providers/snackbar-provider.tsx
- `AdminInstructorsApprovalPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/admin/instructors/page.tsx → frontend/providers/snackbar-provider.tsx
- `AdminUsersDirectoryPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/admin/users/page.tsx → frontend/providers/snackbar-provider.tsx
- `CreateConceptPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  frontend/app/instructor/concepts/new/page.tsx → frontend/providers/snackbar-provider.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Curriculum Hierarchy 4-Tier Flow** — instructor_guide_roadmap, instructor_guide_module, instructor_guide_concept, instructor_guide_mcq_quiz [EXTRACTED 1.00]
- **Gamification Engine Core Components** — instructor_guide_experience_points, instructor_guide_learning_streaks, instructor_guide_achievement_badges [EXTRACTED 1.00]
- **Frontend Next.js Ecosystem and Rules** — frontend_readme_nextjs_app, frontend_agents_nextjs_rules, frontend_claude_config [INFERRED 0.85]

## Communities (116 total, 57 thin omitted)

### Community 0 - "Backend Content · slugify"
Cohesion: 0.05
Nodes (49): slugify(), CurrentUser, AddModulePrerequisiteDto, ApiProperty, IsUUID, AttachConceptDto, ApiProperty, ApiPropertyOptional (+41 more)

### Community 1 - "Backend Ai Generate · AiGenerationType"
Cohesion: 0.08
Nodes (44): AiGenerationType, AiGenerateController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+36 more)

### Community 2 - "Backend Auth · AuthController"
Cohesion: 0.06
Nodes (40): AuthController, ApiOperation, ApiResponse, ApiTags, Body, Controller, Post, AuthService (+32 more)

### Community 3 - "Backend Quiz · CreateOptionDto"
Cohesion: 0.05
Nodes (42): ArrayMinSize, CreateOptionDto, ApiProperty, IsBoolean, IsInt, IsNotEmpty, IsString, Min (+34 more)

### Community 4 - "Backend Content · ConceptDifficulty"
Cohesion: 0.06
Nodes (33): ApiQuery, ConceptDifficulty, boundedLevenshtein(), hasSignificantContentChange(), ConceptsController, ApiBearerAuth, ApiOperation, ApiResponse (+25 more)

### Community 5 - "Backend Gamification · GetActivityQueryDto"
Cohesion: 0.06
Nodes (28): GetActivityQueryDto, ApiPropertyOptional, IsInt, IsOptional, Min, Type, GamificationController, ApiBearerAuth (+20 more)

### Community 6 - "Backend Qa · CreateAnswerDto"
Cohesion: 0.08
Nodes (28): CreateAnswerDto, ApiProperty, IsNotEmpty, IsString, CreateQaQuestionDto, ApiProperty, IsNotEmpty, IsString (+20 more)

### Community 7 - "Backend Gamification · PrimaryColumn"
Cohesion: 0.09
Nodes (28): ProgressStatus, XpSource, Streak, Column, CreateDateColumn, Entity, JoinColumn, OneToOne (+20 more)

### Community 8 - "Backend Users · UserRole"
Cohesion: 0.11
Nodes (19): UserRole, ROLES_KEY, RolesGuard, Injectable, ApplyInstructorDto, ApiPropertyOptional, IsOptional, IsString (+11 more)

### Community 9 - "Backend Content · ConceptReviewStatus"
Cohesion: 0.11
Nodes (24): ConceptReviewStatus, InjectRepository, InjectRepository, Concept, Column, Entity, JoinColumn, ManyToOne (+16 more)

### Community 10 - "Backend Assignments · AiConfidence"
Cohesion: 0.09
Nodes (23): AiConfidence, SubmissionStatus, AssignmentsController, Controller, AssignmentsModule, AssignmentsService, Injectable, InjectRepository (+15 more)

### Community 11 - "Backend Users · Roles"
Cohesion: 0.19
Nodes (14): Roles(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Delete (+6 more)

### Community 12 - "Frontend UI Components · ADMIN_NAV_ITEMS"
Cohesion: 0.14
Nodes (21): ADMIN_NAV_ITEMS, AdminAppShellLayout(), FullUser, INSTRUCTOR_NAV_ITEMS, InstructorAppShellLayout(), RootPage(), NAV_ITEMS, StudentAppShellLayout() (+13 more)

### Community 13 - "Backend Qa · InstructorStatus"
Cohesion: 0.14
Nodes (20): InstructorStatus, MostMissedOption, Answer, Column, Entity, JoinColumn, ManyToOne, Question (+12 more)

### Community 14 - "Backend Review · AnswerReviewItemDto"
Cohesion: 0.11
Nodes (16): AnswerReviewItemDto, ApiProperty, IsNotEmpty, IsUUID, ReviewController, ApiBearerAuth, ApiOperation, ApiResponse (+8 more)

### Community 15 - "Frontend Student App · PageProps"
Cohesion: 0.11
Nodes (25): AttemptResponse, ConceptDetail, ConceptReadingPage(), extractHeadings(), getNodeText(), McqOption, McqQuestion, PageProps (+17 more)

### Community 16 - "Core Module · compilerOptions [16]"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "Backend Config · BaseEntity"
Cohesion: 0.19
Nodes (10): BaseEntity, CreateDateColumn, UpdateDateColumn, dataSourceOptions, entities, Badge, Column, Entity (+2 more)

### Community 18 - "Backend Quiz · SubmitAttemptDto"
Cohesion: 0.10
Nodes (21): InjectRepository, SubmitAttemptDto, ApiProperty, IsUUID, McqAttempt, Column, Entity, JoinColumn (+13 more)

### Community 19 - "Backend Ai Generate · AppModule"
Cohesion: 0.15
Nodes (18): AppModule, typeOrmAsyncConfig, AiGenerateModule, AnalyticsModule, AuthModule, ContentModule, Module, Column (+10 more)

### Community 20 - "Backend Users · JwtPayload"
Cohesion: 0.13
Nodes (5): JwtPayload, JwtStrategy, Injectable, Injectable, UsersService

### Community 21 - "Backend Instructor Analytics · InstructorAnalyticsController"
Cohesion: 0.14
Nodes (17): InstructorAnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+9 more)

### Community 22 - "Frontend Instructor App · AdminInstructorsApprovalPage"
Cohesion: 0.10
Nodes (19): AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage(), DeletionRequestItem, UserDirectoryItem, ConceptSummary, CreateConceptPage(), ModuleConceptItem (+11 more)

### Community 23 - "Core Module · compilerOptions [23]"
Cohesion: 0.08
Nodes (23): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 24 - "Backend Analytics · AnalyticsController"
Cohesion: 0.14
Nodes (14): AnalyticsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, UseGuards (+6 more)

### Community 25 - "Frontend Admin App · AdminContentReviewPage"
Cohesion: 0.11
Nodes (16): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, ConceptAnalytics, InstructorAnalytics, OverviewAnalytics (+8 more)

### Community 26 - "Frontend Auth App · LoginFormData"
Cohesion: 0.16
Nodes (18): LoginFormData, LoginPage(), loginSchema, RegisterFormData, RegisterPage(), registerSchema, BasicInfoFormData, basicInfoSchema (+10 more)

### Community 27 - "Core Module · bcrypt"
Cohesion: 0.10
Nodes (21): dependencies, bcrypt, dotenv, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/typeorm, passport (+13 more)

### Community 28 - "Frontend Instructor App · ConceptAppearsIn"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 29 - "Backend Content · AdminContentReviewController"
Cohesion: 0.14
Nodes (15): AdminContentReviewController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, Get (+7 more)

### Community 30 - "Frontend Instructor App · CreateRoadmapPage"
Cohesion: 0.18
Nodes (13): CreateRoadmapPage(), ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiGenerateButton() (+5 more)

### Community 31 - "Core Module · scripts"
Cohesion: 0.12
Nodes (17): scripts, build, format, lint, start, start:debug, start:dev, start:prod (+9 more)

### Community 32 - "Core Module · eslint [32]"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 33 - "Frontend Layout.Tsx App · inter"
Cohesion: 0.14
Nodes (12): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), SnackbarProvider() (+4 more)

### Community 34 - "Frontend Instructor App · ConceptSummary"
Cohesion: 0.15
Nodes (13): InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, ConceptSummary, InstructorQaPage(), QaAnswer, QaQuestion (+5 more)

### Community 35 - "Core Module · next"
Cohesion: 0.13
Nodes (15): dependencies, lucide-react, next, react, react-dom, @tanstack/react-query, @tanstack/react-query-devtools, zod (+7 more)

### Community 36 - "Project Documentation · Instructor_Guide"
Cohesion: 0.19
Nodes (14): Automated Achievement Badges, Concept (Lesson), Concept Prerequisites Engine, Content Authoring Flow, Curriculum Architecture & Hierarchy, Experience Points (XP) System, Gamification Engine, Instructor Studio & Analytics (+6 more)

### Community 37 - "Core Module · jest [37]"
Cohesion: 0.15
Nodes (13): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+5 more)

### Community 38 - "Frontend Student App · Badge"
Cohesion: 0.18
Nodes (12): Badge, BADGE_IMAGE_MAP, BADGE_NAME_MAP, DIFF_COLORS, EarnedBadgeItem, GamificationData, getBadgeImage(), Roadmap (+4 more)

### Community 39 - "Core Module · AppController"
Cohesion: 0.29
Nodes (5): AppController, Controller, Get, AppService, Injectable

### Community 40 - "Frontend Auth App · EmailStepFormData"
Cohesion: 0.20
Nodes (8): EmailStepFormData, emailStepSchema, ForgotPasswordPage(), OtpStepFormData, otpStepSchema, PasswordStepFormData, passwordStepSchema, ResetStep

### Community 41 - "Backend Ai Generate · Roadmap"
Cohesion: 0.20
Nodes (8): InjectRepository, InjectRepository, Roadmap, Column, Entity, JoinColumn, ManyToOne, OneToMany

### Community 42 - "Project Documentation · Readme"
Cohesion: 0.22
Nodes (9): Generate Agent Files Script, Next.js Agent Rules & Breaking Changes, Claude Agent Configuration, Geist Font Optimization, Next.js Frontend Application, Vercel Deployment Platform, Kamil Myśliwiec, Mau Cloud Deployment (+1 more)

### Community 43 - "Core Module · name"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 44 - "Backend Auth · PasswordResetOtp"
Cohesion: 0.25
Nodes (7): InjectRepository, PasswordResetOtp, Column, Entity, JoinColumn, ManyToOne, Index

### Community 45 - "Backend Review · ReviewItem"
Cohesion: 0.25
Nodes (7): ReviewItem, Column, Entity, JoinColumn, ManyToOne, Unique, InjectRepository

### Community 46 - "Backend Users · RequestDeletionDto"
Cohesion: 0.29
Nodes (6): RequestDeletionDto, ApiPropertyOptional, IsOptional, IsString, MaxLength, Post

### Community 47 - "Core Module · exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, node_modules, dist, **/*spec.ts, test, ./tsconfig.json

### Community 48 - "Core Module · eslint [48]"
Cohesion: 0.29
Nodes (7): devDependencies, eslint, eslint-plugin-prettier, @types/bcrypt, eslint, eslint-plugin-prettier, @types/bcrypt

### Community 49 - "Backend Users · AccountDeletionRequest"
Cohesion: 0.29
Nodes (6): AccountDeletionRequest, Column, Entity, JoinColumn, ManyToOne, InjectRepository

### Community 50 - "Core Module · collection"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 51 - "Core Module · author"
Cohesion: 0.33
Nodes (5): author, description, name, private, version

### Community 52 - "Backend Users · UpdateInstructorBioDto"
Cohesion: 0.33
Nodes (5): ApiPropertyOptional, IsOptional, IsString, MaxLength, UpdateInstructorBioDto

### Community 53 - "Backend Users · UpdateOwnProfileDto"
Cohesion: 0.40
Nodes (5): ApiPropertyOptional, IsNotEmpty, IsOptional, IsString, UpdateOwnProfileDto

### Community 66 - "Frontend Static Assets · First_Concept"
Cohesion: 0.67
Nodes (3): First Concept Completed Badge, Five Concepts Completed Badge, Twenty Concepts Completed Badge

## Knowledge Gaps
- **296 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+291 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **57 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Backend Instructor Analytics · InstructorAnalyticsController` to `Backend Content · slugify`, `Backend Ai Generate · AiGenerationType`, `Backend Auth · AuthController`, `Backend Quiz · CreateOptionDto`, `Backend Content · ConceptDifficulty`, `Backend Gamification · GetActivityQueryDto`, `Backend Qa · CreateAnswerDto`, `Backend Gamification · PrimaryColumn`, `Backend Users · UserRole`, `Backend Content · ConceptReviewStatus`, `Backend Assignments · AiConfidence`, `Backend Users · Roles`, `Backend Qa · InstructorStatus`, `Backend Review · AnswerReviewItemDto`, `Backend Config · BaseEntity`, `Backend Quiz · SubmitAttemptDto`, `Backend Ai Generate · AppModule`, `Backend Users · JwtPayload`, `Backend Content · AdminContentReviewController`, `Backend Ai Generate · Roadmap`, `Backend Auth · PasswordResetOtp`, `Backend Review · ReviewItem`, `Backend Users · RequestDeletionDto`, `Backend Users · AccountDeletionRequest`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `Concept` connect `Backend Content · ConceptReviewStatus` to `Backend Content · slugify`, `Backend Ai Generate · AiGenerationType`, `Backend Content · ConceptDifficulty`, `Backend Gamification · PrimaryColumn`, `Backend Ai Generate · Roadmap`, `Backend Assignments · AiConfidence`, `Backend Qa · InstructorStatus`, `Backend Config · BaseEntity`, `Backend Quiz · SubmitAttemptDto`, `Backend Ai Generate · AppModule`, `Backend Instructor Analytics · InstructorAnalyticsController`, `Backend Content · AdminContentReviewController`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `CreateQuestionDto` connect `Backend Quiz · CreateOptionDto` to `Backend Quiz · SubmitAttemptDto`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _296 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Content · slugify` be split into smaller, more focused modules?**
  _Cohesion score 0.05293383270911361 - nodes in this community are weakly interconnected._
- **Should `Backend Ai Generate · AiGenerationType` be split into smaller, more focused modules?**
  _Cohesion score 0.07784679089026915 - nodes in this community are weakly interconnected._
- **Should `Backend Auth · AuthController` be split into smaller, more focused modules?**
  _Cohesion score 0.056535504296698326 - nodes in this community are weakly interconnected._