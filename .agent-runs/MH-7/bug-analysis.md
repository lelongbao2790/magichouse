Now I have enough to write the full analysis.

---

## MH-7: Your Coins Number Incorrect — Full Analysis

### Symptom

The "Your Coins" balance in My House (rendered by `CoinDisplay` at `components/coin-display.tsx:24`) shows a value that changes unpredictably after each quiz session and does not match any deterministic measure of the user's progress.

---

### Root Cause

The coin reward calculation is **doubly random** — two independent `Math.random()` calls fire on every quiz completion:

**Source 1 — random difficulty per question** (`components/learning-zone.tsx`)

Every programmatically-generated question (addition, subtraction, times-table, math) calls `randomDifficulty()` for its `difficulty` field:

| Function | Line | Call |
|---|---|---|
| `generateAdditionQuestion` | 92 | `difficulty: randomDifficulty()` |
| `generateSubtractionQuestion` | 104 | `difficulty: randomDifficulty()` |
| `generateTimesTableQuestion` | 123 | `difficulty: randomDifficulty()` |
| `generateMathQuestion` | 150 | `difficulty: randomDifficulty()` |

`randomDifficulty()` in `lib/coin-rewards.ts:3-8` returns `'easy'`, `'medium'`, or `'hard'` via `Math.random()`, entirely unrelated to the question's actual operands or content.

**Source 2 — random coin amount within the difficulty band** (`lib/coin-rewards.ts:25-29`)

`calculateSessionCoins(difficulties)` computes a dominant difficulty from the accumulated array and then calls `randomInt(5, 10)` (easy) or `randomInt(10, 30)` (medium/hard). `randomInt` at line 21 also uses `Math.random()`.

**Combined effect**: A 10-question grade-1 addition quiz completed the exact same way twice will award anywhere from 5 to 30 coins with no relationship to performance, because:
1. Every question's difficulty label is picked from a uniform random draw.
2. The final coin amount is an additional random draw within the resulting band.

### Data Flow (coin path from quiz to display)

```
QuizModal.handleFinish()
  → onComplete(score, totalQuestions, questionDifficulties)   [quiz-modal.tsx:79]
  → LearningZone.handleQuizCompleteInternal()                [learning-zone.tsx:244]
      coinsEarned = calculateSessionCoins(difficulties)       ← RANDOM HERE
  → onQuizComplete(activeQuiz, score, totalQuestions, coinsEarned)
  → Dashboard.handleQuizComplete()                           [dashboard.tsx:32-33]
  → addCoins(coinsEarned)                                    [coin-context.tsx:91-104]
      setCoins(coins + coinsEarned)    ← optimistic update
      POST /api/players/coins { amount: coinsEarned }
      → server addCoins reads DB, adds amount, saves back    [lib/services/player.ts:54-65]
      setCoins(data.coins)             ← corrects to server value
  → CoinDisplay renders coins                                [coin-display.tsx:24]
```

Because the server's `addCoins` trusts the client-supplied `amount` (validated only as `positive().max(1000)` in `lib/validation/api.ts:14-16`), whatever random number the client generates is permanently written to the database.

---

### Affected Files and Reasons

| File | Reason |
|---|---|
| `lib/coin-rewards.ts` | `calculateSessionCoins` uses `randomInt` (wrapping `Math.random()`) to determine rewards — directly produces a non-deterministic coin amount |
| `components/learning-zone.tsx` | All four generated-question functions call `randomDifficulty()` per question, so the `difficulties[]` array fed to `calculateSessionCoins` is itself random — the double-randomness starts here |
| `contexts/coin-context.tsx` | `addCoins` optimistically updates state using the client-calculated random amount; if the server call fails silently (the `.catch(() => {})` swallows errors), the optimistic state diverges from the DB, causing a stale display on next load |

---

### Proposed Minimal Fix (no code changes — description only)

**Fix 1 — Make `calculateSessionCoins` deterministic** (`lib/coin-rewards.ts`)

Replace the `randomInt` calls with a score-based formula. The function signature should change to accept `score: number` and `totalQuestions: number` instead of `difficulties: Difficulty[]`. A simple, correct formula: award 1 coin per correct answer (`return score`), or a difficulty-scaled variant if difficulty tiers are preserved.

This eliminates the randomness entirely: the same score always yields the same reward.

**Fix 2 — Pass score/totalQuestions instead of difficulties** (`components/learning-zone.tsx:244-254`)

Update the single call site:
```ts
// Before
const coinsEarned = calculateSessionCoins(difficulties)
// After
const coinsEarned = calculateSessionCoins(score, totalQuestions)
```

`score` and `totalQuestions` are already available in `handleQuizCompleteInternal` (they are its first two parameters). The `difficulties[]` parameter can be dropped from `onComplete` if it is no longer needed elsewhere.

**Fix 3 — Assign deterministic difficulty to generated questions** (`components/learning-zone.tsx`)

For addition/subtraction: derive `'easy'` / `'medium'` / `'hard'` from operand size (e.g., sum ≤ 20 → easy, ≤ 100 → medium, > 100 → hard). For times table: derive from the multiplier. This makes difficulty labels meaningful rather than ornamental noise, and removes `randomDifficulty()` from the four generator functions. This fix is independent and can be deferred, but it aligns with AC #4 ("balance is updated correctly when the user earns coins") — the reward should reflect actual question difficulty.

---

### Acceptance-Criteria Mapping

| AC | Status | Fix |
|---|---|---|
| AC1: displays actual current balance | Passes already — server value is loaded on init and confirmed after each `addCoins` call | — |
| AC2: balance must not be randomly generated | **Fails** — `calculateSessionCoins` uses `Math.random()` | Fix 1 + Fix 2 |
| AC3: refresh does not change balance unexpectedly | Mostly passes; divergence only occurs if the API call in `addCoins` fails silently | Optional: surface the error |
| AC4: balance updates correctly on earn/spend | **Fails** — "correctly" implies determinism; coins earned are random | Fix 1 + Fix 2 |
| AC5: existing coin functionality unaffected | Must be verified after changes | Regression test |

## Analysis Complete
