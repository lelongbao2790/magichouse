# NFR Design Patterns — Grade2MathFeature

## Scope

All NFR categories except Property-Based Testing are N/A or extension-disabled for this unit.
This document covers PBT design patterns only.

| NFR Category | Design Scope |
|---|---|
| Resilience | SKIP — extension disabled |
| Scalability | N/A — client-side browser app |
| Performance | N/A — O(1) synchronous generators |
| Security | SKIP — extension disabled |
| **Property-Based Testing** | **ACTIVE — full design below** |

---

## PBT-07: Domain-Scoped Generator Design

Each generator function in `learning-zone.tsx` has a corresponding `fc.Arbitrary` definition
that constrains inputs to the exact business rule ranges from `business-rules.md`.

### Generator: `generateAdditionQuestion()`

**Business rule constraints**: AR-01 (operands [1,100]), AR-03 (result may exceed 100)

```typescript
// Arbitrary for addition question inputs
const additionArb = fc.tuple(
  fc.integer({ min: 1, max: 100 }),  // operand a — AR-01
  fc.integer({ min: 1, max: 100 })   // operand b — AR-01
)
```

**Properties to assert (from business-logic-model.md)**:
| Property ID | Assertion |
|---|---|
| ADD-P1 | `correct === a + b` always |
| ADD-P2 | `options.length === 3` always |
| ADD-P3 | `options.includes(correct)` always |
| ADD-P4 | `new Set(options).size === 3` (all options distinct) |
| ADD-P5 | Commutativity: `generateAdditionQuestion()` result with (a,b) semantically equivalent to (b,a) — both produce `a+b` as correct |

---

### Generator: `generateSubtractionQuestion()`

**Business rule constraints**: SR-01 (operands [1,100]), SR-02 (result ≥ 0, larger minus smaller)

```typescript
// Arbitrary for subtraction question inputs
const subtractionArb = fc.tuple(
  fc.integer({ min: 1, max: 100 }),  // operand a — SR-01
  fc.integer({ min: 1, max: 100 })   // operand b — SR-01
)
// Note: function internally computes max(a,b) - min(a,b) — SR-02
```

**Properties to assert**:
| Property ID | Assertion |
|---|---|
| SUB-P1 | `correct === Math.abs(a - b)` always |
| SUB-P2 | `correct >= 0` always — SR-02 |
| SUB-P3 | `correct <= 99` always (max diff = 100-1 = 99) |
| SUB-P4 | `options.length === 3` always |
| SUB-P5 | `options.includes(correct)` always |
| SUB-P6 | Oracle: `subtrahend + correct === minuend` (inverse addition) |

---

### Generator: `generateTimesTableQuestion(language)`

**Business rule constraints**: TT-01 (multiplier [2,9]), TT-02 (multiplicand [1,10]), TT-03 (format random)

```typescript
// Arbitrary for times table question inputs
const timesTableArb = fc.record({
  multiplier:   fc.integer({ min: 2, max: 9 }),                        // TT-01
  multiplicand: fc.integer({ min: 1, max: 10 }),                       // TT-02
  format:       fc.constantFrom("symbol" as const, "word" as const),   // TT-03
  language:     fc.constantFrom("vi" as const, "en" as const)          // bilingual — FR-09
})
```

**Properties to assert**:
| Property ID | Assertion |
|---|---|
| TT-P1 | `correct === multiplier * multiplicand` always |
| TT-P2 | `correct >= 2` always (2×1 = 2) |
| TT-P3 | `correct <= 90` always (9×10 = 90) |
| TT-P4 | `options.length === 3` always |
| TT-P5 | `options.includes(correct)` always |
| TT-P6 | `question` string is non-empty for both "symbol" and "word" formats |
| TT-P7 | `question` string for "word" format contains the language-appropriate template |

---

### Generator: `generateDistractors(correct, strategy, context, ...)`

**Business rule constraints**: DR-01–DR-06 (offset ±[1,15], adjacent = neighboring table products)

```typescript
// Arbitrary — arithmetic context (addition/subtraction)
const arithmeticDistractorArb = fc.record({
  correct:  fc.integer({ min: 0, max: 200 }),
  strategy: fc.constantFrom("offset" as const, "adjacent" as const),
  context:  fc.constant("arithmetic" as const),
  delta:    fc.integer({ min: 1, max: 15 })    // DR-01: offset range [1,15]
})

// Arbitrary — multiply context (times table)
const multiplyDistractorArb = fc.record({
  correct:      fc.integer({ min: 2, max: 90 }),
  strategy:     fc.constantFrom("offset" as const, "adjacent" as const),
  context:      fc.constant("multiply" as const),
  multiplier:   fc.integer({ min: 2, max: 9 }),   // TT-01
  multiplicand: fc.integer({ min: 1, max: 10 })   // TT-02
})
```

**Properties to assert**:
| Property ID | Assertion |
|---|---|
| DR-P1 | `distractors.length === 2` always — DR-05 |
| DR-P2 | `distractors.every(d => d !== correct)` always — DR-04 |
| DR-P3 | `distractors[0] !== distractors[1]` always — DR-05 |
| DR-P4 | All distractor values `>= 0` always (no negative answer choices) |

---

### Generator: `insertAtRandom(correct, distractors)`

**Business rule constraints**: AP-01 (uniform random position), AP-02 (correctIndex = actual inserted position)

```typescript
// Arbitrary for insertAtRandom inputs
const insertArb = fc.record({
  correct: fc.integer({ min: 0, max: 200 }),
  d1:      fc.integer({ min: 0, max: 200 }),
  d2:      fc.integer({ min: 0, max: 200 })
})
```

**Properties to assert**:
| Property ID | Assertion |
|---|---|
| AP-P1 | `options.length === 3` always |
| AP-P2 | `options[correctIndex] === correct` always — AP-02 |
| AP-P3 | `options.includes(d1) && options.includes(d2)` always |
| AP-P4 | `correctIndex >= 0 && correctIndex <= 2` always |
| AP-P5 | Distribution: over N runs, all three positions (0,1,2) appear — AP-01 (probabilistic, checked with large N) |

---

## PBT-08: Shrinking and Reproducibility Design

### fc.assert() Configuration

All property assertions use this pattern:

```typescript
fc.assert(
  fc.property(someArb, (inputs) => {
    // ... property logic ...
  }),
  { verbose: true, numRuns: 100 }
)
```

| Option | Value | Reason |
|---|---|---|
| `verbose: true` | Always set | On failure, fast-check prints the exact seed and shrunk minimal counter-example to test output — satisfies PBT-08 seed logging |
| `numRuns: 100` | Explicit default | 100 runs per property; sufficient for domain-scoped generators with small input spaces |
| `seed` | Not fixed | Random seed per CI run maximises coverage over time; failing seed captured from verbose output for reproduction |

### Seed Reproduction Workflow

When a PBT test fails in CI:
1. fast-check prints: `Failed after N tests with seed XXXXXXXX`
2. Developer reproduces locally by passing the seed: `fc.assert(prop, { seed: XXXXXXXX, verbose: true })`
3. fast-check automatically shrinks to the minimal failing input

### CI Integration

```json
// package.json scripts (from tech-stack-decisions.md)
"test":          "vitest run",
"test:watch":    "vitest",
"test:coverage": "vitest run --coverage"
```

Vitest's default reporter captures all test output including fast-check's verbose failure messages.
The seed appears in the CI log and is preserved for debugging.

---

## PBT-10: Complementary Testing Strategy

### File Structure

```
__tests__/
├── learning-zone.pbt.test.ts    — Property-based tests (fast-check)
└── learning-zone.test.ts        — Example-based tests (Vitest expect)
```

**Rationale for separation**:
- PBT tests run 100+ inputs per property; example tests run in microseconds. Separation makes
  the distinction explicit and allows running them independently during development.
- `vitest run __tests__/learning-zone.test.ts` for fast feedback; full PBT suite in CI.

### Example-Based Test Coverage (learning-zone.test.ts)

Example-based tests must cover boundary values and documented edge cases that complement PBT:

| Test Case | Function | Purpose |
|---|---|---|
| `a = 1, b = 1` | `generateAdditionQuestion` | Minimum operands boundary |
| `a = 100, b = 100` | `generateAdditionQuestion` | Maximum operands boundary (sum = 200) |
| `a = b` | `generateSubtractionQuestion` | Edge case: result = 0 |
| `a = 100, b = 1` | `generateSubtractionQuestion` | Maximum difference = 99 |
| `multiplier = 2, multiplicand = 1` | `generateTimesTableQuestion` | Smallest product = 2 |
| `multiplier = 9, multiplicand = 10` | `generateTimesTableQuestion` | Largest product = 90 |
| `format = "symbol"` | `generateTimesTableQuestion` | Verifies `×` symbol appears in question string |
| `format = "word", language = "vi"` | `generateTimesTableQuestion` | Verifies Vietnamese template used |
| `format = "word", language = "en"` | `generateTimesTableQuestion` | Verifies English template used |
| `correct` at index 0 | `insertAtRandom` | Verifies position 0 possible |
| `correct` at index 2 | `insertAtRandom` | Verifies position 2 possible |
| Distractors ≠ correct | `generateDistractors` | Verifies DR-04 rule in isolation |

### PBT-10 Compliance Verification

| Criterion | Status |
|---|---|
| PBT tests exist for all 5 generator functions | Design mandated — to be implemented at Code Generation |
| Example-based tests exist alongside each PBT suite | Design mandated — to be implemented at Code Generation |
| Example-based tests cover boundary values | 12 example cases specified above |
| No property assertion disabled (shrinking active) | Enforced — `verbose: true` always set, shrinking never disabled |

---

## PBT Rule Compliance Summary

| Rule | Status | Notes |
|---|---|---|
| PBT-01 — Property identification | ✅ COMPLIANT | Properties documented in business-logic-model.md and this file |
| PBT-02 — N/A (greenfield rule) | N/A | — |
| PBT-03 — N/A | N/A | — |
| PBT-04 — N/A | N/A | — |
| PBT-05 — N/A | N/A | — |
| PBT-06 — N/A | N/A | — |
| PBT-07 — Generator quality | ✅ COMPLIANT | All 5 generators have domain-scoped Arbitraries with business-rule-constrained ranges |
| PBT-08 — Shrinking + reproducibility | ✅ COMPLIANT | `{ verbose: true, numRuns: 100 }` on all assertions; seed captured from verbose output |
| PBT-09 — Framework selection | ✅ COMPLIANT | fast-check v3.x + Vitest — documented in tech-stack-decisions.md |
| PBT-10 — Complementary testing | ✅ COMPLIANT | Two-file strategy; 12 example-based test cases specified |
