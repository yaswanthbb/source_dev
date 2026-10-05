# Graph Report - frontend  (2026-09-18)

## Corpus Check
- 85 files · ~189,045 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 678 nodes · 1362 edges · 45 communities (35 shown, 10 thin omitted)
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
- api-client.ts
- compilerOptions
- learning-commands.ts
- app/layout.tsx
- ai-jobs-provider.tsx
- use-terminal-session.ts
- fs-commands.test.mjs
- session.ts
- devDependencies
- terminal-workspace.tsx
- edit/page.tsx
- dependencies
- [roadmapId]/page.tsx
- concepts/new/page.tsx
- completePath
- commands.test.mjs
- output.ts
- askQuestion
- package.json
- use-roadmap-progress.ts
- printThread
- check-theme-separation.mjs
- content/page.tsx
- runCommand
- showConcept
- admin/dashboard/page.tsx
- location.test.mjs
- resolveIndex
- README.md
- AGENTS.md
- eslint.config.mjs
- next
- next.config.ts
- react-markdown
- remark-gfm
- @tanstack/react-query
- zod
- postcss.config.mjs
- tailwind.config.ts

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
- `CreateConceptPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  app/instructor/concepts/new/page.tsx → providers/snackbar-provider.tsx
- `CreateRoadmapPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  app/instructor/content/new/page.tsx → providers/snackbar-provider.tsx
- `ForgotPasswordPage()` --calls--> `useTheme()`  [EXTRACTED]
  app/(auth)/forgot-password/page.tsx → providers/theme-provider.tsx
- `AdminContentReviewPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  app/admin/content-review/page.tsx → providers/snackbar-provider.tsx
- `AdminInstructorsApprovalPage()` --calls--> `useSnackbar()`  [EXTRACTED]
  app/admin/instructors/page.tsx → providers/snackbar-provider.tsx

## Import Cycles
- None detected.

## Communities (45 total, 10 thin omitted)

### Community 0 - "fs-commands.ts"
Cohesion: 0.05
Nodes (71): UserPreferences, CommandCtx, cat, cd, childOf(), contentOf(), find, Found (+63 more)

### Community 1 - "student/dashboard/page.tsx"
Cohesion: 0.06
Nodes (52): CallbackHandler(), LoginPage(), LoginStage, RegisterPage(), RegisterStage, ACTIVITY_SCALE, ActivityDay, BadgeDef (+44 more)

### Community 2 - "auth.ts"
Cohesion: 0.07
Nodes (40): ADMIN_NAV_ITEMS, AdminAppShellLayout(), InstructorConceptMetric, InstructorDashboardPage(), InstructorOverview, InstructorQuizQuestionMetric, FullUser, INSTRUCTOR_NAV_ITEMS (+32 more)

### Community 3 - "commands.ts"
Cohesion: 0.06
Nodes (40): AVATAR_ACCEPT, AVATAR_MIME, dataUrlSizeKb(), resizeImageToDataUrl(), applyInstructor, ARG_INDEX, avatar(), BootLine (+32 more)

### Community 4 - "api-client.ts"
Cohesion: 0.11
Nodes (23): AdminContentReviewPage(), McqOption, McqQuestion, PendingConcept, Placement, AdminInstructorsApprovalPage(), InstructorUser, AdminUsersDirectoryPage() (+15 more)

### Community 5 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 6 - "learning-commands.ts"
Cohesion: 0.07
Nodes (25): AttemptResult, complete, ConceptDetail, ConceptSummary, continueLearning, jump, LEARNING_COMMANDS, lessonSections (+17 more)

### Community 7 - "app/layout.tsx"
Cohesion: 0.09
Nodes (17): emailStepSchema, ForgotPasswordPage(), otpStepSchema, passwordStepSchema, ResetStep, inter, metadata, outfit (+9 more)

### Community 8 - "ai-jobs-provider.tsx"
Cohesion: 0.13
Nodes (21): RoadmapManagementPage(), AiJobResultModal(), AiJobResultModalProps, JOB_TYPE_NOUN, AiJobResultsBanner(), jobSummaryLine(), jobVisual(), AiJobsIndicator() (+13 more)

### Community 9 - "use-terminal-session.ts"
Cohesion: 0.15
Nodes (21): Console(), candidateOf(), chunkEnd(), pageRows(), PagerState, PendingQuestion, sleep(), useTerminalSession() (+13 more)

### Community 10 - "fs-commands.test.mjs"
Cohesion: 0.10
Nodes (18): BY_NAME, CONCEPTS, DETAIL, __dirname, failOnce, FS, GLYPHS, L (+10 more)

### Community 11 - "session.ts"
Cohesion: 0.22
Nodes (14): useTerminalLogout(), TerminalIO, TerminalLine, clearLearningCache(), clearHistory(), clearListings(), FetchReport, LineKind (+6 more)

### Community 12 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 13 - "terminal-workspace.tsx"
Cohesion: 0.17
Nodes (11): openingCommand(), StudentTerminalPage(), DOC_HEADINGS, FetchBlock(), RunIndicator(), SWATCHES, TerminalWorkspace(), Token() (+3 more)

### Community 14 - "edit/page.tsx"
Cohesion: 0.17
Nodes (13): ConceptAppearsIn, ConceptDetail, EditConceptPage(), McqOption, McqQuestion, PageProps, ParsedImportQuestion, SAMPLE_QUIZ_JSON (+5 more)

### Community 15 - "dependencies"
Cohesion: 0.13
Nodes (15): axios, @hookform/resolvers, lucide-react, dependencies, axios, @hookform/resolvers, lucide-react, react (+7 more)

### Community 16 - "[roadmapId]/page.tsx"
Cohesion: 0.20
Nodes (8): CreateRoadmapPage(), ConceptSummary, ModuleConcept, PageProps, RoadmapDetail, RoadmapModule, AiQuotaBadge(), AiQuotaBadgeProps

### Community 17 - "concepts/new/page.tsx"
Cohesion: 0.20
Nodes (9): ConceptSummary, CreateConceptPage(), ModuleConceptItem, RoadmapData, RoadmapModuleItem, AiGeneratingModal(), AiGeneratingModalProps, CONTEXT_MESSAGES (+1 more)

### Community 18 - "completePath"
Cohesion: 0.25
Nodes (11): completeCommand(), completePath(), completions(), matchCommands(), matchingPhrases(), operandUnderCursor(), resolve(), subHints() (+3 more)

### Community 19 - "commands.test.mjs"
Cohesion: 0.18
Nodes (5): commands, __dirname, EXTERNAL, { installGlyphs }, loaded

### Community 20 - "output.ts"
Cohesion: 0.22
Nodes (9): FetchRow, HelpRow, history, IndexItem, IndexKind, known, segmentsOf(), Sink (+1 more)

### Community 21 - "askQuestion"
Cohesion: 0.31
Nodes (9): allThreads(), askerIdOf(), askQuestion(), conceptList(), findConceptId(), remember(), status, threadsForConcept() (+1 more)

### Community 22 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 23 - "use-roadmap-progress.ts"
Cohesion: 0.25
Nodes (5): ConceptProgressInfo, ModuleConceptItem, RoadmapDetailData, RoadmapModuleItem, RoadmapProgressData

### Community 24 - "printThread"
Cohesion: 0.29
Nodes (8): askerOf(), detail(), entry(), heading(), plural(), printThread(), renderThread(), shortDate()

### Community 25 - "check-theme-separation.mjs"
Cohesion: 0.25
Nodes (5): __dirname, GUARDED, ROOT, RULES, violations

### Community 26 - "content/page.tsx"
Cohesion: 0.33
Nodes (5): ConceptItem, InstructorContentDirectoryPage(), RoadmapItem, ConfirmModal(), ConfirmModalProps

### Community 27 - "runCommand"
Cohesion: 0.29
Nodes (5): runCommand(), wantsHelp(), recordHistory(), api, isAbortError()

### Community 28 - "showConcept"
Cohesion: 0.29
Nodes (7): body(), nextConcept(), progressFor(), rememberSections(), sectionsOf(), showConcept(), unlocked()

### Community 29 - "admin/dashboard/page.tsx"
Cohesion: 0.33
Nodes (4): ConceptAnalytics, InstructorAnalytics, OverviewAnalytics, RoadmapAnalytics

### Community 30 - "location.test.mjs"
Cohesion: 0.40
Nodes (3): ALL, __dirname, L

### Community 31 - "resolveIndex"
Cohesion: 0.50
Nodes (4): catalog(), findRoadmap(), locateThread(), resolveIndex()

### Community 32 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **261 isolated node(s):** `emailStepSchema`, `otpStepSchema`, `passwordStepSchema`, `ResetStep`, `LoginStage` (+256 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiClient` connect `api-client.ts` to `fs-commands.ts`, `student/dashboard/page.tsx`, `auth.ts`, `commands.ts`, `app/layout.tsx`, `ai-jobs-provider.tsx`, `terminal-workspace.tsx`, `edit/page.tsx`, `[roadmapId]/page.tsx`, `concepts/new/page.tsx`, `use-roadmap-progress.ts`, `content/page.tsx`, `runCommand`, `admin/dashboard/page.tsx`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `User` connect `auth.ts` to `fs-commands.ts`, `student/dashboard/page.tsx`, `commands.ts`, `api-client.ts`, `use-terminal-session.ts`, `terminal-workspace.tsx`, `[roadmapId]/page.tsx`, `content/page.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `student/dashboard/page.tsx` to `use-terminal-session.ts`, `auth.ts`, `app/layout.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `emailStepSchema`, `otpStepSchema`, `passwordStepSchema` to the rest of the system?**
  _261 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `fs-commands.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0526006464883926 - nodes in this community are weakly interconnected._
- **Should `student/dashboard/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05794556628621598 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06610259122157588 - nodes in this community are weakly interconnected._