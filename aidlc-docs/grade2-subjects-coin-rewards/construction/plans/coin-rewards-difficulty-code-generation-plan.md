# Code Generation Plan — coin-rewards-difficulty

## Unit Context
- **Unit**: coin-rewards-difficulty
- **Workspace Root**: D:\WebPractice_Data\magichouse
- **Project Type**: Brownfield Next.js monolith
- **Requirements Covered**: FR-4, FR-5, FR-6 (partial — claimCoins/earnCoins label updates)
- **Dependencies**: None (this unit is the foundation)

## Stories Implemented
- Difficulty type + pure coin calculation utility
- Per-question difficulty assignment (all generators + static quizData)
- Difficulty badge in QuizModal
- Dynamic coin reward flow: QuizModal → LearningZone → Dashboard

## Unit Dependencies & Interfaces
- `lib/coin-rewards.ts` exports `Difficulty`, `randomDifficulty`, `dominantDifficulty`, `calculateSessionCoins`
- `components/quiz-modal.tsx` imports `Difficulty` from `@/lib/coin-rewards`
- `components/learning-zone.tsx` imports `Difficulty`, `randomDifficulty`, `calculateSessionCoins` from `@/lib/coin-rewards`
- `components/dashboard.tsx` receives `coinsEarned` via updated `onQuizComplete` prop

---

## Generation Steps

### Step 1: Create `lib/coin-rewards.ts` — Business Logic
- [x] Create new file `lib/coin-rewards.ts`
- Export `Difficulty` type (`'easy' | 'medium' | 'hard'`)
- Export `randomDifficulty(): Difficulty` — uniform ~33% split
- Export `dominantDifficulty(difficulties: Difficulty[]): Difficulty` — most-frequent wins, tie-break: hard > medium > easy, empty → 'easy'
- Export `calculateSessionCoins(difficulties: Difficulty[]): number` — one draw based on dominant: easy→[5,10], medium→[10,30], hard→[10,30]
- No imports needed (pure math only)

### Step 2: Modify `data/translations.ts` — Remove Hardcoded "10"
- [x] Modify existing file `data/translations.ts`
- Change `quiz.claimCoins`: `{ vi: "Nhận 10 Xu!", en: "Claim 10 Coins!" }` → `{ vi: "Nhận Xu!", en: "Claim Coins!" }`
- Change `quiz.earnCoins`: `{ vi: "+10 Xu", en: "+10 Coins" }` → `{ vi: "+Xu", en: "+Coins" }`

### Step 3: Modify `components/quiz-modal.tsx` — Difficulty Badge + Updated Interfaces
- [x] Modify existing file `components/quiz-modal.tsx`
- Add import: `import { type Difficulty } from "@/lib/coin-rewards"`
- Update `Question` interface: add `difficulty: Difficulty`
- Update `QuizModalProps.onComplete`: `(score: number, totalQuestions: number, difficulties: Difficulty[]) => void`
- Add state: `const [questionDifficulties, setQuestionDifficulties] = useState<Difficulty[]>([])`
- Update `handleAnswer`: on first selection, push `questions[currentQuestion].difficulty` to `questionDifficulties`
- Update `handleFinish`: call `onComplete(score, questions.length, questionDifficulties)`, then reset `questionDifficulties` to `[]`
- Update `handleClose`: reset `questionDifficulties` to `[]`
- Add difficulty badge rendering between progress bar and question text:
  ```
  easy   → text-green-600 bg-green-50 border-green-200, stars "⭐", label "Easy" / "Dễ"
  medium → text-yellow-600 bg-yellow-50 border-yellow-200, stars "⭐⭐", label "Medium" / "Vừa"
  hard   → text-red-600 bg-red-50 border-red-200, stars "⭐⭐⭐", label "Hard" / "Khó"
  ```
  Badge: `<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold {style}">{stars} {label}</span>`
- Badge location: rendered after progress bar div, before question `<h3>`
- Add `data-testid="quiz-difficulty-badge"` to the badge span

### Step 4: Modify `components/learning-zone.tsx` — Difficulty on Questions + Dynamic Coins
- [x] Modify existing file `components/learning-zone.tsx`
- Add import: `import { type Difficulty, randomDifficulty, calculateSessionCoins } from "@/lib/coin-rewards"`
- Update return types of all 4 generator functions to include `difficulty`:
  - `generateAdditionQuestion`: add `difficulty: randomDifficulty()` to return
  - `generateSubtractionQuestion`: add `difficulty: randomDifficulty()` to return
  - `generateTimesTableQuestion`: add `difficulty: randomDifficulty()` to return
  - `generateMathQuestion` (unexported): add `difficulty: randomDifficulty()` to return
- Update all static quizData question objects (shapes ×10, colors ×10, animals ×10, vietnamese ×3, english ×10): add `difficulty: randomDifficulty()` to each
- Update `handleQuizCompleteInternal` signature: `(score: number, totalQuestions: number, difficulties: Difficulty[]) => void`
- Inside `handleQuizCompleteInternal`: `const coinsEarned = calculateSessionCoins(difficulties)`
- Change `fetch` body from `coinsEarned: 10` → `coinsEarned`
- Update `onQuizComplete` call: `onQuizComplete(activeQuiz!, score, totalQuestions, coinsEarned)`
- Update `LearningZoneProps.onQuizComplete` type: add `coinsEarned: number` as 4th parameter

### Step 5: Modify `components/dashboard.tsx` — Use Dynamic Coins
- [x] Modify existing file `components/dashboard.tsx`
- Update `handleQuizComplete` signature: `(category: string, score: number, totalQuestions: number, coinsEarned: number) => void`
- Change `addCoins(10)` → `addCoins(coinsEarned)`
- Remove the duplicate `fetch('/api/quiz/history', ...)` call from `handleQuizComplete` (LearningZone already handles it)

### Step 6: Create `automation_tests/unit/coin-rewards.test.ts` — Tests
- [x] Create new file `automation_tests/unit/coin-rewards.test.ts`
- Import `describe, test, expect` from `vitest`; import `* as fc` from `fast-check`
- Import `randomDifficulty, dominantDifficulty, calculateSessionCoins` from `@/lib/coin-rewards`
- **Unit tests for `randomDifficulty`**: sampling — run 300 times, confirm all three values occur
- **Unit tests for `dominantDifficulty`**: all 10 deterministic cases from nfr-requirements.md
- **PBT for `dominantDifficulty`**: properties P-D1 through P-D7 from nfr-requirements.md
- **Unit tests for `calculateSessionCoins`**: empty array, all-easy, all-medium, all-hard
- **PBT for `calculateSessionCoins`**: properties P-C1 through P-C7 from nfr-requirements.md

---

## File Change Summary

| File | Action | Description |
|---|---|---|
| `lib/coin-rewards.ts` | CREATE | Difficulty type + 3 pure functions |
| `data/translations.ts` | MODIFY | Remove hardcoded "10" from 2 strings |
| `components/quiz-modal.tsx` | MODIFY | Difficulty badge, updated interfaces/handlers |
| `components/learning-zone.tsx` | MODIFY | Difficulty on questions, dynamic coin flow |
| `components/dashboard.tsx` | MODIFY | Dynamic addCoins, remove duplicate fetch |
| `automation_tests/unit/coin-rewards.test.ts` | CREATE | Unit + PBT tests |

**No DB schema changes. No new npm packages.**
