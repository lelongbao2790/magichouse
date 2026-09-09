# Frontend Components — U2 gameplay-content-api-and-ui

## Component: `useSubjectQuestions` (new — `lib/hooks/use-subject-questions.ts`)

```ts
export function useSubjectQuestions(key: string | null): {
  data: SubjectContentDto | null
  phase: 'idle' | 'loading' | 'ready' | 'error' | 'empty'
  isLoading: boolean
  error: 'load' | 'empty' | null
  retry: () => void
}
```

- Reads `useLanguage().language` for the `?locale=` param and the cache key.
- Module-level `const cache = new Map<string, SubjectContentDto>()`, key `${key}:${locale}`.
- `useEffect([key, language, retryTick])` runs the fetch; a `useRef` request id drops stale
  responses.
- `retry()` → if `error === 'load'`: `cache.delete(key:locale)`, `setRetryTick(t => t+1)`.

## Component: `QuizModal` (modified — `components/quiz-modal.tsx`)

New optional props:
```ts
interface QuizModalProps {
  // existing: isOpen, onClose, onComplete, title, questions, icon
  isLoading?: boolean
  loadError?: boolean
  emptyError?: boolean
  onRetry?: () => void
}
```

Render precedence inside the modal body (before the existing question/results flow):
1. `loadError` → error view: message + `<button data-testid="quiz-retry-button" onClick={onRetry}>`
   wrapped in `<div data-testid="quiz-error">`.
2. `emptyError` → empty view: "no questions yet" message + Close only,
   `<div data-testid="quiz-empty">`. (Q4=B — no retry button.)
3. `isLoading` → `<div data-testid="quiz-loading">` spinner/skeleton.
4. else → existing question / feedback / results flow (unchanged).

Guard: the existing body reads `questions[currentQuestion]` — only reached in state 4, and
`LearningZone` only enters state 4 with a non-empty `questions` array, so no `undefined`
access. Add an internal `if (!question) return null` belt-and-suspenders.

Chrome strings (`t("quiz", ...)`, difficulty badge label via `language`) continue to
localize live — only the frozen `questions`/`title` props don't change (BR-U2-3.2).

New i18n keys in `data/translations.ts` `quiz` section:
```
loading:   { vi: "Đang tải câu hỏi...",           en: "Loading questions..." }
loadError: { vi: "Không tải được câu hỏi.",        en: "Couldn't load the questions." }
retry:     { vi: "Thử lại",                        en: "Try again" }
noQuestions:{ vi: "Chưa có câu hỏi cho phần này.", en: "No questions here yet." }
```

## Component: `LearningZone` (modified — `components/learning-zone.tsx`)

- Add `CONTENT_SUBJECT_KEYS` constant + `useSubjectQuestions` call (BLM §3).
- Remove: `grade2VietnameseAllQuestions`, `grade2EnglishAllQuestions`, `grade2VietnamesePool`,
  `grade2EnglishPool`, `shuffleAndTake`, and the `t("quizShapes",...)` / `quizColors` /
  `quizAnimals` / `quizVietnamese` / `quizEnglish` inline question arrays inside `quizData`.
- Keep: `generateMathQuestion`, `generateAdditionQuestion`, `generateSubtractionQuestion`,
  `generateTimesTableQuestion`, `generateDistractors`, `insertAtRandom` (exported — still
  unit-tested), the `useMemo` math pools, `renderCategoryCard`, tab structure,
  `Grade2SubjectView` integration.
- `quizData` for content keys becomes `{ title: content.data?.title, questions: sessionQuestions }`;
  for math keys unchanged.
- `<QuizModal>` render condition: was `currentQuizData && currentCategory`. Now: for a
  content subject, render whenever `activeQuiz` is set and `currentCategory` resolves
  (so loading/error states can show); for math, unchanged.

## data-testid additions

| testid | element | component | used by |
|---|---|---|---|
| `quiz-loading` | loading container | `QuizModal` | TC-E009–E013, E017, grade2-subjects.spec |
| `quiz-error` | load-error container | `QuizModal` | TC-E014 |
| `quiz-retry-button` | retry button | `QuizModal` | TC-E014 |
| `quiz-empty` | empty-state container | `QuizModal` | component test (no E2E) |
| `coin-display-amount` | numeric coin value | `coin-display.tsx` | TC-E015 (add only if not already selectable) |

## Component tests (Vitest + jsdom, `renderHook` / RTL)

- `use-subject-questions.test.tsx` — mock `global.fetch`: idle (key null), loading→ready
  (with cache miss then hit), ready via cache, 404→error='load', 500→error='load',
  ok+empty→error='empty', retry clears cache and refetches, stale response ignored.
- `quiz-modal.test.tsx` — renders loading / error+retry / empty / question states from
  props; retry button calls `onRetry`.
- `learning-zone.test.tsx` (extend existing) — content subject: shows loading then the
  QuizModal question; math subject: no loading state; language toggle mid-quiz does not
  change the rendered question text (freeze).
