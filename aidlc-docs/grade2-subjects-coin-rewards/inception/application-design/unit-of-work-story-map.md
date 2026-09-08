# Unit of Work — Story Map

## Note on User Stories

The User Stories stage was **skipped** for this initiative (simple enhancement, clear requirements, single developer). This story map therefore maps **Functional Requirements** (from `requirements.md`) to units instead of formal user stories.

---

## Requirement-to-Unit Mapping

| Requirement | Description | Unit |
|---|---|---|
| FR-4.1 | Every question gets a random difficulty (Easy/Medium/Hard) | coin-rewards-difficulty |
| FR-4.2 | Difficulty assigned at question creation time | coin-rewards-difficulty |
| FR-4.3 | `Question` interface gains `difficulty` field | coin-rewards-difficulty |
| FR-4.4 | Difficulty applies to ALL quizzes, all grade levels | coin-rewards-difficulty |
| FR-5.1 | Remove fixed 10-coin reward | coin-rewards-difficulty |
| FR-5.2 | Session coin reward = one draw based on dominant difficulty | coin-rewards-difficulty |
| FR-5.3 | Coin ranges: Easy 5–10, Medium 10–30, Hard 10–30 | coin-rewards-difficulty |
| FR-5.4 | Pure `calculateSessionCoins()` in `lib/coin-rewards.ts` | coin-rewards-difficulty |
| FR-5.5 | `coinsEarned` flows through QuizModal → LearningZone → API | coin-rewards-difficulty |
| FR-6.1 | "Claim Coins!" shows actual dynamic amount | coin-rewards-difficulty |
| NFR-1.1 | PBT for `calculateSessionCoins` output ranges | coin-rewards-difficulty |
| NFR-1.2 | Unit tests for dominant difficulty tie-breaking | coin-rewards-difficulty |
| FR-1.1 | Grade 2 tab shows Math, Vietnamese, English subject cards | grade2-subjects-nav |
| FR-1.2 | Clicking Math drills into Addition, Subtraction, Times Table | grade2-subjects-nav |
| FR-1.3 | Back button in Math sub-view returns to subject list | grade2-subjects-nav |
| FR-1.4 | Clicking Vietnamese/English launches Grade 2 quiz | grade2-subjects-nav |
| FR-1.5 | Addition/Subtraction/TimesTable quizzes unchanged functionally | grade2-subjects-nav |
| FR-2.1 | 15-question Vietnamese Grade 2 pool created | grade2-subjects-nav |
| FR-2.2 | 10 randomly selected per session via `useMemo` | grade2-subjects-nav |
| FR-2.3 | Multiple-choice format (3 options) | grade2-subjects-nav |
| FR-3.1 | 15-question English Grade 2 pool created | grade2-subjects-nav |
| FR-3.2 | 10 randomly selected per session via `useMemo` | grade2-subjects-nav |
| FR-3.3 | Multiple-choice format (3 options) | grade2-subjects-nav |
| FR-6.2 | Category card "+Coins" label no longer shows hardcoded "10" | grade2-subjects-nav |
| FR-6.3 | Translations updated for dynamic coin labels | grade2-subjects-nav |
| NFR-2.1 | Grade 1 and Preschool quizzes unchanged externally | coin-rewards-difficulty |
| NFR-2.2 | `/api/quiz/history` signature unchanged | coin-rewards-difficulty |
| NFR-2.3 | No DB schema changes | Both (neither touches DB) |
| NFR-3.1 | Follow existing TypeScript/React patterns | Both |
| NFR-3.2 | New utility functions are pure | coin-rewards-difficulty |

---

## Coverage Summary

| Unit | Requirements Covered | Count |
|---|---|---|
| coin-rewards-difficulty | FR-4.x, FR-5.x, FR-6.1, NFR-1.x, NFR-2.x, NFR-3.2 | 16 |
| grade2-subjects-nav | FR-1.x, FR-2.x, FR-3.x, FR-6.2, FR-6.3, NFR-3.1 | 13 |
| Both / Shared | NFR-2.3, NFR-3.1 | 2 |

All 29 requirement items are covered. No gaps.
