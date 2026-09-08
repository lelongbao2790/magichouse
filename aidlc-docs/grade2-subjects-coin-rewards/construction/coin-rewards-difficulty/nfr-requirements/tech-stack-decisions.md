# Tech Stack Decisions — coin-rewards-difficulty

## Decision 1: Testing Framework — Vitest (existing)

**Decision**: Use the project's existing Vitest setup.  
**Rationale**: Project already has Vitest configured with a working test suite. No new tooling required.  
**File location**: `automation_tests/unit/coin-rewards.test.ts`

---

## Decision 2: Property-Based Testing — fast-check (existing)

**Decision**: Use the project's existing fast-check integration for PBT tests.  
**Scope**: `dominantDifficulty()` and `calculateSessionCoins()` only (Q8=B partial opt-in).  
**Rationale**: fast-check is already installed and used in the project. PBT is particularly valuable for `dominantDifficulty()` (tie-breaking logic has many input combinations) and `calculateSessionCoins()` (output range invariants must hold for all possible difficulty arrays).  
**Excluded**: `randomDifficulty()` — non-deterministic by design; sampling tests in regular unit tests are sufficient.

---

## Decision 3: TypeScript Strict Union Type

**Decision**: `Difficulty` is defined as a TypeScript union type `'easy' | 'medium' | 'hard'`, not an enum.  
**Rationale**: Consistent with existing patterns in the project (e.g., `Category` types are string unions). Union types have zero runtime overhead and work naturally with TypeScript's exhaustiveness checking.  
**Location**: Exported from `lib/coin-rewards.ts` and re-used in `components/quiz-modal.tsx` and `components/learning-zone.tsx`.

---

## Decision 4: Coin Calculation Placement — LearningZone (not QuizModal)

**Decision**: `calculateSessionCoins()` is called in `LearningZone.handleQuizCompleteInternal()`, not inside `QuizModal`.  
**Rationale**: Established in Application Design (Q3=B). QuizModal is a presentational component; business logic stays in LearningZone. The `Difficulty[]` array flows out of QuizModal via `onComplete` callback.  
**Consequence**: QuizModal cannot display the computed coin amount on the "Claim Coins" button (BR-8). The button shows generic text; the parent displays the actual amount.

---

## No New Dependencies

This unit requires no new npm packages. All implementation uses:
- TypeScript (existing)
- `Math.random()` (built-in)
- `Math.floor()` (built-in)
- Vitest (existing)
- fast-check (existing)
