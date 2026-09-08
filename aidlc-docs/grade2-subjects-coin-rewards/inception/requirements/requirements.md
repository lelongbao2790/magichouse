# Requirements — grade2-subjects-coin-rewards

## Intent Analysis

- **User Request**: Implement requirements from `requirement-example.txt` — Grade 2 subject organization and difficulty-based coin rewards
- **Request Type**: Enhancement of existing feature
- **Scope**: Multiple components (learning-zone.tsx, quiz-modal.tsx, translations.ts, new utility module)
- **Complexity**: Moderate — UI structural change (two-level navigation), new coin calculation logic, new quiz content

---

## Functional Requirements

### FR-1: Grade 2 Two-Level Subject Navigation

**FR-1.1** The Grade 2 tab panel shall display three subject cards: Math, Vietnamese, and English.

**FR-1.2** Clicking the Math subject card shall navigate to a sub-view displaying three practice cards: Addition, Subtraction, Times Table.

**FR-1.3** The sub-view shall include a back button that returns the user to the Grade 2 subject list.

**FR-1.4** Clicking Vietnamese or English subject cards shall navigate to a sub-view displaying the respective Grade 2 quiz for that subject.

**FR-1.5** The existing Addition, Subtraction, and Times Table quizzes shall remain functionally identical — only their entry point changes (accessed via Math subject, not directly).

---

### FR-2: Grade 2 Vietnamese Quiz Content

**FR-2.1** A pool of 15 Vietnamese Grade 2 questions shall be created, appropriate for 7–8 year olds (vocabulary, categories, general knowledge in Vietnamese).

**FR-2.2** Each quiz session shall randomly select 10 questions from the 15-question pool. Selection happens at component mount (using `useMemo`).

**FR-2.3** Questions shall follow the same multiple-choice format (3 options, one correct answer) as all other quizzes.

---

### FR-3: Grade 2 English Quiz Content

**FR-3.1** A pool of 15 English Grade 2 questions shall be created, appropriate for 7–8 year olds (vocabulary, opposites, basic grammar, common knowledge in English).

**FR-3.2** Each quiz session shall randomly select 10 questions from the 15-question pool. Selection happens at component mount (using `useMemo`).

**FR-3.3** Questions shall follow the same multiple-choice format (3 options, one correct answer) as all other quizzes.

---

### FR-4: Per-Question Difficulty Assignment

**FR-4.1** Every question in every quiz shall have a randomly assigned difficulty level: Easy, Medium, or Hard (uniform distribution: ~33% each).

**FR-4.2** Difficulty is assigned at question creation time (inside question generators and quizData object construction).

**FR-4.3** The `Question` interface shall include a `difficulty: 'easy' | 'medium' | 'hard'` field.

**FR-4.4** Difficulty assignment applies to ALL quizzes across all grade levels, not just Grade 2.

---

### FR-5: Difficulty-Based Coin Reward Calculation

**FR-5.1** The fixed reward of 10 coins shall no longer apply to all quizzes.

**FR-5.2** The session coin reward shall be calculated as a single draw based on the session's dominant difficulty (the difficulty level that appears most frequently among questions in the session; ties broken by picking the higher difficulty).

**FR-5.3** Coin reward ranges per session difficulty:
- **Easy** (majority of questions are Easy): random integer in range [5, 10] inclusive
- **Medium** (majority are Medium): random integer in range [10, 30] inclusive
- **Hard** (majority are Hard): random integer in range [10, 30] inclusive

**FR-5.4** A pure function `calculateSessionCoins(difficulties: Difficulty[]): number` shall encapsulate the coin calculation logic and live in a dedicated utility module (`lib/coin-rewards.ts`).

**FR-5.5** The calculated `coinsEarned` value shall be passed through the quiz completion flow: QuizModal → LearningZone → parent component (replacing the hardcoded `10`).

---

### FR-6: UI Updates for Dynamic Coin Display

**FR-6.1** The "Claim Coins!" button in QuizModal shall display the actual earned coin amount (dynamic, not hardcoded "10").

**FR-6.2** The category card "earn coins" label shall be updated to remove the hardcoded "+10 Coins" text and replaced with a generic "+Coins" indicator.

**FR-6.3** The translations for `quiz.claimCoins` and `quiz.earnCoins` shall be updated to support dynamic amounts (e.g., remove hardcoded "10").

---

## Non-Functional Requirements

### NFR-1: Property-Based Testing for Coin Calculation

**NFR-1.1** The `calculateSessionCoins` function shall have property-based tests (using fast-check) verifying:
- Output for Easy-dominant sessions is always in [5, 10]
- Output for Medium-dominant sessions is always in [10, 30]
- Output for Hard-dominant sessions is always in [10, 30]
- Function never returns a negative value
- Function never returns a value above 30

**NFR-1.2** Unit tests shall verify the dominant difficulty detection logic for all tie-breaking scenarios.

---

### NFR-2: Backward Compatibility

**NFR-2.1** Grade 1 and Preschool quizzes shall not be functionally changed — only gain the `difficulty` field on questions (for coin calculation).

**NFR-2.2** Existing quiz history API (`POST /api/quiz/history`) signature shall not change — `coinsEarned` remains an integer field.

**NFR-2.3** No database schema changes are required.

---

### NFR-3: Code Consistency

**NFR-3.1** New content and logic shall follow existing project patterns (TypeScript, functional components, useMemo for stable random generation, Zod for API validation).

**NFR-3.2** New utility functions shall be pure (no side effects) to maintain testability.

---

## Design Decisions (from Q&A)

| Decision | Choice | Rationale |
|---|---|---|
| Grade 2 UI pattern | Two-level navigation (Q1=A) | Drill-down: subjects → practices |
| Difficulty granularity | Per-question random (Q2=C) | Each question independently tagged |
| Session coin calculation | Dominant difficulty determines session reward | Keeps game economy balanced (10–30 coins max per session) |
| Vietnamese/English Grade 2 | New random-pool quiz content (Q3=D) | New age-appropriate content, randomly selected |
| Medium vs Hard coin range | Same range: 10–30 (Q4=A) | Intentional |
| Easy coin range | Random 5–10 (Q5=C) | Slightly variable but always ≤10 |
| Security extension | Disabled (Q6=B) | Not needed for this scope |
| Resiliency extension | Disabled (Q7=B) | Not needed for this scope |
| PBT extension | Partial — pure functions only (Q8=B) | coin-rewards.ts functions get PBT |

---

## Acceptance Criteria

1. Grade 2 tab shows Math, Vietnamese, English subject cards (not flat practice cards)
2. Clicking Math shows Addition, Subtraction, Times Table with a back button
3. Grade 2 Vietnamese quiz presents 10 randomly selected Grade 2 level questions
4. Grade 2 English quiz presents 10 randomly selected Grade 2 level English questions
5. All questions across all quizzes have a `difficulty` field (easy/medium/hard)
6. Completing a quiz awards coins based on the session's dominant difficulty
7. "Claim Coins!" button shows the actual earned amount
8. "+Coins" label on category cards no longer shows a hardcoded "10"
9. PBT tests for `calculateSessionCoins` pass (verifying output ranges)
10. All existing unit tests continue to pass
