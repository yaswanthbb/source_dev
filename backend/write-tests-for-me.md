# Backend manual tests — §1 role collapse + §12 QA discussion

Base URL used below: `http://localhost:3000`. Run the backend with `npm run start:dev`.
Tokens: after each login, export the token, e.g. `export A=<accessToken>`.

## 0. Setup — three users

### 0.1 Register developer A (future content author)
- **Endpoint:** `POST /auth/register`
- **Payload:**
  ```json
  { "email": "deva@test.dev", "password": "Password123!", "name": "Dev A" }
  ```
- **Expected:** `201`, `user.role === "developer"`, no `instructorProfile` key on the user object.

### 0.2 Register developer B (other developer)
- **Endpoint:** `POST /auth/register`
- **Payload:**
  ```json
  { "email": "devb@test.dev", "password": "Password123!", "name": "Dev B" }
  ```
- **Expected:** `201`, `user.role === "developer"`.

### 0.3 Promote yourself to admin (no seed exists — do it in SQL)
```sql
UPDATE users SET role = 'admin' WHERE email = 'deva@test.dev';
-- then log in again to get an admin-tokenized JWT
-- (or register a third user and promote that one instead,
--  keeping Dev A a plain developer)
```
- **Endpoint:** `POST /auth/login` with that user's credentials.
- **Expected:** `200`, `user.role === "admin"`. Export as `ADMIN`.

> Tip: keep three tokens: `A` (developer+author), `B` (developer), `ADMIN`.

---

## 1. Roles (§1)

### 1.1 Profile has no instructor baggage
- **Endpoint:** `GET /users/me` (header `Authorization: Bearer $A`)
- **Expected:** `200`, `role: "developer"`, response has **no** `instructorProfile` property.

### 1.2 Old instructor endpoints are gone (all as `ADMIN`)
| Endpoint | Expected |
|---|---|
| `GET /users/instructor-applications` | `404` |
| `PATCH /users/<id>/promote-to-instructor` | `404` |
| `PATCH /users/<id>/demote-to-student` | `404` |
| `PATCH /users/<id>/degrade-to-student` | `404` |
| `PATCH /users/<id>/approve-instructor` | `404` |
| `PATCH /users/<id>/reject-instructor` | `404` |
| `PATCH /users/me/instructor-bio` + `{"bio":"hi"}` | `404` |

### 1.3 Admin user list — role filter only
- **Endpoint:** `GET /users?role=developer` (as `ADMIN`)
- **Expected:** `200` array; every entry `role: "developer"`, no `instructorProfile`.
- **Endpoint:** `GET /users?role=student` (as `ADMIN`)
- **Expected:** `400` (old enum value rejected by validation).
- **Endpoint:** `GET /users?search=deva` (as `ADMIN`)
- **Expected:** `200`, matches by name/email.

### 1.4 Any developer can author content (no approval gate)
- **Endpoint:** `POST /concepts` (as `A`)
- **Payload:**
  ```json
  { "title": "Closures in JS", "content": "A closure is a function bundled with its lexical scope. Extended body to pass validation.", "difficulty": "medium" }
  ```
- **Expected:** `201`, `authorId === <A's id>`, `reviewStatus === "pending"`. Save as `CONCEPT`.

### 1.6 Visibility — author sees own draft, others don't, admin does
- **Endpoint:** `GET /concepts/$CONCEPT` (as `A`)
- **Expected:** `200` (own pending draft visible).
- **Endpoint:** `GET /concepts/$CONCEPT` (as `B`)
- **Expected:** `404` (someone else's pending draft hidden).
- **Endpoint:** `GET /concepts/$CONCEPT` (as `ADMIN`)
- **Expected:** `200`.
- **Endpoint:** `GET /concepts` (as `B`)
- **Expected:** `200` array **without** the pending concept (only approved + B's own).

### 1.7 Asking on an invisible concept fails (no leak)
- **Endpoint:** `POST /concepts/$CONCEPT/qa-questions` (as `B`) with `{ "body": "can I ask?", "target": "discussion" }`
- **Expected:** `404` — B can't see the draft, so B can't ask on it either.
- **Endpoint:** `GET /concepts/$CONCEPT/qa-questions` (as `B`)
- **Expected:** `404` for the same reason.

### 1.8 Admin approves the concept (unlocks §2 tests)
- **Endpoint:** `PATCH /admin/content-review/$CONCEPT/approve` (as `ADMIN`)
- **Expected:** `200`, `reviewStatus === "approved"`.
- **Endpoint:** `GET /concepts/$CONCEPT` (as `B`)
- **Expected:** `200` now — approved concepts are visible to every developer.

---

## 2. QA discussion (§12)

Prerequisite: `$CONCEPT` approved in 1.8 (authored by `A`, now visible to all).

### 2.1 Post a public discussion question (as B)
- **Endpoint:** `POST /concepts/$CONCEPT/qa-questions` (as `B`)
- **Payload:**
  ```json
  { "body": "Why would I pick a closure over a class?", "target": "discussion" }
  ```
- **Expected:** `201` with `askerId === <B's id>`. Save as `Q`.

### 2.2 Ask AI — private answer (as B)
- **Endpoint:** `POST /concepts/$CONCEPT/qa-questions` (as `B`)
- **Payload:**
  ```json
  { "body": "Explain closures simply", "target": "ai" }
  ```
- **Expected:** `201`, `answers` has 1 entry with `isAiAnswer: true`, `responderId: null`. Save question as `QAI`.

### 2.3 Old target value rejected
- **Endpoint:** `POST /concepts/$CONCEPT/qa-questions` (as `B`)
- **Payload:** `{ "body": "x", "target": "instructor" }`
- **Expected:** `400`.

### 2.4 Discussion list — AI privacy per viewer
- **Endpoint:** `GET /concepts/$CONCEPT/qa-questions` (as `B`, the asker)
- **Expected:** `200`; `QAI` includes the AI answer (`responderName: "AI Assistant"`).
- **Endpoint:** same (as `A`, not the asker)
- **Expected:** `200`; `QAI` shows **no** AI answer (empty `answers` unless humans replied).
- **Endpoint:** same (as `ADMIN`)
- **Expected:** `200`; AI answer visible (admin exception).
- **Shape check (any viewer):** question has `askerId`/`askerName` (no `student*` keys); answers have `responderId`/`responderName`, `isAiAnswer`, `isVerified`.

### 2.5 Any developer can answer — author/admin auto-verified (as A answers B's question)
- **Endpoint:** `POST /qa-questions/$Q/answers` (as `A`)
- **Payload:** `{ "body": "A closure keeps state without a class instance." }`
- **Expected:** `201`, `responderId === <A's id>`, **`isVerified: true`** (author answers are authoritative on arrival). Save as `ANS`.
- **Repeat as `B`** (answering own question is allowed) — expect `201` with **`isVerified: false`**. Save as `ANS2`.
- **Repeat as `ADMIN`** on the same question — expect `201` with **`isVerified: true`**.

### 2.6 Verify — for other developers' answers
- **Endpoint:** `PATCH /answers/$ANS2/verify` (as `A`, the concept author)
- **Expected:** `200`, `isVerified: true`, `verifiedByUserId === <A's id>`, `verifiedAt` set.
- **Endpoint:** `PATCH /answers/$ANS2/unverify` (as `A`)
- **Expected:** `200`, `isVerified: false`, `verifiedByUserId: null`, `verifiedAt: null`.
- **Re-verify as `A`** (leave verified for the sort check in 2.8).
- **Endpoint:** `PATCH /answers/$ANS2/verify` (as `B`, not the author)
- **Expected:** `403`.
- **Endpoint:** `PATCH /answers/$ANS2/unverify` (as `ADMIN`)
- **Expected:** `200` (admin bypass works).

### 2.7 AI answers cannot be verified
- Get the AI answer id from 2.4 (`B`'s view of `QAI`), call `PATCH /answers/<ai-id>/verify` (as `ADMIN`)
- **Expected:** `403`.

### 2.8 Verified-first ordering
- **Endpoint:** `GET /concepts/$CONCEPT/qa-questions` (as `B`)
- **Expected:** within `Q`'s answers, the verified answer comes **before** older unverified ones regardless of `createdAt`.

### 2.9 Edit lock — any answer freezes the question
- **Endpoint:** `PATCH /qa-questions/$Q` + `{ "body": "edited?" }` (as `B`, asker; `Q` has human answers)
- **Expected:** `403` (answered questions can't be edited).
- **Endpoint:** `PATCH /qa-questions/$QAI` + `{ "body": "edited?" }` (as `B`; only a private AI answer exists)
- **Expected:** `403` as well — editing would strand a stale AI reply.
- **Endpoint:** `PATCH /qa-questions/$Q` + `{ "body": "edited by admin" }` (as `ADMIN`)
- **Expected:** `200` (admin bypass).

### 2.10 Answer edit/delete by author
- **Endpoint:** `PATCH /answers/$ANS` + `{ "body": "updated answer" }` (as `A`)
- **Expected:** `200`.
- **Endpoint:** `PATCH /answers/$ANS` + `{ "body": "hijack" }` (as `B`)
- **Expected:** `403`.
- **Endpoint:** `DELETE /answers/$ANS` (as `ADMIN`)
- **Expected:** `200` (admin bypass; question `Q` remains).

---

## 3. Analytics (retargeted, §1)

### 3.1 Admin overview — developer counts
- **Endpoint:** `GET /admin/analytics/overview` (as `ADMIN`)
- **Expected:** `200` with `totalDevelopers` (≥2), `totalAdmins` (≥1), `activeDevelopers`; **no** `totalStudents`/`totalInstructors` keys.

### 3.2 Admin per-developer table (renamed route)
- **Endpoint:** `GET /admin/analytics/developers` (as `ADMIN`)
- **Expected:** `200` array; entries use `developerId` (no `instructorId`); includes Dev A with `conceptsAuthored ≥ 1`.
- **Endpoint:** `GET /admin/analytics/instructors` (as `ADMIN`)
- **Expected:** `404` (old route gone).

### 3.3 Developer my-analytics (renamed route, no approval check)
- **Endpoint:** `GET /developer/my-analytics/overview` (as `A`)
- **Expected:** `200` with `roadmapsCreated`, `conceptsAuthored ≥ 1`, `questionsAnswered`, `developersEngaged` (no `studentsEngaged`).
- **Endpoint:** `GET /instructor/my-analytics/overview` (as `A`)
- **Expected:** `404` (old route gone).

---

## 4. AI-generate guard (§1)

### 4.1 Developer can check quota
- **Endpoint:** `GET /ai-generate/quota` (as `B`)
- **Expected:** `200`, `{ remaining, limit }` (no approval-gate `403`).
