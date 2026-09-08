# Component Methods

## lib/coin-rewards.ts (New Utility)

### `type Difficulty`
```typescript
export type Difficulty = 'easy' | 'medium' | 'hard'
```

### `randomDifficulty(): Difficulty`
- **Purpose**: Uniformly randomly assigns a difficulty to a question
- **Input**: none
- **Output**: `'easy' | 'medium' | 'hard'` with equal ~33% probability each
- **Side effects**: none (uses Math.random())

### `dominantDifficulty(difficulties: Difficulty[]): Difficulty`
- **Purpose**: Finds the difficulty that appears most frequently in a session's question list
- **Input**: `difficulties` — array of per-question Difficulty values
- **Output**: The most-frequent Difficulty; tie-broken by higher difficulty (`hard` > `medium` > `easy`)
- **Edge case**: Empty array → returns `'easy'`
- **Side effects**: none (pure)

### `calculateSessionCoins(difficulties: Difficulty[]): number`
- **Purpose**: Computes the total coin reward for a completed quiz session
- **Input**: `difficulties` — array of per-question Difficulty values (all questions in session)
- **Output**: Integer coin amount:
  - Dominant = `'easy'`: random integer in `[5, 10]`
  - Dominant = `'medium'`: random integer in `[10, 30]`
  - Dominant = `'hard'`: random integer in `[10, 30]`
- **Side effects**: none (pure; uses Math.random() for the final draw only)
- **Note**: PBT will verify output ranges are always within spec

---

## components/grade2-subject-view.tsx (New Component)

### Internal state: `selectedSubject: 'math' | null`
- Starts as `null` (showing subject list)
- Set to `'math'` when user clicks Math card
- Reset to `null` on Back button press

### `handleSubjectClick(subjectId: string): void`
- **Purpose**: Handles subject card clicks at the top level
- **Input**: `subjectId` — `'math'`, `'vietnamese'`, or `'english'`
- **Behavior**:
  - `'math'` → sets `selectedSubject = 'math'`
  - `'vietnamese'` / `'english'` → calls `props.onSelectPractice('grade2Vietnamese')` / `props.onSelectPractice('grade2English')`

### `handlePracticeClick(practiceId: string): void`
- **Purpose**: Handles practice card clicks inside the Math sub-view
- **Input**: `practiceId` — `'addition'`, `'subtraction'`, `'timesTable'`
- **Behavior**: Calls `props.onSelectPractice(practiceId)`

### `handleBack(): void`
- **Purpose**: Returns from Math sub-view to subject list
- **Behavior**: Sets `selectedSubject = null`

---

## components/quiz-modal.tsx (Modified)

### Updated internal state
- Adds `questionDifficulties: Difficulty[]` — accumulates the difficulty of each question shown during the session

### `handleAnswer(index: number): void` (modified)
- Existing behavior retained
- **Addition**: when an answer is selected (first selection only), pushes `questions[currentQuestion].difficulty` onto `questionDifficulties`

### `handleFinish(): void` (modified)
- **Before**: calls `onComplete(score, questions.length)`
- **After**: calls `onComplete(score, questions.length, questionDifficulties)`

### `handleClose(): void` (modified)
- Resets `questionDifficulties` to `[]` on close (alongside existing resets)

---

## components/learning-zone.tsx (Modified)

### `handleQuizCompleteInternal(score, totalQuestions, difficulties)` (modified)
- **Before**: `(score: number, totalQuestions: number) => void` with hardcoded `coinsEarned: 10`
- **After**: `(score: number, totalQuestions: number, difficulties: Difficulty[]) => void`
- **Behavior**:
  1. Calls `calculateSessionCoins(difficulties)` → `coinsEarned`
  2. POSTs to `/api/quiz/history` with computed `coinsEarned`
  3. Calls `onQuizComplete(activeQuiz!, score, totalQuestions)` (parent unchanged)
  4. Parent's `addCoins(coinsEarned)` call uses the computed amount

### `quizData` object (modified)
- All question arrays gain a `difficulty: randomDifficulty()` field per question
- For static question arrays (shapes, colors, animals, vietnamese-grade1, english-grade1): difficulty assigned at `quizData` construction time using `randomDifficulty()`
- For generated questions (addition, subtraction, timesTable, mathGrade1): difficulty added inside each generator function
- New entries: `grade2Vietnamese`, `grade2English` with randomly-selected 10-question sets from 15-question pools

### `grade2VietnamesePool` / `grade2EnglishPool` (new, using `useMemo`)
- `grade2VietnamesePool`: `useMemo(() => shuffleAndPick(allGrade2VietnameseQuestions, 10), [])`
- `grade2EnglishPool`: `useMemo(() => shuffleAndPick(allGrade2EnglishQuestions, 10), [])`
