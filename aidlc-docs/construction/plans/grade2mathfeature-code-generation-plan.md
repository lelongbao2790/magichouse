# Code Generation Plan — Grade2MathFeature

## Unit Context

- **Unit**: Grade2MathFeature
- **Project type**: Brownfield — Next.js 16 / React 19 / TypeScript
- **Workspace root**: `D:\WebPractice_Data\magichouse-main`
- **Requirements covered**: FR-01 through FR-13, NFR-01 through NFR-05
- **User Stories**: Skipped (per execution-plan.md)
- **Key design artifacts**:
  - `aidlc-docs/construction/grade2mathfeature/functional-design/`
  - `aidlc-docs/construction/grade2mathfeature/nfr-requirements/`
  - `aidlc-docs/construction/grade2mathfeature/nfr-design/`

## Files Modified vs Created

| Operation | File | Reason |
|---|---|---|
| **MODIFY** | `data/translations.ts` | Add Grade 2 translation keys (NFR-05) |
| **MODIFY** | `components/learning-zone.tsx` | Add Grade 2 tab, generators, quiz data (FR-01 to FR-13) |
| **MODIFY** | `package.json` | Add 4 dev deps + 3 test scripts (NFR-01, PBT-09) |
| **CREATE** | `vitest.config.ts` | Vitest configuration (PBT-09, tech-stack-decisions.md) |
| **CREATE** | `__tests__/learning-zone.pbt.test.ts` | PBT tests for all 5 generators (PBT-07, PBT-08, PBT-10) |
| **CREATE** | `__tests__/learning-zone.test.ts` | Example-based boundary tests (PBT-10) |
| **CREATE** | `aidlc-docs/construction/grade2mathfeature/code/grade2mathfeature-code-summary.md` | Code summary doc |

---

## Step 1: Modify `data/translations.ts` — Add Grade 2 Translation Keys

- [x] Add `grade2` and `grade2Desc` keys to the `dashboard` section
- [x] Add `addition`, `subtraction`, `timesTable` keys to the `categories` section
- [x] Add new `grade2` section (title key)
- [x] Add new `quizAddition` section (title key)
- [x] Add new `quizSubtraction` section (title key)
- [x] Add new `quizTimesTable` section (title key)

**New keys to add** (complete values):
```typescript
// Inside dashboard section — add after grade1Desc:
grade2: { vi: "Lớp 2", en: "Grade 2" },
grade2Desc: { vi: "Toán nâng cao cho bé!", en: "Advanced math for kids!" },

// Inside categories section — add after english:
addition: { vi: "Phép Cộng", en: "Addition" },
subtraction: { vi: "Phép Trừ", en: "Subtraction" },
timesTable: { vi: "Bảng Nhân", en: "Times Table" },

// New sections — add before the stickers/shop sections:
grade2: {
  title: { vi: "Lớp 2 - Toán nâng cao", en: "Grade 2 - Advanced Math" },
},
quizAddition: {
  title: { vi: "Quiz Phép Cộng", en: "Addition Quiz" },
},
quizSubtraction: {
  title: { vi: "Quiz Phép Trừ", en: "Subtraction Quiz" },
},
quizTimesTable: {
  title: { vi: "Quiz Bảng Nhân", en: "Times Table Quiz" },
},
```

**NFR compliance**: NFR-05 (translation key consistency — `translations[section][key][language]` structure)

---

## Step 2: Modify `components/learning-zone.tsx` — Imports and Types

- [x] Add `BookCheck, Plus, Minus, X` to the Lucide React import
- [x] Add `import { type Language } from "@/data/translations"` after the `useLanguage` import
- [x] Expand `TabType` from `"preschool" | "grade1"` to `"preschool" | "grade1" | "grade2"`
- [x] Add type aliases after `TabType`:
  ```typescript
  type QuestionFormat = "symbol" | "word"
  type DistractorStrategy = "offset" | "adjacent"
  type DistractorContext = "arithmetic" | "multiply"
  ```

**NFR compliance**: NFR-02 (code consistency — same import ordering pattern)

---

## Step 3: Modify `components/learning-zone.tsx` — Generator Functions

Add 5 exported functions between the type aliases and `export function LearningZone(...)`.
Order: `generateDistractors` → `insertAtRandom` → `generateAdditionQuestion` → `generateSubtractionQuestion` → `generateTimesTableQuestion`

- [x] Add `generateDistractors(correct, strategy, context, multiplier?, multiplicand?)`:
  ```typescript
  export function generateDistractors(
    correct: number,
    strategy: DistractorStrategy,
    context: DistractorContext,
    multiplier?: number,
    multiplicand?: number
  ): number[] {
    const distractors: number[] = []
    const used = new Set<number>([correct])

    const getAdjacentPool = (): number[] => {
      if (context === "multiply" && multiplier !== undefined && multiplicand !== undefined) {
        const pool: number[] = []
        for (const m of [multiplier - 1, multiplier + 1])
          if (m >= 2 && m <= 9) pool.push(m * multiplicand)
        for (const m of [multiplicand - 1, multiplicand + 1])
          if (m >= 1 && m <= 10) pool.push(multiplier * m)
        return pool
      }
      return [correct + 10, correct - 10].filter(v => v >= 0)
    }

    const adjPool = strategy === "adjacent" ? getAdjacentPool() : []
    let adjIdx = 0

    while (distractors.length < 2) {
      let candidate: number
      if (strategy === "adjacent" && adjIdx < adjPool.length) {
        candidate = adjPool[adjIdx++]
      } else {
        const delta = Math.floor(Math.random() * 15) + 1
        candidate = Math.random() > 0.5 ? correct + delta : Math.max(0, correct - delta)
      }
      if (candidate >= 0 && !used.has(candidate)) {
        used.add(candidate)
        distractors.push(candidate)
      }
    }
    return distractors
  }
  ```

- [x] Add `insertAtRandom(correct, distractors)`:
  ```typescript
  export function insertAtRandom(
    correct: number,
    distractors: number[]
  ): { options: string[]; correctIndex: number } {
    const correctIndex = Math.floor(Math.random() * 3)
    const opts = distractors.map(String)
    opts.splice(correctIndex, 0, String(correct))
    return { options: opts, correctIndex }
  }
  ```

- [x] Add `generateAdditionQuestion()`:
  ```typescript
  export function generateAdditionQuestion(): { question: string; options: string[]; correctIndex: number } {
    const a = Math.floor(Math.random() * 100) + 1
    const b = Math.floor(Math.random() * 100) + 1
    const correct = a + b
    const strategy: DistractorStrategy = Math.random() > 0.5 ? "offset" : "adjacent"
    const distractors = generateDistractors(correct, strategy, "arithmetic")
    const { options, correctIndex } = insertAtRandom(correct, distractors)
    return { question: `${a} + ${b} = ?`, options, correctIndex }
  }
  ```

- [x] Add `generateSubtractionQuestion()`:
  ```typescript
  export function generateSubtractionQuestion(): { question: string; options: string[]; correctIndex: number } {
    const a = Math.floor(Math.random() * 100) + 1
    const b = Math.floor(Math.random() * 100) + 1
    const minuend = Math.max(a, b)
    const subtrahend = Math.min(a, b)
    const correct = minuend - subtrahend
    const strategy: DistractorStrategy = Math.random() > 0.5 ? "offset" : "adjacent"
    const distractors = generateDistractors(correct, strategy, "arithmetic")
    const { options, correctIndex } = insertAtRandom(correct, distractors)
    return { question: `${minuend} - ${subtrahend} = ?`, options, correctIndex }
  }
  ```

- [x] Add `generateTimesTableQuestion(language)`:
  ```typescript
  export function generateTimesTableQuestion(
    language: Language
  ): { question: string; options: string[]; correctIndex: number } {
    const multiplier = Math.floor(Math.random() * 8) + 2
    const multiplicand = Math.floor(Math.random() * 10) + 1
    const correct = multiplier * multiplicand
    const format: QuestionFormat = Math.random() > 0.5 ? "symbol" : "word"
    const question =
      format === "symbol"
        ? `${multiplier} × ${multiplicand} = ?`
        : language === "vi"
          ? `${multiplier} nhân ${multiplicand} bằng mấy?`
          : `${multiplier} times ${multiplicand} equals?`
    const strategy: DistractorStrategy = Math.random() > 0.5 ? "offset" : "adjacent"
    const distractors = generateDistractors(correct, strategy, "multiply", multiplier, multiplicand)
    const { options, correctIndex } = insertAtRandom(correct, distractors)
    return { question, options, correctIndex }
  }
  ```

**NFR compliance**: NFR-03 (synchronous only — no async/await/Promises); NFR-01 (exported for testability, PBT-10)

---

## Step 4: Modify `components/learning-zone.tsx` — Component Body

- [x] Destructure `language` from `useLanguage()`
- [x] Add 3 `useMemo` blocks (additionQuestions, subtractionQuestions, timesTableQuestions)
- [x] Add `addition`, `subtraction`, `timesTable` entries to `quizData`
- [x] Add `grade2Categories` array
- [x] Update `tabs` array to add Grade 2 tab
- [x] Update `allCategories` to include `grade2Categories`

**NFR compliance**: NFR-02 (same `useMemo` pattern as existing); NFR-04 (`data-testid` auto-applied via `tab-${tab.id}` and `quiz-${category.id}` in render loop); NFR-03 (all synchronous)

---

## Step 5: Modify `package.json` — Dev Dependencies and Test Scripts

- [x] Add 4 new dev dependencies
- [x] Add 3 test scripts to the `scripts` section

**NFR compliance**: NFR-01 (PBT-09 — all 4 packages documented in tech-stack-decisions.md)

---

## Step 6: Create `vitest.config.ts`

- [x] Create file at workspace root `vitest.config.ts`:
  ```typescript
  import { defineConfig } from "vitest/config"
  import react from "@vitejs/plugin-react"
  import path from "path"

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: [],
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov"],
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  })
  ```

**NFR compliance**: NFR-01 (PBT-09 — exact config from tech-stack-decisions.md); `@` alias matches tsconfig.json paths

---

## Step 7: Create `__tests__/learning-zone.pbt.test.ts` — PBT Tests

- [x] Create directory `__tests__/` at workspace root
- [x] Create `__tests__/learning-zone.pbt.test.ts` with `fc.assert` + `{ verbose: true, numRuns: 100 }` for all 5 generators:
  - `generateAdditionQuestion`: 4 properties (ADD-P1 correct=a+b, ADD-P2 options.length=3, ADD-P3 options includes correct, ADD-P4 all distinct)
  - `generateSubtractionQuestion`: 4 properties (SUB-P1 correct=|a-b|, SUB-P2 correct≥0, SUB-P4 options.length=3, SUB-P5 options includes correct)
  - `generateTimesTableQuestion`: 5 properties (TT-P1 correct=multiplier×multiplicand, TT-P2 correct≥2, TT-P3 correct≤90, TT-P4 options.length=3, TT-P5 options includes correct)
  - `generateDistractors (arithmetic)`: 3 properties (DR-P1 length=2, DR-P2 no match correct, DR-P3 distractors distinct)
  - `insertAtRandom`: 4 properties (AP-P1 options.length=3, AP-P2 options[correctIndex]=correct, AP-P3 contains both distractors, AP-P4 correctIndex∈{0,1,2})

**NFR compliance**: NFR-01 (PBT-07 domain-scoped generators, PBT-08 verbose+seed logging)

---

## Step 8: Create `__tests__/learning-zone.test.ts` — Example-Based Tests

- [x] Create `__tests__/learning-zone.test.ts` with 12 deterministic boundary tests:
  - Addition: min operands (1+1=2), max operands (100+100=200)
  - Subtraction: equal operands (result=0), max difference (100-1=99)
  - TimesTable: min product (2×1=2), max product (9×10=90)
  - TimesTable format: symbol question contains "×"
  - TimesTable word vi: question contains "nhân" and "bằng mấy"
  - TimesTable word en: question contains "times" and "equals"
  - Distractors: none equal correct
  - insertAtRandom: 3 options always, correct at correctIndex

**NFR compliance**: NFR-01 (PBT-10 — complementary example-based tests required)

---

## Step 9: Create `aidlc-docs/construction/grade2mathfeature/code/grade2mathfeature-code-summary.md`

- [x] Create code summary markdown listing all modified and created files with brief descriptions

---

## Functional Requirements Traceability

| FR | Implemented In |
|---|---|
| FR-01 (Grade 2 tab) | Step 4 — `tabs` array + `TabType` |
| FR-02 (3 categories) | Step 4 — `grade2Categories` array |
| FR-03 (Addition rules) | Step 3 — `generateAdditionQuestion` |
| FR-04 (Subtraction rules) | Step 3 — `generateSubtractionQuestion` |
| FR-05 (Times table rules) | Step 3 — `generateTimesTableQuestion` |
| FR-06 (Mixed distractor strategy) | Step 3 — `generateDistractors` (random offset/adjacent) |
| FR-07 (10 coins reward) | No change — `onQuizComplete` in dashboard already calls `addCoins(10)` |
| FR-08 (Fireworks) | No change — dashboard `handleQuizComplete` triggers fireworks |
| FR-09 (Bilingual) | Step 1 (translations) + Step 3 (language param in timesTable generator) |
| FR-10 (Pure functions) | Step 3 — all generators are pure, synchronous, exported |
| FR-11 (UI matches Grade 1) | Step 4 — same `renderCategoryCard` pattern reused |
| FR-12 (Multiple-choice only) | No change — QuizModal only renders option buttons; no free-text input |
| FR-13 (No retry) | No change — QuizModal `disabled={selectedAnswer !== null}` already prevents retry |
