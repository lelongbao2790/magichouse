# Business Rules — U2 gameplay-content-api-and-ui

## BR-U2-1 — Session selection (`pickSessionQuestions`)

**BR-U2-1.1** `pickSessionQuestions(pool, n, rng?)` returns `min(n, pool.length)` questions,
each a distinct member of `pool` (by identity / `id`), in shuffled order.

**BR-U2-1.2** Selection is **difficulty-balanced** (Q2=B). Target bucket sizes for the
session:
```
target.easy   = round(n * 0.4)
target.medium = round(n * 0.4)
target.hard   = n - target.easy - target.medium
```
Fill each bucket by sampling (without replacement) from the pool's questions of that
difficulty. If a bucket's pool is smaller than its target, take all of them; the unfilled
remainder is then filled by sampling uniformly from the **remaining** pool (any difficulty).
Finally shuffle the combined result.

**BR-U2-1.3** When `pool.length <= n`, the result is the whole pool shuffled (balancing is
a no-op).

**BR-U2-1.4** `pickSessionQuestions` is pure — deterministic given `rng`. No React, no I/O,
no locale. Default `rng = Math.random`.

**BR-U2-1.5** Empty pool → `[]`. `n <= 0` → `[]`.

## BR-U2-2 — Fetch & cache (`useSubjectQuestions`)

**BR-U2-2.1** `useSubjectQuestions(key)` fetches `GET /api/subjects/{key}/questions?locale={L}`
where `L` is the **current** `useLanguage().language` at fetch time.

**BR-U2-2.2** Cache: a module-level `Map<string, SubjectContentDto>` keyed
`${key}:${locale}` (Q3=A). A cache hit resolves synchronously to `phase='ready'`.

**BR-U2-2.3** `key === null` → `phase='idle'`, no fetch.

**BR-U2-2.4** Response mapping:
- HTTP ok, `data.questions.length > 0` → cache it, `phase='ready'`
- HTTP ok, `data.questions.length === 0` → `phase='empty'`, `error='empty'` (not cached)
- HTTP 404 / non-ok / network throw → `phase='error'`, `error='load'`

**BR-U2-2.5** `retry()` — only meaningful when `error === 'load'`: clears the cache entry
for `${key}:${locale}` and refetches. No-op otherwise.

**BR-U2-2.6** The hook does not abort in-flight requests on `key` change; it ignores a
response whose `key`/`locale` no longer matches the current args (stale-response guard).

## BR-U2-3 — Freeze-on-open (Q1=A)

**BR-U2-3.1** When a content-subject quiz opens, `LearningZone` computes the session once —
`pickSessionQuestions(hook.data.questions, hook.data.questionsPerSession)` — and passes that
frozen array to `<QuizModal>`. It is recomputed only when `activeQuiz` changes (a new quiz
opens) — **not** when `language` changes.

**BR-U2-3.2** Changing the UI language while a quiz is open updates only chrome: the
difficulty-badge label, the buttons, the progress text, the results screen. Question and
option text do not change (true for both `fixed` and `localized` subjects).

**BR-U2-3.3** The subject **title** shown in the modal header is the value fetched at open
time; it does not re-localize mid-quiz either (consistent with BR-U2-3.2).

## BR-U2-4 — Loading / error / empty UI

**BR-U2-4.1** While `phase='loading'` for the active content quiz, `<QuizModal>` shows a
loading indicator (`data-testid="quiz-loading"`) instead of a question.

**BR-U2-4.2** `error='load'` → `<QuizModal>` shows an error message + a **Retry** button
(`data-testid="quiz-error"`, `data-testid="quiz-retry-button"`). No quiz starts. Retry calls
`hook.retry()`.

**BR-U2-4.3** `error='empty'` → `<QuizModal>` shows a "no questions yet" message with only a
Close action (`data-testid="quiz-empty"`). No Retry. (Q4=B)

**BR-U2-4.4** A generated (math) quiz never shows the loading/error/empty states — its
questions are synchronous.

## BR-U2-5 — Hybrid `quizData` in `LearningZone`

**BR-U2-5.1** For `activeQuiz ∈ GENERATED_KEYS`: behaviour unchanged — `useMemo` generators,
`t(...)` title, `randomDifficulty()` per question.

**BR-U2-5.2** For `activeQuiz ∈ CONTENT_SUBJECT_KEYS`: `useSubjectQuestions(activeQuiz)`;
title from `hook.data.title`; questions from the frozen session (BR-U2-3.1); difficulty is
the stored value from the DB (no `randomDifficulty()`).

**BR-U2-5.3** The inline `t("quizShapes","q1")`-style question arrays and the
`grade2VietnameseAllQuestions` / `grade2EnglishAllQuestions` / `shuffleAndTake` pools are
**removed** from `learning-zone.tsx`.

**BR-U2-5.4** Coin flow unchanged: `QuizModal` collects `questionDifficulties`,
`handleQuizCompleteInternal` calls `calculateSessionCoins(difficulties)` and
`POST /api/quiz/history` (fire-and-forget). With stored difficulty, the reward is now
deterministic for a given session's questions.

## BR-U2-6 — `data/translations.ts` cleanup (Q5=A)

**BR-U2-6.1** Remove **every** key (prompts, options, **and `title`**) under: `quizShapes`,
`quizColors`, `quizAnimals`, `quizVietnamese`, `quizEnglish`, `quizVietnameseGrade2`,
`quizEnglishGrade2`.

**BR-U2-6.2** Keep: `common`, `welcome`, `dashboard`, `categories`, `quiz` (labels/buttons),
`quizMath` / `quizAddition` / `quizSubtraction` / `quizTimesTable` (**title only** — math
practices still code-generated), `grade2`, `shop`, `creative`, `stickers`, `themes`,
`language`.

**BR-U2-6.3** `learning-zone.tsx` is edited in the **same change** as the key removal so the
build never references a deleted key.

## BR-U2-7 — API route (`GET /api/subjects/[key]/questions`)

**BR-U2-7.1** Auth required — `createServerClient()` → `auth.getUser()` → 401 if none.

**BR-U2-7.2** `locale` query param parsed by `LocaleSchema`; absent/invalid → default `vi`.
(An explicitly invalid value like `?locale=fr` → 400, per Zod.)

**BR-U2-7.3** `getSubjectContent(sb, key, locale)`:
- `null` → `apiError('Subject not found', 404)`
- `IncompleteQuestionError` thrown → caught → `apiError('Internal server error', 500)` +
  `console.error`
- otherwise → `apiSuccess(dto)`

**BR-U2-7.4** `params.key` is the raw path segment (no whitelist — an unknown key just 404s
via BR-U2-7.3).

## BR-U2-8 — E2E / config

**BR-U2-8.1** `playwright.config.ts` `projects` reduced to `[{ name: 'chromium', ... }]`
(CL4=B).

**BR-U2-8.2** New spec `automation_tests/e2e/subject-content.spec.ts` (TC-E009–E017).
`grade2-subjects.spec.ts` modified: any assertion that follows clicking a content-subject
card first awaits `quiz-loading` to be hidden (or `quiz-question` visible).

**BR-U2-8.3** E2E runs against a deployed environment with the migration applied (CI e2e job
uses the Vercel URL) — they are expected to fail until the user deploys U2 + runs
`supabase db push`.
