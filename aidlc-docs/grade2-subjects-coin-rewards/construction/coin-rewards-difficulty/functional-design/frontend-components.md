# Frontend Components — coin-rewards-difficulty

## QuizModal (modified)

### Updated Question Interface
```typescript
interface Question {
  question: string
  options: string[]
  correctIndex: number
  difficulty: 'easy' | 'medium' | 'hard'   // NEW
}
```

### New Internal State
```typescript
const [questionDifficulties, setQuestionDifficulties] = useState<Difficulty[]>([])
```
Accumulates the difficulty of each question as it is presented. Reset on close.

### Difficulty Badge — Rendering
**Location**: Inside the question screen, displayed between the progress bar and the question text.

**Render logic**:
```
const difficultyBadge = {
  easy:   { label: "Easy",   stars: "⭐",     style: "text-green-600 bg-green-50 border-green-200" },
  medium: { label: "Medium", stars: "⭐⭐",   style: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  hard:   { label: "Hard",   stars: "⭐⭐⭐", style: "text-red-600 bg-red-50 border-red-200" },
}
```

**Badge HTML structure**:
```html
<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold {style}">
  {stars} {label}
</span>
```

### Updated onComplete Signature
```typescript
// Before:
onComplete: (score: number, totalQuestions: number) => void

// After:
onComplete: (score: number, totalQuestions: number, difficulties: Difficulty[]) => void
```

### handleAnswer (updated)
When the student selects an answer (first selection only), push the current question's difficulty:
```typescript
setQuestionDifficulties(prev => [...prev, questions[currentQuestion].difficulty])
```

### handleFinish (updated)
```typescript
const handleFinish = () => {
  onComplete(score, questions.length, questionDifficulties)
  // reset all state including questionDifficulties
}
```

### handleClose (updated)
Resets `questionDifficulties` to `[]` alongside existing resets.

### Claim Coins Button
Label changes from `t("quiz", "claimCoins")` = `"Nhận 10 Xu!"` → `"Nhận Xu!"` / `"Claim Coins!"` (no hardcoded number).

---

## LearningZone (partial update — this unit only)

### handleQuizCompleteInternal (updated signature)
```typescript
const handleQuizCompleteInternal = (
  score: number,
  totalQuestions: number,
  difficulties: Difficulty[]
) => {
  const coinsEarned = calculateSessionCoins(difficulties)

  fetch('/api/quiz/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: activeQuiz, score, totalQuestions, coinsEarned }),
  }).catch(() => {})

  setActiveQuiz(null)
  onQuizComplete(activeQuiz!, score, totalQuestions, coinsEarned)  // pass coinsEarned upward
}
```

### quizData — Difficulty Field Addition
All existing static question objects gain `difficulty: randomDifficulty()`:
```typescript
{ question: t("quizShapes", "q1"), options: [...], correctIndex: 1, difficulty: randomDifficulty() },
```

All generated question arrays already produce difficulty inside the generator functions (see Unit 1 generator updates).

### onQuizComplete prop (updated signature)
```typescript
// Before:
onQuizComplete: (category: string, score: number, totalQuestions: number) => void

// After:
onQuizComplete: (category: string, score: number, totalQuestions: number, coinsEarned: number) => void
```

The parent (`dashboard.tsx` or `app/page.tsx`) must be updated to accept and use `coinsEarned` in its `addCoins(coinsEarned)` call instead of the hardcoded `addCoins(10)`.
