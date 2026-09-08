# Unit of Work — Dependency Matrix

## Dependency Graph

```
+-----------------------------+
| Unit 1                      |
| coin-rewards-difficulty     |
| (no dependencies)           |
+-----------------------------+
              |
              | provides: Difficulty type,
              |           randomDifficulty(),
              |           calculateSessionCoins()
              v
+-----------------------------+
| Unit 2                      |
| grade2-subjects-nav         |
| (depends on Unit 1)         |
+-----------------------------+
              |
              | combined output
              v
+-----------------------------+
| Build and Test              |
| (both units)                |
+-----------------------------+
```

## Dependency Table

| Unit | Depends On | Dependency Type | Dependency Reason |
|---|---|---|---|
| coin-rewards-difficulty | — | None | Foundational utility; no prior unit |
| grade2-subjects-nav | coin-rewards-difficulty | Type + Runtime | Uses `Difficulty` type and `randomDifficulty()` to add difficulty to Grade 2 quiz questions |
| Build and Test | Both units | Completion | Validates combined output of all changes |

## File-Level Dependencies

| File | Introduced By | Used By |
|---|---|---|
| `lib/coin-rewards.ts` | Unit 1 | `components/quiz-modal.tsx` (Difficulty type), `components/learning-zone.tsx` (calculateSessionCoins, randomDifficulty) |
| `components/quiz-modal.tsx` (modified) | Unit 1 | `components/learning-zone.tsx` (via onComplete callback) |
| `components/learning-zone.tsx` (partial mod) | Unit 1 | Unit 2 (further modifies same file) |
| `automation_tests/unit/coin-rewards.test.ts` | Unit 1 | Build and Test |
| `data/translations.ts` (modified) | Unit 2 | `components/learning-zone.tsx` (Grade 2 question content) |
| `components/grade2-subject-view.tsx` | Unit 2 | `components/learning-zone.tsx` |
| `components/learning-zone.tsx` (full mod) | Units 1 + 2 | App entry point (`app/page.tsx`) |

## Shared File Risk

`components/learning-zone.tsx` is modified by **both** units. To avoid merge conflicts, the units must be implemented sequentially:
1. Unit 1 modifies: `handleQuizCompleteInternal`, `quizData` (adds `difficulty` to all existing questions)
2. Unit 2 modifies: `quizData` (adds `grade2Vietnamese`, `grade2English`), Grade 2 tab rendering, `useMemo` pools

The modifications are in **different areas** of the file — sequential implementation is sufficient, no special coordination needed.
