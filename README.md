# source:dev

**A self-directed learning platform for practical, build-it-yourself knowledge — with AI-assisted authoring, spaced repetition, and a full student / instructor / admin workflow.**

![License: Proprietary](https://img.shields.io/badge/license-proprietary-red)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

---

## What this is

In the age of AI and the internet, learning a skill or acquiring knowledge is easier and more efficient than ever before. If you want to learn something, you can use AI, read articles, go through documentation, watch videos, and find almost anything you need online.

But let's say I want to learn a skill or understand a concept properly. I want to learn the basics, get some practice, and then go deeper into the subject. Prompting my way through everything isn't very efficient, and honestly, it isn't that fun either.

On the other hand, if I want to learn by reading articles, documentation, and other resources, that experience isn't exactly friction-free either. A lot of the content out there is disconnected. You might find a great article explaining one concept, but then have no idea what you should learn next, or how that concept connects to everything else.

So I thought: what if I created a platform where experienced senior developers could write content in a course-like format, without making it as heavy as a traditional video course?

Instead of writing random, disconnected articles on Medium or elsewhere, senior developers could write courses where each concept is connected to the next. You learn step by step, build your understanding gradually, practice what you've learned, and then go deeper.

The platform also includes MCQs and review sections so you can test yourself and reinforce the concepts you've learned instead of just reading them once and forgetting them.

I also added AI features like **Ask AI**, as well as AI-generated modules, concepts, and MCQs. This means students can also become instructors and create their own courses and learning roadmaps with the help of AI, instead of simply prompting their way through studying.

At the same time, AI can help real instructors fill in gaps when they're writing a course. If an instructor doesn't know how to explain a particular topic or wants to add a concept they haven't covered before, AI can help generate a starting point that they can then edit and improve.

So, in a way, the platform tries to solve **two problems at once**:

1. **For learners:** give them a structured, connected, and interactive way to learn instead of jumping between random articles, documentation, and AI prompts.

2. **For instructors:** give experienced developers a way to turn their knowledge into structured courses and learning roadmaps without having to produce a full video course from scratch.

---

## Features

Organized by who's using it, because the three portals really are different apps sharing a backend.

### 🎓 Students

- **Roadmaps → Modules → Concepts.** Work through published learning tracks structured as a clear hierarchy (see [Architecture](#architecture)).
- **Concept reading view** with full GitHub-Flavored Markdown — code blocks, tables, headings, auto-generated in-page table of contents.
- **MCQ quizzes** attached to concepts, with per-option explanations shown on submit.
- **Spaced-repetition review.** Concepts you've completed resurface as due review items over time, so things stick instead of evaporating a week later.
- **Progress tracking.** Every concept is _not started_ / _in progress_ / _completed_, and each roadmap shows a live completion percentage.
- **Gamification** — XP (scaled by concept difficulty, awarded once per concept), daily learning streaks (current + longest), and badges that unlock automatically as you hit milestones.
- **Prerequisite gating.** A concept can be locked until you finish the concepts it depends on, and the UI tells you which one is blocking you.
- **Q&A per concept.** Ask a question right from the reading view; instructors answer it from their side.
- **Accounts** — email/password, Google & GitHub OAuth, password reset via emailed OTP, profile pictures, and a self-service account-deletion request flow. Dark mode included.

### ✍️ Instructors

- **Content authoring studio** for roadmaps, modules, concepts, and quizzes.
- **AI-assisted generation.** Describe what you want; the backend generates modules / concepts / MCQs as a background job you can poll and review. Per-user quota keeps it in check.
- **Module-scoped prerequisites** — wire up dependencies between concepts within a module (again, see [Architecture](#architecture) for why it's scoped this way).
- **Instructor analytics** — enrollment and completion per concept, plus drop-off spots where students stall.
- **Q&A queue** — a feed of unanswered student questions to respond to.
- Instructor accounts are **approved by an admin** before they can publish (via an application flow), so "instructor" isn't self-serve.

### 🛠️ Admins

- **User directory & management** across all roles.
- **Instructor approval queue** — review and approve/reject people applying to author content.
- **Content review workflow** — approve or reject concepts (with feedback) before they reach students. Re-review only re-triggers on _substantive_ content changes, not typo fixes.
- Full access to instructor tooling and analytics.

---

## Tech Stack

Versions are pulled straight from the two `package.json` files. A couple are ahead of what you might expect (Next 16, React 19) — that's intentional, they're what the project runs on.

### Backend

- **[NestJS](https://nestjs.com/) 11** — `@nestjs/common`, `core`, `platform-express` (`^11.0.1`), plus `config ^4`, `jwt ^11`, `passport ^11.0.5`, `swagger ^11.4.6`
- **[TypeORM](https://typeorm.io/) `^0.3.20`** with **`pg ^8.13.1`** (PostgreSQL driver)
- **Auth** — `passport ^0.7.0`, `passport-jwt ^4.0.1`, `passport-google-oauth20 ^2.0.0`, `passport-github2 ^0.1.12`, `bcrypt ^5.1.1`
- **Validation** — `class-validator ^0.14.1`, `class-transformer ^0.5.1`
- **Email** — `nodemailer ^9.0.5`
- **Language / tooling** — TypeScript `^5.7.3`, Jest `^30`, ESLint `^9`, Prettier `^3`

### Frontend

- **[Next.js](https://nextjs.org/) `^16.3.1`** (App Router) + **React `^19.2.8`**
- **[TanStack Query](https://tanstack.com/query) `^5.101.4`** for server state (+ devtools)
- **Forms** — `react-hook-form ^7.85.0` + `@hookform/resolvers ^5.8.0` + `zod ^4.4.3`
- **HTTP** — `axios ^1.19.0`
- **Markdown** — `react-markdown ^10.1.0` + `remark-gfm ^4.0.1`
- **UI** — `lucide-react ^1.31.0` icons, **Tailwind CSS v4** (`@tailwindcss/postcss`)
- **Language** — TypeScript `^5`

### Database

- **PostgreSQL**, schema managed entirely through **TypeORM migrations** (16 and counting — see [`backend/src/migrations`](backend/src/migrations)).

### Infrastructure

- **[Render](https://render.com/)** — backend API
- **[Vercel](https://vercel.com/)** — frontend
- **[Neon](https://neon.tech/)** — managed PostgreSQL
- **AI** — an NVIDIA-hosted LLM, configured via `NVIDIA_API_URL` / `NVIDIA_MODEL_ID` / `NVIDIA_API_KEY`

---

## Architecture

Two apps, one database. The Next.js frontend talks to the NestJS REST API over HTTP; the API owns all business logic and Postgres access.

```
        ┌───────────────────────── Next.js (App Router) ─────────────────────────┐
        │                                                                         │
        │   /(auth)          /student          /instructor          /admin        │
        │   login, OTP,      read, quiz,        authoring studio,    users,        │
        │   OAuth callback   review, Q&A,       AI generation,       instructor    │
        │                    dashboard          analytics, Q&A       approval,     │
        │                                                            content review│
        └───────────────────────────────────┬─────────────────────────────────────┘
                                             │  axios + TanStack Query (JWT bearer)
                                             ▼
        ┌────────────────────────── NestJS REST API ──────────────────────────────┐
        │  auth · users · content · quiz · assignments · progress · gamification   │
        │  review · qa · ai-generate · analytics · instructor-analytics · email    │
        │                       (Swagger docs at /api/docs)                        │
        └───────────────────────────────────┬─────────────────────────────────────┘
                                             │  TypeORM
                                             ▼
                                   ┌──────────────────┐
                                   │   PostgreSQL     │
                                   └──────────────────┘
```

### The content model (the part worth understanding)

Content is a three-level hierarchy:

```
Roadmap  ──<  Module  ──<  Concept  ──<  MCQ questions + assignments
 (track)     (chapter)    (lesson)
```

The non-obvious bit: **a Concept is attached to a Module through a join** (`ModuleConcept`) rather than owned by it. So the same concept can appear in more than one module or roadmap without being duplicated. Write "How Git stores commits" once, reuse it wherever it's relevant.

That reuse is exactly why **prerequisites are module-scoped, not global.** If prerequisites lived on the concept itself, a concept reused in two different tracks would drag the same prerequisites into both — which is usually wrong, because what you need to know _before_ a concept depends on the path you took to get there. So a prerequisite is defined on the concept's _placement within a module_, not on the concept globally. (This wasn't the original design — there's a whole migration, `RestructureModuleScopedPrerequisites`, that moved it there once the reuse case made the global version untenable.)

### Two different "reviews"

Worth clearing up, because the word is overloaded here:

- **Spaced-repetition review** is a _student_ feature — completed concepts resurface for recall practice.
- **Content review** is an _admin_ workflow — concepts carry a review status and land in an approval queue before students can see them.

The content review workflow exists specifically _because_ of AI authoring. Generating a module in one shot is fast, but fast and correct aren't the same thing, and you don't want an unvetted hallucination showing up in someone's lesson. So there's a human gate: pending → approved/rejected, with feedback. And because authors edit constantly, re-review only fires when a change is **substantive** — detected with a bounded Levenshtein diff — so fixing a typo doesn't send a concept back to the queue.

### AI generation runs as background jobs (and why there's no queue)

LLM generation takes anywhere from a few seconds to a couple of minutes. Blocking an HTTP request that long is miserable UX and fragile. The textbook answer is a job queue — Redis + BullMQ, or a hosted queue — but that's a whole extra service to pay for, run, and monitor, and Render's free tier doesn't give you an always-on worker to consume it anyway.

So instead, a generation request creates a job row, kicks off a **detached async worker inside the API process**, and returns immediately. The client polls the job by id (`pending → running → completed / failed`) and shows progress. Failed items can be retried manually.

The honest tradeoff: **there's no durable recovery.** If the API process restarts while a job is `running`, that in-memory worker is gone — the job is orphaned mid-flight and someone has to retry it. Fine at this scale; it's called out in [Known Limitations](#roadmap--known-limitations) so nobody's surprised.

### Auth note

The backend authorizes on the **live role from the database**, not whatever role is baked into the JWT — so a role change takes effect on the next request, not on the next login. The only stale copy is the role cached in the browser's `localStorage`, and a client-side `SessionSync` reconciles that against the server.

---

## Getting Started

Assumes you've never seen this repo before. You'll need **Node.js 20+**, **npm**, and a **PostgreSQL** database (local, or a Neon connection string).

### 1. Clone

```bash
git clone <your-repo-url> source-dev
cd source-dev
```

### 2. Backend

```bash
cd backend
npm install

# create your env file and fill it in (see the Environment Variables table)
cp .env.example .env
```

Make sure Postgres is running and the database named in your `.env` exists, then run the migrations and start the API:

```bash
npm run typeorm:migration:run   # apply all 16 migrations
npm run start:dev               # watch mode
```

The API comes up on **http://localhost:3000**, with Swagger docs at **http://localhost:3000/api/docs**.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install

cp .env.example .env.local
# set NEXT_PUBLIC_API_URL=http://localhost:3000
```

Run it on a **different port** than the API (the backend's CORS config already whitelists `localhost:3001`):

```bash
npm run dev -- -p 3001
```

Open **http://localhost:3001**.

### 4. OAuth (optional)

Email/password login works out of the box. Google/GitHub login only works once you set real `*_CLIENT_ID` / `*_CLIENT_SECRET` values — without them the strategies load with placeholders and the buttons won't complete a login. The callback URLs default to the backend (`http://localhost:3000/auth/{google,github}/callback`); register those in the respective OAuth app.

---

## Environment Variables

> Derived from actual usage in the source (`ConfigService.get(...)` / `process.env`). Cross-check against your real `.env.example` files, which weren't readable in the environment this was written in.

### Backend (`backend/.env`)

| Variable               | Description                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `NODE_ENV`             | `development` or `production`; loosens CORS and toggles DB SSL in dev                       |
| `PORT`                 | Port the API listens on (default `3000`)                                                    |
| `FRONTEND_URL`         | Frontend base URL — used in email links and as a CORS origin fallback                       |
| `CORS_ORIGINS`         | Comma-separated allowed browser origins (falls back to `FRONTEND_URL` + localhost defaults) |
| `DATABASE_URL`         | Full Postgres connection string (used in production, e.g. Neon)                             |
| `DB_HOST`              | Postgres host (used when `DATABASE_URL` isn't set)                                          |
| `DB_PORT`              | Postgres port                                                                               |
| `DB_USERNAME`          | Postgres user                                                                               |
| `DB_PASSWORD`          | Postgres password                                                                           |
| `DB_DATABASE`          | Database name                                                                               |
| `DB_SSL`               | `true` to require SSL (needed for hosted Postgres like Neon)                                |
| `JWT_SECRET`           | Secret for signing/verifying JWT access tokens                                              |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID _(optional)_                                                         |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret _(optional)_                                                     |
| `GOOGLE_CALLBACK_URL`  | Google OAuth redirect URI _(optional)_                                                      |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID _(optional)_                                                         |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret _(optional)_                                                     |
| `GITHUB_CALLBACK_URL`  | GitHub OAuth redirect URI _(optional)_                                                      |
| `EMAIL_USER`           | Sender email account (Nodemailer) — used for password-reset OTPs                            |
| `EMAIL_APP_PASSWORD`   | App password for the sender account                                                         |
| `NVIDIA_API_KEY`       | API key for the NVIDIA inference endpoint                                                   |
| `NVIDIA_API_URL`       | Base URL of the inference endpoint                                                          |
| `NVIDIA_MODEL_ID`      | Model identifier used for generation                                                        |

### Frontend (`frontend/.env.local`)

| Variable              | Description                                                       |
| --------------------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (defaults to `http://localhost:3000`) |

---

## Project Structure

```
source-dev/
├── backend/                       # NestJS API
│   └── src/
│       ├── main.ts                # bootstrap: CORS, validation, Swagger
│       ├── app.module.ts
│       ├── common/                # shared entities, enums, utils (BaseEntity, roles…)
│       ├── config/                # typeorm.config.ts (datasource for CLI + app)
│       ├── migrations/            # 16 TypeORM migrations
│       └── modules/
│           ├── auth/              # JWT + OAuth, guards, decorators, strategies
│           ├── users/             # accounts, roles, instructor profiles
│           ├── content/           # roadmaps, modules, concepts, prerequisites
│           ├── quiz/              # MCQ questions & attempts
│           ├── assignments/
│           ├── progress/          # per-concept status, roadmap %
│           ├── gamification/      # XP, streaks, badges
│           ├── review/            # spaced-repetition review (student)
│           ├── qa/                # per-concept Q&A
│           ├── ai-generate/       # background AI authoring jobs
│           ├── analytics/         # student-facing analytics
│           ├── instructor-analytics/
│           └── email/             # Nodemailer (OTP, notifications)
│
├── frontend/                      # Next.js App Router
│   └── app/
│       ├── (auth)/                # login, register, forgot/reset password
│       ├── auth/callback/         # OAuth redirect handler
│       ├── student/               # reading, quiz, review, roadmaps, Q&A, dashboard
│       ├── instructor/            # authoring, content, dashboard, Q&A
│       ├── admin/                 # users, instructors, content-review, dashboard
│       └── profile/
│   ├── components/                # modals, banners, theme toggle, sidebar…
│   ├── lib/                       # api-client, auth, hooks, content-diff
│   └── providers/                 # query, session-sync, snackbar, theme, ai-jobs
│
└── INSTRUCTOR_GUIDE.md            # deep dive on authoring + the XP/streak/badge rules
```

---

## Deployment

Runs on free tiers across three services:

- **Backend → Render.** Migrations apply against the compiled build with `npm run typeorm:migration:run:prod`.
- **Frontend → Vercel.** Set `NEXT_PUBLIC_API_URL` to the deployed backend URL.
- **Database → Neon.** Point `DATABASE_URL` at it and set `DB_SSL=true`.

**The free-tier catch:** Render spins the backend down after inactivity, so the first request after an idle stretch pays a cold-start penalty of several seconds while it wakes up. Neon has similar idle suspend behavior. Fine for a portfolio/low-traffic app; something to know before you demo it live to someone.

---

## Roadmap / Known Limitations

Being straight about what isn't done:

- **No real automated test suite yet.** The Jest + supertest tooling is wired up, but only the two NestJS scaffold specs exist and the frontend has none. This is the top thing to fix.
- **No CI pipeline** (hence no build badge).
- **AI jobs don't survive a restart.** They run in-process with no durable queue, so a backend restart mid-generation orphans the job. Manual retry exists; automatic recovery doesn't. See [Architecture](#ai-generation-runs-as-background-jobs-and-why-theres-no-queue).
- **Single AI provider, hard-wired.** Generation targets NVIDIA's endpoint via env vars; there's no provider abstraction to swap in another model host.
- **Free-tier cold starts** on Render/Neon, as above.
- **Email depends on a Gmail-style app password** through Nodemailer — fine for low volume, not a transactional-email setup.

---

## License

Copyright © 2026 Yaswanth Bolisetty.

All rights reserved. This project is proprietary software.
You may view the source code, but you may not use, copy,
modify, distribute, or commercially exploit it without
prior written permission.

## Acknowledgments

- Built on **[NestJS](https://nestjs.com/)** and **[Next.js](https://nextjs.org/)**.
- Content authors: see **[`INSTRUCTOR_GUIDE.md`](INSTRUCTOR_GUIDE.md)** for the full curriculum model and the exact XP / streak / badge rules.
