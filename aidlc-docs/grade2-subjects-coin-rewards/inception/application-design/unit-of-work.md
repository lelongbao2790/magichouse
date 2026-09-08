# Units of Work

## Overview

This initiative is decomposed into **2 units of work**, executed sequentially. Both are changes to the single Next.js monolith — no new services or deployable units are introduced.

---

## Unit 1: coin-rewards-difficulty

**Description**: Introduces the difficulty system — adding a `Difficulty` type, per-question random difficulty assignment, difficulty badges in the quiz modal, and the pure coin calculation utility. This unit is the foundation that Unit 2 depends on.

**Business Capability**: Difficulty-based coin reward calculation

**Scope**:
- New file: `lib/coin-rewards.ts` — `Difficulty` type, `randomDifficulty()`, `dominantDifficulty()`, `calculateSessionCoins()`
- Modified: `components/quiz-modal.tsx` — adds `difficulty` field to `Question` interface; renders difficulty badge per question; updates `onComplete` signature to pass `difficulties: Difficulty[]`
- Modified: `components/learning-zone.tsx` — `handleQuizCompleteInternal` updated to receive `difficulties[]` and call `calculateSessionCoins()`; all existing `quizData` question objects gain `difficulty: randomDifficulty()` assignment
- New file: `automation_tests/unit/coin-rewards.test.ts` — unit tests + PBT tests for `calculateSessionCoins` and `dominantDifficulty`

**Requirements covered**: FR-4, FR-5, FR-6 (QuizModal interface + "Claim X Coins!" dynamic amount)

**Dependencies**: None

**Risk**: Low — pure utility functions are fully testable; QuizModal change is additive; no DB or API changes

---

## Unit 2: grade2-subjects-nav

**Description**: Introduces the Grade 2 two-level subject navigation and all new Grade 2 quiz content (Vietnamese and English question pools). Depends on the `Difficulty` type from Unit 1.

**Business Capability**: Grade 2 subject organization and new quiz content

**Scope**:
- New file: `components/grade2-subject-view.tsx` — renders subject cards (Math, Vietnamese, English) and Math sub-practice cards (Addition, Subtraction, Times Table) with two-level navigation state
- Modified: `components/learning-zone.tsx` — Grade 2 tab renders `<Grade2SubjectView>` instead of flat category cards; adds `grade2Vietnamese` and `grade2English` to `quizData` with randomly-selected 10-question pools from 15-question banks; adds `grade2VietnamesePool` and `grade2EnglishPool` via `useMemo`
- Modified: `data/translations.ts` — adds `quizVietnameseGrade2` namespace (15 Q×VI/EN), `quizEnglishGrade2` namespace (15 Q×VI/EN), updates `quiz.claimCoins` and `quiz.earnCoins` to remove hardcoded "10"

**Requirements covered**: FR-1, FR-2, FR-3, FR-6 (label updates)

**Dependencies**: Unit 1 must be complete (`Difficulty` type, `randomDifficulty()` available in scope)

**Risk**: Medium — Grade 2 navigation is a structural change to the most-used learning component; new content needs review for age-appropriateness

---

## Construction Phase Entry Point

After Units Generation approval, the CONSTRUCTION PHASE proceeds per-unit in this order:

1. **Unit 1: coin-rewards-difficulty**
   - Functional Design
   - NFR Requirements (PBT)
   - Code Generation
2. **Unit 2: grade2-subjects-nav**
   - Functional Design
   - Code Generation
3. **Build and Test** (both units combined)
