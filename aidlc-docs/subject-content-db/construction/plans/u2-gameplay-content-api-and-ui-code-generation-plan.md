# U2 Code Generation Plan — gameplay-content-api-and-ui

**Status**: Part 1 approved — Part 2 executed 2026-09-09
**Last updated**: 2026-09-09
**Summary**: `../u2-gameplay-content-api-and-ui/code/summary.md`

All 16 steps done. Deviations: coin-display.tsx unchanged (already has `coin-value` testid);
grade2-subjects.spec.ts unchanged (no content-quiz opens in it); only `package-lock.json`
synced (npm) — `bun.lock` / `pnpm-lock.yaml` need `bun install` / `pnpm install` in Build
and Test. Local verify: 154 tests pass (12 blocking PBT); tsc clean; eslint 0 errors;
next build OK; E2E not run (needs deployed env).
**Workspace root**: `/Users/brian/Github_Repo/magichouse-dev/magichouse` (brownfield —
modify in place).

**Requirements covered**: FR-3, FR-4; AC-1, AC-2, AC-5, AC-8; NFR-1/2/7; PBT-01/PBT-A.
**Depends on**: U1 (schema, `resolve.ts`, `subject-content` service, types, `LocaleSchema`) — done.

---

## Step 1 — Dependencies  [ ]
- `bun add -d @testing-library/react@^16 @testing-library/dom@^10` (updates `package.json`
  + `bun.lock`).
- If `pnpm-lock.yaml` / `package-lock.json` are also live: run `pnpm install` /
  `npm install` so **every** lockfile records the new devDeps (Build & Test rule).
- If the registry is unavailable in this environment: **stop and report** — the RTL tests
  (Steps 8–10) cannot run; the user installs and re-runs Build & Test.

## Step 2 — `lib/quiz-session.ts`  [ ]
- `pickSessionQuestions(pool, n, rng = Math.random)` per `business-logic-model.md` §1
  (difficulty-balanced, random fallback, whole-pool when `pool ≤ n`, `[]` for empty/`n≤0`).
- Helpers: `shuffle(arr, rng)`, `sampleWithoutReplacement(arr, k, rng)`, `groupByDifficulty`.
- Pure — no React / I/O / locale imports. Import `QuestionDto` + `Difficulty` from
  `@/lib/subject-content/types`.

## Step 3 — `app/api/subjects/[key]/questions/route.ts`  [ ]
- `GET` handler per `business-logic-model.md` §4:
  `createServerClient()` → `auth.getUser()` (401) → `await params` for `key` →
  `LocaleSchema.safeParse(searchParams.get('locale') ?? 'vi')` (400 on explicit bad value)
  → `getSubjectContent()` → 404 if null → `apiSuccess(dto)` → catch → 500 + `console.error`.

## Step 4 — `lib/hooks/use-subject-questions.ts`  [ ]
- `useSubjectQuestions(key)` per `business-logic-model.md` §2 / `frontend-components.md`:
  module `Map` cache keyed `${key}:${locale}`, `useEffect([key, language, retryTick])`,
  `useRef` request-id stale guard, `phase`/`data`/`error` state, `retry()`.
- Returns `{ data, phase, isLoading, error: 'load' | 'empty' | null, retry }`.

## Step 5 — `components/quiz-modal.tsx`  [ ]
- Add props `isLoading?`, `loadError?`, `emptyError?`, `onRetry?`.
- Render precedence: `loadError` → `quiz-error` + `quiz-retry-button`; `emptyError` →
  `quiz-empty` (Close only); `isLoading` → `quiz-loading`; else existing flow.
- Add `if (!question) return null` guard before the existing question body.
- Use new `t("quiz","loading"|"loadError"|"retry"|"noQuestions")` strings.
- Difficulty badge / chrome unchanged (still `language`-driven).

## Step 6 — `data/translations.ts`  [ ]
- **Remove** all keys under `quizShapes`, `quizColors`, `quizAnimals`, `quizVietnamese`,
  `quizEnglish`, `quizVietnameseGrade2`, `quizEnglishGrade2` (incl. `title`).
- **Add** to the `quiz` section: `loading`, `loadError`, `retry`, `noQuestions` (vi/en).
- Keep everything else incl. `quizMath` / `quizAddition` / `quizSubtraction` /
  `quizTimesTable` titles.
- **Same commit as Step 7** (no dangling references).

## Step 7 — `components/learning-zone.tsx`  [ ]
- Add `CONTENT_SUBJECT_KEYS`, `useLanguage` already imported; add `useSubjectQuestions`.
- Remove: `grade2VietnameseAllQuestions`, `grade2EnglishAllQuestions`, `grade2VietnamesePool`,
  `grade2EnglishPool`, `shuffleAndTake`, and the `t("quizShapes",…)` / `quizColors` /
  `quizAnimals` / `quizVietnamese` / `quizEnglish` inline arrays in `quizData`.
- Keep all `generate*` functions (still exported + unit-tested), math `useMemo` pools,
  tab/card rendering, `Grade2SubjectView`.
- `quizData` content-subject entries → `{ title: content.data?.title ?? '', questions: sessionQuestions }`.
- `sessionQuestions = useMemo(() => …pickSessionQuestions…, [activeQuiz, content.phase])`
  (deps exclude `language` — freeze-on-open, Q1=A).
- `<QuizModal>` render: for content subjects render when `activeQuiz` set & category
  resolves (so loading/error show), passing `isLoading`/`loadError`/`emptyError`/`onRetry`.
- `handleQuizCompleteInternal` unchanged.

## Step 8 — `components/coin-display.tsx`  [ ]
- Add `data-testid="coin-display-amount"` to the numeric value element **only if** it is
  not already individually selectable (check first).

## Step 9 — `playwright.config.ts`  [ ]
- `projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]` (drop firefox,
  webkit — CL4=B).

## Step 10 — Unit tests  [ ]
- `automation_tests/unit/quiz-session.test.ts` — example: 50-q pool with known spread →
  4/4/2 session; all-hard pool → all hard, length `min(n,pool)`; 3-q pool → those 3;
  empty → `[]`; `n=0` → `[]`; determinism with a seeded rng.
- `automation_tests/unit/quiz-session.pbt.test.ts` — **PBT-A** TP-A1..A6 (fast-check).
  Generators: `questionDtoArb`, `poolArb`, seeded LCG rng.

## Step 11 — Hook + component tests (RTL)  [ ]
- `automation_tests/unit/use-subject-questions.test.tsx` — `renderHook` + mocked
  `global.fetch`: idle (key null); loading→ready; ready-from-cache; 404→error 'load';
  500→error 'load'; ok+empty→error 'empty'; `retry()` clears cache + refetches;
  stale response ignored on fast key switch.
- `automation_tests/unit/quiz-modal.test.tsx` — RTL render: loading shows `quiz-loading`;
  loadError shows `quiz-error` + `quiz-retry-button` (click → `onRetry`); emptyError shows
  `quiz-empty`, no retry; question state renders `quiz-question`.
- `automation_tests/unit/learning-zone-content.test.tsx` — RTL: content subject shows
  loading then a question (mock the hook / fetch); math subject shows no `quiz-loading`;
  toggling `language` while a fixed-subject quiz is open leaves `quiz-question` text
  unchanged (freeze).

## Step 12 — API route test  [ ]
- `automation_tests/api/subject-questions-route.api.test.ts` — `vi.mock('@/lib/supabase/server')`
  + `vi.mock('@/lib/services/subject-content')`; import the `GET` handler:
  - **TC-A025**: no user → 401 `{data:null,error}`
  - **TC-A026**: `getSubjectContent` returns `null` → 404
  - **TC-A027**: returns a known dto → 200, body shape `{ data: { title, questions:[{id,question,options,correctIndex,difficulty}] } }`, options length 3, correctIndex 0..2
  - bonus: `?locale=fr` → 400

## Step 13 — E2E specs  [ ]
- **New** `automation_tests/e2e/subject-content.spec.ts` — TC-E009–E017 (Chromium), helpers
  from `grade2-subjects.spec.ts` style. TC-E014 uses `page.route('**/api/subjects/**', …500)`.
- **Modify** `automation_tests/e2e/grade2-subjects.spec.ts` — before any post-card-click
  quiz assertion, `await page.getByTestId('quiz-loading').waitFor({ state: 'hidden' })` (or
  wait for `quiz-question`). TC-E001..E007 keep their IDs.

## Step 14 — `MANUAL-TEST-CHECKLIST.md`  [ ]
- Fill in **TC-M004** (deployed app: Vietnamese subject in Vietnamese with UI in English)
  and **TC-M005** (deployed app: coins + quiz_history for all quiz types) with the full
  text from `test-case-design.md`.

## Step 15 — Local verification  [ ]
- `bunx tsc --noEmit` — clean for U2 files
- `bunx vitest run automation_tests/unit automation_tests/api` — all pass incl. PBT-A + RTL
- `bun run lint`
- `bun run build` — the new route appears; no broken `translations` refs
- E2E: **not run locally** (needs deployed env + applied migration) — documented

## Step 16 — Documentation  [ ]
- `construction/u2-gameplay-content-api-and-ui/code/summary.md`

---

## Files

**Created**: `lib/quiz-session.ts`, `lib/hooks/use-subject-questions.ts`,
`app/api/subjects/[key]/questions/route.ts`,
`automation_tests/unit/quiz-session.test.ts`,
`automation_tests/unit/quiz-session.pbt.test.ts`,
`automation_tests/unit/use-subject-questions.test.tsx`,
`automation_tests/unit/quiz-modal.test.tsx`,
`automation_tests/unit/learning-zone-content.test.tsx`,
`automation_tests/api/subject-questions-route.api.test.ts`,
`automation_tests/e2e/subject-content.spec.ts`

**Modified**: `components/quiz-modal.tsx`, `components/learning-zone.tsx`,
`components/coin-display.tsx` (maybe), `data/translations.ts`, `playwright.config.ts`,
`package.json` (+ lockfiles), `automation_tests/e2e/grade2-subjects.spec.ts`,
`MANUAL-TEST-CHECKLIST.md`

**Untouched by U2** (U3): `app/api/admin/**`, `lib/admin-auth.ts`, admin Zod schemas,
`.env.local.example`, `vitest.config.ts`, `.github/workflows/ci.yml`.
