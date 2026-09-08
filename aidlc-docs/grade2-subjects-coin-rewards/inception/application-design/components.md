# Components

## Modified Components

### LearningZone
**File**: `components/learning-zone.tsx`
**Status**: Modified (existing)

**Responsibilities**:
- Manages the three grade tabs (Preschool, Grade 1, Grade 2)
- For Grade 2: delegates navigation rendering to `Grade2SubjectView`; receives `onSelectPractice` callbacks and sets `activeQuiz`
- Owns the active quiz state and launches `QuizModal`
- On quiz completion: receives `(score, totalQuestions, difficulties[])` from `QuizModal`, calls `calculateSessionCoins(difficulties)`, posts to `/api/quiz/history` with computed `coinsEarned`, and calls `onQuizComplete` on parent

**Interfaces**:
- Props: unchanged externally (`name`, `onBack`, `onQuizComplete`, `showFireworks`, `onFireworksComplete`)
- Internal state: adds no new top-level state; Grade 2 sub-navigation is owned by `Grade2SubjectView`
- `onQuizComplete` callback upstream: passes computed `coinsEarned` to parent via existing channel (`addCoins(coinsEarned)`)

---

### Grade2SubjectView *(NEW)*
**File**: `components/grade2-subject-view.tsx`
**Status**: New component

**Responsibilities**:
- Renders the Grade 2 two-level navigation: subject list (Math, Vietnamese, English) or Math sub-practice list (Addition, Subtraction, Times Table)
- Manages `selectedSubject: 'math' | null` internal state
- Clicking Math → sets `selectedSubject = 'math'`, shows practice cards with a Back button
- Clicking Vietnamese or English → calls `onSelectPractice('grade2Vietnamese')` / `onSelectPractice('grade2English')` directly (single-practice subjects launch immediately)
- Clicking Addition/Subtraction/TimesTable (inside Math sub-view) → calls `onSelectPractice('addition')` / `onSelectPractice('subtraction')` / `onSelectPractice('timesTable')`
- Back button inside Math sub-view → resets `selectedSubject` to null

**Interfaces**:
```typescript
interface Grade2SubjectViewProps {
  onSelectPractice: (practiceId: string) => void
}
```

---

### QuizModal
**File**: `components/quiz-modal.tsx`
**Status**: Modified (existing)

**Responsibilities**:
- Displays quiz questions one at a time with multiple-choice options
- Shows a difficulty badge on each question (`Easy ⭐`, `Medium ⭐⭐`, `Hard ⭐⭐⭐`)
- Tracks which questions were seen during the session (accumulates their `difficulty` values)
- On quiz completion: calls `onComplete(score, totalQuestions, difficulties)` with the full array of question difficulties

**Interface change**:
```typescript
// Before
onComplete: (score: number, totalQuestions: number) => void

// After
onComplete: (score: number, totalQuestions: number, difficulties: Difficulty[]) => void
```

---

## New Utility

### CoinRewards
**File**: `lib/coin-rewards.ts`
**Status**: New utility module (pure functions, no side effects)

**Responsibilities**:
- Defines the `Difficulty` type
- `randomDifficulty()` — returns a uniformly random difficulty level
- `dominantDifficulty(difficulties)` — determines the session's dominant difficulty (most frequent; ties broken by higher difficulty)
- `calculateSessionCoins(difficulties)` — determines the coin reward for a session based on dominant difficulty
- All functions are pure and independently testable (PBT applies per Q8=B)
