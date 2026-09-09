# Components — subject-content-db

Design choices locked (Application Design plan): Q1=A (4 nullable text columns, two tables),
Q2=A (title from `subjects`), Q3=A (difficulty stored per question), Q4=A
(`/api/subjects/[key]/questions?locale=`), Q5=A (two admin routes), Q6=A (`useSubjectQuestions`
hook + session cache).

---

## C1 — Database schema (`supabase/migrations/`)

**Type**: Infrastructure (data model)
**Purpose**: Persist subject metadata and question banks.

### Table `subjects`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `key` | `text` UNIQUE NOT NULL | matches the app category id: `shapes`, `colors`, `animals`, `vietnamese`, `english`, `grade2Vietnamese`, `grade2English` |
| `title_vi` | `text` NOT NULL | subject/quiz title, Vietnamese |
| `title_en` | `text` NOT NULL | subject/quiz title, English |
| `grade` | `text` NOT NULL | `preschool` \| `grade1` \| `grade2` |
| `target_language` | `text` NOT NULL CHECK in (`vi`,`en`) | the language the subject teaches / is authored in |
| `content_mode` | `text` NOT NULL CHECK in (`fixed`,`localized`) | `fixed` → questions stored once in `target_language`; `localized` → both `vi` + `en` |
| `questions_per_session` | `int` NOT NULL DEFAULT 10 CHECK > 0 | |
| `sort_order` | `int` NOT NULL DEFAULT 0 | |
| `created_at` / `updated_at` | `timestamptz` | trigger-maintained `updated_at` (reuse `update_updated_at_column()`) |

### Table `subject_questions`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `subject_id` | `uuid` NOT NULL FK → `subjects(id)` ON DELETE CASCADE | |
| `prompt_vi` | `text` NULL | question text, Vietnamese |
| `prompt_en` | `text` NULL | question text, English |
| `options_vi` | `jsonb` NULL | array of exactly 3 strings |
| `options_en` | `jsonb` NULL | array of exactly 3 strings |
| `correct_index` | `int` NOT NULL CHECK (0..2) | shared across locales (option order identical) |
| `difficulty` | `text` NOT NULL CHECK in (`easy`,`medium`,`hard`) | per Q3=A |
| `is_active` | `boolean` NOT NULL DEFAULT true | soft-delete / draft flag |
| `sort_order` | `int` NOT NULL DEFAULT 0 | |
| `created_at` / `updated_at` | `timestamptz` | |

**Integrity**
- Index `idx_subject_questions_subject_active` on `(subject_id, is_active)`.
- `jsonb_array_length(options_vi) = 3` / `= 3` for `options_en` where non-null (CHECK).
- Mode consistency ("`fixed` needs the target-language pair; `localized` needs both pairs")
  is enforced by a `BEFORE INSERT OR UPDATE` trigger `subject_questions_mode_check()` that
  looks up the parent subject's `content_mode` / `target_language`. Rationale: a plain CHECK
  cannot reference another table.
- `quiz_history.category` CHECK constraint **replaced** to also allow `grade2Vietnamese`,
  `grade2English` (FR-6).

**RLS** (mirrors `stickers`)
- `subjects`, `subject_questions`: `FOR SELECT USING (auth.role() = 'authenticated')`.
- No INSERT/UPDATE/DELETE policies — writes only via migration or the admin route (which
  uses the service-role client, bypassing RLS after its own email-allowlist gate).

**Seed** (idempotent, `ON CONFLICT DO NOTHING` / stable ids)
- Migration `0002_subject_content_schema.sql` — DDL only.
- Migration `0003_subject_content_seed.sql` — 7 `subjects` rows + all questions:
  migrated from `data/translations.ts` (existing correct answers taken from the
  `correctIndex` literals in `components/learning-zone.tsx`), plus ~50 Grade 2 Vietnamese
  and ~50 Grade 2 English newly authored, plus Grade 1 English re-authored to fully
  English. Difficulty assigned per question during authoring/migration.

---

## C2 — `lib/subject-content/resolve.ts` (pure)

**Type**: Application logic (pure, no I/O)
**Purpose**: Turn a `subject_questions` row + its `subjects` row + a UI locale into a
client-ready question DTO — **the language-bug fix lives here**.

**Responsibilities**
- `content_mode = 'fixed'` → always use the `subjects.target_language` columns, ignoring the
  UI locale.
- `content_mode = 'localized'` → use the columns for the requested UI locale.
- Map `options_xx jsonb` → `string[]`, pass through `correct_index` → `correctIndex` and
  `difficulty`.
- Throw `IncompleteQuestionError` if an active question is missing text the mode requires
  (caller filters/logs).

**Testable properties** (PBT-B, PBT-C — see functional design).

---

## C3 — `lib/quiz-session.ts` (pure)

**Type**: Application logic (pure)
**Purpose**: Select the per-session subset of questions.

**Responsibilities**
- `pickSessionQuestions(pool, n, rng?)` — Fisher-Yates shuffle (seedable `rng` for tests),
  take `min(n, pool.length)`.
- No dependency on React, DB, or locale.

**Testable properties** (PBT-A).

---

## C4 — `lib/admin-auth.ts` (pure)

**Type**: Application logic (pure)
**Purpose**: The admin gate check.

**Responsibilities**
- `isAdminEmail(email: string | null | undefined, allowlistCsv: string | undefined): boolean`
  — case-insensitive, trims entries, empty/undefined allowlist → `false`.
- `getAdminEmailsFromEnv()` — reads `process.env.ADMIN_EMAILS` (server-only).

**Tested** by a small unit test (not "admin API infra" — CL2=C).

---

## C5 — `lib/services/subject-content.ts`

**Type**: Application Service (data access)
**Purpose**: All Supabase reads/writes for subject content; orchestrates C2.

**Responsibilities**
- Read: `listSubjects`, `getSubjectByKey`, `getActiveQuestions`, and the orchestrator
  `getSubjectContent(supabase, key, locale)` → `{ title, questions: QuestionDto[] }`
  (resolves title by locale, maps rows through `resolveQuestion`, drops incomplete ones).
- Write (admin): `createQuestion`, `updateQuestion`, `setQuestionActive`, `deleteQuestion`.
- Accepts a `SupabaseClient<Database>` as its first arg (project convention).

---

## C6 — `app/api/subjects/[key]/questions/route.ts`

**Type**: API route (gameplay)
**Purpose**: Serve a subject's resolved question set to the authenticated player.

**Responsibilities**
- `GET` only. `createServerClient()` → `auth.getUser()` gate (401).
- Parse `key` (path) + `locale` (query, `LocaleSchema`, default `vi`).
- `getSubjectContent` → `apiSuccess({ title, questions })`; unknown key → `apiError('Subject not found', 404)`.
- 500 on unexpected error (logged), which drives the client retry UI.

---

## C7 — `app/api/admin/subjects/route.ts`

**Type**: API route (admin)
- `GET` — auth gate + `isAdminEmail` gate (401 / 403) → `listSubjects` → `apiSuccess`.

## C8 — `app/api/admin/subject-questions/route.ts`

**Type**: API route (admin)
- `GET ?subjectKey=` — list questions for a subject (incl. inactive).
- `POST` — create (`SubjectQuestionCreateSchema`).
- `PATCH` — update by `{ id, ...fields }` (`SubjectQuestionUpdateSchema`); `is_active:false`
  is the soft-delete.
- `DELETE ?id=` — hard delete.
- All methods: auth gate + `isAdminEmail` gate first. Uses the **service-role** client
  (`createAdminClient()`) for writes after the gate passes.
- **No automated route tests** (CL2=C); verified by TC-M003.

---

## C9 — `lib/hooks/use-subject-questions.ts`

**Type**: Frontend hook
**Purpose**: Fetch + cache a subject's questions for the UI.

**Responsibilities**
- `useSubjectQuestions(key: string | null)` → `{ data, isLoading, error, retry }`.
- In-memory module-level `Map` cache keyed by `${key}:${locale}`; survives modal
  open/close, cleared on page reload.
- Reads the current `locale` from `useLanguage()` and passes it as the query param.
- `retry()` clears that cache entry and refetches.

---

## C10 — `components/quiz-modal.tsx` (modified)

**Type**: Frontend component
**New responsibilities**
- New props: `isLoading?: boolean`, `loadError?: boolean`, `onRetry?: () => void`.
- Render states: **loading** (`data-testid="quiz-loading"`), **error**
  (`data-testid="quiz-error"` + `data-testid="quiz-retry-button"` calling `onRetry`),
  then the existing question/results flow.
- Unchanged: scoring, difficulty badge (now fed a real stored difficulty for content
  subjects), results, `onComplete` signature.

---

## C11 — `components/learning-zone.tsx` (modified)

**Type**: Frontend component
**New responsibilities**
- `quizData` becomes **hybrid**:
  - Math practices (`math`, `addition`, `subtraction`, `timesTable`) — unchanged in-code generators.
  - Content subjects (`shapes`, `colors`, `animals`, `vietnamese`, `english`,
    `grade2Vietnamese`, `grade2English`) — from `useSubjectQuestions(activeQuiz)`.
- When a content subject is the active quiz: call the hook, run `pickSessionQuestions` on
  its data, pass `isLoading` / `loadError` / `onRetry` to `<QuizModal>`.
- Title comes from the hook's `data.title` (content subjects) or `t(...)` (math).
- Remove the inline `t("quizShapes", "q1")`-style question arrays and the
  `grade2Vietnamese/English` pools.

---

## C12 — `data/translations.ts` (modified)

- **Remove**: every `quizShapes` / `quizColors` / `quizAnimals` / `quizVietnamese` /
  `quizEnglish` / `quizVietnameseGrade2` / `quizEnglishGrade2` key (questions, options,
  **and** `title` — titles now come from `subjects`, Q2=A).
- **Keep**: `categories`, `quiz.*` labels/buttons, and every non-quiz section.
- `quizMath` / `quizAddition` / `quizSubtraction` / `quizTimesTable` — **keep** (math titles
  are still UI chrome for in-code practices).

---

## C13 — `lib/database.types.ts` + `lib/validation/api.ts` (modified)

- `database.types.ts`: add `subjects` and `subject_questions` table types; export
  `SubjectRow`, `SubjectQuestionRow`.
- `api.ts`: add `LocaleSchema`, `SubjectQuestionCreateSchema`, `SubjectQuestionUpdateSchema`.

---

## C14 — `.env.local.example` + `playwright.config.ts` + `.github/workflows/ci.yml` (modified)

- `.env.local.example`: document `ADMIN_EMAILS`.
- `playwright.config.ts`: `projects` reduced to `chromium` only (CL4=B).
- `ci.yml`: `INITIATIVE` env var updated to `subject-content-db` (Build & Test).
- `vitest.config.ts`: add `!app/api/admin/**` to the coverage `include` (CL2=C).
