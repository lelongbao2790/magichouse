# U2 Code Generation — Summary

**Unit**: gameplay-content-api-and-ui
**Status**: Approved (user, 2026-09-09)
**Plan**: `construction/plans/u2-gameplay-content-api-and-ui-code-generation-plan.md`

---

## Files created

| File | Purpose |
|---|---|
| `lib/quiz-session.ts` | `pickSessionQuestions` (difficulty-balanced ~40/40/20, random fallback), `shuffle`, `sampleWithoutReplacement` — pure |
| `app/api/subjects/[key]/questions/route.ts` | `GET` — 401 / 400 (bad locale) / 404 / 500 / `apiSuccess(SubjectContentDto)` |
| `lib/hooks/use-subject-questions.ts` | `useSubjectQuestions(key)` — module `Map` cache (`${key}:${locale}`), phases idle/loading/ready/error/empty, stale-response guard, `retry()`; `__clearSubjectQuestionsCache` (test-only) |
| `automation_tests/unit/quiz-session.test.ts` | 9 example tests (TC-U090–U098) |
| `automation_tests/unit/quiz-session.pbt.test.ts` | 6 **blocking** PBT (TC-U099–U104) — PBT-A TP-A1..A6 |
| `automation_tests/unit/use-subject-questions.test.tsx` | 8 `renderHook` tests (TC-U105–U112) |
| `automation_tests/unit/quiz-modal.test.tsx` | 5 RTL render tests (TC-U113–U117) — loading / error+retry / empty / question / closed |
| `automation_tests/unit/learning-zone-content.test.tsx` | 4 RTL tests (TC-U118–U121) — content loading→question, fetch-fail→retry, math no-loading, freeze-on-language-switch |
| `automation_tests/api/subject-questions-route.api.test.ts` | 6 route-contract tests (TC-A025, A026, A027 + locale-forwarding, `?locale=fr`→400, service-throw→500) |
| `automation_tests/e2e/subject-content.spec.ts` | TC-E009–E017 (Chromium) — run against a deployed env |

## Files modified

| File | Change |
|---|---|
| `components/quiz-modal.tsx` | + `isLoading` / `loadError` / `emptyError` / `onRetry` props; render precedence load-error → empty → loading → question/results; `quiz-error` / `quiz-retry-button` / `quiz-empty` / `quiz-loading` testids; `!question` guard |
| `components/learning-zone.tsx` | hybrid `quizData` — `CONTENT_SUBJECT_KEYS` + `useSubjectQuestions`; **freeze-on-open** via `session` state + effect (`prev.key === activeQuiz` guard so a language toggle never re-picks); removed the inline `t("quizShapes",…)` / `quizColors` / `quizAnimals` / `quizVietnamese` / `quizEnglish` arrays, `grade2Vietnamese/EnglishAllQuestions`, `grade2*Pool`, `shuffleAndTake`; kept all `generate*` fns + math `useMemo` pools; `generatedQuizData` for math |
| `data/translations.ts` | removed `quizShapes` / `quizColors` / `quizAnimals` / `quizVietnamese` / `quizEnglish` / `quizVietnameseGrade2` / `quizEnglishGrade2` (incl. `title`); + `quiz.loading` / `loadError` / `retry` / `noQuestions`; kept `categories`, `quiz.*`, `quizMath` / `quizAddition` / `quizSubtraction` / `quizTimesTable` titles |
| `playwright.config.ts` | `projects` → `[chromium]` only |
| `package.json` + `package-lock.json` | + `@testing-library/react@^16.3.3`, `@testing-library/dom@^10.4.1` (devDependencies) |
| `MANUAL-TEST-CHECKLIST.md` | filled in TC-M004, TC-M005 |

## Deviations from the plan

- **`components/coin-display.tsx` NOT modified** — it already exposes `data-testid="coin-value"`
  on the numeric value; the E2E uses that (no `coin-display-amount` needed).
- **`automation_tests/e2e/grade2-subjects.spec.ts` NOT modified** — on review, none of
  TC-E001–E007 open a Vietnamese/English *content* quiz (they test card visibility + the
  Math drill-down + the Addition difficulty badge, all synchronous). No async-load await
  needed.
- **Lockfiles**: only `package-lock.json` updated here (npm). `bun.lock` and
  `pnpm-lock.yaml` also exist and are **NOT yet updated** — `bun`/`pnpm` are unavailable in
  this environment. **Build & Test MUST run `bun install` and `pnpm install`** to sync them,
  or the CI `bun install --frozen-lockfile` step fails.

## Verification (local)

| Check | Result |
|---|---|
| `npx vitest run automation_tests/unit automation_tests/api` | ✅ **154 passed** (14 files) — incl. 12 blocking PBT (PBT-A + U1's PBT-B/C) |
| `npx tsc --noEmit` | ✅ clean for U2 files (pre-existing unrelated errors remain) |
| `npx eslint .` | ✅ **0 errors** (14 warnings — 12 pre-existing + 2 `react-hooks/set-state-in-effect`, which the repo's eslint config downgrades to `warn`) |
| `npx next build --webpack` | ✅ succeeds; `/api/subjects/[key]/questions` registered as a dynamic route |
| E2E (`subject-content.spec.ts`) | ⏳ **not run locally** — needs a deployed app + applied migration (Q2=A, accepted). Red in CI until deploy. |

## Notes

- The running app still works with the OLD data path? **No** — U2 switches `learning-zone`
  to the API. After merging U2, content subjects require the migration to be applied
  (`supabase db push`) and the app deployed; before that they show the Retry UI (FR-4.3),
  they do not crash. Math practices are unaffected.
- Freeze-on-open covers the language-switch case fully: the `session` state is only
  (re)computed when `content.phase` first reaches `ready` for a *new* `activeQuiz`; a
  language toggle re-keys the hook cache and briefly returns it to `loading`, but the
  `prev.key === activeQuiz` guard keeps the frozen questions and `hasFrozenSession`
  suppresses the loading panel.
