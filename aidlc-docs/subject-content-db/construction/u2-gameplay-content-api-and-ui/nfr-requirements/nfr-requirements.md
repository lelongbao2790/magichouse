# NFR Requirements — U2 gameplay-content-api-and-ui

**Status**: Approved (user, 2026-09-09)
Light stage — inherits `requirements.md` §5; U2-specific points below.

## Performance
- **P-1** One `GET /api/subjects/[key]/questions` per content-quiz open (cache miss). Payload
  ≤ ~50 questions × ~4 short strings ≈ a few KB. Server side = U1's two indexed reads.
- **P-2** `useSubjectQuestions` module cache (`${key}:${locale}`) — reopening a subject in
  the same session is instant. Cleared on full page reload.
- **P-3** `pickSessionQuestions` is O(pool) — trivial for ≤ ~120 rows.
- **P-4** **Bundle size decreases** — ~230 lines of question strings removed from
  `data/translations.ts` (client bundle). No runtime deps added (RTL is dev-only).
- **P-5** Freeze-on-open (`useMemo` deps exclude `language`) prevents a re-fetch + reshuffle
  storm if a user toggles the language switch repeatedly during a quiz.

## Reliability
- **R-1** Every non-2xx / network error → deterministic `error='load'` → Retry UI; no
  crash, no partial quiz. 0-questions → `error='empty'` → Close-only panel.
- **R-2** Stale-response guard: switching subjects / language mid-flight never renders the
  wrong subject's questions.
- **R-3** `QuizModal` internal `if (!question) return null` guard — belt-and-suspenders
  against a 0-length `questions` prop.
- **R-4** Math practices are untouched — no new failure surface for the existing quizzes.

## Security
- **S-1** `GET /api/subjects/[key]/questions` requires `auth.getUser()` (401 otherwise) —
  same gate as every other data route. Uses the anon+cookies client; RLS applies.
- **S-2** No secrets in the client. The hook calls a same-origin relative URL.
- **S-3** `key` is an opaque path segment; an unknown value 404s (no injection surface —
  it's a parameterised Supabase `.eq('key', key)`).

## Maintainability
- **M-1** Fetch-and-classify logic lives in the hook; `pickSessionQuestions` is a separate
  pure module. Both unit-tested.
- **M-2** `translations.ts` shrinks and stops being a dumping ground for quiz content —
  subject metadata now has one home (`subjects` table).
- **M-3** `CONTENT_SUBJECT_KEYS` / `GENERATED_KEYS` constants make the hybrid split explicit.

## Testability
- **T-1** PBT-A (blocking) for `pickSessionQuestions` — `business-logic-model.md` §5.
- **T-2** Hook: `renderHook` tests (RTL) with mocked `fetch` — all 5 phases, cache, retry,
  stale guard.
- **T-3** `QuizModal`: RTL render tests for loading / error+retry / empty / question states.
- **T-4** `LearningZone`: RTL — content subject shows loading→question; math shows no
  loading; language toggle mid-quiz doesn't change question text.
- **T-5** E2E TC-E009–E017 (Chromium) — run against a deployed env; red until U2 deploy +
  `supabase db push` (Q2=A, accepted).

## Accessibility
- **A-1** Loading / error / empty panels use readable text + a real `<button>` for Retry /
  Close (keyboard-focusable). No regression to the existing modal's a11y.

## Not addressed / N/A
- Offline support, request retries with backoff (single manual Retry is enough for a kids
  quiz app).
- Coverage gate — not CI-enforced today; RTL tests are added anyway for real confidence.
