# Graph Report - frontend  (2026-09-18)

## Corpus Check
- 85 files · ~188,657 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 674 nodes · 1355 edges · 48 communities (38 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `533692ee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- fs-commands.ts
- student/dashboard/page.tsx
- auth.ts
- commands.ts
- snackbar-provider.tsx
- compilerOptions
- learning-commands.ts
- useTheme
- [roadmapId]/page.tsx
- use-terminal-session.ts
- fs-commands.test.mjs
- output.ts
- devDependencies
- terminal-workspace.tsx
- edit/page.tsx
- dependencies
- location.ts
- api-client.ts
- completePath
- commands.test.mjs
- callback/page.tsx
- resolve-location.ts
- package.json
- use-roadmap-progress.ts
- instructor/layout.tsx
- check-theme-separation.mjs
- useSnackbar
- runCommand
- minimal-terminal-loader.tsx
- admin/dashboard/page.tsx
- location.test.mjs
- app/layout.tsx
- README.md
- AGENTS.md
- eslint.config.mjs
- next
- next.config.ts
- segmentsOf
- remark-gfm
- @tanstack/react-query
- zod
- postcss.config.mjs
- tailwind.config.ts
- profile/page.tsx
- content-review/page.tsx
- @hookform/resolvers

## God Nodes (most connected - your core abstractions)
1. `apiClient` - 30 edges
2. `useSnackbar()` - 27 edges
3. `useTheme()` - 22 edges
4. `useTerminalSession()` - 21 edges
5. `User` - 21 edges
6. `getToken()` - 18 edges
7. `getUser()` - 17 edges
8. `compilerOptions` - 16 edges
9. `StudentDashboardPage()` - 14 edges
10. `setUser()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `AdminContentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  app/admin/content-review/page.tsx → providers/snackbar-provider.tsx
- `CreateConceptPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  app/instructor/concepts/new/page.tsx → providers/snackbar-provider.tsx
- `LoginPage()` --calls--> `useTheme()`  [EXTRACTED]
  app/(auth)/login/page.tsx → providers/theme-provider.tsx
- `RegisterPage()` --calls--> `detectTimezone()`  [EXTRACTED]
  app/(auth)/register/page.tsx → lib/timezone.ts
- `RegisterPage()` --calls--> `useTheme()`  [EXTRACTED]
  app/(auth)/register/page.tsx → providers/theme-provider.tsx

## Import Cycles
- None detected.

## Communities (48 total, 10 thin omitted)

### Community 0 - "fs-commands.ts"
Cohesion: 0.10
Nodes (24): CommandCtx, cat, cd, contentOf(), find, Found, FS_COMMANDS, grep (+16 more)

### Community 1 - "student/dashboard/page.tsx"
Cohesion: 0.08
Nodes (34): ACTIVITY_SCALE, ActivityDay, BadgeDef, badgeTag(), EarnedBadgeItem, GamificationData, MONTHS, MONTHS_LONG (+26 more)

### Community 2 - "auth.ts"
Cohesion: 0.17
Nodes (18): AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, InstructorAppShellLayout(), RootPage(), RetroHomepage() (+10 more)

### Community 3 - "commands.ts"
Cohesion: 0.06
Nodes (40): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), applyInstructor, ARG_INDEX, avatar(), BootLine (+32 more)

### Community 4 - "snackbar-provider.tsx"
Cohesion: 0.18
Nodes (9): ConceptSummary, InstructorQaPage(), QaAnswer, QaQuestion, SnackbarContext, SnackbarContextValue, SnackbarProvider(), SnackbarState (+1 more)

### Community 5 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 6 - "learning-commands.ts"
Cohesion: 0.06
Nodes (50): allThreads(), askerIdOf(), askerOf(), askQuestion(), AttemptResult, body(), catalog(), complete (+42 more)

### Community 7 - "useTheme"
Cohesion: 0.19
Nodes (9): emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, Theme, ThemeContext, ThemeContextValue (+1 more)

### Community 8 - "[roadmapId]/page.tsx"
Cohesion: 0.10
Nodes (26): ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapManagementPage(), RoadmapModule, AiJobResultModal(), AiJobResultModalProps (+18 more)

### Community 9 - "use-terminal-session.ts"
Cohesion: 0.15
Nodes (20): useTerminalLogout(), candidateOf(), chunkEnd(), pageRows(), PagerState, PendingQuestion, sleep(), useTerminalSession() (+12 more)

### Community 10 - "fs-commands.test.mjs"
Cohesion: 0.10
Nodes (18): BY_NAME, CONCEPTS, DETAIL, __dirname, failOnce, FS, GLYPHS, L (+10 more)

### Community 11 - "output.ts"
Cohesion: 0.16
Nodes (21): StudentAppShellLayout(), TerminalIO, TerminalLine, clearLearningCache(), clearHistory(), clearListings(), FetchReport, FetchRow (+13 more)

### Community 12 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 13 - "terminal-workspace.tsx"
Cohesion: 0.15
Nodes (14): openingCommand(), StudentTerminalPage(), Console(), DOC_HEADINGS, FetchBlock(), RunIndicator(), SWATCHES, TerminalWorkspace() (+6 more)

### Community 14 - "edit/page.tsx"
Cohesion: 0.13
Nodes (17): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+9 more)

### Community 15 - "dependencies"
Cohesion: 0.13
Nodes (15): axios, lucide-react, dependencies, axios, lucide-react, react, react-dom, react-hook-form (+7 more)

### Community 16 - "location.ts"
Cohesion: 0.14
Nodes (21): UserPreferences, ADMIN_TERMINAL_ROUTE, ChildKind, deserializeLocation(), formatPath(), fromCliParam(), guiFallback(), PATH_PARAM (+13 more)

### Community 17 - "api-client.ts"
Cohesion: 0.19
Nodes (11): ConceptSummary, CreateConceptPage(), ModuleConceptItem, RoadmapData, RoadmapModuleItem, AiQuotaBadge(), AiQuotaBadgeProps, DeletionRequestInfo (+3 more)

### Community 18 - "completePath"
Cohesion: 0.25
Nodes (11): completeCommand(), completePath(), completions(), matchCommands(), matchingPhrases(), operandUnderCursor(), resolve(), subHints() (+3 more)

### Community 19 - "commands.test.mjs"
Cohesion: 0.18
Nodes (5): commands, __dirname, EXTERNAL, { installGlyphs }, loaded

### Community 20 - "callback/page.tsx"
Cohesion: 0.17
Nodes (16): CallbackHandler(), LoginPage(), LoginStage, RegisterPage(), RegisterStage, CenteredTerminalLoader(), CenteredTerminalLoaderProps, LogEntry (+8 more)

### Community 21 - "resolve-location.ts"
Cohesion: 0.22
Nodes (17): cache, cached(), ConceptContent, conceptEntries(), ConceptStatus, detailOf(), listChildren(), moduleEntries() (+9 more)

### Community 22 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 23 - "use-roadmap-progress.ts"
Cohesion: 0.25
Nodes (5): ConceptProgressInfo, ModuleConceptItem, RoadmapDetailData, RoadmapModuleItem, RoadmapProgressData

### Community 24 - "instructor/layout.tsx"
Cohesion: 0.23
Nodes (10): ADMIN_NAV_ITEMS, FullUser, INSTRUCTOR_NAV_ITEMS, LogoutConfirmationModal(), LogoutConfirmationModalProps, ProfileActionsMenu(), ProfileActionsMenuProps, ThemeToggle() (+2 more)

### Community 25 - "check-theme-separation.mjs"
Cohesion: 0.25
Nodes (5): __dirname, GUARDED, ROOT, RULES, violations

### Community 26 - "useSnackbar"
Cohesion: 0.19
Nodes (12): AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage(), DeletionRequestItem, UserDirectoryItem, CreateRoadmapPage(), ConceptItem, InstructorContentDirectoryPage() (+4 more)

### Community 27 - "runCommand"
Cohesion: 0.22
Nodes (7): runCommand(), wantsHelp(), recordHistory(), segmentsOf(), stuck(), api, isAbortError()

### Community 28 - "minimal-terminal-loader.tsx"
Cohesion: 0.20
Nodes (5): MinimalTerminalLoader(), MinimalTerminalLoaderProps, preserveMinimalLoader(), SPINNER_FRAMES, STATUS_MESSAGES

### Community 29 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 30 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 31 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): inter, metadata, outfit, rubik, spaceGrotesk, ScrollProgressBar(), QueryProvider(), ThemeProvider()

### Community 32 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 38 - "segmentsOf"
Cohesion: 0.43
Nodes (8): childOf(), fromSegments(), isValidSegment(), isWithin(), parentOf(), parsePath(), resolvePath(), segmentsOf()

### Community 45 - "profile/page.tsx"
Cohesion: 0.29
Nodes (6): BasicInfoFormData, basicInfoSchema, ChangePasswordFormData, changePasswordSchema, ProfilePage(), TIMEZONE_OPTIONS

### Community 46 - "content-review/page.tsx"
Cohesion: 0.33
Nodes (5): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement

## Knowledge Gaps
- **258 isolated node(s):** `emailStepSchema`, `otpStepSchema`, `passwordStepSchema`, `ResetStep`, `LoginStage` (+253 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiClient` connect `api-client.ts` to `student/dashboard/page.tsx`, `auth.ts`, `commands.ts`, `snackbar-provider.tsx`, `useTheme`, `[roadmapId]/page.tsx`, `profile/page.tsx`, `content-review/page.tsx`, `edit/page.tsx`, `terminal-workspace.tsx`, `location.ts`, `callback/page.tsx`, `use-roadmap-progress.ts`, `instructor/layout.tsx`, `useSnackbar`, `runCommand`, `admin/dashboard/page.tsx`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `User` connect `instructor/layout.tsx` to `fs-commands.ts`, `student/dashboard/page.tsx`, `auth.ts`, `commands.ts`, `snackbar-provider.tsx`, `[roadmapId]/page.tsx`, `use-terminal-session.ts`, `profile/page.tsx`, `terminal-workspace.tsx`, `callback/page.tsx`, `useSnackbar`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `useTheme` to `student/dashboard/page.tsx`, `auth.ts`, `use-terminal-session.ts`, `callback/page.tsx`, `instructor/layout.tsx`, `minimal-terminal-loader.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `emailStepSchema`, `otpStepSchema`, `passwordStepSchema` to the rest of the system?**
  _258 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `fs-commands.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0960591133004926 - nodes in this community are weakly interconnected._
- **Should `student/dashboard/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07585568917668825 - nodes in this community are weakly interconnected._
- **Should `commands.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06312292358803986 - nodes in this community are weakly interconnected._