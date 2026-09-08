# Business Rules — coin-rewards-difficulty

## BR-1: Difficulty Assignment is Random and Uniform

**Rule**: Every question in every quiz must receive a difficulty of exactly one of: `'easy'`, `'medium'`, `'hard'`, with approximately equal probability (~33% each).

**Applies to**: All question generators (`generateAdditionQuestion`, `generateSubtractionQuestion`, `generateTimesTableQuestion`, `generateMathQuestion`) and all static `quizData` question arrays (shapes, colors, animals, math-grade1, vietnamese-grade1, english-grade1).

**Constraint**: Difficulty must be assigned at question construction time (not lazily), so the difficulty is stable for the lifetime of the question object.

---

## BR-2: Dominant Difficulty Tie-Breaking Favors Higher Difficulty

**Rule**: When two or more difficulty levels appear equally in a session, the higher difficulty wins.
`hard` > `medium` > `easy`.

**Rationale**: Rewards students who encounter harder questions, never penalizes them on ties.

---

## BR-3: Empty Session Defaults to Easy

**Rule**: If `calculateSessionCoins` receives an empty `difficulties` array, it returns a coin reward in the Easy range [5, 10].

**Rationale**: Defensive default for edge cases (e.g., a quiz with 0 questions).

---

## BR-4: Coin Reward Ranges are Inclusive

**Rule**: All coin reward ranges use inclusive bounds.
- Easy: min=5, max=10 → values: 5, 6, 7, 8, 9, or 10
- Medium: min=10, max=30 → values: 10 through 30 inclusive
- Hard: min=10, max=30 → same as Medium

**Formula**: `Math.floor(Math.random() * (max - min + 1)) + min`

---

## BR-5: Difficulty is Invisible in the History Record

**Rule**: The `quiz_history` table does not store per-question difficulties. Only `coins_earned` (the computed result) is persisted. The `Difficulty[]` array is ephemeral — computed during the session and discarded after the coin reward is calculated.

---

## BR-6: QuizModal Accumulates All Question Difficulties

**Rule**: `QuizModal` accumulates the `difficulty` of every question presented during the session, regardless of whether the student answered correctly. The full `difficulties[]` array (length = total questions in quiz) is passed to `onComplete`.

**Rationale**: Coin reward is based on session difficulty distribution, not correct-answer performance.

---

## BR-7: Difficulty Badge Text and Stars

**Rule**: Each question in QuizModal displays a difficulty badge using the following format:
- Easy → `"Easy ⭐"`
- Medium → `"Medium ⭐⭐"`
- Hard → `"Hard ⭐⭐⭐"`

Badge is displayed in the question screen (not the results screen) — visible while the student is answering.

---

## BR-8: Dynamic Coin Display on Claim Button

**Rule**: The "Claim Coins" button text in QuizModal must display the actual computed `coinsEarned` amount. It cannot show a hardcoded value.

**Implementation note**: `coinsEarned` is computed in `LearningZone`, not inside `QuizModal`. The modal must receive or compute the value before rendering the results screen. Since `calculateSessionCoins` is called in `LearningZone`'s `onComplete` handler (Q3=B), the modal cannot display the amount before the callback fires.

**Resolution**: The "Claim Coins" button triggers `handleFinish()` which calls `onComplete(score, total, difficulties[])`. The dynamic coin amount appears in the parent's UI (e.g., a toast/fireworks display), not on the button itself. The button label becomes the generic translation `quiz.claimCoins` = `"Nhận Xu!"` / `"Claim Coins!"` (no number). The actual amount is communicated via the fireworks/toast in the parent view.
