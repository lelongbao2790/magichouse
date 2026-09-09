# Domain Entities — U2 gameplay-content-api-and-ui

U2 has no persistence of its own; it consumes U1's `SubjectContentDto` and produces
client-side session state.

## Consumed (from U1)

```
SubjectContentDto {
  key: string
  title: string               // resolved for the request locale
  questionsPerSession: number  // 10
  questions: QuestionDto[]     // ALL active, resolved
}
QuestionDto { id, question, options[3], correctIndex, difficulty }
```

## U2 client types

```
// lib/quiz-session.ts
type Rng = () => number  // [0,1); default Math.random

// The session shown in <QuizModal>. Built once when a content quiz opens (Q1=A freeze).
type SessionQuestions = QuestionDto[]   // length = min(questionsPerSession, pool.length)

// lib/hooks/use-subject-questions.ts
type LoadPhase = 'idle' | 'loading' | 'ready' | 'error' | 'empty'

interface UseSubjectQuestions {
  data: SubjectContentDto | null
  phase: LoadPhase
  isLoading: boolean          // phase === 'loading'
  error: 'load' | 'empty' | null   // 'load' -> Retry ; 'empty' -> Close-only (Q4=B)
  retry: () => void           // no-op unless error === 'load'
}
```

## `QuizModal` question shape (existing, unchanged)

```
interface Question { question: string; options: string[]; correctIndex: number; difficulty: Difficulty }
```
`QuestionDto` is assignable to `Question` (extra `id` field is ignored by the modal).

## Category taxonomy (client)

```
CONTENT_SUBJECT_KEYS = ['shapes','colors','animals','vietnamese','english',
                        'grade2Vietnamese','grade2English']   // -> DB, via the hook
GENERATED_KEYS       = ['math','addition','subtraction','timesTable']  // -> in-code generators
```
Grade 2 subject nav (`grade2-subject-view.tsx`) already routes Vietnamese/English cards to
`grade2Vietnamese` / `grade2English` — unchanged.
