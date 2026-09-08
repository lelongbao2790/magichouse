# Handover — grade2-subjects-coin-rewards

**Last updated**: 2026-09-08T04:00:00Z  
**Status**: ✅ COMPLETE

## What was built

Two features added to the magichouse Next.js learning app:

1. **Grade 2 Subject Navigation**: Reorganized Grade 2 tab from flat practice cards into two-level subject hierarchy — Math/Vietnamese/English subject cards, with Math drilling down to Addition/Subtraction/Times Table. New Grade 2 Vietnamese (15-Q pool) and English (15-Q pool) quizzes added, 10 randomly selected per session.

2. **Difficulty-Based Coin Rewards**: Replaced hardcoded 10-coin reward with per-question random difficulty (Easy/Medium/Hard) and session-based coin calculation: Easy→[5,10], Medium/Hard→[10,30]. Difficulty badge shown on each quiz question.

## Files changed

| File | Change |
|---|---|
| `lib/coin-rewards.ts` | **NEW** — `Difficulty` type, `randomDifficulty`, `dominantDifficulty`, `calculateSessionCoins` |
| `components/grade2-subject-view.tsx` | **NEW** — two-level Grade 2 navigation component |
| `automation_tests/unit/coin-rewards.test.ts` | **NEW** — 30 unit + PBT tests |
| `lib/validation/api.ts` | Extended category enum with `grade2Vietnamese`, `grade2English` |
| `lib/database.types.ts` | Extended category unions to match |
| `data/translations.ts` | Removed hardcoded "10" from coin labels; added 30 Grade 2 questions |
| `components/quiz-modal.tsx` | Added `difficulty` to `Question`, difficulty badge, updated `onComplete` signature |
| `components/learning-zone.tsx` | Grade 2 integration, dynamic coins, all question objects gain `difficulty` |
| `components/dashboard.tsx` | Dynamic `addCoins(coinsEarned)`, removed duplicate fetch |

## Test status
**68/68 unit tests pass** — 30 new (coin-rewards) + 38 existing (learning-zone)

## Key design decisions
| Decision | Choice |
|---|---|
| Grade 2 nav | `Grade2SubjectView` component with internal `selectedSubject` state |
| Coin calculation placement | LearningZone (not QuizModal) — Q3=B |
| "Claim Coins" button | Generic text ("Nhận Xu!"); actual amount in fireworks/parent |
| Dominant difficulty tie-break | hard > medium > easy |
| VN/EN Grade 2 content | 15-Q pools, 10 randomly selected via `useMemo([], [])` |
| PBT scope | `dominantDifficulty` + `calculateSessionCoins` only (Q8=B) |

## Remaining manual verification
4 integration scenarios documented in `construction/build-and-test/integration-test-instructions.md` — requires running `bun run dev` with a valid `.env.local`.
