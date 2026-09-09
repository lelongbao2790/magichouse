# Application Design (Consolidated) — subject-content-db

**Status**: Approved (user, 2026-09-09)
**Last updated**: 2026-09-09

Consolidates `components.md`, `component-methods.md`, `services.md`, `component-dependency.md`.

---

## 1. Design at a glance

```
+---------------------------------------------------------------+
|  Frontend (client)                                            |
|  LearningZone --- useSubjectQuestions(key) --- QuizModal      |
|       |                    |                    (loading /    |
|  pickSessionQuestions      |                     error+retry) |
|  (pure, PBT-A)             |                                  |
+--------------------------- | ---------------------------------+
                             |  HTTP (auth cookie)
             +---------------+----------------+
             |                                |
   GET /api/subjects/[key]/questions   /api/admin/subjects
        ?locale=                       /api/admin/subject-questions
             |  auth gate                     |  auth gate + isAdminEmail (C4)
             v                                v
   +---------------------------------------------------------+
   |  lib/services/subject-content.ts  (data access + orchestration)   |
   |     getSubjectContent()  -->  lib/subject-content/resolve.ts      |
   |                                (fixed vs localized — BUG FIX, PBT-B)|
   +---------------------------------------------------------+
             |  createServerClient (anon, RLS)   |  createAdminClient (service role)
             v                                   v
   +---------------------------------------------------------+
   |  Supabase Postgres                                       |
   |    subjects              (7 rows)                        |
   |    subject_questions     (~50 G2-VI, ~50 G2-EN, +rest)   |
   |    quiz_history          (category CHECK extended)       |
   +---------------------------------------------------------+
```

---

## 2. Components

| ID | Component | Layer | New/Modified | Unit |
|---|---|---|---|---|
| C1 | `subjects` + `subject_questions` schema + `quiz_history` CHECK fix (migrations `0002`, `0003`) | DB | New | U1 |
| C2 | `lib/subject-content/resolve.ts` — `resolveQuestion` / `resolveTitle` / round-trip mappers (pure) | Logic | New | U1 |
| C3 | `lib/quiz-session.ts` — `pickSessionQuestions` (pure) | Logic | New | U2 |
| C4 | `lib/admin-auth.ts` — `isAdminEmail` / `getAdminEmails` (pure) | Logic | New | U3 |
| C5 | `lib/services/subject-content.ts` — reads + orchestrator + admin writes | Service | New | U1 (+writes wired in U3) |
| C6 | `app/api/subjects/[key]/questions/route.ts` — GET (gameplay) | API | New | U2 |
| C7 | `app/api/admin/subjects/route.ts` — GET | API | New | U3 |
| C8 | `app/api/admin/subject-questions/route.ts` — GET/POST/PATCH/DELETE | API | New | U3 |
| C9 | `lib/hooks/use-subject-questions.ts` — fetch + session cache | Frontend | New | U2 |
| C10 | `components/quiz-modal.tsx` — loading / error+retry states | Frontend | Modified | U2 |
| C11 | `components/learning-zone.tsx` — hybrid `quizData` (DB content vs generated math) | Frontend | Modified | U2 |
| C12 | `data/translations.ts` — remove migrated question + title keys | Data | Modified | U2 |
| C13 | `lib/database.types.ts` (+ table types), `lib/validation/api.ts` (+ Locale/admin schemas) | Types | Modified | U1 (types) / U3 (admin schemas) |
| C14 | `.env.local.example`, `playwright.config.ts`, `.github/workflows/ci.yml`, `vitest.config.ts` | Config | Modified | U3 / Build&Test |

---

## 3. Schema (finalized — Q1=A, two tables)

`subjects(id, key UQ, title_vi, title_en, grade, target_language[vi|en],
content_mode[fixed|localized], questions_per_session=10, sort_order, created_at, updated_at)`

`subject_questions(id, subject_id FK cascade, prompt_vi?, prompt_en?, options_vi jsonb?,
options_en jsonb?, correct_index[0..2], difficulty[easy|medium|hard], is_active=true,
sort_order, created_at, updated_at)`

- CHECK: `options_*` length 3 when non-null; `correct_index` 0..2.
- Trigger `subject_questions_mode_check()` — enforces the parent subject's
  `content_mode`/`target_language` locale coverage on insert/update.
- Index `(subject_id, is_active)`.
- RLS: authenticated `SELECT` only (mirrors `stickers`).
- `quiz_history_category_check` replaced to add `grade2Vietnamese`, `grade2English`.

### Subject rows (seed)

| key | grade | target_language | content_mode | source |
|---|---|---|---|---|
| `shapes` | preschool | vi | localized | migrate 10 |
| `colors` | preschool | vi | localized | migrate 10 |
| `animals` | preschool | vi | localized | migrate 10 |
| `vietnamese` | grade1 | vi | fixed | migrate 3 |
| `english` | grade1 | en | fixed | migrate 10, **re-authored fully English** (C5 answer) |
| `grade2Vietnamese` | grade2 | vi | fixed | migrate 15 + author to ~50 |
| `grade2English` | grade2 | en | fixed | migrate 15 + author to ~50 |

(`content_mode` for preschool = `localized` because they carry meaningful `vi` **and** `en`
today; the language subjects = `fixed`.)

---

## 4. Key behaviours

- **Bug fix**: `resolveQuestion` uses `subject.target_language` columns for `fixed`
  subjects, ignoring the request `locale`. `resolveTitle` always follows the UI `locale`
  (title is chrome).
- **Session selection**: server returns *all active* questions; `pickSessionQuestions`
  (client, pure) takes `questions_per_session` (10), shuffled.
- **Difficulty**: stored per question (Q3=A); feeds the badge and `calculateSessionCoins`.
  Math practices keep `randomDifficulty()`.
- **Admin gate**: `isAdminEmail(user.email, process.env.ADMIN_EMAILS)`; writes use the
  service-role client after the gate.
- **Failure UX**: any non-2xx from C6 → `useSubjectQuestions` sets `error` →
  `QuizModal` shows `quiz-error` + `quiz-retry-button`; no quiz starts.

---

## 5. Design patterns used (all pre-existing in the repo)

- Service layer: pure async fns taking `SupabaseClient<Database>` (`lib/services/*`).
- API route: `createServerClient` → `auth.getUser()` → Zod → service → `apiSuccess`/`apiError`.
- Idempotent SQL migrations (`IF NOT EXISTS`, `ON CONFLICT`).
- Context + hook for client state (`useLanguage`, new `useSubjectQuestions`).
- RLS-per-authenticated-user; service-role only server-side.

## 6. Alternatives considered

- **3rd `subject_question_texts` table** (fully normalized) — rejected (Q1=A) to keep the
  two-table answer and simpler joins; the 4-column form is adequate at this scale.
- **Server-side session selection** — rejected (FR-3.3) so the selection logic is
  DB-free and property-testable.
- **Keeping titles in `translations.ts`** — rejected (Q2=A) to keep subject metadata in one
  place.
- **`is_admin` column / Supabase claim** — rejected (C3=A) for the simpler env allowlist.

## 7. Impact on existing code

| File | Change |
|---|---|
| `components/learning-zone.tsx` | large — remove inline question arrays, add hook + hybrid `quizData` |
| `components/quiz-modal.tsx` | medium — new props + loading/error render branches + testids |
| `data/translations.ts` | large deletion — ~230 lines of question keys removed |
| `lib/database.types.ts` | add 2 table types |
| `lib/validation/api.ts` | add `LocaleSchema` + 2 admin schemas |
| `automation_tests/e2e/grade2-subjects.spec.ts` | await async load before quiz assertions |
| `playwright.config.ts` | Chromium-only |
| `vitest.config.ts` | coverage `include` gains `!app/api/admin/**` |
| `.github/workflows/ci.yml` | `INITIATIVE` → `subject-content-db`; seed logging note |
| `.env.local.example` | `ADMIN_EMAILS` |

## 8. Open items for Functional Design (per unit)
- Exact trigger SQL for `subject_questions_mode_check()`.
- The `IncompleteQuestionError` handling policy (skip + warn vs 500).
- `pickSessionQuestions` RNG injection shape for deterministic PBT.
- Difficulty distribution guidance for the ~100 authored questions.
- Whether `useSubjectQuestions` should also expose the raw pool count (for a future
  "N questions available" UI) — likely no.
