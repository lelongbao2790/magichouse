# Units of Work — subject-content-db

**Status**: Approved (user, 2026-09-09)
**Last updated**: 2026-09-09
**Architecture**: Monolith (Next.js). Units are logical modules within one deployable app,
built and shipped in sequence.

---

## U1 — content-schema-and-service

**Goal**: Establish the database, the language-resolution logic, the read service, and all
seed content. Everything else depends on this.

### Scope (components)
- **C1** — `supabase/migrations/0002_subject_content_schema.sql`
  - `subjects` table (see application-design.md §3)
  - `subject_questions` table (4 nullable `*_vi`/`*_en` columns, `correct_index`,
    `difficulty NOT NULL`, `is_active`, `sort_order`)
  - index `idx_subject_questions_subject_active (subject_id, is_active)`
  - CHECK: `options_*` length 3 when non-null; `correct_index` in 0..2
  - trigger `subject_questions_mode_check()` — validates locale coverage vs the parent
    subject's `content_mode` / `target_language`
  - RLS: `authenticated` SELECT on both tables (mirror `stickers`)
  - reuse `update_updated_at_column()` for both tables' `updated_at`
  - **replace** `quiz_history` category CHECK to add `grade2Vietnamese`, `grade2English`
  - idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP … IF EXISTS` for the policy/constraint)
- **C1 seed** — `supabase/migrations/0003_subject_content_seed.sql`
  - 7 `subjects` rows (stable UUIDs or `key`-based upsert), `ON CONFLICT (key) DO NOTHING`
  - `subject_questions` rows:
    - migrate `shapes` (10), `colors` (10), `animals` (10) — both `vi` + `en`, correct
      answers from the `correctIndex` literals currently in `learning-zone.tsx`
    - migrate grade1 `vietnamese` (3) — Vietnamese only (`fixed`)
    - migrate grade1 `english` (10) — **re-authored fully English** (`fixed`, `target=en`)
    - migrate grade2 `grade2Vietnamese` (15) + author up to ~50 — Vietnamese only
    - migrate grade2 `grade2English` (15) + author up to ~50 — English only
    - every row gets a `difficulty` (`easy`/`medium`/`hard`) assigned during authoring
    - idempotent: deterministic ids + `ON CONFLICT (id) DO NOTHING`
- **C2** — `lib/subject-content/resolve.ts` (pure)
  - `resolveQuestion(row, subject, uiLocale)` — `fixed` → target-language columns
    (ignore `uiLocale`); `localized` → `uiLocale` columns; throws `IncompleteQuestionError`
  - `resolveTitle(subject, uiLocale)` — always follows `uiLocale`
  - `rowToDto` / `dtoToWritePayload` — round-trip mappers
- **C5 (reads)** — `lib/services/subject-content.ts`
  - `listSubjects`, `getSubjectByKey`, `getActiveQuestions`, `getSubjectContent(sb, key, locale)`
  - (write fns declared but wired/tested in U3)
- **C13 (types)** — `lib/database.types.ts`: add `subjects` + `subject_questions` Row/Insert/Update
  types, export `SubjectRow`, `SubjectQuestionRow`; `lib/validation/api.ts`: add `LocaleSchema`

### Tests (U1)
- Unit: `resolveQuestion` (fixed vs localized, IncompleteQuestionError), `resolveTitle`,
  `rowToDto`/`dtoToWritePayload`
- **PBT (blocking)**: PBT-B (language resolution invariance), PBT-C (row↔DTO round-trip);
  arbitraries in `automation_tests/unit/_arbitraries.ts` (PBT-07)
- API/static: **TC-A028**, **TC-A029** (resolution via service), **TC-A030** (migration file
  contains the extended CHECK)
- Service reads tested with a mocked Supabase client (project pattern)

### Acceptance (U1)
FR-1, FR-2, FR-6; AC-3 (seed counts), AC-4 (build stays green — types compile), AC-7
(CHECK allows the categories). PBT-01 property list documented in U1 functional design.

### Manual follow-ups seeded by U1
TC-M001 (content review), TC-M002 (migration applied) → added to `MANUAL-TEST-CHECKLIST.md`.

---

## U2 — gameplay-content-api-and-ui

**Goal**: The player-facing path — fetch, select, render — including the visible bug fix
and the loading/error UX. **Depends on U1.**

### Scope (components)
- **C3** — `lib/quiz-session.ts`: `pickSessionQuestions(pool, n, rng?)` (pure, Fisher-Yates,
  seedable)
- **C6** — `app/api/subjects/[key]/questions/route.ts`: `GET`, auth gate, `LocaleSchema`
  query parse, `getSubjectContent` → `apiSuccess` / 404 / 500
- **C9** — `lib/hooks/use-subject-questions.ts`: fetch + module cache keyed `key:locale`,
  reads locale from `useLanguage()`, exposes `retry()`
- **C10** — `components/quiz-modal.tsx`: `isLoading` / `loadError` / `onRetry` props;
  `quiz-loading`, `quiz-error`, `quiz-retry-button` testids; difficulty badge now fed the
  stored difficulty for content subjects
- **C11** — `components/learning-zone.tsx`: hybrid `quizData` (content subjects via hook +
  `pickSessionQuestions`; math practices unchanged); title from `data.title`
- **C12** — `data/translations.ts`: remove `quizShapes/quizColors/quizAnimals/quizVietnamese/
  quizEnglish/quizVietnameseGrade2/quizEnglishGrade2` keys **including `title`** (done in the
  same commit as C11 so there is no broken intermediate state); keep `categories`, `quiz.*`,
  and the math quiz titles
- **C14 (partial)** — `playwright.config.ts` → Chromium-only

### Tests (U2)
- Unit: `pickSessionQuestions` (min(n,pool), subset, no dups, empty pool, n>pool, n=0)
- **PBT (blocking)**: PBT-A (selection invariants)
- Component: `QuizModal` loading / error+retry render; `LearningZone` content-subject path
  (mocked hook)
- API: **TC-A025** (401), **TC-A026** (unknown key 404), **TC-A027** (response shape)
- E2E (Chromium): **TC-E009–TC-E017** in `automation_tests/e2e/subject-content.spec.ts`;
  **modify** `grade2-subjects.spec.ts` to await `quiz-loading` hidden before quiz assertions

### Acceptance (U2)
FR-3, FR-4; AC-1, AC-2, AC-5, AC-8.

---

## U3 — admin-content-api

**Goal**: The admin CRUD path and its allowlist gate. **Depends on U1.**

### Scope (components)
- **C4** — `lib/admin-auth.ts`: `isAdminEmail(email, allowlistCsv)`, `getAdminEmails()`
- **C13 (admin schemas)** — `lib/validation/api.ts`: `SubjectQuestionCreateSchema`,
  `SubjectQuestionUpdateSchema` (+ `OptionsSchema`) — additive edit
- **C5 (writes)** — wire `createQuestion` / `updateQuestion` / `deleteQuestion` /
  `setQuestionActive` + `listAllQuestionsForSubject` in `lib/services/subject-content.ts`
- **C7** — `app/api/admin/subjects/route.ts`: `GET`, auth + `isAdminEmail` gate
- **C8** — `app/api/admin/subject-questions/route.ts`: `GET ?subjectKey=`, `POST`, `PATCH`,
  `DELETE ?id=`; auth + admin gate; `createAdminClient()` for writes
- **C14 (partial)** — `.env.local.example` gains `ADMIN_EMAILS`; `vitest.config.ts` coverage
  `include` gains `!app/api/admin/**`

### Tests (U3)
- Unit: `isAdminEmail` (allowlisted, not listed, empty env, case-insensitive, whitespace);
  `SubjectQuestionCreateSchema` / `UpdateSchema` (valid, option count ≠ 3, `correct_index`
  out of range, bad difficulty, missing locale pair)
- **No automated route tests** for C7/C8 (CL2=C) — `app/api/admin/**` excluded from coverage
- Manual: **TC-M003** (allowlist gate on the deployed env) added to `MANUAL-TEST-CHECKLIST.md`

### Acceptance (U3)
FR-5; AC-6 (verified manually via TC-M003).

---

## Build & Test (after all units)
- `MANUAL-TEST-CHECKLIST.md` finalized (TC-M001–TC-M005)
- `.github/workflows/ci.yml`: `INITIATIVE` → `subject-content-db`; confirm PBT seed logging
  in the unit-test step (PBT-08)
- Full run: lint, typecheck, unit + PBT + API (Vitest), E2E (Playwright Chromium)
- Coverage ≥ 80% lines on the (non-excluded) globs

---

## Code organization
Brownfield — use the existing structure. New files land in `lib/`, `lib/services/`,
`lib/subject-content/`, `lib/hooks/`, `app/api/subjects/`, `app/api/admin/`,
`supabase/migrations/`, `automation_tests/`. No new top-level directories beyond
`lib/subject-content/` and `lib/hooks/`.
