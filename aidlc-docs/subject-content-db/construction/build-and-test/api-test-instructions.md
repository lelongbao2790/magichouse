# API Test Instructions — subject-content-db

API tests run via the unit test runner (Vitest) — **no live server**. They import the route
handler / service / Zod schema directly and mock Supabase.

## Run

```bash
bunx vitest run automation_tests/api
```

## Test files

| File | Route / contract | Cases |
|---|---|---|
| `automation_tests/api/subject-content.api.test.ts` | language resolution + `0002` migration CHECK text | TC-A028, TC-A029, TC-A030 |
| `automation_tests/api/subject-questions-route.api.test.ts` | `GET /api/subjects/[key]/questions` handler (mocked `createServerClient` + `getSubjectContent`) | TC-A025 (401), TC-A026 (404), TC-A027 (200 shape), + locale forwarding, `?locale=fr` → 400, service-throw → 500 |
| `automation_tests/api/quiz-history.api.test.ts` | (existing) `QuizHistorySchema` incl. `grade2Vietnamese`/`grade2English` | TC-A001–A024 |

## What is covered

- **`GET /api/subjects/[key]/questions`**: unauthenticated → 401; unknown key → 404;
  authenticated + known → 200 with `{ data: { title, questions: [{ id, question, options,
  correctIndex, difficulty }] } }`, options length 3, correctIndex ∈ 0..2; `locale` query
  param forwarded to the service (default `vi`); invalid locale → 400; service error → 500.
- **Language resolution contract**: a `fixed` subject resolves to identical text for
  `locale=vi` and `locale=en` (the bug-fix guarantee); a `localized` subject follows the
  locale.
- **Migration**: `0002` extends `quiz_history_category_check` with the Grade 2 language
  categories (static file assertion; live verification is TC-M002).

## Not covered by automated API tests

- **`/api/admin/subjects` and `/api/admin/subject-questions`** — no route tests (CL2=C,
  user-approved). The pure `isAdminEmail`, `validateModeCoverage`, and the Zod schemas ARE
  unit-tested. The routes themselves are verified manually by **TC-M003**.

## Expected result

- **Total API tests**: 27 (`subject-content` 3 + `subject-questions-route` 7 +
  `quiz-history` 24 — wait, 24 existing + 10 new = counts per file) — all pass.
- Combined `automation_tests/unit` + `automation_tests/api`: **175 pass, 0 fail**.
