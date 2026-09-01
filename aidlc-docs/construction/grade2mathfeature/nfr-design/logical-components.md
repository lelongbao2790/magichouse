# Logical Components — Grade2MathFeature

## Infrastructure Components

**None.** Grade2MathFeature is a purely client-side browser feature. It introduces no:
- Network services or API endpoints
- Queues or event buses
- Caches or databases
- Circuit breakers or retry mechanisms
- Deployment changes (Vercel CDN handles the existing app)

All NFR design is limited to the test infrastructure logical components below.

---

## Test Suite Logical Structure

### File Layout

```
D:\WebPractice_Data\magichouse-main\     (workspace root)
├── __tests__/
│   ├── learning-zone.pbt.test.ts        — PBT tests (fast-check)
│   └── learning-zone.test.ts            — Example-based tests (Vitest)
└── vitest.config.ts                     — Vitest configuration (to be created)
```

**Note**: `__tests__/` is at the workspace root following Next.js + Vitest convention.
The `vitest.config.ts` resolves the `@/` alias to match `tsconfig.json` path mappings.

---

### Logical Component: PBT Test File (`learning-zone.pbt.test.ts`)

| Attribute | Detail |
|---|---|
| **Purpose** | Property-based tests for all 5 generator functions using fast-check |
| **File** | `__tests__/learning-zone.pbt.test.ts` |
| **Depends on** | `fast-check`, `vitest`, generator functions from `components/learning-zone.tsx` |
| **Runs** | `vitest run` (CI) or `vitest` (watch mode) |

**Internal structure**:

```
learning-zone.pbt.test.ts
├── describe("generateAdditionQuestion")
│   ├── Arbitrary: additionArb — fc.tuple(fc.integer(1,100), fc.integer(1,100))
│   ├── Property: ADD-P1 — correct === a + b
│   ├── Property: ADD-P2 — options.length === 3
│   ├── Property: ADD-P3 — options includes correct
│   └── Property: ADD-P4 — all options distinct
│
├── describe("generateSubtractionQuestion")
│   ├── Arbitrary: subtractionArb — fc.tuple(fc.integer(1,100), fc.integer(1,100))
│   ├── Property: SUB-P1 — correct === |a - b|
│   ├── Property: SUB-P2 — correct >= 0
│   └── Property: SUB-P6 — oracle: subtrahend + correct === minuend
│
├── describe("generateTimesTableQuestion")
│   ├── Arbitrary: timesTableArb — fc.record({ multiplier(2-9), multiplicand(1-10), format, language })
│   ├── Property: TT-P1 — correct === multiplier * multiplicand
│   ├── Property: TT-P2/P3 — correct in [2, 90]
│   ├── Property: TT-P4/P5 — options.length === 3, includes correct
│   └── Property: TT-P6 — question string non-empty for all format/language combos
│
├── describe("generateDistractors — arithmetic context")
│   ├── Arbitrary: arithmeticDistractorArb
│   ├── Property: DR-P1 — distractors.length === 2
│   ├── Property: DR-P2 — no distractor === correct
│   └── Property: DR-P3 — both distractors distinct
│
├── describe("generateDistractors — multiply context")
│   ├── Arbitrary: multiplyDistractorArb
│   └── (same DR-P1 through DR-P4 properties)
│
└── describe("insertAtRandom")
    ├── Arbitrary: insertArb — fc.record({ correct, d1, d2 })
    ├── Property: AP-P1 — options.length === 3
    ├── Property: AP-P2 — options[correctIndex] === correct
    ├── Property: AP-P3 — options includes d1 and d2
    └── Property: AP-P4 — correctIndex in {0, 1, 2}
```

**fc.assert() template applied to all properties**:
```typescript
fc.assert(
  fc.property(arb, (inputs) => { /* assertion */ }),
  { verbose: true, numRuns: 100 }
)
```

---

### Logical Component: Example-Based Test File (`learning-zone.test.ts`)

| Attribute | Detail |
|---|---|
| **Purpose** | Boundary and edge-case tests complementing PBT (PBT-10) |
| **File** | `__tests__/learning-zone.test.ts` |
| **Depends on** | `vitest`, generator functions from `components/learning-zone.tsx` |
| **Runs** | Same `vitest run` invocation as PBT file |

**Internal structure**:

```
learning-zone.test.ts
├── describe("generateAdditionQuestion — boundaries")
│   ├── test: a=1, b=1 → correct=2
│   └── test: a=100, b=100 → correct=200
│
├── describe("generateSubtractionQuestion — boundaries")
│   ├── test: equal operands → correct=0
│   └── test: a=100, b=1 → correct=99
│
├── describe("generateTimesTableQuestion — boundaries")
│   ├── test: multiplier=2, multiplicand=1 → correct=2
│   ├── test: multiplier=9, multiplicand=10 → correct=90
│   ├── test: format="symbol" → question contains "×"
│   ├── test: format="word", language="vi" → question matches Vietnamese template
│   └── test: format="word", language="en" → question matches English template
│
├── describe("generateDistractors — contract")
│   └── test: distractors never equal correct (spot-check with known inputs)
│
└── describe("insertAtRandom — position coverage")
    ├── test: correct placed at index 0 (verifies position 0 is reachable)
    └── test: correct placed at index 2 (verifies position 2 is reachable)
```

---

### Logical Component: Vitest Configuration (`vitest.config.ts`)

| Attribute | Detail |
|---|---|
| **Purpose** | Configures Vitest test runner for Next.js 16 + TypeScript |
| **File** | `vitest.config.ts` at workspace root |
| **Depends on** | `vitest`, `@vitejs/plugin-react`, `@vitest/coverage-v8` |

**Configuration** (from tech-stack-decisions.md):

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

**Key decisions**:
- `environment: "jsdom"` — required for any React component imports; generator functions are pure but co-located in a React component file
- `globals: true` — enables `describe`, `test`, `expect` without explicit import
- `@` alias — mirrors `tsconfig.json` `paths` config so all `@/` imports resolve in tests

---

## Component Dependency Map

```
vitest.config.ts
    └── configures → Vitest runner

__tests__/learning-zone.pbt.test.ts
    ├── imports → fast-check (fc)
    ├── imports → vitest (describe, test, expect)
    └── imports → @/components/learning-zone (generator functions)

__tests__/learning-zone.test.ts
    ├── imports → vitest (describe, test, expect)
    └── imports → @/components/learning-zone (generator functions)

components/learning-zone.tsx  [unit under test]
    ├── exports → generateAdditionQuestion()
    ├── exports → generateSubtractionQuestion()
    ├── exports → generateTimesTableQuestion(language)
    ├── exports → generateDistractors(...)
    └── exports → insertAtRandom(...)
```

**Note**: Generator functions must be exported from `learning-zone.tsx` for test files to import them.
If they are currently defined as local-scope functions, they must be promoted to named exports at
Code Generation — this is a non-breaking change (the component's internal `useMemo` calls
continue to use them as before).
