# Business Logic Model — coin-rewards-difficulty

## Process: Assign Difficulty to a Question

**Trigger**: A question object is constructed (inside a question generator function or quizData literal)

**Algorithm**:
```
randomDifficulty():
  r = random uniform [0, 1)
  if r < 0.333 → return 'easy'
  if r < 0.667 → return 'medium'
  else         → return 'hard'
```

**Output**: A `Difficulty` value added to the `Question` object as `.difficulty`

---

## Process: Determine Session's Dominant Difficulty

**Trigger**: Called by `calculateSessionCoins()` with the session's difficulties array

**Algorithm**:
```
dominantDifficulty(difficulties: Difficulty[]):
  if difficulties.length === 0 → return 'easy'

  counts = { easy: 0, medium: 0, hard: 0 }
  for each d in difficulties:
    counts[d]++

  // Find max count; tie-break by highest difficulty
  if counts.hard >= counts.medium AND counts.hard >= counts.easy → return 'hard'
  if counts.medium >= counts.easy                                → return 'medium'
  return 'easy'
```

**Tie-breaking rule**: When two or more difficulties appear equally, `'hard'` beats `'medium'` beats `'easy'`. This means harder quizzes are never penalized on a tie.

**Example**:
- [easy, easy, medium, medium, hard] → counts: {easy:2, medium:2, hard:1} → medium (medium ≥ easy, hard < medium) → returns `'medium'`
- [easy, hard, medium, hard, easy] → counts: {easy:2, medium:1, hard:2} → hard (hard ≥ medium AND hard ≥ easy) → returns `'hard'`
- [easy, easy, easy] → returns `'easy'`

---

## Process: Calculate Session Coin Reward

**Trigger**: Quiz modal calls `onComplete(score, total, difficulties)` → LearningZone calls `calculateSessionCoins(difficulties)`

**Algorithm**:
```
calculateSessionCoins(difficulties: Difficulty[]):
  dominant = dominantDifficulty(difficulties)

  switch dominant:
    'easy'   → return randomInt(5, 10)   // inclusive on both ends
    'medium' → return randomInt(10, 30)  // inclusive on both ends
    'hard'   → return randomInt(10, 30)  // inclusive on both ends

randomInt(min, max):
  return Math.floor(Math.random() * (max - min + 1)) + min
```

**Output**: A single integer in [5,10], [10,30], or [10,30] depending on dominant difficulty.

---

## Process: Quiz Completion Flow

**Trigger**: Student presses "Claim Coins" in QuizModal

```
1. QuizModal.handleFinish()
     → calls onComplete(score, questions.length, questionDifficulties)

2. LearningZone.handleQuizCompleteInternal(score, total, difficulties)
     → coinsEarned = calculateSessionCoins(difficulties)
     → POST /api/quiz/history { category, score, totalQuestions, coinsEarned }
     → calls onQuizComplete(activeQuiz, score, total)

3. Dashboard (parent of LearningZone)
     → addCoins(coinsEarned)   ← NOTE: coinsEarned passed up via onQuizComplete or separate prop
```

**Current parent interface**: `onQuizComplete(category, score, totalQuestions)` — does NOT accept coinsEarned.

**Coin addition**: The parent currently calls `addCoins(10)` hardcoded. To pass the dynamic amount, `onQuizComplete` signature must be extended to include `coinsEarned`, OR `LearningZone` must call `addCoins` directly.

→ **Design decision**: `LearningZone` will call the coin API directly (same fetch it already does), and separately call `onQuizComplete` for fireworks/score display. The `addCoins` in coin-context will be triggered by the API response, not a direct call from LearningZone. This avoids changing the parent interface.

Actually, looking at the existing code:
- `handleQuizCompleteInternal` already calls `fetch('/api/quiz/history', { coinsEarned: 10 })`
- `onQuizComplete` is called to trigger fireworks/score display in the parent
- The parent (`dashboard.tsx`) calls `addCoins(10)` after `onQuizComplete`

**Revised approach**: Extend `onQuizComplete(category, score, total, coinsEarned)` to pass the dynamic amount upward so the parent can call `addCoins(coinsEarned)`. This keeps the separation of concerns.
