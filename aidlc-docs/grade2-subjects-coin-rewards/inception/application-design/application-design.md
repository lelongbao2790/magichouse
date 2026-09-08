# Application Design — grade2-subjects-coin-rewards

## Summary

This initiative introduces two features into the existing Next.js/TypeScript + Supabase application:

1. **Grade 2 Subject Navigation**: A new `Grade2SubjectView` component provides two-level navigation (subject cards → practice cards). The Math subject drills into Addition, Subtraction, Times Table. Vietnamese and English launch their Grade 2 quizzes directly.

2. **Difficulty-Based Coin Rewards**: A new `lib/coin-rewards.ts` utility module computes session coin rewards based on the dominant difficulty of the quiz's questions. Each question is randomly assigned Easy/Medium/Hard, which is displayed as a star badge in `QuizModal`. On completion, `QuizModal` returns the difficulty array; `LearningZone` calls `calculateSessionCoins()` to determine `coinsEarned`.

---

## New Files

| File | Type | Purpose |
|---|---|---|
| `components/grade2-subject-view.tsx` | React Component | Grade 2 two-level navigation UI |
| `lib/coin-rewards.ts` | Utility Module | Difficulty types + coin calculation pure functions |
| `automation_tests/unit/coin-rewards.test.ts` | Test | PBT + unit tests for coin calculation |

## Modified Files

| File | Change Scope | Key Changes |
|---|---|---|
| `components/learning-zone.tsx` | Major | Grade 2 tab uses `Grade2SubjectView`; `handleQuizCompleteInternal` computes coins; quizData adds difficulty + Grade 2 content |
| `components/quiz-modal.tsx` | Moderate | `onComplete` signature adds `difficulties[]`; difficulty badge displayed per question |
| `data/translations.ts` | Additive | 15 Grade 2 Vietnamese questions, 15 Grade 2 English questions, updated coin labels |

---

## Component Architecture

```
LearningZone
  ├── (Preschool tab) → category cards → QuizModal
  ├── (Grade 1 tab) → category cards → QuizModal
  └── (Grade 2 tab) → Grade2SubjectView
                          ├── Subject list: [Math] [Vietnamese] [English]
                          │     ├── Math → sub-view: [Addition] [Subtraction] [Times Table]
                          │     │              └── onSelectPractice('addition' | 'subtraction' | 'timesTable')
                          │     ├── Vietnamese → onSelectPractice('grade2Vietnamese')
                          │     └── English → onSelectPractice('grade2English')
                          └── Back button (Math sub-view only)

QuizModal (receives questions[] with difficulty field)
  ├── Renders difficulty badge per question (Easy ⭐ / Medium ⭐⭐ / Hard ⭐⭐⭐)
  └── onComplete(score, total, difficulties[])

lib/coin-rewards.ts
  ├── type Difficulty = 'easy' | 'medium' | 'hard'
  ├── randomDifficulty() → Difficulty
  ├── dominantDifficulty(Difficulty[]) → Difficulty
  └── calculateSessionCoins(Difficulty[]) → number
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Difficulty visibility | Show badge in QuizModal (Q1=A) | Educationally motivating; students see question difficulty |
| Grade 2 sub-view | New `Grade2SubjectView` component (Q2=A) | Cleaner separation; LearningZone stays manageable |
| Coin calculation location | LearningZone receives `difficulties[]` from QuizModal (Q3=B) | Keeps coin business logic centralized in LearningZone; QuizModal stays presentation-only |
| Coin utility location | New `lib/coin-rewards.ts` | Isolates domain logic; enables PBT |
| Session coin model | Dominant-difficulty single draw | Keeps game economy balanced (max 30 coins/session) |
| Grade 2 VN/EN content | 15-question static pools, 10 random per session | Variety without complexity; follows existing patterns |

---

## Interface Summary

### lib/coin-rewards.ts
```typescript
export type Difficulty = 'easy' | 'medium' | 'hard'
export function randomDifficulty(): Difficulty
export function dominantDifficulty(difficulties: Difficulty[]): Difficulty
export function calculateSessionCoins(difficulties: Difficulty[]): number
```

### components/grade2-subject-view.tsx
```typescript
interface Grade2SubjectViewProps {
  onSelectPractice: (practiceId: string) => void
}
export function Grade2SubjectView({ onSelectPractice }: Grade2SubjectViewProps): JSX.Element
```

### components/quiz-modal.tsx (updated)
```typescript
interface Question {
  question: string
  options: string[]
  correctIndex: number
  difficulty: Difficulty   // NEW
}

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (score: number, totalQuestions: number, difficulties: Difficulty[]) => void  // UPDATED
  title: string
  questions: Question[]
  icon: React.ReactNode
}
```

### components/learning-zone.tsx (internal update)
```typescript
// handleQuizCompleteInternal updated signature:
(score: number, totalQuestions: number, difficulties: Difficulty[]) => void
```
