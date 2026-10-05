# Changelog

All notable changes to **source:dev** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
How to maintain this file:
- Add new entries under "Unreleased" as you merge changes.
- Group each entry under Added / Changed / Deprecated / Removed / Fixed / Security.
- When you cut a release, rename "Unreleased" to the version + date and start a fresh
  "Unreleased" section on top. Keep the compare links at the bottom in sync.
-->

## [Unreleased]

### Changed

- Rebranded the platform from KIP (Knowledge Is Power) to **source:dev**: all
  user-visible copy, the terminal header, auth pages, loaders, email templates
  and Swagger title now use `source:dev` (display) / `source-dev` (hostnames,
  prompts, CLI references). Storage keys moved to the `sd_` prefix
  (`sd_token`, `sd_user`, `sd_theme`, …) and `kip-*` CSS classes to `sd-*`.
  Existing browser sessions are logged out once by the key rotation.
- Database rename `knowledge_is_power` → `source-dev` **deferred**: the live
  database keeps its current name, so the `DB_DATABASE` default in
  `typeorm.config.ts` is intentionally unchanged and nothing breaks.

_Nothing else yet._

## [1.0.0] - 2026-08-27

First tagged release.

### Added

#### Accounts & authentication

- Email/password registration and login with JWT bearer authentication.
- Social sign-in via Google and GitHub OAuth.
- Password reset through emailed one-time codes (OTP), with per-hour rate limiting and attempt lockout.
- Three roles — student, instructor, admin — with authorization enforced against the live database role rather than the token claim.
- Instructor application flow with admin approval / rejection.

#### Learning content

- Hierarchical content model: roadmaps → modules → concepts, with explicit ordering and prerequisites.
- Concept difficulty levels (easy / medium / hard).
- Content review workflow: concepts return to a pending state on significant edits (or when AI-generated), and students only ever see approved content.

#### Progress & gamification

- Per-concept progress tracking (started / completed) and per-roadmap completion percentages.
- XP awards on concept completion (easy 10 / medium 20 / hard 35), guarded against duplicate awards.
- Daily learning streaks and an achievement-badge system.
- Activity heatmap of recent learning days.

#### Quizzes & spaced repetition

- Multiple-choice quizzes with up to three attempts per question, server-side grading, and answer-reveal rules.
- Concept completion is triggered automatically once every question is answered correctly or exhausted.
- Spaced-repetition review queue with due dates, expanding intervals, and review XP.

#### Q&A

- Ask questions on any concept; instructors and admins can answer.
- On-demand "Ask AI" answers.
- Questions lock for editing once they have been answered (admins exempt).

#### AI-assisted authoring

- LLM-assisted generation of concepts and quiz questions via the NVIDIA API, rate-limited per day.

#### Analytics

- Platform-wide overview analytics plus per-roadmap, per-concept, and per-instructor breakdowns.
- Instructor dashboards including per-question correct-rate and most-missed option.

#### Developer experience

- REST API documented with Swagger at `/api/docs`.
- Backend unit test suite (~239 Jest tests over mocked TypeORM repositories) as a regression safety net; no database or network required to run it.

### Notes

- **Known limitations:** no CI pipeline yet; frontend and end-to-end tests are deferred to a later release. On free-tier hosting the backend (Render) and database (Neon) cold-start after inactivity.
- **Deployment:** backend on Render, frontend on Vercel, PostgreSQL on Neon; a push to `main` triggers the app rebuilds, and database migrations are applied separately.

[Unreleased]: https://github.com/yaswanthbb/KIP/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yaswanthbb/KIP/releases/tag/v1.0.0
